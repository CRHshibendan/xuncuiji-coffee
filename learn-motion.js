/* Overlapping copy fades: the new choice commits immediately, without a blank beat. */
(function(root){
 'use strict';
 function createCopyTransition({onState,prepare=()=>null,reduced=()=>false,setTimer=setTimeout,clearTimer=clearTimeout,duration=420,reducedMs=150}){
  let timer=null,version=0;
  function clear(){if(timer!==null)clearTimer(timer);timer=null;version++;}
  function change(write,animate=true){const snapshot=animate&&!reduced()?prepare():null;clear();onState('cancel');write();
   if(!animate){onState('idle');return;}
   const run=version;onState(reduced()?'reduced':'in',snapshot);timer=setTimer(()=>{if(run===version){timer=null;onState('idle');}},reduced()?reducedMs:duration);
  }
  function finish(){clear();onState('idle');}
  return{change,finish};
 }
 const api={createCopyTransition};if(typeof module==='object'&&module.exports)module.exports=api;root.CoffeeLearnMotion=api;
 // The homepage script discovers these same selectors and runs its unchanged player.
 if(root.document){const mount=root.document.querySelector('#lesson-brewer-display');if(mount){const requested=new URLSearchParams(root.location.search).get('tool'),arts=[...mount.querySelectorAll('[data-brewer-art]')],chosen=arts.find(a=>a.dataset.brewerArt===requested)||arts[0];if(chosen){mount.prepend(chosen);for(const art of arts){art.classList.toggle('is-active',art===chosen);art.setAttribute('aria-hidden',String(art!==chosen));}for(const button of root.document.querySelectorAll('[data-brewer-select]')){const active=button.dataset.brewerSelect===chosen.dataset.brewerArt;button.setAttribute('aria-pressed',String(active));button.querySelector('.selector-mark').textContent=active?'−':'+';}}}}
})(typeof window==='undefined'?globalThis:window);
