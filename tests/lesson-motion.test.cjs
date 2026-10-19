const test=require('node:test'),assert=require('node:assert/strict'),{create}=require('../lesson-motion.js');
function element(){return{animations:[],animate(frames,options){const a={frames,options,cancelled:false,cancel(){this.cancelled=true;this.oncancel?.();}};this.animations.push(a);return a;}};}
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
test('rapid brewer selection ignores a late image decode from an older selection',async()=>{
 const motion=create(()=>true),image=element(),first=deferred(),second=deferred(),copy={querySelectorAll:()=>[]};
 let call=0;image.decode=()=>++call===1?first.promise:second.promise;
 const old=motion.brewer(image,copy),latest=motion.brewer(image,copy);
 second.resolve();await latest;assert.equal(image.animations.length,1);
 first.resolve();await old;assert.equal(image.animations.length,1);
});
test('a new animation cancels the previous one and pause cancels pending entrance work',async()=>{
 const motion=create(()=>true),image=element(),copy={querySelectorAll:()=>[]};image.decode=async()=>{};
 await motion.brewer(image,copy);const first=image.animations[0];
 await motion.brewer(image,copy);assert.equal(first.cancelled,true);
 const pending=deferred();image.decode=()=>pending.promise;const loading=motion.brewer(image,copy);motion.stop();pending.resolve();await loading;
 assert.equal(image.animations.length,2);assert.ok(image.animations.every(a=>a.cancelled));
});
test('reduced motion and browsers without animation APIs keep content usable',async()=>{
 const image=element(),copy={querySelectorAll:()=>[element()]};let decoded=false;image.decode=async()=>{decoded=true;};
 const paused=create(()=>false);await paused.brewer(image,copy);paused.reveal(image);
 assert.equal(decoded,false);assert.equal(image.animations.length,0);
 const fallback=create(()=>true);fallback.reveal({});await fallback.brewer({decode:async()=>{}},copy);
});
