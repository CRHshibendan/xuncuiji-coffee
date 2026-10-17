'use strict';
const $ = (selector, parent=document) => parent.querySelector(selector);
const $$ = (selector, parent=document) => [...parent.querySelectorAll(selector)];
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const esc = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storageOK = true;
const read = (key,fallback) => {try {return JSON.parse(localStorage.getItem(key)) ?? fallback;} catch {return fallback;}};
const persist = (key,value) => {try {localStorage.setItem(key,JSON.stringify(value));return true;} catch {storageOK=false;toast('浏览器存储不可用，本次数据仅在页面内保留。');return false;}};
let toastTimeout;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),3600);}
// Navigation
$('.menu-button').addEventListener('click',()=>{const open=$('.header nav').classList.toggle('open');$('.menu-button').setAttribute('aria-expanded',String(open));});
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{$('.header nav').classList.remove('open');$('.menu-button').setAttribute('aria-expanded','false');}));
const observer = new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){let id=entry.target.id;$$('.nav-link').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+id));}}},{rootMargin:'-12% 0px -65% 0px',threshold:0});
$$('main section[id]').forEach(section=>observer.observe(section));
$$('dialog .close-dialog').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
$$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
// Lessons
const completedRaw=read('slowbrew-lessons',[]);
const completed=new Set(Array.isArray(completedRaw)?completedRaw.filter(n=>[0,1,2].includes(n)):[]);
const lessons=[
 {title:'你的第一套手冲装备',time:'LESSON 01 · 认识器具',body:`<p>手冲，就是让热水流经咖啡粉，再用滤纸把咖啡液与粉渣分开。第一杯从这几样器具开始。</p><h3>滤杯 + 匹配的滤纸</h3><p>滤杯支撑滤纸，滤纸留下粉渣。Melitta 先折好扇形滤纸接缝；Chemex 则展开专用厚滤纸，让三层面朝向壶嘴。放好后用热水润湿、预热器具，再倒掉预热水。</p><h3>细口壶 + 电子秤</h3><p>细口壶帮助你控制水流。电子秤让粉量和注水量可以复现；先称粉，准备注水前再归零。没有细口壶，可以先用能稳定倒出细水流的壶练习。</p><h3>磨豆机 + 接咖啡的杯子</h3><p>Melitta 可以从中细研磨开始，Chemex 可以从中研磨开始。如果暂时没有磨豆机，可以购买少量适合手冲的代磨粉，并尽快使用。杯子需要能稳稳托住滤杯。</p><div class="callout"><strong>动手小任务</strong><br>放好滤杯，润湿滤纸，倒掉预热水。把秤归零——这就是正式冲煮前的小仪式。</div>`},
 {title:'选一支喜欢的咖啡豆',time:'LESSON 02 · 认识咖啡豆',body:`<p>不需要一次读懂产地、品种和处理法。先从包装上的<strong>烘焙度</strong>和<strong>风味描述</strong>开始。</p><h3>浅烘焙：试试明亮的风味</h3><p>常见果香、花香和活泼酸质的描述。这里的“酸”可能像水果的清爽感；是否喜欢，要用自己的味觉判断。</p><h3>中烘焙：从平衡感开始</h3><p>常见坚果、焦糖或巧克力一类描述，可以作为本网站入门配方的尝试方向。风味词是联想，不代表咖啡里添加了这些食物。</p><h3>深烘焙：试试醇厚的口感</h3><p>烘焙风味通常更明显。可以从较低的水温尝试，再按口感调整。豆子、器具不同，配方也会不同。</p><div class="callout"><strong>动手小任务</strong><br>闻一闻干咖啡粉。先别看包装上的风味词，写下你自己的第一个联想。没有标准答案。</div>`},
 {title:'好喝的背后，是这些变量',time:'LESSON 03 · 理解冲煮',body:`<h3>粉水比：这一杯的浓淡</h3><p>粉水比 1:16.7，表示每 1g 咖啡粉使用约 16.7g 冲煮用水。15g 粉搭配 250g 水就是一个起点；冲出的咖啡液会少一些，因为粉层会留住部分水。</p><h3>水温：帮助风味溶出</h3><p>其他条件相同时，较高水温通常有助于萃取。工坊以 92–93°C 作为中度烘焙练习起点；不需要把它当成所有咖啡的标准。</p><h3>研磨：水与咖啡的接触方式</h3><p>磨细通常会增加接触面积，也可能让下水变慢；磨粗则通常相反。不同磨豆机刻度不能直接通用，请根据实际颗粒和流速观察。</p><h3>闷蒸：先让咖啡粉均匀湿润</h3><p>先用少量水打湿咖啡粉，等待排气，然后继续注水。尝试用细水流缓慢画小圈，尽量避开滤纸边缘。</p><div class="callout"><strong>动手小任务</strong><br>去参数实验室，把粉水比从 1:16.7 改成 1:15。观察水量如何变化。下一次实物冲煮，只改这一个变量。</div><p><a href="https://chemexcoffeemaker.com/pages/how-to-brew-with-chemex" target="_blank" rel="noopener">延伸阅读：Chemex 官方冲煮教学 ↗</a>（本网站为独立入门练习，分段节奏有所简化。）</p>`}
];
function renderLessonStatuses(){completed.forEach(i=>{$('#lesson-status-'+i).innerHTML='已读完，去试试 '+icon('check');});}
renderLessonStatuses();
$$('[data-lesson]').forEach(button=>button.addEventListener('click',()=>{const i=Number(button.dataset.lesson),lesson=lessons[i];$('#lesson-detail').innerHTML=`<div class="eyebrow">${lesson.time}</div><h2>${lesson.title}</h2><div class="lesson-detail-content">${lesson.body}</div><button class="button primary" id="finish-lesson">我学会了，动手试试 ${icon('arrow')}</button>`;$('#finish-lesson').addEventListener('click',()=>{completed.add(i);persist('slowbrew-lessons',[...completed]);renderLessonStatuses();$('#lesson-dialog').close();document.getElementById(i===2?'lab':'practice').scrollIntoView({behavior:'smooth'});});$('#lesson-dialog').showModal();}));
// Recipe laboratory
let grind='medium';
function labRecipe(){return{dose:Number($('#dose').value),water:Math.round(Number($('#dose').value)*Number($('#ratio').value)),temp:Number($('#temp').value),grind};}
function updateLab(){const dose=Number($('#dose').value),ratio=Number($('#ratio').value),temp=Number($('#temp').value);$('#dose-out').value=dose;$('#ratio-out').value=ratio.toFixed(1);$('#temp-out').value=temp;$('#lab-water').textContent=Math.round(dose*ratio);$('#flavor-dot').style.left=`${Math.max(0,Math.min(94,(ratio-13)/6*94))}%`;
 $('#flavor-title').textContent=ratio<15?'浓一点，也可以很迷人。':ratio>17.5?'清爽一点，让风味舒展开。':'平衡，是一个不错的开始。';
 $('#flavor-desc').textContent=`${dose}g 咖啡粉，搭配 ${Math.round(dose*ratio)}g 水。${ratio<15?'用水较少，通常会更浓郁；如果有点厚重，可以稍微增加用水。':ratio>17.5?'用水较多，通常会更轻盈；如果觉得寡淡，可以减少用水。':'这个比例适合作为起点。先尝一尝，再根据自己的喜好微调浓淡。'}`;
 $('#lab-tip').textContent=temp>=97&&grind==='fine'?'较高水温配合细研磨，可能让萃取更充分，也可能下水偏慢。若喝起来干涩，下一杯试着只调粗研磨。':temp<=89&&grind==='coarse'?'较低水温配合粗研磨，可能萃取不足。若入口尖酸、空薄，下一杯可以先提高一点水温。':grind==='fine'?'细研磨通常增加接触面积，也可能延长下水时间。留意是否出现堵塞与干涩。每次只改一个变量，更容易找到原因。':grind==='coarse'?'粗研磨通常下水更快。如果入口偏薄、酸感尖锐，下一杯可稍微磨细。这是尝试方向，风味仍取决于豆子和注水方式。':`当前 ${temp}°C、中细研磨。水温与研磨是萃取的调整方向；实际风味还取决于豆子、水质与注水方式。`;
}
$$('#lab input[type=range]').forEach(input=>input.addEventListener('input',updateLab));
$$('[data-grind]').forEach(button=>button.addEventListener('click',()=>{grind=button.dataset.grind;$$('[data-grind]').forEach(x=>x.classList.toggle('selected',x===button));updateLab();}));
$('#reset-lab').addEventListener('click',()=>{$('#dose').value=15;$('#ratio').value=15;$('#temp').value=92;grind='medium';$$('[data-grind]').forEach(b=>b.classList.toggle('selected',b.dataset.grind==='medium'));updateLab();});
$('#save-recipe').addEventListener('click',()=>openNote(labRecipe()));updateLab();
// Personal journal
const rawNotes=read('slowbrew-notes',[]);
let notes=Array.isArray(rawNotes)?rawNotes.filter(n=>n&&typeof n.id==='string'&&typeof n.name==='string'&&Number.isFinite(n.dose)&&Number.isFinite(n.water)&&Number.isFinite(n.temp)&&typeof n.date==='string'):[];
const advice={'清甜平衡':'喜欢这杯？保留配方，下次试着复现它。','偏酸':'先区分水果般的清爽与尖锐的酸。若尖酸又空薄，下次可以只把研磨调细一点，观察变化。','偏苦':'若是苦涩、口腔发干，下次可以只把研磨稍调粗。烘焙本身也会带来苦味，按自己的喜好判断。','偏淡':'若味道干净但太淡，下次可以略减用水；若又淡又尖酸，也要观察萃取是否不足。'};
function openNote(recipe={dose:15,water:225,temp:92}){const form=$('#note-form');form.reset();for(const k of ['dose','water','temp'])form.elements[k].value=recipe[k];$('#taste-advice').textContent=advice['清甜平衡'];$('#note-dialog').showModal();}
$('#add-note').addEventListener('click',()=>openNote());
$$('input[name=taste]').forEach(input=>input.addEventListener('change',()=>$('#taste-advice').textContent=advice[input.value]));
$('#note-form').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.target);const name=String(data.get('name')).trim();if(!name){toast('给这杯取个名字吧。');return;}
 const note={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,dose:Number(data.get('dose')),water:Number(data.get('water')),temp:Number(data.get('temp')),taste:String(data.get('taste')),memo:String(data.get('memo')).trim(),date:new Date().toISOString()};notes.unshift(note);const saved=persist('slowbrew-notes',notes);$('#note-dialog').close();renderNotes();$('#journal').scrollIntoView({behavior:'smooth'});if(saved)toast('已记下这一杯。下次，从这里继续。');});
