const test=require('node:test'),assert=require('node:assert/strict');
const {createSession}=require('../workshop-display.js');
function rig({fullscreen=true,lock=true,rejectFullscreen=false,rejectLock=false,pendingFullscreen=false,pendingLock=false}={}){
 const calls=[],states=[];let grantFullscreen,grantLock;
 const doc={fullscreenElement:null,async exitFullscreen(){calls.push('exit');doc.fullscreenElement=null;}};
 const element=fullscreen?{async requestFullscreen(){calls.push('request');if(rejectFullscreen)throw Error('denied');if(pendingFullscreen)await new Promise(resolve=>grantFullscreen=resolve);doc.fullscreenElement=element;}}:{};
 const orientation=lock?{async lock(value){calls.push(value);if(rejectLock)throw Error('unsupported');if(pendingLock)await new Promise(resolve=>grantLock=resolve);},unlock(){calls.push('unlock');}}:{};
 const session=createSession({document:doc,element,orientation,onChange:s=>states.push({...s})});
 return{session,doc,calls,states,grantFullscreen:()=>grantFullscreen(),grantLock:()=>grantLock()};
}
test('a click enters fullscreen before locking landscape and exit releases only its own resources',async()=>{
 const r=rig();await r.session.enter();assert.deepEqual(r.calls,['request','landscape']);assert.deepEqual(r.states.at(-1),{active:true,native:true,locked:true});
 await r.session.leave();assert.deepEqual(r.calls,['request','landscape','unlock','exit']);assert.equal(r.session.active,false);
});
test('unsupported or denied fullscreen keeps a usable in-page layout without forcing orientation',async()=>{
 for(const options of [{fullscreen:false},{rejectFullscreen:true}]){const r=rig(options);await r.session.enter();assert.equal(r.session.active,true);assert.equal(r.states.at(-1).native,false);assert.ok(!r.calls.includes('landscape'));await r.session.leave();assert.ok(!r.calls.includes('unlock'));}
});
test('an orientation lock rejection does not strand fullscreen or the exit control',async()=>{
 const r=rig({rejectLock:true});await r.session.enter();assert.deepEqual(r.states.at(-1),{active:true,native:true,locked:false});await r.session.leave();assert.equal(r.doc.fullscreenElement,null);
});
test('browser fullscreen exit unlocks rotation but preserves the in-page workbench until explicit exit',async()=>{
 const r=rig();await r.session.enter();r.doc.fullscreenElement=null;r.session.fullscreenChanged();assert.equal(r.session.active,true);assert.ok(r.calls.includes('unlock'));assert.deepEqual(r.states.at(-1),{active:true,native:false,locked:false});await r.session.leave();assert.equal(r.session.active,false);
});
test('late fullscreen or orientation promises cannot reopen the workbench after exit',async()=>{
 const a=rig({pendingFullscreen:true});const entering=a.session.enter();await a.session.leave();a.grantFullscreen();await entering;assert.equal(a.doc.fullscreenElement,null);assert.equal(a.session.active,false);
 const b=rig({pendingLock:true});const pending=b.session.enter();await Promise.resolve();await b.session.leave();b.grantLock();await pending;assert.equal(b.doc.fullscreenElement,null);assert.ok(b.calls.includes('unlock'));assert.equal(b.session.active,false);
});
const {viewportBounds,cameraBox}=require('../workshop-display.js');
test('a compact control rail preserves the original readouts, buttons and exact home order on exit',()=>{
 const {createControlRail}=require('../workshop-display.js');
 function node(name){return{name,children:[],setAttribute(){},append(n){this.insertBefore(n,null);},insertBefore(n,next){if(n.parentNode)n.parentNode.children.splice(n.parentNode.children.indexOf(n),1);this.children.splice(next?this.children.indexOf(next):this.children.length,0,n);n.parentNode=this;},before(n){this.parentNode.insertBefore(n,this);},get nextSibling(){return this.parentNode.children[this.parentNode.children.indexOf(this)+1]||null;}};}
 const doc={createElement:node,createComment:node},host=node('center'),scene=node('scene'),heat=node('heat'),dashboard=node('readouts'),actions=node('actions'),footer=node('footer');
 host.append(scene);scene.append(heat);host.append(actions);host.append(dashboard);host.append(footer);heat.clickHandler=()=>92;dashboard.value=225;
 const control=createControlRail(doc,host,[dashboard,heat,actions]);assert.equal(control.rail.hidden,true);
 control.setActive(true);assert.deepEqual(control.rail.children,[dashboard,heat,actions]);assert.equal(heat.clickHandler(),92);assert.equal(dashboard.value,225);
 control.setActive(true);assert.equal(control.rail.children.length,3);
 control.setActive(false);assert.equal(heat.parentNode,scene);assert.equal(control.rail.children.length,0);assert.deepEqual(host.children.filter(n=>['scene','actions','readouts','footer'].includes(n.name)),[scene,actions,dashboard,footer]);assert.equal(control.rail.hidden,true);
 control.setActive(true);assert.deepEqual(control.rail.children,[dashboard,heat,actions]);
});
test('visible viewport tracks expanded browser chrome, rotation and non-fullscreen offsets',()=>{
 assert.deepEqual(viewportBounds({innerWidth:874,innerHeight:402,visualViewport:{width:874,height:260,offsetTop:0,offsetLeft:0,scale:1}}),{width:874,height:260,left:0,top:0});
 assert.deepEqual(viewportBounds({innerWidth:430,innerHeight:932}),{width:430,height:932,left:0,top:0});
 assert.deepEqual(viewportBounds({innerWidth:844,innerHeight:390,visualViewport:{width:820,height:280,offsetLeft:12,offsetTop:16,scale:1}}),{width:820,height:280,left:12,top:16});
 // Zooming the page must not cause the workbench to chase the magnified viewport.
 assert.equal(viewportBounds({innerWidth:844,innerHeight:390,visualViewport:{width:422,height:195,scale:2}}).width,844);
});
test('expanded grind framing enlarges the tool while keeping its complete crank orbit and vessel',()=>{
 const original=[45,180,325,380],frame=cameraBox(original,{expanded:true,view:'grind'});
 const [x,y,w,h]=frame;for(const [px,py]of [[100,210],[302,285],[156,451],[247,451]]){assert.ok(px>=x&&px<=x+w&&py>=y&&py<=y+h);}
 const previousToolHeight=157*(260-68-88)/380;
 const newToolHeight=157*(260-48-16)/h;
 assert.ok(newToolHeight>previousToolHeight*2);
 assert.deepEqual(cameraBox(original,{expanded:false,view:'grind'}),original);
 assert.deepEqual(cameraBox([0,120,900,490],{expanded:true,view:'overview'}),[0,120,900,490]);
});
test('webkit-prefixed fullscreen follows the same lifecycle without an orientation API',async()=>{
 const doc={webkitFullscreenElement:null,async webkitExitFullscreen(){doc.webkitFullscreenElement=null;}};
 const element={async webkitRequestFullscreen(){doc.webkitFullscreenElement=element;}};
 const states=[],session=createSession({document:doc,element,onChange:s=>states.push(s)});
 await session.enter();assert.equal(states.at(-1).native,true);await session.leave();assert.equal(doc.webkitFullscreenElement,null);
});
