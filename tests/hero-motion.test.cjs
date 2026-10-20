const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../home.js'),'utf8');
class Element{
 constructor(tag='div',attributes={}){this.tagName=tag;this.attrs={...attributes};this.dataset={};this.children=[];this.events={};this.hidden=false;this.textContent='';this.style={opacity:'',setProperty(n,v){this[n]=v;}};this.animations=[];this.offsetWidth=240;const names=new Set((attributes.class||'').split(' ').filter(Boolean));this.classList={add:(...v)=>v.forEach(x=>names.add(x)),remove:(...v)=>v.forEach(x=>names.delete(x)),contains:x=>names.has(x),toggle:(x,yes)=>{if(yes??!names.has(x)){names.add(x);return true;}names.delete(x);return false;}};this.names=names;}
 getBoundingClientRect(){return{width:480};}
 getAttribute(n){return n==='class'?[...this.names].join(' '):(this.attrs[n]??null);}
 setAttribute(n,v){this.attrs[n]=String(v);}
 cloneNode(){return new Element(this.tagName,{...this.attrs,class:[...this.names].join(' ')});}
 appendChild(e){this.children.push(e);return e;}
 querySelectorAll(s){return this.children.filter(e=>s==='path,ellipse,circle'?['path','ellipse','circle'].includes(e.tagName):s.startsWith('.')&&e.classList.contains(s.slice(1)));}
 querySelector(s){return this.querySelectorAll(s)[0]??null;}
 addEventListener(n,fn){(this.events[n]??=[]).push(fn);}
 click(){for(const fn of this.events.click||[])fn({target:this,button:0});}
 getAnimations(){return this.animations.filter(a=>!a.cancelled);}
 animate(frames,options){const a={frames,options,cancelled:false,cancel(){this.cancelled=true;}};this.animations.push(a);return a;}
}
function browser({page='index.html',reduced=false,noWebAnimations=false,throwWebAnimations=false}={}){
 let clock=0,id=0;const timers=new Map(),docEvents={},winEvents={};
 const keys=['chemex','melitta','espresso','siphon'];
 const arts=page==='index.html'?keys.map(key=>{const a=new Element('svg');a.dataset.heroArt=key;
  a.children=[new Element('path',{fill:'#f6f3ec',d:'M0 0h10v10Z'}),new Element('path',{d:'M0 0h4'}),new Element('path',{fill:'#b8794a',d:'M1 1h2v2Z'})];
  if(key==='melitta'||key==='siphon')a.children.push(new Element('path',{fill:'#f6f3ec',d:'M20 0h10v10Z'}));
  return a;
 }):[];
 const buttons=arts.map(a=>{const b=new Element('button',{'aria-pressed':String(a.dataset.heroArt==='melitta')});b.dataset.brewerSelect=a.dataset.heroArt;const mark=new Element('span',{class:'selector-mark'});b.appendChild(mark);return b;});
 const lower=page==='index.html'?['melitta','chemex','espresso','siphon'].map(key=>{const e=new Element('svg');e.dataset.brewerArt=key;e.children=[new Element('path',{fill:'#f6f3ec',d:'M0 0h10v10Z'}),new Element('path',{d:'M0 0h4'}),new Element('path',{fill:'#b8794a',d:'M1 1h2v2Z'})];return e;}):[];
 const copy=keys.map(key=>{const e=new Element();e.dataset.brewerCopy=key;return e;});
 const menu=new Element(),nav=new Element(),html=new Element(),caption=new Element();
 const media={matches:reduced,events:{},addEventListener(n,f){(this.events[n]??=[]).push(f);}};
 if(noWebAnimations)for(const art of [...arts,...lower])for(const shape of art.children){shape.getAnimations=undefined;shape.animate=undefined;}
 if(throwWebAnimations)for(const art of [...arts,...lower])for(const shape of art.children)shape.animate=()=>{throw Error('animation unsupported');};
 const motionButton=new Element('button'),motionNote=new Element();
 const single={'#hero-motion-toggle':motionButton,'#hero-motion-note':motionNote,'.menu-toggle':menu,'#site-navigation':nav,'[data-hero-caption]':caption};
 const lists={'[data-hero-art]':arts,'[data-brewer-select]':buttons,'[data-brewer-art]':lower,'[data-brewer-copy]':copy};
 const document={hidden:false,documentElement:html,querySelector:s=>single[s]??null,querySelectorAll:s=>lists[s]??[],addEventListener:(n,f)=>(docEvents[n]??=[]).push(f)};
 const easing='cubic-bezier(.85, 0, .15, 1)';
 const context={document,URL,location:{href:'https://example.com/'+page,pathname:'/'+page,origin:'https://example.com',search:'',hash:''},matchMedia:()=>media,getComputedStyle:()=>({stroke:'rgb(31,42,38)',getPropertyValue:n=>n==='--hero-ease-both'?easing:'250ms'}),setTimeout:(fn,ms)=>{timers.set(++id,{at:clock+ms,fn,ms});return id;},clearTimeout:n=>timers.delete(n),addEventListener:(n,f)=>(winEvents[n]??=[]).push(f)};
 vm.runInNewContext(source,context);
 function advance(ms){const end=clock+ms;let count=0;while(true){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;assert.ok(++count<200);clock=due[1].at;timers.delete(due[0]);due[1].fn();}clock=end;}
 const fire=(events,n)=>{for(const fn of events[n]||[])fn();};
 return{arts,buttons,lower,copy,html,timers,advance,easing,motionButton,motionNote,active:()=>arts.find(a=>a.classList.contains('is-active'))?.dataset.heroArt,click:key=>buttons.find(b=>b.dataset.brewerSelect===key).click(),reduce(value){media.matches=value;fire(media.events,'change');},hide(value){document.hidden=value;fire(docEvents,'visibilitychange');}};
}
test('shared script initializes pages without a hero and still reaches navigation setup',()=>{
 for(const page of ['journal.html','explore.html']){const b=browser({page});assert.equal(b.timers.size,0);assert.ok(b.html.classList.contains('home-motion-fallback'));}
});
test('hero keeps independent contours, closing stroke before details and fill timing',()=>{
 const b=browser();assert.equal(b.active(),'chemex');for(const a of b.arts){const expected=['melitta','siphon'].includes(a.dataset.heroArt)?2:1;assert.equal(a.querySelectorAll('.hero-main-line').length,expected);assert.ok(a.querySelectorAll('.hero-main-line').every(l=>l.getAttribute('pathLength')==='1'&&!l.classList.contains('hero-fill')));}
 b.advance(2199);assert.ok(!b.arts[0].classList.contains('is-details'));b.advance(1);assert.ok(b.arts[0].classList.contains('is-details'));b.advance(699);assert.ok(!b.arts[0].classList.contains('is-filled'));b.advance(1);assert.ok(b.arts[0].classList.contains('is-filled'));
 const fills=b.arts[0].querySelectorAll('.hero-fill');assert.ok(fills.length);assert.ok(fills.every(e=>e.animations.at(-1).options.easing===b.easing&&e.animations.at(-1).options.duration===600));
});
test('clicking the current hero replays it and autoplay continues afterwards',()=>{
 const b=browser();b.advance(3300);b.click('chemex');b.advance(608);assert.equal(b.active(),'chemex');b.advance(6500+1520);assert.equal(b.active(),'melitta');
});
test('rapid selection keeps the latest requested hero instead of dropping it',()=>{
 const b=browser();b.advance(3300);b.click('melitta');b.click('espresso');b.click('siphon');b.advance(608);assert.equal(b.active(),'siphon');assert.equal(b.buttons.find(e=>e.getAttribute('aria-pressed')==='true').dataset.brewerSelect,'siphon');assert.deepEqual(b.lower.filter(e=>e.classList.contains('is-active')).map(e=>e.dataset.brewerArt),['siphon']);
});
test('reduced motion cancels pending stages and shows static art without new animations',()=>{
 const b=browser();b.advance(400);b.reduce(true);const before=b.arts.flatMap(a=>a.children).reduce((n,e)=>n+e.animations.length,0);b.advance(10000);assert.equal(b.arts.flatMap(a=>a.children).reduce((n,e)=>n+e.animations.length,0),before);assert.equal(b.active(),'chemex');b.click('siphon');assert.equal(b.active(),'siphon');assert.ok(b.arts.every(a=>!a.classList.contains('is-line')));
});
test('hidden page does not restart autoplay when an in-flight switch finishes',()=>{
 const b=browser();b.advance(3300);b.click('melitta');b.hide(true);b.advance(10000);assert.equal(b.active(),'melitta');assert.ok(![...b.timers.values()].some(t=>t.ms===6500));b.hide(false);b.advance(6500+1520);assert.equal(b.active(),'espresso');
});

