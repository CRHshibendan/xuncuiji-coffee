const test=require('node:test'),assert=require('node:assert/strict');
const {Machine,classify,mapPoint}=require('../gesture-core.js');
function rig(){
 const calls=[],item={id:'kettle',type:'object',label:'水壶'};let water=false;
 const machine=new Machine({hitTest:p=>p.x<200?item:null,select:hit=>calls.push(['select',hit.id]),grab:(hit,p)=>{calls.push(['grab',p]);return true;},move:p=>{water=true;calls.push(['move',p]);},release:p=>{water=false;calls.push(['release',p]);},pause:()=>{water=false;calls.push(['pause']);},hold:on=>{if(!on)water=false;},tap:()=>calls.push(['tap'])});
 const sample=(pose,index={x:100,y:100},palm={x:180,y:150},confidence=1)=>({pose,index,palm,confidence});
 function pose(name,time,index,palm){machine.step(sample(name,index,palm),time);machine.step(sample(name,index,palm),time+200);}
 pose('open',0);
 return{machine,calls,sample,pose,water:()=>water};
}
test('pinch selects only under the cursor, is debounced, and does not start pouring',()=>{
 const away=rig();away.pose('point',250,{x:500,y:100});away.pose('pinch',600);assert.equal(away.machine.selected,null);
 const r=rig();r.pose('pinch',300);assert.equal(r.machine.selected.id,'kettle');assert.equal(r.water(),false);
 r.machine.step(r.sample('pinch'),2000);r.machine.step(r.sample('pinch'),2400);
 assert.equal(r.calls.filter(c=>c[0]==='select').length,1);assert.equal(r.calls.filter(c=>c[0]==='tap').length,0);
});
test('pinch-to-fist preserves grab offset, then open hand releases at the moved position',()=>{
 const r=rig();r.pose('pinch',300);r.pose('fist',600);
 assert.equal(r.machine.state,'grabbed');assert.deepEqual(r.calls.find(c=>c[0]==='grab')[1],{x:100,y:100});
 r.machine.step(r.sample('fist',undefined,{x:200,y:180}),900);
 assert.deepEqual(r.calls.at(-1),['move',{x:120,y:130}]);
 r.machine.step(r.sample('open'),1000);assert.equal(r.water(),false);assert.equal(r.machine.state,'grabbed');
 r.machine.step(r.sample('open'),1121);assert.equal(r.machine.state,'idle');assert.deepEqual(r.calls.at(-1),['release',{x:120,y:130}]);
});
test('missing/low confidence hands stop water immediately and cannot resume from a held fist',()=>{
 for(const missing of [null,{pose:'fist',confidence:.4}]){
  const r=rig();r.pose('pinch',300);r.pose('fist',600);r.machine.step(r.sample('fist'),900);assert.equal(r.water(),true);
  r.machine.step(missing,901);assert.equal(r.water(),false);assert.equal(r.machine.state,'paused');
  r.pose('fist',1000);assert.equal(r.water(),false);assert.equal(r.machine.state,'paused');
  r.pose('open',1400);assert.equal(r.machine.state,'idle');assert.equal(r.machine.selected,null);
 }
});
test('an unstable or neutral pose stops sustained operation before release debounce completes',()=>{
 const r=rig();r.pose('pinch',300);r.pose('fist',600);r.machine.step(r.sample('fist'),900);assert.equal(r.water(),true);
 r.machine.step(r.sample('neutral'),901);assert.equal(r.water(),false);assert.equal(r.machine.state,'grabbed');
});
test('a second deliberate pinch taps the selected object, never grabs or auto-pours',()=>{
 const r=rig();r.pose('pinch',300);r.pose('point',600);r.pose('pinch',1000);
 assert.equal(r.calls.filter(c=>c[0]==='tap').length,1);assert.equal(r.machine.state,'selected');assert.equal(r.water(),false);
});
test('front-camera mirroring and rear-camera coordinates map in the same direction as their previews',()=>{
 assert.deepEqual(mapPoint({x:.2,y:.25},{width:432,height:832,mirror:true}),{x:336,y:216});
 assert.deepEqual(mapPoint({x:.2,y:.25},{width:432,height:832,mirror:false}),{x:96,y:216});
});
function hand(pose='open',scale=1){
 const p=Array.from({length:21},()=>({x:.5,y:.5,z:0}));p[0]={x:.5,y:.85};
 [[5,.42,.6],[9,.5,.58],[13,.58,.6],[17,.66,.64]].forEach(([i,x,y])=>{
  p[i]={x,y};p[i+1]={x,y:y-.15};p[i+2]={x,y:y-.25};p[i+3]={x,y:y-.35};
  if(pose!=='open'){p[i+2]={x,y:y+.06};p[i+3]={x,y:y+.12};}
 });
 p[1]={x:.35,y:.75};p[2]={x:.28,y:.67};p[3]={x:.23,y:.57};p[4]={x:.18,y:.5};
 if(pose==='pinch'){p[8]={x:.35,y:.47};p[4]={x:.35,y:.47};}
 return p.map(v=>({...v,x:.5+(v.x-.5)*scale,y:.5+(v.y-.5)*scale}));
}
test('classification normalizes pinch to palm size and distinguishes fist/open from pinch',()=>{
 for(const scale of [.65,1]){
  assert.equal(classify(hand('open',scale)).pose,'open');
  assert.equal(classify(hand('fist',scale)).pose,'fist');
  assert.equal(classify(hand('pinch',scale)).pose,'pinch');
 }
 assert.equal(classify(null),null);const edge=hand();edge[8].x=1.1;assert.equal(classify(edge),null);
});

