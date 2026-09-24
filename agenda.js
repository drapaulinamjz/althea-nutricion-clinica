'use strict';
(()=>{
 const select=document.getElementById('branch');
 const cards=[...document.querySelectorAll('[data-branch]')];
 function render(){cards.forEach(card=>{card.hidden=card.dataset.branch!==select.value;});}
 select.addEventListener('change',render);render();
})();
