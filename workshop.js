(()=>{
const request=new URLSearchParams(location.search);if(CoffeeMethods.methods[request.get('tool')]){EquipmentStudio.start(request.get('tool'),['advanced','gesture'].includes(request.get('mode'))?request.get('mode'):'basic');return;}
'use strict';
// Local-only interactive studio. Artwork adapted from the supplied 寻萃集 project.
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)],scene=$('#scene');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search);
let brewer=params.get('tool')==='chemex'?'chemex':'melitta',playMode=['advanced','gesture'].includes(params.get('mode'))?params.get('mode'):'basic';
const recipes={melitta:{name:'Melitta',water:225,temp:92,bloom:30,wait:30,split:125,grind:2,grindName:'中细研磨'},chemex:{name:'Chemex',water:240,temp:93,bloom:40,wait:45,split:140,grind:3,grindName:'中研磨'}};
const names=['称豆','研磨','准备滤纸','烧水','润纸温壶','投粉','闷蒸','分段注水','出杯'];
const bases={beans:{x:-65,y:-145},grinder:{x:0,y:0},grounds:{x:100,y:0},filter:{x:150,y:-110},weighed:{x:0,y:0},server:{x:0,y:0},paper:{x:0,y:0},dripper:{x:0,y:0},kettle:{x:0,y:0},waste:{x:88,y:30},cup:{x:0,y:0}};
let lastFreeTip='',state,drag=null,selected=null,pointerPour=false,keyPour=false,kettlePos={x:0,y:0},advanceTimer=null,lastFrame=0,lastHUD=0,lastArt=0,toastTimer,grindKey=false,grindFocus=false,mobileCamera=null,viewAnimation=0,viewTarget="",activeSetting=0,vesselMarkup="",transferCancel=null,resultTimer=null,bedView=null;
const speed=5,recipe=()=>recipes[brewer],basic=()=>playMode==='basic';
function namespace(markup,prefix){return markup.replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}-${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}-${id})`);}
function body(markup){return markup.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');}
function fmt(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;}
function fresh(){return{step:0,phase:0,scaleDose:0,grinderBeans:0,grindLoad:0,groundsReady:0,readyGrind:3,turns:0,crankAngle:0,displayAngle:0,grindQueue:0,folded:false,oriented:false,filterPlaced:false,removed:false,dosed:false,rinseDone:false,waiting:0,bloomDone:false,temp:20,targetTemp:recipe().temp,heating:false,cooling:false,paused:false,served:false,started:false,flow:3,spoon:5,grind:recipe().grind,done:false,model:BrewModel.create(brewer),demo:true,dirty:true};}
function obj(name){return document.getElementById(name+'-object');}
function translate(name,dx=0,dy=0){const b=bases[name]||{x:0,y:0};obj(name)?.setAttribute('transform',`translate(${b.x+dx} ${b.y+dy})`);if(name==='kettle')kettlePos={x:dx,y:dy};}
function stopInput(resetKettle=false){pointerPour=keyPour=false;grindKey=false;if(state)state.grindQueue=0;drag=null;selected=null;$$('#scene .selected').forEach(e=>e.classList.remove('selected'));for(const n of Object.keys(bases))if((n!=='kettle'||resetKettle)&&!obj(n)?.hasAttribute('data-transfer-pose'))translate(n);$('#selection-caption').textContent='';$('#scene-targets').classList.remove('targets-ready');$('#water-fx').innerHTML='';$('#kettle-body').removeAttribute('transform');}
function feedback(text,warn=false){$('#feedback-text').textContent=text;$('#feedback-box').classList.toggle('warn',warn);}
function message(text,warn=false){feedback(text,warn);$('#scene-toast').textContent=text;$('#scene-toast').classList.toggle('warn',warn);$('#scene-toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#scene-toast').classList.remove('visible'),2600);}
function record(text){BrewModel.event(state.model,text);state.dirty=true;}
function reset(tool=brewer,mode=playMode){bedView?.close(true);window.CoffeeGesture?.destroy();transferCancel?.();transferCancel=null;clearTimeout(resultTimer);StudioMotion.fillCup(scene,0);clearTimeout(advanceTimer);advanceTimer=null;clearTimeout(toastTimer);$('#scene-toast').classList.remove('visible');stopInput(true);brewer=tool;playMode=mode;grindFocus=false;mobileCamera=null;state=fresh();if($("#parameter-dialog").open)$("#parameter-dialog").close();$('#cup-liquid').setAttribute('y',527);$('#cup-top').setAttribute('fill','#e9e0cb');$('#save-workshop-note').disabled=false;$('#save-workshop-note').textContent='收进我的咖啡手记 ↗';document.body.classList.toggle('basic-play',basic());document.body.classList.toggle('advanced-play',!basic());$$('[data-brewer]').forEach(b=>{b.classList.toggle('active',b.dataset.brewer===brewer);b.setAttribute('aria-pressed',String(b.dataset.brewer===brewer));});$$('[data-play-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.playMode===playMode);b.setAttribute('aria-pressed',String(b.dataset.playMode===playMode));});$('.back-home').href=`learn.html?tool=${brewer}#recipe`;$('#studio-tool').value=brewer;$('#recipe-name').textContent=`经典 ${recipe().name}。`;$('#recipe-water').textContent=recipe().water;$('#recipe-temp').textContent=recipe().temp;$('#recipe-grind').textContent='中度烘焙 · '+recipe().grindName;document.title=`${recipe().name} · ${basic()?'基础跟练':'进阶自由'} — 寻萃集工坊`;history.replaceState(null,'',`workshop.html?tool=${brewer}&mode=${playMode}`);render();feedback(basic()?'跟着手势，先把咖啡豆放到秤上。':'器具都准备好了。你可以从任何一个动作开始，随时出杯。');if(playMode==='gesture')mountGesture();}
function renderVessel(){const m=state.model,dose=state.visualDose??m.dose,liquid=state.visualLiquid??m.liquid,hidden=basic()&&state.step<2,level=clamp(liquid/(brewer==='chemex'?350:280)*90,0,95);let art=brewer==='chemex'?SVGTools.chemexDripper('#C69A62',state.served?0:level,{showFilter:false,showGrounds:false}):SVGTools.server(state.served?0:level,{showLid:false});if(!dose)art=art.replaceAll('#A8815C','#b4c6c0').replaceAll('#8D6E63','#b4c6c0').replaceAll('#3E2723','#a0b7b0');let markup=`<g id="server-object" data-object="server" role="button" tabindex="-1" aria-label="拿起${brewer==='chemex'?'Chemex 玻璃壶':'分享壶'}" ${hidden?'class="object-hidden"':''}><g transform="${brewer==='chemex'?'translate(242 132) scale(.65)':'translate(338.4 312) scale(.36)'}">${body(namespace(art,'studio-vessel'))}</g></g>`;
 if(brewer==='melitta'&&!state.removed)markup+=`<g id="dripper-object" data-object="dripper" role="button" tabindex="-1" aria-label="拿起 Melitta 滤杯" ${hidden?'class="object-hidden"':''}><g transform="translate(290 145) scale(.5)">${body(namespace(SVGTools.melittaDripper('#F8F5EF'),'studio-dripper'))}</g></g>`;
 if(state.filterPlaced&&!state.removed){const y=brewer==='chemex'?226:238,clip='studio-paper-opening',rx=brewer==='chemex'?86:84;markup+=`<g id="paper-object" data-object="paper" role="button" tabindex="-1" aria-label="拿起滤纸与粉渣"><defs><clipPath id="${clip}"><ellipse cx="450" cy="${y}" rx="${rx}" ry="22"/></clipPath></defs><g clip-path="url(#${clip})"><ellipse cx="450" cy="${y}" rx="${rx}" ry="22" fill="#fff9eb" stroke="#d4c4a1"/><path d="M379 ${y-3}q71-29 142 0M450 ${y-22}l5 10" fill="none" stroke="#dfd0b1"/>${dose&&!m.removed?`<ellipse cx="450" cy="${y+1}" rx="${74*Math.sqrt(Math.min(1,dose/15))}" ry="${16*Math.sqrt(Math.min(1,dose/15))}" fill="#6e4b30"/>`:''}${m.bed>2?`<ellipse cx="450" cy="${y}" rx="${Math.min(80,50+m.bed/3)}" ry="17" fill="${dose?'#9f7948':'#c2d1be'}" opacity=".5"/>`:''}<g transform="translate(0 ${y-238})">${wetArt()}</g></g><path class="paper-front-rim" d="M${450-rx} ${y}a${rx} 22 0 0 0 ${rx*2} 0" fill="none" stroke="#a99c8c" stroke-width="1.5"/></g>`;}else if(dose&&!m.removed)markup+=`<ellipse cx="450" cy="${brewer==='chemex'?292:345}" rx="40" ry="10" fill="#715037"/>`;
 patchVessel(markup);applyInteractive();if(drag&&['server','paper','dripper'].includes(drag.object))translate(drag.object,drag.dx||0,drag.dy||0);state.dirty=false;}
