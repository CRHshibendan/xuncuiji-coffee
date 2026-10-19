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
// Personal journal
const rawNotes=read('slowbrew-notes',[]);
let notes=Array.isArray(rawNotes)?rawNotes.filter(n=>n&&typeof n.id==='string'&&typeof n.name==='string'&&Number.isFinite(n.dose)&&Number.isFinite(n.water)&&Number.isFinite(n.temp)&&typeof n.date==='string'):[];
const advice={'清甜平衡':'喜欢这杯？保留配方，下次试着复现它。','偏酸':'先区分水果般的清爽与尖锐的酸。若尖酸又空薄，下次可以只把研磨调细一点，观察变化。','偏苦':'若是苦涩、口腔发干，下次可以只把研磨稍调粗。烘焙本身也会带来苦味，按自己的喜好判断。','偏淡':'若味道干净但太淡，下次可以略减用水；若又淡又尖酸，也要观察萃取是否不足。'};
function openNote(recipe={dose:15,water:225,temp:92}){const form=$('#note-form');form.reset();for(const k of ['dose','water','temp'])form.elements[k].value=recipe[k];$('#taste-advice').textContent=advice['清甜平衡'];$('#note-dialog').showModal();}
document.querySelectorAll('dialog .close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#add-note').addEventListener('click',()=>openNote());
$$('input[name=taste]').forEach(input=>input.addEventListener('change',()=>$('#taste-advice').textContent=advice[input.value]));
$('#note-form').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.target);const name=String(data.get('name')).trim();if(!name){toast('给这杯取个名字吧。');return;}
 const note={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,dose:Number(data.get('dose')),water:Number(data.get('water')),temp:Number(data.get('temp')),taste:String(data.get('taste')),memo:String(data.get('memo')).trim(),date:new Date().toISOString()};notes.unshift(note);const saved=persist('slowbrew-notes',notes);$('#note-dialog').close();renderNotes();$('#journal').scrollIntoView({behavior:'smooth'});if(saved)toast('已记下这一杯。下次，从这里继续。');});
function renderNotes(){const list=$('#journal-list');if(!notes.length){list.innerHTML=`<div class="journal-empty">${icon('book')}<div><h3>第一张手记，等你来写。</h3><p>不需要专业词汇，写下“我喜欢”就很好。</p></div><button id="first-note">写下我的第一杯 ↗</button></div>`;$('#first-note').addEventListener('click',()=>openNote());return;}
 list.innerHTML=notes.map(note=>{const date=new Date(note.date);const dateText=Number.isNaN(date.getTime())?'我的咖啡':date.toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});return `<article class="note-card"><div class="note-top"><span>${esc(dateText)}</span><button data-delete="${esc(note.id)}" aria-label="删除手记 ${esc(note.name)}">删除</button></div><h3>${esc(note.name)}</h3><span class="taste-tag">${esc(note.taste)}</span><div class="note-recipe">${esc(note.dose)}g 咖啡粉 · ${esc(note.water)}g 水 · ${esc(note.temp)}°C</div><p>${esc(note.memo||'留一点空白，给下一杯的惊喜。')}</p></article>`;}).join('');
 $$('[data-delete]').forEach(button=>button.addEventListener('click',()=>{notes=notes.filter(note=>note.id!==button.dataset.delete);persist('slowbrew-notes',notes);renderNotes();toast('手记已删除。');}));
}
$('#export-notes').addEventListener('click',()=>{if(!notes.length){toast('先写下一杯，再导出你的咖啡手记。');return;}const blob=new Blob([JSON.stringify({title:'寻萃集咖啡手记',exportedAt:new Date().toISOString(),notes},null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='寻萃集咖啡手记.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('手记已导出为 JSON 文件。');});
renderNotes();

if(location.hash==="#new-note"){const q=new URLSearchParams(location.search),r={dose:15,water:225,temp:92};for(const k of Object.keys(r)){const n=Number(q.get(k));if(Number.isFinite(n)&&n>0)r[k]=Math.min(n,k==="water"?2000:100);}openNote(r);}
