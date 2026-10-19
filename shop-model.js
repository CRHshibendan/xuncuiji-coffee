/* Deterministic coffee-shop management model for 一日店长. Practice numbers, not real economics. */
(function(root){
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const round2=n=>Math.round(n*100)/100;

 const SIZES={
  medium:{id:'medium',label:'中杯',price:1,beans:1,milk:1,water:1,time:0},
  large:{id:'large',label:'大杯',price:1.26,beans:1.25,milk:1.35,water:1.25,time:.6}
 };

 /* Each drink is tied to one station type. The numbers are the shop's practice targets. */
 const DRINKS={
  melitta:{name:'手冲 Melitta',station:'pour',price:30,dose:15,water:225,temp:92,grind:3,kind:'pour',time:3.2,beans:15,milk:0},
  frenchpress:{name:'法压壶',station:'press',price:30,dose:20,water:260,temp:94,grind:4,kind:'steep',time:6,beans:20,milk:0},
  espresso:{name:'浓缩',station:'espresso',price:26,dose:20,water:36,temp:93,grind:1,kind:'extract',time:3.6,beans:20,milk:0},
  latte:{name:'拿铁',station:'espresso',price:34,dose:20,water:36,temp:93,grind:1,kind:'extract',time:3.6,beans:20,milk:140}
 };

 const STATIONS={
  pour:{name:'手冲台',short:'手冲',hint:'称豆 → 磨豆 → 投粉 → 注水 → 滴滤 → 出杯'},
  press:{name:'法压台',short:'法压',hint:'称豆 → 磨豆 → 投粉 → 注水 → 浸泡 → 下压 → 出杯'},
  espresso:{name:'意式机',short:'意式',hint:'称豆 → 磨豆 → 装粉 → 压粉 → 锁柄 → 萃取 → 出杯'}
 };

 const UPGRADES={
  grinder:{name:'磨豆机',cost:160,desc:'磨豆更快，研磨更稳，品质 +0.02。'},
  kettle:{name:'快冲水壶',cost:200,desc:'注水更快，水量更容易停准。'},
  station:{name:'再加一台手冲位',cost:300,desc:'手冲可以两杯并行，缓解排队。'},
  sign:{name:'门口招牌',cost:150,desc:'客流 +25%，也更忙。'}
 };

 const PACKS={
  beans:{label:'咖啡豆',detail:'300 g',price:33,add:{beans:300}},
  milk:{label:'牛奶',detail:'1000 ml',price:16,add:{milk:1000}},
  cups:{label:'杯子',detail:'50 只',price:28,add:{cups:50}}
 };

 const GOAL={money:900,rep:3.9};

 function newState(){
  return{version:2,day:1,money:160,rep:3,stock:{beans:900,milk:1200,cups:45},
   upgrades:{grinder:false,kettle:false,station:false,sign:false},
   totalRevenue:0,totalServed:0,totalLost:0,history:[],finished:false};
 }

 function stationList(state){
  const list=[
   {id:'pour1',type:'pour',name:'手冲台',short:'手冲'},
   {id:'press1',type:'press',name:'法压台',short:'法压'},
   {id:'esp1',type:'espresso',name:'意式机',short:'意式'}
  ];
  if(state.upgrades.station)list.push({id:'pour2',type:'pour',name:'手冲台 2',short:'手冲'});
  return list;
 }

 function availableDrinks(){return Object.keys(DRINKS);}

 function priceFor(state,drinkId,size='medium'){
  const d=DRINKS[drinkId],s=SIZES[size]||SIZES.medium;
  return Math.round(d.price*s.price*(state.upgrades.sign?1.04:1));
 }

 function targetsFor(drinkId,size='medium'){
  const d=DRINKS[drinkId],s=SIZES[size]||SIZES.medium;
  return{dose:Math.round(d.dose*s.beans),water:Math.round(d.water*s.water),temp:d.temp,grind:d.grind,milk:Math.round(d.milk*s.milk),time:round2(d.time+s.time)};
 }

 function ingredientsFor(state,drinkId,size='medium'){
  const d=DRINKS[drinkId],s=SIZES[size]||SIZES.medium;
  return{beans:Math.round(d.beans*s.beans),milk:Math.round(d.milk*s.milk),cups:1};
 }

 function canBrew(state,drinkId,size='medium'){
  const need=ingredientsFor(state,drinkId,size),short=[];
  if(state.stock.beans<need.beans)short.push('咖啡豆');
  if(state.stock.milk<need.milk)short.push('牛奶');
  if(state.stock.cups<need.cups)short.push('杯子');
  return{ok:short.length===0,need,short};
 }

 function consume(state,drinkId,size='medium'){
  const need=ingredientsFor(state,drinkId,size);
  state.stock.beans=Math.max(0,state.stock.beans-need.beans);
  state.stock.milk=Math.max(0,state.stock.milk-need.milk);
  state.stock.cups=Math.max(0,state.stock.cups-need.cups);
  return need;
 }

 function dayPlan(day,state){
  const traffic=state.upgrades.sign?1.25:1;
  const count=Math.min(9,Math.round((3+day)*traffic));
  const interval=Math.max(10.5,15-day*.65);
  const patience=Math.max(55,85-day*4);
  const rent=55+day*7;
  return{count,interval,patience,rent,salary:0,duration:Math.round(count*interval+20)};
 }

 function rngFrom(seed){
  let a=(seed>>>0)||1;
  return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 }

 function makeOrder(rng,state,day=1){
  const ids=availableDrinks();
  const weights=ids.map(id=>id==='melitta'?3:id==='frenchpress'?2:id==='latte'?1.6:2);
  const total=weights.reduce((a,b)=>a+b,0);
  let pick=rng()*total,drinkId=ids[ids.length-1];
  for(let i=0;i<ids.length;i++){pick-=weights[i];if(pick<=0){drinkId=ids[i];break;}}
  const largeChance=Math.min(.36,.14+day*.03);
  const size=rng()<largeChance?'large':'medium';
  return{drinkId,size};
 }

 /* Scores the actions the player actually performed. Omitted values mean "not measured". */
 function qualityFor(o={}){
  const doseT=o.targetDose||1,waterT=o.targetWater||1;
  const near=(v,t,tol)=>clamp(1-Math.abs(v-t)/(t*tol),0,1);
  const doseScore=near(o.dose==null?doseT:o.dose,doseT,.3);
  const waterScore=near(o.water==null?waterT:o.water,waterT,.22);
  const grindScore=clamp(1-Math.abs((o.grind==null?3:o.grind)-(o.targetGrind==null?3:o.targetGrind))/2.2,0,1);
  const tempScore=clamp(1-Math.abs((o.temp==null?92:o.temp)-(o.targetTemp==null?92:o.targetTemp))/18,0,1);
  const extra=o.extraScore==null?.85:o.extraScore;
  let q=doseScore*.22+waterScore*.3+grindScore*.18+tempScore*.1+extra*.2;
  if(o.methodMatch===false)q=Math.min(q,.25);
  if(o.grinder)q+=.02;
  return clamp(q,0,1);
 }

 function qualityLabel(q){
  if(q>=.93)return{label:'完美出杯',tone:'perfect'};
  if(q>=.82)return{label:'客人的眼睛亮了',tone:'good'};
  if(q>=.68)return{label:'还行，能入口',tone:'okay'};
  if(q>=.45)return{label:'这杯有点急',tone:'meh'};
  return{label:'客人皱了下眉',tone:'bad'};
 }

 function saleFor(state,order,result={}){
  const quality=clamp(result.quality==null?.8:result.quality,0,1);
  const methodMatch=result.methodMatch!==false;
  const base=priceFor(state,order.drinkId,order.size);
  const pay=methodMatch?Math.max(1,Math.round(base*(.5+.5*quality))):Math.round(base*.35);
  const tip=methodMatch?(quality>=.92?4:quality>=.8?2:0):0;
  const rep=methodMatch?(quality-.65)*.07:-.16;
  return{base,pay,tip,rep,methodMatch,quality};
 }

 function reputationDelta(kind,quality){
  if(kind==='served')return clamp(((quality==null?.8:quality)-.65)*.07,-.03,.03);
  if(kind==='lost')return -.12;
  if(kind==='turnedAway')return -.04;
  return 0;
 }

 function buySupply(state,kind){
  const pack=PACKS[kind];if(!pack)return{ok:false,reason:'没有这种货'};
  if(state.money<pack.price)return{ok:false,reason:'现金不够'};
  state.money-=pack.price;
  for(const [k,v] of Object.entries(pack.add))state.stock[k]=(state.stock[k]||0)+v;
  return{ok:true,pack};
 }

 function buyUpgrade(state,id){
  const up=UPGRADES[id];if(!up)return{ok:false,reason:'没有这件设备'};
  if(state.upgrades[id])return{ok:false,reason:'已经拥有了'};
  if(state.money<up.cost)return{ok:false,reason:'现金不够'};
  state.money-=up.cost;state.upgrades[id]=true;
  return{ok:true,upgrade:up};
 }

 function settleDay(state,report={}){
  const plan=report.plan||dayPlan(state.day,state);
  const revenue=Math.round(report.revenue||0),tips=Math.round(report.tips||0);
  const gross=revenue+tips,costs=plan.rent+plan.salary,profit=gross-costs;
  state.money=Math.round(state.money+profit);
  state.rep=round2(clamp(state.rep+(report.repDelta||0),1,5));
  state.totalRevenue+=gross;
  state.totalServed+=report.served||0;
  state.totalLost+=(report.lost||0)+(report.turnedAway||0);
  const entry={day:state.day,revenue:gross,profit,served:report.served||0,lost:report.lost||0,turnedAway:report.turnedAway||0,rep:state.rep};
  state.history.push(entry);
  const finalDay=state.day>=7;
  state.day+=1;
  if(finalDay)state.finished=goalStatus(state).done;
  return{entry,plan,gross,costs,profit,money:state.money,rep:state.rep,finalDay};
 }

 function goalStatus(state){
  const moneyOk=state.money>=GOAL.money,repOk=state.rep>=GOAL.rep;
  return{moneyTarget:GOAL.money,repTarget:GOAL.rep,moneyOk,repOk,done:moneyOk&&repOk,weekOver:state.day>=7&&state.finished};
 }

 function starArray(rep){
  const value=clamp(rep,1,5),out=[];
  for(let i=1;i<=5;i++)out.push(value>=i?'full':value>=i-.5?'half':'empty');
  return out;
 }

 const api={SIZES,DRINKS,STATIONS,UPGRADES,PACKS,GOAL,
  newState,stationList,availableDrinks,priceFor,targetsFor,ingredientsFor,canBrew,consume,
  dayPlan,rngFrom,makeOrder,qualityFor,qualityLabel,saleFor,reputationDelta,
  buySupply,buyUpgrade,settleDay,goalStatus,starArray};
 root.CoffeeShop=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
