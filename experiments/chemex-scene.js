import {primeFormation} from './formation-render.js';
const $=s=>document.querySelector(s),viewport=$('#viewport'),range=$('#formation');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

async function boot(){
 const [T,{RoomEnvironment},{createChemex,phase,ease,FORMATION_DURATION}]=await Promise.all([import('./vendor/three.module.min.js'),import('./vendor/RoomEnvironment.js'),import('./chemex-model.js?v=2')]);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(max-width:700px)').matches?1.5:1.8));
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.localClippingEnabled=true;renderer.shadowMap.enabled=false;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.domElement.setAttribute('aria-hidden','true');viewport.prepend(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color('#f5f2eb');
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.02);scene.environment=environment.texture;scene.environmentIntensity=.55;room.dispose();pmrem.dispose();
 const camera=new T.OrthographicCamera(-3,3,2.45,-2.45,.1,40);camera.position.set(0,1.55,7);camera.lookAt(0,.04,0);
 const model=createChemex();scene.add(model.root);
 scene.add(new T.HemisphereLight(0xfffaed,0xb4b5a6,.8));
 const key=new T.DirectionalLight(0xfff8eb,2.2);key.position.set(-3.5,6,4);key.castShadow=false;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=key.shadow.camera.bottom=-4;key.shadow.camera.right=key.shadow.camera.top=4;key.shadow.bias=-.0008;key.shadow.normalBias=.025;scene.add(key);
 const fill=new T.DirectionalLight(0xe9f2ee,.7);fill.position.set(4,2,-3);scene.add(fill);
 const floorMaterial=new T.ShadowMaterial({opacity:.13}),floor=new T.Mesh(new T.PlaneGeometry(30,30),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-1.642;floor.receiveShadow=true;scene.add(floor);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sx=shadowCanvas.getContext('2d'),gradient=sx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(58,68,40,.25)');gradient.addColorStop(.4,'rgba(58,68,40,.13)');gradient.addColorStop(1,'rgba(58,68,40,0)');sx.fillStyle=gradient;sx.fillRect(0,0,128,128);
 const shadowMap=new T.CanvasTexture(shadowCanvas),contactMat=new T.MeshBasicMaterial({map:shadowMap,transparent:true,opacity:0,depthWrite:false}),contact=new T.Mesh(new T.PlaneGeometry(3.4,2.9),contactMat);contact.rotation.x=-Math.PI/2;contact.position.y=-1.638;scene.add(contact);

 let progress=reduced.matches?1:0,playing=!reduced.matches,last=0,raf=0,disposed=false,drag=null,wantPaper=false,lift=0,yaw=0,targetYaw=0,pitch=0,targetPitch=0,zoom=1.22,phaseIndex=-1,uiProgress=-1;
 const motion={duration:FORMATION_DURATION};
 function schedule(){if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(frame);}
 function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const half=2.4;camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();schedule();}
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);
 function setPlaying(value){playing=value&&progress<1;$('#play-toggle').setAttribute('aria-pressed',String(playing));$('#play-toggle').setAttribute('aria-label',playing?'暂停成器动画':progress===1?'重新播放成器动画':'继续成器动画');$('#play-toggle').textContent=playing?'Ⅱ':'▷';schedule();}
 function updateUI(){
  const n=Math.round(progress*1000);if(n!==uiProgress){uiProgress=n;range.value=String(n);range.style.setProperty('--progress',progress*100+'%');$('#progress-number').textContent=String(Math.round(progress*100)).padStart(2,'0')+' / 100';}
  const p=progress<.25?0:progress<.42?1:progress<.69?2:3;
  if(p!==phaseIndex){phaseIndex=p;const labels=['轮廓正在成形','先为线稿上色','空间慢慢展开','材质与咖啡，慢慢落定'];$('#stage-tag').textContent=labels[p];range.setAttribute('aria-valuetext',['绘制轮廓','平面上色','展开体积','呈现材质，液面缓缓上升'][p]);document.querySelectorAll('[data-phase]').forEach(el=>el.classList.toggle('current',Number(el.dataset.phase)===p));}
  $('#paper-toggle').disabled=progress<.82;
  if(progress<1){$('#note-number').textContent=['01 / 轮廓','02 / 上色','03 / 体积','04 / 材质'][p];$('#note').textContent=['每一笔，都从同一刻开始。','先铺上颜色，仍是一张平面。','慢慢倾斜，让轮廓有了前后。','玻璃渐渐透光，咖啡从壶底升起。'][p];}
  else if(wantPaper){$('#stage-tag').textContent='拆开，看看结构';$('#note-number').textContent='滤纸 / 提起';$('#note').textContent='纸滤贴在上方，咖啡落入下壶。';}
  else{$('#stage-tag').textContent='拖动器具 · 自由观察';$('#note-number').textContent='CHEMEX / 自由观察';$('#note').textContent='拖一拖，或提起滤纸看看。';}
 }
 function frame(now){
  raf=0;if(disposed||document.hidden)return;const dt=last?Math.min(.06,(now-last)/1000):0;last=now;
  if(playing){progress=Math.min(1,progress+dt/motion.duration);if(progress===1)setPlaying(false);}
  const damping=reduced.matches?1:1-Math.exp(-7*dt),nextLift=wantPaper&&progress>=.82?1:0;
  const moving=Math.abs(lift-nextLift)>.0001||Math.abs(yaw-targetYaw)>.0001||Math.abs(pitch-targetPitch)>.0001;
  lift+= (nextLift-lift)*damping;yaw+=(targetYaw-yaw)*damping;pitch+=(targetPitch-pitch)*damping;
  if(Math.abs(lift-nextLift)<.0001)lift=nextLift;if(Math.abs(yaw-targetYaw)<.0001)yaw=targetYaw;if(Math.abs(pitch-targetPitch)<.0001)pitch=targetPitch;
  const p=phase(progress);model.root.rotation.set(pitch+.015*p.depth,-.34*p.depth+yaw,0);model.formation(progress);model.lift(ease(lift));model.root.updateMatrixWorld(true);
  const nextZoom=1.22-.25*lift;zoom+=(nextZoom-zoom)*(reduced.matches?1:Math.max(.08,damping));camera.zoom=zoom;camera.position.y=1.55+lift*.7;camera.lookAt(0,.04+lift*.30,0);camera.updateProjectionMatrix();
  floorMaterial.opacity=.13*p.material;contactMat.opacity=.55*p.material;updateUI();renderer.render(scene,camera);
  if(playing||moving||Math.abs(zoom-nextZoom)>.0001)schedule();
 }
 function resetView(){targetYaw=targetPitch=0;document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.view==='front')));}
 $('#replay').addEventListener('click',()=>{progress=0;wantPaper=false;lift=0;zoom=1.22;$('#paper-toggle').setAttribute('aria-pressed','false');$('#paper-toggle').innerHTML='提起滤纸 <span>↗</span>';resetView();yaw=pitch=0;if(reduced.matches){progress=1;setPlaying(false);}else setPlaying(true);phaseIndex=-1;updateUI();schedule();});
 $('#play-toggle').addEventListener('click',()=>{if(progress===1){$('#replay').click();return;}setPlaying(!playing);});
 range.addEventListener('input',()=>{progress=Number(range.value)/1000;setPlaying(false);phaseIndex=-1;updateUI();schedule();});
 $('#paper-toggle').addEventListener('click',()=>{wantPaper=!wantPaper;$('#paper-toggle').setAttribute('aria-pressed',String(wantPaper));$('#paper-toggle').innerHTML=wantPaper?'放回滤纸 <span>↙</span>':'提起滤纸 <span>↗</span>';schedule();});
 document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{const view=button.dataset.view;targetYaw=view==='side'?Math.PI/2:0;targetPitch=view==='top'?.64:0;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));schedule();}));
 viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();viewport.focus({preventScroll:true});setPlaying(false);drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw,pitch};viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');});
 viewport.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();yaw=targetYaw=drag.yaw+(e.clientX-drag.x)*.008;pitch=targetPitch=Math.max(-.2,Math.min(.85,drag.pitch-(e.clientY-drag.y)*.006));document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));schedule();});
 function release(e){if(!drag||e.pointerId!==drag.id)return;drag=null;viewport.classList.remove('is-dragging');if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);}
 for(const name of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(name,release);
 viewport.addEventListener('keydown',e=>{const d={ArrowLeft:[-.2,0],ArrowRight:[.2,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]}[e.key];if(!d)return;e.preventDefault();targetYaw+=d[0];targetPitch=Math.max(-.2,Math.min(.85,targetPitch+d[1]));schedule();});
 reduced.addEventListener('change',()=>{if(reduced.matches){progress=1;setPlaying(false);}schedule();});
 document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){if(drag)release({pointerId:drag.id});cancelAnimationFrame(raf);raf=0;}else schedule();});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;cancelAnimationFrame(raf);showFallback('画面暂时停住了，刷新可重新打开。');});
 addEventListener('pagehide',e=>{if(e.persisted)return;disposed=true;cancelAnimationFrame(raf);resizeObserver.disconnect();model.dispose();floor.geometry.dispose();floorMaterial.dispose();contact.geometry.dispose();contactMat.dispose();shadowMap.dispose();environment.dispose();renderer.dispose();});
 resize();primeFormation(renderer,scene,camera,model,progress);last=0;viewport.classList.add('is-ready');updateUI();setPlaying(playing);schedule();
}
function showFallback(message){viewport.classList.remove('is-ready');viewport.classList.add('is-unavailable');$('#loading p').textContent=message;document.querySelectorAll('.editorial-actions button,.view-options button,.timeline button,.timeline input').forEach(n=>n.disabled=true);$('#note').textContent='也可以回到课堂，继续观察器具线稿。';}
boot().catch(error=>{console.error('Chemex preview:',error);showFallback('暂时无法呈现立体器具，先看看线稿。');});