function wetArt(){const m=state.model;if(!m.dose||m.removed)return'';let art='';m.wet.forEach((v,i)=>{if(v<.5)return;const a=i/8*Math.PI*2;art+=`<ellipse cx="${450+Math.cos(a)*48}" cy="${239+Math.sin(a)*10}" rx="24" ry="7" class="wet-patch"/>`;});if(state.waiting>0)for(let i=0;i<8;i++)art+=`<ellipse cx="${405+i*13}" cy="${234+i%3*4}" rx="3" ry="1.5" class="bubble"/>`;return art;}
function filterArt(){const prepared=state.folded;obj('filter').setAttribute('aria-label',!state.folded?(brewer==='chemex'?'点击展开滤纸，准备好后再拖入器具':'点击折好滤纸，准备好后再拖入滤杯'):!state.oriented?'再点一下滤纸，对准三层面':'滤纸准备好了，拖入器具');obj('filter').innerHTML='<rect class="hit-area" x="65" y="170" width="170" height="165" fill="transparent"/>'+(brewer==='melitta'?`<g transform="translate(66 174) scale(.85)">${body(namespace(SVGTools.filter(),'loose-filter'))}</g><path d="M124 213v65m-1 14h54" stroke="${prepared?'#8fa66c':'#bfae8b'}" stroke-dasharray="5 4" fill="none"/><text x="150" y="322" class="scene-caption" text-anchor="middle">${prepared?'接缝已折好':'① 点击折纸，再拖动'}</text>`:`<path d="M104 205h92v92h-92Z" fill="#fffaeb" stroke="#d0bfa0"/><path d="m105 205 90 91m-90 0 90-91" stroke="#d8c7a7"/>${prepared?'<path d="M100 211q50-29 100 0l-48 84Z" fill="#fff9e6" stroke="#c6b596"/>':''}<text x="150" y="322" class="scene-caption" text-anchor="middle">${state.oriented?'三层面朝向壶嘴':prepared?'再点一下，对准三层面':'① 点击展开，再拖动'}</text>`);}
function allowed(){if(state.transferring)return[];if(!basic())return['beans','weighed','grinder','filter','grounds','kettle','server','paper','dripper'];const s=state.step;if(state.done)return[];if(s===0)return['beans'];if(s===1)return state.grinderBeans>0?['grinder']:state.groundsReady>0?[]:['weighed'];if(s===2)return['filter'];if(s===3)return['kettle'];if(s===4)return state.model.water>=44?['server']:['kettle'];if(s===5)return['grounds'];if(s===6)return state.waiting>0?[]:['kettle'];if(s===7)return state.done?[]:['kettle'];if(s===8){if(state.model.bed>.8)return[];return !state.removed?[brewer==='chemex'?'paper':'dripper']:['server'];}return[];}
function applyInteractive(){const active=grindFocus?['grinder']:allowed();$$('#scene [data-object]').forEach(e=>{const yes=active.includes(e.dataset.object);e.classList.toggle('interactive',yes);e.classList.toggle('selected',selected===e.dataset.object);e.classList.toggle('subdued',basic()&&!yes);e.setAttribute('tabindex',yes?'0':'-1');e.setAttribute('aria-disabled',String(!yes));});}
function renderTools(){const s=state.step,closeUp=mobileCamera?mobileCamera==='grind':grindFocus||basic()&&s===1&&state.scaleDose<.01&&(state.grinderBeans>0||state.done);scene.classList.toggle('grind-close-up',closeUp);setSceneView(closeUp);$('#grind-focus').textContent=grindFocus?'↙ 返回全景':'⤢ 放大研磨';$('#grind-focus').setAttribute('aria-pressed',String(grindFocus));$('#table-view-label').textContent=grindFocus?'拿住木柄，沿轨迹转动':'自由操作台';obj('beans').classList.toggle('object-hidden',basic()&&s!==0);obj('weighed').classList.toggle('object-hidden',state.scaleDose<.1);obj('grinder').classList.toggle('object-hidden',false);obj('grounds').classList.toggle('object-hidden',state.groundsReady<.05);if(!state.transferring)CoffeePaint.attr($('#grounds-stock'),'opacity',state.groundsReady>.05?1:0);obj('filter').classList.toggle('object-hidden',state.filterPlaced&&!state.removed||basic()&&s!==2);obj('waste').classList.toggle('object-hidden',basic()&&![4,8].includes(s));obj('cup').classList.toggle('object-hidden',basic()&&s!==8);filterArt();$('#weighed-beans').innerHTML=Array.from({length:Math.min(8,Math.ceil(state.scaleDose/3))},(_,i)=>`<ellipse cx="${151+i%4*15}" cy="${461+Math.floor(i/4)*8}" rx="6" ry="9" fill="#795334" transform="rotate(${i*24-35} ${151+i%4*15} ${461+Math.floor(i/4)*8})"/>`).join('');drawCrank();obj('grinder').querySelector('.scene-caption').setAttribute('y','188');for(const n of Object.keys(bases))if(n!=='kettle'&&drag?.object!==n&&selected!==n)translate(n);$('#scale').setAttribute('transform','translate(-275 0)');renderVessel();applyInteractive();}
function targetData(){if(state.done&&!state.served)return[];if(!basic())return[{id:'scale',x:175,y:485,rx:75,ry:28,label:'电子秤'},{id:'grinder',x:201,y:294,rx:55,ry:32,label:'磨豆机'},{id:'bed',x:450,y:238,rx:90,ry:25,label:'器具壶口'},{id:'waste',x:815,y:511,rx:70,ry:25,label:'废水盘'},{id:'cup',x:705,y:433,rx:65,ry:25,label:'咖啡杯'}];const s=state.step;if(s===0)return[{id:'scale',x:175,y:485,rx:75,ry:28,label:'把豆子放进这里'}];if(s===1&&state.scaleDose>0)return[{id:'grinder',x:201,y:294,rx:55,ry:32,label:'把称好的豆子送进来'}];if(s===2)return state.folded&&state.oriented?[{id:'bed',x:450,y:238,rx:90,ry:25,label:'把滤纸放到这里'}]:[];if([5,6,7].includes(s)||s===4&&state.model.water<44)return[{id:'bed',x:450,y:238,rx:90,ry:25,label:s===5?'把咖啡粉倒到这里':'壶嘴对准这里，开始注水'}];if(s===4||s===8&&!state.removed&&state.model.bed<.8)return[{id:'waste',x:815,y:511,rx:70,ry:25,label:s===4?'倒掉预热水':'把滤杯 / 滤纸放到这里'}];if(s===8&&state.removed)return[{id:'cup',x:705,y:433,rx:65,ry:25,label:'把咖啡倒进这只杯子'}];return[];}
function gestureTargets(name){return targetData().filter(t=>({beans:['scale','grinder','bed'],weighed:['grinder','bed'],filter:['bed'],grounds:['bed'],kettle:['bed'],server:['waste','cup'],paper:['waste'],dripper:['waste']}[name]||[]).includes(t.id));}
function renderTargets(){if(playMode==='gesture'&&selected){CoffeeGesture.renderGuides(scene,gestureTargets(selected),selected);return;}$('#scene-targets').innerHTML=targetData().map(t=>`<g data-target="${t.id}" role="button" tabindex="0" aria-label="${t.label}"><rect x="${t.x-t.rx}" y="${t.y-48}" width="${t.rx*2}" height="96" fill="transparent" class="target-hit"/><ellipse cx="${t.x}" cy="${t.y}" rx="${t.rx}" ry="${t.ry}" class="target-zone"/><text x="${t.x}" y="${t.y-43}" class="target-label">${t.label}</text></g>`).join('');}
function guide(){const r=recipe(),s=state.step;if(s===0)return['先把咖啡豆，拖到闪烁的秤上。',`每份 5g，还需要 ${15-state.scaleDose}g。按住拖过去再松手；也可以点一下豆子，再点秤。`,'drag','M80 245Q130 335 175 475','称豆：每次 5g','固定粉量，下一杯的变化才更容易比较。'];if(s===1&&state.scaleDose>0)return['把称好的豆子，送进磨豆机。','从秤上拿起豆子，拖到磨豆机上方。豆子进去后，再来转手柄。','drag','M175 465Q230 390 201 294','把豆子放进磨豆机','称量后的豆子需要先进入磨豆机，才会变成咖啡粉。'];if(s===1)return['拿住顶部木柄，沿虚线转动。','木柄沿椭圆轨迹移动，机身不用动。也可点木柄转一小段，磨完三圈自动继续。','orbit','M277 236A76 22 0 1 1 125 236A76 22 0 1 1 277 236','转动手柄，闻一闻香气','研磨会增加咖啡与水接触的面积。手柄圈数在这里是动作练习，研磨刻度另行设置。'];if(s===2&&!state.folded)return[brewer==='chemex'?'先点滤纸，把厚滤纸展开。':'先点滤纸，沿接缝折平。',brewer==='chemex'?'展开后会分成一面三层、一面一层。再点一下，把三层面对准壶嘴。':'先折平底边和侧边接缝，扇形滤纸就更容易贴合梯形滤杯。','tap','M300 140L300 140','先准备滤纸','滤纸需要匹配器具。这里的 Melitta 与 Chemex 使用不同的滤纸。'];if(s===2&&!state.oriented)return['再点一下，让三层面朝向壶嘴。','Chemex 的壶嘴同时留出排气通道。对好方向后，再拿起滤纸。','tap','M300 140L300 140','三层面朝向壶嘴','较厚的三层面支撑滤纸，减少排气通道被压住的可能。'];if(s===2)return['把准备好的滤纸，拖进器具。','拿起左上方的滤纸，放到壶口的金色圈内。','drag','M300 140Q360 150 450 238','放入滤纸','让滤纸贴合器具，然后用热水充分润湿。'];if(s===3)return[state.heating?'正在烧水，看水壶旁的温度上升。':'点一次「开始烧水」，再看看温度。',`从当前水温升到 ${r.temp}°C。到温后会自动保温，并进入润纸，不用反复点击。`,'tap','M727 310L727 310','看温度从低到高，等到目标','水壶旁的温度与目标实时显示；达到目标后自动继续。'];if(s===4&&state.model.water<44)return['拿起水壶，让壶嘴移到滤纸上方。','按住拖动，壶嘴移进金色区域就会出水。润纸约 45g 后，我会提醒你倒掉预热水。','drag','M727 310Q665 240 600 235','看手势，把壶嘴对准滤纸','先润湿滤纸、预热器具。预热水不会算进这杯咖啡的冲煮用水。'];if(s===4)return['现在拿起玻璃壶，倒掉预热水。','把玻璃壶拖到右下方废水盘。预热水要先倒掉，然后再放咖啡粉。','drag','M450 420Q640 385 815 511','把预热水倒进废水盘','预热水与正式冲煮的水分开，这样配方才不会被意外稀释。'];if(s===5)return['拿起接粉杯，把咖啡粉倒进滤纸。','磨好的咖啡粉就在磨豆机右边。拖到壶口松手，让粉层平整。','drag','M300 405Q355 315 450 238','把粉倒入滤纸','均匀的粉层能帮助热水更均匀地接触咖啡。'];if(s===6&&state.waiting>0)return['先停一停，让咖啡粉安静排气。',`参考闷蒸 ${r.wait} 秒，屏幕时间加速 5 倍。看着气泡，等这段倒计时结束。`,'wait','','等待闷蒸','闷蒸先让粉层湿润，并帮助释放气体。不是把所有水一次倒进去。'];if(s===6)return[`绕小圈，先打湿到 ${r.bloom}g。`,'拿起水壶，把壶嘴移到粉层上方。跟着环形手势移动，不要只冲同一个点。','pour','M600 235a40 20 0 1 0 0-1','先少量注水，完成闷蒸','基础练习会帮你停在目标水量。先熟悉动作，再练习自己决定停水时机。'];if(s===7)return[`第 ${state.phase+1} 段，注到累计 ${state.phase?r.water:r.split}g。`,state.phase?'继续绕小圈，补足这一杯的总水量。达到目标后，会自动进入滴滤。':'把水流保持细而稳定。第一段结束后稍等一下，再开始第二段。','pour','M600 235a40 20 0 1 0 0-1','小圈、细水流、分段注水','让水流落在粉层上，尽量避开滤纸边缘。粉水比影响浓淡，注水节奏影响接触。'];if(s===8&&state.model.bed>.8)return['水还在粉层里，再等它滴下来。','观察上方水位下降。等滴滤基本结束，再移开滤杯或滤纸。','wait','','等一等，别急着出杯','下水速度受到研磨、滤纸与器具的影响。进阶模式可以亲自比较。'];if(s===8&&!state.removed)return[brewer==='chemex'?'拿起滤纸和粉渣，放到废水盘。':'移走滤杯，放到废水盘。',brewer==='chemex'?'只取出滤纸与粉渣。Chemex 的上下部是一只完整玻璃壶。':'滤杯与分享壶是分开的，先把上面的滤杯拿走。','drag','M450 250Q650 290 815 511','先移开滤纸 / 滤杯','两种器具的出杯动作不同，拿起之前先认清它们的结构。'];return['最后，拿起咖啡壶，倒进杯子。','把玻璃壶拖到右边的咖啡杯，松手。第一杯，就完成了。','drag','M450 420Q610 355 705 433','倒给自己，完成这一杯','实物冲煮时，出杯前可以轻摇均匀，稍放凉再尝。'];}
function hand(path,kind){const shape='<path class="guide-hand" d="M0 0q0-5 5-5t5 5v17l4-5q3-3 6 0l9 11q4 5 1 13l-3 9H8q-2-11-9-17l-8-8q-4-4 0-7t8 3l4 4V0Z"/><circle class="guide-hand-dot" cx="5" cy="0" r="16"/>';if(!path)return'';const start=path.match(/^M([0-9.]+) ([0-9.]+)/);return`<g>${kind==='tap'?`<circle class="guide-ripple" cx="${start[1]}" cy="${start[2]}" r="20"/>`:''}<g>${shape}<animateMotion path="${path}" dur="${kind==='tap'?'1.1s':'3s'}" repeatCount="indefinite"/></g></g>`;}
function guideSource(){
 const s=state.step;
 if(s===0)return 'beans';
 if(s===1)return state.scaleDose>0?'weighed':'grinder';
 if(s===2)return 'filter';
 if(s===3)return 'kettle';
 if(s===4)return state.model.water>=44?'server':'kettle';
 if(s===5)return 'grounds';
 if(s===6||s===7)return 'kettle';
 if(s===8)return !state.removed?(brewer==='chemex'?'paper':'dripper'):'server';
 return null;
}
function sourceHalo(){
 if(scene.classList.contains('grind-close-up'))return '';
 const el=obj(guideSource());if(!el)return '';
 const r=el.getBoundingClientRect(),ctm=scene.getScreenCTM();
 if(!r.width||!ctm||!ctm.a)return '';
 const c=scene.createSVGPoint();c.x=r.left+r.width/2;c.y=r.top+r.height/2;
 const p=c.matrixTransform(ctm.inverse());
 const rx=clamp(r.width/2/ctm.a*1.04,26,160),ry=clamp(r.height/2/ctm.a*1.04,26,170);
 return `<ellipse class="guide-source-halo" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"/>`;
}
function freeSuggestion(){
 if(state.served)return '这一杯完成了。想再试一次，重新开始就好。';
 const m=state.model;
 if(m.dose>0)return (m.brewWater>0||m.water>0)?'已经有咖啡液了。想收杯就点「出杯品尝」，也可以继续注水稀释。':'粉已经在器具里。拿起水壶开始注水，或者先调整水温。';
 if(state.groundsReady>0)return '接粉杯里有粉。把它倒进器具口，或先润湿滤纸。';
 if(state.grinderBeans>0)return '磨豆机里有豆。拿住顶部木柄转几圈，把粉磨出来。';
 if(state.scaleDose>0)return '秤上有称好的豆子。送进磨豆机，或直接投入器具试试整豆。';
 if(m.water>0)return '壶里有水。把水壶移到器具口上方，按住就会出水。';
 return '先称一份豆子（每份 5g），或者直接拿起任意器具，按自己的顺序来。';
}
function freeSuggestionShort(){
 if(state.served)return '这一杯完成了';
 const m=state.model;
 if(m.dose>0)return '粉已就位，拿起水壶注水';
 if(state.groundsReady>0)return '把接粉杯里的粉倒进器具';
 if(state.grinderBeans>0)return '转动手柄，把豆子磨成粉';
 if(state.scaleDose>0)return '秤上有豆子，送进磨豆机';
 if(m.water>0)return '壶里有水，移到器具口注水';
 return '先称一份豆子，或拿起任意器具';
}
function syncFreeTip(){
 if(basic())return;
 const tip=freeSuggestion();if(tip===lastFreeTip)return;lastFreeTip=tip;
 $('#guide-detail').textContent=tip;
 $('#guide-next').textContent=`建议 · ${freeSuggestionShort()}`;
}
function renderGuide(){
 const isBasic=basic();
 $('#interaction-badge').textContent=isBasic?`基础跟练 · ${names[state.step]}`:'进阶自由 · 随时出杯';
 if(isBasic){const p=progressInfo();$('#guide-progress').textContent=`${p.label} · ${p.value}`;const i=state.step+1;$('#guide-next').textContent=i<names.length?`接下来 · ${String(i+1).padStart(2,'0')} ${names[i]}`:'';}
 else{$('#guide-progress').textContent='';}
 if(isBasic&&state.done&&!state.served){hintText('guide-command',$('#feedback-text').textContent);$('#guide-detail').textContent='完成了！马上带你做下一步。';$('#guide-ghost').innerHTML='';return;}
 if(!isBasic){$('#guide-kicker').textContent='进阶自由 · 这间咖啡馆交给你';hintText('guide-command','器具都在桌上，想怎么冲，就怎么冲。');$('#instruction-title').textContent='这一杯，你说了算。';$('#instruction-desc').textContent='称豆、研磨、加热、注水、出杯——顺序随你，随时可以收杯。';$('#guide-next').textContent=`建议 · ${freeSuggestionShort()}`;syncFreeTip();$('#guide-ghost').innerHTML='';return;}
 const g=guide();$('#guide-kicker').textContent=`咖啡师带你做 · ${state.step+1} / 9`;hintText('guide-command',g[0]);hintText('guide-detail',g[1]);$('#instruction-title').textContent=g[4];const n=state.step+1;$('#instruction-desc').textContent=n<names.length?`下一步是「${names[n]}」，做完这一步会自动继续。`:'做完这一步，这一杯就准备好了。';$('#gesture-icon').textContent=g[2]==='tap'?'☞':g[2]==='orbit'?'↻':g[2]==='wait'?'◷':'↗';$('#gesture-title').textContent=g[4];$('#gesture-desc').textContent='跟着台面上的手势做，完成后自动继续。';$('#why-text').textContent=g[5];$('#guide-ghost').innerHTML=state.demo?sourceHalo()+hand(g[3],g[2]):'';
}

