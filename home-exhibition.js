/* Coalesced scroll rendering. All explanatory content and links work without JS. */
(function(root){
 'use strict';
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 function focusFrame(centres,line,height){
  let index=0,best=Infinity;
  centres.forEach((centre,i)=>{const d=Math.abs(centre-line);if(d<best){best=d;index=i;}});
  const progress=clamp(.5+(line-(centres[index]||0))/Math.max(height,1),0,1);
  return {index,progress,scale:1.03+Math.sin(progress*Math.PI)*.18,turn:-17+progress*34,roll:-7+progress*10,y:18-progress*36};
 }
 function showObject(objects,index){
  // Remove outgoing glass layers before revealing the next object. Opacity alone
  // leaves overlapping transparent artwork during a crossfade in a 3D context.
  objects.forEach(el=>{el.hidden=true;el.classList.remove('is-current');});
  if(objects[index]){objects[index].hidden=false;objects[index].classList.add('is-current');}
 }
 if(typeof module==='object'&&module.exports)module.exports={focusFrame,showObject};
 if(!root.document)return;
 const gallery=document.querySelector('.brewer-gallery');if(!gallery)return;
 const chapters=[...gallery.querySelectorAll('[data-brewer]')],objects=[...gallery.querySelectorAll('[data-object]')],selectors=[...gallery.querySelectorAll('[data-select]')];
 const hero=document.querySelector('.hero'),sculpture=document.querySelector('.hero-sculpture');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),phone=matchMedia('(max-width:760px)');
 let queued=false,current=-1;
 function render(){
  queued=false;
  const height=innerHeight,rect=gallery.getBoundingClientRect();
  if(rect.top<height&&rect.bottom>0){
   const frame=focusFrame(chapters.map(c=>{const r=c.getBoundingClientRect();return r.top+r.height/2;}),height*(phone.matches?.78:.52),height*.8);
   if(current!==frame.index){
    current=frame.index;
    showObject(objects,current);
    chapters.forEach((el,i)=>el.classList.toggle('is-current',i===current));
    selectors.forEach((el,i)=>{if(i===current)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');});
    document.getElementById('gallery-count').textContent=String(current+1).padStart(2,'0')+' / 04';
    document.getElementById('gallery-material').textContent=chapters[current].dataset.material;
   }
   if(!reduce.matches){
    const obj=objects[current];
    obj.style.setProperty('--object-scale',frame.scale.toFixed(3));obj.style.setProperty('--object-turn',frame.turn.toFixed(2)+'deg');obj.style.setProperty('--object-roll',frame.roll.toFixed(2)+'deg');obj.style.setProperty('--object-y',frame.y.toFixed(1)+'px');
   }
  }
  if(!reduce.matches&&hero.getBoundingClientRect().bottom>0){
   const p=clamp(-hero.getBoundingClientRect().top/height,0,1);sculpture.style.setProperty('--hero-y',(-p*50).toFixed(1)+'px');sculpture.style.setProperty('--hero-turn',(-16+p*24).toFixed(1)+'deg');
  }
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(render);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('pageshow',schedule);reduce.addEventListener('change',schedule);schedule();
})(typeof window==='undefined'?globalThis:window);
