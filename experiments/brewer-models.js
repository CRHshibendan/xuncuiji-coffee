import * as T from './vendor/three.module.min.js';
import {createStudy} from './brewer-kit.js';
import {createChemex} from './chemex-model.js';
export {phase,ease,FORMATION_DURATION} from './chemex-model.js';

export const BREWERS=[
 {id:'chemex',name:'Chemex',en:'CHEMEX',description:'玻璃滤壶 · 原木护套 · 纸滤',open:'提起滤纸',close:'放回滤纸',detail:'纸滤贴在上方，咖啡落入下壶。',finish:'玻璃透光，木纹落在腰间。',zoom:1.22,liftZoom:.25,create:createChemex},
 {id:'melitta',name:'Melitta',en:'MELITTA',description:'陶瓷滤杯 · 肋骨内壁 · 分享壶',open:'提起滤纸',close:'放回滤纸',detail:'滤纸与粉床一起提起，露出陶瓷滤杯的内壁。',finish:'陶瓷温润，咖啡落入分享壶。',zoom:1.15,liftZoom:.22,create:createMelitta},
 {id:'frenchpress',name:'法压壶',en:'FRENCH PRESS',description:'硼硅玻璃 · 金属滤网 · 木质压钮',open:'提起压杆',close:'放回压杆',detail:'壶盖、压杆和滤网一起抬起，滤网仍与压杆相连。',finish:'金属收住玻璃，咖啡在壶中慢慢升起。',zoom:1.1,liftZoom:.45,create:createFrenchPress},
 {id:'moka',name:'摩卡壶',en:'MOKA POT',description:'八角铝壶 · 安全阀 · 集液上壶',open:'提起壶盖',close:'放回壶盖',detail:'打开上壶，能看到中央导流柱和集液空间。',finish:'八角切面接住光，壶盖保留金属质感。',zoom:1.1,liftZoom:.17,create:createMoka},
 {id:'coldbrew',name:'浸泡冷萃',en:'COLD BREW',description:'玻璃冷萃壶 · 细密滤篮 · 原木盖',open:'提起滤篮',close:'放回滤篮',detail:'壶盖带着滤篮提起，咖啡液留在玻璃壶里。',finish:'玻璃渐渐透光，滤篮浸入浅棕咖啡。',zoom:1.13,liftZoom:.29,create:createColdBrew},
 {id:'siphon',name:'虹吸壶',en:'SIPHON',description:'上下玻璃壶 · 金属支架 · 布滤器',open:'提起上壶',close:'装回上壶',detail:'上壶与导管一同抬起，露出下壶瓶口和布滤器。',finish:'双壶立起，玻璃和金属各自接住光。',zoom:1.07,liftZoom:.23,create:createSiphon},
 {id:'espresso',name:'意式浓缩',en:'ESPRESSO',description:'复古金属机身 · 冲煮手柄 · 浓缩杯',open:'取下手柄',close:'装回手柄',detail:'手柄从冲煮头移开，向上转动视角可观察粉碗。',finish:'金属机身显出光泽，小杯中的咖啡缓缓升起。',zoom:1.04,liftZoom:.09,create:createEspresso}
];
export const getBrewer=id=>BREWERS.find(b=>b.id===id)||BREWERS[1];

