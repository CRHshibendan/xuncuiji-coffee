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
function renderLessonStatuses(){completed.forEach(i=>{$('#lesson-status-'+i).innerHTML='已读过，继续探索 '+icon('check');});}
renderLessonStatuses();
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
$('#about-button').addEventListener('click',()=>{$('#lesson-detail').innerHTML=`<div class="eyebrow">ABOUT XUNCUIJI</div><h2>给刚开始的你。</h2><div class="lesson-detail-content"><p>寻萃集是一间可以动手的小课堂。我们相信，从一杯咖啡开始，每个人都能找到自己的冲煮节奏。</p><p>课堂以 Melitta / Chemex 手冲为入门，冲煮工坊提供七种器具，其中 Melitta 与 Chemex 手冲会带你完成：拖豆称重、转柄研磨、准备滤纸、加热、润纸、倒粉、移动壶嘴注水与出杯。数字时间加速五倍，方便屏幕练习。参数实验室呈现常见调整方向，不预测实际风味。</p><p>学习进度与咖啡手记仅存储于当前浏览器。清理浏览器数据会移除记录，建议定期导出手记。</p><p><a href="https://chemexcoffeemaker.com/pages/how-to-brew-with-chemex" target="_blank" rel="noopener">教学参考：Chemex 官方冲煮教学 ↗</a></p><p>首页场景图由 AI 生成。</p></div>`;$('#lesson-dialog').showModal();});renderNotes();
