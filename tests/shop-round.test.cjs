const test=require('node:test'),assert=require('node:assert/strict'),R=require('../shop-round.js');
const advance=(r,seconds)=>{for(let t=0;t<seconds;t+=.05)R.tick(r,.05);};
const align=(r,o)=>{
 for(let i=0;i<20&&o.choice!==o.flavor;i++){
  if(o.flavor==='light')R.tune(r,'water',1);
  else if(o.flavor==='rich')R.tune(r,'water',-1);
  else break;
 }
 assert.equal(o.choice,o.flavor);
};
const serve=r=>{const o=r.queue[0];assert.ok(R.accept(r,o.id));advance(r,1);assert.equal(o.phase,'prepared');align(r,o);assert.ok(R.brew(r));advance(r,4);assert.equal(o.phase,'ready');return R.resolve(r,o.id,'served');};

test('the first customer never times out in either mode',()=>{
 for(const mode of ['relax','rush']){const r=R.createRound(mode);advance(r,120);assert.equal(r.elapsed,0);assert.equal(r.queue.length,3);assert.equal(r.lost,0);assert.equal(r.spawned,3);}
});
test('a relaxed round resolves five guests and finishes with an achievable perfect score',()=>{
 const r=R.createRound();for(let i=0;i<5;i++)serve(r);
 assert.equal(r.status,'finished');assert.equal(r.served,5);assert.equal(r.perfect,5);assert.equal(r.points,500);assert.equal(r.revenue,170);assert.equal(r.queue.length,0);
 assert.equal(R.summary(r).title,'今日满杯店长');
});
test('grinding, brewing and serving are gated, duplicate clicks cannot award money',()=>{
 const r=R.createRound(),id=r.queue[0].id;
 assert.equal(R.resolve(r,id,'served'),null);assert.equal(R.brew(r),false);assert.ok(R.accept(r,id));assert.equal(R.accept(r,id),false);assert.equal(R.brew(r),false);
 advance(r,1);align(r,r.queue[0]);assert.ok(R.brew(r));assert.equal(R.brew(r),false);assert.equal(R.resolve(r,id,'served'),null);advance(r,4);assert.ok(R.resolve(r,id,'served'));assert.equal(R.resolve(r,id,'served'),null);assert.equal(r.points,100);
});
test('expelling an active brewing guest clears the station, pays a comfort fee and leaves no ghost cup',()=>{
 const r=R.createRound();serve(r);const id=r.queue[0].id;
 R.accept(r,id);advance(r,1);R.brew(r);advance(r,1);const money=r.revenue,price=R.menuFor(r.queue.find(o=>o.id===id)).price;assert.ok(R.resolve(r,id,'expelled'));
 assert.equal(r.activeId,null);assert.equal(r.revenue,money+Math.round(price*.5));assert.equal(r.points,80);advance(r,5);assert.equal(r.served,1);assert.equal(r.queue[0].phase,'waiting');assert.equal(R.resolve(r,id,'expelled'),null);
});
test('expelling all guests still ends the round and score never goes negative',()=>{
 const r=R.createRound();for(let i=0;i<5;i++)R.resolve(r,r.queue[0].id,'expelled');assert.equal(r.status,'finished');assert.equal(r.points,0);assert.equal(r.served,0);assert.equal(r.expelled,5);
});
test('rush clocks start after the tutorial, queues cap at three and deadline ends a round',()=>{
 const r=R.createRound('rush');serve(r);assert.equal(r.clockStarted,true);advance(r,28);assert.ok(r.queue.length<=3);assert.ok(r.spawned>2);assert.equal(r.lost,0);advance(r,80);assert.equal(r.status,'finished');assert.equal(r.queue.length,0);assert.ok(r.lost>0);assert.ok(r.elapsed>=90);
});
test('relaxed guests wait indefinitely and recipes open gradually',()=>{
 const r=R.createRound();serve(r);advance(r,120);assert.equal(r.lost,0);assert.equal(r.queue[0].drink,'melitta');serve(r);assert.equal(r.queue[0].drink,'frenchpress');
});
test('player-tuned parameters decide the flavor result and respect limits',()=>{
 const r=R.createRound(),o=r.queue[0];
 assert.equal(R.flavorFor(o),'balanced');
 assert.equal(R.tune(r,'water',1),null);
 assert.ok(R.accept(r,o.id));advance(r,1);
 assert.equal(R.tune(r,'nope',1),null);
 R.tune(r,'water',1);R.tune(r,'water',1);R.tune(r,'water',1);
 assert.equal(o.water,240);assert.equal(R.flavorFor(o),'light');assert.equal(o.choice,'light');
 for(let i=0;i<30;i++)R.tune(r,'water',-1);
 assert.equal(o.water,165);assert.equal(R.flavorFor(o),'rich');
 assert.equal(R.tune(r,'temp',99).value,98);
 assert.ok(R.brew(r));assert.equal(R.tune(r,'water',1),null);
});
test('a different flavor remains a valid sale but earns fewer points',()=>{
 const r=R.createRound(),id=r.queue[0].id;R.accept(r,id);advance(r,1);assert.equal(R.choose(r,'rich'),true);assert.equal(R.choose(r,'invalid'),false);R.brew(r);assert.equal(R.choose(r,'light'),false);advance(r,4);R.resolve(r,id,'served');assert.equal(r.points,70);assert.equal(r.perfect,0);assert.equal(r.revenue,30);
});
test('three cups progress independently while focus changes',()=>{
 const r=R.createRound(),ids=r.queue.map(o=>o.id);
 for(const id of ids)assert.ok(R.accept(r,id));advance(r,1);
 for(const o of r.queue)assert.equal(o.phase,'prepared');
 for(const id of ids){assert.ok(R.focus(r,id));align(r,r.queue.find(o=>o.id===id));assert.ok(R.brew(r));}
 advance(r,2);for(const o of r.queue){assert.equal(o.phase,'brewing');assert.ok(o.progress>.5);}
 R.focus(r,ids[0]);advance(r,2);for(const o of r.queue)assert.equal(o.phase,'ready');
 for(const id of ids)assert.ok(R.resolve(r,id,'served'));
 assert.equal(r.served,3);assert.equal(r.points,300);assert.equal(r.queue.length,2);
});
test('expelling one concurrent drink leaves the other cups brewing',()=>{
 const r=R.createRound(),ids=r.queue.map(o=>o.id);
 for(const id of ids)R.accept(r,id);advance(r,1);
 for(const id of ids){R.focus(r,id);R.brew(r);}advance(r,1);
 R.resolve(r,ids[1],'expelled');advance(r,3);
 assert.equal(r.queue.find(o=>o.id===ids[0]).phase,'ready');assert.equal(r.queue.find(o=>o.id===ids[2]).phase,'ready');assert.equal(r.served,0);assert.equal(r.expelled,1);
});
test('timed departures release the selected order without blocking remaining stations',()=>{
 const r=R.createRound('rush');serve(r);const id=r.queue[0].id;assert.ok(R.accept(r,id));advance(r,36);assert.ok(!r.queue.find(x=>x.id===id));assert.notEqual(r.activeId,id);assert.ok(r.queue.length<=3);
});
test('serving the middle cup does not move the other two workstations',()=>{
 const r=R.createRound(),[first,middle,last]=r.queue;
 assert.deepEqual(r.queue.map(o=>o.slot),[0,1,2]);
 R.accept(r,middle.id);advance(r,1);R.brew(r);advance(r,4);R.resolve(r,middle.id,'served');
 assert.equal(r.queue.find(o=>o.id===first.id).slot,0);assert.equal(r.queue.find(o=>o.id===last.id).slot,2);
 const newcomer=r.queue.find(o=>![first.id,last.id].includes(o.id));assert.equal(newcomer.slot,1);
 assert.equal(new Set(r.queue.map(o=>o.slot)).size,3);
});
test('a vacated station remains empty until a new guest uses it in rush mode',()=>{
 const r=R.createRound('rush'),middle=r.queue[1];R.resolve(r,middle.id,'expelled');
 assert.deepEqual(r.queue.map(o=>o.slot),[0,2]);advance(r,11);
 assert.equal(new Set(r.queue.map(o=>o.slot)).size,3);assert.ok(r.queue.some(o=>o.slot===1));
});
test('an expelled guest leaves a half-price comfort fee plus combo coins',()=>{
 const r=R.createRound('relax'),o=r.queue[0],price=R.menuFor(o).price;
 const res=R.resolve(r,o.id,'expelled',6);
 assert.equal(res.comp,Math.round(price*.5)+6);
 assert.equal(r.expelled,1);assert.equal(r.served,0);
 assert.equal(r.revenue,res.comp);assert.equal(r.compensation,res.comp);
 assert.equal(r.points,0);assert.equal(R.summary(r).compensation,res.comp);
 const r2=R.createRound(),o2=r2.queue[1];
 const res2=R.resolve(r2,o2.id,'expelled',0);
 assert.equal(res2.comp,Math.round(R.menuFor(o2).price*.5));
 assert.equal(r2.revenue,res2.comp);assert.equal(r2.compensation,res2.comp);
});
test('each round has one identifiable troublemaker, while ordinary guests stay ordinary',()=>{
 for(const mode of ['relax','rush']){
  const r=R.createRound(mode),seen=[];
  while(r.queue.length){const o=r.queue[0];seen.push(o);R.resolve(r,o.id,'expelled');}
  assert.equal(seen.filter(o=>o.trouble).length,1);
  assert.equal(seen.find(o=>o.trouble).name,'阿刺');
  assert.equal(seen[0].trouble,false);
  assert.equal(r.status,'finished');
 }
});
test('clearing the troublemaker preserves earned points and other cups, and cannot pay twice',()=>{
 const r=R.createRound();serve(r);const trouble=r.queue.find(o=>o.trouble),normal=r.queue.find(o=>!o.trouble);
 R.accept(r,trouble.id);R.accept(r,normal.id);advance(r,1);R.focus(r,normal.id);R.brew(r);
 const points=r.points,money=r.revenue,slot=normal.slot;
 const result=R.resolve(r,trouble.id,'expelled',4);
 assert.equal(result.penalty,0);assert.equal(r.points,points);assert.equal(r.revenue,money+19);
 assert.equal(R.summary(r).troubleCleared,1);assert.equal(normal.slot,slot);assert.equal(normal.phase,'brewing');
 advance(r,4);assert.equal(normal.phase,'ready');assert.equal(R.resolve(r,trouble.id,'expelled',4),null);
 R.resolve(r,normal.id,'expelled');assert.equal(r.points,points-20);
});
