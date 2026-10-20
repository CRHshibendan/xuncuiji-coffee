/* Small, cancellable text transitions. A rapid new choice always wins. */
(function(root){
 'use strict';
 function createCopyTransition({onState,reduced=()=>false,setTimer=setTimeout,clearTimer=clearTimeout,outMs=100,inMs=320,reducedMs=150}){
  let timers=[],pending=null,version=0;
  function clear(){for(const id of timers)clearTimer(id);timers=[];version++;}
  function change(write,animate=true){clear();pending=write;const run=version;
   if(!animate){pending=null;write();onState('idle');return;}
   if(reduced()){pending=null;write();onState('reduced');timers.push(setTimer(()=>{if(run===version)onState('idle');},reducedMs));return;}
   onState('out');timers.push(setTimer(()=>{if(run!==version)return;pending=null;write();onState('in');timers.push(setTimer(()=>{if(run===version)onState('idle');},inMs));},outMs));
  }
  function finish(){const write=pending;pending=null;clear();if(write)write();onState('idle');}
  return{change,finish};
 }
 const api={createCopyTransition};if(typeof module==='object'&&module.exports)module.exports=api;root.CoffeeLearnMotion=api;
})(typeof window==='undefined'?globalThis:window);
