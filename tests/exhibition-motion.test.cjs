const test=require('node:test'),assert=require('node:assert/strict');
const {focusFrame}=require('../home-exhibition.js');
const {transitionTarget}=require('../page-motion.js');
const location={href:'https://example.com/coffee/index.html',origin:'https://example.com',pathname:'/coffee/index.html',search:''};
const event={button:0};
const link=(href,extra={})=>({href,hasAttribute:()=>false,...extra});
test('scroll focus follows the nearest chapter, including reverse scroll and section ends',()=>{
 assert.equal(focusFrame([400,1000,1600,2200],420,800).index,0);
 assert.equal(focusFrame([-800,-200,400,1000],420,800).index,2);
 assert.equal(focusFrame([-200,400,1000,1600],420,800).index,1);
 assert.equal(focusFrame([-2000,-1400,-800,-200],420,800).index,3);
});
test('object motion is bounded and grows towards the focal point',()=>{
 const far=focusFrame([1000],400,600),near=focusFrame([400],400,600);
 assert.ok(near.scale>far.scale);
 for(const line of [-1e6,0,400,1e6]){const f=focusFrame([400],line,600);assert.ok(f.progress>=0&&f.progress<=1);assert.ok(f.scale>=1.03&&f.scale<=1.21);assert.ok(Math.abs(f.turn)<=17);}
});
test('transitions preserve hashes, browser shortcuts, downloads and external links',()=>{
 assert.equal(transitionTarget(event,link('https://example.com/coffee/workshop.html?tool=chemex&mode=basic'),location),'https://example.com/coffee/workshop.html?tool=chemex&mode=basic');
 for(const e of [{button:1},{button:0,metaKey:true},{button:0,ctrlKey:true},{button:0,shiftKey:true},{button:0,altKey:true},{button:0,defaultPrevented:true}])assert.equal(transitionTarget(e,link('https://example.com/coffee/learn.html'),location),null);
 for(const l of [link(location.href+'#journal'),link('https://apple.com/'),link('mailto:hello@example.com'),link('https://example.com/coffee/export.json'),link('https://example.com/coffee/learn.html',{target:'_blank'}),link('https://example.com/coffee/learn.html',{hasAttribute:()=>true})])assert.equal(transitionTarget(event,l,location),null);
});
const fs=require('node:fs'),vm=require('node:vm');
function browser(reduced=false,native=false){
 const handlers={},classes=new Set(),timers=[];let destination=null;
 const html={classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)}};
 const context={URL,document:{documentElement:html,addEventListener:(type,fn)=>handlers[type]=fn},matchMedia:()=>({matches:reduced}),location:{...location,assign:url=>destination=url},setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout:()=>{},addEventListener:(type,fn)=>handlers[type]=fn};
 if(native)context.CSSViewTransitionRule=function(){};
 vm.runInNewContext(fs.readFileSync(require.resolve('../page-motion.js'),'utf8'),context);
 return {handlers,classes,timers,destination:()=>destination};
}
test('fallback arms navigation, then clears its leaving state on browser back',()=>{
 const b=browser(),l=link('https://example.com/coffee/learn.html#beans');let prevented=false;
 b.handlers.click({button:0,target:{closest:()=>l},preventDefault:()=>prevented=true});
 assert.equal(prevented,true);assert.equal(b.timers.length,1);assert.ok(b.classes.has('coffee-page-leaving'));
 b.timers[0]();assert.equal(b.destination(),l.href);
 b.handlers.pageshow();assert.equal(b.classes.has('coffee-page-leaving'),false);
});
test('native transitions and reduced motion leave browser navigation untouched',()=>{
 for(const b of [browser(true),browser(false,true)]){
  b.handlers.click({button:0,target:{closest:()=>link('https://example.com/coffee/learn.html')},preventDefault:()=>assert.fail('regular navigation must stay native')});
  assert.equal(b.timers.length,0);assert.equal(b.classes.has('coffee-page-leaving'),false);
 }
});
