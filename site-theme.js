/* Appearance only. Runs before styles paint; never touches brewing state. */
(function(host){
 'use strict';
 const key='xuncuiji-color-theme',valid=value=>['light','dark','system'].includes(value)?value:'system';
 const resolve=(value,dark)=>valid(value)==='system'?(dark?'dark':'light'):valid(value);
 if(typeof module==='object'&&module.exports)module.exports={valid,resolve,key};
 if(!host.document)return;
 const doc=host.document,root=doc.documentElement,system=host.matchMedia('(prefers-color-scheme: dark)');
 let preference='system';try{preference=valid(host.localStorage.getItem(key));}catch{}
 root.dataset.themePage=(host.location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'');
 function apply(value,save=false){
  preference=valid(value);const theme=resolve(preference,system.matches);root.dataset.theme=theme;root.dataset.themePreference=preference;root.style.colorScheme=theme;
  if(save)try{host.localStorage.setItem(key,preference);}catch{}
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#161d19':'#f6f3ec');
  doc.querySelectorAll('[name="site-color-theme"]').forEach(input=>input.checked=input.value===preference);
  doc.querySelectorAll('[data-theme-toggle]').forEach(button=>button.setAttribute('aria-label','界面外观，当前'+({dark:'深色',light:'浅色'}[theme])));
  host.dispatchEvent(new host.CustomEvent('coffee-theme-change',{detail:{theme,preference}}));
 }
 apply(preference);
 system.addEventListener('change',()=>{if(preference==='system')apply(preference);});
 host.addEventListener('storage',event=>{if(event.key===key)restore(event.newValue);});
 // Safari may restore form controls independently when returning to a cached page.
 function restore(fallback=preference){let value=fallback;try{value=host.localStorage.getItem(key);}catch{}apply(value);}
 host.addEventListener('pageshow',()=>restore());
 function mount(){
  const dialog=doc.createElement('dialog');dialog.className='theme-dialog';dialog.id='site-theme-dialog';dialog.setAttribute('aria-labelledby','theme-dialog-title');
  dialog.innerHTML='<form method="dialog"><div class="theme-dialog-heading"><h2 id="theme-dialog-title">界面外观</h2><button class="theme-close" aria-label="关闭外观设置">×</button></div><p>选择适合此刻的光线，所有页面同步。</p><fieldset><legend>显示模式</legend><div class="theme-choices">'+Object.entries({system:'跟随系统',light:'浅色',dark:'深色'}).map(([value,label])=>'<label class="theme-choice"><input type="radio" name="site-color-theme" value="'+value+'"><span>'+label+'</span></label>').join('')+'</div></fieldset><button class="theme-done">完成</button></form>';
  const select=value=>apply(value,true);
  dialog.addEventListener('click',event=>{const choice=event.target.closest('.theme-choice');if(choice)select(choice.querySelector('input').value);});
  dialog.addEventListener('change',event=>{if(event.target.name==='site-color-theme'&&event.target.value!==preference)select(event.target.value);});
  doc.body.append(dialog);
  const toggle=doc.createElement('button');toggle.type='button';toggle.className='theme-toggle';toggle.dataset.themeToggle='';toggle.setAttribute('aria-haspopup','dialog');toggle.setAttribute('aria-controls',dialog.id);toggle.title='界面外观';
  toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z"/></svg><span>外观</span>';
  toggle.addEventListener('click',()=>{if(!dialog.open){dialog.showModal();dialog.querySelector('input:checked')?.focus();}});
  const slot=doc.querySelector('.site-header .header-inner,.studio-header,.shop-header,.masthead,.lab-header')||doc.querySelector('header')||doc.querySelector('main')||doc.body;
  slot.append(toggle);
  // The gesture workbench hides the ordinary header; move its same control into the visible rail.
  function place(){const intro=doc.querySelector('#welcome-dialog[open],#gesture-help-dialog[open] .gesture-help-actions');const rail=doc.querySelector('.gesture-mode .gesture-panel-heading,.workshop-play .workshop-play-toolbar');const target=intro||rail||slot;if(toggle.parentElement!==target)target.append(toggle);}
  doc.addEventListener('toggle',place,true);doc.addEventListener('close',place,true);
  new MutationObserver(place).observe(doc.body,{attributes:true,attributeFilter:['class']});place();apply(preference);
 }
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof window==='undefined'?globalThis:window);
