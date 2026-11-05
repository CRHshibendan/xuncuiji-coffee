const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../site-theme.js'),'utf8');
const {valid,resolve}=require('../site-theme.js');
test('appearance preserves explicit light/dark choices and safely resolves system defaults',()=>{
 for(const choice of ['light','dark'])for(const system of [true,false])assert.equal(resolve(choice,system),choice);
 assert.equal(resolve('system',true),'dark');assert.equal(resolve('system',false),'light');assert.equal(valid('broken'),'system');assert.equal(valid(null),'system');
});
function fixture(saved,throws=false){
 const events={},mediaEvents={},root={dataset:{},style:{}},meta={setAttribute(k,v){this[k]=v;}};
 const media={matches:false,addEventListener:(n,f)=>mediaEvents[n]=f};
 const doc={documentElement:root,readyState:'loading',addEventListener(){},querySelector:()=>meta,querySelectorAll:()=>[]};
 const host={document:doc,location:{pathname:'/learn.html'},matchMedia:()=>media,localStorage:{getItem(){if(throws)throw Error('blocked');return saved;},setItem(k,v){saved=v;}},CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}},dispatchEvent(){},addEventListener:(n,f)=>events[n]=f};
 vm.runInNewContext(source,{window:host});return {host,root,events,mediaEvents,meta,media};
}
test('saved theme applies synchronously before DOM ready to prevent a light flash',()=>{const f=fixture('dark');assert.equal(f.root.dataset.theme,'dark');assert.equal(f.root.dataset.themePage,'learn');assert.equal(f.root.style.colorScheme,'light dark');assert.equal(f.meta.content,'#161d19');});
test('blocked storage does not prevent page initialization',()=>{const f=fixture(null,true);assert.equal(f.root.dataset.theme,'light');});
test('changes from another page and cleared settings synchronize without reload',()=>{const f=fixture('dark');f.host.localStorage.setItem('xuncuiji-color-theme','light');f.events.storage({key:'xuncuiji-color-theme',newValue:'light'});assert.equal(f.root.dataset.theme,'light');f.host.matchMedia=()=>({matches:true});f.host.localStorage.setItem('xuncuiji-color-theme',null);f.events.storage({key:'xuncuiji-color-theme',newValue:null});assert.equal(f.root.dataset.theme,'light');});
test('every published page loads appearance before other scripts and shares the theme sheets',()=>{
 const root=path.join(__dirname,'..');const files=fs.readdirSync(root).filter(f=>f.endsWith('.html')).map(f=>f).concat(fs.readdirSync(path.join(root,'experiments')).filter(f=>f.endsWith('.html')).map(f=>'experiments/'+f));
 assert.equal(files.length,10);
 for(const file of files){const html=fs.readFileSync(path.join(root,file),'utf8');assert.match(html,/<script src="(?:\.\.\/)?site-theme.js\?v=20261106-theme4"><\/script>/);assert.match(html,/<meta name="color-scheme" content="light dark">/);assert.ok(html.indexOf('name="color-scheme"')<html.indexOf('<script'),file+' declares native theme support before JS');assert.match(html,/site-theme-legacy.css/);assert.match(html,/site-theme.css/);assert.equal(html.match(/<script[^>]*src="([^\"]+)/)[1].includes('site-theme.js'),true,file);}
});

test('system appearance follows OS changes without overriding an explicit user choice',()=>{const f=fixture('system');f.media.matches=true;f.mediaEvents.change();assert.equal(f.root.dataset.theme,'dark');f.host.localStorage.setItem('xuncuiji-color-theme','light');f.events.storage({key:'xuncuiji-color-theme',newValue:'light'});f.mediaEvents.change();assert.equal(f.root.dataset.theme,'light');});

test('returning from Safari page cache restores the persisted appearance and selection',()=>{const f=fixture('dark');f.host.localStorage.setItem('xuncuiji-color-theme','light');f.root.dataset.themePreference='dark';f.events.pageshow({persisted:true});assert.equal(f.root.dataset.theme,'light');assert.equal(f.root.dataset.themePreference,'light');assert.equal(f.root.style.colorScheme,'light dark');});
test('a delayed storage event cannot overwrite a more recent explicit choice',()=>{const f=fixture('dark');f.host.localStorage.setItem('xuncuiji-color-theme','light');f.events.storage({key:'xuncuiji-color-theme',newValue:'dark'});assert.equal(f.root.dataset.theme,'light');});
