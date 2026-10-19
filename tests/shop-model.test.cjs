const test=require('node:test'),assert=require('node:assert/strict'),S=require('../shop-model.js');

test('the shop starts with three method stations and can add a second pour station',()=>{
 const s=S.newState();
 assert.deepEqual(S.stationList(s).map(x=>x.type),['pour','press','espresso']);
 s.upgrades.station=true;
 assert.deepEqual(S.stationList(s).map(x=>x.type),['pour','press','espresso','pour']);
});

test('each drink belongs to exactly one station type',()=>{
 assert.equal(S.DRINKS.melitta.station,'pour');
 assert.equal(S.DRINKS.frenchpress.station,'press');
 assert.equal(S.DRINKS.espresso.station,'espresso');
 assert.equal(S.DRINKS.latte.station,'espresso');
 assert.equal(S.availableDrinks().length,4);
});

test('targets scale with cup size and never drift',()=>{
 const m=S.targetsFor('melitta','medium'),l=S.targetsFor('melitta','large');
 assert.deepEqual(m,{dose:15,water:225,temp:92,grind:3,milk:0,time:3.2});
 assert.equal(l.dose,19);assert.equal(l.water,281);
 const e=S.targetsFor('espresso','medium');
 assert.equal(e.dose,20);assert.equal(e.water,36);assert.equal(e.grind,1);
});

test('price follows drink, size and the signboard upgrade',()=>{
 const s=S.newState();
 assert.equal(S.priceFor(s,'latte','medium'),34);
 assert.equal(S.priceFor(s,'latte','large'),43);
 s.upgrades.sign=true;
 assert.equal(S.priceFor(s,'latte','medium'),35);
});

test('ingredients scale with size and are really deducted',()=>{
 const s=S.newState();
 const need=S.ingredientsFor(s,'latte','large');
 assert.deepEqual(need,{beans:25,milk:189,cups:1});
 const before={...s.stock};
 S.consume(s,'latte','large');
 assert.equal(s.stock.beans,before.beans-25);
 assert.equal(s.stock.milk,before.milk-189);
 assert.equal(s.stock.cups,before.cups-1);
});

test('brewing is blocked and named when supplies run out',()=>{
 const s=S.newState();
 s.stock.beans=10;s.stock.milk=0;
 const r=S.canBrew(s,'latte','medium');
 assert.equal(r.ok,false);
 assert.deepEqual(r.short,['咖啡豆','牛奶']);
});

test('quality rewards hitting the measured targets',()=>{
 const perfect=S.qualityFor({dose:15,targetDose:15,water:225,targetWater:225,grind:3,targetGrind:3,temp:92,targetTemp:92,extraScore:1});
 assert.equal(perfect,1);
 const overDose=S.qualityFor({dose:21,targetDose:15,water:225,targetWater:225,grind:3,targetGrind:3,temp:92,targetTemp:92,extraScore:1});
 assert.ok(overDose<perfect);
 const wrongGrind=S.qualityFor({dose:15,targetDose:15,water:225,targetWater:225,grind:5,targetGrind:3,temp:92,targetTemp:92,extraScore:1});
 assert.ok(wrongGrind<perfect);
 const wrongMethod=S.qualityFor({dose:15,targetDose:15,water:225,targetWater:225,grind:3,targetGrind:3,temp:92,targetTemp:92,extraScore:1,methodMatch:false});
 assert.ok(wrongMethod<=.25);
});

test('payment, tips and reputation follow quality and method',()=>{
 const s=S.newState(),order={drinkId:'melitta',size:'medium'};
 const good=S.saleFor(s,order,{quality:1,methodMatch:true});
 assert.equal(good.pay,30);assert.equal(good.tip,4);assert.ok(good.rep>0);
 const meh=S.saleFor(s,order,{quality:.7,methodMatch:true});
 assert.ok(meh.pay<good.pay);assert.equal(meh.tip,0);
 const wrong=S.saleFor(s,order,{quality:1,methodMatch:false});
 assert.ok(wrong.pay<good.pay/2);assert.ok(wrong.rep<0);
 assert.equal(S.reputationDelta('lost'),-.12);
});

test('later days bring more guests, less patience and higher rent',()=>{
 const s=S.newState(),d1=S.dayPlan(1,s),d5=S.dayPlan(5,s),d7=S.dayPlan(7,s);
 assert.equal(d1.count,4);
 assert.ok(d5.count>d1.count);
 assert.ok(d7.count<=9);
 assert.ok(d5.interval<d1.interval);
 assert.ok(d5.patience<d1.patience);
 assert.ok(d5.rent>d1.rent);
 s.upgrades.sign=true;
 assert.ok(S.dayPlan(5,s).count>=d5.count);
});

test('orders are deterministic, always orderable, and stay in range',()=>{
 const s=S.newState();
 const a=S.makeOrder(S.rngFrom(7),s,3),b=S.makeOrder(S.rngFrom(7),s,3);
 assert.deepEqual(a,b);
 const ids=S.availableDrinks();
 for(let i=1;i<=40;i++){
  const o=S.makeOrder(S.rngFrom(i),s,6);
  assert.ok(ids.includes(o.drinkId),o.drinkId);
  assert.ok(['medium','large'].includes(o.size));
 }
});

test('shopping deducts cash and refuses when it is short',()=>{
 const s=S.newState();
 const r=S.buySupply(s,'beans');
 assert.equal(r.ok,true);assert.equal(s.money,160-33);assert.equal(s.stock.beans,1200);
 s.money=6;
 assert.equal(S.buySupply(s,'milk').ok,false);
 assert.equal(s.money,6);
});

test('upgrades are one-time purchases',()=>{
 const s=S.newState();s.money=1000;
 assert.equal(S.buyUpgrade(s,'grinder').ok,true);
 assert.equal(s.money,840);
 assert.equal(S.buyUpgrade(s,'grinder').ok,false);
 assert.equal(S.buyUpgrade(s,'station').ok,true);
 assert.equal(s.money,540);
});

test('settling pays the rent, moves reputation and advances the day',()=>{
 const s=S.newState();
 const out=S.settleDay(s,{revenue:220,tips:20,served:5,lost:1,turnedAway:0,repDelta:.12,plan:S.dayPlan(1,s)});
 assert.equal(out.gross,240);
 assert.equal(out.costs,62);
 assert.equal(out.profit,178);
 assert.equal(s.money,160+178);
 assert.equal(s.rep,3.12);
 assert.equal(s.day,2);
 assert.equal(s.history.length,1);
 assert.equal(s.history[0].served,5);
 assert.equal(s.totalLost,1);
});

test('the week closes on day seven with a goal verdict',()=>{
 const s=S.newState();s.day=7;s.money=1200;s.rep=4.4;
 const out=S.settleDay(s,{revenue:100,served:4,plan:S.dayPlan(7,s)});
 assert.equal(out.finalDay,true);
 assert.equal(s.finished,true);
 assert.equal(S.goalStatus(s).done,true);
 s.rep=3.7;assert.equal(S.goalStatus(s).done,false);
});

test('stars render as full, half and empty',()=>{
 assert.deepEqual(S.starArray(3),['full','full','full','empty','empty']);
 assert.deepEqual(S.starArray(4.5),['full','full','full','full','half']);
 assert.deepEqual(S.starArray(1),['full','empty','empty','empty','empty']);
});
