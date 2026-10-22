/* Six structural strokes share one clock; roast colors arrive after the ink. */
(()=>{
 const figure=document.querySelector('#bean-figure');if(!figure)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const strokes=[...figure.querySelectorAll('ellipse:not([class]),.bean-seam')];
 const fills=[...figure.querySelectorAll('.bean-tone,.bean-depth')];
 const highlights=[...figure.querySelectorAll('.bean-seam-light')];
 let animations=[],visible=false,played=false,pending=true,version=0;
 for(const stroke of strokes)stroke.setAttribute('pathLength','1');
 function finish(){version++;for(const animation of animations)animation.cancel();animations=[];figure.dataset.beanMotion='complete';}
 function play(){
  finish();pending=false;played=true;
  if(reduced.matches||document.hidden)return;
  const run=version;figure.dataset.beanMotion='drawing';
  const ink={duration:1800,easing:'cubic-bezier(.85,0,.15,1)',fill:'both'};
  const color={duration:700,delay:1800,easing:'cubic-bezier(.45,0,.55,1)',fill:'both'};
  try{
   for(const stroke of strokes)animations.push(stroke.animate([{strokeDasharray:'1 1',strokeDashoffset:1},{strokeDasharray:'1 1',strokeDashoffset:0}],ink));
   for(const fill of fills)animations.push(fill.animate([{fillOpacity:0},{fillOpacity:1}],color));
   for(const seam of highlights)animations.push(seam.animate([{strokeOpacity:0},{strokeOpacity:1}],color));
   const primary=getComputedStyle(figure).getPropertyValue('--color-primary').trim();
   for(const seam of figure.querySelectorAll('.bean-seam'))animations.push(seam.animate([{stroke:primary},{stroke:getComputedStyle(seam).stroke}],color));
   Promise.all(animations.map(animation=>animation.finished)).then(()=>{if(run===version)finish();}).catch(()=>{});
  }catch{finish();}
 }
 const observer=new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting;
  if(visible&&(!played||pending))play();
  else if(!visible)finish();
 },{threshold:.2});observer.observe(figure.querySelector('svg'));
 // Existing classroom listeners still own roast selection, copy and palette.
 for(const button of document.querySelectorAll('#beans button[data-roast]'))button.addEventListener('click',()=>{pending=true;if(visible)play();});
 reduced.addEventListener('change',()=>{if(reduced.matches)finish();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
 addEventListener('pagehide',event=>{finish();if(!event.persisted)observer.disconnect();});
})();
