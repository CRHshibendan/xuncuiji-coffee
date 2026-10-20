/* Phone camera controls; camera changes never reposition tools. */
(function(){
 'use strict';
 const phone=matchMedia('(max-width:760px)'),$=s=>document.querySelector(s);
 const scene=$('#scene');
 if(scene){
  const controls=document.createElement('div');controls.className='mobile-scene-controls';controls.setAttribute('aria-label','放大冲煮台');
  controls.innerHTML='<div role="group" aria-label="选择台面视图"><button type="button" data-phone-camera="overview" aria-pressed="true">全景</button><button type="button" data-phone-camera="grind" aria-pressed="false">放大研磨</button><button type="button" data-phone-camera="brew" aria-pressed="false">放大冲煮</button></div><p>可拖动，也可先点器具，再点目标放置</p>';
  $('#scene-wrap').before(controls);
  for(const b of controls.querySelectorAll('button'))b.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('coffee-camera',{detail:{view:b.dataset.phoneCamera}})));
  document.addEventListener('coffee-camera-change',e=>{for(const b of controls.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.phoneCamera===e.detail.view));});
  function resizeCamera(){document.dispatchEvent(new CustomEvent('coffee-camera',{detail:{view:'auto'}}));}
  phone.addEventListener('change',resizeCamera);resizeCamera();
 }
 function keyboard(){const viewport=window.visualViewport,editing=document.activeElement?.matches('input:not([type=range]),textarea');document.body.classList.toggle('mobile-keyboard',!!(phone.matches&&editing&&viewport&&innerHeight-viewport.height>140));}
 window.visualViewport?.addEventListener('resize',keyboard);document.addEventListener('focusin',keyboard);document.addEventListener('focusout',()=>requestAnimationFrame(keyboard));
})();
