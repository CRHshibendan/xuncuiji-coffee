import * as T from './vendor/three.module.min.js';

// The same measured profile supplies the flat contour and the hollow 3D glass.
export const PROFILE=[[.68,.055],[.87,.08],[.99,.17],[1.045,.32],[1.035,.54],[.955,.78],[.795,1.04],[.60,1.31],[.465,1.53],[.423,1.70],[.447,1.91],[.545,2.12],[.74,2.43],[.94,2.76],[1.115,3.06],[1.165,3.17]];
export function ease(t){t=Math.max(0,Math.min(1,t));if(t===0||t===1)return t;let a=0,b=1,u=t;for(let i=0;i<18;i++){const x=3*(1-u)**2*u*.85+3*(1-u)*u*u*.15+u**3;if(x<t)a=u;else b=u;u=(a+b)/2;}return 3*(1-u)*u*u+u**3;}
export const FORMATION_DURATION=9;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function phase(value){return {ink:ease(value/.25),color:smooth((value-.25)/.17),depth:smooth((value-.42)/.32),material:smooth((value-.69)/.21),coffee:smooth((value-.70)/.30)};}
// The coffee grows as geometry; its opacity never switches at the end of the rise.
const LIQUID_PROFILE=[[.68,.12],[.85,.14],[.96,.24],[.992,.38],[.976,.54],[.91,.74],[.825,.9]];
export function liquidState(amount){
 const level=.12+.78*Math.max(0,Math.min(1,amount));let i=0;
 while(i<LIQUID_PROFILE.length-2&&LIQUID_PROFILE[i+1][1]<level)i++;
 const a=LIQUID_PROFILE[i],b=LIQUID_PROFILE[i+1],t=(level-a[1])/(b[1]-a[1]);
 return {level,radius:a[0]+(b[0]-a[0])*t};
}
export function radiusAt(y){let i=0;while(i<PROFILE.length-2&&PROFILE[i+1][1]<y)i++;const a=PROFILE[i],b=PROFILE[i+1],t=Math.max(0,Math.min(1,(y-a[1])/(b[1]-a[1])));return a[0]+(b[0]-a[0])*t;}

function texture(kind){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');let seed=751;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 c.fillStyle=kind==='wood'?'#bc8f5e':kind==='paper'?'#f5eddc':'#85613f';c.fillRect(0,0,512,512);
 if(kind==='wood')for(let i=0;i<130;i++){const y=i*4;c.strokeStyle=`rgba(${random()>.5?'111,65,31':'239,204,155'},${.05+random()*.16})`;c.lineWidth=.35+random()*1.3;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(130,y-12,290,y+22,512,y-4);c.stroke();}
 else for(let i=0;i<14000;i++){const x=random()*512,y=random()*512,s=random()*(kind==='paper'?.7:1.9);c.fillStyle=kind==='paper'?`rgba(125,112,80,${random()*.09})`:`rgba(${random()>.5?'47,28,13':'217,175,115'},${.15+random()*.3})`;c.fillRect(x,y,s+.3,s+.3);}
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;return map;
}
function smoothProfile(points,count=160){const curve=new T.CatmullRomCurve3(points.map(([x,y])=>new T.Vector3(x,y,0)),false,'centripetal');return curve.getPoints(count).map(v=>new T.Vector2(Math.max(.001,v.x),v.y));}
function spout(geometry){const p=geometry.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),r=Math.hypot(p.getX(i),p.getZ(i));if(y<2.9||r<.1)continue;const angle=Math.atan2(p.getZ(i),p.getX(i)),lobe=Math.exp(-(((angle-.18)/.16)**2)),f=Math.max(0,(y-2.9)/.27)*lobe;p.setXYZ(i,p.getX(i)+.17*f,y+.055*f,p.getZ(i));}p.needsUpdate=true;geometry.computeVertexNormals();}

