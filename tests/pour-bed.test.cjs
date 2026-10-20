const test=require('node:test'),assert=require('node:assert/strict'),P=require('../pour-bed.js'),B=require('../brew-model.js');
test('front-facing coordinates preserve all eight directions and reject the paper exterior',()=>{
 const sectors=new Set();for(let i=0;i<8;i++){const a=(i+.5)/8*Math.PI*2,p=P.sample(Math.cos(a)*.6,Math.sin(a)*.6);assert.equal(p.inside,true);sectors.add(p.sector);}assert.equal(sectors.size,8);assert.equal(P.sample(.9,.9).inside,false);assert.equal(P.sample(NaN,0).inside,false);
});
test('wetting stays near the actual landing point and conserves poured water',()=>{
 const map=P.create();P.deposit(map,P.sample(-.6,0),12);assert.ok(Math.abs(map.reduce((a,b)=>a+b,0)-12)<1e-8);assert.ok(P.cells.every((c,i)=>c.x>0?map[i]===0:true));const first=P.coverage(map);P.deposit(map,P.sample(.6,0),12);assert.ok(P.coverage(map)>first);const before=map.slice();P.deposit(map,P.sample(1.1,0),50);assert.deepEqual(map,before);
});
test('the same brewing model owns the map; plain water, removed grounds and reset cannot fake wet coverage',()=>{
 const m=B.create('chemex'),point=P.sample(.5,.3);B.addWater(m,3,92,point.sector,point);assert.equal(P.coverage(m.wetMap),0);B.addGrounds(m,15,3);B.addWater(m,6,92,point.sector,point);assert.ok(P.coverage(m.wetMap)>0);assert.equal(m.wet[point.sector],6);B.stopPour(m);const frozen=m.wetMap.slice();B.tick(m,10);assert.deepEqual(m.wetMap,frozen);B.removeFilter(m);B.addWater(m,6,92,0,P.sample(-.5,0));assert.deepEqual(m.wetMap,frozen);B.discard(m);assert.equal(P.coverage(m.wetMap),0);
});
test('basic brewing only opens the bed at the two coffee-pouring steps, while material transfers and serving stay protected',()=>{
 const model=B.create();assert.equal(P.available({model}),false);B.addGrounds(model,15,3);
 for(let step=0;step<9;step++)assert.equal(P.available({model,basic:true,step}),[6,7].includes(step));
 assert.equal(P.available({model,basic:false,step:0}),true);assert.equal(P.available({model,transferring:true}),false);assert.equal(P.available({model,served:true}),false);model.removed=true;assert.equal(P.available({model}),false);
});
