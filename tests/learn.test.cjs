const test=require('node:test'),assert=require('node:assert/strict');
const lesson=require('../learn.js'),methods=require('../methods.js');
test('all seven classroom choices retain their complete brewing steps',()=>{
 assert.equal(Object.keys(lesson.brewerInfo).length,7);
 for(const key of Object.keys(lesson.brewerInfo)){
  const steps=lesson.lessonSteps(key);assert.ok(steps.length>=4,key);
  assert.ok(steps.every(s=>s.name&&s.title&&s.text),key);
  if(!['melitta','chemex'].includes(key))assert.deepEqual(steps,methods.methods[key].steps);
 }
 assert.equal(lesson.lessonSteps('melitta').length,7);assert.equal(lesson.lessonSteps('chemex').length,7);
});
test('ratio readout and illustration follow the same bounded quantities',()=>{
 assert.equal(lesson.variableValues({dose:20,ratio:16}).water,320);
 assert.deepEqual(lesson.variableValues({dose:100,ratio:1,grind:8,temp:120}),{dose:30,ratio:13,grind:5,temp:100,water:390});
 assert.equal(lesson.variableValues({dose:NaN,ratio:NaN}).water,225);
 assert.notEqual(lesson.variableDrawing('ratio',{dose:15,ratio:15}),lesson.variableDrawing('ratio',{dose:20,ratio:16}));
 assert.notEqual(lesson.variableDrawing('grind',{grind:1}),lesson.variableDrawing('grind',{grind:5}));
 assert.notEqual(lesson.variableDrawing('temperature',{temp:80}),lesson.variableDrawing('temperature',{temp:100}));
});
test('three teaching stages remain distinct and keep text outside the drawing',()=>{
 const drawings=[0,1,2].map(lesson.processDrawing);assert.equal(new Set(drawings).size,3);
 for(const drawing of drawings)assert.doesNotMatch(drawing,/<text|gradient|filter=/i);
});
function player(){let step=0,allowed=true,queue=new Map(),id=0;const changes=[];
 const p=lesson.createPlayback({getLength:()=>4,getStep:()=>step,onStep:n=>{step=n;changes.push(n);},allowed:()=>allowed,setTimer:fn=>{queue.set(++id,fn);return id;},clearTimer:n=>queue.delete(n)});
 return{p,changes,queue,get step(){return step;},deny(){allowed=false;},tick(){const entry=queue.entries().next().value;if(entry){queue.delete(entry[0]);entry[1]();}}};
}
test('optional teaching playback ends at the final step, without looping',()=>{const b=player();b.p.start();b.tick();b.tick();b.tick();assert.equal(b.step,3);assert.equal(b.p.playing,false);assert.equal(b.queue.size,0);assert.deepEqual(b.changes,[1,2,3]);});
test('stop, hidden-page and reduced-motion cancellation cannot advance a stale step',()=>{
 const b=player();b.p.start();const stale=[...b.queue.values()][0];b.p.stop();stale();assert.equal(b.step,0);assert.equal(b.queue.size,0);
 b.p.start();b.deny();b.tick();assert.equal(b.step,0);assert.equal(b.p.playing,false);assert.equal(b.p.start(),false);assert.equal(b.queue.size,0);
});

test('process stages keep the grounds in place and reserve motion for wetting, dissolved material and drops',()=>{
 const drawings=[0,1,2].map(lesson.processDrawing);
 const grains=drawings.map(s=>s.match(/<g class="process-grounds">([\s\S]*?)<\/g>/)[1]);assert.equal(new Set(grains).size,1);
 assert.match(drawings[0],/process-wet process-animated/);assert.match(drawings[0],/process-bubble/);assert.doesNotMatch(drawings[0],/process-coffee/);
 assert.match(drawings[1],/process-soluble process-animated/);assert.doesNotMatch(drawings[1],/process-bubble/);
 assert.match(drawings[2],/process-drop process-animated/);assert.match(drawings[2],/clipPathUnits="objectBoundingBox"/);assert.match(drawings[2],/class="process-reveal process-animated"/);assert.doesNotMatch(drawings[2],/process-water/);
 for(const drawing of drawings)assert.doesNotMatch(drawing,/M110 118h180|demo-grains/);
});
