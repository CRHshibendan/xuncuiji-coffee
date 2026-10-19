/* Finite interaction animations. A newer selection always cancels the old one. */
(function(root){
 'use strict';
 function create(allowed){
  const running=new Map(),versions=new WeakMap(),pending=new Set();
  function cancel(el){const animation=running.get(el);if(animation){animation.cancel();running.delete(el);}}
  function stop(){for(const el of [...running.keys()])cancel(el);for(const image of pending)versions.set(image,(versions.get(image)||0)+1);pending.clear();}
  function play(el,frames,options={}){
   if(!el)return;cancel(el);
   if(!allowed()||typeof el.animate!=='function')return;
   const animation=el.animate(frames,{duration:430,easing:'cubic-bezier(.2,.75,.25,1)',...options});
   running.set(el,animation);
   const done=()=>{if(running.get(el)===animation)running.delete(el);};
   animation.onfinish=done;animation.oncancel=done;
  }
  function reveal(el,delay=0){play(el,[{opacity:0,transform:'translateY(13px)'},{opacity:1,transform:'none'}],{delay,fill:'backwards'});}
  async function brewer(image,copy){
   const version=(versions.get(image)||0)+1;versions.set(image,version);cancel(image);
   [...copy.querySelectorAll('.brewer-subtitle,h3,.brewer-facts > div')].forEach((el,i)=>reveal(el,i*45));
   if(!allowed())return;
   // Decode first, and ignore a late load from an earlier tab selection.
   pending.add(image);try{await image.decode?.();}catch{}
   if(versions.get(image)!==version||!allowed())return;
   pending.delete(image);
   play(image,[
    {opacity:0,transform:'perspective(900px) translateY(18px) rotateY(-16deg) rotateZ(-4deg) scale(.94)'},
    {opacity:1,transform:'perspective(900px) translateY(-3px) rotateY(3deg) rotateZ(1deg) scale(1.015)',offset:.75},
    {opacity:1,transform:'none'}
   ],{duration:650});
  }
  return{play,reveal,brewer,stop};
 }
 const api={create};root.CoffeeLessonMotion=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
