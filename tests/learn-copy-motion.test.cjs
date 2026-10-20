const test=require('node:test'),assert=require('node:assert/strict');
const {createCopyTransition}=require('../learn-motion.js');
function fixture(reduced=false){let now=0,id=0,text='old';const states=[],snapshots=[],timers=new Map();
 const p=createCopyTransition({reduced:()=>reduced,prepare:()=>{snapshots.push(text);return text;},onState:s=>states.push(s),setTimer:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;},clearTimer:id=>timers.delete(id)});
 function advance(ms){const end=now+ms;while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);now=next[1].at;next[1].fn();}now=end;}
 return{p,states,snapshots,timers,advance,get text(){return text;},choose:value=>p.change(()=>text=value)};
}
test('copy snapshots outgoing text and commits incoming text immediately, without a blank gap',()=>{const b=fixture();b.choose('new');assert.equal(b.text,'new');assert.deepEqual(b.snapshots,['old']);assert.deepEqual(b.states,['cancel','in']);b.advance(419);assert.equal(b.states.at(-1),'in');b.advance(1);assert.equal(b.states.at(-1),'idle');});
test('rapid choices cancel stale cleanup and keep the latest selection visible',()=>{const b=fixture();b.choose('first');b.advance(50);b.choose('second');assert.equal(b.text,'second');assert.deepEqual(b.snapshots,['old','first']);b.advance(370);assert.equal(b.states.at(-1),'in');b.advance(50);assert.equal(b.states.at(-1),'idle');assert.equal(b.text,'second');});
test('reduced motion commits immediately and retains only a 150ms fade, without a ghost snapshot',()=>{const b=fixture(true);b.choose('new');assert.equal(b.text,'new');assert.equal(b.snapshots.length,0);assert.equal(b.states.at(-1),'reduced');b.advance(150);assert.equal(b.states.at(-1),'idle');});
test('leaving the page cleans up immediately without reverting the latest choice',()=>{const b=fixture();b.choose('new');b.p.finish();assert.equal(b.text,'new');assert.equal(b.timers.size,0);b.advance(500);assert.equal(b.states.at(-1),'idle');});
