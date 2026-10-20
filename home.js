/* The quiet homepage owns its controls; it has no scroll listener or scroll lock. */
(function(){
 'use strict';
 // Each pen-down segment gets its own normalized clock, including compound SVG paths.
 function splitSubpaths(d){
  const tokens=(d||'').match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[];
  const counts={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7};
  let i=0,command='',x=0,y=0,sx=0,sy=0,part=[],result=[];
  while(i<tokens.length){
   if(/^[A-Za-z]$/.test(tokens[i]))command=tokens[i++];
   const upper=command.toUpperCase(),relative=command!==upper;
   if(upper==='Z'){part.push(command);x=sx;y=sy;command='';continue;}
   const count=counts[upper];if(!count||i+count>tokens.length)break;
   const raw=tokens.slice(i,i+count);if(raw.some(t=>/^[A-Za-z]$/.test(t)))break;
   const values=raw.map(Number);i+=count;
   if(upper==='M'){
    if(part.length)result.push(part.join(' '));
    x=(relative?x:0)+values[0];y=(relative?y:0)+values[1];sx=x;sy=y;part=['M',String(x),String(y)];command=relative?'l':'L';
   }else{
    part.push(command,...raw);
    if(upper==='H')x=(relative?x:0)+values[0];
    else if(upper==='V')y=(relative?y:0)+values[0];
    else{x=(relative?x:0)+values[count-2];y=(relative?y:0)+values[count-1];}
   }
  }
  if(part.length)result.push(part.join(' '));return result;
 }
 if(typeof module==='object'&&module.exports){module.exports={splitSubpaths};if(typeof document==='undefined')return;}
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
 const motionButton=$('#hero-motion-toggle'),motionNote=$('#hero-motion-note'),motionRefresh=[];
 let artMotion=null;
 try{const saved=localStorage.getItem('xuncuiji-art-motion');if(saved==='on'||saved==='off')artMotion=saved==='on';}catch{}
 const artReduced=()=>artMotion===null?reduce.matches:!artMotion;
 function updateMotionControl(){
  const paused=artReduced();document.documentElement.dataset.artMotion=paused?'off':'on';
  if(motionButton){motionButton.hidden=false;motionButton.textContent=paused?'播放器具动画':'暂停器具动画';motionButton.setAttribute('aria-pressed',String(!paused));}
  if(motionNote)motionNote.textContent=paused?(reduce.matches&&artMotion===null?'当前已按系统偏好简化动态，可手动播放。':'器具动画已暂停。'):'';
 }
 function refreshMotion(){updateMotionControl();motionRefresh.forEach(refresh=>refresh());}
 motionButton?.addEventListener('click',()=>{artMotion=artReduced();try{localStorage.setItem('xuncuiji-art-motion',artMotion?'on':'off');}catch{}refreshMotion();});
 if(typeof reduce.addEventListener==='function')reduce.addEventListener('change',()=>{artMotion=null;refreshMotion();});
 else reduce.addListener?.(()=>{artMotion=null;refreshMotion();});
 updateMotionControl();
 const liquidReveals=new WeakMap();let liquidId=0;
 function cancelFills(art){art.querySelectorAll('.hero-fill').forEach(el=>{for(const target of [el,liquidReveals.get(el)].filter(Boolean)){for(const animation of target.getAnimations?.()||[]){try{animation.cancel();}catch{}}target.style.transform='';target.style.willChange='';}el.style.opacity='';});}

 function enter(el){el.classList.remove('selection-enter');if(!reduce.matches){void el.offsetWidth;el.classList.add('selection-enter');}}
 // Clone the same SVG source into both players; no separate animation or geometry.
 $$('template[data-brewer-template]').forEach(template=>{
  for(const [selector,field]of [['[data-hero-rotator]','heroArt'],['.brewer-display','brewerArt']]){
   const mount=$(selector);if(!mount)continue;
   const art=template.content.firstElementChild.cloneNode(true);
   art.dataset[field]=template.dataset.brewerTemplate;mount.appendChild(art);
  }
 });
 const heroArt=$$('[data-hero-art]'),galleryArt=$$('[data-brewer-art]'),heroCaption=$('[data-hero-caption]');
 const heroLabels={chemex:'CHEMEX / 玻璃滤壶',melitta:'MELITTA / 陶瓷滤杯',espresso:'ESPRESSO / 意式浓缩',siphon:'SIPHON / 虹吸壶',moka:'MOKA POT / 摩卡壶',frenchpress:'FRENCH PRESS / 法压壶',coldbrew:'COLD BREW / 浸泡式冷萃'};
 // All independent ink strokes share the contour clock; color follows the completed ink.
 const HERO_DRAW_MS=2200,HERO_RETRACT_MS=1000;
 // Normalized dashes must scale with SVG geometry. Compensate stroke width
 // separately so a larger exhibition still has the same 1.5px ink weight.
 function sizeArtStroke(art){
  const width=art.getBoundingClientRect().width;
  const viewWidth=Number((art.getAttribute('viewBox')||'0 0 400 400').split(/\s+/)[2]);
  art.style.setProperty('--art-scale',String(width>0?width/viewWidth:1));
 }
 function prepareHeroArt(art){
  if(!art)return;
  if(art.dataset.heroPrepared==='1')return;
  art.dataset.heroPrepared='1';
  const shapes=[...art.querySelectorAll('path,ellipse,circle')];
  const main=shapes.filter(el=>el.getAttribute('fill')==='#f6f3ec');
  const caramel=shapes.filter(el=>el.getAttribute('fill')==='#b8794a');
  const details=shapes.filter(el=>!main.includes(el)&&!caramel.includes(el));
  shapes.forEach(el=>{const fill=el.getAttribute('fill');if(fill&&fill!=='none')el.classList.add('hero-fill');});
  main.forEach(el=>el.classList.add('hero-main-static'));
  details.forEach(el=>el.classList.add('hero-detail'));
  caramel.forEach(el=>el.classList.add('hero-caramel'));
  // All visible strokes use the exact same draw/retract animation as the outline.
  // Original fill geometry stays separate, so color cannot appear before the ink finishes.
  shapes.forEach(el=>{
   const role=main.includes(el)?'hero-main-line':caramel.includes(el)?'hero-caramel-line':'hero-detail-line';
   const pieces=el.tagName.toLowerCase()==='path'?splitSubpaths(el.getAttribute('d')):[null];
   for(const piece of pieces){
    const line=el.cloneNode(false);if(piece!==null)line.setAttribute('d',piece);
    line.classList.remove('hero-main-static','hero-fill','hero-detail','hero-caramel');line.removeAttribute('data-liquid');
    line.classList.add('hero-ink-line',role);line.setAttribute('fill','none');line.setAttribute('stroke','currentColor');
    line.setAttribute('stroke-width','1.5');line.setAttribute('pathLength','1');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');
    art.appendChild(line);
   }
  });
  // A translated clipping rectangle reveals the unchanged liquid silhouette from below.
  // Only explicitly marked coffee moves: lids, collars and other wooden accents do not.
  shapes.filter(el=>el.hasAttribute('data-liquid')).forEach(el=>{
   const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs'),clip=document.createElementNS(ns,'clipPath'),rect=document.createElementNS(ns,'rect');
   const id='brewer-liquid-'+(++liquidId);clip.setAttribute('id',id);clip.setAttribute('clipPathUnits','objectBoundingBox');
   for(const [key,value]of Object.entries({x:'-.05',y:'-.05',width:'1.1',height:'1.1',fill:'currentColor',stroke:'none'}))rect.setAttribute(key,value);
   rect.style.transformOrigin='0 0';rect.style.transformBox='view-box';clip.appendChild(rect);defs.appendChild(clip);art.appendChild(defs);
   el.setAttribute('clip-path','url(#'+id+')');el.style.transformOrigin='50% 100%';liquidReveals.set(el,rect);
  });
 }
 function fadeFills(art,to,duration){
  const easing=getComputedStyle(art).getPropertyValue('--hero-ease-both').trim()||'ease-in-out';
  art.querySelectorAll('.hero-fill').forEach(el=>{
   const current=Number.parseFloat(getComputedStyle(el).opacity),transform=getComputedStyle(el).transform;
   const reveal=liquidReveals.get(el);
   if(reveal){const frozen=getComputedStyle(reveal).transform;for(const a of reveal.getAnimations?.()||[])a.cancel();reveal.style.transform=to===1?'':frozen||'';reveal.style.willChange='';el.style.willChange='';}
   for(const animation of el.getAnimations?.()||[]){try{animation.cancel();}catch{}}
   if(reveal&&to===1){
    try{
     if(typeof el.animate!=='function'||typeof reveal.animate!=='function')throw new Error('No Web Animations');
     el.style.transform='';el.style.willChange='transform, opacity';reveal.style.willChange='transform';
     // One small settling movement at the end; no looping or spring oscillation.
     const rise=reveal.animate([{transform:'translateY(1.05px)',offset:0,easing:'cubic-bezier(.22,0,.36,1)'},{transform:'translateY(0px)',offset:.64},{transform:'translateY(0px)',offset:1}],{duration:1100,fill:'both'});
     const settle=el.animate([{opacity:1,transform:'scaleY(1)',offset:0},{opacity:1,transform:'scaleY(1)',offset:.6,easing:'ease-out'},{opacity:1,transform:'scaleY(1.06)',offset:.76,easing:'ease-in-out'},{opacity:1,transform:'scaleY(1)',offset:1}],{duration:1100,fill:'both'});
     rise.onfinish=()=>{reveal.style.willChange='';};settle.onfinish=()=>{el.style.willChange='';};return;
    }catch{reveal.style.transform='';el.style.transform='';reveal.style.willChange='';el.style.willChange='';}
   }
   if(reveal&&to===0)el.style.transform=transform||'';
   try{if(typeof el.animate!=='function')throw new Error('No Web Animations');el.animate([{opacity:to===1?0:Number.isFinite(current)?current:1},{opacity:to}],{duration,easing,fill:'both'});}
   catch{el.style.opacity=String(to);}
  });
 }
 // Both exhibitions share one choreography, with separate clocks and selection state.
 function createLinePlayer(arts,{field,initial=0,autoplay=false,onChange=()=>{}}){
  if(!arts.length)return ()=>{};
  let index=initial,busy=false,runId=0,autoTimer=null,queued=null;
  const AUTO_MS=6500;
  function schedule(){
   if(autoTimer!==null){clearTimeout(autoTimer);autoTimer=null;}
   if(!autoplay||artReduced()||document.hidden)return;
   autoTimer=setTimeout(()=>{autoTimer=null;show(arts[(index+1)%arts.length].dataset[field]);},AUTO_MS);
  }
  function swap(art){
   if(!art)return;
   arts.forEach(a=>{const active=a===art;a.classList.toggle('is-active',active);a.classList.remove('is-line','is-details','is-filled','is-leaving','is-click-exit');cancelFills(a);a.setAttribute('aria-hidden',String(!active));});
   index=arts.indexOf(art);
   onChange(art.dataset[field]);
   schedule();
  }
  function draw(art){
   if(!art)return;
   prepareHeroArt(art);
   cancelFills(art);art.classList.remove('is-line');void art.getBoundingClientRect().width;
   arts.forEach(a=>{const active=a===art;a.classList.toggle('is-active',active);a.classList.toggle('is-line',active&&!artReduced());a.classList.remove('is-details','is-filled','is-leaving','is-click-exit');a.setAttribute('aria-hidden',String(!active));});
   index=arts.indexOf(art);
   onChange(art.dataset[field]);
   const lines=[...art.querySelectorAll('.hero-ink-line')];
   if(!lines.length)return;
   if(artReduced())return;
   runId++;
   const run=runId;
   setTimeout(()=>{if(run!==runId)return;art.classList.add('is-details');},HERO_DRAW_MS);
   setTimeout(()=>{if(run!==runId)return;art.classList.add('is-filled');fadeFills(art,1,600);},HERO_DRAW_MS+80);
   schedule();
  }
  function retract(art,done,manual){
   runId++;
   const run=runId;
   if(autoTimer!==null){clearTimeout(autoTimer);autoTimer=null;}
   const speed=manual ? 0.4 : 1;
   art.classList.toggle('is-click-exit',manual);
   fadeFills(art,0,500*speed);
   setTimeout(()=>{
    if(run!==runId)return;
    art.classList.remove('is-filled');
    art.classList.remove('is-details');
    const ink=art.querySelector('.hero-ink-line');art.style.setProperty('--ink-retract-from',ink?getComputedStyle(ink).strokeDashoffset||'0':'0');
    art.classList.add('is-leaving');
    setTimeout(()=>{if(run!==runId)return;done();},HERO_RETRACT_MS*speed);
   },520*speed);
  }
  function show(slug,manual=false){
   const art=arts.find(a=>a.dataset[field]===slug);
   if(!art)return;
   // Keep the latest click during retraction; consume it before drawing again.
   if(busy){queued=slug;return;}
   if(autoTimer!==null){clearTimeout(autoTimer);autoTimer=null;}
   const current=arts[index];
   if(artReduced()){swap(art);return;}
   busy=true;
   if(!current||!current.classList.contains('is-line')){draw(art);busy=false;return;}
   retract(current,()=>{
    const next=arts.find(a=>a.dataset[field]===queued)||art;
    queued=null;
    draw(next);
    busy=false;
   },manual);
  }
  arts.forEach(art=>{prepareHeroArt(art);sizeArtStroke(art);});
  if(typeof ResizeObserver!=='undefined'){
   const resize=new ResizeObserver(()=>arts.forEach(sizeArtStroke));
   resize.observe(arts[0].parentElement);
  }
  draw(arts[index]);
  motionRefresh.push(()=>{
   runId++;busy=false;queued=null;
   if(autoTimer!==null){clearTimeout(autoTimer);autoTimer=null;}
   if(artReduced())swap(arts[index]);else draw(arts[index]);
  });
  if(autoplay)document.addEventListener('visibilitychange',()=>{if(document.hidden){if(autoTimer!==null){clearTimeout(autoTimer);autoTimer=null;}}else schedule();});
  return show;
 }
 const heroShow=createLinePlayer(heroArt,{field:'heroArt',autoplay:true,onChange:key=>{if(heroCaption)heroCaption.textContent=heroLabels[key];}});
 const galleryShow=createLinePlayer(galleryArt,{field:'brewerArt'});
 $$('[data-brewer-select]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.brewerSelect;
  heroShow(key,true);
  galleryShow(key,true);
  if(button.getAttribute('aria-pressed')==='true')return;
  $$('[data-brewer-select]').forEach(b=>{const active=b===button;b.setAttribute('aria-pressed',String(active));b.querySelector('.selector-mark').textContent=active?'−':'+';});
  $$('[data-brewer-copy]').forEach(el=>{el.hidden=el.dataset.brewerCopy!==key;if(!el.hidden)enter(el);});
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
