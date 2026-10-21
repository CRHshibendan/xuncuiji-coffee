const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../svg-tools.js'),'utf8')+';this.art=SVGTools',ctx);
function sample(d){const tokens=d.match(/[MCQZ]|-?\d+(?:\.\d+)?/g);let i=0,p=[0,0],points=[];while(i<tokens.length){const cmd=tokens[i++];if(cmd==='M'){p=[+tokens[i++],+tokens[i++]];points.push(p);}else if(cmd==='C'||cmd==='Q'){const count=cmd==='C'?3:2,ps=[p];for(let j=0;j<count;j++)ps.push([+tokens[i++],+tokens[i++]]);for(let j=1;j<=400;j++){const t=j/400,u=1-t;points.push(cmd==='C'?[0,1].map(k=>u*u*u*ps[0][k]+3*u*u*t*ps[1][k]+3*u*t*t*ps[2][k]+t*t*t*ps[3][k]):[0,1].map(k=>u*u*ps[0][k]+2*u*t*ps[1][k]+t*t*ps[2][k]));}p=ps.at(-1);}else if(cmd!=='Z')throw Error('Unexpected path command '+cmd);}return points;}
for(const [kind,render] of [['server',level=>ctx.art.server(level)],['chemex',level=>ctx.art.chemexDripper('#C69A62',level)]]){
test(kind+' liquid stays inside the real glass even without its clipping mask',()=>{
 for(const level of [.1,1,12,33.48,33.5,40,75,100,200]){
  const svg=render(level),body=sample(svg.match(/id="glass-body">\s*<path d="([^"]+)"/)[1]);
  for(const name of ['fill','surface']){
   const tag=svg.match(new RegExp('<path class="'+kind+'-liquid-'+name+'"[^>]+>'))[0];assert.match(tag,/stroke="none"/);
   const liquid=sample(tag.match(/d="([^"]+)"/)[1]);
   for(const [x,y] of liquid){const hits=[];for(let i=0;i<body.length;i++){const a=body[i],b=body[(i+1)%body.length];if(Math.abs(a[1]-y)<.02)hits.push(a[0]);if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))hits.push(a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]));}assert.ok(hits.length&&x>=Math.min(...hits)-.03&&x<=Math.max(...hits)+.03,`level ${level}: ${name} escapes at ${x},${y}`);}
  }
 }
});
test(kind+' empty and invalid amounts never create a liquid shape',()=>{for(const n of [0,-10,NaN])assert.doesNotMatch(render(n),new RegExp('class="'+kind+'-liquid-'));assert.equal(render(200),render(100));});
}
