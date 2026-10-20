/* Deterministic educational brewing model. These are teaching estimates, not laboratory measurements. */
(function(root){
 'use strict';
 const WetBed=root.CoffeePourBed||(typeof require==='function'?require('./pour-bed.js'):null);
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function create(tool='melitta'){return{tool,dose:0,whole:0,grind:3,filter:false,oriented:true,rinsed:false,water:0,brewWater:0,retained:0,bed:0,liquid:0,contact:0,simTime:0,brewStart:null,lastWet:null,tempSum:0,tempWeight:0,brewTemp:20,wet:Array(8).fill(0),wetMap:WetBed?WetBed.create():[],filteredWater:0,unfilteredWater:0,hadFilter:false,pourCount:0,pourActive:false,firstPour:0,bloomPause:0,lastStop:null,spilled:0,overflow:0,removed:false,discarded:0,events:[]};}
 function event(m,text){m.events.push({time:Math.round(m.simTime),text});if(m.events.length>60)m.events.shift();}
 function addGrounds(m,grams,grind,whole=false){if(grams<=0)return;const total=m.dose+grams;m.grind=(m.grind*m.dose+grind*grams)/total;m.dose=total;if(whole)m.whole+=grams;m.removed=false;event(m,`${whole?'投入整豆':'投入咖啡粉'} ${grams.toFixed(1)}g${whole?'':`，研磨 ${grind.toFixed(1)}/5`}`);}
 function addWater(m,grams,temp,sector=0,point=null){if(grams<=0)return;const heatMass=m.bed+m.liquid+m.retained;m.brewTemp=(m.brewTemp*heatMass+temp*grams)/(heatMass+grams);m.water+=grams;const containsCoffee=m.dose>0&&!m.removed;
  if(containsCoffee){if(m.brewStart===null)m.brewStart=m.simTime;if(!m.pourActive){m.pourCount++;if(m.pourCount===2&&m.lastStop!==null)m.bloomPause=m.simTime-m.lastStop;}m.pourActive=true;if(m.pourCount===1)m.firstPour+=grams;m.brewWater+=grams;if(m.filter)m.filteredWater+=grams;else m.unfilteredWater+=grams;m.tempSum+=temp*grams;m.tempWeight+=grams;m.lastWet=m.simTime;m.wet[clamp(Math.floor(sector),0,7)]+=grams;if(point&&WetBed)WetBed.deposit(m.wetMap,point,grams);}
  if(m.filter){const absorb=Math.min(Math.max(0,m.dose*2-m.retained),grams);m.retained+=absorb;m.bed+=grams-absorb;const maxBed=m.tool==='chemex'?160:110;if(m.bed>maxBed){const lost=m.bed-maxBed;m.bed=maxBed;m.overflow+=lost;}}
  else m.liquid+=grams;
  const capacity=m.tool==='chemex'?600:400;if(m.liquid>capacity){m.overflow+=m.liquid-capacity;m.liquid=capacity;}
 }
 function stopPour(m){if(m.pourActive){m.lastStop=m.simTime;event(m,`停水：累计冲煮用水 ${Math.round(m.brewWater)}g`);}m.pourActive=false;}
 function tick(m,dt){m.simTime+=dt;const wet=m.filter?m.bed+m.retained*.4:m.liquid;const isWet=m.dose>0&&!m.removed&&wet>1;
  if(isWet){const tempFactor=Math.exp((m.brewTemp-92)/24),surface=Math.pow(1.42,3-m.grind),coverage=.78+.22*m.wet.filter(v=>v>0).length/8;const wholeFactor=m.dose?1-.92*m.whole/m.dose:1;
   const recent=m.lastWet===null?0:m.simTime-m.lastWet;const moisture=m.filter?clamp(m.bed/20+(recent<45?m.retained/50:0),0,1):1;
   m.contact+=dt*tempFactor*surface*coverage*moisture*wholeFactor;
  }
  if(m.filter&&m.bed>0){let rate=(m.tool==='chemex'?1.65:2.1)*Math.pow(1.45,m.grind-3);if(m.tool==='chemex'&&!m.oriented)rate*=.45;const out=Math.min(m.bed,rate*Math.sqrt(1+m.bed/40)*dt);m.bed-=out;m.liquid+=out;const capacity=m.tool==='chemex'?600:400;if(m.liquid>capacity){m.overflow+=m.liquid-capacity;m.liquid=capacity;}}
 }
 function discard(m){event(m,`倒掉 ${Math.round(m.bed+m.liquid)}g 液体`);m.discarded+=m.bed+m.liquid;m.bed=0;m.liquid=0;if(!m.filter){m.dose=0;m.whole=0;m.retained=0;}m.water=0;m.brewWater=0;m.filteredWater=0;m.unfilteredWater=0;m.contact=0;m.brewStart=null;m.tempSum=0;m.tempWeight=0;m.wet=Array(8).fill(0);m.wetMap=WetBed?WetBed.create():[];m.pourCount=0;m.firstPour=0;m.bloomPause=0;m.lastStop=null;m.pourActive=false;}
 function removeFilter(m){m.removed=true;m.filter=false;event(m,m.tool==='chemex'?'取出滤纸与粉渣':'移走滤杯');}
 function result(m){
  const dose=m.dose,volume=Math.max(0,m.liquid),yieldRatio=clamp(.28*(1-Math.exp(-m.contact/85)),0,.28),tds=volume>0?yieldRatio*dose/volume*100:0;
  const ratio=dose?m.brewWater/dose:0,coverage=m.wet.filter(v=>v>=1).length,unfiltered=m.unfilteredWater>0&&dose>0;
  const sour=clamp(28+Math.max(0,.185-yieldRatio)*480-(yieldRatio>.225?12:0),8,95);
  const bitter=clamp(18+Math.max(0,yieldRatio-.215)*850+(m.brewTemp>96?9:0),8,95);
  const body=clamp(tds*40+(unfiltered?18*(1-m.whole/Math.max(dose,1)):0),0,100),sweet=clamp(84-Math.abs(yieldRatio-.205)*850-Math.max(0,tds-1.8)*18,5,95);
  let title,description;
  if(volume<1){title='杯子里，还没有咖啡。';description=m.bed>1?'液体还在粉层里。等一会儿让它滴落，再来出杯。':'还没有可倒出的液体。你可以回到台面，继续这杯。';}
  else if(!dose){title='这一杯，是温水。';description='你向器具里注了水，但没有投入咖啡。水会流动，却不会带出咖啡的风味。';}
  else if(m.whole/dose>.8){title='一杯很淡的整豆浸泡。';description='整颗咖啡豆的接触面积很小，这次模拟得到的咖啡浓度很低。试着先把豆子磨开。';}
  else if(yieldRatio<.155){title=tds<.85?'偏酸，也有些单薄。':'酸感突出，风味还没展开。';description='这次模拟的萃取偏少，酸感可能尖锐，甜感较弱。';}
  else if(yieldRatio>.245){title='萃取得深了，苦涩感明显。';description='较充分的接触与萃取，可能让这杯出现明显苦味和干涩感。';}
  else if(tds<.85){title='轻得像茶，也可能有点淡。';description='这次萃取不一定不足，但溶解出来的风味被较多的水稀释了。';}
  else if(tds>2){title='这一杯，浓郁得很。';description='较高的咖啡浓度带来了厚重口感；是否喜欢，取决于你的偏好。';}
  else{title='甜感与浓度，找到了平衡。';description='这次模拟中，萃取与浓度较为协调，甜感更容易被感受到。';}
  if(unfiltered&&volume>0)description+=m.whole===dose?' 整豆没有经过过滤，仍留在壶中。':' 没有滤纸过滤，杯中会留有细粉与沉淀，口感更厚重。';
  const reasons=[];
  if(dose===0)reasons.push({cause:'没有投入咖啡',effect:'杯中只有水，无法萃取咖啡风味。',next:'先磨豆并投粉，再观察相同水量的变化。'});
  else{
   reasons.push({cause:`粉量 ${dose.toFixed(1)}g，冲煮水 ${Math.round(m.brewWater)}g（1:${ratio.toFixed(1)}）`,effect:ratio>20?'较多的水让浓度更低，口感更轻。':ratio<12?'较少的水让浓度更高，口感更集中。':'粉水比处于常见练习范围，仍要结合萃取判断浓淡。',next:tds<.85?'先减少一点用水，保持其他条件。':tds>2?'先增加一点用水，保持其他条件。':'保留粉水比，下次只调整一个其他变量。'});
   reasons.push({cause:`实际平均注水温度 ${Math.round(m.brewTemp)}°C`,effect:m.brewTemp<85?'较低水温让本次模拟的风味溶出变慢。':m.brewTemp>96?'较高水温让本次模拟的萃取更充分。':'水温为风味溶出提供了适中的条件。',next:m.brewTemp<85?'如果入口尖酸，下次试着提高水温。':m.brewTemp>96?'如果口感干涩，下次试着降低几度。':'先保留水温，比较其他变量的作用。'});
   reasons.push({cause:`研磨 ${['','细','中细','中','中粗','粗'][Math.round(m.grind)]}，有效接触约 ${Math.round(m.contact)} 秒`,effect:yieldRatio<.155?'接触面积或时间不足，模拟萃取量偏少。':yieldRatio>.245?'接触面积或时间偏多，模拟苦涩风险增加。':'接触面积与时间共同影响了本次萃取。',next:yieldRatio<.155?'先把研磨调细一点，或延长等待时间。':yieldRatio>.245?'先把研磨调粗一点，或缩短接触时间。':'试着保持研磨，调整注水节奏比较。'});
   if(m.whole>0)reasons.push({cause:`有 ${m.whole.toFixed(1)}g 整豆直接进入器具`,effect:'完整豆子接触面积小，本次萃取效率降低。',next:'下一杯把相同质量的豆子先研磨。'});
   if(unfiltered)reasons.push({cause:'没有放入滤纸',effect:m.whole===dose?'整豆与液体没有分离，仍留在壶内。':'液体与细粉直接留在壶内，沉淀与厚重感更明显。',next:'放好匹配的滤纸，再比较杯中清澈度。'});
   if(m.hadFilter&&!m.rinsed)reasons.push({cause:'没有润纸并倒掉预热水',effect:'省略了预热与润纸准备，可能带入纸味。',next:'先润纸、倒掉预热水，再投粉。'});
   if(m.tool==='chemex'&&m.hadFilter&&!m.oriented)reasons.push({cause:'Chemex 滤纸三层面未对准壶嘴',effect:'本次模拟的排气受阻，下水速度变慢。',next:'把三层面对准壶嘴，留出排气通道。'});
   if(m.pourCount===1)reasons.push({cause:'从开始到结束连续注水，没有停水闷蒸',effect:'没有单独的湿润与排气等待阶段。',next:'下一杯先少量打湿，停一会儿再继续。'});
   else if(m.firstPour>0)reasons.push({cause:`第一段 ${Math.round(m.firstPour)}g，停水约 ${Math.round(m.bloomPause)} 秒`,effect:'这就是你实际采用的闷蒸与续水节奏。',next:'保留其他条件，只改变这段等待来比较。'});
  }
  if(m.overflow>1)reasons.push({cause:`水位过高，约 ${Math.round(m.overflow)}g 溢出`,effect:'部分注入的水没有留在器具中。',next:'下次减小流速，等水位下降后再注水。'});
  if(m.spilled>1)reasons.push({cause:`壶嘴偏离器具，约 ${Math.round(m.spilled)}g 洒到台面`,effect:'洒出的水没有计入有效冲煮用水。',next:'移动壶嘴前先减小水流，观察落点。'});
  const intensity=clamp(tds/.65,0,1);if(volume<1){reasons.length=0;reasons.push({cause:m.water>0?'液体尚未滴到壶里':'还没有注水',effect:'杯中没有可供品尝的液体。',next:m.water>0?'回到台面，等待滴滤后再出杯。':'回到台面，拿起水壶注入器具。'});}if(dose&&m.water-m.brewWater>20)reasons.push({cause:`有约 ${Math.round(m.water-m.brewWater)}g 水没有经过本次粉层`,effect:'这些水加入液体后，会降低杯中浓度。',next:'比较保留或倒掉这部分水，观察浓度变化。'});return{title,description,volume:Math.round(volume),dose,water:Math.round(m.brewWater),temp:Math.round(m.brewTemp),ratio,extraction:yieldRatio*100,tds,profile:[{name:'酸感',value:!dose||volume<1?0:sour*intensity},{name:'甜感',value:!dose||volume<1?0:sweet*intensity},{name:'苦感',value:!dose||volume<1?0:bitter*intensity},{name:'醇厚',value:!dose||volume<1?0:body}],reasons,coverage,unfiltered};
 }
 const api={create,event,addGrounds,addWater,stopPour,tick,discard,removeFilter,result};root.BrewModel=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