export function createChemex(){
 const root=new T.Group(),solids=new T.Group(),ink=new T.Group(),paper=new T.Group(),paperInk=new T.Group();root.position.y=-1.59;root.add(solids,ink);solids.add(paper);ink.add(paperInk);
 const lines=[],rings=[],meshes=[],materials=[],textures=[],flatMaterials=[];
 const finish={value:0};
 const material=(Ctor,options)=>{const m=new Ctor(options);m.userData.baseOpacity=m.opacity;materials.push(m);return m;};
 const woodMap=texture('wood'),paperMap=texture('paper'),groundsMap=texture('grounds');textures.push(woodMap,paperMap,groundsMap);
 const glass=material(T.MeshPhysicalMaterial,{color:0xffffff,roughness:.055,metalness:0,transmission:1,thickness:.04,ior:1.46,attenuationColor:new T.Color('#d9e5dc'),attenuationDistance:5,envMapIntensity:.38,clearcoat:.35,clearcoatRoughness:.08});
 const wood=material(T.MeshStandardMaterial,{color:0xe0b785,map:woodMap,roughness:.66,metalness:0});
 const leather=material(T.MeshStandardMaterial,{color:0x795336,roughness:.87});
 const paperMat=material(T.MeshStandardMaterial,{color:0xfff9eb,map:paperMap,roughness:.94,side:T.DoubleSide});
 const groundsMat=material(T.MeshStandardMaterial,{color:0xc8a884,map:groundsMap,roughness:1,side:T.DoubleSide});
 const coffeeMat=material(T.MeshPhysicalMaterial,{color:0x694021,roughness:.29,metalness:.02,clearcoat:.3,side:T.DoubleSide});
 const surfaceMat=material(T.MeshStandardMaterial,{color:0x76502d,roughness:.22,metalness:.04,side:T.DoubleSide});
 // Blend the same surface from an unlit illustration into physical shading.
 // No second overlapping model, so unfolding does not cross-fade two silhouettes.
 function flatToPhysical(mat,color){
  const flatColor=new T.Color(color);
  mat.onBeforeCompile=shader=>{
   shader.uniforms.uFinish=finish;shader.uniforms.uFlatColor={value:flatColor};
   shader.fragmentShader='uniform float uFinish;\nuniform vec3 uFlatColor;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight = mix(uFlatColor, outgoingLight, uFinish);\n#include <opaque_fragment>');
  };
  mat.customProgramCacheKey=()=> 'chemex-flat-to-physical-v1';flatMaterials.push(mat);
 }
 flatToPhysical(glass,'#dfe8df');flatToPhysical(wood,'#bc8f5e');flatToPhysical(leather,'#795336');flatToPhysical(paperMat,'#fff9eb');flatToPhysical(groundsMat,'#ae8961');
 function mesh(geometry,mat,parent=solids,shadow=true){const m=new T.Mesh(geometry,mat);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);meshes.push(m);return m;}
 const shell=[...PROFILE,[1.17,3.185],[1.15,3.195],[1.132,3.171],...PROFILE.slice(0,-1).reverse().map(([r,y])=>[Math.max(.01,r-.035),y+.034]),[.03,.09],[.025,.055],[.68,.055]];
 const shellGeometry=new T.LatheGeometry(smoothProfile(shell,210),96);spout(shellGeometry);const body=mesh(shellGeometry,glass,solids,false);body.renderOrder=2;glass.depthWrite=false;
 const collarProfile=[[.536,1.47],[.566,1.49],[.49,1.69],[.494,1.79],[.544,1.99],[.511,2.015],[.477,1.99],[.436,1.79],[.433,1.69],[.502,1.49],[.536,1.47]];
 mesh(new T.LatheGeometry(smoothProfile(collarProfile,70),80,.035,Math.PI*2-.07),wood).renderOrder=3;
 function tube(points,r=.014,parent=solids,mat=leather,closed=false){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),closed,'centripetal'),Math.max(28,points.length*8),r,6,closed),mat,parent);}
 for(const y of [1.705,1.765])tube(Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2;return[Math.sin(a)*.501,y+Math.cos(a)*.008,Math.cos(a)*.501];}),.014);
 tube([[0,1.76,.529],[-.08,1.91,.538],[-.235,1.965,.512],[-.267,1.88,.5],[-.14,1.785,.53],[0,1.76,.529]],.013);
 tube([[0,1.76,.53],[.08,1.91,.538],[.23,1.955,.51],[.265,1.87,.5],[.14,1.785,.53],[0,1.76,.529]],.013);
 tube([[-.015,1.73,.54],[-.02,1.5,.51],[-.065,1.25,.55],[-.05,1.05,.64],[-.18,.9,.76]],.015);
 tube([[.025,1.73,.54],[.12,1.57,.54],[.19,1.35,.59],[.225,1.15,.69],[.35,1.03,.77]],.014);
 const knot=mesh(new T.SphereGeometry(1,20,14),wood);knot.scale.set(.075,.095,.042);knot.position.set(0,1.75,.548);knot.renderOrder=4;

 const paperProfile=[[.025,1.965],[.04,1.99],[.26,2.24],[.55,2.57],[.83,2.90],[1.075,3.24]];
 const paperGeometry=new T.LatheGeometry(smoothProfile(paperProfile,56),80);const pp=paperGeometry.attributes.position;
 for(let i=0;i<pp.count;i++){const y=pp.getY(i),angle=Math.atan2(pp.getX(i),pp.getZ(i)),top=Math.max(0,(y-2.85)/.39);pp.setY(i,y+.075*top*Math.max(0,Math.cos(angle+.7))**8);}
 paperGeometry.computeVertexNormals();mesh(paperGeometry,paperMat,paper).renderOrder=0;
 const fold=mesh(new T.LatheGeometry([new T.Vector2(.075,2.02),new T.Vector2(1.067,3.245)],28,.8,.34),paperMat,paper);fold.renderOrder=1;fold.position.z=.006;
 const grounds=mesh(new T.CircleGeometry(.475,64),groundsMat,paper,false);grounds.rotation.x=-Math.PI/2;grounds.position.y=2.535;

 const liquidGeometry=new T.LatheGeometry([new T.Vector2(0,0),...Array.from({length:33},(_,i)=>new T.Vector2(1,i/32))],80);
 const liquid=mesh(liquidGeometry,coffeeMat,solids,false);liquid.name='coffee-volume';
 const liquidTemplate=liquidGeometry.attributes.position.array.slice();
 const liquidSurface=mesh(new T.CircleGeometry(1,80),surfaceMat,solids,false);liquidSurface.rotation.x=-Math.PI/2;liquidSurface.name='coffee-surface';
 let liquidAmount=-1;
 function rise(amount){
  liquid.visible=liquidSurface.visible=amount>0;
  if(amount===liquidAmount)return;liquidAmount=amount;
  const {level,radius}=liquidState(amount),positions=liquidGeometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   const x=liquidTemplate[i*3],t=liquidTemplate[i*3+1],z=liquidTemplate[i*3+2],y=.12+(level-.12)*t;
   const r=liquidState((y-.12)/.78).radius;
   positions.setXYZ(i,x*r,y,z*r);
  }
  positions.needsUpdate=true;liquidGeometry.computeVertexNormals();liquidGeometry.computeBoundingSphere();
  liquidSurface.position.y=level;liquidSurface.scale.set(radius,radius,1);
 }

 function line(points,parent=ink){const geo=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));const mat=new T.LineDashedMaterial({color:0x244239,transparent:true,opacity:1,dashSize:0,gapSize:100});const object=new T.Line(geo,mat);object.computeLineDistances();object.renderOrder=8;parent.add(object);const distance=geo.attributes.lineDistance.array.at(-1)||1;const entry={object,mat,length:distance};lines.push(entry);object.userData.inkEntry=entry;return object;}
 function ring(r,y,parent=ink,offset=0,ellipse=.12){const points=Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2;return[r*Math.cos(a)+offset,y+Math.sin(a)*ellipse,0];});const object=line(points,parent);rings.push({object,r,y,offset,ellipse});return object;}
 for(const sign of [-1,1])line(PROFILE.map(([r,y])=>[sign*r,y,0]));
 ring(1.165,3.18);ring(.79,.08,ink,0,.07);
 for(const sign of [-1,1])line(collarProfile.slice(0,6).map(([r,y])=>[sign*r,y,0]));
 for(const y of [1.705,1.765])ring(.501,y,ink,0,.045);
 line([[-.04,1.74,.53],[-.17,1.88,.53],[-.26,1.88,.53],[-.2,1.8,.53],[0,1.75,.54],[.2,1.8,.53],[.26,1.88,.53],[.17,1.89,.53],[.04,1.74,.54]]);
 line([[0,1.74,.54],[-.03,1.45,.54],[-.06,1.1,.65],[-.18,.9,.76]]);line([[.02,1.74,.54],[.16,1.48,.55],[.225,1.15,.69],[.35,1.03,.77]]);
 ring(.075,1.75,ink,0,.09);
 for(const sign of [-1,1])line(paperProfile.map(([r,y])=>[r*sign,y,0]),paperInk);
 ring(1.075,3.24,paperInk,0,.12);
 // Ink is complete before depth changes. Keep its distance buffer: changing the
 // positions of a fully drawn ring needs no new GPU attribute on every frame.
 let depth=-1;
 function formation(value){
  const p=phase(value);solids.visible=p.color>0;finish.value=p.material;glass.transmission=p.material;solids.scale.z=ink.scale.z=.025+.975*p.depth;
  if(depth!==p.depth){depth=p.depth;for(const ring of rings){const a=ring.object.geometry.attributes.position;for(let i=0;i<a.count;i++){const theta=i/(a.count-1)*Math.PI*2;a.setXYZ(i,Math.cos(theta)*ring.r+ring.offset,ring.y+Math.sin(theta)*ring.ellipse*(1-depth),Math.sin(theta)*ring.r);}a.needsUpdate=true;}}
  for(const item of lines){item.mat.dashSize=Math.max(.00001,item.length*p.ink+.001);item.mat.gapSize=item.length+100;item.mat.opacity=(1-p.material)*Math.min(1,p.ink*12);item.mat.depthTest=false;}
  for(const mat of flatMaterials){const opacity=p.color*(mat===glass?.28+.72*p.material:1),transparent=opacity<1;if(mat.transparent!==transparent){mat.transparent=transparent;mat.needsUpdate=true;}mat.opacity=opacity;}
  rise(p.coffee);
  return p;
 }
 function lift(value){paper.position.y=paperInk.position.y=value*1.08;paper.position.x=paperInk.position.x=value*.055;paper.rotation.z=paperInk.rotation.z=-value*.065;}
 function dispose(){root.traverse(o=>{o.geometry?.dispose();if(o.material&&!materials.includes(o.material))o.material.dispose();});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 return {root,formation,lift,dispose};
}
