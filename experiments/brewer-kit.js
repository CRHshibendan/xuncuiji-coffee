import * as T from './vendor/three.module.min.js';
import {phase} from './chemex-model.js';

// A common clock and surface transition; the individual brewers keep their own geometry.
export function createStudy(){
 const root=new T.Group(),solids=new T.Group(),drawing=new T.Group();
 root.position.y=-1.59;root.add(solids,drawing);
 const materials=[],textures=[],lines=[],rings=[],lifts=[],liquids=[],finish={value:0};
 const palette={glass:'#dfe8df',ceramic:'#eee9dc',metal:'#aab4ab',dark:'#355044',wood:'#bc9060',paper:'#fff7e5',grounds:'#a58055',coffee:'#6d452a',brass:'#ac9167'};
 const mat=(kind,color=palette[kind])=>{
  const options={color,roughness:.45,metalness:0};
  if(kind==='glass')Object.assign(options,{color:'#fff',roughness:.065,transmission:1,thickness:.035,ior:1.46,attenuationColor:new T.Color('#d9e5dc'),attenuationDistance:5,envMapIntensity:.38,clearcoat:.35,depthWrite:false});
  if(kind==='metal')Object.assign(options,{roughness:.3,metalness:.72});
  if(kind==='ceramic')Object.assign(options,{roughness:.22,clearcoat:.6,clearcoatRoughness:.16});
  if(kind==='brass')Object.assign(options,{roughness:.33,metalness:.65});
  if(kind==='wood'||kind==='paper'||kind==='grounds'){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
   c.fillStyle=color;c.fillRect(0,0,256,256);let seed=751;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
   for(let i=0;i<(kind==='wood'?100:2600);i++){
    c.fillStyle=`rgba(${random()>.5?'57,40,22':'245,228,190'},${kind==='paper'?.045:.11})`;
    c.fillRect(random()*256,random()*256,kind==='wood'?60+random()*160:.4+random(),kind==='wood'?.4:.4+random());
   }
   const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;textures.push(map);options.map=map;options.roughness=kind==='wood'?.68:.95;
  }
  const material=new T.MeshPhysicalMaterial(options);material.side=kind==='glass'?T.FrontSide:T.DoubleSide;
  material.userData.kind=kind;
  const flatColor=new T.Color(color);
  material.onBeforeCompile=shader=>{
   shader.uniforms.uFinish=finish;shader.uniforms.uFlatColor={value:flatColor};
   shader.fragmentShader='uniform float uFinish;\nuniform vec3 uFlatColor;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight = mix(uFlatColor, outgoingLight, uFinish);\n#include <opaque_fragment>');
  };
  material.customProgramCacheKey=()=> 'brewer-flat-physical-v1';materials.push(material);return material;
 };
 const mesh=(geometry,material,parent=solids)=>{const m=new T.Mesh(geometry,material);parent.add(m);return m;};
 const line=(points,parent=drawing)=>{
  const geometry=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));
  const material=new T.LineDashedMaterial({color:'#244239',transparent:true,dashSize:0,gapSize:100});
  const object=new T.Line(geometry,material);object.computeLineDistances();object.renderOrder=10;parent.add(object);
  const entry={object,material,length:geometry.attributes.lineDistance.array.at(-1)||1};lines.push(entry);return entry;
 };
 const ring=(r,y,{x=0,z=0,ellipse=.08,parent=drawing}={})=>{
  const entry=line(Array.from({length:81},(_,i)=>{const a=i/80*Math.PI*2;return[x+Math.cos(a)*r,y+Math.sin(a)*ellipse,z+Math.sin(a)*r];}),parent);
  rings.push({entry,r,y,x,z,ellipse});return entry;
 };
 const sample=(points,count=80)=>new T.CatmullRomCurve3(points.map(([x,y])=>new T.Vector3(x,y,0)),false,'centripetal').getPoints(count).map(p=>new T.Vector2(Math.max(.001,p.x),p.y));
 function lathe(profile,material,{parent=solids,inkParent=drawing,x=0,z=0,segments=64,smooth=true,outline=true,rim=true,wall=0}={}){
  const shape=wall?[...profile,...profile.slice().reverse().map(([r,y])=>[Math.max(.001,r-wall),y+(y===profile[0][1]?wall:0)])]:profile;
  const geo=new T.LatheGeometry(smooth?sample(shape,Math.max(48,shape.length*6)):shape.map(p=>new T.Vector2(...p)),segments);
  const object=mesh(geo,material,parent);object.position.set(x,0,z);
  if(material.userData.kind==='glass')object.renderOrder=2;
  if(outline){for(const sign of [-1,1])line(profile.map(([r,y])=>[x+sign*r,y,z]),inkParent);if(rim){const top=profile.at(-1);ring(top[0],top[1],{x,z,parent:inkParent,ellipse:Math.min(.1,top[0]*.13)});}}
  return object;
 }
 function tube(points,radius,material,{parent=solids,inkParent=drawing,outline=true,closed=false}={}){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),closed,'centripetal');
  const object=mesh(new T.TubeGeometry(curve,Math.max(32,points.length*8),radius,8,closed),material,parent);
  if(outline)line(curve.getPoints(48).map(p=>[p.x,p.y,p.z]),inkParent);return object;
 }
 function disc(radius,y,material,{x=0,z=0,parent=solids,inkParent=drawing,outline=false}={}){
  const object=mesh(new T.CircleGeometry(radius,64),material,parent);object.rotation.x=-Math.PI/2;object.position.set(x,y,z);
  if(outline)ring(radius,y,{x,z,parent:inkParent});return object;
 }
 function orb(radius,position,material,{scale=[1,1,1],parent=solids,inkParent=drawing,outline=true}={}){
  const object=mesh(new T.SphereGeometry(radius,32,20),material,parent);object.position.set(...position);object.scale.set(...scale);
  if(outline)line(Array.from({length:65},(_,i)=>{const a=i/64*Math.PI*2;return[position[0]+Math.cos(a)*radius*scale[0],position[1]+Math.sin(a)*radius*scale[1],position[2]];}),inkParent);return object;
 }
 function box(w,h,d,position,material,{parent=solids,inkParent=drawing,outline=true,radius=.06}={}){
  const shape=new T.Shape(),x=-w/2,y=-h/2,r=Math.min(radius,w/2,h/2);
  shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
  const geometry=new T.ExtrudeGeometry(shape,{depth:Math.max(.005,d-.025),bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,steps:1,curveSegments:5});geometry.translate(0,0,-d/2);
  const object=mesh(geometry,material,parent);object.position.set(...position);
  if(outline)line([...shape.getPoints(32),shape.getPoints(32)[0]].map(v=>[v.x+position[0],v.y+position[1],position[2]+d/2]),inkParent);return object;
 }
 function part({dy=.85,dx=0,dz=0,rz=0}={}){const solid=new T.Group(),ink=new T.Group();solids.add(solid);drawing.add(ink);lifts.push({solid,ink,dy,dx,dz,rz});return {parent:solid,inkParent:ink};}
 function liquid(profile,{x=0,z=0,parent=solids,color='#6d452a',surface='#92704c',segments=64}={}){
  const min=profile[0][1],max=profile.at(-1)[1];
  const radiusAt=y=>{let i=0;while(i<profile.length-2&&profile[i+1][1]<y)i++;const a=profile[i],b=profile[i+1],t=Math.max(0,Math.min(1,(y-a[1])/(b[1]-a[1])));return a[0]+(b[0]-a[0])*t;};
  const material=new T.MeshPhysicalMaterial({color,roughness:.3,clearcoat:.25,side:T.DoubleSide}),surfaceMat=new T.MeshStandardMaterial({color:surface,roughness:.28,side:T.DoubleSide});materials.push(material,surfaceMat);
  const geometry=new T.LatheGeometry([new T.Vector2(0,0),...Array.from({length:33},(_,i)=>new T.Vector2(1,i/32))],segments),template=geometry.attributes.position.array.slice();
  const body=mesh(geometry,material,parent),top=mesh(new T.CircleGeometry(1,segments),surfaceMat,parent);body.name='coffee-volume';top.name='coffee-surface';body.position.set(x,0,z);top.rotation.x=-Math.PI/2;top.position.set(x,min,z);
  body.userData.liquidBounds={min,max};let last=-1;
  liquids.push(amount=>{
   body.visible=top.visible=amount>0;if(last===amount)return;last=amount;
   const level=min+(max-min)*amount,p=geometry.attributes.position;
   for(let i=0;i<p.count;i++){const y=min+template[i*3+1]*(level-min),r=radiusAt(y);p.setXYZ(i,template[i*3]*r,y,template[i*3+2]*r);}
   p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();top.position.y=level;const r=radiusAt(level);top.scale.set(r,r,1);
  });return {body,top};
 }
 // Ink is complete before depth changes. Keep its distance buffer: changing the
 // positions of a fully drawn ring needs no new GPU attribute on every frame.
 let lastDepth=-1;
 function formation(value){
  const p=phase(value);finish.value=p.material;solids.visible=p.color>0;solids.scale.z=drawing.scale.z=.025+.975*p.depth;
  for(const m of materials){if(!m.userData.kind)continue;const glass=m.userData.kind==='glass',opacity=p.color*(glass?.28+.72*p.material:1),transparent=opacity<1;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}m.opacity=opacity;if(glass)m.transmission=p.material;}
  if(p.depth!==lastDepth){lastDepth=p.depth;for(const {entry,r,y,x,z,ellipse} of rings){const a=entry.object.geometry.attributes.position;for(let i=0;i<a.count;i++){const theta=i/(a.count-1)*Math.PI*2;a.setXYZ(i,x+Math.cos(theta)*r,y+Math.sin(theta)*ellipse*(1-p.depth),z+Math.sin(theta)*r);}a.needsUpdate=true;}}
  for(const {material,length} of lines){material.dashSize=Math.max(.00001,length*p.ink+.001);material.gapSize=length+100;material.opacity=(1-p.material)*Math.min(1,p.ink*12);material.depthTest=false;}
  for(const rise of liquids)rise(p.coffee);return p;
 }
 function lift(value){for(const p of lifts)for(const group of [p.solid,p.ink]){group.position.set(p.dx*value,p.dy*value,p.dz*value);group.rotation.z=p.rz*value;}}
 function dispose(){const geometries=new Set(),allMaterials=new Set(materials);root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)allMaterials.add(o.material);});geometries.forEach(g=>g.dispose());allMaterials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 return {root,solids,drawing,mat,mesh,line,ring,lathe,tube,disc,orb,box,part,liquid,formation,lift,dispose};
}
