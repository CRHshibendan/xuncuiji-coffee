/* Browser API doubles: exercises cleanup/ownership without touching a camera. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../gesture-studio.js'),'utf8'),GestureCore=require('../gesture-core.js');
function fixture({pending=false,denied=false,modelError=false,hostname='127.0.0.1',protocol='http:'}={}){
 const nodes=new Map(),listeners=new Map(),frames=new Map(),workers=[],tracks=[];let next=0,requests=0,resolvePermission,pauses=0,clock=0;
 function node(id){if(nodes.has(id))return nodes.get(id);const events={},classes=new Set();
  const el={id,dataset:{},value:'user',textContent:'',disabled:false,hidden:false,readyState:2,videoWidth:640,videoHeight:480,currentTime:0,style:{setProperty(){},removeProperty(){}},getBoundingClientRect:()=>({height:100}),showModal(){},close(){},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle(x,on){on?classes.add(x):classes.delete(x);}},setAttribute(){},remove(){},querySelector:s=>node(s.slice(1)),querySelectorAll:()=>[],insertAdjacentElement(){},append(){},pause(){},async play(){},addEventListener:(n,f)=>{(events[n]??=[]).push(f);},removeEventListener:(n,f)=>{events[n]=(events[n]||[]).filter(g=>g!==f);},fire(n,e={}){return(events[n]||[]).map(fn=>fn(e));}};
  nodes.set(id,el);return el;
 }
 const scene=node('scene');
 const document={baseURI:'http://127.0.0.1:4175/workshop.html',hidden:false,body:node('body'),createElement:tag=>node(tag),querySelector:s=>s==='dialog[open]'?null:node(s),querySelectorAll:()=>[],addEventListener:(n,f)=>{(listeners.get(n)||listeners.set(n,[]).get(n)).push(f);},removeEventListener:(n,f)=>listeners.set(n,(listeners.get(n)||[]).filter(g=>g!==f))};
 function stream(){const track={stops:0,stop(){this.stops++;},addEventListener(){},getSettings:()=>({facingMode:'user'})};tracks.push(track);return{getTracks:()=>[track],getVideoTracks:()=>[track]};}
 class Worker{
  constructor(){workers.push(this);this.terminated=false;}
  postMessage(m){if(m.type==='init')queueMicrotask(()=>this.onmessage?.({data:modelError?{type:'error',message:'missing model'}:{type:'ready'}}));}
  terminate(){this.terminated=true;}
 }
 document.dispatchEvent=event=>{(listeners.get(event.type)||[]).forEach(fn=>fn(event));return true;};
 const context={CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},GestureCore,location:{hostname,protocol,href:protocol+'//'+hostname+'/xuncuiji-coffee/workshop.html?tool=melitta&mode=gesture'},document,Worker,OffscreenCanvas:function(){},createImageBitmap:()=>{},isSecureContext:true,navigator:{mediaDevices:{async getUserMedia(){requests++;if(denied)throw Object.assign(new Error('denied'),{name:'NotAllowedError'});if(pending)return new Promise(resolve=>resolvePermission=()=>resolve(stream()));return stream();}}},URL,performance:{now:()=>clock},requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id),setTimeout,clearTimeout,console:{warn(){}},innerWidth:1024,innerHeight:768};
 context.window=context;context.addEventListener=(n,f)=>document.addEventListener(n,f);context.removeEventListener=(n,f)=>document.removeEventListener(n,f);
 vm.runInNewContext(source,context);
 const adapter={scene,canPick:()=>true,ready:()=>true,select(){},begin(){return true;},move(){},release(){},tap(){},hold(){},pause(){pauses++;}};
 const controller=context.CoffeeGesture.mount(adapter);
 const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
 const fire=(name,e={})=>(listeners.get(name)||[]).forEach(f=>f(e));
 return{nodes,node,controller,flush,fire,workers,tracks,frames,context,requests:()=>requests,pauses:()=>pauses,grant:()=>resolvePermission(),step(now){clock=now;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));}};
}
test('entry never requests camera; model-only check never requests it either',async()=>{
 const f=fixture();assert.equal(f.requests(),0);f.node('gesture-check').fire('click');await f.flush();
 assert.equal(f.requests(),0);assert.match(f.node('gesture-status').textContent,/检查通过/);assert.ok(f.workers[0].terminated);f.controller.destroy();
});
test('close camera and exit mode stop tracks, worker and animation loop',async()=>{
 const f=fixture();f.node('gesture-start').fire('click');await f.flush();assert.equal(f.requests(),1);assert.equal(f.tracks[0].stops,0);assert.ok(f.frames.size);
 f.node('gesture-stop').fire('click');assert.equal(f.tracks[0].stops,1);assert.ok(f.workers[0].terminated);assert.equal(f.frames.size,0);
 f.node('gesture-start').fire('click');await f.flush();f.controller.destroy();assert.equal(f.tracks[1].stops,1);assert.ok(f.workers[1].terminated);assert.equal(f.frames.size,0);
});
test('a permission request resolved after exit cannot keep a late camera stream alive',async()=>{
 const f=fixture({pending:true});f.node('gesture-start').fire('click');await f.flush();assert.equal(f.requests(),1);
 f.controller.destroy();f.grant();await f.flush();assert.equal(f.tracks[0].stops,1);assert.equal(f.frames.size,0);
});
test('denied camera and failed model clean up and offer retry',async()=>{
 for(const options of [{denied:true},{modelError:true}]){
  const f=fixture(options);f.node('gesture-start').fire('click');await f.flush();
  assert.equal(f.node('gesture-start').disabled,false);assert.match(f.node('gesture-start').textContent,/重试/);assert.ok(f.workers[0].terminated);assert.equal(f.frames.size,0);f.controller.destroy();
 }
});
test('front/rear switching closes the previous stream; hidden page stops the next stream',async()=>{
 const f=fixture();f.node('gesture-start').fire('click');await f.flush();f.node('gesture-facing').value='environment';f.node('gesture-facing').fire('change');await f.flush();
 assert.equal(f.requests(),2);assert.equal(f.tracks[0].stops,1);assert.ok(f.workers[0].terminated);
 f.context.document.hidden=true;f.fire('visibilitychange');assert.equal(f.tracks[1].stops,1);assert.equal(f.frames.size,0);f.controller.destroy();
});
test('native pointer takeover pauses gesture actions before the original mouse handler runs',async()=>{
 const f=fixture();f.node('gesture-start').fire('click');await f.flush();const before=f.pauses();
 f.fire('pointerdown',{isTrusted:true});assert.equal(f.pauses(),before+1);assert.match(f.node('gesture-status').textContent,/鼠标／触摸已接管/);f.controller.destroy();
});

test('the tracking watchdog never cancels an ongoing native pointer drag',async()=>{
 const f=fixture();f.node('gesture-start').fire('click');await f.flush();
 f.fire('pointerdown',{isTrusted:true});const before=f.pauses();f.step(600);
 assert.equal(f.pauses(),before);f.controller.destroy();
});

function inputAdapter(){
 const f=fixture(),calls=[];let dragging=false,loaded=true,moved=false;
 const crank={getBoundingClientRect:()=>({left:200,top:50,width:40,height:40})};
 const object={querySelector:selector=>selector==='[data-crank-handle]'?crank:null};
 const root={innerHTML:'',classList:{toggle(){}}};
 const scene={querySelector:selector=>selector==='#scene-targets'?root:object};
 const adapter=f.context.CoffeeGesture.bind({scene,canPick:()=>true,select(){},clear(){},dragging:()=>dragging,
  start:e=>{calls.push(['start',e.target,e.clientX,e.clientY]);dragging=loaded;},end:(_,cancel)=>{calls.push(['end',cancel,moved]);dragging=false;},
  move:()=>calls.push(['nativeMove']),grind:r=>calls.push(['grind',r]),markMoved:()=>{moved=true;},hold(){},stop(){},
  targets:()=>[{id:'grinder',x:201,y:294,rx:55,ry:32}]
 });
 return{f,adapter,calls,crank,root,load:on=>{loaded=on;}};
}
test('gesture grinding accepts the body and relaxed motion while preserving the original load gate',()=>{
 const r=inputAdapter(),hit={id:'grinder',type:'object'};
 r.load(false);assert.equal(r.adapter.begin(hit,{x:100,y:300}),false);r.adapter.move({x:180,y:300});assert.equal(r.calls.filter(c=>c[0]==='grind').length,0);
 r.load(true);assert.equal(r.adapter.begin(hit,{x:100,y:300}),true);
 assert.deepEqual(r.calls.filter(c=>c[0]==='start').at(-1).slice(1),[r.crank,220,70]);
 r.adapter.move({x:180,y:300});r.adapter.move({x:100,y:300});
 const total=r.calls.filter(c=>c[0]==='grind').reduce((sum,c)=>sum+c[1],0);assert.ok(total>Math.PI*4);
 assert.equal(r.calls.filter(c=>c[0]==='nativeMove').length,0); // Neither a failed grab nor relaxed motion can enter the tiny crank ellipse path.
 r.adapter.release({x:100,y:300});assert.equal(r.calls.at(-1)[2],true);r.f.controller.destroy();
});
test('selection and grab show only supplied original target positions and pause clears them',()=>{
 const r=inputAdapter(),hit={id:'beans',type:'object'};
 r.adapter.select(hit);assert.match(r.root.innerHTML,/豆子送这里/);assert.match(r.root.innerHTML,/cx="201" cy="294"/);assert.doesNotMatch(r.root.innerHTML,/data-target="bed"/);
 r.adapter.begin(hit,{x:100,y:300});assert.match(r.root.innerHTML,/gesture-drop-target/);
 r.adapter.pause();assert.equal(r.root.innerHTML,'');r.f.controller.destroy();
});

test('grabbing the grinder without moving does not grind on release, and loss cancels the active grip',()=>{
 const r=inputAdapter(),hit={id:'grinder',type:'object'};r.adapter.begin(hit,{x:100,y:300});r.adapter.release({x:100,y:300});
 assert.equal(r.calls.at(-1)[2],true);assert.equal(r.calls.filter(c=>c[0]==='grind').length,0);
 r.adapter.begin(hit,{x:100,y:300});r.adapter.pause();const before=r.calls.length;r.adapter.move({x:200,y:300});assert.equal(r.calls.length,before);assert.equal(r.calls.at(-1)[1],true);r.f.controller.destroy();
});

test('the published HTTPS beta mounts without requesting a camera and keeps local development available',()=>{
 const f=fixture({hostname:'crhshibendan.github.io',protocol:'https:'});assert.equal(f.context.CoffeeGesture.local,false);assert.equal(f.context.CoffeeGesture.available,true);assert.ok(f.controller);assert.equal(f.requests(),0);f.controller.destroy();
});
