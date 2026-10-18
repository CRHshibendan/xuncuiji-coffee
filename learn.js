'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const readSetting=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const saveSetting=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
let motionPaused=reduceMotion.matches||readSetting('xuncuiji-motion-paused',false),selectedBrewer=['melitta','chemex',...Object.keys(CoffeeMethods.methods)].includes(new URLSearchParams(location.search).get('tool'))?new URLSearchParams(location.search).get('tool'):'melitta',activeVariable='ratio',recipeStep=0,recipeTimer=null,lastPhase=-1,scrollFrame=0,activeChapter='';
const recipes={melitta:{name:'Melitta',water:225,temp:92,grind:'中细',bloom:30,wait:30,split:125},chemex:{name:'Chemex',water:240,temp:93,grind:'中',bloom:40,wait:45,split:140}};
const brewerContent={melitta:{alt:'Melitta 梯形陶瓷滤杯与独立侧把手',tag:'滤杯 + 分享壶，彼此分开。',subtitle:'THE EVERYDAY CLASSIC',title:'Melitta，<br>先把接缝折平。',intro:'上面是滤杯，下面是承接咖啡的分享壶或杯子。它们是分开的，出杯前先把滤杯移走。',facts:[['匹配扇形滤纸','按器具型号选对滤纸尺寸。先折平底部与侧面接缝，再展开贴合。'],['先润纸，再倒掉水','把滤纸放进滤杯后润湿、预热。正式投粉前，把预热水倒掉。'],['从中细研磨试起','这里用 15g 粉、225g 水作为练习起点，再按下水速度和口感微调。']]},chemex:{alt:'Chemex 木领沙漏形一体玻璃咖啡壶',tag:'上面过滤，下面接液，是同一只玻璃壶。',subtitle:'THE GLASS HOURGLASS',title:'Chemex，<br>认准滤纸的三层面。',intro:'漏斗与承接咖啡的壶身连成一体。准备好滤纸后放入上半部，完成冲煮时取出滤纸和粉渣。',facts:[['使用适配的专用滤纸','圆形或方形滤纸展开后，一面三层、一面一层；不同型号按包装说明准备。'],['三层面朝向壶嘴','让较厚的一侧靠在导流嘴处，支撑滤纸，并为排气通道留出空间。'],['留意厚滤纸的下水','本课以 15g 粉、240g 水、中研磨为起点。观察水位，别因为滴得慢就不断补水。']]}};
function swapAnimation(el){if(motionPaused||reduceMotion.matches)return;el.classList.remove('animate-swap');requestAnimationFrame(()=>el.classList.add('animate-swap'));}
function setMotion(){
 document.body.classList.toggle('motion-paused',motionPaused);document.body.classList.toggle('motion-enabled',!motionPaused);
 $('#motion-toggle').setAttribute('aria-pressed',String(motionPaused));$('#motion-toggle').textContent=reduceMotion.matches?'已减少动态效果':motionPaused?'开启动画 ▷':'暂停动画 Ⅱ';$('#motion-toggle').disabled=reduceMotion.matches;
 if(motionPaused)stopRecipe();
}
$('#motion-toggle').addEventListener('click',()=>{motionPaused=!motionPaused;saveSetting('xuncuiji-motion-paused',motionPaused);setMotion();});
reduceMotion.addEventListener('change',()=>{motionPaused=reduceMotion.matches||readSetting('xuncuiji-motion-paused',false);setMotion();});
function selectBrewer(name){
 selectedBrewer=name;recipeStep=0;const data=brewerContent[name]||CoffeeMethods.methods[name],method=CoffeeMethods.methods[name];
 $$('[data-learn-brewer]').forEach(b=>{const yes=b.dataset.learnBrewer===name;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;});
 $('#brewer-panel').setAttribute('aria-labelledby','tab-'+name);const toolTabs=$('.brewer-tabs'),toolTab=$('#tab-'+name);toolTabs.scrollTo({left:toolTab.offsetLeft-toolTabs.offsetLeft-toolTabs.clientWidth/2+toolTab.offsetWidth/2,behavior:motionPaused?'instant':'smooth'});
 $('#brewer-image').src=`assets/${name}.svg`;$('#brewer-image').alt=data.alt;$('#brewer-tag').textContent=data.tag;
 $('#brewer-copy').innerHTML=`<p class="brewer-subtitle">${data.subtitle}</p><h3>${data.title}</h3><p>${data.intro}</p><div class="brewer-facts">${data.facts.map(([a,b],i)=>`<div><b>${i+1}</b><div><strong>${a}</strong>${b}</div></div>`).join('')}</div>`;
 if(method)$('#brewer-copy').insertAdjacentHTML('beforeend',`<a class="method-source" href="${method.source[1]}" target="_blank" rel="noopener">${method.source[0]} ↗</a><div class="brewer-practice-links"><a href="method-lab.html?tool=${name}&mode=basic">基础跟练 →</a><a href="method-lab.html?tool=${name}&mode=advanced">进阶自由 · 由你决定 ↗</a></div>`);
 swapAnimation($('#brewer-copy'));swapAnimation($('#brewer-image'));
 $$('[data-practice]').forEach(a=>{const advanced=a.dataset.practice==='advanced';a.href=`${method?'method-lab':'workshop'}.html?tool=${name}&mode=${a.dataset.practice}`;if(a.closest('.finale-buttons'))a.innerHTML=advanced?(method?'进阶自由 · 冲法由你决定 <span>↗</span>':'进阶自由 · 试自己的配方 <span>↗</span>'):(method?'动作跟练 · 一步步做 <span>↗</span>':'基础跟练 · 一步步做 <span>↗</span>');});
 const r=recipes[name];if(method){$('#recipe-meta').innerHTML=`<div><span>今天的器具</span><strong>${method.name}</strong></div>${method.meta.map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join('')}`;}else $('#recipe-meta').innerHTML=`<div><span>今天的器具</span><strong>${r.name}</strong></div><div><span>咖啡粉 / 冲煮用水</span><strong>15 <small>g</small> / ${r.water} <small>g</small></strong></div><div><span>起点水温</span><strong>${r.temp} <small>°C</small></strong></div><div><span>起点研磨</span><strong>${r.grind}<small>研磨</small></strong></div>`;
 stopRecipe();renderRecipe();
}
$$('[data-learn-brewer]').forEach(b=>b.addEventListener('click',()=>selectBrewer(b.dataset.learnBrewer)));
function keyboardTabs(selector,attribute,select){$$(selector).forEach(b=>b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=$$(selector),i=tabs.indexOf(b),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;select(tabs[next].getAttribute(attribute));tabs[next].focus();}));}
keyboardTabs('[data-learn-brewer]','data-learn-brewer',selectBrewer);
const roasts=[{title:'想试试明亮、轻盈的感觉？',desc:'可以从带有花香、水果描述的浅烘焙试起。酸质可能更鲜明；先用自己的味觉分辨是喜欢的清爽，还是不喜欢的尖锐。'},{title:'想从平衡、熟悉的风味开始？',desc:'试试带有坚果、焦糖或巧克力描述的中烘焙。它可以是第一杯的起点，再慢慢探索自己的偏好。'},{title:'想尝尝更明显的烘焙风味？',desc:'试试深烘焙。常见更明显的苦感和烘焙香气；如果觉得苦涩，可以记录水温、研磨与时间，再做小幅调整。'}];
$$('[data-roast]').forEach(b=>b.addEventListener('click',()=>{const index=Number(b.dataset.roast),r=roasts[index];$$('[data-roast]').forEach(x=>{const yes=x===b;x.classList.toggle('active',yes);x.setAttribute('aria-pressed',String(yes));});$('.bean-world').dataset.roast=index;$('#roast-title').textContent=r.title;$('#roast-desc').textContent=r.desc;swapAnimation($('.roast-description'));}));
function selectVariable(name){
 activeVariable=name;$$('button[data-variable]').forEach(b=>{const yes=b.dataset.variable===name;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;});
 $$('[data-variable-control]').forEach(p=>p.hidden=p.dataset.variableControl!==name);$('#variable-panel').setAttribute('aria-labelledby','tab-'+name);$('.variable-visual').dataset.variable=name;updateVariable();swapAnimation($('#variable-panel'));
}
$$('button[data-variable]').forEach(b=>b.addEventListener('click',()=>selectVariable(b.dataset.variable)));
keyboardTabs('button[data-variable]','data-variable',selectVariable);
function updateVariable(){
 const dose=Number($('#learn-dose').value),ratio=Number($('#learn-ratio').value),grind=Number($('#learn-grind').value),temp=Number($('#learn-temperature').value),water=Math.round(dose*ratio),names=['','细','中细','中','中粗','粗'],visual=$('.variable-visual');
 $('#dose-value').textContent=dose+' g';$('#ratio-value').textContent='1 : '+ratio;$('#grind-value').textContent=names[grind];$('#temperature-value').textContent=temp+'°C';
 visual.style.setProperty('--water-height',clamp(water/540*85,20,85)+'%');visual.style.setProperty('--ground-height',dose/30*65+'%');visual.style.setProperty('--ground-size',3+grind*1.7+'px');visual.style.setProperty('--drip-speed',(2.1-grind*.3)+'s');visual.style.setProperty('--temperature-height',(temp-70)/30*85+5+'%');
 if(activeVariable==='ratio'){
  $('#visual-kicker').textContent='冲煮用水';$('#visual-number').innerHTML=water+' <span>g</span>';$('#visual-dose').textContent=dose+'g 咖啡粉';$('#variable-title').textContent=`${dose}g 咖啡，搭配 ${water}g 水。`;
  $('#variable-description').textContent=`1:${ratio} 是每 1g 咖啡配 ${ratio}g 冲煮用水。${ratio<15?'相同粉量下，用水少一些，通常更浓。':ratio>16?'相同粉量下，用水多一些，通常更清淡。':'先用它作为起点，再按口感调整浓淡。'}粉层会留住部分水，杯中液体通常少于注水量。`;
  $('#variable-caption').textContent='水量 = 咖啡粉量 × 比例';visual.setAttribute('aria-label',`${dose}克咖啡粉配${water}克冲煮用水，粉水比1比${ratio}`);
 }else if(activeVariable==='grind'){
  $('#visual-kicker').textContent='当前研磨示意';$('#visual-number').innerHTML=names[grind]+' <span>研磨</span>';
  $('#variable-title').textContent=grind<=2?'磨细一点，接触面积更多。':grind>=4?'磨粗一点，水通常更快流过。':'中研磨，先观察这杯的下水。';
  $('#variable-description').textContent=grind<=2?'细颗粒通常让萃取更充分，也可能使下水变慢。若积水明显、口腔干涩，下一杯可以只试着调粗一点。':grind>=4?'粗颗粒通常下水较快。若这杯尖酸、空薄，下一杯可只试着磨细一点，保持水温和粉水比不变。':'颗粒分布、细粉和滤纸也影响下水。相同刻度在不同磨豆机上不代表相同颗粒，先记录自己的结果。';
  $('#variable-caption').textContent='水流动画只表示常见变化方向';visual.setAttribute('aria-label',names[grind]+'研磨颗粒与水流变化示意');
 }else{
  $('#visual-kicker').textContent='当前设定水温';$('#visual-number').innerHTML=temp+' <span>°C</span>';
  $('#variable-title').textContent=temp<89?'低一些，给萃取一点不同的节奏。':temp>95?'高一些，帮助风味更快溶出。':'从这里开始，再用味觉决定。';
  $('#variable-description').textContent=`${temp}°C 是这里的设定值。${temp<89?'相同条件下，较低水温往往让溶出变慢。若不喜欢空薄、尖锐的感觉，下次可以只提高水温。':temp>95?'相同条件下，较高水温往往有助于溶出。若觉得苦涩干燥，下次可以只降低一点水温。':'本课以 92–93°C 作为练习起点，不代表所有豆子都适用。'}实际粉层温度还会受器具和注水影响。`;
  $('#variable-caption').textContent='设定温度 ≠ 每一刻的粉层温度';visual.setAttribute('aria-label',temp+'摄氏度水温示意');
 }
}
$$('#variable-panel input').forEach(input=>input.addEventListener('input',updateVariable));
function steps(){if(CoffeeMethods.methods[selectedBrewer])return CoffeeMethods.methods[selectedBrewer].steps;const r=recipes[selectedBrewer];return[
 {name:'准备滤纸',hint:'先折，再放入',title:selectedBrewer==='melitta'?'先折纸，再放入。':'展开滤纸，认准三层面。',text:selectedBrewer==='melitta'?'沿扇形滤纸的底边和侧边接缝折平，再展开贴合梯形滤杯。滤杯稳稳放在分享壶或杯子上。':'展开匹配的 Chemex 滤纸，让三层面朝向导流嘴。一层面在另一边，壶嘴处留出排气的空间。',observe:'滤纸贴合器具，没有塌进壶嘴或堆成一团。',visual:'先把滤纸准备好'},
 {name:'称豆研磨',hint:'15g 咖啡豆',title:`称好 15g，磨成${r.grind}。`,text:`先固定粉量，更容易比较下一杯。将 15g 豆子磨成${r.grind}颗粒；磨豆机刻度不能照搬，先以自己的颗粒与下水表现为准。`,observe:'先闻一闻刚磨好的干粉，记下第一个香气联想。',visual:'豆子变成更小的颗粒'},
 {name:'准备热水',hint:r.temp+'°C 起步',title:`把水准备在 ${r.temp}°C 附近。`,text:'用温控壶或温度计确认水温。准备的水要留出润纸用量；这份配方的冲煮水量不包含稍后倒掉的预热水。',observe:'温度是开始的参考；实物器具和热水都要留意烫手。',visual:'水温是配方的一个变量'},
 {name:'润纸温壶',hint:'预热水要倒掉',title:'润湿滤纸，记得倒掉水。',text:'用热水润湿滤纸并预热器具。把流进下方容器的预热水倒掉，再开始正式冲煮；不要把它混进咖啡。',observe:'滤纸已经湿润，承接咖啡的容器里没有预热水。',visual:'先润纸，再清空预热水'},
 {name:'投粉闷蒸',hint:`${r.bloom}g · 等约 ${r.wait}s`,title:`先注到 ${r.bloom}g，再等一等。`,text:`把粉倒进滤纸，轻轻整理平整后归零。开始计时，用细水流均匀打湿至累计 ${r.bloom}g，参考等待 ${r.wait} 秒，让气体排出。`,observe:'粉层都湿润了；闷蒸用水计入这一杯的总注水量。',visual:'小气泡，是粉层正在排气'},
 {name:'分段注水',hint:`累计 ${r.split}g → ${r.water}g`,title:`分两段，累计注到 ${r.water}g。`,text:`闷蒸后缓慢绕小圈，先注到累计 ${r.split}g。观察水位回落，再继续到累计 ${r.water}g。落点尽量留在粉层内，避免一直冲刷滤纸边缘。`,observe:'这里都是秤上的累计数值，不是每段要额外再加这么多水。',visual:'细水流，落点留在粉层里'},
 {name:'滴滤出杯',hint:'观察，再品尝',title:'等它滴下，留一口给自己。',text:selectedBrewer==='melitta'?'观察水位下降、滴滤基本结束，移开上面的 Melitta 滤杯。轻轻晃匀分享壶里的咖啡，倒入杯中，稍放凉后尝一尝。':'观察水位下降、滴滤基本结束，取出滤纸和粉渣。轻轻晃匀 Chemex 壶中的咖啡，倒入杯中，稍放凉后再尝。',observe:'记下总时间与口感。下一杯保留配方，只改一个变量。',visual:'记录味道，让下一杯有方向'}
 ];}
