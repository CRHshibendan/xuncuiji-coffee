const test=require('node:test'),assert=require('node:assert/strict');
const {createCopyTransition}=require('../learn-motion.js');
function fixture(reduced=false){let now=0,id=0,text='old';const states=[],timers=new Map();
 const p=createCopyTransition({reduced:()=>reduced,onState:s=>states.push(s),setTimer:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;},clearTimer:id=>timers.delete(id)});
 function advance(ms){const end=now+ms;while(true){const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);now=next[1].at;next[1].fn();}now=end;}
 return{p,states,timers,advance,get text(){return text;},choose:value=>p.change(()=>text=value)};
}
test('copy waits for the old text to fade out, then enters and cleans up at 420ms',()=>{const b=fixture();b.choose('new');assert.equal(b.text,'old');assert.deepEqual(b.states,['out']);b.advance(99);assert.equal(b.text,'old');b.advance(1);assert.equal(b.text,'new');assert.equal(b.states.at(-1),'in');b.advance(319);assert.equal(b.states.at(-1),'in');b.advance(1);assert.equal(b.states.at(-1),'idle');});
test('rapid choices cannot show stale text after the latest selection',()=>{const b=fixture();b.choose('first');b.advance(50);b.choose('second');b.advance(50);assert.equal(b.text,'old');b.advance(50);assert.equal(b.text,'second');b.advance(1000);assert.equal(b.text,'second');assert.equal(b.states.at(-1),'idle');});
test('reduced motion commits immediately and retains only a 150ms fade',()=>{const b=fixture(true);b.choose('new');assert.equal(b.text,'new');assert.equal(b.states.at(-1),'reduced');b.advance(150);assert.equal(b.states.at(-1),'idle');});
test('leaving the page commits the latest choice and cancels pending callbacks',()=>{const b=fixture();b.choose('new');b.p.finish();assert.equal(b.text,'new');assert.equal(b.timers.size,0);b.advance(500);assert.equal(b.states.at(-1),'idle');});