function render(){renderSidebar();$('.coach-eyebrow span:last-child').textContent=basic()?'亲手跟练':'自由操作';$('#free-controls').hidden=basic();$('.gesture-card').hidden=!basic();$('.coach-tip').hidden=!basic();$('.task-progress').hidden=!basic();$('#why-label').textContent='为什么要这样做？';if(basic()){$('#step-eyebrow').textContent=`STEP 0${state.step+1} / 09`;$('#step-options').innerHTML='';$('#step-action').innerHTML='<p class="active-lesson">照着台面的手势操作，完成后会自动进入下一步。</p>';}else renderFreeControls();renderTools();renderTargets();renderGuide();updateHUD();}
function renderSidebar(){if(basic()){$('.sidebar-heading').innerHTML=`<span>这一杯的旅程</span><small>${String(state.step+1).padStart(2,'0')} / 09</small>`;$('#journey-list').innerHTML=names.map((n,i)=>`<li class="${i===state.step?'active':i<state.step?'complete':''}"${i===state.step?' aria-current="step"':''}><span class="step-dot">${i<state.step?'✓':String(i+1).padStart(2,'0')}</span><span>${n}</span></li>`).join('');$('.recipe-slip').hidden=false;}else{$('.sidebar-heading').innerHTML='<span>我的咖啡台</span><small>FREE PLAY</small>';$('#journey-list').innerHTML='<div class="free-sidebar-title">没有固定答案。</div><p class="free-sidebar-desc">材料与器具都在桌上。试一个想法，做出一杯，再看看它为什么会这样。</p><div class="free-status-tile"><span>器具内咖啡</span><strong id="side-dose">0g</strong></div><div class="free-status-tile"><span>壶中液体</span><strong id="side-liquid">0g</strong></div><div class="free-status-tile"><span>粉层中等待滴落</span><strong id="side-bed">0g</strong></div><p class="free-pour-hint">水壶可以自由拖动，松手留在原处；按住空格出水，方向键微调落点。</p><div id="free-log"></div>';$('.recipe-slip').hidden=true;}}
function renderFreeControls(){
 $('#parameter-content').append($('#free-controls'));
 $('#step-eyebrow').textContent='ADVANCED / 自由冲煮';$('#instruction-title').textContent='这一杯，你说了算。';$('#instruction-desc').textContent='桌上器具都能操作，不限定顺序和配方。改一个变量，看看这一杯如何变化。';
 $('#free-controls').innerHTML=`<div class="free-setting"><label>每份咖啡豆 <output id="spoon-out">${state.spoon}g</output></label><div class="dose-chips"><button data-spoon="1" class="${state.spoon===1?'active':''}">1g</button><button data-spoon="5" class="${state.spoon===5?'active':''}">5g</button></div><small>拖豆到秤上称量，也可以直接投入磨豆机或器具。</small></div><div class="free-setting"><label for="free-grind">研磨刻度 <output id="grind-out">${['','细','中细','中','中粗','粗'][state.grind]}</output></label><input id="free-grind" type="range" min="1" max="5" step="1" value="${state.grind}"><div class="range-scale"><span>细 · 更慢下水</span><span>粗 · 更快下水</span></div><small>影响接下来磨出的粉；已磨好的粉不会被刻度改写。</small></div><div class="free-setting"><label for="free-temp">水壶设定 <output id="temp-out">${state.targetTemp}°C</output></label><input id="free-temp" type="range" min="20" max="100" step="1" value="${state.targetTemp}"><div class="range-scale"><span>20°C</span><span>100°C</span></div><div class="heat-buttons"><button id="heat-control">${state.heating?'停止加热':'开始加热'}</button><button id="cool-control">降温</button></div><small>当前实际水温 <span id="actual-temp">${Math.round(state.temp)}</span>°C。注入器具时按实际水温计算。</small></div><div class="free-setting"><label for="free-flow">注水流速 <output id="flow-out">${state.flow}g/s</output></label><input id="free-flow" type="range" min="1" max="6" step=".5" value="${state.flow}"><div class="range-scale"><span>1 g/s · 细水流</span><span>6 g/s · 大水流</span></div><small>拿起水壶，把壶嘴移到器具口上方。松手就停水。</small></div><div class="free-stock"><div><span>秤上豆子</span><strong id="stock-scale">0g</strong></div><div><span>磨豆机内</span><strong id="stock-grinder">0g</strong></div><div><span>磨好的粉</span><strong id="stock-grounds">0g</strong></div><div><span>器具内咖啡</span><strong id="stock-dose">0g</strong></div></div>`;
 $('#step-action').innerHTML='<button class="solid-button" id="serve-now">出杯，看看这一杯的结果 ↗</button><button class="pause-button" id="pause-brew">暂停冲煮时钟</button>';
 $$('[data-spoon]').forEach(b=>b.addEventListener('click',()=>{state.spoon=Number(b.dataset.spoon);$$('[data-spoon]').forEach(x=>x.classList.toggle('active',x===b));$('#spoon-out').textContent=state.spoon+'g';updateHUD();}));
 $('#free-grind').addEventListener('input',e=>{state.grind=Number(e.target.value);$('#grind-out').textContent=['','细','中细','中','中粗','粗'][state.grind];});
 $('#free-temp').addEventListener('input',e=>{state.targetTemp=Number(e.target.value);$('#temp-out').textContent=state.targetTemp+'°C';});
 $('#free-flow').addEventListener('input',e=>{state.flow=Number(e.target.value);$('#flow-out').textContent=state.flow+'g/s';});
 $('#heat-control').addEventListener('click',toggleHeat);$('#cool-control').addEventListener('click',()=>{state.heating=false;state.cooling=true;heatLabel();record('停止加热，开始降温');message('水温正在下降。你可以边等边准备其他器具。');});
 selectSetting(activeSetting);
 $('#serve-now').addEventListener('click',serve);$('#pause-brew').addEventListener('click',()=>{state.paused=!state.paused;finishPour();stopInput();$('#pause-brew').textContent=state.paused?'继续冲煮时钟':'暂停冲煮时钟';message(state.paused?'时钟已暂停，先想一想下一步。':'继续冲煮。');});
}
function autoNext(text,delay=950){if(!basic()||state.done)return;state.done=true;finishPour();stopInput();message(text);renderGuide();applyInteractive();$('#step-action').innerHTML='<p class="active-lesson">✓ '+esc(text)+'<br>马上带你做下一步…</p>';clearTimeout(advanceTimer);advanceTimer=setTimeout(()=>{advanceTimer=null;if(!basic())return;if(state.step===7&&state.phase===0){state.phase=1;}else{state.step++;state.phase=0;}state.done=false;render();scene.focus({preventScroll:true});},delay);}
function refreshAction(){renderTools();renderTargets();renderGuide();updateHUD();}
function prepFilter(){clearPick();if(!state.folded){state.folded=true;if(brewer==='melitta')state.oriented=true;message(brewer==='chemex'?'厚滤纸展开了。再点一下，让三层面朝向壶嘴。':'接缝折好了。现在拖动滤纸，放进壶口。');}else if(!state.oriented){state.oriented=true;message('三层面已对准壶嘴，现在把滤纸拖进器具。');}refreshAction();}
function heatLabel(){if($('#heat-control'))$('#heat-control').textContent=state.heating?'停止加热':'开始加热';$('#steam').classList.toggle('heating',state.heating&&state.temp>75);}
function toggleHeat(){state.started=true;if(basic()&&state.step===3){if(state.heating){message(`正在升温：${Math.round(state.temp)}°C → ${recipe().temp}°C，不用重复点击。`);return;}state.heating=true;state.cooling=false;record(`开始加热，目标 ${recipe().temp}°C`);message('开始烧水了。看水壶旁的温度进度，到温会自动保温。');heatLabel();renderGuide();updateHeatGuide();return;}if(state.heating){state.heating=false;record(`关闭加热，水温 ${Math.round(state.temp)}°C`);}else{state.heating=true;state.cooling=false;record(`开始加热，目标 ${state.targetTemp}°C`);message('水壶开始加热。你可以随时停下。');}heatLabel();renderGuide();}
function canControlHeat(){return !state.paused&&!state.served&&!state.transferring&&(!basic()||state.step===3);}
function stationReadout(){const m=state.model;return{water:Math.round(m.brewWater||m.water),target:basic()&&[6,7].includes(state.step)?basicGoal():recipe().water,temp:Math.round(state.temp),targetTemp:state.targetTemp,heating:state.heating,heatEnabled:canControlHeat()&&!(basic()&&(state.heating||state.temp>=recipe().temp-.01))};}
function updateBrewControls(){document.body.classList.add('has-brew-controls');const bar=$('#brew-controls'),v=stationReadout();bar.hidden=false;CoffeePaint.text($('#brew-water-total'),v.water+' g');CoffeePaint.text($('#brew-kettle-temp'),v.temp+'°C / '+v.targetTemp+'°C');CoffeePaint.text($('#brew-heat-toggle'),v.heating?(basic()?'正在烧水…':'停止烧水'):v.temp>=v.targetTemp?'重新加热':'开始烧水');$('#brew-heat-toggle').disabled=!v.heatEnabled;$('#brew-heat-toggle').setAttribute('aria-pressed',String(v.heating));$('#brew-heat-toggle').setAttribute('data-target',String(v.targetTemp));const height=bar.offsetHeight+'px',wrap=$('#scene-wrap');if(wrap.style.getPropertyValue('--brew-controls-height')!==height)wrap.style.setProperty('--brew-controls-height',height);}
$('#brew-heat-toggle').addEventListener('click',()=>{if(canControlHeat()){toggleHeat();updateBrewControls();}});
function returnKettleHome(){const el=obj('kettle'),from={...kettlePos};finishPour();clearPick();drag=null;translate('kettle');if(!reducedMotion.matches&&Math.hypot(from.x,from.y)>1)el.animate([{transform:`translate(${from.x}px,${from.y}px)`},{transform:'translate(0px,0px)'}],{duration:250,easing:'cubic-bezier(.22,1,.36,1)'});renderOperationHints();}
function updateHeatGuide(){const visible=basic()&&state.step===3;$('#heat-guide').hidden=!visible;document.body.classList.toggle('watching-heat',visible);if(!visible)return;const target=recipe().temp,ready=state.temp>=target-.01;CoffeePaint.text($('#heat-now'),Math.round(state.temp)+'°C');CoffeePaint.text($('#heat-target'),target+'°C');const progress=clamp((state.temp-20)/(target-20)*100,0,100);$('#heat-progress i').style.width=progress+'%';CoffeePaint.attr($('#heat-progress'),'aria-valuenow',String(Math.round(progress)));CoffeePaint.text($('#heat-guide-state'),ready?'温度到了，已保温。接下来润湿滤纸。':state.heating?'正在升温，等进度到目标就好。':'点一次开始，不用连续点击。');$('#heat-start').disabled=state.heating||ready;CoffeePaint.text($('#heat-start'),ready?'热水准备好 ✓':state.heating?'正在烧水…':'开始烧水 →');if(state.heating)CoffeePaint.text($('#guide-command'),`正在烧水：${Math.round(state.temp)}°C → ${target}°C`);}
$('#heat-start').addEventListener('click',toggleHeat);

