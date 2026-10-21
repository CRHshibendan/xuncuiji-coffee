/* Presentation only: preserve existing controls, listeners, brewing state and storage. */
(()=>{
 'use strict';
 const root=document.documentElement,key='xuncuiji-glass-material';
 const materials={light:'轻玻璃',standard:'标准玻璃',strong:'强玻璃'};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const groups=new Map(),pending=new Set();let frame=0;
 root.classList.add('site-glass');
 let value='light';try{value=localStorage.getItem(key)||localStorage.getItem('xuncuiji-glass-lab-material')||'light';}catch{}
 const valid=v=>Object.prototype.hasOwnProperty.call(materials,v)?v:'light';
 root.dataset.glassMaterial=valid(value);
 const groupSelector='.brewer-selector,.grind-options,.play-mode-tabs,.setting-tabs,.round-options,.mobile-scene-controls [role="group"]';
 const primarySelector='.primary,.solid-button,.next-action,.task-action,#pour-hold,#quick-serve,#brew-heat-toggle,#heat-start,#start-basic,#first-note';
 function applyMaterial(value,save=false){
  value=valid(value);root.dataset.glassMaterial=value;let saved=true;
  if(save)try{localStorage.setItem(key,value);}catch{saved=false;}
  document.querySelectorAll('[name="site-glass-material"]').forEach(input=>input.checked=input.value===value);
  const note=document.querySelector('#site-glass-note');if(note)note.textContent=saved?'已选'+materials[value]+' · 所有页面通用':'已选'+materials[value]+' · 本次有效';
 }
 const preferences=document.createElement('section');preferences.className='glass-preferences';preferences.setAttribute('aria-label','界面外观');
 preferences.innerHTML='<fieldset aria-describedby="site-glass-note"><legend>界面材质</legend><div class="glass-preference-options">'+Object.entries(materials).map(([id,name])=>'<label><input type="radio" name="site-glass-material" value="'+id+'"><span>'+name+'</span></label>').join('')+'</div></fieldset><p id="site-glass-note" role="status" aria-live="polite"></p>';
 const footer=document.querySelector('footer.site-footer,footer.shop-footer');if(footer)footer.before(preferences);else(document.querySelector('main')||document.body).append(preferences);
 preferences.addEventListener('change',e=>{if(e.target.name==='site-glass-material'&&e.target.checked)applyMaterial(e.target.value,true);});applyMaterial(root.dataset.glassMaterial);
 addEventListener('storage',e=>{if(e.key===key)applyMaterial(e.newValue);});
 function layout(group,sizing=false){
  const entry=groups.get(group);if(!entry||!group.isConnected)return;
  const buttons=[...group.children].filter(el=>el.tagName==='BUTTON');
  const selected=buttons.find(el=>el.matches('[aria-pressed="true"],[aria-selected="true"],.active,.chosen'));
  if(!selected||!selected.offsetWidth||!selected.offsetHeight){entry.plate.style.opacity='0';return;}
  const vertical=getComputedStyle(group).flexDirection==='column';group.classList.toggle('glass-switch-vertical',vertical);
  if(sizing)group.classList.add('is-sizing');
  const plate=entry.plate;plate.style.width=selected.offsetWidth+'px';plate.style.height=selected.offsetHeight+'px';
  plate.style.transform='translate3d('+selected.offsetLeft+'px,'+selected.offsetTop+'px,0)';plate.style.opacity='1';
  if(sizing)requestAnimationFrame(()=>group.classList.remove('is-sizing'));
 }
 function schedule(group,sizing=false){if(!groups.has(group))return;const entry=groups.get(group);entry.sizing=entry.sizing||sizing;pending.add(group);if(!frame)frame=requestAnimationFrame(()=>{frame=0;for(const item of pending){const entry=groups.get(item);layout(item,entry.sizing);entry.sizing=false;}pending.clear();});}
 const resize=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{for(const {target}of entries)schedule(target,true);}):null;
 function enhanceGroup(group){
  if(groups.has(group)){schedule(group,true);return;}
  const buttons=[...group.children].filter(el=>el.tagName==='BUTTON');if(buttons.length<2)return;
  group.classList.add('glass-switch');buttons.forEach(button=>button.classList.remove('glass-control','glass-primary'));
  const plate=document.createElement('span');plate.className='glass-slider';plate.setAttribute('aria-hidden','true');group.append(plate);
  const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='attributes'&&record.target.parentElement===group){schedule(group);break;}if(record.type==='childList'&&record.target===group){for(const button of [...group.children].filter(el=>el.tagName==='BUTTON'))button.classList.remove('glass-control','glass-primary');schedule(group,true);break;}}});
  groups.set(group,{plate,observer,sizing:false});observer.observe(group,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed','aria-selected','class']});
  plate.addEventListener('transitionrun',()=>plate.style.willChange='transform');const release=()=>plate.style.willChange='';plate.addEventListener('transitionend',release);plate.addEventListener('transitioncancel',release);
  resize?.observe(group);schedule(group,true);
 }
 function scan(node){
  if(!(node instanceof HTMLElement)||node.closest('.site-dock,.glass-preferences'))return;
  const controls=[...(node.matches('button,select,a.button,a.pill,a.secondary')?[node]:[]),...node.querySelectorAll('button,select,a.button,a.pill,a.secondary')];
  for(const control of controls){
   if(control.namespaceURI!=='http://www.w3.org/1999/xhtml'||control.closest('.site-dock,.glass-preferences,svg')||control.matches('.text-link,.close-dialog,.dialog-close,.scene-kettle,.task-select,[data-delete]')||control.parentElement?.matches(groupSelector))continue;
   control.classList.add('glass-control');if(control.matches(primarySelector))control.classList.add('glass-primary');
  }
  for(const group of [...(node.matches(groupSelector)?[node]:[]),...node.querySelectorAll(groupSelector)])enhanceGroup(group);
  for(const dialog of [...(node.matches('dialog')?[node]:[]),...node.querySelectorAll('dialog')])dialog.classList.add('glass-panel');
 }
 scan(document.body);
 const dynamic=new MutationObserver(records=>{for(const record of records){if(record.target instanceof HTMLElement&&record.target.matches(groupSelector))enhanceGroup(record.target);for(const node of record.addedNodes)if(node instanceof HTMLElement&&node.className!=='glass-slider')scan(node);}});
 dynamic.observe(document.body,{subtree:true,childList:true});
 addEventListener('resize',()=>{for(const group of groups.keys())schedule(group,true);},{passive:true});
 document.fonts?.ready.then(()=>{for(const group of groups.keys())schedule(group,true);});
 reduced.addEventListener('change',()=>{for(const group of groups.keys())schedule(group,true);});
})();