function createMelitta(){
 const b=createStudy(),ceramic=b.mat('ceramic'),glass=b.mat('glass'),paper=b.mat('paper'),grounds=b.mat('grounds');
 // Independent ceramic funnel and glass server, rather than a Chemex silhouette.
 b.lathe([[.04,.07],[.55,.07],[.76,.15],[.80,.35],[.70,.63],[.53,.90],[.45,1.18],[.46,1.47],[.54,1.52]],glass,{wall:.035});
 b.tube([[.49,1.28,0],[.96,1.27,0],[1.05,.96,0],[.85,.70,0],[.64,.72,0]],.055,glass);
 b.ring(.65,.1,{ellipse:.05});
 b.lathe([[.04,1.54],[.68,1.54],[.70,1.6],[.43,1.63],[.38,1.73]],ceramic,{smooth:false});
 const profile=[[.18,1.68],[.35,1.73],[.46,1.85],[.74,2.43],[1.03,3.06]],body=b.lathe(profile,ceramic,{wall:.045});
 const p=body.geometry.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),f=1+.013*Math.cos(a*20)*Math.min(1,Math.max(0,(y-1.8)/.4));p.setXYZ(i,x*f,y,z*f);}p.needsUpdate=true;body.geometry.computeVertexNormals();
 b.tube([[.87,2.83,0],[1.34,2.82,0],[1.39,2.56,0],[1.15,2.22,0],[.52,2.02,0]],.075,ceramic);
 const ribMat=b.mat('ceramic','#dcd9c9');
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,points=[[.23,1.8],[.49,2.15],[.77,2.65],[.97,3.01]].map(([r,y])=>[Math.cos(a)*r,y,Math.sin(a)*r]);b.tube(points,.014,ribMat,{outline:false});}
 for(const x of [-.65,-.32,.32,.65])b.line([[x,2.88,.35],[x*.75,2.5,.25],[x*.4,2.04,.14]]);
 const filter=b.part({dy:.81});b.lathe([[.03,1.85],[.27,2.11],[.63,2.61],[.96,3.11]],paper,{...filter,wall:.007});
 b.disc(.53,2.53,grounds,filter);
 b.liquid([[.5,.12],[.68,.17],[.745,.31],[.70,.55],[.60,.77]],{surface:'#a38159'});
 return b;
}

function createFrenchPress(){
 const b=createStudy(),glass=b.mat('glass'),metal=b.mat('metal'),dark=b.mat('dark'),wood=b.mat('wood');
 b.lathe([[.02,.10],[.67,.10],[.76,.15],[.78,.26],[.78,2.66],[.83,2.72]],glass,{wall:.035});
 b.lathe([[.73,.10],[.83,.10],[.84,.22],[.79,.29]],metal,{smooth:false});
 b.lathe([[.78,2.55],[.82,2.55],[.82,2.65],[.78,2.65]],metal,{smooth:false});
 for(const a of [-.7,.7,Math.PI]){const x=Math.sin(a)*.81,z=Math.cos(a)*.81;b.box(.045,2.37,.045,[x,1.4,z],metal,{outline:a!==Math.PI,radius:.01});}
 b.tube([[.79,2.40,0],[1.18,2.36,0],[1.28,2.08,0],[1.28,1.21,0],[1.12,.94,0],[.79,.94,0]],.095,dark);
 b.tube([[-.76,2.6,0],[-1.01,2.75,0],[-.83,2.38,0]],.025,glass);
 const plunger=b.part({dy:2.12});
 b.lathe([[.02,2.66],[.73,2.66],[.84,2.70],[.77,2.79],[.02,2.85]],metal,plunger);
 b.tube([[0,.62,0],[0,3.13,0]],.025,metal,plunger);
 b.orb(.135,[0,3.18,0],wood,{...plunger,scale:[1.23,.7,1.23]});
 b.lathe([[.01,.56],[.72,.56],[.73,.62],[.01,.62]],metal,{...plunger,smooth:false});
 b.disc(.70,.63,dark,plunger);
 // Sparse screen wires remain a material detail, not dozens of simultaneous pen strokes.
 for(let i=-5;i<=5;i++){const x=i*.115,z=Math.sqrt(.69**2-x*x);b.tube([[x,.635,-z],[x,.635,z]],.004,metal,{...plunger,outline:false});b.tube([[-z,.635,x],[z,.635,x]],.004,metal,{...plunger,outline:false});}
 b.liquid([[.67,.15],[.735,.20],[.74,1.93]]);
 return b;
}