function loadGrinder(amount){if(amount<.01){message('秤上还没有豆子。先放一点豆子上去。',true);return;}state.grinderBeans+=amount;state.grindLoad=state.grinderBeans;state.turns=0;state.grindQueue=0;record(`把 ${amount.toFixed(1)}g 豆子送进磨豆机`);message('豆子进去了。拿住顶部木柄，沿椭圆轨迹转动。');refreshAction();}
// The handle moves in a horizontal plane: only its projected endpoint changes.
// Keep the shaft and body fixed, rather than rotating an upright arm in screen space.
function drawCrank(){
 const {x,y}=CoffeeGrinder.point(state.displayAngle);
 CoffeePaint.attr($('#crank-arm'),'d',`M201 258L${x} ${y}`);
 CoffeePaint.attr($('#crank-arm-shine'),'d',`M201 256L${x} ${y-2}`);
 CoffeePaint.attr($('#crank-grip'),'transform',`translate(${x} ${y})`);
 const loaded=state.grinderBeans>.001&&!state.done,active=!!drag&&drag.object==='grinder'||grindKey||state.grindQueue>0;
 CoffeePaint.attr($('#crank-orbit'),'opacity',loaded&&(grindFocus||basic()&&state.step===1)?'.7':'0');
 CoffeePaint.attr($('#crank-direction'),'opacity',loaded&&(grindFocus||basic()&&state.step===1)?'.8':'0');
 obj('grinder').classList.toggle('grinding',active&&loaded);
 CoffeePaint.text($('#grind-scene-progress'),state.grindLoad>0?`${Math.round(Math.min(1,state.turns/3)*100)}%`:'');
 CoffeePaint.attr($('#grind-output-fill'),'y',445-Math.min(1,state.turns/3)*29);
}
function queueGrind(radians=Math.PI/2){
 if(state.paused||state.done||state.served||!allowed().includes('grinder'))return;
 if(state.grinderBeans<.001){message('先把豆子放进磨豆机，再拿住顶部木柄。',true);return;}
 state.started=true;state.grindQueue=Math.min(Math.PI*6,state.grindQueue+radians);
}
function rotateGrinder(radians){
 if(state.paused||state.done||state.served||!allowed().includes('grinder')||state.grinderBeans<.001)return;
 state.started=true;const amount=Math.abs(radians),made=Math.min(state.grinderBeans,state.grindLoad*amount/(Math.PI*6)),old=state.groundsReady;
 if(made===0)return;
 state.readyGrind=(state.readyGrind*old+state.grind*made)/(old+made);state.groundsReady+=made;
 state.grinderBeans=Math.max(0,state.grinderBeans-made);state.turns+=amount/(Math.PI*2);state.crankAngle+=radians;state.dirty=true;
 if(state.grinderBeans<.001){state.grinderBeans=0;state.grindQueue=0;grindKey=false;record(`磨好 ${state.groundsReady.toFixed(1)}g 咖啡粉，刻度 ${state.readyGrind.toFixed(1)}/5`);if(basic())autoNext('咖啡粉磨好了，接着准备滤纸。');else message('咖啡粉磨好了。把接粉杯拖到器具口里，或继续加豆子。');renderTools();}
 updateHUD();
}
function clearPick(){selected=null;$('#scene-targets').classList.remove('targets-ready');$$('#scene .selected').forEach(e=>e.classList.remove('selected'));$('#selection-caption').textContent='';}
function drop(name,target,offset={}){if(state.transferring)return;if(target&&!(name==='grounds'&&target==='bed')&&!(name==='server'&&target==='cup'))transferMotion(name,target);clearPick();state.started=true;const m=state.model,s=state.step;
 if(name==='beans'&&target==='scale'){const add=basic()?Math.min(state.spoon,15-state.scaleDose):state.spoon;state.scaleDose=Math.min(100,state.scaleDose+add);record(`称豆：秤上 ${state.scaleDose.toFixed(1)}g`);if(basic()&&state.scaleDose>=15)autoNext('15g 刚刚好！下一步把它送进磨豆机。');else message(`秤上 ${state.scaleDose.toFixed(1)}g${basic()?`，再加 ${15-state.scaleDose}g。`:'。你可以继续加，或把它送进磨豆机。'}`);}
 else if((name==='weighed'||name==='beans'&&!basic())&&target==='grinder'){const amount=name==='weighed'?state.scaleDose:state.spoon;if(name==='weighed')state.scaleDose=0;loadGrinder(amount);return;}
 else if(name==='filter'&&target==='bed'){if(basic()&&(!state.folded||!state.oriented)){filterTapReminder();return;}state.filterPlaced=true;state.removed=false;m.filter=true;m.hadFilter=true;m.oriented=state.oriented;record(brewer==='chemex'?`放入 Chemex 厚滤纸，三层面${state.oriented?'已':'未'}朝向壶嘴`:'放入 Melitta 扇形滤纸');if(basic())autoNext('滤纸安放好了。接下来准备热水。');else message('滤纸已放好。你可以润纸，也可以直接开始冲。');}
 else if(name==='grounds'&&target==='bed'){if(state.groundsReady<.05){message('还没有磨好的咖啡粉。先把豆子送进磨豆机。',true);return;}pourGrounds(offset);return;}
 else if(!basic()&&['beans','weighed'].includes(name)&&target==='bed'){const amount=name==='weighed'?state.scaleDose:state.spoon;if(amount<.01)return;if(name==='weighed')state.scaleDose=0;BrewModel.addGrounds(m,amount,5,true);state.dosed=true;message('整豆直接进入器具。接触面积较小，看看它会萃取出什么。');}
 else if(name==='server'&&target==='waste'){if(m.water<.1&&m.liquid<.1&&m.bed<.1){message('壶里还没有可以倒掉的水。',true);return;}if(m.filter&&m.dose===0){m.rinsed=true;state.rinseDone=true;}BrewModel.discard(m);if(basic())autoNext('预热水倒掉了。现在把磨好的粉倒进来。');else message('壶里的液体倒掉了。你可以重新开始注水。');}
 else if(['paper','dripper'].includes(name)&&target==='waste'){state.removed=true;BrewModel.removeFilter(m);record('咖啡粉与液体分开');if(basic()){message('移开了。最后拿起咖啡壶，倒进杯子。');}else message('滤纸 / 滤杯已移开。你可以出杯，也可以加水稀释这杯。');}
 else if(name==='server'&&target==='cup'){serve(offset);return;}
 else{message(basic()?`这一步先「${names[state.step]}」。看金色虚线标记，跟着手势再试一次。`:'这件器具还没放到合适的位置。可以点“操作帮助”查看拿起和放下的方式。',true);}
 refreshAction();
}
function targetAt(p){for(const t of targetData()){if(Math.abs(p.x-t.x)<t.rx+18&&Math.abs(p.y-t.y)<65)return t.id;}return null;}
function point(e){const p=scene.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(scene.getScreenCTM().inverse());}
function pick(name){clearPick();state.started=true;selected=name;$('#scene-targets').classList.add('targets-ready');obj(name)?.classList.add('selected');$('#selection-caption').textContent=name==='kettle'?'水壶拿起了。拖动壶嘴自由定位，松手后留在原处。':'拿好了。再点目标位置放下，也可以直接拖动。';if(playMode==='gesture')renderTargets();if(name==='kettle')bedView?.open();}
function positionKettle(pt){state.started=true;if(pt)translate('kettle',pt.x-577,pt.y-213);selected='kettle';obj('kettle').classList.add('selected');$('#selection-caption').textContent='壶嘴跟随你放置的位置；按住注水，松手停水。';scene.focus({preventScroll:true});}
scene.setAttribute('tabindex','-1');
function beginPointer(e){if(e.button!==0||drag||state.paused||state.served||state.transferring)return;const target=e.target.closest('[data-target]');if(target){if(selected){const source=selected;if(source==='kettle'&&target.dataset.target==='bed')positionKettle(point(e));else drop(source,target.dataset.target);}e.preventDefault();return;}const el=e.target.closest('[data-object]');if(!el||!allowed().includes(el.dataset.object))return;const name=el.dataset.object;el.getAnimations().forEach(a=>a.cancel());e.preventDefault();state.started=true;const p=point(e);if(!e.gesture)scene.setPointerCapture(e.pointerId);if(name==='kettle'&&basic()&&state.step===3){toggleHeat();return;}if(name==='grinder'){if(!e.target.closest('[data-crank-handle]')){message(basic()?'拿住顶部的木质把手转动，机身留在原地。':'拿住顶部木柄转动。需要看大一点时，点右上角“放大研磨”。');return;}if(state.grinderBeans<.001){message('先把豆子放进磨豆机，再转动木柄。',true);return;}clearPick();state.grindQueue=0;state.crankAngle=state.displayAngle;drag={object:name,pointerId:e.pointerId,start:p,crank:CoffeeGrinder.begin(state.displayAngle,p),moved:false};return;}drag={object:name,pointerId:e.pointerId,start:p,clientX:e.clientX,clientY:e.clientY,origin:name==='kettle'?{...kettlePos}:{x:0,y:0},moved:false,dx:0,dy:0};clearPick();el.classList.add('selected');if(playMode==='gesture')CoffeeGesture.renderGuides(scene,gestureTargets(name),name);}
scene.addEventListener('pointerdown',beginPointer);
function movePointer(e){if(!drag||e.pointerId!==drag.pointerId)return;if(drag.object==='kettle'&&(bedView?.active||Math.hypot(e.clientX-drag.clientX,e.clientY-drag.clientY)>5&&bedView?.open())){drag.moved=true;bedView.move(e);pointerPour=bedView.ready;bedView.setPouring(pointerPour);return;}const p=point(e);if(Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>5)drag.moved=true;if(drag.object==='grinder'){rotateGrinder(CoffeeGrinder.step(drag.crank,p));state.displayAngle=state.crankAngle;drawCrank();return;}drag.dx=drag.origin.x+p.x-drag.start.x;drag.dy=drag.origin.y+p.y-drag.start.y;if(drag.object==='kettle'){translate('kettle',clamp(drag.dx,-490,30),clamp(drag.dy,-135,200));pointerPour=drag.moved;}else translate(drag.object,drag.dx,drag.dy);}
scene.addEventListener('pointermove',movePointer);
function endPointer(e,cancel=false){if(!drag||e.pointerId!==drag.pointerId)return;const d=drag;drag=null;pointerPour=false;if(d.object==='grinder'){if(!cancel&&!d.moved)queueGrind();return;}obj(d.object)?.classList.remove('selected');if(d.object==='kettle'){finishPour();if(!cancel&&!d.moved)pick('kettle');return;}translate(d.object);if(cancel)return;if(d.moved&&d.object==='filter'&&(!state.folded||!state.oriented)&&(basic()||targetAt(point(e))!=='bed')){filterTapReminder();settleObject(d.object,d.dx,d.dy);return;}if(!d.moved){if(d.object==='filter'&&(!state.folded||!state.oriented)){prepFilter();return;}pick(d.object);return;}drop(d.object,targetAt(point(e)),{dx:d.dx,dy:d.dy});settleObject(d.object,d.dx,d.dy);}
scene.addEventListener('pointerup',e=>endPointer(e));scene.addEventListener('pointercancel',e=>endPointer(e,true));
scene.addEventListener('keydown',e=>{const name=e.target.closest('[data-object]')?.dataset.object,target=e.target.closest('[data-target]')?.dataset.target;if(e.key==='Escape'){finishPour();stopInput();return;}if(state.paused||state.served||state.transferring)return;
 if(name==='grinder'&&['ArrowRight','Enter',' '].includes(e.key)){e.preventDefault();if(!allowed().includes('grinder'))return;if(e.key===' '){if(state.grinderBeans>.001){state.grindQueue=0;grindKey=true;}else if(!e.repeat)queueGrind();}else if(!e.repeat)queueGrind();return;}
 if(name==='kettle'&&basic()&&state.step===3&&['Enter',' '].includes(e.key)){e.preventDefault();if(!e.repeat)toggleHeat();return;}
 if(selected==='kettle'&&!target&&(!name||name==='kettle')){if([' ','Enter'].includes(e.key)){e.preventDefault();keyPour=true;return;}const delta={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-7],ArrowDown:[0,7]}[e.key];if(delta){e.preventDefault();translate('kettle',clamp(kettlePos.x+delta[0],-490,20),clamp(kettlePos.y+delta[1],-135,200));return;}}
 if(['Enter',' '].includes(e.key)){e.preventDefault();if(target&&selected){if(selected==='kettle'&&target==='bed')positionKettle();else drop(selected,target);return;}if(name&&allowed().includes(name)){if(name==='filter'&&(!state.folded||!state.oriented))prepFilter();else pick(name);}}
});
scene.addEventListener('keyup',e=>{if(e.key===' ')grindKey=false;if([' ','Enter'].includes(e.key)&&keyPour){e.preventDefault();keyPour=false;finishPour();}});
// Gesture input delegates to the same pointer handlers and model conditions.
function mountGesture(){
 if(!window.CoffeeGesture?.available)return;
 CoffeeGesture.mount(CoffeeGesture.bind({scene,canPick:name=>!state.paused&&!state.served&&!state.transferring&&allowed().includes(name),select:pick,clear:clearPick,start:beginPointer,move:movePointer,end:endPointer,dragging:()=>Boolean(drag),busy:()=>state.paused||state.served||state.transferring,hold:finishPour,grind:rotateGrinder,markMoved:()=>{if(drag)drag.moved=true;},
  targets:gestureTargets,
  stop({handoff=false}={}){finishPour();grindKey=false;state.grindQueue=0;if(!handoff)state.heating=false;transferCancel?.();transferCancel=null;stopInput();heatLabel();}
 }));
 document.title=recipe().name+' · 手势冲煮（测试版） — 寻萃集工坊';
}
function basicGoal(){if(state.step===4)return 45;if(state.step===6)return recipe().bloom;return state.phase?recipe().water:recipe().split;}
function finishPour(){bedView?.pause();state.pourZone=undefined;$('#pour-hold').classList.remove('pouring');BrewModel.stopPour(state.model);pointerPour=keyPour=false;$('#kettle-body').removeAttribute('transform');$('#water-fx').innerHTML='';if(!basic()&&state.model.brewWater>0)state.dirty=true;}
function stopAtGoal(){finishPour();stopInput();if(state.step===4){message('滤纸已经润湿。跟着手势，把预热水倒进废水盘。');refreshAction();return;}if(state.step===6){state.waiting=recipe().wait;message(`先停一下，闷蒸 ${recipe().wait} 秒。等倒计时结束就继续。`);refreshAction();return;}if(state.step===7)autoNext(state.phase?'水量到位，接下来等它滴滤。':'第一段完成。停一下，再拿起水壶注第二段。',state.phase?800:1700);}
function pourTick(dt){const m=state.model;if(!(pointerPour||keyPour)||state.paused||state.served||basic()&&(![4,6,7].includes(state.step)||state.waiting>0||state.done)){$('#kettle-body').removeAttribute('transform');$('#water-fx').innerHTML='';return;}
 if(bedView?.active&&!bedView.ready)return;let spout={x:577+kettlePos.x,y:213+kettlePos.y},valid=spout.x>363&&spout.x<537&&spout.y>80&&spout.y<228;
 if(bedView?.active){valid=bedView.ready&&bedView.point.inside;bedView.setPouring(true);}state.pourZone=valid;let amount=state.flow*speed*dt;if(basic()){const value=state.step===4?m.water:m.brewWater;amount=Math.min(amount,Math.max(0,basicGoal()-value));}
 $('#kettle-body').setAttribute('transform','rotate(-12 577 213)');
 if(valid){const a=Math.atan2((spout.y-155)/35,(spout.x-450)/70),sector=(Math.floor((a+Math.PI)/(Math.PI*2)*8)+8)%8;const landing=bedView?.active?bedView.point:CoffeePourBed.sample((spout.x-450)/82,(spout.y-155)/60);BrewModel.addWater(m,amount,state.temp,bedView?.active?landing.sector:sector,landing);drawWater(`M${spout.x} ${spout.y}Q${spout.x-4} ${(spout.y+238)/2} ${spout.x} 238`,spout.x);state.dirty=true;
 if(basic()&&(state.step===4?m.water:m.brewWater)>=basicGoal()-.01)stopAtGoal();
 }else{m.spilled+=amount;drawWater(`M${spout.x} ${spout.y}L${spout.x} 435`);feedback(basic()?'壶嘴再往金色圈内移一点，看示范中的壶嘴位置。':'水洒到台面上了，没有进入器具。',true);}
}
function progressInfo(){
 const m=state.model,s=state.step;let label,current,target,unit;
 if(s===0)[label,current,target,unit]=['已称取',state.scaleDose,15,'g'];
 else if(s===1)[label,current,target,unit]=state.scaleDose>0?['放入磨豆机',0,1,'次']:['手柄转动',Math.min(3,state.turns),3,'圈'];
 else if(s===2)[label,current,target,unit]=['滤纸准备',state.filterPlaced?3:state.oriented?2:state.folded?1:0,3,'步'];
 else if(s===3)[label,current,target,unit]=['实际水温',state.temp,recipe().temp,'°C'];
 else if(s===4)[label,current,target,unit]=['润纸用水',m.water,45,'g'];
 else if(s===5)[label,current,target,unit]=['投入咖啡粉',m.dose,15,'g'];
 else if(s===6)[label,current,target,unit]=state.waiting>0?['闷蒸计时',recipe().wait-state.waiting,recipe().wait,'秒']:['闷蒸注水',m.brewWater,recipe().bloom,'g'];
 else if(s===7)[label,current,target,unit]=[`第 ${state.phase+1} 段累计`,m.brewWater,basicGoal(),'g'];
 else[label,current,target,unit]=m.bed>.8?['等待滴滤',Math.max(0,70-m.bed),70,'']:['出杯动作',state.removed?1:0,2,'步'];
 if(state.done&&!state.served)current=target;else if(state.served)current=target;
 const value=`${current.toFixed(unit==='圈'?1:0)} / ${(target.toFixed?target.toFixed(0):target)} ${unit}`.trim();
 return{label,current,target,unit,value};
}
function renderProgress(){
 const p=progressInfo(),pct=clamp(p.current/p.target*100,0,100);
 CoffeePaint.text($('#progress-label'),p.label);CoffeePaint.text($('#progress-value'),p.value);$('#progress-fill').style.width=pct+'%';
 const bar=document.querySelector('.progress-bar');
 if(bar){CoffeePaint.attr(bar,'role','progressbar');CoffeePaint.attr(bar,'aria-valuemin','0');CoffeePaint.attr(bar,'aria-valuemax','100');CoffeePaint.attr(bar,'aria-valuenow',String(Math.round(pct)));CoffeePaint.attr(bar,'aria-label',`${p.label} ${p.value}`);}
 return p;
}
function updateHUD(){const m=state.model;updateQuickControls();updateHeatGuide();updateBrewControls();if(!basic())syncFreeTip();renderOperationHints();CoffeePaint.html($('#live-dose'),(m.dose||state.scaleDose||(state.grinderBeans+state.groundsReady)).toFixed(1)+' <small>g</small>');CoffeePaint.html($('#live-water'),Math.round(m.brewWater||m.water)+' <small>g</small>');CoffeePaint.html($('#live-temp'),Math.round(state.temp)+' <small>°C</small>');CoffeePaint.text($('#live-time'),fmt(m.brewStart===null?0:m.simTime-m.brewStart));CoffeePaint.text($('#kettle-temp'),Math.round(state.temp)+'°C');$('#steam').classList.toggle('heating',state.heating&&state.temp>75);CoffeePaint.text($('#scale-display'),state.scaleDose.toFixed(1)+' g');const groundsLabel=obj('grounds').querySelector('.scene-caption');if(groundsLabel)CoffeePaint.text(groundsLabel,`接粉杯 · ${state.groundsReady.toFixed(1)}g`);const beansLabel=obj('beans').querySelector('.scene-caption');if(beansLabel)CoffeePaint.text(beansLabel,`咖啡豆 · 每份 ${state.spoon}g`);
 if(basic()){const s=state.step;renderProgress();if(s===1&&!state.done&&state.scaleDose===0)CoffeePaint.text($('#guide-detail'),`已经磨了 ${Math.min(3,state.turns).toFixed(1)} / 3 圈。拖动顶部木柄，或聚焦磨豆机后按住空格连续磨豆。`);if(s===6&&state.waiting>0){CoffeePaint.html($('#step-action'),`<div class="basic-wait"><strong>${Math.ceil(state.waiting/speed)} 秒</strong>屏幕剩余时间 · 实物参考 ${recipe().wait} 秒<br>不用点下一步，等一等就好。</div>`);}if(s===3&&!state.done){CoffeePaint.text($('#guide-detail'),state.temp>=recipe().temp-1?`温度到 ${Math.round(state.temp)}°C 了！现在点一下水壶，停止加热。`:guide()[1]);}
 }else{for(const [id,val] of [['stock-scale',state.scaleDose],['stock-grinder',state.grinderBeans],['stock-grounds',state.groundsReady],['stock-dose',m.dose],['side-dose',m.dose],['side-liquid',m.liquid],['side-bed',m.bed]])if($('#'+id))$('#'+id).textContent=val.toFixed(1)+'g';if($('#actual-temp'))CoffeePaint.text($('#actual-temp'),Math.round(state.temp));if($('#free-log'))CoffeePaint.html($('#free-log'),m.events.slice(-4).reverse().map(e=>`<div class="free-event"><small>${fmt(e.time)}</small>${esc(e.text)}</div>`).join(''));}
}
function frame(now){const dt=lastFrame?Math.min((now-lastFrame)/1000,.1):0;lastFrame=now;if(!document.hidden&&!state.paused&&!state.served&&!state.transferring){
 if((state.grindQueue>0||grindKey)&&state.grinderBeans>.001){const radians=grindKey?dt*Math.PI*2:Math.min(state.grindQueue,dt*Math.PI*2);if(!grindKey)state.grindQueue=Math.max(0,state.grindQueue-radians);rotateGrinder(radians);}
 if(drag?.object==='grinder')state.displayAngle=state.crankAngle;else state.displayAngle+=(state.crankAngle-state.displayAngle)*(1-Math.exp(-dt*22));drawCrank();
 if(state.heating){if(state.temp<state.targetTemp)state.temp=Math.min(state.targetTemp,state.temp+dt*8);if(basic()&&state.step===3&&state.temp>=recipe().temp-.01){state.heating=false;record(`达到目标水温 ${recipe().temp}°C，自动保温`);heatLabel();autoNext(`${recipe().temp}°C，热水准备好了。接下来润湿滤纸。`,1100);}if(!basic()&&state.temp>=state.targetTemp){state.heating=false;record(`达到设定水温 ${Math.round(state.temp)}°C`);heatLabel();}}
 if(state.cooling){state.temp=Math.max(20,state.temp-dt*2);if(state.temp<=20){state.cooling=false;heatLabel();}}
 if(state.started){BrewModel.tick(state.model,dt*speed);if(state.model.dose>0)state.dirty=true;}
 bedView?.step();
 pourTick(dt);
 bedView?.paint();
 if(basic()&&state.waiting>0){state.waiting=Math.max(0,state.waiting-dt*speed);if(state.waiting===0){state.bloomDone=true;autoNext('闷蒸完成了。接着练习分段注水。');}}
 if(basic()&&state.step===8&&!state.done){const ready=state.model.bed<.8;if(ready!==state.finishReady){state.finishReady=ready;renderTargets();renderGuide();applyInteractive();if(ready)message(brewer==='chemex'?'滴滤基本结束了。取出滤纸和粉渣。':'滴滤基本结束了。移走滤杯，再来倒咖啡。');}}
 }
 if(now-lastHUD>100){updateHUD();bedView?.update();lastHUD=now;}
 if(!bedView?.active&&now-lastArt>50&&state.dirty){renderVessel();lastArt=now;}
 requestAnimationFrame(frame);
}
function transferBusy(on){state.transferring=on;document.body.classList.toggle('material-transferring',on);$('#quick-serve').disabled=on||state.served;applyInteractive();}
function pourGrounds(offset={}){
 const amount=state.groundsReady,dose=state.model.dose,grind=state.readyGrind;finishPour();stopInput();transferBusy(true);
 message('倾斜接粉杯，让咖啡粉从杯口落进滤纸。');
 transferCancel=StudioMotion.transfer({kind:'grounds',layer:$('#particle-fx'),base:[100,0],pivot:[200,410],mouth:[239,383],offset:[offset.dx||0,offset.dy||0],to:[450,238],angle:78,pileWidth:65,actors:()=>[obj('grounds')],paused:()=>state.paused,
  onFrame(f){state.visualDose=dose+amount*f.poured;CoffeePaint.attr($('#grounds-stock'),'opacity',1-f.poured);state.dirty=true;},
  onReset(){translate('grounds');},
  onCancel(){delete state.visualDose;transferBusy(false);state.dirty=true;},
  onComplete(){transferCancel=null;BrewModel.addGrounds(state.model,amount,grind);state.groundsReady=Math.max(0,state.groundsReady-amount);delete state.visualDose;state.dosed=true;transferBusy(false);if(basic())autoNext('咖啡粉到位了！拿起水壶，先来闷蒸。');else message(`器具里已有 ${state.model.dose.toFixed(1)}g 咖啡，可以随时注水。`);refreshAction();}
 });
}
function serve(offset={}){
 if(state.served||state.transferring)return;finishPour();stopInput();const m=state.model,r=BrewModel.result(m);state.lastResult=r;
 const complete=()=>{state.served=true;delete state.visualLiquid;transferBusy(false);StudioMotion.fillCup(scene,r.volume,m.dose>0);renderVessel();resultTimer=setTimeout(()=>showResult(r),180);};
 if(r.volume<.1){complete();return;}transferBusy(true);message('慢慢倾斜壶身，看咖啡流进杯子。');
 const chemex=brewer==='chemex';
 transferCancel=StudioMotion.transfer({kind:'liquid',layer:$('#particle-fx'),base:[0,0],pivot:chemex?[450,410]:[450,445],mouth:chemex?[563,218]:[488,375],offset:[offset.dx||0,offset.dy||0],to:[705,433],angle:chemex?48:55,coffee:m.dose>0,actors:()=>[obj('server')],paused:()=>state.paused,
  onFrame(f){state.visualLiquid=m.liquid*(1-f.poured);StudioMotion.fillCup(scene,r.volume*f.poured,m.dose>0);state.dirty=true;},
  onReset(){translate('server');},onCancel(){delete state.visualLiquid;StudioMotion.fillCup(scene,0);transferBusy(false);state.dirty=true;},
  onComplete(){transferCancel=null;complete();}
 });
}
function showResult(r){const dialog=$('#result-dialog');dialog.classList.toggle('advanced-result',!basic());$('.result-coffee').textContent=r.volume>0?'☕':'◌';$('#result-dialog h2').textContent=basic()?'第一杯，你真的学会了。':r.title;$('.result-sub').textContent=basic()?'从称豆到出杯，这些动作都是你亲手完成的。':r.description;$('#result-score').textContent='9/9';$('#result-advice').textContent=basic()?'你已经会拿起器具、转柄研磨、准备滤纸、控温、润纸、闷蒸、分段注水和出杯。下一步，把这些动作交给自己的想法。':'这是一张按本次操作生成的风味画像。教学估算，用来比较变量的影响。';
 $('#result-metrics').innerHTML=(basic()?[['器具',recipe().name],['冲煮用水',r.water+'g'],['实际水温',r.temp+'°C'],['亲手完成','9 个步骤']]:[['粉量',r.dose.toFixed(1)+'g'],['冲煮用水',r.water+'g'],['杯中液体',r.volume+'g'],['平均水温',r.temp+'°C'],['模拟萃取',r.extraction.toFixed(1)+'%'],['模拟浓度',r.tds.toFixed(2)+'%']]).map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join('');
 $('#taste-profile').innerHTML=basic()?'':r.profile.map(p=>`<div class="taste-meter" data-taste="${p.name}"><span>${p.name}</span><div><i style="width:${p.value}%"></i></div><small>${Math.round(p.value)}</small></div>`).join('');
 $('#cause-results').innerHTML=basic()?'':'<div class="result-section-heading">你做了什么 → 这杯为什么会这样</div>'+r.reasons.map(x=>`<div class="cause-card"><strong>${esc(x.cause)}</strong><p>→ ${esc(x.effect)}</p><small>下一杯：${esc(x.next)}</small></div>`).join('');
 $('#action-history').innerHTML=basic()?'':'<div class="result-section-heading">这一杯的操作足迹</div>'+state.model.events.slice(-10).map(e=>`<div class="free-event"><small>${fmt(e.time)}</small>${esc(e.text)}</div>`).join('');
 $('#to-advanced').hidden=!basic();$('#back-to-table').hidden=basic();$('#try-again').textContent=basic()?'再跟练一遍':'清理台面，再冲一杯';$('#save-workshop-note').disabled=false;$('#save-workshop-note').textContent='收进我的咖啡手记 ↗';dialog.showModal();if(basic()){state.done=true;$('#guide-command').textContent='这一杯完成了！现在，咖啡馆交给你。';$('#guide-detail').textContent='你可以进入进阶模式，试一杯自己的配方。';$('#guide-ghost').innerHTML='';$('#step-action').innerHTML='<button class="solid-button" id="unlock-advanced">去进阶，自由冲一杯 →</button>';$('#unlock-advanced').addEventListener('click',()=>reset(brewer,'advanced'));}}
