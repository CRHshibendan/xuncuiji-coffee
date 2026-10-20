/* Classroom controller: homepage tokens/components, local teaching interactions. */
(function(root,CoffeeMethods){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const safe=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function variableValues({dose=15,ratio=15,grind=2,temp=92}={}){
 dose=clamp(safe(dose,15),10,30);ratio=clamp(safe(ratio,15),13,18);grind=Math.round(clamp(safe(grind,2),1,5));temp=clamp(safe(temp,92),80,100);
 return{dose,ratio,grind,temp,water:Math.round(dose*ratio)};
}
const brewerInfo={
 melitta:{name:'Melitta',subtitle:'CERAMIC / GRAVITY',title:'经典手冲，从容开始。',description:'扇形滤纸放进梯形滤杯，下面接一只分享壶。先折平滤纸接缝，润湿后倒掉预热水，再开始冲煮。',tag:'滤杯与分享壶，彼此分开。'},
 chemex:{name:'Chemex',subtitle:'GLASS / PAPER FILTER',title:'给清澈，留一点时间。',description:'沙漏形玻璃壶把过滤与接液连在一起。展开适配滤纸，让三层面朝向壶嘴，为排气留出通道。',tag:'一只玻璃壶，完成过滤与承接。'},
 moka:{name:'摩卡壶',subtitle:'METAL / HEAT AND PRESSURE',title:'让热力，带香气上来。',description:'下壶装水，粉槽装粉，温和加热后咖啡进入上壶。水位低于安全阀，粉槽装平不压粉，冷却后再拆壶。',tag:'下壶、粉槽与上壶，共同完成一杯。'},
 coldbrew:{name:'浸泡式冷萃',subtitle:'GLASS / COLD IMMERSION',title:'把时间，也交给咖啡。',description:'咖啡粉与冷水一起浸泡，盖好冷藏。达到计划时间后过滤，再按喜好调整浓淡。',tag:'这里演示浸泡式冷萃，不是冰滴塔。'},
 espresso:{name:'意式浓缩',subtitle:'METAL / PRESSURE EXTRACTION',title:'短短一瞬，浓缩风味。',description:'热水在压力下穿过细密粉饼，接住一小杯集中的香气。布粉、压粉与停止萃取的时机，都会影响这杯的表现。',tag:'用细密粉饼，承接压力下的热水。'},
 siphon:{name:'虹吸壶',subtitle:'GLASS / TEMPERATURE AND PRESSURE',title:'上升，回落，风味相遇。',description:'加热让水进入上壶，与咖啡粉接触。停止加热后，咖啡经过滤器，回到下壶。',tag:'上壶浸泡，下壶承接回流。'},
 frenchpress:{name:'法压壶',subtitle:'GLASS / IMMERSION AND PRESS',title:'慢慢浸泡，轻轻压下。',description:'让咖啡粉与热水相处片刻，再缓慢压下金属滤网。倒出咖啡，避免一直留在粉渣中。',tag:'浸泡之后，用金属滤网分离粉渣。'}
};
function svg(body,label,box='0 0 400 360'){return `<svg class="lesson-svg" viewBox="${box}" role="img" aria-label="${escapeHTML(label)}" fill="none">${body}</svg>`;}
function processDrawing(value){const phase=clamp(Math.round(safe(value,0)),0,2);
 const stream=phase<2?'<path class="demo-water" d="M200 25v62"/><path class="demo-drift demo-drift-one" d="M200 45v16"/><path class="demo-drift demo-drift-two" d="M200 45v16"/><path class="demo-drift demo-drift-three" d="M200 45v16"/>':'';
 const particles=Array.from({length:12},(_,i)=>`<circle cx="${137+i%4*40}" cy="${132+Math.floor(i/4)*25}" r="${phase===1?3:2}"/>`).join('');
 const bubbles=phase===0?'<g class="demo-bubbles"><circle cx="168" cy="107" r="6"/><circle cx="205" cy="100" r="4"/><circle cx="237" cy="107" r="5"/></g>':'';
 const wet='<path class="lesson-accent demo-wet" d="M110 118h180l-41 85h-98Z"/>';
 const drops=phase===2?'<path d="M200 223v8" class="demo-drop demo-drop-one"/><path d="M200 237v8" class="demo-drop demo-drop-two"/><path d="M200 251v8" class="demo-drop demo-drop-three"/>':'';
 const liquid=phase===2?'<defs><clipPath id="process-coffee-clip"><path d="M149 279h102v51q0 12-51 12t-51-12Z"/></clipPath></defs><g clip-path="url(#process-coffee-clip)"><path class="lesson-accent demo-fill" d="M140 304h120v40H140Z"/></g>':'';
 const notes=phase===1?'<g class="demo-soluble" stroke="var(--color-accent)"><circle cx="158" cy="145" r="1.5"/><circle cx="200" cy="159" r="1.5"/><circle cx="242" cy="145" r="1.5"/></g>':'';
 return svg(`${stream}<path d="M80 100h240l-60 120H140Z"/><ellipse cx="200" cy="100" rx="120" ry="12"/>${wet}<path d="m106 115 44 88m-12-89 27 89m35-88v88m62-89-27 89m59-88-44 88" opacity=".4"/><g class="${phase===1?'demo-grains':''}" stroke="var(--color-accent)">${particles}</g>${bubbles}${notes}${drops}<path d="M140 270h120v60q0 20-60 20t-60-20ZM260 283h16c35 0 35 42 0 42h-16"/>${liquid}`,['润湿咖啡粉，气体形成小气泡','可溶物进入水中，形成风味','液体经过滤纸流入杯中'][phase]);
}
function variableDrawing(name,input){const v=variableValues(input);
 if(name==='grind'){
  const particles=Array.from({length:18},(_,i)=>`<circle cx="${90+i%6*44}" cy="${70+Math.floor(i/6)*50}" r="${1.5+v.grind*1.2}"/>`).join('');
  return svg(`<g class="lesson-change">${particles}</g><path class="lesson-flow" pathLength="1" d="M120 225v45m-8-12 8 12 8-12M200 225v45m-8-12 8 12 8-12M280 225v45m-8-12 8 12 8-12"/>`,'研磨颗粒大小的变化示意','0 0 400 300');
 }
 if(name==='temperature'){
  const y=185-(v.temp-80)*6;
  return svg(`<path d="M184 218V55a16 16 0 0 1 32 0v163a28 28 0 1 1-32 0Z"/><path d="M236 65h18m-18 30h12m-12 30h18m-18 30h12m-12 30h18"/><circle class="lesson-accent" cx="200" cy="242" r="12"/><path stroke="var(--color-accent)" class="lesson-flow" pathLength="1" d="M200 242V${y}"/>`,'温度计随设定水温变化的示意','0 0 400 300');
 }
 const waterY=230-v.water/540*140,groundsY=230-v.dose/30*65;
 return svg(`<path d="M55 125h105v110q0 19-52.5 19T55 235ZM160 140h14c32 0 32 50 0 50h-14M225 65h120v170q0 19-60 19t-60-19Z"/><path class="lesson-accent" d="M63 ${groundsY}h89V235q0 11-44.5 11T63 235Z"/><path class="lesson-flow" pathLength="1" d="M233 ${waterY}h104"/><path d="M325 90h12m-12 30h12m-12 30h12m-12 30h12m-12 30h12" opacity=".4"/>`,'咖啡粉量与冲煮用水量的量杯示意','0 0 400 300');
}
function createPlayback({getLength,getStep,onStep,onState=()=>{},allowed=()=>true,setTimer=setTimeout,clearTimer=clearTimeout}){
 let timer=null,version=0,playing=false;
 function stop(){version++;if(timer!==null)clearTimer(timer);timer=null;playing=false;onState(false);}
 function schedule(run){timer=setTimer(()=>{timer=null;if(run!==version)return;if(!allowed()){stop();return;}const next=getStep()+1;if(next<getLength())onStep(next);if(next>=getLength()-1)stop();else schedule(run);},6500);}
 function start(){stop();if(!allowed())return false;if(getStep()>=getLength()-1)onStep(0);playing=true;const run=version;onState(true);schedule(run);return true;}
 return{start,stop,get playing(){return playing;}};
}
const recipes={melitta:{name:'Melitta',water:225,temp:92,grind:'中细',bloom:30,wait:30,split:125},chemex:{name:'Chemex',water:240,temp:93,grind:'中',bloom:40,wait:45,split:140}};
function lessonSteps(selectedBrewer){if(CoffeeMethods.methods[selectedBrewer])return CoffeeMethods.methods[selectedBrewer].steps;const r=recipes[selectedBrewer];return[
 {name:'准备滤纸',hint:'先折，再放入',title:selectedBrewer==='melitta'?'先折纸，再放入。':'展开滤纸，认准三层面。',text:selectedBrewer==='melitta'?'沿扇形滤纸的底边和侧边接缝折平，再展开贴合梯形滤杯。滤杯稳稳放在分享壶或杯子上。':'展开匹配的 Chemex 滤纸，让三层面朝向导流嘴。一层面在另一边，壶嘴处留出排气的空间。',observe:'滤纸贴合器具，没有塌进壶嘴或堆成一团。',visual:'先把滤纸准备好'},
 {name:'称豆研磨',hint:'15g 咖啡豆',title:`称好 15g，磨成${r.grind}。`,text:`先固定粉量，更容易比较下一杯。将 15g 豆子磨成${r.grind}颗粒；磨豆机刻度不能照搬，先以自己的颗粒与下水表现为准。`,observe:'先闻一闻刚磨好的干粉，记下第一个香气联想。',visual:'豆子变成更小的颗粒'},
 {name:'准备热水',hint:r.temp+'°C 起步',title:`把水准备在 ${r.temp}°C 附近。`,text:'用温控壶或温度计确认水温。准备的水要留出润纸用量；这份配方的冲煮水量不包含稍后倒掉的预热水。',observe:'温度是开始的参考；实物器具和热水都要留意烫手。',visual:'水温是配方的一个变量'},
 {name:'润纸温壶',hint:'预热水要倒掉',title:'润湿滤纸，记得倒掉水。',text:'用热水润湿滤纸并预热器具。把流进下方容器的预热水倒掉，再开始正式冲煮；不要把它混进咖啡。',observe:'滤纸已经湿润，承接咖啡的容器里没有预热水。',visual:'先润纸，再清空预热水'},
 {name:'投粉闷蒸',hint:`${r.bloom}g · 等约 ${r.wait}s`,title:`先注到 ${r.bloom}g，再等一等。`,text:`把粉倒进滤纸，轻轻整理平整后归零。开始计时，用细水流均匀打湿至累计 ${r.bloom}g，参考等待 ${r.wait} 秒，让气体排出。`,observe:'粉层都湿润了；闷蒸用水计入这一杯的总注水量。',visual:'小气泡，是粉层正在排气'},
 {name:'分段注水',hint:`累计 ${r.split}g → ${r.water}g`,title:`分两段，累计注到 ${r.water}g。`,text:`闷蒸后缓慢绕小圈，先注到累计 ${r.split}g。观察水位回落，再继续到累计 ${r.water}g。落点尽量留在粉层内，避免一直冲刷滤纸边缘。`,observe:'这里都是秤上的累计数值，不是每段要额外再加这么多水。',visual:'细水流，落点留在粉层里'},
 {name:'滴滤出杯',hint:'观察，再品尝',title:'等它滴下，留一口给自己。',text:selectedBrewer==='melitta'?'观察水位下降、滴滤基本结束，移开上面的 Melitta 滤杯。轻轻晃匀分享壶里的咖啡，倒入杯中，稍放凉后尝一尝。':'观察水位下降、滴滤基本结束，取出滤纸和粉渣。轻轻晃匀 Chemex 壶中的咖啡，倒入杯中，稍放凉后再尝。',observe:'记下总时间与口感。下一杯保留配方，只改一个变量。',visual:'记录味道，让下一杯有方向'}
 ];}
const tasteAdvice={sour:{title:'先试着，只磨细一点。',description:'如果酸得尖、又有空薄感，可能是萃取不够，也可能和豆子本身有关。用同一支豆子，把研磨小幅调细，比较口感有没有变得更完整。',keep:'同一支豆、粉量、水量与水温',change:'研磨小幅调细一次',context:'明亮、清爽的酸质也可能是好喝的风味，先以自己的喜好判断。'},bitter:{title:'先试着，只磨粗一点。',description:'如果苦感伴随干涩、且下水很慢，可以先小幅调粗研磨。记录滴滤时间有没有缩短，口腔里是否更柔和，再决定下一步。',keep:'同一支豆、粉量、水量与水温',change:'研磨小幅调粗一次',context:'烘焙风味、细粉或不均匀注水也会影响口感，这只是一次对照实验。'},weak:{title:'先分清，淡还是萃取不足。',description:'如果味道完整、只是浓度低，可先减少同样粉量的用水，例如从 1:16 改到 1:15。若同时尖酸空薄，则优先尝试调整研磨。',keep:'同一支豆、粉量、研磨与水温',change:'只减少一点冲煮用水',context:'喝起来清淡不一定是缺点；选择你愿意每天喝的那种浓度。'},good:{title:'喜欢这一杯，就把它留下。',description:'记录豆子、器具、粉量、水量、水温、研磨和大致时间。再写一句自己的味觉联想，下次用同一套条件试着复现。',keep:'这一次的参数与动作',change:'先不改，下一杯尝试复现',context:'风味词没有标准答案。你喜欢的感觉，比漂亮的术语更值得记录。'}};
const api={variableValues,processDrawing,variableDrawing,lessonSteps,brewerInfo,createPlayback};
if(typeof module==='object'&&module.exports)module.exports=api;
root.CoffeeLearn=api;if(!root.document)return;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],reduced=matchMedia('(prefers-reduced-motion: reduce)');
let ready=false;
let selectedBrewer=Object.hasOwn(brewerInfo,new URLSearchParams(location.search).get('tool'))?new URLSearchParams(location.search).get('tool'):'melitta',activeVariable='ratio',recipeStep=0;
function motionMs(name,fallback){return Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))||fallback;}
const copyTotal=motionMs('--motion-slow',420),copyExit=motionMs('--motion-press',100),copyReduced=motionMs('--motion-reduced',150);
const copyPlayers=new Map(),hintTimers=new Map();
function hint(nodes){for(const node of nodes){clearTimeout(hintTimers.get(node));node.style.willChange='transform, opacity';hintTimers.set(node,setTimeout(()=>{node.style.removeProperty('will-change');hintTimers.delete(node);},copyTotal));}}
function clearHints(){for(const [node,timer]of hintTimers){clearTimeout(timer);node.style.removeProperty('will-change');}hintTimers.clear();}
function copy(selector,write,animate=ready){const nodes=$$(selector),key=nodes[0];let player=copyPlayers.get(key);if(!player){player=CoffeeLearnMotion.createCopyTransition({outMs:copyExit,inMs:copyTotal-copyExit,reducedMs:copyReduced,reduced:()=>reduced.matches,onState:state=>{for(const node of nodes){if(state==='out')node.style.setProperty('--copy-from',getComputedStyle(node).opacity);node.classList.remove('copy-out','copy-in','copy-reduced');node.dataset.copyState=state;if(state==='idle'){node.style.removeProperty('will-change');node.style.removeProperty('--copy-from');}else{node.classList.add('copy-'+state);node.style.willChange=state==='reduced'?'opacity':'transform, opacity';}}}});copyPlayers.set(key,player);}player.change(write,animate);}
function respond(node){node.classList.remove('lesson-change');if(ready&&!reduced.matches){void node.offsetWidth;hint([node]);node.classList.add('lesson-change');}}
let demo=null,demoStart=null,demoEnd=null;
function stopDemo(){clearTimeout(demoStart);clearTimeout(demoEnd);if(demo){demo.classList.remove('demo-running');demo.dataset.demoState='complete';demo.querySelectorAll('[class*="demo-"]').forEach(node=>node.style.removeProperty('will-change'));}demo=null;}
function playDemo(svg,delay=0){stopDemo();if(!svg||reduced.matches||document.hidden)return;demo=svg;demo.dataset.demoState='waiting';demoStart=setTimeout(()=>{if(demo!==svg)return;svg.querySelectorAll('[class*="demo-"]').forEach(node=>node.style.willChange='transform, opacity');svg.classList.add('demo-running');svg.dataset.demoState='playing';demoEnd=setTimeout(stopDemo,1600);},delay);}
function tabs(selector,attribute,selected){$$(selector).forEach(button=>{const yes=button.getAttribute(attribute)===String(selected);button.setAttribute(button.getAttribute('role')==='tab'?'aria-selected':'aria-pressed',String(yes));if(button.getAttribute('role')==='tab')button.tabIndex=yes?0:-1;});}
function keyboardTabs(selector,attribute,select){$$(selector).forEach(button=>button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const all=$$(selector),at=all.indexOf(button),next=event.key==='Home'?0:event.key==='End'?all.length-1:(at+(event.key==='ArrowRight'?1:-1)+all.length)%all.length;select(all[next].getAttribute(attribute));all[next].focus();}));}
const phases=[
 {title:'先让每一粒粉，都遇见水。',description:'少量热水打湿咖啡粉，粉层里会冒出小气泡。均匀润湿干粉，也给气体一点排出的时间。'},
 {title:'水带走的，才是杯中的风味。',description:'咖啡中的可溶物进入水里，形成香气、滋味与浓度。研磨、水温和接触时间，会一起影响这个过程。'},
 {title:'留下粉渣，让咖啡流进杯子。',description:'重力让液体穿过粉层和滤纸，与粉渣分开。观察下水速度，给下一杯留下比较的线索。'}
];
function selectPhase(value){const phase=clamp(Number(value),0,2),data=phases[phase];tabs('[data-phase]','data-phase',phase);$('#story-drawing').innerHTML=processDrawing(phase);$('#story-copy').setAttribute('aria-labelledby','phase-'+phase);copy('#story-copy',()=>{$('#story-count').textContent='0'+(phase+1)+' / 03';$('#story-title').textContent=data.title;$('#story-description').textContent=data.description;});if(ready)playDemo($('#story-drawing svg'),copyTotal);}
$$('[data-phase]').forEach(button=>button.addEventListener('click',()=>selectPhase(button.dataset.phase)));keyboardTabs('[data-phase]','data-phase',selectPhase);
const roasts=[
 {title:'想试试明亮、轻盈的感觉？',description:'可以从带有花香、水果描述的浅烘焙试起。先用味觉分辨，是喜欢的清爽，还是不喜欢的尖锐。'},
 {title:'想从平衡、熟悉的风味开始？',description:'试试带有坚果、焦糖或巧克力描述的中烘焙。它可以是第一杯的起点，再慢慢探索自己的偏好。'},
 {title:'想尝尝更明显的烘焙风味？',description:'试试深烘焙，感受更明显的烘焙香气。烘焙名称没有跨品牌的统一刻度，先买小份尝试。'}
];
function selectRoast(value){const index=Number(value),data=roasts[index];stopDemo();$$('button[data-roast]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.roast)===index)));if(ready&&!reduced.matches)hint($$('.bean-tone,.bean-depth,.bean-seam-light'));$('#bean-figure').dataset.roast=index;copy('#roast-copy',()=>{$('#roast-title').textContent=data.title;$('#roast-desc').textContent=data.description;});copy('#roast-state',()=>{$('#roast-state').textContent=['浅烘焙 · 浅色豆面','中烘焙 · 焦糖色豆面','深烘焙 · 深色豆面'][index];});}

$$('button[data-roast]').forEach(b=>b.addEventListener('click',()=>selectRoast(b.dataset.roast)));
function inputs(){return variableValues({dose:$('#learn-dose').value,ratio:$('#learn-ratio').value,grind:$('#learn-grind').value,temp:$('#learn-temperature').value});}
function updateVariable(animate=false){const v=inputs(),names=['','细','中细','中','中粗','粗'];
 $('#dose-value').textContent=v.dose+' g';$('#ratio-value').textContent='1 : '+v.ratio;$('#grind-value').textContent=names[v.grind];$('#temperature-value').textContent=v.temp+'°C';
 $('#variable-drawing').innerHTML=variableDrawing(activeVariable,v);
 copy('#variable-copy,#variable-readout,#variable-caption',()=>{if(activeVariable==='ratio'){
  $('#visual-kicker').textContent='冲煮用水';$('#visual-number').textContent=v.water+' g';$('#variable-title').textContent=`${v.dose}g 咖啡，搭配 ${v.water}g 水。`;
  $('#variable-description').textContent=`1:${v.ratio} 是每 1g 咖啡配 ${v.ratio}g 冲煮用水。粉层会留住部分水，杯中液体通常少于注水量。`;
  $('#variable-caption').textContent='水量 = 咖啡粉量 × 比例';
 }else if(activeVariable==='grind'){
  $('#visual-kicker').textContent='颗粒示意';$('#visual-number').textContent=names[v.grind];$('#variable-title').textContent=v.grind<=2?'磨细一点，接触面积更多。':v.grind>=4?'磨粗一点，水通常更快流过。':'先观察，这杯的下水。';
  $('#variable-description').textContent='细颗粒通常让溶出更充分，也可能使下水变慢。磨豆机刻度不能照搬，保持其他条件不变，再比较这一次的口感。';
  $('#variable-caption').textContent='颗粒大小为变化方向示意，不代表实际磨豆机刻度。';
 }else{
  $('#visual-kicker').textContent='设定水温';$('#visual-number').textContent=v.temp+'°C';$('#variable-title').textContent='从这里开始，再用味觉决定。';
  $('#variable-description').textContent='相同条件下，较高水温往往有助于溶出。设定值与实际粉层温度不同，下一杯只调整一个变量。';$('#variable-caption').textContent='设定温度 ≠ 每一刻的粉层温度';
 }},animate);
}
function selectVariable(name){activeVariable=name;tabs('button[data-variable]','data-variable',name);$$('[data-variable-control]').forEach(p=>p.hidden=p.dataset.variableControl!==name);$('#variable-panel').setAttribute('aria-labelledby','tab-'+name);stopDemo();updateVariable(ready);respond($('#variable-panel'));}
$$('button[data-variable]').forEach(b=>b.addEventListener('click',()=>selectVariable(b.dataset.variable)));keyboardTabs('button[data-variable]','data-variable',selectVariable);$$('#variable-panel input').forEach(input=>input.addEventListener('input',()=>updateVariable(false)));
const playback=createPlayback({getLength:()=>lessonSteps(selectedBrewer).length,getStep:()=>recipeStep,onStep:value=>{recipeStep=value;renderRecipe();},allowed:()=>!reduced.matches&&!document.hidden,onState:value=>{$('#play-recipe').setAttribute('aria-pressed',String(value));$('#play-recipe').textContent=reduced.matches?'请逐步查看':value?'停止演示':'自动看一遍';}});
function renderRecipe(){stopDemo();const all=lessonSteps(selectedBrewer),step=all[recipeStep];
 $('#recipe-timeline').innerHTML=all.map((item,i)=>`<button type="button" data-recipe-step="${i}" aria-pressed="${i===recipeStep}"><span class="label">${String(i+1).padStart(2,'0')}</span><span>${escapeHTML(item.name)}</span></button>`).join('');
 $$('[data-recipe-step]').forEach(button=>button.addEventListener('click',()=>{playback.stop();recipeStep=Number(button.dataset.recipeStep);renderRecipe();$('#recipe-timeline [aria-pressed="true"]').focus({preventScroll:true});}));
 copy('#recipe-copy,#recipe-step-count',()=>{$('#recipe-step-count').textContent=String(recipeStep+1).padStart(2,'0')+' / '+String(all.length).padStart(2,'0');$('#recipe-action').textContent=step.name;$('#recipe-step-title').textContent=step.title;$('#recipe-step-description').textContent=step.text;$('#recipe-step-observe').textContent='看一看：'+step.observe;});
 $('#previous-step').disabled=recipeStep===0;$('#next-step').textContent=recipeStep===all.length-1?'重新看一遍':'下一步';
}
function selectBrewer(name){if(!Object.hasOwn(brewerInfo,name))name='melitta';playback.stop();selectedBrewer=name;recipeStep=0;const data=brewerInfo[name],method=CoffeeMethods.methods[name];
 tabs('[data-learn-brewer]','data-learn-brewer',name);$('#brewer-panel').setAttribute('aria-labelledby','tab-'+name);$('#brewer-use').setAttribute('href','assets/lesson-brewers.svg#'+name);$('#brewer-drawing').setAttribute('aria-label',data.name+'细线器具图');copy('#brewer-tag',()=>{$('#brewer-tag').textContent=data.tag;});copy('#brewer-copy',()=>{$('#brewer-subtitle').textContent=data.subtitle;$('#brewer-title').textContent=data.title;$('#brewer-description').textContent=data.description;});
 $('#equipment-practice').href=`workshop.html?tool=${name}&mode=basic`;$$('[data-practice]').forEach(a=>a.href=`workshop.html?tool=${name}&mode=${a.dataset.practice}`);
 const meta=method?[['今天的器具',data.name],...method.meta]:[['今天的器具',data.name],['咖啡粉 / 用水','15 g / '+recipes[name].water+' g'],['起点水温',recipes[name].temp+'°C'],['起点研磨',recipes[name].grind]];
 copy('#recipe-meta',()=>{$('#recipe-meta').innerHTML=meta.map(([title,value])=>`<div><dt>${escapeHTML(title)}</dt><dd>${escapeHTML(value)}</dd></div>`).join('');});renderRecipe();respond($('#brewer-drawing'));
 const url=new URL(location.href);url.searchParams.set('tool',name);history.replaceState(null,'',url);
}
$$('[data-learn-brewer]').forEach(b=>b.addEventListener('click',()=>selectBrewer(b.dataset.learnBrewer)));keyboardTabs('[data-learn-brewer]','data-learn-brewer',selectBrewer);
$('#play-recipe').addEventListener('click',()=>{if(playback.playing)playback.stop();else playback.start();});$('#previous-step').addEventListener('click',()=>{playback.stop();recipeStep=Math.max(0,recipeStep-1);renderRecipe();});$('#next-step').addEventListener('click',()=>{playback.stop();recipeStep=recipeStep===lessonSteps(selectedBrewer).length-1?0:recipeStep+1;renderRecipe();});
function chooseTaste(name){const data=tasteAdvice[name];tabs('[data-taste]','data-taste',name);stopDemo();copy('#taste-copy',()=>{$('#taste-title').textContent=data.title;$('#taste-description').textContent=data.description;$('#taste-keep').textContent=data.keep;$('#taste-change').textContent=data.change;});}
$$('[data-taste]').forEach(b=>b.addEventListener('click',()=>chooseTaste(b.dataset.taste)));
function motionChanged(){playback.stop();stopDemo();clearHints();for(const player of copyPlayers.values())player.finish();$('#play-recipe').disabled=reduced.matches;}
if(typeof reduced.addEventListener==='function')reduced.addEventListener('change',motionChanged);else reduced.addListener?.(motionChanged);
function pauseLesson(){playback.stop();stopDemo();clearHints();for(const player of copyPlayers.values())player.finish();}addEventListener('pagehide',pauseLesson);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseLesson();});
selectPhase(0);selectBrewer(selectedBrewer);selectRoast(1);selectVariable('ratio');chooseTaste('sour');motionChanged();ready=true;
$('#replay-pour').addEventListener('click',()=>playDemo($('#hero-pour')));$('#replay-process').addEventListener('click',()=>playDemo($('#story-drawing svg')));
if(typeof IntersectionObserver==='function'){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);playDemo(entry.target.matches('svg')?entry.target:entry.target.querySelector('svg'),copyTotal);}},{threshold:.4});observer.observe($('#hero-pour'));observer.observe($('#story-drawing'));}else playDemo($('#hero-pour'),copyTotal);
})(typeof window==='undefined'?globalThis:window,typeof module==='object'&&module.exports?require('./methods.js'):CoffeeMethods);