test('curling fingers and closing the palm cannot displace the visible grab anchor',()=>{
 const calls=[];let visible=null;
 const hit={id:'beans',type:'object',label:'豆碗'};
 const m=new Machine({pointer:()=>visible,cursor:p=>{visible={...p};},hitTest:p=>p.x===120&&p.y===90?hit:null,select:()=>true,grab:(_,p)=>{calls.push(['grab',{...p}]);return true;},move:p=>calls.push(['move',p]),highlight(){}});
 const step=(pose,t,index={x:120,y:90},palm={x:200,y:200})=>m.step({pose,index,palm,confidence:1},t);
 step('open',0);step('open',130);step('pinch',200,{x:130,y:200});step('pinch',370,{x:140,y:250});
 assert.equal(m.selected.id,'beans');assert.deepEqual(visible,{x:120,y:90});
 // Even if recognition still says point as the index starts curling, aim uses the stable palm.
 step('point',400,{x:120,y:450});assert.deepEqual(visible,{x:120,y:90});
 step('fist',450,{x:120,y:500},{x:220,y:260});
 step('fist',640,{x:120,y:550},{x:230,y:280});
 assert.deepEqual(calls[0],['grab',{x:120,y:90}]);
 step('fist',700,{x:120,y:560},{x:230,y:280});assert.deepEqual(calls.at(-1),['move',{x:120,y:90}]);
 step('fist',800,{x:120,y:560},{x:250,y:290});assert.deepEqual(calls.at(-1),['move',{x:140,y:100}]);
});
test('hover signals do not select; one deliberate pinch toggles a control exactly once',()=>{
 let visible=null,toggles=0;const hover=[],button={type:'control',element:{}};
 const m=new Machine({pointer:()=>visible,cursor:p=>{visible=p;},hitTest:p=>p.x>200?button:{type:'object',id:'kettle'},hover:h=>hover.push(h),control:()=>toggles++});
 const step=(pose,t,x=100)=>m.step({pose,index:{x,y:100},palm:{x:180,y:150},confidence:1},t);
 step('open',0);step('open',130);assert.equal(m.selected,null);assert.equal(hover.at(-1).id,'kettle');
 step('point',160,300);step('point',300,300);assert.equal(hover.at(-1),null);
 step('pinch',350,400);step('pinch',520,400);step('pinch',900,400);step('pinch',1800,400);
 assert.equal(toggles,1);assert.equal(m.state,'idle');
 step('point',1850,300);step('point',2000,300);step('pinch',2050);step('pinch',2220);assert.equal(toggles,2);
});
test('pinching without a recent aim cannot select a remote object',()=>{
 const r=rig();r.pose('neutral',300);r.pose('pinch',1000);assert.equal(r.machine.selected,null);
});

test('selected objects and transient neutral poses never attract the cursor back to an old selection',()=>{
 let pointer=null;const cursors=[];const m=new Machine({pointer:()=>pointer,cursor:p=>{pointer={...p};cursors.push(pointer);},hitTest:()=>({id:'kettle',type:'object'}),select:()=>true});
 const step=(pose,t,x=100,palmX=180)=>m.step({pose,index:{x,y:100},palm:{x:palmX,y:150},confidence:1},t);
 step('open',0);step('open',130);step('pinch',200);step('pinch',270);assert.equal(m.state,'selected');
 step('point',300);step('point',370,180);assert.equal(pointer.x,180);
 step('neutral',400,180,180);step('neutral',470,180,240);assert.equal(pointer.x,240);
 step('point',500,240,240);step('point',570,340,240);assert.equal(pointer.x,340);
 step('neutral',600,340,240);step('neutral',670,340,300);assert.equal(pointer.x,400);
 assert.equal(m.state,'selected');assert.ok(cursors.slice(-6).every(p=>p.x>=180));
});
test('a single-frame quick pinch commits on release, while held pinches remain single-shot',()=>{
 for(const next of ['point','open','fist']){
  const r=rig();r.machine.step(r.sample('pinch'),300);assert.equal(r.machine.selected,null);
  r.machine.step(r.sample(next),350);assert.equal(r.machine.selected.id,'kettle');
  assert.equal(r.calls.filter(c=>c[0]==='select').length,1);assert.equal(r.water(),false);
 }
 const r=rig();r.machine.step(r.sample('pinch'),300);r.machine.step(r.sample('pinch'),360);
 assert.equal(r.machine.selected.id,'kettle');r.machine.step(r.sample('pinch'),1000);r.machine.step(r.sample('open'),1050);
 assert.equal(r.calls.filter(c=>c[0]==='select').length,1);assert.equal(r.calls.filter(c=>c[0]==='tap').length,0);
});
test('the temporary finger-opening offset fades so the entire screen remains reachable',()=>{
 let p=null;const m=new Machine({pointer:()=>p,cursor:point=>{p={...point};},hitTest:()=>null});
 const step=(pose,t,x,palmX=180)=>m.step({pose,index:{x,y:100},palm:{x:palmX,y:150},confidence:1},t);
 step('open',0,100);step('open',130,100);step('neutral',200,300);step('neutral',270,300,380);assert.equal(p.x,300);
 step('point',300,20,380);assert.equal(p.x,300); // No instantaneous finger-opening jump.
 for(let i=1;i<=8;i++)step('point',300+i*50,20,380);
 assert.ok(Math.abs(p.x-20)<2); // It is not a permanent offset that traps the cursor away from the left edge.
});
