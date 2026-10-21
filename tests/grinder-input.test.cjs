const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const G=require('../grinder-input.js');
test('grabbing any part of the wooden handle preserves its offset through a full elliptical turn and reversal',()=>{
 for(const start of [0,.7,Math.PI,-2.6])for(const offset of [{x:0,y:-22},{x:12,y:-12},{x:-16,y:-35}]){
  const at=G.point(start),track=G.begin(start,{x:at.x+offset.x,y:at.y+offset.y});let angle=start;
  assert.ok(Math.abs(G.step(track,{x:at.x+offset.x,y:at.y+offset.y}))<1e-12);
  for(const direction of [1,-1])for(let i=1;i<=64;i++){
   const target=start+(direction===-1?Math.PI*2:0)+direction*Math.PI*2*i/64,p=G.point(target);angle+=G.step(track,{x:p.x+offset.x,y:p.y+offset.y});assert.ok(Math.abs(angle-target)<1e-10);
  }
 }
});
test('crossing the turn boundary never invents a whole turn, and passing through the hub resumes without a jump',()=>{
 const track=G.begin(Math.PI-.02,G.point(Math.PI-.02));assert.ok(Math.abs(G.step(track,G.point(-Math.PI+.02))-.04)<1e-10);
 assert.equal(G.step(track,{x:201,y:258}),0);assert.equal(G.step(track,G.point(.5)),0);assert.ok(Math.abs(G.step(track,G.point(.6))-.1)<1e-10);
});
test('both real pointer handlers draw the new grip angle in the same event, with no display-frame lag',()=>{
 for(const route of ['workshop','equipment-studio']){
  const source=fs.readFileSync(require.resolve('../'+route+'.js'),'utf8'),start=source.indexOf('function movePointer(e)'),end=source.indexOf(route==='workshop'?"scene.addEventListener('pointermove'":"svg.addEventListener('pointermove'",start);
  const from={x:277,y:236},to={x:201,y:258},painted=[],ctx={CoffeeGrinder:G,point:e=>e,drag:{object:'grinder',name:'grinder',kind:'crank',pointer:9,pointerId:9,start:from,crank:G.begin(0,from)},state:{crankAngle:0,displayAngle:0},u:{angle:0,display:0},rotateGrinder:r=>ctx.state.crankAngle+=r,grind:r=>ctx.u.angle+=r,drawCrank:()=>painted.push(route==='workshop'?ctx.state.displayAngle:ctx.u.display)};
  vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);ctx.movePointer({...to,pointerId:9});assert.equal(painted.length,1);assert.ok(Math.abs(painted[0]-Math.PI/2)<1e-12);
 }
});
