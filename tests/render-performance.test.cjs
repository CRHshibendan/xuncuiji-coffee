const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dist=path.resolve(__dirname,'..'),Paint=require(path.join(dist,'render-updates.js'));
test('live counters preserve existing children until the displayed value changes',()=>{
 let value='15 <small>g</small>',child={},writes=0;
 const el={get innerHTML(){return value},set innerHTML(v){value=v;child={};writes++}};
 const initial=child;
 for(let i=0;i<120;i++)Paint.html(el,'15 <small>g</small>');
 assert.equal(child,initial);assert.equal(writes,0);
 Paint.html(el,'20 <small>g</small>');assert.notEqual(child,initial);assert.equal(writes,1);
});
test('equipment idle rendering is skipped while inventory changes and timed pours still render',()=>{
 const source=fs.readFileSync(path.join(dist,'equipment-studio.js'),'utf8');
 const art=source.slice(source.indexOf(' function art()'),source.indexOf(' function beans('));
 const nodes=new Map(),node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',classList:{remove(){},toggle(){},add(){}},querySelector(){return node(key+' label')}});return nodes.get(key)};
 const ctx={s:{grounds:0,beans:0},u:{scale:0},p:{spoon:5},id:'frenchpress',selected:null,drag:null,lastArtState:'',lastMarkup:'',lastGrounds:'',clock:0,renders:0,stocks:[],CoffeePaint:Paint,EquipmentArt:{render(){ctx.renders++;return '<g/>'},grounds(n){ctx.stocks.push(n);return String(n)}},performance:{now:()=>ctx.clock},$:(id)=>node(id),$$:()=>[],object:(id)=>node(id),patch:(el,html)=>el.innerHTML=html,beans:()=>'',clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),drawCrank(){}};
 vm.createContext(ctx);vm.runInContext(art,ctx);
 ctx.art();for(let i=0;i<120;i++){ctx.s.contact=i/10;ctx.s.events=['history '+i];ctx.u.angle=i;ctx.u.display=i;ctx.art();}assert.equal(ctx.renders,1);
 ctx.s.grounds=15;ctx.art();assert.equal(ctx.renders,2);
 ctx.s.grounds=0;ctx.u.visualGrounds=15;
 ctx.clock=100;ctx.art();const first=ctx.stocks.at(-1);
 ctx.clock=400;ctx.u.visualGrounds=7.5;ctx.art();assert.ok(ctx.stocks.at(-1)<first);
 ctx.clock=800;ctx.u.visualGrounds=0;ctx.art();assert.equal(ctx.stocks.at(-1),0);
 const final=ctx.renders;ctx.art();assert.equal(ctx.renders,final);
});
test('the homepage keeps art compact and fonts self-hosted without external requests',()=>{
 const css=fs.readFileSync(path.join(dist,'design-tokens.css'),'utf8'),html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
 assert.doesNotMatch(css+html,/https?:\/\/[^\s"']*(?:fonts|googleapis)/);
 assert.doesNotMatch(html,/hero-coffee|\.png|linearGradient|radialGradient/);
 const assets=[...html.matchAll(/src="(assets\/[^"?]+)"/g)].map(m=>m[1]);
 // Inline SVGs replace image requests; keep their markup within a small page budget.
 assert.ok(Buffer.byteLength(html)<40000);
 for(const asset of assets)assert.ok(fs.statSync(path.join(dist,asset)).size<10000);
 const fonts=[...css.matchAll(/url\('([^']+\.woff2)'\)/g)].map(m=>m[1]);
 assert.equal(fonts.length,2);
 assert.ok(fonts.reduce((sum,f)=>sum+fs.statSync(path.join(dist,f)).size,0)<200000);
});
test('serialized SVG markup does not recreate stable children and external edits are repaired',()=>{
 let value='',writes=0;
 const el={get innerHTML(){return value},set innerHTML(v){writes++;value=v.replace('<g/>','<g></g>')}};
 Paint.html(el,'<g/>');for(let i=0;i<30;i++)Paint.html(el,'<g/>');assert.equal(writes,1);
 value='<path></path>';Paint.html(el,'<g/>');assert.equal(writes,2);assert.equal(value,'<g></g>');
});
