/* One geometry for the rendered crank and its pointer grab, across all seven brewers. */
(function(root){
 'use strict';
 const center={x:201,y:258},radius={x:76,y:22};
 function point(angle){return{x:center.x+radius.x*Math.cos(angle),y:center.y+radius.y*Math.sin(angle)};}
 function begin(angle,p){const grip=point(angle);return{lastAngle:angle,offset:{x:p.x-grip.x,y:p.y-grip.y}};}
 function step(track,p){
  const x=(p.x-track.offset.x-center.x)/radius.x,y=(p.y-track.offset.y-center.y)/radius.y;
  if(Math.hypot(x,y)<.2){track.lastAngle=null;return 0;}
  const angle=Math.atan2(y,x),previous=track.lastAngle;track.lastAngle=angle;
  if(previous===null)return 0;
  return Math.atan2(Math.sin(angle-previous),Math.cos(angle-previous));
 }
 const api={point,begin,step};root.CoffeeGrinder=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
