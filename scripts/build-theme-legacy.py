"""Build static, page-scoped color overrides; no runtime element recoloring."""
from pathlib import Path
import re,colorsys
root=Path(__file__).resolve().parents[1]
hex_pattern=re.compile(r'#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{4}\b|#[0-9a-fA-F]{3}\b|\bwhite\b|\bblack\b')
def color(token,role):
    token={'white':'#ffffff','black':'#000000'}.get(token,token)
    raw=token[1:]
    if len(raw) in (3,4):raw=''.join(c*2 for c in raw)
    rgb=[int(raw[i:i+2],16)/255 for i in (0,2,4)];alpha=raw[6:]
    h,l,s=colorsys.rgb_to_hls(*rgb)
    if role=='text':
        if l>.84:return token
        l=.82 if l<.35 else .72;s=min(s,.42)
    elif role=='surface':
        if l<.35:return token
        l=.115+(1-l)*.095;s=min(s,.23)
    elif role=='shadow':
        return ('#ffffff'+(alpha or '20')) if l>.7 else '#000000'+(alpha or '55')
    else:l=.30 if l>.65 else .49;s=min(s,.22)
    return '#'+''.join(f'{round(c*255):02x}' for c in colorsys.hls_to_rgb(h,l,s))+alpha

def blocks(text):
    start=0;depth=0;quote=None;escape=False;opened=None
    for index,c in enumerate(text):
        if escape:escape=False;continue
        if c=='\\':escape=True;continue
        if quote:
            if c==quote:quote=None
            continue
        if c in ('"',"'"):quote=c;continue
        if c=='{':
            if depth==0:opened=index
            depth+=1
        if c=='}':
            depth-=1
            if depth==0:yield text[start:opened].strip(),text[opened+1:index];start=index+1

def convert(text,scope):
    output=[]
    for selector,body in blocks(re.sub(r'/\*.*?\*/','',text,flags=re.S)):
        if selector.startswith('@'):
            if selector.startswith(('@media','@supports','@layer')):
                nested=convert(body,scope)
                if nested:output.append(selector+'{'+nested+'}')
            continue
        declarations=[]
        for prop,value in re.findall(r'([\w-]+)\s*:\s*([^;{}]+)',body):
            if prop.startswith('--') or not hex_pattern.search(value):continue
            role='text' if prop in ('color','text-decoration-color','caret-color') else 'surface' if prop.startswith('background') else 'shadow' if prop in ('box-shadow','text-shadow') else 'edge' if prop.startswith(('border','outline')) else None
            if role:declarations.append(prop+':'+hex_pattern.sub(lambda m:color(m.group(),role),value))
        if not declarations:continue
        selectors=[];parts=[];start=0;depth=0
        for i,c in enumerate(selector):
            if c in '([':depth+=1
            elif c in ')]':depth-=1
            elif c==',' and depth==0:parts.append(selector[start:i]);start=i+1
        parts.append(selector[start:])
        for part in parts:
            part=part.strip()
            if part in ('html',':root'):selectors.append(scope)
            elif part.startswith('html '):selectors.append(scope+part[4:])
            elif part.startswith(':root '):selectors.append(scope+part[5:])
            else:selectors.append(scope+' '+part)
        output.append(','.join(selectors)+'{'+ ';'.join(declarations)+'}')
    return '\n'.join(output)

result=['/* Generated from the exact styles each page loads. Rebuild with build-legacy.py. SVG fill/stroke and keyframes are preserved. */']
for page in sorted(root.rglob('*.html')):
    if page.parent not in (root,root/'experiments'):continue
    html=page.read_text();scope=':root[data-theme="dark"][data-theme-page="'+page.stem+'"]'
    for href in re.findall(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)',html):
        source=(page.parent/href.split('?')[0]).resolve()
        if source.name.startswith('site-theme'):continue
        if source.exists():result.append(convert(source.read_text(),scope))
    for inline in re.findall(r'<style[^>]*>(.*?)</style>',html,re.S):result.append(convert(inline,scope))
(root/'site-theme-legacy.css').write_text('\n'.join(result)+'\n')
print('Generated', (root/'site-theme-legacy.css').stat().st_size,'bytes')
