/* Shared phone navigation and camera controls; camera changes never reposition tools. */
(function(){
 'use strict';
 const phone=matchMedia('(max-width:760px)'),$=s=>document.querySelector(s);
 const page=location.pathname.split('/').pop()||'index.html';
 const paths={home:'M3 10 12 3l9 7M5 9v12h14V9M9 21v-7h6v7',learn:'M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Zm0 0v16',workshop:'M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z',shop:'M3 9h18l-2-5H5Zm1 0v12h16V9M9 21v-7h6v7',journal:'M5 3h14v18H5ZM9 7h6M9 11h6M9 15h4'};
 const links=[['home','首页','index.html'],['learn','课堂','learn.html'],['workshop','工坊','workshop.html?tool=melitta&mode=basic'],['shop','店长','shop.html'],['journal','手记','index.html#journal']];
 const nav=document.createElement('nav');nav.className='mobile-nav';nav.setAttribute('aria-label','手机主导航');
 nav.innerHTML=links.map(([id,label,url])=>`<a href="${url}" data-mobile-page="${id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[id]}"/></svg><span>${label}</span></a>`).join('');document.body.append(nav);
 function activeLink(){const active=page==='index.html'?(location.hash==='#journal'?'journal':'home'):page.replace('.html','');for(const a of nav.querySelectorAll('a')){if(a.dataset.mobilePage===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}}
 activeLink();window.addEventListener('hashchange',activeLink);
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
