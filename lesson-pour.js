/* A finite, continuous pour: kettle, stream, landing and receiving liquid share a clock. */
(function(root){
 'use strict';
 const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 function frame(ms){const flow=ease((ms-350)/250)*(1-ease((ms-2850)/250)),a=clamp((ms-350)/2650)*Math.PI*2.2,dx=Math.sin(a)*5*flow,dy=(Math.cos(a)-1)*2*flow;return{angle:18*ease(ms/420)*(1-ease((ms-3000)/420)),flow,dx,dy,landing:{x:298+Math.sin(a)*14,y:155+Math.cos(a)*3},wet:ease((ms-500)/900),fill:ease((ms-1100)/2200)};}
 function play(svg){
  const kettle=svg.querySelector('.pour-kettle'),water=svg.querySelector('.demo-water'),wet=svg.querySelector('.demo-wet'),liquid=svg.querySelector('.demo-fill'),drops=[...svg.querySelectorAll('.demo-drop')],drift=[...svg.querySelectorAll('.demo-drift')];
  let id=0,cancelled=false,start=null;const ns='http://www.w3.org/2000/svg';let rings=svg.querySelector('.pour-rings');if(!rings){rings=document.createElementNS(ns,'g');rings.setAttribute('class','pour-rings');rings.innerHTML='<ellipse fill="none"/><ellipse fill="none"/>';svg.append(rings);}
  kettle.style.transformOrigin='0 0';kettle.style.transformBox='view-box';wet.style.transformBox='view-box';wet.style.transformOrigin='298px 157px';liquid.style.transformBox='view-box';liquid.style.stroke='none';
  function paint(ms){const f=frame(ms),sx=291+f.dx,sy=82+f.dy;
   kettle.setAttribute('transform',`translate(${f.dx} ${f.dy}) rotate(${f.angle} 291 82)`);water.setAttribute('d',`M${sx} ${sy}C${sx+8} ${sy+22} ${f.landing.x} 129 ${f.landing.x} ${f.landing.y}`);water.style.opacity=f.flow;water.style.strokeOpacity='.7';
   drift.forEach((el,i)=>{const p=((ms-600-i*210)/600)%1,on=ms>600+i*210&&ms<2950&&p>=0;el.style.opacity=on?Math.sin(p*Math.PI)*f.flow:0;el.setAttribute('d',`M${sx+(f.landing.x-sx)*p} ${sy+(f.landing.y-sy)*p}l1 6`);});
   wet.style.transform=`scale(${Math.max(.01,f.wet)})`;wet.style.opacity=f.wet;
   [...rings.children].forEach((el,i)=>{const p=((ms-650-i*250)/700)%1,on=ms>650+i*250&&ms<3100;el.setAttribute('cx',f.landing.x);el.setAttribute('cy',f.landing.y);el.setAttribute('rx',5+Math.max(0,p)*12);el.setAttribute('ry',1.5+Math.max(0,p)*2.5);el.setAttribute('opacity',on?(1-Math.max(0,p))*.35*f.flow:0);});
   drops.forEach((el,i)=>{const p=((ms-1050-i*180)/650)%1,on=ms>1050+i*180&&ms<3450&&p>=0;el.style.opacity=on?Math.sin(p*Math.PI)*.8:0;el.style.transform=`translateY(${Math.max(0,p)*9}px)`;});
   liquid.style.transform=`translateY(${28*(1-f.fill)}px)`;liquid.style.opacity=f.fill>0?1:0;svg.dataset.pourState=ms<420?'tilting':ms<3000?'pouring':'rest';
  }
  function tick(now){if(cancelled)return;if(start===null)start=now;const ms=now-start;paint(ms);if(ms<3800)id=requestAnimationFrame(tick);}
  paint(0);id=requestAnimationFrame(tick);return()=>{cancelled=true;cancelAnimationFrame(id);paint(3800);};
 }
 const api={frame,play};root.CoffeeLessonPour=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
