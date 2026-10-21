const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../workshop.js'),'utf8');
function setup(brewer='chemex'){
 const nodes=new Map();for(const name of ['server','dripper','paper','kettle'])nodes.set(name,{dataset:{object:name},attrs:{},animations:[],setAttribute(k,v){this.attrs[k]=v;},getAnimations(){return this.animations;},animate(frames,options){const a={frames,options,cancel(){this.cancelled=true;}};this.animations.push(a);return a;}});
 const ctx={brewer,state:{filterPlaced:true,removed:false,model:{dose:15,liquid:100,bed:4}},bases:{},obj:n=>nodes.get(n),document:{timeline:{currentTime:1234}},kettlePos:{x:0,y:0},reducedMotion:{matches:false},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),basic:()=>false,SVGTools:{chemexDripper:()=>'',server:()=>'',melittaDripper:()=>''},body:x=>x,namespace:x=>x,wetArt:()=>'',patchVessel(){for(const node of nodes.values())node.attrs={};},applyInteractive(){},drag:null};
 vm.createContext(ctx);for(const [start,end]of [['function movingParts(','function stopInput('],['function renderVessel()','function wetArt()'],['function settleObject(','// Retain unchanged SVG']])vm.runInContext(source.slice(source.indexOf(start),source.indexOf(end)),ctx);
 return{ctx,nodes};
}
test('Chemex carries its installed paper and powder through dragging, wetness redraw and reset',()=>{
 const {ctx,nodes}=setup();ctx.translate('server',91,-43);assert.equal(nodes.get('paper').attrs.transform,'translate(91 -43)');
 ctx.drag={object:'server',dx:91,dy:-43};ctx.renderVessel();assert.equal(nodes.get('paper').attrs.transform,nodes.get('server').attrs.transform);
 ctx.drag=null;ctx.translate('server');assert.equal(nodes.get('paper').attrs.transform,'translate(0 0)');
});
test('Melitta carries the powder with the dripper while the separate server moves independently',()=>{
 const {ctx,nodes}=setup('melitta');ctx.translate('dripper',-50,80);assert.equal(nodes.get('paper').attrs.transform,'translate(-50 80)');
 ctx.translate('server',110,30);assert.equal(nodes.get('paper').attrs.transform,'translate(-50 80)');
 ctx.drag={object:'dripper',dx:40,dy:-20};ctx.renderVessel();assert.equal(nodes.get('paper').attrs.transform,nodes.get('dripper').attrs.transform);
});
test('paper can still be removed independently and removed or absent paper is never carried',()=>{
 const {ctx,nodes}=setup();ctx.translate('paper',60,40);assert.equal(nodes.get('server').attrs.transform,undefined);
 for(const state of [{filterPlaced:false,removed:false},{filterPlaced:true,removed:true}]){Object.assign(ctx.state,state);assert.deepEqual(Array.from(ctx.movingParts('server')), [nodes.get('server')]);}
});
test('carrier and paper return with identical frames, easing and a shared start time',()=>{
 for(const [brewer,carrier]of [['chemex','server'],['melitta','dripper']]){
  const {ctx,nodes}=setup(brewer);ctx.settleObject(carrier,85,-30);
  const a=nodes.get(carrier).animations[0],b=nodes.get('paper').animations[0];assert.deepEqual(a.frames,b.frames);assert.deepEqual(a.options,b.options);assert.equal(a.startTime,b.startTime);assert.equal(a.startTime,1234);
  ctx.reducedMotion.matches=true;ctx.settleObject(carrier,85,-30);assert.equal(nodes.get('paper').animations.length,1);
 }
});
test('serving uses the same attached parts, including redraws during the pour',()=>{
 const {ctx,nodes}=setup();let config;
 Object.assign(ctx,{BrewModel:{result:()=>({volume:100})},StudioMotion:{transfer:c=>{config=c;},fillCup(){}},scene:{},$:()=>({}),finishPour(){},stopInput(){},transferBusy(){},message(){},transferCancel:null});
 vm.runInContext(source.slice(source.indexOf('function serve('),source.indexOf('function showResult(')),ctx);ctx.serve();
 assert.deepEqual(Array.from(config.actors()),[nodes.get('server'),nodes.get('paper')]);config.onFrame({poured:.5});ctx.renderVessel();assert.deepEqual(Array.from(config.actors()),[nodes.get('server'),nodes.get('paper')]);
});