test('gallery shares the drawing stages but keeps its selection when the hero autoplays',()=>{
 const b=browser();b.advance(3300);b.click('espresso');
 assert.ok(b.lower[0].classList.contains('is-active'));
 b.advance(608);const art=b.lower.find(e=>e.dataset.brewerArt==='espresso');
 assert.ok(art.classList.contains('is-line'));assert.ok(!art.classList.contains('is-details'));
 b.advance(2200);assert.ok(art.classList.contains('is-details'));assert.ok(!art.classList.contains('is-filled'));
 b.advance(700);assert.ok(art.classList.contains('is-filled'));
 b.advance(10000);assert.ok(art.classList.contains('is-active'));assert.equal(b.active(),'siphon');
});
test('gallery replays the current selection and cancels unfinished stages for reduced motion',()=>{
 const b=browser();b.advance(3300);b.click('melitta');b.advance(608);
 assert.ok(b.lower[0].classList.contains('is-line'));assert.ok(!b.lower[0].classList.contains('is-details'));
 b.advance(400);b.reduce(true);b.advance(5000);
 assert.ok(b.lower.every(a=>!a.classList.contains('is-line')&&!a.classList.contains('is-details')));
 b.click('siphon');assert.equal(b.lower.find(a=>a.classList.contains('is-active')).dataset.brewerArt,'siphon');
});

