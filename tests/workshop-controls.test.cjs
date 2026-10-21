const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../workshop.js'),'utf8');
function setup(){
 const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',disabled:false,offsetHeight:81,style:{getPropertyValue(){return ''},setProperty(){}},setAttribute(){},addEventListener(){},animate(frames,options){ctx.animation={frames,options};}});return nodes.get(id);};
 const ctx={state:{model:{brewWater:19,water:64},temp:46.6,targetTemp:92,heating:false,step:6},mode:'advanced',kettlePos:{x:-120,y:-50},selected:'kettle',drag:{},reducedMotion:{matches:false},basic:()=>ctx.mode==='basic',recipe:()=>({water:225,temp:92}),basicGoal:()=>30,document:{body:{classList:{add(){}}}},$:node,obj:node,CoffeePaint:{text:(n,s)=>n.textContent=s},finishPour(){ctx.stopped=true;},clearPick(){ctx.selected=null;},translate(name){assert.equal(name,'kettle');ctx.kettlePos={x:0,y:0};},renderOperationHints(){ctx.hints=true;}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function canControlHeat()'),source.indexOf('function updateHeatGuide()')),ctx);return{ctx,node};
}
test('nearby controls show actual brew water and measured temperature, and share the original mode guards',()=>{
 const {ctx,node}=setup();ctx.updateBrewControls();assert.equal(node('#brew-water-total').textContent,'19 g');assert.equal(node('#brew-kettle-temp').textContent,'47°C / 92°C');assert.equal(node('#brew-heat-toggle').disabled,false);
 ctx.state.heating=true;ctx.updateBrewControls();assert.equal(node('#brew-heat-toggle').textContent,'停止烧水');
 ctx.state.paused=true;assert.equal(ctx.canControlHeat(),false);ctx.state.paused=false;ctx.state.transferring=true;assert.equal(ctx.canControlHeat(),false);ctx.state.transferring=false;
 ctx.mode='basic';ctx.state.step=6;assert.equal(ctx.canControlHeat(),false);assert.equal(ctx.stationReadout().target,30);ctx.state.step=3;ctx.state.heating=false;assert.equal(ctx.stationReadout().heatEnabled,true);ctx.state.temp=92;assert.equal(ctx.stationReadout().heatEnabled,false);
});
test('returning parks the kettle without changing water or temperature, stops input and clears selection',()=>{
 const {ctx}=setup(),before=JSON.stringify(ctx.state);ctx.returnKettleHome();assert.equal(ctx.stopped,true);assert.equal(ctx.selected,null);assert.equal(ctx.drag,null);assert.equal(ctx.kettlePos.x,0);assert.equal(ctx.kettlePos.y,0);assert.equal(ctx.animation.options.duration,250);assert.match(ctx.animation.frames[0].transform,/-120px,-50px/);assert.equal(JSON.stringify(ctx.state),before);
});
test('reduced motion still parks the kettle immediately',()=>{const{ctx}=setup();ctx.reducedMotion.matches=true;ctx.returnKettleHome();assert.equal(ctx.kettlePos.x,0);assert.equal(ctx.animation,undefined);});
