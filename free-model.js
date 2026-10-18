'use strict';
// An educational simulation. It compares actions; it does not measure real flavour.
const CoffeeFree=(()=>{
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const specs={moka:{dose:18,water:150,time:30,grind:2,cap:200},coldbrew:{dose:50,water:500,time:43200,grind:5,cap:900},espresso:{dose:18,water:36,time:28,grind:1,cap:60},siphon:{dose:20,water:300,time:60,grind:3,cap:450},frenchpress:{dose:25,water:400,time:240,grind:4,cap:700}};
 function create(id){return{id,beans:0,grounds:0,groundGrind:specs[id].grind,dose:0,water:0,temp:id==='coldbrew'?4:20,batches:[],done:[],basket:false,sealed:false,filter:false,lid:false,distributed:false,tamped:false,locked:false,warm:0,heat:0,rise:0,returned:0,plunge:0,contact:0,output:0,served:0,stirs:0,hotTime:0,highHeatTime:0,spilled:0,events:[],issues:[],cup:null};}
 function log(s,text){s.events.push(text);if(s.events.length>100)s.events.shift();return text;}
 function mark(s,t){if(!s.done.includes(t))s.done.push(t);}
 function grind(s){return s.batches.reduce((n,b)=>n+b.dose*b.grind,0)/(s.dose||1);}
 function wet(s){return s.dose>0&&s.water>0&&(s.id!=='siphon'||s.rise>.2);}
 function issue(s,text){if(!s.issues.includes(text))s.issues.push(text);return log(s,text);}
 function action(s,token,p,extra={}){
  const spec=specs[s.id];
  if(token==='beans'){s.beans+=p.dose;return log(s,`向磨豆机加入 ${p.dose}g 豆子。`);}
  if(token==='grind'){if(!s.beans)return log(s,'磨豆机里没有豆子，这次空转没有产生咖啡粉。');s.groundGrind=(s.groundGrind*s.grounds+p.grind*s.beans)/(s.grounds+s.beans);const amount=s.beans;s.grounds+=amount;s.beans=0;return log(s,`磨好 ${amount}g，研磨 ${p.grind} 档。`);}
  if(token==='coffee'){
   if(s.id==='moka'&&s.sealed||s.id==='espresso'&&s.locked)return log(s,'壶体已拧合 / 手柄已锁入。先取下，再添加咖啡粉。');
   if(s.grounds<=0)return log(s,'接粉杯还是空的。可以先加豆转柄，磨好以后再投粉。');
   const amount=Math.min(p.dose,s.grounds);s.grounds-=amount;s.dose+=amount;s.batches.push({dose:amount,grind:s.groundGrind,contact:0,exposure:0,active:true});if(s.id==='coldbrew'&&s.filter){s.filter=false;s.done=s.done.filter(t=>t!=='filter');}mark(s,'coffee');s.distributed=false;s.tamped=false;
   if(s.id==='moka'&&!s.basket)issue(s,'粉槽没有装好，咖啡粉落在下壶；清空器具后重做才能正确冲煮。');
   return log(s,`投入 ${amount.toFixed(0)}g 粉，壶内累计 ${s.dose.toFixed(0)}g。`);
  }
  if(token==='water'){
   if(s.id==='moka'&&s.sealed)return log(s,'摩卡壶已拧合，水不能从壶顶进入下壶。先离火冷却并打开。');
   const accepted=Math.max(0,Math.min(p.water,spec.cap-s.water));s.water+=accepted;s.spilled+=p.water-accepted;s.temp=s.water?((s.water-accepted)*s.temp+accepted*p.temp)/s.water:p.temp;mark(s,'water');
   if(p.water>accepted)issue(s,`超过示意壶容量，${Math.round(p.water-accepted)}g 水溢出，没有计入壶中。`);
   return log(s,`加入 ${Math.round(accepted)}g 水，壶内累计 ${Math.round(s.water)}g。`);
  }
  if(token==='basket'){s.basket=true;mark(s,token);return log(s,'粉槽已放入。');}
  if(token==='seal'){s.sealed=!s.sealed;if(s.sealed)mark(s,'seal');else s.done=s.done.filter(t=>t!=='seal');return log(s,s.sealed?'上下壶已拧合。':'上下壶已分开。');}
  if(token==='open'){
   if(s.heat>0)return log(s,'壶体仍热，先选择“离火冷却”。热壶不能直接拆开。');
   s.sealed=false;s.locked=false;s.done=s.done.filter(t=>!['seal','lock'].includes(t));return log(s,'壶体 / 手柄已经取下，可以重新装粉。');
  }
  if(token==='cool'){s.heat=0;s.temp=20;return log(s,'已离火，并在模拟中等待冷却。');}
  if(token==='lid'){s.lid=!s.lid;s.done=s.done.filter(t=>t!=='lid');if(s.lid)mark(s,'lid');return log(s,s.lid?'已加盖，进入冷藏环境。':'已打开盖子。');}
  if(token==='filter'){if(s.id==='coldbrew')s.batches.forEach(b=>b.active=false);s.filter=true;mark(s,'filter');return log(s,s.id==='coldbrew'?'已过滤分离，继续浸泡不会再接触粉渣。':'滤器已装入。');}
  if(token==='stir'||token==='distribute'){s.stirs++;if(token==='distribute')s.distributed=true;mark(s,token);return log(s,token==='distribute'?'完成一次布粉。':'完成一次轻搅。');}
  if(token==='tamp'){s.tamped=true;mark(s,token);return log(s,'粉饼已压平。');}
  if(token==='lock'){s.locked=true;mark(s,token);return log(s,'手柄已锁入冲煮头。');}
  if(token==='plunge'){s.plunge=clamp(extra.progress??1,0,1);mark(s,'plunge');if(extra.fast)s.fastPress=true;return log(s,'滤网已下压；仍要倒出才与粉渣分开。');}
  if(token==='serve'){return pour(s,p);}
  return log(s,'已操作。');
 }
 function tick(s,token,dt,p){
  if(!Number.isFinite(dt)||dt<=0)return;const spec=specs[s.id];
  if(token==='preheat'){s.warm=clamp(s.warm+dt/2,0,1);mark(s,token);return;}
  if(token==='heat'){
   s.heat+=dt*p.heat;s.temp=Math.min(100,s.temp+dt*8*p.heat);s.hotTime+=dt;if(p.heat>=3)s.highHeatTime+=dt;
   if(!s.water){issueOnce(s,'空壶加热，没有咖啡出液；实物不能空烧。');return;}
   if(!s.sealed||!s.basket||s.water>150||s.dose>22||s.issues.some(t=>t.includes('粉槽没有装好'))){issueOnce(s,'壶体、粉槽、水位或装粉不合适，加热没有形成有效出液。');return;}
   const available=Math.max(0,s.water-s.dose*1.7);s.output=Math.min(available,s.output+dt*p.heat*available/12);s.contact+=dt*5;expose(s,dt*5,p);mark(s,'heat');return;
  }
  if(token==='rise'){
   if(!s.water){issueOnce(s,'下壶没有水，加热没有升水；实物不能空烧。');return;}
   s.rise=clamp(s.rise+dt/5,0,1);s.returned=0;s.temp=93;s.heat+=dt;if(s.rise>=1)mark(s,'rise');if(wet(s)){s.contact+=dt*10;expose(s,dt*10,p);}return;
  }
  if(token==='drawdown'){
   s.heat=0;if(s.rise<=0){issueOnce(s,'还没有升水，上壶没有可回流的液体。');return;}
   s.returned=clamp(s.returned+dt/3,0,1);if(s.returned>=1){mark(s,'drawdown');s.rise=0;}return;
  }
  if(token==='extract'){
   if(!s.locked){issueOnce(s,'手柄没有锁入，水未经过粉碗形成饮品。');return;}
   const seconds=dt*5,g=s.dose?grind(s):5,uneven=(s.distributed?1:1.35)*(s.tamped?1:1.7),flow=1.3*Math.pow(1.55,g-1)*(18/Math.max(s.dose,8))*uneven;
   s.contact+=seconds;s.output+=seconds*flow;s.water=s.output;if(s.dose)expose(s,seconds,p);mark(s,'extract');return;
  }
  if(token==='steep'){
   if(!wet(s)||s.id==='coldbrew'&&s.filter||s.id==='siphon'&&s.returned>=1)return;
   const seconds=dt*(s.id==='coldbrew'?3600:s.id==='frenchpress'?60:10);s.contact+=seconds;expose(s,seconds,p);mark(s,'steep');
  }
 }
 function issueOnce(s,text){if(!s.issues.includes(text))issue(s,text);}
 function expose(s,seconds,p){const spec=specs[s.id];for(const b of s.batches){if(b.active===false)continue;b.contact+=seconds;const temp=s.id==='espresso'?p.temp:s.temp,tempFactor=s.id==='coldbrew'?Math.max(1,(temp-20)/40+1):clamp((temp-50)/43,.2,1.3);b.exposure+=seconds/spec.time*Math.pow(1.2,spec.grind-b.grind)*tempFactor;}}
 function pour(s,p){
  const available=s.id==='espresso'||s.id==='moka'?s.output:s.id==='siphon'?Math.max(0,s.water-s.dose*1.7)*s.returned:Math.max(0,s.water-s.dose*1.7),amount=Math.max(0,available-s.served);
  const findings=[];if(!s.dose)findings.push('没有投入咖啡粉，杯中只有水，不能形成咖啡。');if(!amount)findings.push('没有可倒出的液体，这次尚未成杯。');
  if(s.id==='moka'){if(s.water>150)findings.push('水位超过安全阀。示意出液已停止，实物应在冷却后纠正水位。');if(!s.basket||!s.sealed)findings.push('粉槽或上下壶未装好，没有形成正确的冲煮结构。');if(s.highHeatTime>9)findings.push('大火持续较久；下一杯及时离火，避免持续高温。');}
  if(s.id==='coldbrew'){if(!s.filter)findings.push('没有过滤，粉渣跟着进入杯中。');if(s.temp>20)findings.push('本次用了温热水，已经偏离冷藏冷水浸泡条件。');if(!s.lid)findings.push('本次没有加盖冷藏；与本课冷藏条件不同，不能照搬储存做法。');}
  if(s.id==='frenchpress'){if(!s.plunge)findings.push('还没有下压滤网，直接倒出会带入更多粉渣。');if(s.fastPress)findings.push('下压过快，下一杯慢慢压；实物遇到阻力不要强压。');}
  if(s.id==='siphon'){if(!s.filter)findings.push('没有装滤器，回流时粉渣也会进入下壶。');if(s.returned<.9)findings.push('回流尚未完成，杯中液量偏少。');}
  if(s.id==='espresso'){if(s.dose>22)findings.push('粉量超过本课粉碗示意容量；实物要按粉碗容量装粉。');if(s.warm<.8)findings.push('机器没有充分预热，本次演示的冲煮条件不稳定。');if(!s.distributed)findings.push('没有布粉，演示流速加快，可能出现不均匀萃取。');if(!s.tamped)findings.push('没有压粉，演示阻力较小，流速更快。');}
  const exposure=s.batches.reduce((n,b)=>n+b.dose*b.exposure,0)/(s.dose||1),ratio=amount/(s.dose||1),base=(specs[s.id].water-specs[s.id].dose*1.7)/specs[s.id].dose;
  let title=!s.dose||!amount?'这一杯，还没形成咖啡。':exposure<.65?'溶出偏少，可能尖酸或空薄。':exposure>1.6?'接触较多，留意苦涩与干燥感。':'接近本课起点，尝尝你的版本。';
  if(s.dose&&amount){findings.push(exposure<.65?'咖啡与水的有效接触偏少；试着延长接触，或让粉更均匀地湿润。':exposure>1.6?'有效接触较多；下一杯可以减少时间或调粗研磨，再比较口感。':'本次有效接触接近教学起点，可以保留配方，用真实味觉判断。');if(s.id!=='espresso')findings.push(ratio>base*1.15?'每克粉对应的饮品量较多，浓度方向可能更清淡。':ratio<base*.85?'每克粉对应的饮品量较少，浓度方向可能更浓。':'粉量与饮品量接近本课的比例。');else findings.push(`这一杯实际粉液比约 1:${ratio.toFixed(1)}；液重由你的停萃时机决定。`);}
  s.served+=amount;mark(s,'serve');log(s,`倒出 ${Math.round(amount)}g 示意饮品。`);s.cup={title,amount:Math.round(amount),dose:s.dose,water:s.water,time:s.contact,grind:s.dose?grind(s):0,exposure,findings:[...findings,...s.issues],events:[...s.events]};return s.cup;
 }
 return{create,action,tick,pour,grind};
})();
if(typeof module!=='undefined')module.exports=CoffeeFree;
