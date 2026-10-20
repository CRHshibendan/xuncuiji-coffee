const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../home.js'),'utf8');
const {splitSubpaths}=require('../home.js');
const markup=fs.readFileSync(require.resolve('../index.html'),'utf8');
const templates=[...markup.matchAll(/<template data-brewer-template="([^"]+)">\s*(<svg[\s\S]+?<\/svg>)\s*<\/template>/g)];
class Element{
 constructor(tag='div',attributes={}){this.tagName=tag;this.attrs={...attributes};this.dataset={};this.children=[];this.events={};this.hidden=false;this.textContent='';this.style={opacity:'',setProperty(n,v){this[n]=v;}};this.animations=[];this.offsetWidth=240;const names=new Set((attributes.class||'').split(' ').filter(Boolean));this.classList={add:(...v)=>v.forEach(x=>names.add(x)),remove:(...v)=>v.forEach(x=>names.delete(x)),contains:x=>names.has(x),toggle:(x,yes)=>{if(yes??!names.has(x)){names.add(x);return true;}names.delete(x);return false;}};this.names=names;}
 getBoundingClientRect(){return{width:480};}
 getAttribute(n){return n==='class'?[...this.names].join(' '):(this.attrs[n]??null);}
 setAttribute(n,v){this.attrs[n]=String(v);}
 hasAttribute(n){return Object.hasOwn(this.attrs,n);}
 removeAttribute(n){delete this.attrs[n];}
 cloneNode(deep=false){const e=new Element(this.tagName,{...this.attrs,class:[...this.names].join(' ')});e.dataset={...this.dataset};if(deep)e.children=this.children.map(child=>child.cloneNode(true));for(const key of ['animate','getAnimations'])if(Object.hasOwn(this,key))e[key]=this[key];return e;}
 appendChild(e){this.children.push(e);return e;}
 querySelectorAll(s){return this.children.filter(e=>s==='path,ellipse,circle'?['path','ellipse','circle'].includes(e.tagName):s.startsWith('.')&&e.classList.contains(s.slice(1)));}
 querySelector(s){return this.querySelectorAll(s)[0]??null;}
 addEventListener(n,fn){(this.events[n]??=[]).push(fn);}
 click(){for(const fn of this.events.click||[])fn({target:this,button:0});}
 getAnimations(){return this.animations.filter(a=>!a.cancelled);}
 animate(frames,options){const a={frames,options,cancelled:false,cancel(){this.cancelled=true;}};this.animations.push(a);return a;}
}
function svgFixture(svg){
 const art=new Element('svg');art.children=[...svg.matchAll(/<(path|ellipse|circle)\b([^>]*?)\/>/g)].map(([,tag,raw])=>new Element(tag,Object.fromEntries([...raw.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([,name,value])=>[name,value]))));return art;
}
function browser({page='index.html',reduced=false,noWebAnimations=false,throwWebAnimations=false}={}){
 let clock=0,id=0;const timers=new Map(),docEvents={},winEvents={};
 const keys=['chemex','melitta','espresso','siphon','moka','frenchpress','coldbrew'];
 const arts=page==='index.html'?keys.slice(0,4).map(key=>{const a=svgFixture(markup.match(new RegExp('<svg[^>]*data-hero-art="'+key+'"[\\s\\S]*?</svg>'))[0]);a.dataset.heroArt=key;return a;}):[];
 const buttons=(page==='index.html'?keys:[]).map(key=>{const a={dataset:{heroArt:key}};const b=new Element('button',{'aria-pressed':String(a.dataset.heroArt==='melitta')});b.dataset.brewerSelect=a.dataset.heroArt;const mark=new Element('span',{class:'selector-mark'});b.appendChild(mark);return b;});
 const lower=page==='index.html'?['melitta','chemex','espresso','siphon'].map(key=>{const a=svgFixture(markup.match(new RegExp('<svg[^>]*data-brewer-art="'+key+'"[\\s\\S]*?</svg>'))[0]);a.dataset.brewerArt=key;return a;}):[];
 const additions=page==='index.html'?templates.map(([,key,svg])=>{
  const template=new Element('template');template.dataset.brewerTemplate=key;
  const art=svgFixture(svg);
  template.content={firstElementChild:art};return template;
 }):[];
 const heroMount=new Element(),galleryMount=new Element();heroMount.children=arts;galleryMount.children=lower;
 const copy=keys.map(key=>{const e=new Element();e.dataset.brewerCopy=key;return e;});
 const menu=new Element(),nav=new Element(),html=new Element(),caption=new Element();
 const media={matches:reduced,events:{},addEventListener(n,f){(this.events[n]??=[]).push(f);}};
 if(noWebAnimations)for(const art of [...arts,...lower,...additions.map(t=>t.content.firstElementChild)])for(const shape of art.children){shape.getAnimations=undefined;shape.animate=undefined;}
 if(throwWebAnimations)for(const art of [...arts,...lower,...additions.map(t=>t.content.firstElementChild)])for(const shape of art.children)shape.animate=()=>{throw Error('animation unsupported');};
 const motionButton=new Element('button'),motionNote=new Element();
 const single={'[data-hero-rotator]':heroMount,'.brewer-display':galleryMount,'#hero-motion-toggle':motionButton,'#hero-motion-note':motionNote,'.menu-toggle':menu,'#site-navigation':nav,'[data-hero-caption]':caption};
 const lists={'template[data-brewer-template]':additions,'[data-hero-art]':arts,'[data-brewer-select]':buttons,'[data-brewer-art]':lower,'[data-brewer-copy]':copy};
 const document={createElementNS:(_,tag)=>new Element(tag),hidden:false,documentElement:html,querySelector:s=>single[s]??null,querySelectorAll:s=>lists[s]??[],addEventListener:(n,f)=>(docEvents[n]??=[]).push(f)};
 const easing='cubic-bezier(.85, 0, .15, 1)';
 const context={document,URL,location:{href:'https://example.com/'+page,pathname:'/'+page,origin:'https://example.com',search:'',hash:''},matchMedia:()=>media,getComputedStyle:()=>({stroke:'rgb(31,42,38)',getPropertyValue:n=>n==='--hero-ease-both'?easing:'250ms'}),setTimeout:(fn,ms)=>{timers.set(++id,{at:clock+ms,fn,ms});return id;},clearTimeout:n=>timers.delete(n),addEventListener:(n,f)=>(winEvents[n]??=[]).push(f)};
 vm.runInNewContext(source,context);
 function advance(ms){const end=clock+ms;let count=0;while(true){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;assert.ok(++count<200);clock=due[1].at;timers.delete(due[0]);due[1].fn();}clock=end;}
 const fire=(events,n)=>{for(const fn of events[n]||[])fn();};
 return{arts,buttons,lower,copy,caption,html,timers,advance,easing,motionButton,motionNote,active:()=>arts.find(a=>a.classList.contains('is-active'))?.dataset.heroArt,click:key=>buttons.find(b=>b.dataset.brewerSelect===key).click(),reduce(value){media.matches=value;fire(media.events,'change');},hide(value){document.hidden=value;fire(docEvents,'visibilitychange');}};
}
test('shared script initializes pages without a hero and still reaches navigation setup',()=>{
 for(const page of ['journal.html','explore.html']){const b=browser({page});assert.equal(b.timers.size,0);assert.ok(b.html.classList.contains('home-motion-fallback'));}
});
test('hero keeps independent contours, closing stroke before details and fill timing',()=>{
 const b=browser();assert.equal(b.active(),'chemex');for(const a of b.arts){const expected=a.querySelectorAll('.hero-main-static').reduce((sum,p)=>sum+splitSubpaths(p.getAttribute('d')).length,0);assert.equal(a.querySelectorAll('.hero-main-line').length,expected);assert.ok(a.querySelectorAll('.hero-main-line').every(l=>l.getAttribute('pathLength')==='1'&&!l.classList.contains('hero-fill')));}
 b.advance(2199);assert.ok(!b.arts[0].classList.contains('is-details'));b.advance(1);assert.ok(b.arts[0].classList.contains('is-details'));b.advance(79);assert.ok(!b.arts[0].classList.contains('is-filled'));b.advance(1);assert.ok(b.arts[0].classList.contains('is-filled'));
 const fills=b.arts[0].querySelectorAll('.hero-fill');assert.ok(fills.length);assert.ok(fills.every(e=>e.hasAttribute('data-liquid')?e.animations.at(-1).options.duration===1100:e.animations.at(-1).options.easing===b.easing&&e.animations.at(-1).options.duration===600));
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
 b.advance(80);assert.ok(art.classList.contains('is-filled'));
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

test('all seven brewers participate in autoplay, including the return to the first drawing',()=>{
 const b=browser();assert.equal(b.arts.length,7);assert.equal(b.lower.length,7);
 for(const key of ['melitta','espresso','siphon','moka','frenchpress','coldbrew','chemex']){b.advance(6500+1520);assert.equal(b.active(),key);}
});
test('new artwork mounts the same geometry in both exhibitions and uses every original drawing stage',()=>{
 const b=browser();b.advance(3300);
 for(const key of ['moka','frenchpress','coldbrew']){
  b.click(key);b.advance(608);
  const hero=b.arts.find(a=>a.dataset.heroArt===key),gallery=b.lower.find(a=>a.dataset.brewerArt===key);
  assert.deepEqual(hero.children.map(p=>p.getAttribute('d')),gallery.children.map(p=>p.getAttribute('d')));
  assert.equal(b.active(),key);assert.ok(b.caption.textContent.includes(key==='moka'?'MOKA':key==='coldbrew'?'COLD BREW':'FRENCH PRESS'));
  for(const art of [hero,gallery])assert.equal(art.querySelectorAll('.hero-main-line').length,art.querySelectorAll('.hero-main-static').reduce((sum,p)=>sum+splitSubpaths(p.getAttribute('d')).length,0));
  b.advance(2199);for(const art of [hero,gallery])assert.ok(!art.classList.contains('is-details'));
  b.advance(1);for(const art of [hero,gallery])assert.ok(art.classList.contains('is-details'));
  b.advance(79);for(const art of [hero,gallery])assert.ok(!art.classList.contains('is-filled'));
  b.advance(1);for(const art of [hero,gallery]){assert.ok(art.classList.contains('is-filled'));assert.ok(art.querySelectorAll('.hero-fill').every(p=>p.animations.at(-1).options.duration===(p.hasAttribute('data-liquid')?1100:600)));}
  assert.deepEqual(b.lower.filter(a=>a.classList.contains('is-active')).map(a=>a.dataset.brewerArt),[key]);
 }
});
test('rapid switching to new brewers settles on the latest selection and remains usable with reduced motion',()=>{
 const b=browser();b.advance(3300);b.click('moka');b.click('frenchpress');b.click('coldbrew');b.advance(608);
 assert.equal(b.active(),'coldbrew');assert.ok(b.lower.find(a=>a.dataset.brewerArt==='coldbrew').classList.contains('is-active'));
 b.reduce(true);for(const key of ['moka','frenchpress','coldbrew']){b.click(key);assert.equal(b.active(),key);assert.ok(b.arts.every(a=>!a.classList.contains('is-line')));}
});

test('real liquid geometry has a complete ink contour in both exhibitions, including the former masked fills',()=>{
 const b=browser();
 for(const key of ['chemex','melitta','espresso','siphon','frenchpress','coldbrew']){
  for(const [arts,field]of [[b.arts,'heroArt'],[b.lower,'brewerArt']]){
   const art=arts.find(a=>a.dataset[field]===key);
   const liquid=art.querySelectorAll('.hero-caramel').find(p=>p.getAttribute('style')==='--fo:.24'&&p.getAttribute('stroke')==='none');
   assert.ok(liquid,key+' liquid must be geometry rather than a clipped rectangle');
   assert.match(liquid.getAttribute('d'),/Z$/);
   const outline=art.querySelectorAll('.hero-caramel-line').filter(p=>splitSubpaths(liquid.getAttribute('d')).includes(p.getAttribute('d')));
   assert.equal(outline.length,splitSubpaths(liquid.getAttribute('d')).length);assert.equal(outline[0].getAttribute('fill'),'none');assert.equal(outline[0].getAttribute('stroke-width'),'1.5');
  }
 }
});

test('all inner strokes and color contours are independent normalized lines, sharing the outer clock',()=>{
 const b=browser();for(const art of [...b.arts,...b.lower]){
  const originals=art.children.filter(p=>['path','ellipse','circle'].includes(p.tagName)&&!p.classList.contains('hero-ink-line'));
  const expected=originals.reduce((n,p)=>n+(p.tagName==='path'?splitSubpaths(p.getAttribute('d')).length:1),0);
  const ink=art.querySelectorAll('.hero-ink-line');assert.equal(ink.length,expected);
  assert.ok(ink.every(p=>p.getAttribute('pathLength')==='1'&&p.getAttribute('fill')==='none'&&!p.classList.contains('hero-fill')));
  assert.ok(art.querySelectorAll('.hero-detail-line').length>0);
 }
 b.advance(2199);assert.ok(!b.arts[0].classList.contains('is-filled'));b.advance(1);assert.ok(b.arts[0].classList.contains('is-details'));b.advance(79);assert.ok(!b.arts[0].classList.contains('is-filled'));b.advance(1);assert.ok(b.arts[0].classList.contains('is-filled'));
});

 test('only the five coffee liquids rise, while lids and wooden parts keep their original fill animation',()=>{
 const b=browser();for(const key of ['chemex','melitta','siphon','frenchpress','coldbrew']){
 b.click(key);b.advance(608+2280);const art=b.lower.find(a=>a.dataset.brewerArt===key);
 const liquid=art.querySelectorAll('.hero-fill').filter(p=>p.hasAttribute('data-liquid'));assert.equal(liquid.length,1,key);
 const fill=liquid[0];assert.match(fill.getAttribute('clip-path'),/^url\(#brewer-liquid-/);
 const motion=fill.animations.at(-1);assert.equal(motion.options.duration,1100);assert.equal(motion.frames[2].transform,'scaleY(1.06)');assert.equal(motion.frames.at(-1).transform,'scaleY(1)');
 for(const part of art.querySelectorAll('.hero-fill').filter(p=>!p.hasAttribute('data-liquid')))assert.equal(part.animations.at(-1).options.duration,600);
 assert.ok(art.querySelectorAll('.hero-ink-line').every(p=>!p.hasAttribute('data-liquid')&&!p.getAttribute('clip-path')));
 b.advance(1000);
 }
 });
