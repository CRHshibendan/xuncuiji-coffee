/* 一日店长: three actions, a little coffee knowledge, and one unruly kettle. */
(function(){
 'use strict';
 const R=window.CoffeeRound,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const KEY='xuncuiji-shop-easy-v3';
 const LOOKS=[{skin:'#e8c7a4',hair:'#3c2f26',shirt:'#7f8f66',style:0},{skin:'#f0d3b4',hair:'#5b4030',shirt:'#b0895f',style:1},{skin:'#d9b48f',hair:'#2f2a26',shirt:'#8a9a8f',style:2},{skin:'#efcbb0',hair:'#6b4a32',shirt:'#a88a6d',style:3},{skin:'#d7ab84',hair:'#463328',shirt:'#6f7d74',style:4},{skin:'#f2d6bb',hair:'#3a2e25',shirt:'#9a8a72',style:5}];
 const HAIR=[
  s=>`<path d="M14 32c0-13 8-20 18-20s18 7 18 20v6H14Z" fill="${s}"/>`,
  s=>`<path d="M14 31c0-12 8-19 18-19 12 0 18 7 18 19-4-7-9-9-18-9S18 24 14 31Z" fill="${s}"/>`,
  s=>`<circle cx="32" cy="10" r="8" fill="${s}"/><path d="M15 32c0-12 8-18 17-18s17 6 17 18c-5-6-10-8-17-8s-12 2-17 8Z" fill="${s}"/>`,
  s=>`<path d="M13 33c0-13 8-21 19-21s19 8 19 21c-5-7-10-10-19-10s-14 3-19 10Z" fill="${s}"/><circle cx="17" cy="24" r="5" fill="${s}"/><circle cx="47" cy="24" r="5" fill="${s}"/>`,
  s=>`<path d="M15 30c0-11 8-17 17-17s17 6 17 17c-4-5-9-7-17-7s-13 2-17 7Z" fill="${s}"/>`,
  s=>`<path d="M13 46c0-18 7-27 19-27s19 9 19 27c-3-8-3-16-6-19-5 5-9 6-13 6s-8-1-13-6c-3 3-3 11-6 19Z" fill="${s}"/>`
 ];
 function avatarSVG(look){
  const {skin,hair,shirt,style}=look;
  return `<svg class="avatar" viewBox="0 0 64 76" aria-hidden="true"><path d="M6 76c1-16 12-24 26-24s25 8 26 24Z" fill="${shirt}"/><path d="M24 52h16v9a8 8 0 0 1-16 0Z" fill="${skin}"/><circle cx="32" cy="33" r="17" fill="${skin}"/>${HAIR[style](hair)}<circle cx="26" cy="35" r="1.6" fill="#463a30"/><circle cx="38" cy="35" r="1.6" fill="#463a30"/><path d="M29 42q3 2.5 6 0" stroke="#b4836a" fill="none" stroke-width="1.3" stroke-linecap="round"/><path d="M18 59c8 3 20 3 28 0" stroke="#ffffff44" stroke-width="2" fill="none"/></svg>`;
 }
 const kettle='<svg viewBox="0 0 120 100" aria-hidden="true"><path d="M35 38Q13 27 12 48q0 21 21 18" fill="none" stroke="#586a51" stroke-width="7"/><path d="M32 38h47l11 40q-27 12-65 0Z" fill="#a5b596" stroke="#586a51" stroke-width="2"/><path d="M77 45q18-2 28-23l7 2q-7 34-27 41" fill="#a5b596" stroke="#586a51" stroke-width="2"/><ellipse cx="55" cy="36" rx="24" ry="6" fill="#dce4cd" stroke="#586a51" stroke-width="2"/><path d="M43 30q12-13 24 0" fill="none" stroke="#586a51" stroke-width="4"/><path d="M39 44l-4 30" stroke="#dce4cd" stroke-width="3"/></svg>';
 let game=null,mode='relax',armed=false,paused=false,last=0,lastPaint=0,raf=0,renderKey='',toastTimer=0,report=null,noteSaved=false;
 let kettleDrag=null;
 let records={};try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');records=saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};}catch{}
 const say=t=>{$('#scene-ticker').textContent=t;};
 function toast(t){$('#scene-toast').textContent=t;$('#scene-toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#scene-toast').classList.remove('visible'),2400);}
 function setArmed(value){
  armed=value;document.body.classList.toggle('kettle-armed',armed);$('#bonk-button').setAttribute('aria-pressed',String(armed));
  const sceneKettle=$('#scene-kettle');if(sceneKettle){sceneKettle.setAttribute('aria-pressed',String(armed));sceneKettle.classList.toggle('is-armed',armed);}
  $('#bonk-hint').textContent=armed?'点一位顾客挥壶！再点此处或 Esc 放下':'拿起壶，再点顾客 · 少赚一单，积分 −20';
  if(armed)toast('手冲壶已拿起，点顾客或订单出击！');
 }
 function pick(id){
  if(!game||paused||game.status!=='playing')return;
  if(armed){bonk(id);return;}
  const o=game.queue.find(x=>x.id===id);if(!o)return;
  if(o.phase!=='waiting'){R.focus(game,id);render(true);return;}
  if(R.accept(game,id)){say(`${o.name}：想要一杯${R.menuFor(o).name}，${R.FLAVORS[o.flavor]}。豆子已经帮你称好，粉量、水量和水温都可以自己调。`);render(true);}
 }
 function start(){
  $('#welcome-dialog').close();if($('#report-dialog').open)$('#report-dialog').close();
  game=R.createRound(mode);paused=false;document.body.classList.remove('game-paused');setArmed(false);report=null;noteSaved=false;renderKey='';
  $('#scene-fx').replaceChildren();$('#bonk-button').disabled=false;$('#scene-kettle').disabled=false;$('#pause-game').disabled=false;$('#pause-game').textContent='暂停 Ⅱ';
  say('客人们来了。按住吧台左边的手冲壶，在客人身上来回扫：扫过一记连击、出金币，连到 4 下就把人打飞。');render(true);
  cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(loop);
 }
 function updateGuests(markup){
  const host=$('#scene-guests'),template=document.createElement('template');template.innerHTML=markup;
  const seen=new Set();for(const next of template.content.children){const id=next.dataset.guest;seen.add(id);const old=host.querySelector(`[data-guest="${id}"]`);if(old){for(const a of next.attributes)old.setAttribute(a.name,a.value);old.innerHTML=next.innerHTML;}else host.append(next.cloneNode(true));}
  for(const old of [...host.children])if(!seen.has(old.dataset.guest))old.remove();
 }
 function current(){return game&&(R.active(game)||game.queue[0]);}
 function paramPill(id,value,unit,label,can){
  return `<span class="param-pill"><button type="button" class="param-step" data-param="${id}" data-dir="-1" aria-label="减少${label}" ${can?'':'disabled'}>−</button><b>${value}${unit}</b><button type="button" class="param-step" data-param="${id}" data-dir="1" aria-label="增加${label}" ${can?'':'disabled'}>＋</button></span>`;
 }
 function flavorChips(o){
  return `<div class="flavor-select"><span>调参数，让结果合客人口味 · 客人想要“${R.FLAVORS[o.flavor]}”</span><div>${Object.entries(R.FLAVORS).map(([id,label])=>`<span class="flavor-chip ${o.choice===id?'selected':''} ${o.flavor===id?'target':''}" aria-label="${label}${o.flavor===id?'，客人的口味':''}${o.choice===id?'，当前结果':''}">${label}${o.flavor===id?' ✓':''}</span>`).join('')}</div></div>`;
 }
 function render(force=false){
  if(!game)return;
  if(!game.activeId&&game.queue[0])R.focus(game,game.queue[0].id);
  const o=current(),active=R.active(game),d=o&&R.menuFor(o),pv=o&&R.paramsFor(o),canTune=!!(active&&active.phase==='prepared'&&!paused);
  const key=JSON.stringify([game.queue.map(x=>[x.id,x.phase,x.choice,x.dose,x.water,x.temp]),game.activeId,game.served,game.expelled,game.status]);
  if(force||renderKey!==key){
   renderKey=key;
   const step=!active||['waiting','grinding'].includes(active.phase)?0:active.phase==='ready'?2:1;
   $$('.easy-steps li').forEach((li,i)=>{li.classList.toggle('current',step===i);li.classList.toggle('done',step>i);});
   $('#step-count').textContent=`0${step+1} / 03`;
   $('#round-label').textContent=game.mode==='rush'?'忙碌挑战':'轻松开店';
   $('#scene-status').textContent=game.status==='finished'?'今天打烊了':`营业中 · 已招待 ${game.served+game.expelled+game.lost} / ${game.total} 位`;
   $('#queue-count').textContent=`${game.queue.length} 位在店里`;
   $('#queue-note').textContent=game.mode==='rush'?'客人最多等 35 秒':'不用赶，客人会等你';
   updateGuests(game.queue.map((g,i)=>`<button class="guest ${g.id===game.activeId?'is-active':''}" data-guest="${g.id}" data-position="${i}" style="left:${game.queue.length===1?76:64+i*13}%" aria-label="接待${g.name}，${R.menuFor(g).name}">${(g.id===game.activeId||(!active&&i===0))?`<div class="guest-speech">${g.id===game.activeId&&g.phase==='ready'?'闻到香味了！':R.menuFor(g).name}<small>${R.FLAVORS[g.flavor]}</small></div>`:''}<span class="guest-name">${g.name}</span>${avatarSVG(LOOKS[g.look])}</button>`).join(''));
   $('#ticket-list').innerHTML=game.queue.map(g=>`<button class="ticket ${g.id===game.activeId?'is-active':''}" data-guest="${g.id}" aria-label="接待${g.name}的${R.menuFor(g).name}">${avatarSVG(LOOKS[g.look])}<span class="ticket-main"><span class="ticket-title"><b>${g.name} · ${R.menuFor(g).name}</b></span><span class="ticket-sub">${R.FLAVORS[g.flavor]} · ${g.phase==='waiting'?'点我接单':'正在制作'}<span data-wait="${g.id}"></span></span></span><span class="ticket-price">¥${R.menuFor(g).price}</span></button>`).join('')||'<p class="empty-hint">今天的客人都招待过啦。</p>';
   const taskLabels={waiting:'接单备粉',grinding:'备粉中…',prepared:'开始冲煮',brewing:'冲煮中…',ready:'递杯收钱'};
   $('#batch-board').innerHTML=Array.from({length:3},(_,i)=>{const g=game.queue.find(order=>order.slot===i);if(!g)return '<article class="cup-task empty-task"><span>台位空闲</span><small>下一杯，留一点期待。</small></article>';const d=R.menuFor(g),busy=['grinding','brewing'].includes(g.phase);return `<article class="cup-task ${g.id===game.activeId?'chosen':''} ${g.phase==='ready'?'ready':''}" data-cup="${g.id}" data-phase="${g.phase}"><button class="task-select" data-guest="${g.id}" aria-label="查看${g.name}的制作进度"><span>0${i+1} / ${g.name}</span><strong>${d.name}</strong><small data-cup-state="${g.id}">${taskLabels[g.phase]}</small></button><div class="task-art" data-drink="${g.drink}" aria-hidden="true"><img src="assets/${d.tool}.svg" alt=""><div class="task-cup"><span class="task-cup-steam"></span><div class="task-cup-fill"><i></i></div></div></div><div class="task-progress" role="progressbar" aria-label="${g.name}的制作进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-cup-progress="${g.id}"><i></i></div><button class="task-action" data-cup-action="${g.id}" ${busy||paused?'disabled':''}>${taskLabels[g.phase]}${busy?'':' →'}</button></article>`;}).join('');
   $('#order-detail').innerHTML=o?`<div class="order-heading"><img src="assets/${d.tool}.svg" alt="${d.name}器具"><div><small>${o.name} 的这一杯</small><h2>${d.name}</h2><p>“${R.FLAVORS[o.flavor]}。”</p></div></div><div class="recipe-pills" role="group" aria-label="调整冲煮参数">${paramPill('dose',pv.dose,'g 粉','粉量',canTune)}${paramPill('water',pv.water,`g ${d.tool==='espresso'?'咖啡液':'水'}`,'水量',canTune)}${paramPill('temp',pv.temp,'°C','水温',canTune)}</div>${active&&['prepared','ready'].includes(active.phase)?flavorChips(o):''}`:'<div class="counter-empty"><h2>这一班，辛苦啦。</h2><p>好心情和咖啡香，都留在小店里。</p></div>';
   const phase=active?active.phase:'waiting';
   const labels={waiting:'① 接单备粉 →',grinding:'称豆、研磨中…',prepared:`② 开始${d?d.action:'冲煮'} →`,brewing:'咖啡正在变香…',ready:`③ 递给${o?o.name:'客人'} · 收钱 →`};
   $('#main-action').textContent=labels[phase];$('#main-action').disabled=paused||!o||['grinding','brewing'].includes(phase);
   const hints={waiting:'点这里，或直接点客人。可同时给其他客人备粉、冲煮。',grinding:'正在备粉。可以先点其他订单，同时做另一杯。',prepared:'用加减号调粉量、水量、水温，三个口味会实时显示结果；对准客人再冲。',brewing:`正在${d?d.action:'冲煮'}，这杯会自动停水，可以先做另一杯。`,ready:'这杯好了！结果合不合客人口味，递给客人就知道。'};
   $('#action-hint').textContent=hints[phase];
   $('#coffee-tip').textContent=d?d.note:'每一杯，都是下一次动手的起点。';
   $('#lesson-link').href=`learn.html?tool=${d?d.tool:'melitta'}#recipe`;
  }
  CoffeePaint.text($('#hud-served'),`${game.served} / ${game.total}`);CoffeePaint.text($('#hud-money'),`¥${game.revenue}`);
  CoffeePaint.text($('#clock-label'),game.mode==='rush'?'挑战倒计时':'今天的节奏');
  CoffeePaint.text($('#hud-clock'),game.mode==='rush'?(game.clockStarted?`${Math.max(0,Math.ceil(90-game.elapsed))} 秒`:'首杯不计时'):'慢慢来');
  for(const g of game.queue){const el=$(`[data-wait="${g.id}"]`);if(el)CoffeePaint.text(el,game.mode==='rush'&&game.clockStarted?`${Math.max(0,Math.ceil(35-g.wait))}s`:'');}
  for(const g of game.queue){const meter=$(`[data-cup-progress="${g.id}"]`);if(meter){const progress=g.phase==='ready'?100:Math.round(g.progress*100);const card=$(`[data-cup="${g.id}"]`);if(card)CoffeePaint.style(card,'--cup-fill',(g.phase==='ready'?84:g.phase==='brewing'?g.progress*84:0)+'%');CoffeePaint.attr(meter,'aria-valuenow',String(progress));CoffeePaint.style(meter.querySelector('i'),'width',progress+'%');}}
  const working=active&&['grinding','brewing'].includes(active.phase),p=working?active.progress:0;
  $('#brew-meter').hidden=!working;CoffeePaint.attr($('#brew-meter'),'aria-valuenow',String(Math.round(p*100)));CoffeePaint.style($('#brew-meter i'),'width',`${p*100}%`);
  $('#shop-scene').classList.toggle('is-grinding',game.queue.some(g=>g.phase==='grinding'));$('#shop-scene').classList.toggle('is-brewing',game.queue.some(g=>g.phase==='brewing'));
  CoffeePaint.attr($('#brew-liquid'),'height',active&&active.phase==='ready'?25:active&&active.phase==='brewing'?p*25:0);CoffeePaint.attr($('#brew-liquid'),'y',active&&active.phase==='ready'?93:118-p*25);
 }
 function action(){
  if(!game||paused||game.status!=='playing')return;
  if(armed){setArmed(false);}
  const active=R.active(game);
  if(!active||active.phase==='waiting'){if(current())pick(current().id);return;}
  if(active.phase==='prepared'){R.brew(game);say(`${R.menuFor(active).name}正在制作，参数已经按你的设定，冲煮会自动停准。`);}
  else if(active.phase==='ready'){
   const result=R.resolve(game,active.id,'served');if(!result)return;
   toast(`${result.order.choice===result.order.flavor?'正合口味！':'新口味，也收下啦。'} +¥${result.sale}`);
   say(`${result.order.name}接过咖啡：谢谢店长！${game.served===1&&mode==='rush'?'第一杯完成，90 秒挑战开始。':''}`);
  }
  render(true);if(game.status==='finished')finish();
 }
 function bonk(id,drop,coins=0){
  if(!game||game.status!=='playing'||paused)return;
  const guest=$(`.guest[data-guest="${id}"]`),order=game.queue.find(g=>g.id===id);if(!guest||!order)return;
  const fx=$('#scene-fx'),fxr=fx.getBoundingClientRect(),avatar=guest.querySelector('.avatar'),ar=avatar?avatar.getBoundingClientRect():guest.getBoundingClientRect();
  const hitX=ar.left-fxr.left+ar.width*.5,hitY=ar.top-fxr.top+ar.height*.4;
  const speech=guest.querySelector('.guest-speech');if(speech)speech.remove();
  guest.removeAttribute('data-guest');guest.classList.add('guest-ejected');guest.tabIndex=-1;guest.setAttribute('aria-hidden','true');
  const swing=document.createElement('div');swing.className='kettle-swing'+(drop?' is-drop':'');swing.innerHTML=kettle;
  fx.append(guest,swing);
  const kw=swing.offsetWidth,kh=swing.offsetHeight;let sx,sy;
  if(drop){sx=Math.max(8,Math.min(drop.x-fxr.left-kw*.5,fxr.width-kw-8));sy=Math.max(8,Math.min(drop.y-fxr.top-kh*.55,fxr.height-kh-8));}
  else{sx=Math.max(16,Math.min(hitX-200,fxr.width-kw-10));sy=Math.min(fxr.height-kh-10,hitY+45);}
  swing.style.left=`${sx}px`;swing.style.top=`${sy}px`;
  if(!drop){swing.style.setProperty('--dx',`${hitX-kw*.6-sx}px`);swing.style.setProperty('--dy',`${hitY-kh*.55-sy}px`);}
  const burst=document.createElement('div');burst.className='bonk-burst';burst.style.left=`${hitX}px`;burst.style.top=`${hitY}px`;
  burst.innerHTML='<b>咚！</b>'+Array.from({length:8},(_,i)=>`<i style="--a:${i*45}deg;--d:${44+(i*7)%20}px"></i>`).join('');
  fx.append(burst);
  setTimeout(()=>{const scene=$('#shop-scene');scene.classList.add('bonk-shake');if(navigator.vibrate)navigator.vibrate([10,24,18]);setTimeout(()=>scene.classList.remove('bonk-shake'),330);},400);
  setTimeout(()=>{guest.remove();swing.remove();burst.remove();},1600);
  const res=R.resolve(game,id,'expelled',coins),comp=res?.comp||0;setArmed(false);
  say(`${order.name}捂着头，把一半咖啡钱拍在桌上就跑了。压惊费 ¥${comp} 已进账，积分 −20。`);
  toast(`手冲壶出击！压惊费 ¥${comp}${coins>0?`（含金币 ×${coins}）`:''} · 积分 −20`);render(true);
  if(game.status==='finished')finish();
  return res;
 }
 function canHoldKettle(){return !!(game&&game.status==='playing'&&!paused);}
 function guestAtPoint(x,y){const el=document.elementFromPoint(x,y);return el&&el.closest?el.closest('.guest[data-guest]'):null;}
 function placeKettleGhost(x,y){if(!kettleDrag||!kettleDrag.ghost)return;kettleDrag.ghost.style.left=x+'px';kettleDrag.ghost.style.top=y+'px';}
function setKettleTarget(next){if(!kettleDrag||kettleDrag.target===next)return;if(kettleDrag.target)kettleDrag.target.classList.remove('kettle-target');kettleDrag.target=next;if(next)next.classList.add('kettle-target');}
 let kettleCombo=null;
 const KETTLE_HITS=4;
 function hideComboBadge(){const b=$('#scene-fx').querySelector('.combo-badge');if(b)b.remove();}
 function showComboBadge(cx,cy){
  if(!kettleCombo)return;
  const fx=$('#scene-fx');let b=fx.querySelector('.combo-badge');
  if(!b){b=document.createElement('div');b.className='combo-badge';fx.append(b);}
  b.style.left=cx+'px';b.style.top=Math.max(12,cy-96)+'px';
  b.innerHTML=`<b>×${kettleCombo.count}</b> 连击 <span>金币 ×${kettleCombo.coins}</span>`;
  b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');
 }
 function spawnCoins(cx,cy,n){
  const fx=$('#scene-fx');
  for(let i=0;i<n;i++){
   const c=document.createElement('span');c.className='coin';
   c.style.left=cx+'px';c.style.top=cy+'px';
   c.style.setProperty('--cx',(Math.random()*76-38).toFixed(0)+'px');
   c.style.setProperty('--cy',(-22-Math.random()*46).toFixed(0)+'px');
   fx.append(c);setTimeout(()=>c.remove(),900);
  }
 }
 function clearKettleDrag(){
  const drag=kettleDrag;if(!drag)return null;
  kettleDrag=null;
  window.removeEventListener('pointermove',onKettleMove);window.removeEventListener('pointerup',onKettleUp);window.removeEventListener('pointercancel',onKettleCancel);
  if(drag.target)drag.target.classList.remove('kettle-target');
  drag.ghost.remove();$('#scene-kettle').classList.remove('is-held');document.body.classList.remove('kettle-dragging');
  if(kettleCombo&&kettleCombo.tick)clearInterval(kettleCombo.tick);
  hideComboBadge();kettleCombo=null;
  return drag;
 }
 function kettleHit(guest,x,y){
  if(!kettleCombo||!canHoldKettle())return;
  const now=performance.now();if(now-kettleCombo.lastHit<100)return;
  kettleCombo.lastHit=now;
  if(!kettleCombo.targetId){kettleCombo.targetId=guest.dataset.guest;kettleCombo.targetHits=0;setKettleTarget(guest);}
  kettleCombo.count++;kettleCombo.targetHits++;
  const n=1+(Math.random()<.4?1:0);kettleCombo.coins+=n;
  const g=guest.getBoundingClientRect(),fx=$('#scene-fx').getBoundingClientRect();
  const cx=g.left+g.width/2-fx.left,cy=g.top+g.height*.42-fx.top;
  guest.classList.remove('guest-bonked');void guest.offsetWidth;guest.classList.add('guest-bonked');
  setTimeout(()=>guest.classList.remove('guest-bonked'),240);
  spawnCoins(cx,cy,n);showComboBadge(cx,cy);
  if(!kettleCombo.tick){
   kettleCombo.tick=setInterval(()=>{
    if(!kettleCombo||!kettleCombo.inside||!kettleCombo.targetId||!canHoldKettle())return;
    const t=document.querySelector(`.guest[data-guest="${kettleCombo.targetId}"]`);if(!t)return;
    const tr=t.getBoundingClientRect();kettleHit(t,tr.left+tr.width/2,tr.top+tr.height*.42);
   },260);
  }
  if(kettleCombo.targetHits>=KETTLE_HITS)ejectComboTarget(cx,cy);
 }
 function ejectComboTarget(cx,cy){
  if(!kettleCombo||!kettleCombo.targetId)return;
  const id=kettleCombo.targetId,count=kettleCombo.count,coins=kettleCombo.coins;
  const t=document.querySelector(`.guest[data-guest="${id}"]`);
  if(!t){kettleCombo.targetId=null;kettleCombo.targetHits=0;kettleCombo.inside=false;return;}
  const nameNode=t.querySelector('.guest-name');const name=nameNode?nameNode.textContent.trim():'客人';
  const r=t.getBoundingClientRect(),fx=$('#scene-fx').getBoundingClientRect();
  setKettleTarget(null);
  kettleCombo.targetId=null;kettleCombo.targetHits=0;kettleCombo.inside=false;
  const res=bonk(id,{x:r.left+r.width/2,y:r.top+r.height*.42},coins);
  toast(`连击 ×${count} · 金币 ×${coins} · 压惊费 ¥${res?.comp||0} · 积分 −20`);
  say(`${name} 被连击 ×${count} 打飞，金币撒了一地。压惊费 ¥${res?.comp||0} 已进账，积分 −20。`);
 }
 function onKettleMove(e){
  if(!kettleDrag||e.pointerId!==kettleDrag.id)return;
  placeKettleGhost(e.clientX,e.clientY);
  if(Math.hypot(e.clientX-kettleDrag.x,e.clientY-kettleDrag.y)>7)kettleDrag.moved=true;
  if(!kettleCombo)kettleCombo={count:0,coins:0,targetId:null,targetHits:0,inside:false,lastHit:0};
  const gr=kettleDrag.ghost.getBoundingClientRect(),guest=guestAtPoint(e.clientX,e.clientY)||guestAtPoint(gr.left+gr.width/2,gr.top+gr.height/2);
  if(guest&&guest.dataset.guest){
   if(kettleCombo.targetId&&kettleCombo.targetId!==guest.dataset.guest){kettleCombo.inside=false;return;}
   if(!kettleCombo.inside){kettleCombo.inside=true;kettleHit(guest,e.clientX,e.clientY);}
  }else{kettleCombo.inside=false;}
 }
 function endKettleDrag(e,allowHit){
  const drag=kettleDrag;if(!drag)return;
  const gr=drag.ghost.getBoundingClientRect(),gx=gr.left+gr.width/2,gy=gr.top+gr.height/2;
  const x=e.clientX||drag.x,y=e.clientY||drag.y,guest=guestAtPoint(x,y)||guestAtPoint(gx,gy);
  const combo=kettleCombo;
  clearKettleDrag();
  if(!allowHit)return;
  if(combo&&combo.count>0){
   if(combo.targetId&&combo.targetHits>0){
    const t=document.querySelector(`.guest[data-guest="${combo.targetId}"]`);
    if(t){
     const nameNode=t.querySelector('.guest-name');const name=nameNode?nameNode.textContent.trim():'客人';
     const r=t.getBoundingClientRect();
     const res=bonk(combo.targetId,{x:r.left+r.width/2,y:r.top+r.height*.42},combo.coins);
     if(combo.count>1){toast(`连击 ×${combo.count} · 金币 ×${combo.coins} · 压惊费 ¥${res?.comp||0} · 积分 −20`);say(`${name} 被连击 ×${combo.count} 请出了门。压惊费 ¥${res?.comp||0} 已进账，积分 −20。`);}
    }
    return;
   }
   return;
  }
  if(guest&&guest.dataset.guest){bonk(guest.dataset.guest,{x,y},0);return;}
  if(!drag.moved){setArmed(!armed);return;}
  toast('把壶拖到客人身上，碰到就会挥出去。');
 }
 function onKettleUp(e){endKettleDrag(e,true);}
 function onKettleCancel(e){endKettleDrag(e,false);}
 function loop(now){
  if(!game||game.status!=='playing')return;
  const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
  if(!paused&&!document.hidden&&!document.querySelector('dialog[open]')){R.tick(game,dt);if(now-lastPaint>=66||game.status==='finished'){render();lastPaint=now;}if(game.status==='finished'){finish();return;}}
  raf=requestAnimationFrame(loop);
 }
 function feedback(t){$('#report-feedback').textContent=t;}
 function finish(){
  cancelAnimationFrame(raf);setArmed(false);$('#bonk-button').disabled=true;$('#scene-kettle').disabled=true;$('#pause-game').disabled=true;$('#main-action').disabled=true;$('#main-action').textContent='今天打烊啦 ✓';
  report=R.summary(game);const previous=Number(records[mode]?.best)||0,best=Math.max(previous,report.points);
  records[mode]={best,last:report,date:new Date().toISOString()};let stored=true;try{localStorage.setItem(KEY,JSON.stringify(records));}catch{stored=false;}
  $('#report-title').textContent=report.title;$('#report-sub').textContent=`${mode==='rush'?'忙碌挑战':'轻松开店'} · 你的寻萃集小店，今天打烊啦。`;
  $('#report-stats').innerHTML=[['今日出杯',report.served+' 杯'],['小店收入','¥'+report.revenue],['今日积分',report.points+' 分']].map(([k,v])=>`<div class="report-cell"><span>${k}</span><b>${v}</b></div>`).join('');
  $('#report-note').textContent=`正合口味 ${report.perfect} 杯 · 手冲壶赶客 ${report.expelled} 位${report.compensation?`（压惊费 ¥${report.compensation}）`:''} · 等候离开 ${report.lost} 位。${report.served?'玩过简化版，下一杯可以去工坊认真动手。':'挥壶很解压，下次也试着递出第一杯咖啡。'}`;
  $('#best-note').textContent=`${stored?'本机同模式最佳':'本次最高'}：${best} 分${stored?' · 成绩保存在当前浏览器':' · 浏览器暂时无法保存成绩'}`;
  $('#save-note').textContent='收进咖啡手记 ＋';$('#save-note').disabled=false;feedback('');$('#practice-link').href=`workshop.html?tool=${report.tool}&mode=basic`;
  $('#scene-status').textContent='打烊了 · 下次见';say('今天的小店已打烊。把这一点咖啡香，留在手记里。');
  $('#report-dialog').showModal();$('#report-dialog').scrollTop=0;
 }
 function saveNote(){
  if(!report||noteSaved)return;
  try{
   const notes=JSON.parse(localStorage.getItem('slowbrew-notes')||'[]');if(!Array.isArray(notes))throw Error();
   const cup=game.cups[game.cups.length-1],d=cup?R.menuFor(cup):R.MENU[0];
   notes.unshift({id:crypto.randomUUID(),name:'一日店长 · '+report.title,dose:cup?.dose??d.dose,water:cup?.water??d.water,temp:cup?.temp??d.temp,taste:'开店小记',memo:`${mode==='rush'?'忙碌挑战':'轻松开店'}：卖出 ${report.served} 杯，收入 ¥${report.revenue}，积分 ${report.points}。手冲壶赶走 ${report.expelled} 位客人${report.compensation?`，收压惊费 ¥${report.compensation}`:''}。\n这是小游戏的开店记录，配方为教学参考。`,date:new Date().toISOString()});
   localStorage.setItem('slowbrew-notes',JSON.stringify(notes));noteSaved=true;$('#save-note').disabled=true;$('#save-note').textContent='已收进咖啡手记 ✓';feedback('已保存，回到首页的「咖啡手记」就能找到。');
  }catch{feedback('浏览器暂时无法保存手记。可以先保存店长成绩卡。');}
 }
 async function shareCard(){
  if(!report)return;const b=$('#share-result');b.disabled=true;
  try{
   await document.fonts.ready;
   const c=document.createElement('canvas');c.width=1080;c.height=1440;const x=c.getContext('2d');
   x.fillStyle='#f4f1e9';x.fillRect(0,0,1080,1440);x.strokeStyle='#b6c0a5';x.lineWidth=2;x.strokeRect(52,52,976,1336);
   x.textAlign='center';x.fillStyle='#617351';x.font='24px sans-serif';x.fillText('寻萃集  /  XUNCUIJI',540,136);
   x.font='20px sans-serif';x.fillText('ONE DAY AT YOUR COFFEE STAND',540,194);
   const img=new Image();img.src='assets/'+report.tool+'.svg';await img.decode();x.drawImage(img,365,238,350,350);
   x.fillStyle='#3c503b';x.font='56px "Songti SC", serif';x.fillText(report.title,540,666);
   x.font='26px sans-serif';x.fillStyle='#8b8b79';x.fillText(mode==='rush'?'90 秒忙碌挑战':'五位客人的轻松小店',540,725);
   x.fillStyle='#3c503b';x.font='112px Georgia';x.fillText(String(report.points),540,883);x.font='24px sans-serif';x.fillText('今日开店积分',540,930);
   x.font='32px sans-serif';x.fillText(`出杯 ${report.served} 杯   ·   收入 ¥${report.revenue}`,540,1030);
   x.fillStyle='#9c8059';x.font='25px sans-serif';x.fillText(`手冲壶出击，赶走 ${report.expelled} 位客人${report.compensation?` · 压惊费 ¥${report.compensation}`:''}`,540,1092);
   x.strokeStyle='#deded0';x.beginPath();x.moveTo(170,1155);x.lineTo(910,1155);x.stroke();
   x.fillStyle='#617351';x.font='30px "Songti SC", serif';x.fillText('接一单，冲一杯，把好心情递出去。',540,1230);
   const local=['localhost','127.0.0.1',''].includes(location.hostname);x.font='20px sans-serif';x.fillText(local?'来寻萃集，试试你的一日店长。':location.host+location.pathname,540,1300,850);
   const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error();
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='寻萃集-我的一日店长.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),20000);feedback('店长成绩卡已生成，可以发给朋友挑战。');
  }catch{feedback('成绩卡暂时生成失败，可以先复制挑战文案。');}finally{b.disabled=false;}
 }
 async function copyInvite(){
  if(!report)return;
  const local=['localhost','127.0.0.1',''].includes(location.hostname);
  const url=new URL('shop.html',location.href);url.searchParams.set('mode',mode);
  const t=`我在寻萃集当了一日店长！${mode==='rush'?'忙碌挑战':'轻松开店'}，卖出 ${report.served} 杯，拿到 ${report.points} 分，还用手冲壶赶走了 ${report.expelled} 位客人${report.compensation?`，收了 ¥${report.compensation} 压惊费`:''}。你能超过我吗？${local?'': '\n'+url.href}`;
  try{await navigator.clipboard.writeText(t);feedback(local?'挑战文案已复制。当前是本地预览，上线后会自动带上游戏链接。':'挑战文案和游戏链接已复制。');}catch{feedback(t);}
 }
 $('#kettle-icon').innerHTML=kettle;
 $('#scene-kettle-icon').innerHTML=kettle;
 $$('.round-options button').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;$$('.round-options button').forEach(v=>{v.classList.toggle('chosen',v===b);v.setAttribute('aria-pressed',String(v===b));});}));
 if(new URLSearchParams(location.search).get('mode')==='rush')$('[data-mode="rush"]').click();
 $('#start-day').addEventListener('click',start);$('#main-action').addEventListener('click',action);
 document.addEventListener('click',e=>{const step=e.target.closest('[data-param]');if(step){if(game&&!paused&&R.tune(game,step.dataset.param,Number(step.dataset.dir)))render(true);return;}const cup=e.target.closest('[data-cup-action]');if(cup){if(game&&!paused){R.focus(game,cup.dataset.cupAction);action();}return;}const g=e.target.closest('[data-guest]');if(g)pick(g.dataset.guest);});
 $('#bonk-button').addEventListener('click',()=>{if(game&&!paused&&game.status==='playing')setArmed(!armed);});
 $('#scene-kettle').addEventListener('pointerdown',e=>{
  if(!canHoldKettle()||kettleDrag||e.button!==0)return;
  e.preventDefault();e.stopPropagation();
  const ghost=document.createElement('div');ghost.className='kettle-ghost';ghost.innerHTML=kettle;ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';document.body.append(ghost);
  $('#scene-kettle').classList.add('is-held');document.body.classList.add('kettle-dragging');setArmed(false);
  kettleDrag={id:e.pointerId,ghost,x:e.clientX,y:e.clientY,moved:false,target:null};
  setKettleTarget(guestAtPoint(e.clientX,e.clientY));
  window.addEventListener('pointermove',onKettleMove);
  window.addEventListener('pointerup',onKettleUp);
  window.addEventListener('pointercancel',onKettleCancel);
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&armed){setArmed(false);e.preventDefault();}});
 $('#pause-game').addEventListener('click',()=>{if(!game||game.status!=='playing')return;paused=!paused;$('#scene-kettle').disabled=paused;setArmed(false);$('#pause-game').textContent=paused?'继续营业 ▷':'暂停 Ⅱ';document.body.classList.toggle('game-paused',paused);$('#main-action').disabled=paused;render(true);say(paused?'小店暂停了，歇一会儿也很好。':'欢迎回来，继续把咖啡递出去。');});
 $('#help-button').addEventListener('click',()=>$('#help-dialog').showModal());
 for(const id of ['close-help','help-ok'])$('#'+id).addEventListener('click',()=>$('#help-dialog').close());
 $('#welcome-dialog').addEventListener('cancel',e=>e.preventDefault());$('#report-dialog').addEventListener('cancel',e=>e.preventDefault());
 $('#play-again').addEventListener('click',()=>{$('#report-dialog').close();$('#welcome-dialog').showModal();});
 $('#share-result').addEventListener('click',shareCard);$('#copy-invite').addEventListener('click',copyInvite);$('#save-note').addEventListener('click',saveNote);
 $('#welcome-dialog').showModal();
})();
