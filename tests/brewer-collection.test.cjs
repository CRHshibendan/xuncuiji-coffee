const test=require('node:test'),assert=require('node:assert/strict');
const load=()=>import('../experiments/brewer-models.js');
const canvas=()=>({width:0,height:0,getContext:()=>({fillRect(){},beginPath(){},moveTo(){},bezierCurveTo(){},stroke(){}})});

test('all seven transitions reuse ink buffers and warm every visible material variant before playback',async()=>{
 const {BREWERS}=await load(),{primeFormation}=await import('../experiments/formation-render.js');
 const previous=global.document;global.document={createElement:canvas};
 try{
  for(const brewer of BREWERS){
   const model=brewer.create(),buffers=new Map(),warmed=new Set();
   model.root.traverse(n=>{if(n.isLine)buffers.set(n,n.geometry.attributes.lineDistance);});
   const variants=()=>{const result=[];model.root.traverseVisible(n=>{if(n.isMesh){const m=n.material;result.push([m.id,m.transparent,m.transmission>0,m.side].join(':'));}});return result;};
   primeFormation({render(){variants().forEach(v=>warmed.add(v));}},null,null,model,0);
   assert.equal(model.root.children[0].visible,false,'warm-up restores the initial illustration');
   for(let i=0;i<=100;i++){
    model.formation(i/100);
    for(const variant of variants())assert.ok(warmed.has(variant),brewer.id+' must not introduce a cold material variant');
    for(const [line,buffer] of buffers){
     assert.equal(line.geometry.attributes.lineDistance,buffer,'no per-frame distance-buffer replacement');
     assert.equal(line.material.depthTest,false,'ink fades instead of suddenly hiding behind the solid');
     if(i===100)assert.equal(line.material.opacity,0);
    }
   }
   model.dispose();
  }
 }finally{global.document=previous;}
});

test('all seven existing brewers have distinct models and a working inspection part',async()=>{
 const {BREWERS,getBrewer}=await load(),previous=global.document;global.document={createElement:canvas};
 try{
  assert.deepEqual(BREWERS.map(b=>b.id),['chemex','melitta','frenchpress','moka','coldbrew','siphon','espresso']);
  assert.equal(getBrewer('unknown').id,'melitta');const signatures=new Set();
  for(const brewer of BREWERS){
   const model=brewer.create();model.formation(1);model.root.updateMatrixWorld(true);
   let vertices=0,meshes=0,lines=0;const before=[];
   model.root.traverse(n=>{if(n.isMesh){meshes++;vertices+=n.geometry.attributes.position.count;before.push(n.getWorldPosition(n.position.clone()).clone());}if(n.isLine)lines++;});
   assert.ok(lines>=10&&lines<60,brewer.id+' keeps structural strokes');
   const beforeParent=model.root.children[0].children.map(n=>n.position.clone());
   model.lift(1);model.root.updateMatrixWorld(true);
   const changed=model.root.children[0].children.some((n,i)=>!n.position.equals(beforeParent[i]));assert.ok(changed,brewer.id+' exposes its inspection part');
   signatures.add(meshes+':'+vertices);model.dispose();
  }
  assert.equal(signatures.size,7,'six new models cannot be repeated copies of the Chemex');
 }finally{global.document=previous;}
});

test('every model supports reverse scrubbing, shared pen timing and liquid reset',async()=>{
 const {BREWERS,phase}=await load(),previous=global.document;global.document={createElement:canvas};
 try{
  for(const brewer of BREWERS){
   const model=brewer.create();
   for(const progress of [0,.13,.25,.4,.45,.61,.8,.91,1,.74,.35,0]){
    const p=model.formation(progress);assert.deepEqual(p,phase(progress));model.lift(progress);model.root.updateMatrixWorld(true);
    model.root.traverse(n=>{
     if(n.geometry)assert.ok(Array.from(n.geometry.attributes.position.array).every(Number.isFinite),brewer.id+' finite geometry');
     if(n.name==='coffee-volume'||n.name==='coffee-surface'){
      assert.equal(n.visible,p.coffee>0,brewer.id+' resets coffee');assert.equal(n.material.opacity,1);assert.equal(n.material.transparent,false);
      if(n.name==='coffee-volume'&&p.coffee>0){const {min,max}=n.userData.liquidBounds||{min:.12,max:.9},positions=n.geometry.attributes.position;let top=-Infinity,bottom=Infinity;for(let i=0;i<positions.count;i++){top=Math.max(top,positions.getY(i));bottom=Math.min(bottom,positions.getY(i));}assert.ok(Math.abs(bottom-min)<1e-6);assert.ok(Math.abs(top-(min+(max-min)*p.coffee))<1e-6);}
     }
    });
   }
   model.dispose();
  }
 }finally{global.document=previous;}
});

test('disposing an inspected model releases shared geometries and materials exactly once',async()=>{
 const {BREWERS}=await load(),previous=global.document;global.document={createElement:canvas};
 try{
  for(const brewer of BREWERS.slice(1)){
   const model=brewer.create(),resources=new Set();model.root.traverse(n=>{if(n.geometry)resources.add(n.geometry);if(n.material){resources.add(n.material);if(n.material.map)resources.add(n.material.map);}});
   const counts=new Map();for(const r of resources){counts.set(r,0);r.addEventListener('dispose',()=>counts.set(r,counts.get(r)+1));}
   model.dispose();for(const count of counts.values())assert.equal(count,1,brewer.id+' releases GPU resources');
  }
 }finally{global.document=previous;}
});