function renderRecipe(){const all=steps(),s=all[recipeStep];
 $('#recipe-timeline').innerHTML=all.map((item,i)=>`<button data-recipe-step="${i}" class="${i===recipeStep?'active':''}" aria-pressed="${i===recipeStep}"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${item.name}</strong><small>${item.hint}</small></div></button>`).join('');
 $$('[data-recipe-step]').forEach(b=>b.addEventListener('click',()=>{stopRecipe();recipeStep=Number(b.dataset.recipeStep);renderRecipe();$('#recipe-timeline .active').focus({preventScroll:true});}));
 const method=CoffeeMethods.methods[selectedBrewer],visual=$('.step-visual');visual.classList.toggle('new-method',!!method);visual.querySelector('.method-step-art')?.remove();if(method){visual.insertAdjacentHTML('afterbegin',`<div class="method-step-art">${MethodArt.render(selectedBrewer,all.slice(0,recipeStep+1).map(v=>v.token),s.token,.6)}</div>`);}else $('#step-heat').textContent=recipes[selectedBrewer].temp+'°C';
 $('#recipe-step-count').textContent=String(recipeStep+1).padStart(2,'0')+' / '+String(all.length).padStart(2,'0');$('.step-visual').dataset.step=recipeStep;$('#step-visual-label').textContent=s.visual;$('#recipe-action').textContent=s.name;$('#recipe-step-title').textContent=s.title;$('#recipe-step-description').textContent=s.text;$('#recipe-step-observe').textContent=s.observe;$('#previous-step').disabled=recipeStep===0;$('#next-step').textContent=recipeStep===steps().length-1?'重新看一遍 ↻':'下一步 →';
 const timeline=$('#recipe-timeline'),active=timeline.querySelector('.active');if(timeline.scrollWidth>timeline.clientWidth&&active)timeline.scrollTo({left:active.offsetLeft-timeline.clientWidth/2+active.offsetWidth/2,behavior:motionPaused?'instant':'smooth'});
}
function stopRecipe(){clearInterval(recipeTimer);recipeTimer=null;const button=$('#play-recipe');if(button){button.setAttribute('aria-pressed','false');button.textContent='播放步骤动画 ▷';}}
$('#play-recipe').addEventListener('click',()=>{if(recipeTimer){stopRecipe();return;}if(recipeStep===steps().length-1)recipeStep=0;renderRecipe();$('#play-recipe').setAttribute('aria-pressed','true');$('#play-recipe').textContent='暂停播放 Ⅱ';recipeTimer=setInterval(()=>{if(document.hidden){stopRecipe();return;}if(recipeStep<steps().length-1){recipeStep++;renderRecipe();}else stopRecipe();},6500);});
$('#previous-step').addEventListener('click',()=>{stopRecipe();recipeStep=Math.max(0,recipeStep-1);renderRecipe();});$('#next-step').addEventListener('click',()=>{stopRecipe();recipeStep=recipeStep===steps().length-1?0:recipeStep+1;renderRecipe();});
const tasteAdvice={sour:{title:'先试着，只磨细一点。',description:'如果酸得尖、又有空薄感，可能是萃取不够，也可能和豆子本身有关。用同一支豆子，把研磨小幅调细，比较口感有没有变得更完整。',keep:'同一支豆、粉量、水量与水温',change:'研磨小幅调细一次',context:'明亮、清爽的酸质也可能是好喝的风味，先以自己的喜好判断。'},bitter:{title:'先试着，只磨粗一点。',description:'如果苦感伴随干涩、且下水很慢，可以先小幅调粗研磨。记录滴滤时间有没有缩短，口腔里是否更柔和，再决定下一步。',keep:'同一支豆、粉量、水量与水温',change:'研磨小幅调粗一次',context:'烘焙风味、细粉或不均匀注水也会影响口感，这只是一次对照实验。'},weak:{title:'先分清，淡还是萃取不足。',description:'如果味道完整、只是浓度低，可先减少同样粉量的用水，例如从 1:16 改到 1:15。若同时尖酸空薄，则优先尝试调整研磨。',keep:'同一支豆、粉量、研磨与水温',change:'只减少一点冲煮用水',context:'喝起来清淡不一定是缺点；选择你愿意每天喝的那种浓度。'},good:{title:'喜欢这一杯，就把它留下。',description:'记录豆子、器具、粉量、水量、水温、研磨和大致时间。再写一句自己的味觉联想，下次用同一套条件试着复现。',keep:'这一次的参数与动作',change:'先不改，下一杯尝试复现',context:'风味词没有标准答案。你喜欢的感觉，比漂亮的术语更值得记录。'}};
function chooseTaste(name){const data=tasteAdvice[name];$$('[data-taste]').forEach(b=>{const yes=b.dataset.taste===name;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});$('#taste-title').textContent=data.title;$('#taste-description').textContent=data.description;$('#taste-keep').textContent=data.keep;$('#taste-change').textContent=data.change;$('#taste-context').textContent=data.context;swapAnimation($('.taste-response'));}
$$('[data-taste]').forEach(b=>b.addEventListener('click',()=>chooseTaste(b.dataset.taste)));
const revealObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');revealObserver.unobserve(entry.target);}});},{threshold:.08});$$('.reveal').forEach(el=>revealObserver.observe(el));
function onScroll(){scrollFrame=0;const max=document.documentElement.scrollHeight-innerHeight;$('#reading-progress').style.width=(max>0?clamp(scrollY/max,0,1)*100:0)+'%';
 const chapters=$$('[data-chapter]');let current=chapters[0].id;chapters.forEach(section=>{if(section.getBoundingClientRect().top<innerHeight*.38)current=section.id;});
 if(current!==activeChapter){activeChapter=current;$$('.chapter-nav a').forEach(a=>{const yes=a.getAttribute('href')==='#'+current;a.classList.toggle('active',yes);if(yes)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});const selected=$('.chapter-nav a.active'),nav=$('.chapter-nav');if(selected&&(selected.offsetLeft<nav.scrollLeft||selected.offsetLeft+selected.offsetWidth>nav.scrollLeft+nav.clientWidth))nav.scrollTo({left:selected.offsetLeft-nav.clientWidth/2+selected.offsetWidth/2,behavior:motionPaused?'instant':'smooth'});}
 let phase=0;$$('.story-step').forEach((el,i)=>{if(el.getBoundingClientRect().top<innerHeight*.82)phase=i;});
 if(phase!==lastPhase){lastPhase=phase;$('.story-simulation').dataset.phase=phase;$('#story-count').textContent='0'+(phase+1)+' / 03';$('.story-simulation').setAttribute('aria-label','当前演示：'+['均匀打湿咖啡粉','可溶物进入水中','液体穿过滤纸流入杯中'][phase]);$$('.story-step').forEach((el,i)=>el.classList.toggle('active',i===phase));}
}
window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(onScroll);},{passive:true});window.addEventListener('resize',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(onScroll);});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRecipe();});
$('#story-grains').innerHTML=Array.from({length:62},(_,i)=>`<circle cx="${100+(i*37)%265}" cy="${125+(i*23)%116}" r="${2+i%3}" fill="${i%2?'#62462c':'#d3b57c'}"/>`).join('');
$('#grind-particles').innerHTML=Array.from({length:30},(_,i)=>`<i style="--particle-angle:${i*47%90}deg"></i>`).join('');
setMotion();selectBrewer(selectedBrewer);updateVariable();chooseTaste('sour');onScroll();
