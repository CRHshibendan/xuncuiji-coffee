/* Short, forgiving rounds. The original management model and saves remain separate. */
(function(root){
 'use strict';
 const FLAVORS={light:'清爽一点',balanced:'平衡就好',rich:'浓郁一些'};
 const MENU=[
  {id:'melitta',name:'经典手冲',tool:'melitta',dose:15,water:225,temp:92,price:30,note:'15g 粉配 225g 水，粉水比是 1:15。',action:'注水',seconds:3},
  {id:'frenchpress',name:'醇厚法压',tool:'frenchpress',dose:20,water:260,temp:94,price:30,note:'法压靠浸泡和滤网，保留更多油脂与醇厚感。',action:'浸泡、下压',seconds:3.5},
  {id:'espresso',name:'意式浓缩',tool:'espresso',dose:20,water:36,temp:93,price:26,note:'浓缩看杯中液重：这里用 20g 粉，得到 36g 咖啡液。',action:'压粉、萃取',seconds:3},
  {id:'latte',name:'温柔拿铁',tool:'espresso',dose:20,water:36,temp:93,price:34,note:'拿铁先做好浓缩，再加入牛奶；奶量会改变浓淡。',action:'萃取、加奶',seconds:3.5}
 ];
 const NAMES=['小满','阿澄','栗子','阿梨','小野','木木','杨桃','阿岩'];
 function createRound(mode='relax'){
  const r={version:3,mode:mode==='rush'?'rush':'relax',status:'playing',elapsed:0,clockStarted:false,spawned:0,nextSpawn:10,total:mode==='rush'?8:5,queue:[],activeId:null,served:0,expelled:0,lost:0,revenue:0,points:0,perfect:0,cups:[]};
  while(r.queue.length<3)spawn(r);return r;
 }
 function spawn(r){
  if(r.spawned>=r.total||r.queue.length>=3)return null;
  const i=r.spawned++,drink=MENU[[0,0,1,2,3,0,1,3][i%8]];
  const flavor=Object.keys(FLAVORS)[i%3];
  const slot=[0,1,2].find(n=>!r.queue.some(o=>o.slot===n));
  const o={id:'guest-'+i,slot,name:NAMES[i%NAMES.length],look:i%6,drink:drink.id,flavor,dose:drink.dose,water:drink.water,temp:drink.temp,choice:null,phase:'waiting',progress:0,wait:0};o.choice=flavorFor(o);
  r.queue.push(o);return o;
 }
 const menuFor=o=>MENU.find(d=>d.id===o.drink);
 const PARAM_STEP={dose:1,water:5,temp:1};
 const PARAM_LIMIT={dose:4,water:60,temp:6};
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 // 1.0 = the drink's own recipe; water/dose up or temp down tastes lighter.
 function flavorFor(o){
  const m=menuFor(o),dose=o.dose??m.dose,water=o.water??m.water,temp=o.temp??m.temp;
  const strength=(m.water/m.dose)/(water/dose)*(temp/m.temp);
  return strength<.94?'light':strength>1.06?'rich':'balanced';
 }
 function paramsFor(o){const m=menuFor(o);return{dose:o.dose??m.dose,water:o.water??m.water,temp:o.temp??m.temp};}
 function tune(r,param,dir){
  const o=active(r);
  if(!o||o.phase!=='prepared'||!Object.prototype.hasOwnProperty.call(PARAM_STEP,param))return null;
  const m=menuFor(o),base=paramsFor(o)[param],limit=PARAM_LIMIT[param];
  const min=param==='water'?Math.max(10,m.water-limit):m[param]-limit,max=m[param]+limit;
  o[param]=clamp(Math.round(base+(Number(dir)||0)*PARAM_STEP[param]),min,max);
  o.choice=flavorFor(o);
  return{param,value:o[param],flavor:o.choice};
 }
 const active=r=>r.queue.find(o=>o.id===r.activeId);
 function focus(r,id){if(r.status!=='playing'||!r.queue.some(o=>o.id===id))return false;r.activeId=id;return true;}
 function accept(r,id){
  if(r.status!=='playing')return false;
  const o=r.queue.find(o=>o.id===id);if(!o||o.phase!=='waiting')return false;
  r.activeId=id;o.phase='grinding';o.progress=0;return true;
 }
 function brew(r){
  const o=active(r);if(r.status!=='playing'||!o||o.phase!=='prepared')return false;
  o.phase='brewing';o.progress=0;return true;
 }
 function choose(r,flavor){
  const o=active(r);if(!o||o.phase!=='prepared'||!FLAVORS[flavor])return false;
  o.choice=flavor;return true;
 }
 function resolve(r,id,kind,coins=0){
  if(r.status!=='playing'||!['served','expelled','lost'].includes(kind))return null;
  const o=r.queue.find(o=>o.id===id);if(!o||(kind==='served'&&o.phase!=='ready'))return null;
  let sale=0,comp=0;
  if(kind==='served'){
   const perfect=o.choice===o.flavor;sale=menuFor(o).price+(perfect?4:0);
   r.served++;r.perfect+=Number(perfect);r.revenue+=sale;r.points+=perfect?100:70;
   r.cups.push({drink:o.drink,flavor:o.choice,perfect,dose:o.dose,water:o.water,temp:o.temp});
  }else if(kind==='expelled'){
   r.expelled++;comp=Math.round(menuFor(o).price*.5)+Math.max(0,Math.floor(Number(coins)||0));r.revenue+=comp;r.compensation=(r.compensation||0)+comp;r.points=Math.max(0,r.points-20);
  }
  else{r.lost++;}
  r.queue=r.queue.filter(x=>x!==o);if(r.activeId===id)r.activeId=null;
  r.clockStarted=true;
  if(r.mode==='relax')while(r.queue.length<3&&r.spawned<r.total)spawn(r);
  if(r.mode==='rush'&&!r.queue.length&&r.spawned<r.total)spawn(r);
  if(r.spawned===r.total&&!r.queue.length)r.status='finished';
  return{order:o,kind,sale,comp};
 }
 function tick(r,seconds){
  if(r.status!=='playing'||!Number.isFinite(seconds)||seconds<=0)return;
  const dt=Math.min(seconds,.1);
  if(r.clockStarted)r.elapsed+=dt;
  for(const o of r.queue)if(['grinding','brewing'].includes(o.phase)){
   o.progress=Math.min(1,o.progress+dt/(o.phase==='grinding'?.8:menuFor(o).seconds));
   if(o.progress>=1){o.phase=o.phase==='grinding'?'prepared':'ready';o.progress=0;}
  }
  // The first customer is a safe tutorial, even in the timed round.
  if(r.mode==='rush'&&r.clockStarted){
   for(const guest of [...r.queue]){
    guest.wait+=dt;
    if(guest.wait>=35)resolve(r,guest.id,'lost');
   }
   if(r.elapsed>=r.nextSpawn&&r.spawned<r.total){if(spawn(r))r.nextSpawn=r.elapsed+9;}
   if(r.elapsed>=90){r.lost+=r.queue.length;r.queue=[];r.activeId=null;r.status='finished';}
  }
 }
 function summary(r){
  return{served:r.served,expelled:r.expelled,lost:r.lost,revenue:r.revenue,compensation:r.compensation||0,points:r.points,perfect:r.perfect,mode:r.mode,
   title:r.served===r.total?'今日满杯店长':r.served>=3?'有点手艺的店长':r.expelled>=3?'手冲壶守门员':'随心开店的店长',
   tool:r.cups.length?menuFor({drink:r.cups[r.cups.length-1].drink}).tool:'melitta'};
 }
 const api={FLAVORS,MENU,createRound,menuFor,paramsFor,flavorFor,tune,active,focus,accept,brew,choose,resolve,tick,summary};
 root.CoffeeRound=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
