/* Local-only gesture input. No camera or brewing rules live in this module. */
(function(root){
 'use strict';
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function classify(landmarks,{width=640,height=480,pinching=false}={}){
  if(!landmarks||landmarks.length!==21||landmarks.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<.015||p.x>.985||p.y<.015||p.y>.985))return null;
  const p=landmarks.map(v=>({x:v.x*width,y:v.y*height}));
  const size=(distance(p[0],p[9])+distance(p[5],p[17]))/2;
  if(size<24)return null;
  const extended=[8,12,16,20].map(t=>{
   const a=p[t-2],b=p[t-1],c=p[t],u={x:a.x-b.x,y:a.y-b.y},v={x:c.x-b.x,y:c.y-b.y};
   const cosine=(u.x*v.x+u.y*v.y)/(Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y)||1);
   return cosine<-.65&&distance(c,p[0])>distance(a,p[0])*1.12;
  });
  const pinch=distance(p[4],p[8])/size;
  const fist=extended.every(v=>!v)&&distance(p[8],p[0])<distance(p[6],p[0])*.95&&[12,16,20].every(t=>distance(p[t],p[0])<distance(p[t-2],p[0])*1.15);
  const pose=fist?'fist':pinch<(pinching?.38:.28)?'pinch':extended.every(Boolean)?'open':extended[0]?'point':'neutral';
  return{pose,index:landmarks[8],palm:{x:landmarks[0].x*.7+(landmarks[5].x+landmarks[17].x)*.15,y:landmarks[0].y*.7+(landmarks[5].y+landmarks[17].y)*.15},pinch,size};
 }
 function mapPoint(point,{width,height,mirror=true,inset=16}){
  return{x:inset+(mirror?1-point.x:point.x)*(width-inset*2),y:inset+point.y*(height-inset*2)};
 }
 class Machine{
  constructor(hooks={}){
   this.hooks=hooks;this.state='paused';this.selected=null;this.pose='';this.since=0;this.latched=false;this.cooldown=0;
   this.point=null;this.offset=null;this.aimAt=-Infinity;this.aimOffset={x:0,y:0};this.lastAim=0;this.anchor=null;this.candidate=null;this.pinchFrames=0;this.palmOffset=null;
  }
  status(text){this.hooks.status?.(text,this.state);}
  pointer(fallback){return this.hooks.pointer?.()||this.point||fallback;}
  pause(text='手部追踪丢失：操作已暂停。先张掌，再重新选择。',options){
   this.hooks.pause?.(options);this.state='paused';this.selected=null;this.offset=null;this.pose='';this.since=0;this.latched=false;
   this.candidate=null;this.anchor=null;this.point=null;this.aimAt=-Infinity;this.aimOffset={x:0,y:0};this.palmOffset=null;this.pinchFrames=0;
   this.hooks.highlight?.(null);this.hooks.hover?.(null);this.status(text);
  }
  resumeAim(index,now){
   const point=this.pointer(index);this.point={...point};this.lastAim=this.aimAt=now;
   this.aimOffset={x:point.x-index.x,y:point.y-index.y};this.hooks.cursor?.(point);
  }
  commitPinch(now){
   if(this.latched||now<this.cooldown)return;
   this.latched=true;this.cooldown=now+260;const hit=this.candidate;
   if(!hit){this.status('先让光标悬停在器具或烧水按钮上，再捏合。');return;}
   if(hit.type==='control'){
    this.selected=null;this.state='idle';this.hooks.highlight?.(null);this.hooks.hover?.(null);this.hooks.control?.(hit,this.anchor);return;
   }
   if(this.selected?.id===hit.id){this.hooks.tap?.(hit,this.anchor);this.status('已点按 '+hit.label+'；握拳可拿起。');return;}
   if(this.hooks.select?.(hit,this.anchor)===false)return;
   this.selected=hit;this.state='selected';this.hooks.highlight?.(hit);
   this.status(hit.id==='grinder'?'已选中磨豆机：握拳拿起，左右来回移动即可研磨。':'已选中 '+hit.label+'：握拳拿起，发光区域提示放置位置。');
  }
  step(sample,now){
   if(!sample||sample.confidence<.65){if(this.state!=='paused')this.pause();return;}
   const {pose,index,palm}=sample,previous=this.pose,changed=pose!==previous,aiming=pose==='open'||pose==='point';
   if(changed){
    // A quick click may occupy just one inference frame. Commit its release edge,
    // instead of discarding it when the next frame already shows an open hand.
    if(previous==='pinch'&&this.state!=='paused'&&this.state!=='grabbed'&&now-this.since>=30&&now-this.since<=250)this.commitPinch(now);
    this.pose=pose;this.since=now;this.latched=false;
    if(pose==='pinch'||pose==='fist'||pose==='neutral'){
     this.anchor={...this.pointer(index)};
     this.palmOffset={x:this.anchor.x-palm.x,y:this.anchor.y-palm.y};
     this.candidate=pose==='pinch'&&now-this.aimAt<=450?this.hooks.hitTest?.(this.anchor):null;
     this.pinchFrames=0;
    }
   }
   const stable=now-this.since>=(pose==='fist'?180:120);
   if(this.state==='grabbed')this.hooks.hold?.(pose==='fist'&&stable);
   if(this.state==='paused'){
    if(pose==='open'&&stable){this.state='idle';this.point={...index};this.status('已就绪：悬停器具，捏合选中，握拳拿起。');}else return;
   }
   if(this.state==='grabbed'){
    if(pose==='fist'&&stable){this.point={x:palm.x+this.offset.x,y:palm.y+this.offset.y};this.hooks.move?.(this.point);}
    if(pose==='open'&&stable&&!this.latched){
     this.latched=true;this.hooks.release?.(this.pointer(this.point));this.state='idle';this.selected=null;this.offset=null;
     this.hooks.highlight?.(null);this.hooks.hover?.(null);this.cooldown=now+260;this.resumeAim(index,now);this.status('已释放：按提示区域放置，悬停后可重新选中。');
    }
    return;
   }
   if(aiming){
    // Selecting an object never changes pointing into palm control. After opening
    // the fingers, blend out only the temporary closure offset; edges remain reachable.
    if(changed&&!['point','open'].includes(previous))this.resumeAim(index,now);
    else{
     const decay=Math.exp(-Math.max(0,Math.min(125,now-this.lastAim))/80);this.lastAim=now;
     this.aimOffset.x*=decay;this.aimOffset.y*=decay;
     this.point={x:index.x+this.aimOffset.x,y:index.y+this.aimOffset.y};this.hooks.cursor?.(this.point);
    }
    this.aimAt=now;const hit=this.hooks.hitTest?.(this.point);this.hooks.hover?.(hit?.type==='object'?hit:null);return;
   }
   if(pose==='pinch'){
    this.pinchFrames++;if(this.pinchFrames>=2&&now-this.since>=30||now-this.since>=55)this.commitPinch(now);
   }
   if(this.state==='selected'&&pose==='fist'){
    // Freeze just the closure, then calibrate against the already closed palm.
    // Never replay a stale selection anchor during neutral/pointing frames.
    if(!stable){this.hooks.cursor?.(this.anchor);return;}
    if(!this.latched){
     this.latched=true;const anchor=this.anchor;
     if(this.hooks.grab?.(this.selected,anchor)===false){this.status('暂时不能拿起，请看台面提示。');return;}
     this.offset={x:anchor.x-palm.x,y:anchor.y-palm.y};this.point={...anchor};this.state='grabbed';this.hooks.hold?.(true);
     this.status(this.selected.id==='grinder'?'研磨中：握拳左右摇动或绕圈，不必追着木柄。张掌停止。':'拿起了：保持握拳移动，到发光区域后张掌放下。');
    }
    return;
   }
   // Uncertain or held-click poses can still move freely with the stable palm;
   // they do not select, grab or pull the cursor towards any object.
   if(this.palmOffset){this.point={x:palm.x+this.palmOffset.x,y:palm.y+this.palmOffset.y};this.hooks.cursor?.(this.point);this.aimAt=now;const hit=this.hooks.hitTest?.(this.point);this.hooks.hover?.(hit?.type==='object'?hit:null);}
  }
 }
 const api={Machine,classify,mapPoint};root.GestureCore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
