const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const I=require('../workshop-ink.js'),H=require('../home.js'),P=require('../pour-bed.js');
test('tilted powder-bed projection round trips screen and bed coordinates including wide letterboxing',()=>{
 for(const quad of [[{x:300,y:20},{x:700,y:20},{x:700,y:420},{x:300,y:420}],[{x:90,y:70},{x:470,y:70},{x:520,y:410},{x:40,y:410}]]){
  const p=I.projection(quad);for(const [x,y]of [[0,0],[1,0],[1,1],[0,1],[.5,.5],[.13,.87],[1.1,-.1]]){const screen=p.toScreen(x,y),back=p.fromScreen(screen.x,screen.y);assert.ok(Math.abs(back.x-x)<1e-9);assert.ok(Math.abs(back.y-y)<1e-9);}
  quad.forEach((q,i)=>{const pt=p.toScreen([0,1,1,0][i],[0,0,1,1][i]);assert.ok(Math.hypot(pt.x-q.x,pt.y-q.y)<1e-9);});
 }
});
test('return drawing splits compound pen strokes exactly like the homepage',()=>{
 for(const path of ['M0 0h20m-5 4v8M1 2q5 6 7 8Z','m20 30 10 0z m5 2a4 3 0 1 0 8 6','M0 0C1 2 3 4 5 6M10 20V40'])assert.deepEqual(I.splitSubpaths(path),H.splitSubpaths(path));
});
test('a real first frame of water is visible without inventing wetness before water enters',()=>{
 const map=P.create();assert.equal(P.wetOpacity(0),0);P.deposit(map,P.sample(0,0),15/60);
 assert.ok(Math.max(...map.map(P.wetOpacity))>.05);assert.ok(Math.abs(map.reduce((a,b)=>a+b,0)-.25)<1e-9);assert.ok(P.wetOpacity(100)<=.25);
});
test('locked espresso basket hides the powder opening while the loose basket still shows its contents',()=>{
 const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../equipment-art.js'),'utf8')+';this.art=EquipmentArt',ctx);
 const s={dose:18,output:0,served:0,tamped:true,locked:false},u={};
 const loose=ctx.art.render('espresso',s,u).split('id="portafilter-object"')[1].split('id="tamper-object"')[0];
 const locked=ctx.art.render('espresso',{...s,locked:true},u).split('id="portafilter-object"')[1].split('id="tamper-object"')[0];
 assert.match(loose,/fill="#6a482b"/);assert.doesNotMatch(locked,/fill="#6a482b"|rx="40" ry="12"|fill="#b28952"/);assert.match(locked,/id="portafilter-grip"/);assert.match(locked,/M-30-8v5/);
});
test('installed pour-over paper is clipped to the opening for both vessels rather than drawn down the outer wall',()=>{
 const source=fs.readFileSync(require.resolve('../workshop.js'),'utf8'),fn=source.slice(source.indexOf('function renderVessel()'),source.indexOf('function wetArt()'));
 const ctx={state:{model:{dose:15,liquid:0,bed:0},filterPlaced:true,removed:false,served:false},brewer:'melitta',clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),basic:()=>false,SVGTools:{server:()=>'',melittaDripper:()=>'',chemexDripper:()=>''},body:x=>x,namespace:x=>x,patchVessel:x=>ctx.markup=x,applyInteractive(){},wetArt:()=>'',drag:null};vm.createContext(ctx);vm.runInContext(fn,ctx);
 for(const brewer of ['melitta','chemex']){ctx.brewer=brewer;ctx.renderVessel();const paper=ctx.markup.split('id="paper-object"')[1];assert.match(paper,/<clipPath id="studio-paper-opening">/);assert.match(paper,/class="paper-front-rim"/);assert.doesNotMatch(paper,/l-51 100|l-67 89/);assert.match(paper,new RegExp('cy="'+(brewer==='chemex'?226:238)+'"'));}
});
test('simplified return ink keeps dark structural contours and drops highlights and fine engraving',()=>{
 assert.equal(I.simpleOutline('rgb(73, 63, 54)','4.5px'),true);
 assert.equal(I.simpleOutline('rgb(255, 255, 255)','10px'),false);
 assert.equal(I.simpleOutline('rgb(169, 156, 140)','2.5px'),false);
 assert.equal(I.simpleOutline('none','4.5px'),false);
});

test('only a deliberate powder-bed return creates one composed drawing, while reset and reduced motion skip it',()=>{
 const source=fs.readFileSync(require.resolve('../pour-bed.js'),'utf8'),fn=source.slice(source.indexOf('  function close('),source.indexOf('  function paint('));
 for(const [immediate,reduced]of [[false,false],[true,false],[false,true]]){
  const events=[],classes={add(){},remove(){}},panel={hidden:false,classList:classes,contains:()=>false},scene={focus(){}};
  const ctx={active:true,exiting:false,panel,scene,wrap:{append(){} ,classList:classes},stop:()=>events.push('stop'),pause(){},cancelMotion(){},returnDrawing:null,document:{documentElement:{classList:classes},body:{classList:classes}},onReturn:()=>events.push('home'),matchMedia:()=>({matches:reduced}),returnArt:()=>({}),CoffeeWorkshopInk:{drawReturn(){events.push('draw');return{duration:2680,cancel:()=>events.push('remove')};}},setTimeout:fn=>{ctx.hide=fn;return 1;},closing:null};
  vm.createContext(ctx);vm.runInContext(fn,ctx);ctx.close(immediate);
  assert.equal(events.includes('draw'),!immediate&&!reduced);assert.equal(events.includes('home'),!immediate);
  if(!immediate&&!reduced){assert.ok(events.indexOf('home')<events.indexOf('draw'));ctx.close(false);assert.equal(events.filter(e=>e==='draw').length,1);ctx.hide();}
  assert.equal(panel.hidden,true);
 }
});

test('loading the drawing library does not subscribe to page, camera or tool events and does not schedule a reveal',()=>{
 const ctx={document:{addEventListener(){throw new Error('Only an explicit return may draw');}},setTimeout(){throw new Error('No automatic reveal timer');}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../workshop-ink.js'),'utf8'),ctx);assert.equal(typeof ctx.CoffeeWorkshopInk.drawReturn,'function');
});