function renderNotes(){const list=$('#journal-list');if(!notes.length){list.innerHTML=`<div class="journal-empty">${icon('book')}<div><h3>第一张手记，等你来写。</h3><p>不需要专业词汇，写下“我喜欢”就很好。</p></div><button id="first-note">写下我的第一杯 ↗</button></div>`;$('#first-note').addEventListener('click',()=>openNote());return;}
 list.innerHTML=notes.map(note=>{const date=new Date(note.date);const dateText=Number.isNaN(date.getTime())?'我的咖啡':date.toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});return `<article class="note-card"><div class="note-top"><span>${esc(dateText)}</span><button data-delete="${esc(note.id)}" aria-label="删除手记 ${esc(note.name)}">删除</button></div><h3>${esc(note.name)}</h3><span class="taste-tag">${esc(note.taste)}</span><div class="note-recipe">${esc(note.dose)}g 咖啡粉 · ${esc(note.water)}g 水 · ${esc(note.temp)}°C</div><p>${esc(note.memo||'留一点空白，给下一杯的惊喜。')}</p></article>`;}).join('');
 $$('[data-delete]').forEach(button=>button.addEventListener('click',()=>{notes=notes.filter(note=>note.id!==button.dataset.delete);persist('slowbrew-notes',notes);renderNotes();toast('手记已删除。');}));
}
$('#export-notes').addEventListener('click',()=>{if(!notes.length){toast('先写下一杯，再导出你的咖啡手记。');return;}const blob=new Blob([JSON.stringify({title:'寻萃集咖啡手记',exportedAt:new Date().toISOString(),notes},null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='寻萃集咖啡手记.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('手记已导出为 JSON 文件。');});
$('#about-button').addEventListener('click',()=>{$('#lesson-detail').innerHTML=`<div class="eyebrow">ABOUT XUNCUIJI</div><h2>给刚开始的你。</h2><div class="lesson-detail-content"><p>寻萃集是一间可以动手的小课堂。我们相信，从一杯咖啡开始，每个人都能找到自己的冲煮节奏。</p><p>课堂以 Melitta / Chemex 手冲为入门，冲煮工坊提供 Melitta 与 Chemex 两套器具：拖豆称重、转柄研磨、准备滤纸、加热、润纸、倒粉、移动壶嘴注水与出杯。数字时间加速五倍，方便屏幕练习。参数实验室呈现常见调整方向，不预测实际风味。</p><p>学习进度与咖啡手记仅存储于当前浏览器。清理浏览器数据会移除记录，建议定期导出手记。</p><p><a href="https://chemexcoffeemaker.com/pages/how-to-brew-with-chemex" target="_blank" rel="noopener">教学参考：Chemex 官方冲煮教学 ↗</a></p><p>首页场景图由 AI 生成。</p></div>`;$('#lesson-dialog').showModal();});renderNotes();
