const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../shop.js'),'utf8');
function rig(){
 const classes=new Set(),listeners=new Map(),captures=new Set(),removed=[],nodes=new Map();
 const make=()=>({style:{},classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)},getBoundingClientRect:()=>({left:10,top:20,width:80,height:60}),remove(){removed.push(this);},querySelector:()=>null});
 for(const name of ['#scene-kettle','#scene-fx'])nodes.set(name,make());
 Object.assign(nodes.get('#scene-kettle'),{setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)});
 const ctx={kettleDrag:null,kettleCombo:null,kettle:'<svg/>',game:{},document:{body:{append(){},classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)}},createElement:make},window:{addEventListener:(n,fn,options)=>listeners.set(n,{fn,options}),removeEventListener:n=>listeners.delete(n)},$:n=>nodes.get(n),canHoldKettle:()=>true,guestAtPoint:()=>null,setKettleTarget(){},setArmed(){},hideComboBadge(){},clearInterval(){},toast(){}};
 vm.createContext(ctx);
 for(const [a,b]of [[' function placeKettleGhost(','function setKettleTarget('],[' function clearKettleDrag(',' function kettleHit('],[' function blockKettleScroll(',' function loop('],[' function beginKettleDrag(',' $(\'#scene-kettle\').addEventListener(\'pointerdown\',beginKettleDrag);']])vm.runInContext(source.slice(source.indexOf(a),source.indexOf(b)),ctx);
 const event=(id=7)=>({button:0,pointerId:id,clientX:140,clientY:170,cancelable:true,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}});
 return{ctx,event,classes,listeners,captures,removed};
}
test('taking the kettle captures one pointer and blocks touch scrolling only during that drag',()=>{
 const r=rig(),down=r.event();r.ctx.beginKettleDrag(down);assert.ok(down.prevented);assert.ok(r.captures.has(7));assert.ok(r.classes.has('kettle-dragging'));assert.equal(r.listeners.get('touchmove').options.passive,false);
 const move=r.event();move.clientX=220;r.ctx.onKettleMove(move);assert.ok(move.prevented);assert.match(r.ctx.kettleDrag.ghost.style.transform,/translate3d\(220px,170px,0\)/);
 const unrelated=r.event(8);r.ctx.onKettleMove(unrelated);assert.equal(unrelated.prevented,undefined);r.ctx.onKettleCancel(unrelated);assert.ok(r.ctx.kettleDrag);
 r.ctx.onKettleCancel(r.event());assert.equal(r.ctx.kettleDrag,null);assert.equal(r.captures.size,0);assert.equal(r.listeners.size,0);assert.ok(!r.classes.has('kettle-dragging'));assert.equal(r.removed.length,1);
 const scroll=r.event();r.ctx.blockKettleScroll(scroll);assert.equal(scroll.prevented,undefined);
});
test('interruption cleanup is idempotent and does not arm or hit a customer',()=>{
 const r=rig();r.ctx.beginKettleDrag(r.event());r.ctx.setArmed=()=>{throw Error('Cancellation must not arm a hit');};r.ctx.clearKettleDrag();r.ctx.clearKettleDrag();assert.equal(r.listeners.size,0);assert.equal(r.removed.length,1);
});