function createMoka(){
 const b=createStudy(),metal=b.mat('metal','#b7bfb7'),dark=b.mat('dark'),brass=b.mat('brass');metal.flatShading=true;
 const lower=[[.02,.08],[.68,.08],[.87,.23],[.73,1.42]];
 b.lathe(lower,metal,{segments:8,smooth:false,wall:.04});
 b.lathe([[.71,1.38],[.76,1.42],[.76,1.55],[.71,1.58]],dark,{segments:8,smooth:false});
 const upper=[[.02,1.56],[.60,1.56],[.77,1.70],[.84,2.76]];
 b.lathe(upper,metal,{segments:8,smooth:false,wall:.04});
 for(const sign of [-1,1]){b.line([[sign*.50,.15,.59],[sign*.52,.3,.62],[sign*.47,1.4,.51]]);b.line([[sign*.43,1.6,.48],[sign*.54,1.78,.59],[sign*.59,2.74,.64]]);}
 b.tube([[.81,2.62,0],[1.19,2.57,0],[1.24,2.19,0],[1.07,1.82,0],[.77,1.82,0]],.105,dark);
 // An actual hollow wedge spout, with front and rear depth.
 const spout=b.mesh(new T.ConeGeometry(.22,.62,4,1,true),metal);spout.rotation.z=-1.0;spout.position.set(-.88,2.48,0);spout.scale.z=.65;
 b.line([[-.78,2.71,0],[-1.23,2.66,0],[-.78,2.22,0]]);
 const lid=b.part({dy:.57,dx:-.85,rz:.04});
 b.lathe([[.02,2.75],[.85,2.75],[.88,2.81],[.52,2.94],[.02,2.98]],metal,{...lid,segments:8,smooth:false});
 b.lathe([[.01,2.99],[.12,2.99],[.12,3.16],[.01,3.16]],dark,{...lid,segments:8,smooth:false});
 b.lathe([[.09,1.61],[.09,2.69],[.15,2.70]],metal,{outline:false});
 b.disc(.58,1.58,metal);b.ring(.68,1.49);
 const valve=b.orb(.072,[0,.88,.77],brass,{scale:[1,1,.38]});valve.rotation.x=.15;
 b.liquid([[.56,1.64],[.72,1.78],[.755,2.33]],{segments:8});
 return b;
}

function createColdBrew(){
 const b=createStudy(),glass=b.mat('glass'),wood=b.mat('wood'),metal=b.mat('metal'),dark=b.mat('dark'),grounds=b.mat('grounds');
 b.lathe([[.02,.08],[.64,.08],[.77,.16],[.79,.28],[.79,2.76],[.73,2.87],[.73,2.98]],glass,{wall:.035});
 b.tube([[.77,2.51,0],[1.15,2.46,0],[1.24,2.16,0],[1.24,1.31,0],[1.08,1.10,0],[.79,1.13,0]],.06,glass);
 const filter=b.part({dy:1.04});
 b.lathe([[.02,2.96],[.82,2.96],[.83,3.09],[.72,3.15],[.02,3.15]],wood,filter);
 b.lathe([[.02,.65],[.40,.65],[.44,.73],[.44,2.91],[.52,2.96]],metal,{...filter,wall:.014});
 // Fine wire cage: open gaps let the grounds remain visible through the basket.
 const basket=filter.parent.children.find(o=>o.material===metal);basket.visible=false;
 // The filled fine mesh is represented by thin wires, not an opaque metal cylinder.
 const solids=b.mat('grounds','#93754e');
 b.lathe([[.01,.72],[.395,.72],[.402,1.65]],solids,{...filter,outline:false});
 for(let i=0;i<36;i++){const a=i/36*Math.PI*2,x=Math.cos(a)*.438,z=Math.sin(a)*.438;b.tube([[x,.72,z],[x,2.91,z]],.006,metal,{...filter,outline:false});}
 for(let i=0;i<13;i++){const y=.72+i*.176;b.tube(Array.from({length:41},(_,j)=>{const a=j/40*Math.PI*2;return[Math.cos(a)*.44,y,Math.sin(a)*.44];}),.005,metal,{...filter,outline:false});}
 for(const x of [-.43,-.21,.21,.43])b.line([[x,.73,.02],[x,2.91,.02]],filter.inkParent);
 b.lathe([[.02,.64],[.44,.64],[.46,.70],[.02,.72]],metal,{...filter,smooth:false,outline:false});
 b.lathe([[.43,2.85],[.49,2.85],[.49,2.97],[.43,2.97]],dark,{...filter,smooth:false});
 b.disc(.39,1.66,grounds,filter);
 b.liquid([[.63,.14],[.72,.2],[.741,.3],[.741,2.16]],{color:'#795233',surface:'#a08058'});
 return b;
}

