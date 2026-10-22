import * as T from './vendor/three.module.min.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {getBrewer,ease,FORMATION_DURATION} from './brewer-models.js';
import {primeFormation} from './formation-render.js';

export function createClassroomBrewer({stage,controls,tool,onError}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),events=new AbortController();
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(max-width:760px)').matches?1.5:1.8));
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 renderer.domElement.setAttribute('aria-hidden','true');stage.append(renderer.domElement);
 // Transmission needs a real background to refract, even on this quiet page.
 const scene=new T.Scene();scene.background=new T.Color(getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()||'#f6f3ec');
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.02);scene.environment=environment.texture;scene.environmentIntensity=.55;room.dispose();pmrem.dispose();
 scene.add(new T.HemisphereLight(0xfffaed,0xb4b5a6,.8));
 const key=new T.DirectionalLight(0xfff8eb,2.2);key.position.set(-3.5,6,4);scene.add(key);
 const fill=new T.DirectionalLight(0xe9f2ee,.7);fill.position.set(4,2,-3);scene.add(fill);
 const camera=new T.OrthographicCamera(-2.4,2.4,2.4,-2.4,.1,40);camera.position.set(0,1.55,7);camera.lookAt(0,.04,0);
 let brewer=getBrewer(tool),model=brewer.create();scene.add(model.root);
 let visible=false,disposed=false,raf=0,last=0,progress=reduced.matches?1:0,yaw=0,pitch=0,targetYaw=0,targetPitch=0,lift=0,wantLift=false,drag=null,switchTimer=0,pending=brewer.id;
 const replay=controls.querySelector('[data-model-replay]'),inspect=controls.querySelector('[data-model-inspect]'),reset=controls.querySelector('[data-model-reset]'),hint=controls.querySelector('p');
 const listen=(target,event,fn,options={})=>target.addEventListener(event,fn,{...options,signal:events.signal});
 function describe(){stage.dataset.tool=brewer.id;stage.setAttribute('aria-label',brewer.name+' 三维器具，可左右拖动或使用方向键旋转');inspect.textContent=(wantLift?brewer.close:brewer.open)+' ↗';inspect.setAttribute('aria-pressed',String(wantLift));}
 function schedule(){if(!disposed&&visible&&!document.hidden&&!switchTimer&&!raf)raf=requestAnimationFrame(frame);}
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.left=-2.4*w/h;camera.right=2.4*w/h;camera.updateProjectionMatrix();schedule();}
 function frame(now){
  raf=0;if(disposed||!visible||document.hidden)return;
  const dt=last?Math.min(.06,(now-last)/1000):0;last=now;
  progress=reduced.matches?1:Math.min(1,progress+dt/FORMATION_DURATION);
  const k=reduced.matches?1:1-Math.exp(-7*dt),targetLift=wantLift?1:0;
  lift+=(targetLift-lift)*k;yaw+=(targetYaw-yaw)*k;pitch+=(targetPitch-pitch)*k;
  const moving=Math.abs(lift-targetLift)+Math.abs(yaw-targetYaw)+Math.abs(pitch-targetPitch)>.0001;
  const p=model.formation(progress);model.lift(ease(lift));model.root.rotation.set(pitch+.015*p.depth,-.34*p.depth+yaw,0);
  camera.zoom=brewer.zoom-brewer.liftZoom*lift;camera.position.y=1.55+lift*.7;camera.lookAt(0,.04+lift*.30,0);camera.updateProjectionMatrix();
  inspect.disabled=progress<.82;
  const text=progress<1?'线稿 · 上色 · 体积 · 材质':'左右拖动，换个角度看看';if(hint.textContent!==text)hint.textContent=text;
  renderer.render(scene,camera);
  if(progress<1||moving)schedule();else last=0;
 }
 function restart(){release();progress=reduced.matches?1:0;wantLift=false;lift=yaw=pitch=targetYaw=targetPitch=0;last=0;describe();schedule();}
 function release(){const previous=drag;drag=null;if(previous&&stage.hasPointerCapture(previous.id))stage.releasePointerCapture(previous.id);stage.classList.remove('is-dragging');}
 function select(id){
  const next=getBrewer(id);if(next.id===pending||disposed)return;pending=next.id;
  release();clearTimeout(switchTimer);cancelAnimationFrame(raf);raf=0;stage.classList.add('is-changing');stage.setAttribute('aria-busy','true');
  switchTimer=setTimeout(()=>{
   switchTimer=0;if(disposed)return;
   try{
    const replacement=next.create();scene.remove(model.root);model.dispose();model=replacement;brewer=next;scene.add(model.root);
    progress=reduced.matches?1:0;camera.zoom=brewer.zoom;camera.updateProjectionMatrix();primeFormation(renderer,scene,camera,model,progress);
    stage.classList.remove('is-changing');stage.setAttribute('aria-busy','false');restart();
   }catch(error){console.warn('Classroom model switch failed:',error);dispose();onError();}
  },reduced.matches?0:160);
 }
 listen(replay,'click',restart);
 listen(inspect,'click',()=>{wantLift=!wantLift;describe();schedule();});
 listen(reset,'click',()=>{targetYaw=targetPitch=0;schedule();});
 listen(stage,'pointerdown',event=>{
  if(event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,yaw,pitch,touch:event.pointerType==='touch',active:false};
  if(!drag.touch){event.preventDefault();stage.focus({preventScroll:true});stage.setPointerCapture(event.pointerId);drag.active=true;stage.classList.add('is-dragging');}
 });
 listen(stage,'pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(!drag.active){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>6){release();return;}if(Math.abs(dx)<6)return;drag.active=true;stage.setPointerCapture(event.pointerId);stage.classList.add('is-dragging');}
  event.preventDefault();yaw=targetYaw=drag.yaw+dx*.008;pitch=targetPitch=Math.max(-.2,Math.min(.85,drag.pitch+(drag.touch?0:-dy*.006)));schedule();
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(stage,event,release);
 listen(stage,'keydown',event=>{const d={ArrowLeft:[-.2,0],ArrowRight:[.2,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]}[event.key];if(!d)return;event.preventDefault();targetYaw+=d[0];targetPitch=Math.max(-.2,Math.min(.85,targetPitch+d[1]));schedule();});
 listen(document,'visibilitychange',()=>{last=0;if(document.hidden){release();cancelAnimationFrame(raf);raf=0;}else schedule();});
 listen(reduced,'change',()=>{if(reduced.matches)progress=1;schedule();});
 listen(renderer.domElement,'webglcontextlost',event=>{event.preventDefault();dispose();onError();});
 const observer=new ResizeObserver(resize);observer.observe(stage);
 function setVisible(value){visible=value;last=0;if(!value){release();cancelAnimationFrame(raf);raf=0;}else schedule();}
 function dispose(){if(disposed)return;disposed=true;release();clearTimeout(switchTimer);cancelAnimationFrame(raf);observer.disconnect();events.abort();model.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();}
 try{describe();resize();camera.zoom=brewer.zoom;camera.updateProjectionMatrix();primeFormation(renderer,scene,camera,model,progress);}catch(error){dispose();throw error;}
 return {select,setVisible,dispose};
}
