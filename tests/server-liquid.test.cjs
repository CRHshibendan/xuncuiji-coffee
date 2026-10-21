const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../svg-tools.js'),'utf8')+';this.art=SVGTools',ctx);
function sample(d){const tokens=d.match(/[MCQZ]|-?\d+(?:\.\d+)?/g);let i=0,p=[0,0],points=[];while(i<tokens.length){const cmd=tokens[i++];if(cmd==='M'){p=[+tokens[i++],+tokens[i++]];points.push(p);}else if(cmd==='C'||cmd==='Q'){const count=cmd==='C'?3:2,ps=[p];for(let j=0;j<count;j++)ps.push([+tokens[i++],+tokens[i++]]);for(let j=1;j<=400;j++){const t=j/400,u=1-t;points.push(cmd==='C'?[0,1].map(k=>u*u*u*ps[0][k]+3*u*u*t*ps[1][k]+3*u*t*t*ps[2][k]+t*t*t*ps[3][k]):[0,1].map(k=>u*u*ps[0][k]+2*u*t*ps[1][k]+t*t*ps[2][k]));}p=ps.at(-1);}else if(cmd!=='Z')throw Error('Unexpected path command '+cmd);}return points;}
test('server liquid has a shaped silhouette inside the real glass even without its clipping mask',()=>{
 for(const level of [.1,1,12,40,75,100,200]){
  const svg=ctx.art.server(level),body=sample(svg.match(/id="glass-body">\s*<path d="([^"]+)"/)[1]);
  for(const name of ['fill','surface']){
   const tag=svg.match(new RegExp('<path class="server-liquid-'+name+'"[^>]+>'))[0];assert.match(tag,/stroke="none"/);
   const liquid=sample(tag.match(/d="([^"]+)"/)[1]);
   for(const [x,y] of liquid){const hits=[];for(let i=0;i<body.length;i++){const a=body[i],b=body[(i+1)%body.length];if(Math.abs(a[1]-y)<.02)hits.push(a[0]);if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))hits.push(a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]));}assert.ok(hits.length&&x>=Math.min(...hits)-.03&&x<=Math.max(...hits)+.03,`level ${level}: ${name} escapes at ${x},${y}`);}
  }
 }
});
test('empty and invalid server amounts never create a visible liquid shape',()=>{for(const n of [0,-10,NaN])assert.doesNotMatch(ctx.art.server(n),/class="server-liquid-/);assert.equal(ctx.art.server(200),ctx.art.server(100));});