function createSiphon(){
 const b=createStudy(),glass=b.mat('glass'),metal=b.mat('metal'),dark=b.mat('dark'),wood=b.mat('wood'),cloth=b.mat('paper');
 const offset=-.22;
 b.lathe([[.02,.07],[.83,.07],[1.04,.14],[1.05,.23],[.94,.31],[.02,.34]],dark,{x:.18});
 b.tube([[.85,.25,-.13],[.85,2.91,-.13]],.055,metal);
 b.tube([[.85,1.53,-.13],[.66,1.53,-.13],[.43,1.53,-.13]],.045,metal);
 b.lathe([[.03,.57],[.40,.63],[.65,.84],[.74,1.10],[.68,1.42],[.48,1.63],[.20,1.70],[.18,1.84]],glass,{x:offset,wall:.032});
 b.lathe([[.17,1.76],[.24,1.76],[.25,1.86],[.18,1.91]],wood,{x:offset});
 b.tube([[offset+.23,1.82,0],[offset+.69,1.82,0]],.07,dark);
 b.lathe([[.02,.32],[.32,.32],[.37,.37],[.32,.51],[.15,.57],[.02,.57]],metal,{x:offset});
 b.lathe([[.02,.53],[.08,.53],[.08,.64],[.02,.64]],wood,{x:offset,smooth:false});
 const upper=b.part({dy:.82,dx:-.06});
 b.lathe([[.02,1.88],[.19,1.88],[.40,2.02],[.52,2.22],[.57,3.17]],glass,{...upper,x:offset,wall:.025});
 b.lathe([[.062,1.20],[.062,1.93],[.083,1.97]],glass,{...upper,x:offset,wall:.015,outline:false});
 b.line([[offset-.065,1.20,0],[offset-.065,1.94,0]],upper.inkParent);b.line([[offset+.065,1.20,0],[offset+.065,1.94,0]],upper.inkParent);
 b.disc(.245,2.06,cloth,{...upper,x:offset,outline:true});
 b.tube([[offset,2.05,0],[offset,1.46,0]],.009,metal,{...upper,outline:false});
 b.liquid([[.25,.64],[.49,.74],[.64,.91],[.69,1.14]],{x:offset});
 return b;
}

