const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {positionsFor,currentIndex}=require('../site-dock.js');
test('notch centers leave at least twelve pixels at both edges at phone widths',()=>{
 for(const width of [320,360,375,415,430,768]){
  const centers=positionsFor(width);assert.equal(centers.length,5);assert.ok(centers[0]-40>=12);assert.ok(width-centers[4]-40>=12);assert.equal(centers[2],width/2);
  for(let i=1;i<5;i++)assert.equal(centers[i]-centers[i-1],(width-120)/4);
 }
});
test('all public destinations resolve to the intended current item',()=>{
 const expected={'index.html':0,'learn.html':1,'explore.html':1,'workshop.html':2,'method-lab.html':2,'shop.html':3,'journal.html':4,'':0};
 for(const [page,index]of Object.entries(expected))assert.equal(currentIndex('/xuncuiji-coffee/'+page),index,page);
});
test('each page ships one accessible real-link dock and correct no-JS current state',()=>{
 for(const page of ['index','learn','explore','workshop','method-lab','shop','journal']){
  const html=fs.readFileSync(path.join(__dirname,'..',page+'.html'),'utf8');
  const docks=html.match(/<nav class="site-dock"[\s\S]*?<\/nav>/g)||[];assert.equal(docks.length,1,page);
  const links=[...docks[0].matchAll(/<a class="dock-link"([^>]+)>/g)];assert.equal(links.length,5,page);
  const selected=links.map((l,i)=>l[1].includes('aria-current="page"')?i:-1).filter(i=>i>=0);assert.deepEqual(selected,[currentIndex(page+'.html')],page);
  assert.match(docks[0],new RegExp('--dock-index:'+selected[0]));assert.ok(links.every(l=>l[1].includes('href=')),page);
  assert.doesNotMatch(html,/class="mobile-nav/);assert.match(html,/site-dock\.js/);
 }
});
const {freshDestination,release}=require('../site-dock.js');
test('navigation pins the release without losing the chosen brewer, mode or section',()=>{
 const base='https://example.com/xuncuiji-coffee/index.html?v=old';
 const target=new URL(freshDestination('workshop.html?tool=chemex&mode=gesture#scene',base),base);
 assert.equal(target.searchParams.get('tool'),'chemex');assert.equal(target.searchParams.get('mode'),'gesture');assert.equal(target.hash,'#scene');assert.equal(target.searchParams.get('v'),release);
 assert.equal(new URL(freshDestination('learn.html?v=old',base),base).searchParams.get('v'),release);
});
test('release pinning leaves in-page navigation and unrelated destinations alone',()=>{
 const base='https://example.com/xuncuiji-coffee/index.html';
 for(const href of ['#brewer-gallery','mailto:hello@example.com','https://elsewhere.test/learn.html','/other-project/index.html','assets/fonts/noto-sans-sc-400.woff2'])assert.equal(freshDestination(href,base),href);
});
