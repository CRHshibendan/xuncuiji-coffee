const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),R=require('../shop-round.js');
const source=fs.readFileSync(path.resolve(__dirname,'../shop.js'),'utf8');
const hits=source.slice(source.indexOf(' function kettleHit('),source.indexOf(' function onKettleMove('));
function fixture(){
 const game=R.createRound(),guestId=game.queue[0].id;
 const guest={dataset:{guest:guestId},classList:{remove(){},add(){}},offsetWidth:90,getBoundingClientRect:()=>({left:100,top:100,width:80,height:120}),querySelector:()=>({textContent:'小满'})};
 const ctx={game,kettleCombo:{count:0,coins:0,targetId:null,targetHits:0,inside:true,lastHit:0},KETTLE_HITS:4,clock:1000,enabled:true,paid:[],coins:0,intervals:[],messages:[],performance:{now:()=>ctx.clock},canHoldKettle:()=>ctx.enabled,setKettleTarget(){},spawnCoins:(x,y,n)=>ctx.coins+=n,showComboBadge(){},setTimeout(){},setInterval(fn){ctx.intervals.push(fn);return ctx.intervals.length},document:{querySelector:()=>guest},$:()=>({getBoundingClientRect:()=>({left:0,top:0})}),bonk:(id,point,coins)=>{const r=R.resolve(game,id,'expelled',coins);ctx.paid.push(r);return r},toast:t=>ctx.messages.push(t),say:t=>ctx.messages.push(t),Math:Object.assign(Object.create(Math),{random:()=>1})};
 vm.createContext(ctx);vm.runInContext(hits,ctx);return{ctx,guest};
}
test('four kettle hits eject once and settle the comfort fee plus only awarded coins',()=>{
 const {ctx,guest}=fixture(),initial=ctx.game.revenue;
 for(let i=0;i<3;i++){ctx.kettleHit(guest,140,140);ctx.clock+=120;}
 assert.equal(ctx.paid.length,0);assert.equal(ctx.kettleCombo.count,3);
 ctx.kettleHit(guest,140,140);
 assert.equal(ctx.paid.length,1);assert.equal(ctx.game.expelled,1);assert.equal(ctx.coins,4);
 assert.equal(ctx.game.revenue-initial,19);assert.equal(ctx.kettleCombo.targetId,null);
 assert.ok(ctx.messages.some(x=>x.includes('连击 ×4')));
});
test('pointer bursts are throttled and holding the kettle continues the same combo',()=>{
 const {ctx,guest}=fixture();ctx.kettleHit(guest,140,140);ctx.clock+=40;ctx.kettleHit(guest,140,140);
 assert.equal(ctx.kettleCombo.count,1);assert.equal(ctx.intervals.length,1);
 ctx.clock+=260;ctx.intervals[0]();assert.equal(ctx.kettleCombo.count,2);
 ctx.enabled=false;ctx.clock+=260;ctx.intervals[0]();assert.equal(ctx.kettleCombo.count,2);
});