function createEspresso(){
 const b=createStudy(),cream=b.mat('ceramic','#dcded3'),metal=b.mat('metal'),dark=b.mat('dark'),brass=b.mat('brass'),white=b.mat('ceramic','#f4efe2');
 b.box(2.48,2.5,.32,[0,1.65,-.48],cream,{radius:.14});
 b.box(2.40,1.45,.08,[0,1.4,-.25],dark,{radius:.025});
 b.box(2.48,.86,.98,[0,2.55,-.10],cream,{radius:.12});
 for(const x of [-1.15,1.15])b.box(.18,1.73,.74,[x,1.3,-.02],metal,{radius:.025});
 b.box(2.58,.16,1.65,[0,.36,.13],metal,{radius:.06});
 b.box(2.30,.055,1.39,[0,.465,.18],dark,{outline:false,radius:.03});
 for(let i=-6;i<=6;i++)b.box(.034,.018,1.29,[i*.17,.508,.18],metal,{outline:false,radius:.006});
 for(const x of [-.96,.96])b.box(.25,.16,.8,[x,.20,.12],dark,{outline:false});
 // Gauge faces the user; markings remain sparse enough for the ink stage.
 const gauge=b.mesh(new T.CylinderGeometry(.225,.225,.065,48),metal);gauge.rotation.x=Math.PI/2;gauge.position.set(-.66,2.57,.43);
 const dial=b.mesh(new T.CircleGeometry(.191,48),white);dial.position.set(-.66,2.57,.469);
 b.line(Array.from({length:65},(_,i)=>{const a=i/64*Math.PI*2;return[-.66+Math.cos(a)*.225,2.57+Math.sin(a)*.225,.47];}));
 b.tube([[-.66,2.57,.48],[-.56,2.69,.48]],.008,dark);b.orb(.018,[-.66,2.57,.49],brass,{outline:false});
 for(let i=0;i<7;i++){const a=.3+i/6*Math.PI*.8;b.tube([[-.66+Math.cos(a)*.15,2.57+Math.sin(a)*.15,.48],[-.66+Math.cos(a)*.17,2.57+Math.sin(a)*.17,.48]],.003,dark,{outline:false});}
 b.box(.51,.24,.035,[0,2.58,.44],dark,{radius:.025});
 b.box(.28,.105,.04,[0,2.58,.468],brass,{outline:false,radius:.01});
 for(const x of [.56,.91]){const button=b.mesh(new T.CylinderGeometry(.09,.09,.065,32),x===.56?brass:dark);button.rotation.x=Math.PI/2;button.position.set(x,2.57,.45);b.line(Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return[x+Math.cos(a)*.09,2.57+Math.sin(a)*.09,.5];}));}
 b.lathe([[.02,1.95],[.28,1.95],[.31,2.11],[.02,2.12]],metal,{x:-.32,z:.32});
 const handle=b.part({dy:-.23,dx:.64,dz:.25,rz:-.18});
 b.lathe([[.02,1.77],[.22,1.77],[.29,1.88],[.29,1.97]],metal,{...handle,x:-.32,z:.32,wall:.024});
 b.disc(.235,1.936,b.mat('grounds'),{...handle,x:-.32,z:.32});
 b.tube([[-.10,1.85,.4],[.22,1.85,.63]],.055,metal,handle);
 b.tube([[.18,1.85,.61],[.91,1.85,1.08]],.09,dark,handle);
 b.tube([[-.44,1.79,.32],[-.44,1.63,.32]],.025,metal,handle);b.tube([[-.20,1.79,.32],[-.20,1.63,.32]],.025,metal,handle);
 b.tube([[1.02,2.09,.4],[1.06,1.67,.48],[.91,1.30,.59]],.027,metal);b.tube([[.91,1.30,.59],[.88,1.18,.63]],.04,dark);
 b.lathe([[.02,.53],[.25,.53],[.31,.61],[.35,1.07]],white,{x:-.32,z:.32,wall:.035});
 b.tube([[.01,1,.32],[.23,.98,.32],[.25,.80,.32],[.02,.73,.32]],.035,white);
 b.lathe([[.02,.51],[.48,.51],[.5,.54],[.38,.57],[.02,.57]],white,{x:-.32,z:.32,outline:false});
 b.liquid([[.23,.58],[.27,.64],[.312,1.015]],{x:-.32,z:.32,color:'#765036',surface:'#b98d52'});
 const streams=[-.44,-.20].map(x=>b.tube([[x,1.63,.32],[x,1.03,.32]],.009,b.mat('coffee'),{outline:false}));
 const formation=b.formation;b.formation=value=>{const p=formation(value);for(const stream of streams)stream.visible=p.coffee>0&&p.coffee<1;return p;};
 return b;
}