function returnToTable(){if(!basic()){state.served=false;StudioMotion.fillCup(scene,0);$('#cup-liquid').setAttribute('y',527);$('#cup-top').setAttribute('fill','#e9e0cb');refreshAction();}}
$('#back-to-table').addEventListener('click',()=>$('#result-dialog').close());$('#result-dialog').addEventListener('close',returnToTable);
$('#to-advanced').addEventListener('click',()=>{$('#result-dialog').close();reset(brewer,'advanced');});$('#try-again').addEventListener('click',()=>{$('#result-dialog').close();reset();});
$('#save-workshop-note').addEventListener('click',()=>{const r=state.lastResult;try{const old=JSON.parse(localStorage.getItem('slowbrew-notes')||'[]'),notes=Array.isArray(old)?old:[];notes.unshift({id:crypto.randomUUID(),name:`${recipe().name} · ${basic()?'基础跟练':'自由配方'}`,dose:Number(r.dose.toFixed(1)),water:r.water,temp:r.temp,taste:basic()?'基础练习完成':r.title,memo:basic()?'亲手完成九个步骤。':r.description+'\n'+r.reasons.slice(0,3).map(x=>x.cause+' → '+x.effect).join('\n'),date:new Date().toISOString()});localStorage.setItem('slowbrew-notes',JSON.stringify(notes));$('#save-workshop-note').disabled=true;$('#save-workshop-note').textContent='已收进咖啡手记 ✓';}catch{message('浏览器暂时无法保存，你可以先记下这杯的参数。',true);}});
$$('[data-brewer]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.brewer!==brewer)reset(b.dataset.brewer);}));$$('[data-play-mode]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.playMode!==playMode)reset(brewer,b.dataset.playMode);}));
$('#start-basic').addEventListener('click',()=>{$('#mode-dialog').close();reset(brewer,'basic');});$('#start-advanced').addEventListener('click',()=>{$('#mode-dialog').close();reset(brewer,'advanced');});
$('#restart').addEventListener('click',()=>{reset();message('台面整理好了，开始一杯新的。');});$('#replay-demo').addEventListener('click',()=>{state.demo=true;renderGuide();message('看台面上的手势，跟着试一次。');});
$('#help-button').addEventListener('click',()=>$('#help-dialog').showModal());$('#close-help').addEventListener('click',()=>$('#help-dialog').close());$$('.dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
window.addEventListener('blur',()=>{finishPour();grindKey=false;state.grindQueue=0;if(drag)stopInput();});document.addEventListener('visibilitychange',()=>{if(document.hidden){finishPour();stopInput();state.heating=false;heatLabel();}});scene.addEventListener('focusout',e=>{if(!scene.contains(e.relatedTarget)){grindKey=false;if(keyPour)finishPour();}});

const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function setSceneView(closeUp){
 const mobile=matchMedia('(max-width:760px)').matches||document.body.classList.contains('workshop-play'),view=mobileCamera==='brew'?'brew':closeUp?'grind':'overview';let target=mobile?(view==='brew'?'300 110 570 490':view==='grind'?'45 180 325 380':'0 120 900 490'):(playMode==='gesture'&&view==='brew'?'245 70 600 540':closeUp?'50 165 302 335':'0 0 900 640');const box=window.CoffeeWorkshopDisplay?.cameraBox(target.split(' ').map(Number),{expanded:document.body.classList.contains('workshop-play'),view})||target.split(' ').map(Number);target=box.join(' ');scene.style.setProperty('--mobile-scene-ratio',`${box[2]} / ${box[3]}`);document.dispatchEvent(new CustomEvent('coffee-camera-change',{detail:{view}}));if(viewTarget===target)return;
 viewTarget=target;cancelAnimationFrame(viewAnimation);
 const from=scene.getAttribute('viewBox').split(' ').map(Number),to=target.split(' ').map(Number),start=performance.now();
 function zoom(now){const t=reducedMotion.matches?1:clamp((now-start)/360,0,1),ease=1-Math.pow(1-t,3);scene.setAttribute('viewBox',from.map((v,i)=>v+(to[i]-v)*ease).join(' '));if(t<1)viewAnimation=requestAnimationFrame(zoom);}
 viewAnimation=requestAnimationFrame(zoom);
}
document.addEventListener('coffee-camera-resize',()=>{finishPour();stopInput();setSceneView(scene.classList.contains('grind-close-up'));});
function setGrindFocus(on){if(basic())return;finishPour();stopInput();grindFocus=on;renderTools();if(on&&state.grinderBeans<.001)message('先返回全景，把豆子放进磨豆机。');}
$('#grind-focus').addEventListener('click',()=>setGrindFocus(!grindFocus));
document.addEventListener('coffee-camera',e=>{finishPour();drag=null;const view=e.detail.view;mobileCamera=(playMode==='gesture'||document.body.classList.contains('workshop-play')||matchMedia('(max-width:760px)').matches)&&view!=='auto'?view:null;grindFocus=mobileCamera==='grind';renderTools();});
function selectSetting(index){activeSetting=Number(index);$$('#free-controls .free-setting').forEach((el,i)=>el.hidden=i!==activeSetting);$$('.setting-tabs [data-setting]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.setting)===activeSetting);b.setAttribute('aria-pressed',String(Number(b.dataset.setting)===activeSetting));});}
$$('[data-setting]').forEach(b=>b.addEventListener('click',()=>{if(basic()||playMode==='gesture')return;selectSetting(b.dataset.setting);if(!$('#parameter-dialog').open){finishPour();stopInput();$('#parameter-dialog').showModal();}}));
function closeParameters(){const dialog=$('#parameter-dialog');if(reducedMotion.matches){dialog.close();return;}dialog.classList.add('closing');setTimeout(()=>{dialog.classList.remove('closing');dialog.close();},160);}
$('#close-parameters').addEventListener('click',closeParameters);
$('#parameter-dialog').addEventListener('cancel',e=>{e.preventDefault();closeParameters();});
$('#parameter-dialog').addEventListener('click',e=>{if(e.target===$('#parameter-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeParameters();}});
function updateQuickControls(){
 if(basic())return;
 CoffeePaint.html($('#quick-spoon'),state.spoon+' <small>g</small>');
 CoffeePaint.text($('#quick-grind'),['','细','中细','中','中粗','粗'][state.grind]);
 CoffeePaint.html($('#quick-temp'),state.targetTemp+' <small>°C</small>');
 CoffeePaint.html($('#quick-flow'),state.flow+' <small>g/s</small>');
 $('[data-setting="2"]').classList.toggle('is-heating',state.heating);
 $('#pour-hold').disabled=state.paused||state.served;
 $('#quick-serve').disabled=state.served||state.transferring;
}
$('#quick-serve').addEventListener('click',serve);
function beginHoldPour(){if(basic()||state.paused||state.served)return;if(grindFocus)setGrindFocus(false);clearPick();positionKettle();bedView?.open();keyPour=bedView?.active?bedView.ready:true;$('#pour-hold').classList.add('pouring');}
const pourButton=$('#pour-hold');
pourButton.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();pourButton.setPointerCapture(e.pointerId);beginHoldPour();});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>pourButton.addEventListener(type,finishPour));
pourButton.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)beginHoldPour();}});
pourButton.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();finishPour();}});
pourButton.addEventListener('blur',finishPour);
function drawWater(path,x){const fx=$('#water-fx');if(!fx.firstElementChild)fx.innerHTML='<path class="water-stream"/><ellipse rx="13" ry="3" cy="238" fill="none" stroke="#a0bba1"/>';fx.firstElementChild.setAttribute('d',path);fx.lastElementChild.setAttribute('cx',x||0);fx.lastElementChild.setAttribute('opacity',x===undefined?0:1);}
function transferMotion(name,target){
 if(reducedMotion.matches)return;
 const start={beans:[80,245],weighed:[175,465],grounds:[300,405],filter:[300,140],server:[450,420],paper:[450,240],dripper:[450,240]}[name],end=targetData().find(t=>t.id===target);
 if(!start||!end)return;
 const layer=$('#particle-fx'),g=document.createElementNS('http://www.w3.org/2000/svg','g');
 const bean=['beans','weighed','grounds'].includes(name);
 g.innerHTML=Array.from({length:bean?7:3},(_,i)=>`<ellipse cx="${i%3*9-9}" cy="${Math.floor(i/3)*8}" rx="${bean?4:9}" ry="${bean?6:3}" fill="${bean?'#795132':'#d4b57b'}"/>`).join('');layer.append(g);
 const now=performance.now();function fly(t){const p=clamp((t-now)/500,0,1),v=1-Math.pow(1-p,3),x=start[0]+(end.x-start[0])*v,y=start[1]+(end.y-start[1])*v-Math.sin(p*Math.PI)*60;g.setAttribute('transform',`translate(${x} ${y})`);g.setAttribute('opacity',1-p*p);if(p<1)requestAnimationFrame(fly);else g.remove();}requestAnimationFrame(fly);
}

