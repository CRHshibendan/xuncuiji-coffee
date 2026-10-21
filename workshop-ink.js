/* Same normalized pen-down strokes and two-stage easing as the homepage. */
(function(root){
 'use strict';
 function splitSubpaths(d){
  const tokens=(d||'').match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[];
  const counts={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7};
  let i=0,command='',x=0,y=0,sx=0,sy=0,part=[],result=[];
  while(i<tokens.length){
   if(/^[A-Za-z]$/.test(tokens[i]))command=tokens[i++];
   const upper=command.toUpperCase(),relative=command!==upper;
   if(upper==='Z'){part.push(command);x=sx;y=sy;command='';continue;}
   const count=counts[upper];if(!count||i+count>tokens.length)break;
   const raw=tokens.slice(i,i+count);if(raw.some(t=>/^[A-Za-z]$/.test(t)))break;
   const values=raw.map(Number);i+=count;
   if(upper==='M'){
    if(part.length)result.push(part.join(' '));
    x=(relative?x:0)+values[0];y=(relative?y:0)+values[1];sx=x;sy=y;part=['M',String(x),String(y)];command=relative?'l':'L';
   }else{
    part.push(command,...raw);
    if(upper==='H')x=(relative?x:0)+values[0];
    else if(upper==='V')y=(relative?y:0)+values[0];
    else{x=(relative?x:0)+values[count-2];y=(relative?y:0)+values[count-1];}
   }
  }
  if(part.length)result.push(part.join(' '));return result;
 }

 // Unit-square homography: includes CSS perspective and SVG letterboxing.
 function projection(q){
  const [p0,p1,p2,p3]=q,dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x,dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y,det=dx1*dy2-dx2*dy1;
  const g=Math.abs(det)>1e-10?(dx3*dy2-dx2*dy3)/det:0,h=Math.abs(det)>1e-10?(dx1*dy3-dx3*dy1)/det:0,a=p1.x-p0.x+g*p1.x,b=p3.x-p0.x+h*p3.x,c=p0.x,d=p1.y-p0.y+g*p1.y,e=p3.y-p0.y+h*p3.y,f=p0.y;
  return {toScreen(x,y){const z=g*x+h*y+1;return{x:(a*x+b*y+c)/z,y:(d*x+e*y+f)/z};},fromScreen(x,y){const A=a-x*g,B=b-x*h,C=x-c,D=d-y*g,E=e-y*h,F=y-f,den=A*E-B*D;return Math.abs(den)>1e-10?{x:(C*E-B*F)/den,y:(A*F-C*D)/den}:null;}};
 }
 function simpleOutline(stroke,width){const rgb=stroke.match(/[\d.]+/g)?.map(Number);return stroke!=='none'&&Number.parseFloat(width)>=3.5&&rgb&&rgb.length>=3&&(rgb[0]+rgb[1]+rgb[2])/3<150;}
 let run=0;
 function drawReturn({panel,scene,art}){
  if(!art)return{duration:0,cancel(){}};
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),r=scene.getBoundingClientRect(),p=panel.getBoundingClientRect();
  svg.setAttribute('class','bed-return-art');svg.setAttribute('viewBox',scene.getAttribute('viewBox'));svg.setAttribute('aria-hidden','true');
  Object.assign(svg.style,{left:(r.left-p.left)+'px',top:(r.top-p.top)+'px',width:r.width+'px',height:r.height+'px'});
  if(panel.parentElement===document.body)Object.assign(svg.style,{left:'24px',top:'96px',width:Math.max(0,p.width-48)+'px',height:Math.max(0,p.height-192)+'px'});
  const defs=scene.querySelector('defs')?.cloneNode(true);if(defs)svg.append(defs);
  const color=document.createElementNS(ns,'g');color.setAttribute('class','bed-return-color');color.append(art.cloneNode(true));svg.append(color);
  // Snapshot every auxiliary in stage coordinates, in the same return composition.
  const stage=scene.getCTM();for(const source of auxiliaryObjects(scene)){const parent=source.parentElement.getCTM();if(!stage||!parent)continue;const m=stage.inverse().multiply(parent),frame=document.createElementNS(ns,'g');frame.setAttribute('data-ink-object',source.dataset.object||'scale');frame.setAttribute('transform',`matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`);frame.append(source.cloneNode(true));color.append(frame);}
  color.querySelectorAll('.hit-area,text,.bubble').forEach(n=>n.remove());
  const ink=color.cloneNode(true);ink.setAttribute('class','bed-return-ink');svg.append(ink);panel.append(svg);
  // Read inherited stroke before removing presentation attributes. Keep nested transforms.
  ink.querySelectorAll('[data-ink-object]').forEach(group=>auxiliaryLines(group));
  const shapes=[...ink.querySelectorAll('path,ellipse,circle,rect,line,polyline,polygon')].filter(el=>!el.closest('[data-ink-object]'));
  shapes.forEach(el=>{
   if(el.closest('defs,clipPath,mask'))return;
   const style=getComputedStyle(el),stroke=style.stroke;
   if(!simpleOutline(stroke,style.strokeWidth)||style.opacity==='0'){el.remove();return;}
   const pieces=el.tagName.toLowerCase()==='path'?splitSubpaths(el.getAttribute('d')):[null];
   for(const piece of pieces){const line=el.cloneNode(false);if(piece!==null)line.setAttribute('d',piece);line.removeAttribute('id');line.setAttribute('class','bed-return-line');line.setAttribute('pathLength','1');line.setAttribute('fill','none');line.setAttribute('stroke','var(--color-primary)');line.setAttribute('stroke-width','1.5');line.setAttribute('vector-effect','none');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');el.before(line);}el.remove();
  });
  ink.querySelectorAll('defs').forEach(n=>n.remove());ink.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
  ink.querySelectorAll('.bed-return-line').forEach(n=>{const m=n.getScreenCTM();if(n.getAttribute('vector-effect')!=='non-scaling-stroke'&&m)n.setAttribute('stroke-width',String(1.5/Math.max(.01,Math.hypot(m.a,m.b))));});
  // Definitions must not collide with the live stage during the dissolve.
  const prefix='bed-return-'+(++run)+'-',ids=new Map();svg.querySelectorAll('[id]').forEach(n=>{const id=n.id;ids.set(id,prefix+id);n.id=prefix+id;});
  svg.querySelectorAll('*').forEach(n=>{for(const at of [...n.attributes])if(at.value.includes('url(#'))n.setAttribute(at.name,at.value.replace(/url\(#([^)]+)\)/g,(all,id)=>ids.has(id)?'url(#'+ids.get(id)+')':all));n.removeAttribute('tabindex');n.removeAttribute('role');n.removeAttribute('data-object');n.classList.remove('selected','interactive','grinding');});
  // Lines, material and the panel dissolve all start from a single timeline position.
  const clock=document.timeline.currentTime;for(const node of [panel,...svg.querySelectorAll('.bed-return-line,.bed-return-color')])for(const a of node.getAnimations())a.startTime=clock;
  return{duration:2680,cancel(){svg.remove();}};
 }
 // Auxiliary tools share one finite pen clock; their silhouettes stay simpler than the brewer.
 const auxiliaryBudget=5,primaryNames=new Set(['server','paper','dripper','upper','siphon-upper','machine']);
 function auxiliaryObjects(scene){
  const all=[...scene.querySelectorAll('[data-object],#scale')].filter(el=>!primaryNames.has(el.dataset.object)&&!el.closest('defs,#scene-targets,#guide-ghost'));
  return all.filter(el=>!all.some(other=>other!==el&&other.contains(el))&&!el.closest('[data-object="server"],[data-object="machine"]')&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&Number(getComputedStyle(el).opacity)>0);
 }
 function auxiliaryLines(group){
  const candidates=[];
  for(const el of group.querySelectorAll('path,ellipse,circle,rect,line,polyline,polygon')){
   if(el.closest('defs,clipPath,mask')||el.matches('.hit-area,.crank-hit,[fill="transparent"]')||el.closest('#grinder-motion'))continue;
   const style=getComputedStyle(el),rgb=style.stroke.match(/[\d.]+/g)?.map(Number),fill=style.fill;
   if(Number(style.opacity)<.5||style.visibility==='hidden'||style.display==='none')continue;
   if(style.stroke==='none'&&(fill==='none'||fill==='rgba(0, 0, 0, 0)'))continue;
   if(rgb&&rgb.length>=3&&(rgb[0]+rgb[1]+rgb[2])/3>220)continue;
   const box=el.getBBox();if(Math.max(box.width,box.height)<14)continue;
   const pieces=el.tagName.toLowerCase()==='path'?splitSubpaths(el.getAttribute('d')):[null];
   // Fine hatch marks and repeated grain dots never become independent pen strokes.
   if(pieces.length>4)continue;
   for(const piece of pieces){const line=el.cloneNode(false);if(piece!==null)line.setAttribute('d',piece);el.before(line);const b=line.getBBox(),score=Math.hypot(b.width,b.height)+(el.id==='crank-arm'||el.closest('[data-crank-handle]')&&el.matches('ellipse[cy="-22"]')?1000:0);candidates.push({line,score});}
  }
  const keep=new Set(candidates.sort((a,b)=>b.score-a.score).slice(0,auxiliaryBudget).map(c=>c.line));
  group.querySelectorAll('path,ellipse,circle,rect,line,polyline,polygon,text').forEach(el=>{if(!keep.has(el)&&!el.closest('defs,clipPath,mask'))el.remove();});
  keep.forEach(line=>{line.removeAttribute('id');line.removeAttribute('style');line.setAttribute('class','bed-return-line');line.setAttribute('pathLength','1');line.setAttribute('fill','none');line.setAttribute('stroke','var(--color-primary)');line.setAttribute('stroke-width','1.5');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-linejoin','round');line.setAttribute('vector-effect','non-scaling-stroke');line.removeAttribute('opacity');});
  return keep.size;
 }
 const api={splitSubpaths,projection,simpleOutline,drawReturn,auxiliaryBudget,auxiliaryLines};root.CoffeeWorkshopInk=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
