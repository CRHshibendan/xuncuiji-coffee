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
