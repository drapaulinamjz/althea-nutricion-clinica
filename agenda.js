'use strict';
(() => {
  const zone = 'America/Mexico_City';
  const $ = id => document.getElementById(id);
  function nowInMexico() {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone: zone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
    const p = Object.fromEntries(parts.map(x => [x.type,x.value]));
    return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};
  }
  const initial = nowInMexico();
  const [year,month] = initial.date.split('-').map(Number);
  let cursor = new Date(Date.UTC(year,month-1,1));
  let selectedDate = '';
  const dateFormat = new Intl.DateTimeFormat('es-MX',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'});
  function formattedDate(key) {return dateFormat.format(new Date(key+'T12:00:00Z'));}
  const schedules={
    Atlacomulco:{1:{start:540,end:1020}},
    Metepec:{2:{start:480,end:960},3:{start:480,end:900},5:{start:960,end:1140},6:{start:540,end:840}},
    Calimaya:{4:{start:480,end:780}}
  };
  function schedule(key){
    const day=new Date(key+'T12:00:00Z').getUTCDay();
    return schedules[$('branch').value]?.[day];
  }
  function allowedDay(key) {return Boolean(schedule(key));}
  function duration() {
    const match=$('visitType').value.match(/(60|40|45) min/);
    return match ? Number(match[1]) : null;
  }
  function slots() {
    if(!selectedDate || !allowedDay(selectedDate)) return [];
    if(duration()===null) return ['Por acordar por WhatsApp'];
    const {start,end}=schedule(selectedDate);
    const now=nowInMexico(), result=[];
    for(let m=start;m+duration()<=end;m+=30){
      const t=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
      if(selectedDate>now.date||(selectedDate===now.date&&t>now.time)) result.push(t);
    }
    return result;
  }
  function renderTimes(){
    const el=$('time'); el.replaceChildren();
    const placeholder=document.createElement('option'); placeholder.value='';
    const choices=slots();
    placeholder.textContent=selectedDate?(choices.length?'Selecciona una hora':'Sin horarios para esta fecha'):'Selecciona primero una fecha';
    el.append(placeholder);
    choices.forEach(t=>{const option=document.createElement('option');option.value=t;option.textContent=t;el.append(option);});
    el.value='';
  }
  $('visitType').addEventListener('change',renderTimes);
  $('branch').addEventListener('change',()=>{
    selectedDate=''; $('time').value='';
    $('selection').textContent='Selecciona una fecha.';
    $('formError').textContent=''; render(); renderTimes();
  });
  function render() {
    const now = nowInMexico();
    $('monthLabel').textContent = new Intl.DateTimeFormat('es-MX',{timeZone:'UTC',month:'long',year:'numeric'}).format(cursor);
    const grid = $('calendarGrid'); grid.replaceChildren();
    const y=cursor.getUTCFullYear(), m=cursor.getUTCMonth();
    const offset=(cursor.getUTCDay()+6)%7;
    for(let i=0;i<offset;i++) grid.append(document.createElement('span'));
    const count=new Date(Date.UTC(y,m+1,0)).getUTCDate();
    for(let day=1;day<=count;day++) {
      const key=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const b=document.createElement('button'); b.type='button'; b.className='calendar-day'; b.textContent=day;
      b.disabled=key<now.date||!allowedDay(key); b.setAttribute('aria-label',formattedDate(key)); b.setAttribute('aria-pressed',String(key===selectedDate));
      b.classList.toggle('selected',key===selectedDate); b.classList.toggle('today',key===now.date);
      b.addEventListener('click',()=>{selectedDate=key;$('selection').textContent=formattedDate(key);$('formError').textContent='';render();renderTimes();});
      grid.append(b);
    }
    $('previousMonth').disabled=cursor.toISOString().slice(0,7)<=now.date.slice(0,7);
  }
  $('previousMonth').addEventListener('click',()=>{cursor.setUTCMonth(cursor.getUTCMonth()-1);render();});
  $('nextMonth').addEventListener('click',()=>{cursor.setUTCMonth(cursor.getUTCMonth()+1);render();});
  $('phone').addEventListener('input',()=> $('phone').setCustomValidity(''));
  $('fullName').addEventListener('input',()=> $('fullName').setCustomValidity(''));
  $('bookingForm').addEventListener('submit',event=>{
    event.preventDefault(); const error=$('formError'); error.textContent='';
    if(!$('bookingForm').reportValidity()) return;
    const digits=$('phone').value.replace(/\D/g,'');
    if(digits.length<10||digits.length>15){$('phone').setCustomValidity('Escribe un teléfono válido de entre 10 y 15 dígitos.');$('phone').reportValidity();return;}
    if(!$('fullName').value.trim()){$('fullName').setCustomValidity('Escribe tu nombre.');$('fullName').reportValidity();return;}
    if(!selectedDate){error.textContent='Selecciona una fecha en el calendario.';$('nextMonth').focus();return;}
    if(!allowedDay(selectedDate)){error.textContent='Selecciona una fecha de atención para esta sucursal.';return;}
    if(!slots().includes($('time').value)){error.textContent='Selecciona una hora dentro del horario de atención.';renderTimes();return;}
    const now=nowInMexico();
    if(selectedDate<now.date||(selectedDate===now.date&&$('time').value<=now.time)){error.textContent='Elige una fecha y hora futuras (hora del centro de México).';return;}
    const message=[ 'Hola, me gustaría solicitar una cita en Althea.', `Sucursal: ${$('branch').value}`, `Consulta: ${$('visitType').value}`, `Fecha de preferencia: ${formattedDate(selectedDate)}`, `Hora de preferencia: ${$('time').value} (centro de México)`, `Nombre: ${$('fullName').value.trim()}`, `Correo: ${$('email').value.trim()}`, `Teléfono: ${$('phone').value.trim()}`, 'Acepto que Althea use estos datos para gestionar mi solicitud. Quedo pendiente de confirmar disponibilidad.' ].join('\n');
    window.location.assign('https://wa.me/527222643987?text='+encodeURIComponent(message));
  });
  render();
})();
