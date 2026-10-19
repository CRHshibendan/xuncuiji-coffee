(function(root){
 'use strict';
 function transitionTarget(event,link,location){
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return null;
  let url;try{url=new URL(link.href,location.href);}catch{return null;}
  if(url.origin!==location.origin||!/^https?:$/.test(url.protocol)||!/(\/|\.html)$/.test(url.pathname))return null;
  if(url.pathname===location.pathname&&url.search===location.search)return null;
  return url.href;
 }
 if(typeof module==='object'&&module.exports)module.exports={transitionTarget};
 if(!root.document)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),html=document.documentElement;
 // Native support is progressive: regular links still navigate if this script fails.
 const native=typeof CSSViewTransitionRule!=='undefined';
 if(!native)html.classList.add('coffee-motion-fallback');
 let timer=null;
 document.addEventListener('click',event=>{
  if(native||reduce.matches)return;
  const link=event.target.closest?.('a[href]'),url=transitionTarget(event,link,location);if(!url)return;
  event.preventDefault();if(timer!==null)return;
  // Arm navigation before visual work so an animation failure cannot strand a link.
  timer=setTimeout(()=>location.assign(url),170);html.classList.add('coffee-page-leaving');
 });
 addEventListener('pageshow',()=>{clearTimeout(timer);timer=null;html.classList.remove('coffee-page-leaving');});
})(typeof window==='undefined'?globalThis:window);
