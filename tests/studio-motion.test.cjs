const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../studio-motion.js'),BrewModel=require('../brew-model.js');
function node(){return{attrs:new Map(),children:[],isConnected:true,setAttribute(k,v){this.attrs.set(k,String(v));},getAttribute(k){return this.attrs.has(k)?this.attrs.get(k):null;},removeAttribute(k){this.attrs.delete(k);},append(child){this.children.push(child);child.parent=this;},remove(){this.isConnected=false;if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);},set innerHTML(html){this.children=[...html.matchAll(/<(ellipse|path)\b[^>]*>/g)].map(()=>node());}};}
function fixture(){let clock=0,seq=0,hidden=false;const queue=new Map(),env={document:{createElementNS:()=>node()},raf:fn=>{queue.set(++seq,fn);return seq;},caf:id=>queue.delete(id),hidden:()=>hidden,reduced:()=>false};return{motion:M.create(env),setHidden:v=>hidden=v,step(ms=16){clock+=ms;const ready=[...queue.values()];queue.clear();ready.forEach(fn=>fn(clock));},get pending(){return queue.size;}};}
test('retained liquid geometry updates on intermediate display frames and stops scheduling when settled',()=>{
 const f=fixture(),el=node();el.setAttribute('y','500');f.motion.attribute(el,'y',400,100);
 const values=[];for(let i=0;i<8;i++){f.step();values.push(Number(el.getAttribute('y')));}
 assert.ok(values.filter(v=>v>400&&v<500).length>=5);assert.equal(values.at(-1),400);assert.equal(f.pending,0);
 const interp=M.interpolator('M380 480q70-13 140 0v240H380Z','M380 300q70-13 140 0v240H380Z');assert.ok(interp);assert.match(interp(.5),/390\.000/);
 assert.equal(M.interpolator('M0 0L1 1','M0 0Q1 1 2 2'),null);
});
test('transfer progress is monotonic, conserves visible material, and keeps flow below the moving lip',()=>{
 const c={base:[100,0],pivot:[200,410],mouth:[239,383],offset:[90,-150],to:[450,238],angle:78};let previous=0;
 for(let i=0;i<=100;i++){const f=M.transferFrame(i/100,c);assert.ok(f.poured>=previous);previous=f.poured;const sent=15*f.poured,stock=15-sent;assert.ok(Math.abs(stock+sent-15)<1e-9);if(f.flow>0){assert.ok(Math.abs(f.lip[0]-450)<1e-9);assert.ok(f.lip[1]<238);}}
 assert.equal(M.transferFrame(0,c).poured,0);assert.equal(M.transferFrame(1,c).poured,1);assert.equal(M.transferFrame(1,c).angle,0);
});
test('a transfer pauses while hidden, completes once, and removes its particles and pose',()=>{
 const f=fixture(),layer=node(),actor=node();let complete=0,progress=0;
 f.motion.transfer({kind:'grounds',layer,actors:()=>[actor],pivot:[300,415],mouth:[342,390],to:[450,274],angle:78,onFrame:p=>progress=p.poured,onComplete:()=>complete++});
 for(let i=0;i<36;i++)f.step();const held=progress;f.setHidden(true);for(let i=0;i<40;i++)f.step();assert.equal(progress,held);assert.equal(complete,0);
 f.setHidden(false);for(let i=0;i<110;i++)f.step();assert.equal(progress,1);assert.equal(complete,1);assert.equal(layer.children.length,0);assert.equal(actor.getAttribute('data-transfer-pose'),null);assert.equal(f.pending,0);
});
test('cancelling a transfer clears its effects without committing a dose or sale',()=>{
 const f=fixture(),layer=node(),actor=node();let commits=0,cancels=0;
 f.motion.transfer({kind:'liquid',layer,actors:()=>[actor],pivot:[450,400],mouth:[516,274],to:[705,433],angle:48,onComplete:()=>commits++,onCancel:()=>cancels++});f.step();f.motion.stop();
 for(let i=0;i<150;i++)f.step();assert.equal(commits,0);assert.equal(cancels,1);assert.equal(layer.children.length,0);assert.equal(actor.getAttribute('transform'),null);
});
test('the real hand-pour actions defer their single model commit until the visible transfer finishes',()=>{
 const source=fs.readFileSync(require.resolve('../workshop.js'),'utf8'),actions=source.slice(source.indexOf('function transferBusy('),source.indexOf('function showResult('));
 const nodes=new Map(),get=k=>{if(!nodes.has(k))nodes.set(k,node());return nodes.get(k);},model=BrewModel.create();model.liquid=200;BrewModel.addGrounds(model,15,2);
 const moves=[],results=[],timers=[],ctx={state:{model,groundsReady:10,readyGrind:3,served:false},BrewModel,StudioMotion:{transfer:config=>{moves.push(config);config.onFrame({poured:0});return()=>{};},fillCup:(svg,v)=>results.push(v)},scene:node(),brewer:'melitta',transferCancel:null,resultTimer:null,document:{body:{classList:{toggle(){}}}},$:get,obj:get,CoffeePaint:{attr:(el,k,v)=>el.setAttribute(k,v)},finishPour(){},stopInput(){},applyInteractive(){},message(){},translate(){},basic:()=>false,refreshAction(){},renderVessel(){},setTimeout:fn=>{timers.push(fn);return 1;},showResult(){}};
 vm.createContext(ctx);vm.runInContext(actions,ctx);ctx.pourGrounds();assert.equal(model.dose,15);moves[0].onFrame({poured:.5});assert.equal(ctx.state.visualDose,20);assert.equal(model.dose,15);moves[0].onComplete();assert.equal(model.dose,25);assert.equal(ctx.state.groundsReady,0);
 ctx.serve();ctx.serve();assert.equal(moves.length,2);assert.equal(timers.length,0);moves[1].onFrame({poured:.5});assert.equal(ctx.state.visualLiquid,100);assert.equal(results.at(-1),100);assert.equal(ctx.state.served,false);
 moves[1].onComplete();assert.equal(ctx.state.served,true);assert.equal(results.at(-1),200);assert.equal(timers.length,1);
});
test('the other five brewers preview material visually and preserve the real recipe until completion',()=>{
 const CoffeeFree=require('../free-model.js'),source=fs.readFileSync(require.resolve('../equipment-studio.js'),'utf8');
 const actions=source.slice(source.indexOf(' function transferBusy('),source.indexOf(' function finishServe('));
 for(const id of ['frenchpress','coldbrew','moka','espresso','siphon']){
  const s=CoffeeFree.create(id),p={dose:15,water:225,temp:92,grind:3},u={},moves=[],nodes=new Map(),get=k=>{if(!nodes.has(k))nodes.set(k,node());return nodes.get(k);};s.beans=15;CoffeeFree.grindAmount(s,15,3);
  const ctx={s,p,u,id,basic:false,base:{grounds:[0,0],cup:[0,0]},CoffeeFree,meta:{dose:15},bed:()=>({x:450,y:274,rx:65}),document:{body:{classList:{toggle(){}}}},$:get,object:get,svg:node(),StudioMotion:{transfer:config=>{moves.push(config);config.onFrame({poured:0});return()=>{};},fillCup(){}},feedback(){},finishPour(){},resetPick(){},move(){},beforeServe:null,transferCancel:null,doAction:(token,options,amount)=>CoffeeFree.action(s,token,{...p,dose:amount},options),finishServe:()=>{CoffeeFree.pour(s,p);u.served=true;}};
  vm.createContext(ctx);vm.runInContext(actions,ctx);ctx.pourGrounds(15);assert.equal(s.dose,0);moves[0].onFrame({poured:.5});assert.equal(u.visualDose,7.5);assert.equal(u.visualGrounds,7.5);moves[0].onComplete();assert.equal(s.dose,15);assert.equal(s.grounds,0);
  s.water=225;s.output=100;s.returned=1;ctx.serve();ctx.serve();assert.equal(moves.length,2);assert.equal(s.served,0);moves[1].onFrame({poured:.5});assert.ok(u.visualServed>0);assert.equal(s.served,0);moves[1].onComplete();assert.equal(u.served,true);assert.ok(s.served>0);
 }
});
test('espresso locking animates only its grip paths and refreshes controls when finished',()=>{
 const source=fs.readFileSync(require.resolve('../equipment-studio.js'),'utf8'),fn=source.slice(source.indexOf(' function lockHandle('),source.indexOf(' function swirl('));
 const paths=[node(),node(),node()],grip=node(),queue=[];grip.querySelectorAll=()=>paths;
 const ctx={u:{locking:false,lockAngle:0},s:{locked:false},p:{},CoffeeFree:{action:s=>s.locked=true},art:()=>ctx.paints++,paints:0,lastArtState:'old',performance:{now:()=>0},reduced:{matches:false},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),requestAnimationFrame:f=>queue.push(f),$:()=>grip,StudioMotion:{attribute:(el,k,v)=>el.setAttribute(k,v)},feedback(){},hud(){},check(){}};
 vm.createContext(ctx);vm.runInContext(fn,ctx);ctx.lockHandle();assert.equal(ctx.paints,1);
 queue.shift()(150);queue.shift()(325);assert.equal(ctx.paints,1);queue.shift()(650);
 assert.equal(ctx.u.locking,false);assert.equal(Math.abs(ctx.u.lockAngle),0);assert.equal(grip.getAttribute('data-lock-angle'),'0.0');assert.equal(ctx.paints,2);assert.equal(ctx.lastArtState,'');
});
