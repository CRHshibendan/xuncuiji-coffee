const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const home=fs.readFileSync(require.resolve('../index.html'),'utf8'),lesson=fs.readFileSync(require.resolve('../learn.html'),'utf8');
function shapes(svg){return [...svg.matchAll(/<(?:path|ellipse|circle)\b[^>]*\/>/g)].map(m=>m[0].replace(/\s+/g,' '));}
test('classroom reuses the seven exact homepage geometries and its existing player hooks',()=>{
 const sources=new Map([...home.matchAll(/(<svg\b[^>]*data-brewer-art="([^"]+)"[\s\S]*?<\/svg>)/g)].map(m=>[m[2],m[1]]));
 for(const m of home.matchAll(/<template data-brewer-template="([^"]+)">\s*(<svg[\s\S]*?<\/svg>)\s*<\/template>/g))sources.set(m[1],m[2]);
 const copies=[...lesson.matchAll(/(<svg\b[^>]*data-brewer-art="([^"]+)"[\s\S]*?<\/svg>)/g)];assert.equal(copies.length,7);
 for(const m of copies){assert.deepEqual(shapes(m[1]),shapes(sources.get(m[2])),m[2]);assert.match(lesson,new RegExp('data-brewer-select="'+m[2]+'"'));}
 assert.match(lesson,/class="brewer-display" id="lesson-brewer-display"/);assert.match(lesson,/src="home\.js\?v=33"/);
});