test('manual exits finish earlier without changing automatic exit or subsequent drawing timing',()=>{
 const manual=browser();manual.advance(3300);manual.click('espresso');
 for(const art of [manual.arts[0],manual.lower[0]]){
  assert.ok(art.classList.contains('is-click-exit'));
  assert.equal(art.querySelectorAll('.hero-fill')[0].animations.at(-1).options.duration,200);
 }
 manual.advance(607);assert.equal(manual.active(),'chemex');manual.advance(1);assert.equal(manual.active(),'espresso');
 assert.ok(manual.arts.every(a=>!a.classList.contains('is-click-exit')));
 manual.advance(2199);assert.ok(!manual.arts[2].classList.contains('is-details'));
 manual.advance(1);assert.ok(manual.arts[2].classList.contains('is-details'));
 const auto=browser();auto.advance(6500);
 assert.ok(!auto.arts[0].classList.contains('is-click-exit'));
 assert.equal(auto.arts[0].querySelectorAll('.hero-fill')[0].animations.at(-1).options.duration,500);
 auto.advance(519);assert.ok(!auto.arts[0].classList.contains('is-leaving'));
 auto.advance(1);assert.ok(auto.arts[0].classList.contains('is-leaving'));
 auto.advance(999);assert.equal(auto.active(),'chemex');auto.advance(1);assert.equal(auto.active(),'melitta');
});

test('a Windows-style reduced-motion preference still permits explicit artwork playback and pause',()=>{
 const b=browser({reduced:true});assert.ok(!b.arts[0].classList.contains('is-line'));assert.equal(b.motionButton.textContent,'播放器具动画');
 b.motionButton.click();assert.equal(b.html.dataset.artMotion,'on');assert.ok(b.arts[0].classList.contains('is-line'));b.advance(2900);assert.ok(b.arts[0].classList.contains('is-filled'));
 b.motionButton.click();assert.equal(b.html.dataset.artMotion,'off');assert.ok(!b.arts[0].classList.contains('is-line'));assert.ok(![...b.timers.values()].some(t=>t.ms===6500));
});
test('missing or failing Web Animations does not break the line drawing or later selection',()=>{
 for(const options of [{noWebAnimations:true},{throwWebAnimations:true}]){const b=browser(options);b.advance(3300);assert.ok(b.arts[0].classList.contains('is-filled'));b.click('espresso');b.advance(608+2900);assert.equal(b.active(),'espresso');assert.ok(b.arts[2].classList.contains('is-filled'));}
});
