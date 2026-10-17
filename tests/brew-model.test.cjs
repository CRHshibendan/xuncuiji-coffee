const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../brew-model.js');
function brew({dose=15,grind=3,temp=93,water=240,filter=true,whole=false,tool='chemex'}={}) {
 const m=M.create(tool);m.filter=filter;m.hadFilter=filter;m.oriented=true;m.rinsed=true;
 M.addGrounds(m,dose,grind,whole);
 const bloom=Math.min(40,water);
 M.addWater(m,bloom,temp,0);M.stopPour(m);
 for(let t=0;t<35;t++)M.tick(m,1);
 let added=bloom;
 while(added<water){const amount=Math.min(3,water-added);M.addWater(m,amount,temp,Math.floor(added/20)%8);M.tick(m,1);added+=amount;}
 M.stopPour(m);
 for(let t=0;t<600&&m.bed>.1;t++)M.tick(m,1);
 return {m,r:M.result(m)};
}
test('lower actual water temperature decreases extraction under otherwise equal actions',()=>{
 const hot=brew({temp:94}).r,cold=brew({temp:50}).r;
 assert.ok(hot.extraction>cold.extraction+5);
 assert.ok(cold.profile.find(x=>x.name==='甜感').value<hot.profile.find(x=>x.name==='甜感').value);
});
test('fine grinding slows draining and increases extraction relative to coarse grinding',()=>{
 const fine=brew({grind:1}),coarse=brew({grind:5});
 assert.ok(fine.m.simTime>coarse.m.simTime);
 assert.ok(fine.r.extraction>coarse.r.extraction);
 assert.ok(fine.r.profile.find(x=>x.name==='苦感').value>coarse.r.profile.find(x=>x.name==='苦感').value);
});
test('greater water-to-coffee ratio lowers modeled concentration',()=>{
 assert.ok(brew({dose:24,water:225}).r.tds>brew({dose:8,water:320}).r.tds);
});
test('water without coffee is described as water and gets no flavor bars',()=>{
 const m=M.create();M.addWater(m,100,90);const r=M.result(m);
 assert.match(r.title,/温水/);assert.ok(r.profile.every(x=>x.value===0));
});
test('whole beans extract much less than the same mass of ground coffee',()=>{
 const beans=brew({whole:true,filter:false}).r,ground=brew({filter:false}).r;
 assert.ok(beans.extraction<ground.extraction/3);assert.match(beans.title,/整豆/);
});
test('removing filter before serving does not reclassify filtered coffee as unfiltered',()=>{
 const {m}=brew();M.removeFilter(m);assert.equal(M.result(m).unfiltered,false);
 assert.equal(brew({filter:false}).r.unfiltered,true);
});
test('retained water and collected liquid do not exceed water introduced',()=>{
 const {m}=brew();assert.ok(m.liquid+m.bed+m.retained<=m.water+.001);
 assert.ok(m.liquid>0);assert.ok(m.liquid<m.water);
});
test('empty cup explains the missing action and avoids fabricated flavor',()=>{
 const m=M.create();M.addGrounds(m,15,3);const r=M.result(m);
 assert.equal(r.volume,0);assert.match(r.reasons[0].cause,/没有注水/);assert.ok(r.profile.every(x=>x.value===0));
});
test('Chemex filter orientation affects drawdown',()=>{
 const a=M.create('chemex'),b=M.create('chemex');
 for(const m of [a,b]){m.filter=true;m.bed=60;M.addGrounds(m,15,3);}a.oriented=true;b.oriented=false;
 M.tick(a,10);M.tick(b,10);assert.ok(a.liquid>b.liquid);
});
test('preheat water is discarded before recorded brew water',()=>{
 const m=M.create();m.filter=true;M.addWater(m,45,92);M.tick(m,5);M.discard(m);
 M.addGrounds(m,15,2);M.addWater(m,30,92);assert.equal(m.brewWater,30);assert.equal(m.water,30);
});
test('discarding an unfiltered failed batch does not contaminate the next filtered result',()=>{
 const m=M.create();M.addGrounds(m,15,3);M.addWater(m,100,90);M.discard(m);
 m.filter=true;m.hadFilter=true;M.addGrounds(m,15,3);M.addWater(m,100,92);M.tick(m,40);
 assert.equal(M.result(m).unfiltered,false);
});

test('barely extracted whole-bean water does not get intense sourness or invented fine sediment',()=>{
 const m=M.create();M.addGrounds(m,5,5,true);M.addWater(m,70,20);M.tick(m,25);const r=M.result(m);
 assert.ok(r.profile.find(p=>p.name==='酸感').value<10);assert.ok(!r.description.includes('细粉'));
});
