/* The quiet homepage owns its controls; it has no scroll listener or scroll lock. */
(function(){
 'use strict';
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 // Preserve older links from saved notes and existing workshop navigation.
 const oldHash={ '#journal':'journal.html','#practice':'explore.html','#more-methods':'explore.html'};
 if((location.pathname.endsWith('/')||location.pathname.endsWith('index.html'))&&oldHash[location.hash]){location.replace(oldHash[location.hash]);return;}
 const menu=$('.menu-toggle'),nav=$('#site-navigation');
 function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}
 menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
 nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
 document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 function enter(el){el.classList.remove('selection-enter');if(!reduce.matches){void el.offsetWidth;el.classList.add('selection-enter');}}
 $$('[data-brewer-select]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.brewerSelect;if(button.getAttribute('aria-pressed')==='true')return;
  $$('[data-brewer-select]').forEach(b=>{const active=b===button;b.setAttribute('aria-pressed',String(active));b.querySelector('.selector-mark').textContent=active?'−':'+';});
  for(const [selector,field] of [['[data-brewer-art]','brewerArt'],['[data-brewer-copy]','brewerCopy']]){
   $$(selector).forEach(el=>{el.hidden=el.dataset[field]!==key;if(!el.hidden)enter(el);});
  }
 }));
 let grind='medium';
 function updateLab(){
  const dose=Number($('#dose').value),ratio=Number($('#ratio').value),temp=Number($('#temp').value),water=Math.round(dose*ratio);
  $('#ratio-out').value='1 : '+ratio.toFixed(1);$('#dose-out').value=dose+' g';$('#temp-out').value=temp+' °C';$('#recipe-dose').textContent=dose;$('#lab-water').textContent=water;
  $('.flavor-meter').style.setProperty('--flavor-fill',((ratio-13)/6*100).toFixed(2)+'%');
  $('#flavor-title').textContent=ratio<15?'浓一点，也可以很迷人。':ratio>17.5?'清爽一点，让风味舒展开。':'平衡，是一个不错的开始。';
  $('#flavor-desc').textContent=ratio<15?'用水较少，通常会更浓郁。若觉得厚重，下一杯试着稍加一点水。':ratio>17.5?'用水较多，通常会更轻盈。若觉得寡淡，下一杯试着稍减一点水。':'这个比例适合作为起点。先尝一尝，再根据喜好调整。';
  $('#lab-tip').textContent=temp>=97&&grind==='fine'?'高水温与细研磨可能增加萃取。若喝起来干涩，试着只调粗研磨。':temp<=89&&grind==='coarse'?'低水温与粗研磨可能萃取不足。若尖酸空薄，试着只提高水温。':'风味仍取决于豆子、水质与实际冲煮。每次只改一个变量。';
  $('#save-recipe').href=`journal.html?dose=${dose}&water=${water}&temp=${temp}#new-note`;
 }
 if($('#lab')){
  $$('#lab input[type=range]').forEach(input=>input.addEventListener('input',updateLab));
  $$('[data-grind]').forEach(button=>button.addEventListener('click',()=>{grind=button.dataset.grind;$$('[data-grind]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));updateLab();}));
  $('#reset-lab').addEventListener('click',()=>{$('#dose').value=15;$('#ratio').value=15;$('#temp').value=92;grind='medium';$$('[data-grind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.grind==='medium')));updateLab();});updateLab();
 }
 // Match the design token; retain regular navigation for modifiers and external URLs.
 const native=typeof CSSViewTransitionRule!=='undefined',html=document.documentElement;
 if(!native)html.classList.add('home-motion-fallback');
 let timer=null;
 document.addEventListener('click',e=>{
  if(native||reduce.matches||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target.closest('a[href]');if(!a||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return;
  const url=new URL(a.href,location.href);if(url.origin!==location.origin||!/^https?:$/.test(url.protocol)||url.pathname===location.pathname&&url.search===location.search)return;
  e.preventDefault();if(timer!==null)return;
  const duration=parseFloat(getComputedStyle(html).getPropertyValue('--motion-duration'))||250;
  timer=setTimeout(()=>location.assign(url.href),duration);html.classList.add('home-page-leaving');
 });
 addEventListener('pageshow',()=>{clearTimeout(timer);timer=null;html.classList.remove('home-page-leaving');});
})();
