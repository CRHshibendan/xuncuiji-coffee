/* Retained SVG interpolation and finite, material-conserving transfer choreography. */
(function(root){
 'use strict';
 const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);},num=/-?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi;
 function interpolator(from,to){
  const a=String(from).match(num),b=String(to).match(num);
  if(!a||!b||a.length!==b.length||a.length>32||String(from).replace(num,'#')!==String(to).replace(num,'#'))return null;
  const x=a.map(Number),y=b.map(Number);return p=>{let i=0;return String(to).replace(num,()=>{const j=i++;return (x[j]+(y[j]-x[j])*p).toFixed(3);});};
 }
 function transferFrame(t,c){
  t=clamp(t);const entry=ease(t/.25),exit=ease((t-.82)/.18),hold=entry*(1-exit),angle=c.angle*hold,rad=angle*Math.PI/180;
  const base=c.base||[0,0],offset=c.offset||[0,0],pivot=c.pivot,mouth=c.mouth;
  const rest=[base[0]+mouth[0],base[1]+mouth[1]],held=[c.to[0],c.to[1]-(c.drop||55)];
  const lip=[(rest[0]+offset[0])*(1-entry)+held[0]*hold+rest[0]*exit,(rest[1]+offset[1])*(1-entry)+held[1]*hold+rest[1]*exit-22*Math.sin(hold*Math.PI)];
  const rx=pivot[0]+(mouth[0]-pivot[0])*Math.cos(rad)-(mouth[1]-pivot[1])*Math.sin(rad),ry=pivot[1]+(mouth[0]-pivot[0])*Math.sin(rad)+(mouth[1]-pivot[1])*Math.cos(rad);
  return {poured:ease((t-.28)/.5),flow:t>.28&&t<.78?Math.sin(clamp((t-.28)/.5)*Math.PI)**.35:0,lip,angle,transform:`translate(${(lip[0]-rx).toFixed(3)} ${(lip[1]-ry).toFixed(3)}) rotate(${angle.toFixed(3)} ${pivot[0]} ${pivot[1]})`};
 }
 function create(env){
  const attrs=new Map(),jobs=new Set(),numeric=new Set(['x','y','cx','cy','rx','ry','width','height','d','opacity']);let frame=0,last=0;
  const reduced=()=>env.reduced?.()||false,raf=env.raf;
  function start(){if(!frame)frame=raf(tick);}
  function tick(t){frame=0;const dt=last?Math.min(64,Math.max(0,t-last)):16;last=t;
   if(!env.hidden?.()){
    for(const [el,map] of attrs){if(el.isConnected===false){attrs.delete(el);continue;}for(const [name,a] of map){a.elapsed+=dt;const p=clamp(a.elapsed/a.duration);el.setAttribute(name,p===1?a.to:a.at(p));if(p===1)map.delete(name);}if(!map.size)attrs.delete(el);}
    for(const job of [...jobs]){if(job.paused?.())continue;job.elapsed+=dt;const p=reduced()?1:clamp(job.elapsed/job.duration);job.update(p);if(p===1){jobs.delete(job);job.done?.();}}
   }
   if(attrs.size||jobs.size)start();else last=0;
  }
  function attribute(el,name,value,duration=100){
   value=String(value);const old=el.getAttribute(name);let map=attrs.get(el);
   if(map?.get(name)?.to===value)return;
   if(old===value){map?.delete(name);return;}
   const at=duration>0&&!reduced()&&numeric.has(name)&&old!==null?interpolator(old,value):null;
   if(!at){map?.delete(name);el.setAttribute(name,value);return;}
   if(!map){map=new Map();attrs.set(el,map);}map.set(name,{to:value,at,elapsed:0,duration});start();
  }
  function patch(parent,markup,duration=100){
   const next=env.document.createElementNS('http://www.w3.org/2000/svg','svg');next.innerHTML=markup;
   function sync(parent,source){
    [...source.childNodes].forEach((node,i)=>{const old=parent.childNodes[i];if(!old){parent.append(node.cloneNode(true));return;}if(old.isEqualNode(node))return;
     if(old.nodeType!==node.nodeType||old.nodeName!==node.nodeName){old.replaceWith(node.cloneNode(true));return;}
     if(node.nodeType===3||node.nodeType===8){old.nodeValue=node.nodeValue;return;}
     const moving=old.hasAttribute('data-transfer-pose');
     [...old.attributes].forEach(a=>{if(!node.hasAttribute(a.name)&&!(moving&&['transform','data-transfer-pose'].includes(a.name)))old.removeAttribute(a.name);});
     [...node.attributes].forEach(a=>{if(!(moving&&a.name==='transform'))attribute(old,a.name,a.value,duration);});sync(old,node);
    });while(parent.childNodes.length>source.childNodes.length)parent.lastChild.remove();
   }sync(parent,next);
  }
  function fillCup(svg,amount,coffee=true){
   const liquid=svg.querySelector('#cup-liquid'),top=svg.querySelector('#cup-top'),cup=svg.querySelector('#cup-object');if(!liquid||!cup)return;
   const p=clamp(amount/240),y=527-75*p;liquid.setAttribute('y',y.toFixed(3));liquid.setAttribute('fill',coffee?'url(#brew-grad)':'#bed1c8');
   top?.setAttribute('fill','#e9e0cb');let surface=svg.querySelector('#cup-surface');
   if(!surface){surface=env.document.createElementNS('http://www.w3.org/2000/svg','ellipse');surface.id='cup-surface';surface.setAttribute('cx','705');surface.setAttribute('ry','6');surface.setAttribute('clip-path','url(#cup-mask)');surface.setAttribute('pointer-events','none');cup.append(surface);}
   surface.setAttribute('cy',(y+3).toFixed(3));surface.setAttribute('rx',(34+12*p).toFixed(2));surface.setAttribute('fill',coffee?'#b28b60':'#d9e5db');surface.setAttribute('opacity',amount>0?'1':'0');
  }
  function transfer(c){
   const layer=c.layer,ns='http://www.w3.org/2000/svg',fx=env.document.createElementNS(ns,'g');fx.setAttribute('pointer-events','none');fx.setAttribute('data-material-transfer',c.kind);fx.innerHTML=c.kind==='grounds'?'<ellipse class="transfer-pile" fill="#745034" opacity="0"/>'+Array.from({length:18},(_,i)=>`<ellipse rx="${1.1+i%3*.45}" ry="${.8+i%2*.4}" fill="${['#56371f','#835832','#b38a54'][i%3]}"/>`).join(''):'<path class="transfer-stream" fill="none" stroke="'+(c.coffee===false?'#9ebbb5':'#8d623c')+'" stroke-width="4" stroke-linecap="round"/><ellipse fill="none" stroke="#ba9b73" stroke-width="1.5"/>';
   layer.append(fx);const nodes=[...fx.children],actors=new Set();let finished=false;
   function clean(){fx.remove();for(const actor of actors){actor.removeAttribute('data-transfer-pose');actor.removeAttribute('transform');}c.onReset?.();}
   const job={elapsed:0,duration:c.duration||1600,paused:c.paused,update(t){const f=transferFrame(t,c);for(const actor of c.actors()){if(!actor)continue;if(!actors.has(actor))actor.getAnimations?.().forEach(a=>a.cancel());actors.add(actor);actor.setAttribute('data-transfer-pose','true');actor.setAttribute('transform',f.transform);}
    if(c.kind==='grounds'){
     const pile=nodes[0];pile.setAttribute('cx',c.to[0]);pile.setAttribute('cy',c.to[1]+3);pile.setAttribute('rx',(c.pileWidth||36)*Math.sqrt(f.poured));pile.setAttribute('ry',7*Math.sqrt(f.poured));pile.setAttribute('opacity',f.poured>0?.85:0);
     nodes.slice(1).forEach((el,i)=>{const z=(f.poured*5+i/18)%1;el.setAttribute('cx',f.lip[0]+(c.to[0]-f.lip[0])*z+Math.sin(i*7.3)*10*z);el.setAttribute('cy',f.lip[1]+(c.to[1]-f.lip[1])*z*z);el.setAttribute('opacity',f.flow);});
    }else{nodes[0].setAttribute('d',`M${f.lip[0]} ${f.lip[1]}L${c.to[0]} ${c.to[1]}`);nodes[0].setAttribute('opacity',f.flow);nodes[0].setAttribute('stroke-width',(1+4*f.flow).toFixed(2));nodes[1].setAttribute('cx',c.to[0]);nodes[1].setAttribute('cy',c.to[1]+2);nodes[1].setAttribute('rx',10+Math.sin(t*65)*3);nodes[1].setAttribute('ry','3');nodes[1].setAttribute('opacity',f.flow*.7);}
    c.onFrame?.(f,t);
   },done(){if(finished)return;finished=true;clean();c.onComplete?.();}};
   const cancel=()=>{if(finished)return;finished=true;jobs.delete(job);clean();c.onCancel?.();};job.cancel=cancel;
   jobs.add(job);job.update(0);start();return cancel;
  }
  function stop(){for(const map of attrs.values())map.clear();attrs.clear();for(const job of [...jobs])job.cancel();if(frame)env.caf(frame);frame=last=0;}
  return{attribute,patch,transfer,fillCup,stop};
 }
 const api={create,transferFrame,interpolator};if(root.document)Object.assign(api,create({document:root.document,raf:f=>root.requestAnimationFrame(f),caf:f=>root.cancelAnimationFrame(f),now:()=>root.performance.now(),reduced:()=>root.matchMedia('(prefers-reduced-motion: reduce)').matches,hidden:()=>root.document.hidden}));
 root.StudioMotion=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
