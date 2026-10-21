/* Isolated interaction samples. No imports from brewing, AI or unlock code. Only an isolated material preference is stored. */
(()=>{
 'use strict';
 const root=document.body,$=s=>document.querySelector(s),reduce=matchMedia('(prefers-reduced-motion: reduce)'),dialog=$('#guide-dialog');
 const materialKey='xuncuiji-glass-lab-material',materials={light:'轻玻璃',standard:'标准玻璃',strong:'强玻璃'};
 function chooseMaterial(value,save=false){
  if(!Object.hasOwn(materials,value))value='light';
  root.dataset.glassMaterial=value;
  document.querySelectorAll('[name="glass-material"]').forEach(input=>input.checked=input.value===value);
  let persisted=true;if(save){try{localStorage.setItem(materialKey,value);}catch{persisted=false;}}
  $('#material-preference-note').textContent=materials[value]+(persisted?' · 选择会保存在这台设备':' · 本次有效，浏览器未允许保存');
  $('#nav-material-label').textContent='悬浮导航 · '+materials[value];
 }
 let savedMaterial='light';try{savedMaterial=localStorage.getItem(materialKey)||'light';}catch{}
 chooseMaterial(savedMaterial);
 document.querySelectorAll('[name="glass-material"]').forEach(input=>input.addEventListener('change',()=>{if(input.checked)chooseMaterial(input.value,true);}));
 const tools={melitta:{name:'Melitta 梯形滤杯',kind:'CERAMIC / PAPER FILTER',note:'一杯清晰、温柔的日常。'},chemex:{name:'Chemex 玻璃壶',kind:'GLASS / PAPER FILTER',note:'把清澈的风味，慢慢留下。'},frenchpress:{name:'法压壶',kind:'GLASS / IMMERSION',note:'静静浸泡，再轻轻压下。'}};
 const tabs={brew:['从第一滴开始。','选一件顺手的器具，慢慢来。'],recipe:['这一杯，刚刚好。','先记下一组比例，再找到你的口味。'],notes:['留住这口喜欢。','把今天的感受，留给下一杯。']};
 let toastTimer,toastMotion,selectionMotion,dialogMotion,guideOpener;
 document.querySelectorAll('.selector-indicator').forEach(plate=>{plate.addEventListener('transitionrun',()=>plate.style.willChange='transform');const release=()=>plate.style.willChange='';plate.addEventListener('transitionend',release);plate.addEventListener('transitioncancel',release);});
 const activeMotions=new Set(),style=getComputedStyle(root),fast=Number.parseFloat(style.getPropertyValue('--motion-fast')),base=Number.parseFloat(style.getPropertyValue('--motion-base')),soft=style.getPropertyValue('--ease-soft').trim();
 function animate(el,frames,options){el.style.willChange='transform, opacity';const motion=el.animate(frames,options);activeMotions.add(motion);motion.finished.then(()=>{activeMotions.delete(motion);el.style.willChange='';motion.cancel();},()=>{activeMotions.delete(motion);el.style.willChange='';});return motion;}
 function chooseTool(id,move=true){
  const item=tools[id];if(!item)return;selectionMotion?.cancel();document.querySelectorAll('.glass-selector').forEach(n=>n.style.setProperty('--choice-index',String(Object.keys(tools).indexOf(id))));$('#focus-selection').textContent='已选 '+item.name+' · 按钮样机，不启动真实冲煮';
  document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===id)));
  $('#tool-art').src='../assets/flat-'+id+'.svg';$('#tool-art').alt=item.name+'单线器具插画';$('#tool-title').textContent=item.name;$('#tool-kind').textContent=item.kind;$('#tool-note').textContent=item.note;
  if(move)selectionMotion=animate($('#tool-detail'),reduce.matches?[{opacity:.4},{opacity:1}]:[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:reduce.matches?fast:base,easing:soft});
 }
 document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{if(b.getAttribute('aria-pressed')!=='true')chooseTool(b.dataset.tool);}));
 document.querySelectorAll('[data-demo-tab]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-demo-tab]').forEach(n=>{n.classList.toggle('is-current',n===b);if(n===b)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});
  const [title,copy]=tabs[b.dataset.demoTab];$('#panel-title').textContent=title;$('#panel-copy').textContent=copy;
  animate($('#panel-title'),[{opacity:.3},{opacity:1}],{duration:reduce.matches?fast:base,easing:'ease-out'});
 }));
 $('#blur-toggle').addEventListener('click',e=>{const off=root.classList.toggle('no-blur');e.currentTarget.setAttribute('aria-pressed',String(off));e.currentTarget.querySelector('span').textContent=off?'恢复玻璃效果':'关闭模糊对照';});
 function showToast(text){clearTimeout(toastTimer);toastMotion?.cancel();const toast=$('#lab-toast');toast.querySelector('span').textContent=text;toast.hidden=false;toastMotion=animate(toast,reduce.matches?[{opacity:0},{opacity:1}]:[{opacity:0,transform:'translate(-50%,8px)'},{opacity:1,transform:'translate(-50%,0)'}],{duration:reduce.matches?fast:base,easing:soft});toastTimer=setTimeout(()=>{toastMotion=animate(toast,[{opacity:1},{opacity:0}],{duration:fast,easing:'ease-out'});toastMotion.finished.then(()=>toast.hidden=true,()=>{});},2800);}
 $('#demo-start').addEventListener('click',e=>{if(!reduce.matches)animate(e.currentTarget,[{transform:'translateY(1px) scale(.97)'},{transform:'translateY(-1px) scale(1.005)',offset:.7},{transform:'none'}],{duration:base,easing:soft});showToast('触感预览完成。原有冲煮进度未改变。');});
 function openGuide(e){guideOpener=e.currentTarget;clearTimeout(toastTimer);$('#lab-toast').hidden=true;dialogMotion?.cancel();dialog.showModal();}
 $('#open-guide').addEventListener('click',openGuide);$('#button-guide-demo').addEventListener('click',openGuide);
 function closeDialog(){if(!dialog.open)return;dialogMotion?.cancel();dialogMotion=dialog.animate(reduce.matches?[{opacity:1},{opacity:0}]:[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(6px)'}],{duration:fast,easing:'ease-out'});dialogMotion.finished.then(()=>{dialog.close();dialogMotion.cancel();(guideOpener||$('#open-guide')).focus({preventScroll:true});},()=>{});}
 $('#button-return-demo').addEventListener('click',()=>showToast('返回按钮触感预览；没有触发台面或器具动画。'));
 $('#button-heat-demo').addEventListener('click',e=>{const on=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(on));e.currentTarget.querySelector('span').textContent=on?'停止烧水':'开始烧水';showToast('仅切换按钮状态，不启动真实加热。');});
 $('#close-guide').addEventListener('click',closeDialog);$('#guide-ok').addEventListener('click',closeDialog);dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog();});dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();});
 $('#demo-reset').addEventListener('click',()=>{chooseTool('melitta',false);$('#button-heat-demo').setAttribute('aria-pressed','false');$('#button-heat-demo span').textContent='开始烧水';document.querySelector('[data-demo-tab="brew"]').click();if(root.classList.contains('no-blur'))$('#blur-toggle').click();showToast('实验区已重置。网站原有数据保持原样。');});
 function stopMotion(){for(const a of activeMotions)a.cancel();activeMotions.clear();selectionMotion?.cancel();dialogMotion?.cancel();}
 reduce.addEventListener('change',stopMotion);addEventListener('pagehide',()=>{stopMotion();clearTimeout(toastTimer);});
})();
