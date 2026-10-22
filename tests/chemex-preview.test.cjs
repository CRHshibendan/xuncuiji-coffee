const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../experiments/chemex-model.js');
test('formation finishes drawing, then colors the flat illustration before unfolding',async()=>{
 const {phase,ease}=await load();assert.equal(ease(0),0);assert.equal(ease(1),1);assert.ok(ease(.1)<.02);assert.ok(ease(.9)>.98);assert.ok(Math.abs(ease(.5)-.5)<.00001);
 let previous={ink:0,color:0,depth:0,material:0,coffee:0};
 for(let i=0;i<=1000;i++){const p=phase(i/1000);for(const key of Object.keys(p)){assert.ok(p[key]>=previous[key]&&p[key]<=1);if(p[key]>0&&key!=='ink')assert.equal(p.ink,1);if(p.depth>0)assert.equal(p.color,1);}previous=p;}
 assert.deepEqual(phase(.25),{ink:1,color:0,depth:0,material:0,coffee:0});assert.deepEqual(phase(.42),{ink:1,color:1,depth:0,material:0,coffee:0});assert.deepEqual(phase(1),{ink:1,color:1,depth:1,material:1,coffee:1});
});
test('color hands straight into a gentle volume ramp, without a hold or a sudden speed burst',async()=>{
 const {phase,FORMATION_DURATION}=await load();
 assert.equal(phase(.42).color,1);assert.equal(phase(.42).depth,0);
 assert.ok(phase(.421).depth>0);assert.equal(phase(.74).depth,1);
 const step=1/(60*FORMATION_DURATION);let lastVelocity=0;
 for(let t=.42;t<.74;t+=step){
  const velocity=phase(t+step).depth-phase(t).depth;
  assert.ok(velocity<.009,'no sudden volume jump within a 60 Hz frame');
  assert.ok(Math.abs(velocity-lastVelocity)<.0003,'volume acceleration remains gradual');
  lastVelocity=velocity;
 }
});
test('the hollow model and paper remain finite throughout unfolding and filter removal',async()=>{
 const {createChemex}=await load(),previous=global.document;
 global.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},beginPath(){},moveTo(){},bezierCurveTo(){},stroke(){}})})};
 try{
  const model=createChemex();
  for(const progress of [0,.15,.34,.5,.7,.82,1])for(const lift of [0,.5,1]){
   model.root.rotation.set(.4,.7,0);model.formation(progress);model.lift(lift);model.root.updateMatrixWorld(true);
   model.root.traverse(node=>{if(!node.geometry)return;const p=node.geometry.attributes.position.array;assert.ok(Array.from(p).every(Number.isFinite));if(node.material?.clippingPlanes)for(const plane of node.material.clippingPlanes)assert.ok(Number.isFinite(plane.constant));});
  }
  let glass=0;model.root.traverse(n=>{if(n.material?.transmission===1){glass++;assert.equal(n.material.transparent,false);assert.equal(n.material.opacity,1);}});assert.ok(glass>0);
  model.dispose();
 }finally{global.document=previous;}
});

test('coffee rises from the bottom with an opaque body and a matching surface at every height',async()=>{
 const {createChemex,phase,liquidState,FORMATION_DURATION}=await load(),previous=global.document;
 global.document={createElement:()=>({getContext:()=>({fillRect(){},beginPath(){},moveTo(){},bezierCurveTo(){},stroke(){}})})};
 try{
  const model=createChemex(),body=model.root.getObjectByName('coffee-volume'),surface=model.root.getObjectByName('coffee-surface');let last=.12;
  for(let i=0;i<=100;i++){
   const progress=.70+.30*i/100,p=phase(progress),state=liquidState(p.coffee);model.formation(progress);
   assert.ok(state.level>=last);last=state.level;
   assert.equal(body.material.opacity,1);assert.equal(body.material.transparent,false);
   assert.ok(Math.abs(surface.position.y-state.level)<1e-6);assert.ok(Math.abs(surface.scale.x-state.radius)<1e-6);
   const position=body.geometry.attributes.position;let top=-Infinity,bottom=Infinity;
   for(let v=0;v<position.count;v++){top=Math.max(top,position.getY(v));bottom=Math.min(bottom,position.getY(v));if(Math.abs(position.getY(v)-state.level)<1e-6&&i>0)assert.ok(Math.abs(Math.hypot(position.getX(v),position.getZ(v))-state.radius)<1e-6);}
   assert.ok(Math.abs(top-state.level)<1e-6);assert.ok(Math.abs(bottom-.12)<1e-6);
  }
  assert.ok(FORMATION_DURATION*.3>=2.6);assert.ok(liquidState(phase(.73).coffee).level<.15);assert.ok(liquidState(phase(.97).coffee).level>.87);
  model.formation(0);assert.equal(body.visible,false);assert.equal(surface.visible,false);model.dispose();
 }finally{global.document=previous;}
});