function settleObject(name,dx,dy){if(state.transferring)return;
 const el=obj(name),base=bases[name]||{x:0,y:0};if(!el||reducedMotion.matches||!dx&&!dy)return;
 el.animate([{transform:`translate(${base.x+dx}px,${base.y+dy}px)`},{transform:`translate(${base.x-dx*.035}px,${base.y-dy*.035}px)`,offset:.8},{transform:`translate(${base.x}px,${base.y}px)`}],{duration:340,easing:'cubic-bezier(.2,.75,.3,1)'});
}
// Retain unchanged SVG nodes while liquid levels change, keeping focus and motion intact.
function patchVessel(markup){if(vesselMarkup===markup)return;StudioMotion.patch($('#brewer-layer'),markup,50);vesselMarkup=markup;}

function hintText(id,text){const el=$('#'+id);if(el.textContent!==text)el.textContent=text;}
function renderOperationHints(){
 const paperVisible=!grindFocus&&!state.filterPlaced&&(!basic()||state.step===2)&&!state.served;
 const prepared=state.folded&&state.oriented;
 $('#filter-guide').hidden=true;
 $('#filter-guide').classList.toggle('paper-ready',prepared);
 obj('filter').classList.toggle('needs-tap',paperVisible&&!prepared);
 $('#fold-filter-button').hidden=false;$('#fold-filter-button').disabled=prepared||state.paused||state.served;
 hintText('filter-guide-title',prepared?'滤纸就绪，拖进滤杯':!state.folded?(brewer==='chemex'?'先点一下，展开厚滤纸':'先点一下，折好滤纸'):'再点一下，对准三层面');
 hintText('filter-guide-detail',prepared?'按住台面上的滤纸，拖到壶口的金色圈内再松手。':'折好之后，再把滤纸拖进壶口。');
 hintText('fold-filter-button',state.folded?'点击对准':'点击展开'+(brewer==='chemex'?'':' / 折纸'));
 if(brewer==='melitta')hintText('fold-filter-button','点击折纸');if(prepared)hintText('fold-filter-button','已准备 ✓');
 const pouring=(pointerPour||keyPour)&&!state.paused&&!state.served;
 const showPour=!grindFocus&&!state.served&&(!basic()||([4,6,7].includes(state.step)&&allowed().includes('kettle')));
 const missed=pouring&&state.pourZone===false,docked=selected==='kettle'&&577+kettlePos.x>363&&577+kettlePos.x<537&&213+kettlePos.y>80&&213+kettlePos.y<228;
 $('#pour-guide').hidden=!showPour;
 $('#pour-guide').classList.toggle('is-pouring',pouring&&!missed);
 $('#pour-guide').classList.toggle('pour-missed',missed);
 hintText('pour-guide-title',missed?'壶嘴还没对准，水洒到台面了':pouring?'正在注水 · 松手立即停水':docked?(basic()?'壶嘴已就位 · 按住拖壶开始出水':'壶嘴已就位 · 按住下方按钮出水'):selected==='kettle'?'水壶已拿起，壶嘴对准滤杯上方':'拖壶注水 · 松手即停');
 hintText('pour-guide-detail',missed?'水流跟着壶嘴直落。拖动水壶，自己选择滤杯内的落点。':pouring?'按住移动可改变落点；松开手指，水流就会停止。':docked?'松开即停；想改变落点，也可按住水壶继续拖动、绕圈。':selected==='kettle'&&!basic()?'先拖动壶嘴选择落点，再按住下方按钮注水；水流不会自动对准。':'① 按住水壶拖动　② 壶嘴移到滤杯上方　③ 继续按住移动出水');
 hintText('pour-state',missed?'未对准':pouring?'出水中':state.model.water>0?'已停水':'待注水');
 $('#pour-shortcut').hidden=basic()||pouring||selected==='kettle';
 if(bedView?.active){hintText('pour-guide-title','粉床俯视 · 水壶随落点移动');hintText('pour-guide-detail','按住移动绕圈，松手停水。深色表示已润湿；返回台面后，冲煮进度继续保留。');$('#pour-shortcut').hidden=true;}
}
function filterTapReminder(){
 clearPick();renderOperationHints();message(brewer==='chemex'&&state.folded?'先点一下滤纸，对准三层面，再拖动。':'这一步先「点击」滤纸，准备好后再拖进滤杯。',true);
 obj('filter')?.focus({preventScroll:true});
}
$('#fold-filter-button').addEventListener('click',()=>{if(state.paused||state.served||grindFocus||state.filterPlaced||state.folded&&state.oriented||!allowed().includes('filter'))return;prepFilter();});
$('#studio-tool').addEventListener('change',e=>{const tool=e.target.value;if(CoffeeMethods.methods[tool])location.assign(`workshop.html?tool=${tool}&mode=${playMode}`);else reset(tool,playMode);});
addEventListener('pagehide',()=>{transferCancel?.();clearTimeout(resultTimer);StudioMotion.stop();});
bedView=CoffeePourBed.mount({wrap:$('#scene-wrap'),scene,
 state:()=>({...stationReadout(),available:CoffeePourBed.available({model:state?.model,basic:basic(),step:state?.step,served:state?.served,transferring:state?.transferring}),map:state?.model.wetMap,temp:state?.temp,point:CoffeePourBed.sample((577+kettlePos.x-450)/82,(213+kettlePos.y-155)/60),blocked:state?.paused?'已暂停，恢复后再注水。':basic()&&(state.waiting>0||state.done)?'先停水等待，粉床湿润痕迹会保留。':''}),
 aim:p=>{translate('kettle',450+p.x*82-577,155+p.y*60-213);},
 source:()=>({x:450,y:state.filterPlaced?(brewer==='chemex'?226:238):brewer==='chemex'?292:345}),
 returnArt:()=>{state.dirty=true;renderVessel();return $('#brewer-layer');},
 onReturn:returnKettleHome,heat:()=>{if(canControlHeat())toggleHeat();},
 hold:()=>{if(state.paused||state.served||state.transferring)return;state.started=true;pointerPour=true;},stop:finishPour
});
reset();if(!params.has('mode'))$('#mode-dialog').showModal();requestAnimationFrame(frame);

})();
