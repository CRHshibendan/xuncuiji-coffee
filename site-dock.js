/* One set of centers moves both the real cutout and its orb. Links work without JS. */
(function(root){
 'use strict';
 const RELEASE='20261020-lesson3';
 const destinations=['index.html','learn.html','workshop.html','shop.html','journal.html'];
 function positionsFor(width){return Array.from({length:5},(_,i)=>60+(width-120)*i/4);}
 function currentIndex(path){const page=path.split('/').pop()||'index.html';if(page==='explore.html')return 1;if(page==='method-lab.html')return 2;return Math.max(0,destinations.indexOf(page));}
 function freshDestination(href,base){
  if(!href||href.trim().startsWith('#'))return href;
  try{const to=new URL(href,base),from=new URL(base),folder=path=>path.slice(0,path.lastIndexOf('/')+1),page=to.pathname.split('/').pop();
   if(to.origin!==from.origin||folder(to.pathname)!==folder(from.pathname)||![...destinations,'explore.html','method-lab.html'].includes(page))return href;
   to.searchParams.set('v',RELEASE);return to.pathname+to.search+to.hash;
  }catch{return href;}
 }
 const api={positionsFor,currentIndex,freshDestination,release:RELEASE};if(typeof module==='object'&&module.exports)module.exports=api;root.CoffeeSiteDock=api;if(!root.document)return;
 function refreshLink(link){const old=link.getAttribute('href'),fresh=freshDestination(old,location.href);if(fresh!==old)link.setAttribute('href',fresh);}
 document.querySelectorAll('a[href]').forEach(refreshLink);
 const nav=document.querySelector('.site-dock');if(!nav)return;
 const links=[...nav.querySelectorAll('.dock-link')],orb=nav.querySelector('.dock-orb'),notch=nav.querySelector('.dock-notch'),ball=nav.querySelector('.dock-ball-shift'),phone=matchMedia('(max-width:768px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let selected=currentIndex(location.pathname),positions=[],navigation=null,cleanup=null,iconCleanup=null,iconVersion=0;
 const motionNodes=[nav,notch,ball,orb];
 function duration(name,fallback){const value=getComputedStyle(document.documentElement).getPropertyValue(name).trim();return value.endsWith('ms')?Number.parseFloat(value):value.endsWith('s')?Number.parseFloat(value)*1000:fallback;}
 function clearHints(){for(const node of [...motionNodes,...nav.querySelectorAll('.dock-icon,.dock-hit')])node.style.removeProperty('will-change');}
 function frameIcons(index){
  clearTimeout(iconCleanup);const version=++iconVersion;const old=orb.querySelector('.dock-ball-icon:not(.is-icon-old)');for(const item of [...orb.querySelectorAll('.is-icon-old')])item.remove();if(old){old.classList.add('is-icon-old');old.style.willChange='transform, opacity';}
  const icon=links[index].querySelector('svg').cloneNode(true);icon.classList.add('dock-ball-icon','is-icon-new');icon.setAttribute('aria-hidden','true');orb.append(icon);icon.style.willChange='transform, opacity';
  requestAnimationFrame(()=>{if(version===iconVersion)icon.classList.remove('is-icon-new');});
  iconCleanup=setTimeout(()=>{if(version!==iconVersion)return;for(const item of [...orb.querySelectorAll('.dock-ball-icon')])if(item!==icon)item.remove();},reduced.matches?duration('--motion-reduced',150):duration('--motion-icon',250));
 }
 function paint(index,animate){selected=index;nav.style.setProperty('--dock-index',String(index));nav.style.setProperty('--dock-offset',(positions[index]-60)+'px');
  links.forEach((link,i)=>{if(i===index)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  if(!animate&&orb.dataset.current!==String(index)){clearTimeout(iconCleanup);iconVersion++;const icon=links[index].querySelector('svg').cloneNode(true);icon.classList.add('dock-ball-icon');orb.replaceChildren(icon);}orb.dataset.current=String(index);
  if(animate){motionNodes.forEach(node=>node.style.willChange='transform');nav.querySelectorAll('.dock-link .dock-icon').forEach(node=>node.style.willChange='transform, opacity');frameIcons(index);clearTimeout(cleanup);cleanup=setTimeout(clearHints,duration('--motion-slow',420)+duration('--motion-follow-delay',40));}
 }
 function measure(){positions=positionsFor(nav.getBoundingClientRect().width);nav.dataset.dockPositions=positions.join(',');paint(selected,false);}
 measure();requestAnimationFrame(()=>nav.classList.add('is-enhanced'));
 if(typeof ResizeObserver==='function')new ResizeObserver(measure).observe(nav);else addEventListener('resize',measure,{passive:true});
 nav.addEventListener('pointerdown',event=>{const link=event.target.closest('.dock-link');if(link){link.querySelector('.dock-hit').style.willChange='transform';}if(link&&links.indexOf(link)===selected){nav.classList.add('is-pressing');orb.style.willChange='transform';}});
 for(const event of ['pointerup','pointercancel','pointerleave'])nav.addEventListener(event,()=>{nav.classList.remove('is-pressing');setTimeout(clearHints,duration('--motion-release',200));});
 document.addEventListener('click',event=>{
  const anchor=event.target.closest?.('a[href]');if(anchor)refreshLink(anchor);
  const link=event.target.closest?.('.site-dock .dock-link');if(!link||!phone.matches||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||link.target||link.hasAttribute('download'))return;
  const index=links.indexOf(link);if(index<0)return;
  event.preventDefault();clearTimeout(navigation);
  // Arm the real navigation first. A visual failure must never strand a link.
  navigation=setTimeout(()=>location.assign(link.href),reduced.matches?duration('--motion-reduced',150):duration('--motion-slow',420)+duration('--motion-follow-delay',40));
  paint(index,true);
 },true);
 addEventListener('pageshow',()=>{clearTimeout(navigation);navigation=null;selected=currentIndex(location.pathname);measure();clearHints();});
 addEventListener('pagehide',()=>{clearTimeout(navigation);clearTimeout(cleanup);clearTimeout(iconCleanup);clearHints();});
 document.documentElement.classList.add('site-motion-ready');const main=document.querySelector('main');if(main){main.style.willChange=reduced.matches?'opacity':'transform, opacity';main.addEventListener('animationend',()=>main.style.removeProperty('will-change'),{once:true});setTimeout(()=>main.style.removeProperty('will-change'),duration('--motion-base',250));}
})(typeof window==='undefined'?globalThis:window);
