/* Fullscreen is optional. The same brewing scene keeps its state in either layout. */
(function(root){
 'use strict';
 function createSession({document:doc,element,orientation,onChange=()=>{}}){
  let active=false,ownsFullscreen=false,ownsOrientation=false,version=0;
  const full=()=>doc.fullscreenElement||doc.webkitFullscreenElement;
  const notify=()=>onChange({active,native:ownsFullscreen,locked:ownsOrientation});
  async function leave(){
   version++;active=false;
   if(ownsOrientation){try{orientation.unlock();}catch{}ownsOrientation=false;}
   const exit=doc.exitFullscreen||doc.webkitExitFullscreen;
   const shouldExit=ownsFullscreen&&full()===element;ownsFullscreen=false;notify();
   if(shouldExit&&exit){try{await exit.call(doc);}catch{}}
  }
  async function enter(){
   const run=++version;active=true;notify();
   const request=element.requestFullscreen||element.webkitRequestFullscreen;
   try{if(request&&full()!==element){await request.call(element);ownsFullscreen=full()===element;}}catch{}
   if(run!==version){if(ownsFullscreen){const exit=doc.exitFullscreen||doc.webkitExitFullscreen;try{await exit?.call(doc);}catch{}ownsFullscreen=false;}return;}
   if(ownsFullscreen&&typeof orientation?.lock==='function'){
    try{await orientation.lock('landscape');if(run===version)ownsOrientation=true;else orientation.unlock();}catch{}
   }
   if(run===version)notify();
  }
  function fullscreenChanged(){if(active&&ownsFullscreen&&full()!==element){ownsFullscreen=false;if(ownsOrientation){try{orientation.unlock();}catch{}ownsOrientation=false;}notify();}}
  return{enter,leave,fullscreenChanged,get active(){return active;}};
 }
 // Use the visible viewport, including browsers whose toolbars resize only VisualViewport.
 function viewportBounds({innerWidth,innerHeight,visualViewport:v}){
  const visible=v&&Math.abs((v.scale||1)-1)<.01;
  return {width:Math.round(visible?v.width:innerWidth),height:Math.round(visible?v.height:innerHeight),left:visible?Math.round(v.offsetLeft||0):0,top:visible?Math.round(v.offsetTop||0):0};
 }
 function cameraBox(box,{expanded=false,view='overview'}={}){
  // Preserve the full crank orbit and collection cup, remove empty table around the grinder.
  return expanded&&view==='grind'?[90,185,225,285]:box;
 }
 // Move the original controls together, preserving listeners, state and reading order.
 function createControlRail(doc,host,nodes){
  const rail=doc.createElement('section');rail.className='workshop-control-rail';rail.setAttribute('aria-label','冲煮读数和操作');rail.hidden=true;host.append(rail);
  const entries=nodes.filter(Boolean).map(node=>{const anchor=doc.createComment('workshop-control-home');node.before(anchor);return{node,anchor};});let active=false;
  return{rail,setActive(next){next=Boolean(next);if(next===active)return;active=next;
   for(const {node,anchor}of entries){if(active)rail.append(node);else anchor.parentNode.insertBefore(node,anchor.nextSibling);}
   rail.hidden=!active;
  }};
 }
 const api={createSession,viewportBounds,cameraBox,createControlRail};root.CoffeeWorkshopDisplay=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(!root.document||!document.querySelector('#scene'))return;
 const $=s=>document.querySelector(s),body=document.body;
 const controlRail=createControlRail(document,$('.studio-center'),[$('.live-dashboard'),$('#brew-controls'),$('#heat-guide'),$('.hands-on-actions')]);
 const mobile=matchMedia('(max-width:760px), (max-width:1100px) and (max-height:600px)');
 const portrait=()=>{const v=viewportBounds(root);return v.height>v.width;};
 const toolbar=document.createElement('div');toolbar.className='workshop-play-toolbar';toolbar.hidden=true;
 toolbar.innerHTML='<button type="button" data-play-exit aria-label="退出展开台面">返回</button><p id="workshop-play-hint" role="status">拿起器具，动手冲一杯。</p><select id="workshop-play-view" aria-label="选择台面视角"><option value="auto">全景</option><option value="grind">研磨</option><option value="brew">冲煮</option></select><button type="button" id="workshop-play-recipe">配方</button><button type="button" id="workshop-play-help">帮助</button>';
 body.append(toolbar);
 const launcher=document.createElement('button');launcher.type='button';launcher.className='workshop-display-toggle';launcher.textContent='横屏展开';
 $('.session-options').append(launcher);
 const prompt=document.createElement('dialog');prompt.id='workshop-display-prompt';prompt.setAttribute('aria-labelledby','workshop-display-title');
 prompt.innerHTML='<svg class="workshop-rotate-icon" viewBox="0 0 80 64" aria-hidden="true"><rect x="26" y="8" width="28" height="48" rx="8"/><path d="M9 29A27 27 0 0 1 42 3M9 29V17M9 29h12M71 35A27 27 0 0 1 38 61M71 35v12M71 35H59"/></svg><h2 id="workshop-display-title">横过来，台面更宽敞。</h2><p id="workshop-display-message">建议横屏游玩。展开后只保留冲煮操作；浏览器支持时会进入全屏。</p><button type="button" id="workshop-display-start">展开冲煮台</button><button type="button" id="workshop-display-dismiss">先竖屏看看</button>';
 body.append(prompt);
 let dismissed=false,gestureToggle=null,active=false,entering=false,nativeFullscreen=false,lastBounds='';
 function closePrompt(){if(prompt.open)prompt.close();}
 function updateOrientation(){
  if(active&&mobile.matches&&portrait()){
   $('#workshop-display-message').textContent='请把手机横过来，冲煮台会自动展开。若屏幕没有转动，请关闭手机的竖屏方向锁定。';
   $('#workshop-display-start').textContent='再次尝试展开台面';$('#workshop-display-dismiss').textContent='返回竖屏浏览';
   if(!prompt.open)prompt.showModal();
  }else if(active||dismissed)closePrompt();
 }
 function refresh(){
  body.classList.toggle('workshop-play',active);toolbar.hidden=!active||body.classList.contains('gesture-mode');
  launcher.textContent=active?'收起台面':'横屏展开';if(gestureToggle)gestureToggle.textContent=active?'收起台面':'展开';
  toolbar.querySelector('[data-play-exit]').setAttribute('aria-label',nativeFullscreen?'退出全屏台面':'退出展开台面');
  const hint=$('#guide-command')?.textContent||$('#instruction-title')?.textContent||'拿起器具，动手冲一杯。';
  $('#workshop-play-hint').textContent=hint;
  $('#workshop-play-recipe').hidden=body.classList.contains('basic-play')||body.classList.contains('gesture-mode');
  if(active&&!body.classList.contains('gesture-mode')){
   const v=viewportBounds(root);
   for(const key of ['width','height','left','top'])body.style.setProperty('--workshop-viewport-'+key,v[key]+'px');
   body.classList.toggle('workshop-compact',v.width>v.height&&v.height<=500);
   controlRail.setActive(body.classList.contains('workshop-compact'));
   const top=Math.ceil(toolbar.getBoundingClientRect().height);
   body.style.setProperty('--workshop-play-top',top+'px');
   const bounds=JSON.stringify(v);
   if(bounds!==lastBounds){lastBounds=bounds;document.dispatchEvent(new CustomEvent('coffee-camera-resize'));}
  }else controlRail.setActive(false);
  updateOrientation();
 }
 const session=createSession({document,element:document.documentElement,orientation:root.screen?.orientation,onChange:state=>{const changed=active!==state.active;active=state.active;nativeFullscreen=state.native;refresh();if(changed)document.dispatchEvent(new CustomEvent('coffee-camera',{detail:{view:'auto'}}));}});
 async function enter(){if(entering)return;dismissed=true;entering=true;$('#workshop-display-start').disabled=true;try{await session.enter();}finally{entering=false;$('#workshop-display-start').disabled=false;}}
 function toggle(){if(active)session.leave();else enter();}
 launcher.addEventListener('click',toggle);
 $('#workshop-display-start').addEventListener('click',enter);
 $('#workshop-display-dismiss').addEventListener('click',()=>{dismissed=true;closePrompt();if(active)session.leave();});
 prompt.addEventListener('cancel',()=>{dismissed=true;if(active)session.leave();});
 toolbar.querySelector('[data-play-exit]').addEventListener('click',()=>session.leave());
 $('#workshop-play-view').addEventListener('change',event=>document.dispatchEvent(new CustomEvent('coffee-camera',{detail:{view:event.target.value}})));
 document.addEventListener('coffee-camera-change',event=>{$('#workshop-play-view').value=event.detail.view==='overview'?'auto':event.detail.view;});
 $('#workshop-play-help').addEventListener('click',()=>$('#help-dialog').showModal());
 $('#workshop-play-recipe').addEventListener('click',()=>document.querySelector('[data-setting="0"]')?.click());
 function attachGesture(){
  const controls=$('.gesture-live-controls');if(!controls||controls.querySelector('.workshop-display-toggle'))return;
  gestureToggle=launcher.cloneNode(false);gestureToggle.textContent=active?'退出全屏':'全屏';gestureToggle.addEventListener('click',toggle);controls.append(gestureToggle);
  refresh();
 }
 document.addEventListener('coffee-gesture-mounted',attachGesture);attachGesture();
 document.addEventListener('fullscreenchange',()=>session.fullscreenChanged());document.addEventListener('webkitfullscreenchange',()=>session.fullscreenChanged());
 addEventListener('resize',refresh,{passive:true});root.visualViewport?.addEventListener('resize',refresh,{passive:true});root.visualViewport?.addEventListener('scroll',refresh,{passive:true});mobile.addEventListener?.('change',refresh);
 addEventListener('pagehide',()=>session.leave());
 const observer=new MutationObserver(refresh);
 observer.observe(body,{attributes:true,attributeFilter:['class']});
 for(const node of [$('#guide-command'),$('#instruction-title')])if(node)observer.observe(node,{subtree:true,childList:true,characterData:true});
 refresh();
 if(mobile.matches&&!dismissed)prompt.showModal();
})(typeof window==='undefined'?globalThis:window);
