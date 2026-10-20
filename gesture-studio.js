/* Gesture beta: on-device input, camera lifecycle and presentation. */
(function(){
 'use strict';
 const local=/^(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(location.hostname);
 // HTTPS supports the published beta; local HTTP remains available for development.
 const available=local||location.protocol==='https:';
 const pointerId=-601;
 let current=null;
 function renderGuides(scene,targets,name){
   const root=scene.querySelector('#scene-targets');if(!root)return;
   const matrix=scene.getScreenCTM?.(),scale=matrix?Math.max(1,Math.min(3,1/Math.hypot(matrix.a,matrix.b))):1;
   const view=scene.viewBox?.baseVal;
   const labels={scale:'称豆放这里',grinder:'豆子送这里',bed:name==='kettle'?'壶嘴移到圈的上方':name==='grounds'?'咖啡粉倒这里':name==='filter'?'滤纸放这里':'放到器具口',group:'锁入冲煮头',cup:'倒进咖啡杯',waste:'倒水／移走滤杯',away:'移开热源',heat:'放回热源'};
   root.innerHTML=(name?targets||[]:[]).map(t=>{
    const label=labels[t.id]||'放到这里',width=(label.length*14+16)*scale,ry=t.ry||24;
    const labelX=view?Math.max(view.x+width/2+8,Math.min(view.x+view.width-width/2-8,t.x)):t.x;
    return `<g data-target="${t.id}" class="gesture-drop-target" role="button" tabindex="0" aria-label="${label}"><rect class="target-hit" x="${t.x-t.rx}" y="${t.y-48}" width="${t.rx*2}" height="96" fill="transparent"/><ellipse class="target-zone" cx="${t.x}" cy="${t.y}" rx="${t.rx}" ry="${ry}"/><rect class="gesture-target-caption" x="${labelX-width/2}" y="${t.y-ry-32*scale}" width="${width}" height="${24*scale}" rx="8"/><text class="target-label" style="font-size:${14*scale}px" x="${labelX}" y="${t.y-ry-16*scale}">${label}</text></g>`;
   }).join('');
   root.classList.toggle('targets-ready',Boolean(name));
  }
 function bind(config){
  const {scene}=config;let target=null,last={x:0,y:0},grindAssist=false;
  const event=point=>({button:0,pointerId,clientX:point.x,clientY:point.y,target,gesture:true,preventDefault(){}});
  function resolve(hit){const object=scene.querySelector(`[data-object="${hit.id}"]`);return object?.querySelector(hit.id==='grinder'||hit.grip==='crank'?'[data-crank-handle]':hit.grip==='press'?'[data-press-grip]':':scope')||object;}
  function startPoint(hit,point){if(hit.id!=='grinder')return point;const rect=target.getBoundingClientRect();return{x:rect.left+rect.width/2,y:rect.top+rect.height/2};}
  const guides=name=>renderGuides(scene,config.targets?.(name)||[],name);
  return{
   scene,guides,
   canPick:config.canPick,
   select(hit){if(!config.canPick(hit.id))return false;config.select(hit.id);guides(hit.id);return true;},
   begin(hit,point){
    if(!config.canPick(hit.id)||config.dragging())return false;target=resolve(hit);if(!target)return false;
    config.clear();last={...point};config.start(event(startPoint(hit,point)));
    const started=config.dragging();grindAssist=started&&hit.id==='grinder'&&Boolean(config.grind);
    if(grindAssist)config.markMoved?.(); // Grabbing alone must not queue a click-to-grind on release.
    if(started)guides(hit.id);return started;
   },
   move(point){
    if(!config.dragging())return;
    if(grindAssist){
     // The original grinder/model still computes the amount. Only its input path changes.
     const distance=Math.hypot(point.x-last.x,(point.y-last.y)*.5);
     if(distance>.25){config.markMoved?.();config.grind(distance/Math.max(40,Math.min(80,innerWidth*.07))*Math.PI*2);}
    }else if(!grindAssist)config.move(event(point));
    last={...point};
   },
   release(point){last=point||last;config.end(event(last));grindAssist=false;guides(null);},
   tap(hit,point){if(!config.canPick(hit.id))return;target=resolve(hit);if(!target)return;config.clear();const p=startPoint(hit,point);config.start(event(p));config.end(event(p));guides(hit.id);},
   hold(on){if(!on)config.hold?.();},
   pause(options){if(config.dragging()){config.end(event(last),true);}grindAssist=false;config.stop(options);config.clear();guides(null);},
   clear(){config.clear();guides(null);},
   ready:()=>!config.busy?.()
  };
 }
 function mount(adapter){
  current?.destroy();current=null;
  if(!available)return;
  document.body.classList.add('gesture-mode');
  const panel=document.createElement('section');panel.className='gesture-panel';panel.setAttribute('aria-labelledby','gesture-beta-title');
  const tool=new URL(location.href).searchParams.get('tool')||'melitta';
  panel.innerHTML=`<div class="gesture-panel-heading"><a id="gesture-back" href="workshop.html?tool=${encodeURIComponent(tool)}&mode=advanced">← 返回工坊</a><h2 id="gesture-beta-title">手势冲煮 <span>测试版</span></h2><button type="button" id="gesture-help">操作说明</button></div>
   <div class="gesture-actions"><button type="button" id="gesture-start">开启摄像头</button><button type="button" id="gesture-stop" disabled>关闭摄像头</button><button type="button" id="gesture-heat">开始烧水</button><button type="button" id="gesture-serve">出杯看看</button></div>
   <div class="gesture-livebar"><p id="gesture-status" role="status" aria-live="polite">尚未开启摄像头。也可用鼠标／触摸直接冲煮。</p><p id="gesture-readout" class="gesture-readout" aria-label="只读冲煮状态"></p><div class="gesture-live-controls"><div class="gesture-views" role="group" aria-label="选择台面视角"><button type="button" data-gesture-view="auto" aria-pressed="true">全景</button><button type="button" data-gesture-view="grind" aria-pressed="false">研磨</button><button type="button" data-gesture-view="brew" aria-pressed="false">冲煮</button></div><button type="button" id="gesture-preview-toggle" aria-expanded="true" aria-controls="gesture-preview">收起预览</button><span id="gesture-performance">识别目标 20 帧／秒</span></div></div>
   <div id="gesture-preview" class="gesture-preview"><video id="gesture-video" muted autoplay playsinline aria-label="仅本机处理的摄像头预览"></video><p id="gesture-preview-label">摄像头未开启</p></div>
   <dialog id="gesture-help-dialog" aria-labelledby="gesture-help-title"><h3 id="gesture-help-title">用手冲一杯，先从这里开始。</h3><div id="gesture-instructions"><p>指向器具 → 捏合选中 → 握拳拿起 → 移动 → 张掌释放。</p><p>悬停时器具泛起绿光，捏一下即可选中，焦糖色高亮表示已选中；选中后仍可自由移动光标。握拳时光标留在收指前的位置，再跟随手掌移动；不必用收起的食指瞄准。发光虚线圈提示放置区域。</p>
   <ul><li><b>研磨：</b>先把豆子放进磨豆机，捏合选中机身或木柄，握拳左右摇动或绕圈即可研磨，不必追着小木柄转。张掌停止。</li><li><b>烧水：</b>光标指向水壶上方的“开始烧水”，捏合一下开启；松开后再对准“停止烧水”捏合一下关闭。按钮实时显示加热状态；到温按原规则停止。</li><li><b>水壶：</b>选中后握拳拿起，移动才按原规则出水；张掌、手势不稳或丢手立即停水。壶嘴要移到滤杯圈的上方，不会自动对准。</li><li><b>装配与出杯：</b>选中后握拳拖到标出的区域，张掌放下。选中滤纸后再次捏合可折纸／转向；意式电源与萃取开关等也可再次捏合点按。法压壶安装压杆后，选中顶部旋钮，握拳下压。</li><li><b>这一版只管玩：</b>使用“进阶自由”的默认参数，暂不开放粉量、研磨、水温、流速调整。原有冲煮条件和结果反馈仍有效。</li><li><b>不用翻页：</b>冲煮台固定一屏，下方可切换视角。手机横屏更容易操作。鼠标／触摸优先接管，之后先张掌恢复手势。</li></ul>
   <p class="gesture-privacy">模型和画面仅在本机处理，不录制、不保存、不上传视频。只有你点击“开启摄像头”后才请求授权。</p></div>
   <div class="gesture-help-actions"><label>摄像头<select id="gesture-facing"><option value="user">前置（镜像）</option><option value="environment">后置</option></select></label><button type="button" id="gesture-check">检查本地模型</button></div><p id="gesture-help-status">正式网站可直接使用摄像头；本地开发请用 localhost 或可信的 HTTPS。</p><button type="button" id="gesture-ready">知道了，进入冲煮台</button></dialog>`;
  document.querySelector('.studio-title').insertAdjacentElement('afterend',panel);
  const cursor=document.createElement('div');cursor.className='gesture-cursor';cursor.hidden=true;cursor.setAttribute('aria-hidden','true');document.body.append(cursor);
  const highlightStyle=document.createElement('style');panel.append(highlightStyle);
  const $=id=>panel.querySelector('#'+id),video=$('gesture-video'),start=$('gesture-start'),stopButton=$('gesture-stop'),check=$('gesture-check'),facing=$('gesture-facing');
  let destroyed=false,worker=null,stream=null,generation=0,bootReject=null,raf=0,active=false,busy=false,lastSent=0,lastResult=0,lastVideo=-1,interval=1000/20,latency=35,nativeUntil=0,nativePointer=false,held=false,targetPoint=null,displayPoint=null,selected=null,hovered=null,glowKey='',pinching=false,indexSmooth=null,lastFrame=0,watchdogPaused=false,bootTimer=0,unfocused=false,mirror=true;
  const listeners=[];
  function listen(el,name,fn,options){el.addEventListener(name,fn,options);listeners.push(()=>el.removeEventListener(name,fn,options));}
  function say(text,state){$('gesture-status').textContent=text;$('gesture-help-status').textContent=text;if(state)panel.dataset.state=state;}
  function clearHighlight(){selected=hovered=null;glowKey='';highlightStyle.textContent='';}
  function paintGlows(){
   const key=(selected?.id||'')+'|'+(hovered?.id||'');if(key===glowKey)return;glowKey=key;
   const rule=(hit,color)=>hit&&/^[a-z][a-z-]*$/.test(hit.id)?`.gesture-mode #scene [data-object="${hit.id}"]{filter:drop-shadow(0 0 4px ${color}) drop-shadow(0 0 2px ${color})}`:'';
   highlightStyle.textContent=(hovered?.id!==selected?.id?rule(hovered,'#1f3d3480'):'')+rule(selected,'#b8794a');
  }
  function highlight(hit){selected=hit;paintGlows();adapter.guides?.(hit?.id||null);}
  function hover(hit){hovered=hit;paintGlows();}
  function hitTest(point){
   const stack=document.elementsFromPoint?.(point.x,point.y)||[document.elementFromPoint(point.x,point.y)];
   const el=stack.find(node=>node&&!node.closest('#scene-targets'));if(!el||el.closest('dialog:not([open])'))return null;
   const dialog=document.querySelector('dialog[open]');if(dialog&&!dialog.contains(el))return null;
   if(el.closest('.bed-svg')&&adapter.canPick('kettle'))return{id:'kettle',label:'粉床上的水壶落点',type:'object'};
   const object=el.closest('[data-object]');
   if(object&&adapter.scene.contains(object)&&!object.closest('.object-hidden,.studio-stowed')&&adapter.canPick(object.dataset.object))return{id:object.dataset.object,label:object.getAttribute('aria-label')||object.dataset.object,type:'object',grip:el.closest('[data-crank-handle]')?'crank':el.closest('[data-press-grip]')?'press':null};
   const control=el.closest('button,a[href],input[type="range"],summary');
   if(control&&!control.disabled&&control.getAttribute('aria-disabled')!=='true'&&!adapter.scene.contains(control))return{type:'control',element:control};
   return null;
  }
  const machine=new GestureCore.Machine({
   status:say,highlight,hover,hitTest,
   pointer:()=>displayPoint?{...displayPoint}:null,
   select:hit=>adapter.select(hit),
   grab(hit,point){if(!adapter.ready())return false;if(!displayPoint)displayPoint={...point};targetPoint={...point};return adapter.begin(hit,point);},
   cursor:point=>{targetPoint=point;},
   move:point=>{
    if(!targetPoint){targetPoint=point;return;}
    const dx=point.x-targetPoint.x,dy=point.y-targetPoint.y,d=Math.hypot(dx,dy);
    if(d>3)targetPoint={x:targetPoint.x+dx*(d-3)/d,y:targetPoint.y+dy*(d-3)/d};
   },
   release:point=>{held=false;adapter.release(displayPoint||point);targetPoint=point;},
   hold:on=>{held=on;adapter.hold(on);},
   tap:(hit,point)=>adapter.tap(hit,point),
   pause:options=>{held=false;adapter.pause(options);},
   control(hit,point){
    adapter.hold(false);adapter.clear?.();const el=hit.element;
    if(el.matches('input[type="range"]')){const r=el.getBoundingClientRect(),fraction=Math.max(0,Math.min(1,(point.x-r.left)/r.width)),min=Number(el.min)||0,max=Number(el.max)||100,step=Number(el.step)||1;el.value=String(min+Math.round(fraction*(max-min)/step)*step);el.dispatchEvent(new Event('input',{bubbles:true}));}
    else el.click();
    if(el===$('gesture-heat'))say(el.getAttribute('aria-pressed')==='true'?'烧水已开启：温度会逐渐上升。再次对准按钮捏合可停止。':'烧水已停止。再次对准按钮捏合可开启。');
    else say('已点按：'+(el.textContent||'操作按钮').trim());
   }
  });
  function pause(text,options){machine.pause(text,options);cursor.hidden=true;targetPoint=displayPoint=indexSmooth=null;pinching=false;}
  function stop(text='摄像头已关闭。冲煮进度保留，可用鼠标／触摸继续。'){
   generation++;active=false;document.body.classList.remove('gesture-camera-active');cancelAnimationFrame(raf);raf=0;clearTimeout(bootTimer);bootReject?.(new Error('cancelled'));bootReject=null;
   pause(text);stream?.getTracks().forEach(track=>track.stop());stream=null;video.pause();video.srcObject=null;
   if(worker){try{worker.postMessage({type:'close'});}catch{}worker.terminate();worker=null;}
   busy=false;start.disabled=false;check.disabled=false;stopButton.disabled=true;start.textContent='开启摄像头';$('gesture-preview-label').textContent='摄像头未开启';
  }
  function failure(error){
   const code=error?.name;let reason=code==='NotAllowedError'?'摄像头授权被拒绝。请在浏览器地址栏允许此本地站点使用摄像头，再重试。':code==='NotFoundError'?'未找到摄像头，请连接设备后重试。':code==='NotReadableError'?'摄像头无法使用，可能正被其他应用占用。关闭其他应用后重试。':code==='OverconstrainedError'?'当前摄像头不支持所选方向，请切换前／后置后重试。':'识别资源或摄像头启动失败。请确认本地模型完整、使用支持 WebAssembly／Web Worker 的浏览器后重试。';
   stop(reason);start.textContent='重试开启摄像头';console.warn('[手势冲煮]',error?.message||error);
  }
  async function boot(){
   worker=new Worker(new URL('gesture-worker.js',document.baseURI),{type:'module'});const instance=worker;
   return new Promise((resolve,reject)=>{
    bootReject=reject;bootTimer=setTimeout(()=>reject(new Error('模型初始化超时')),45000);
    worker.onerror=event=>reject(new Error(event.message||'Worker 加载失败'));
    worker.onmessage=({data})=>{
     if(worker!==instance)return;
     if(data.type==='ready'){clearTimeout(bootTimer);bootReject=null;worker.onerror=event=>failure(new Error(event.message||'识别线程停止'));resolve();}
     else if(data.type==='error'){if(bootReject){reject(new Error(data.message));}else failure(new Error(data.message));}
     else if(data.type==='result')receive(data);
    };
    worker.postMessage({type:'init'});
   });
  }
  async function begin(checkOnly=false){
   stop();const run=generation;start.disabled=check.disabled=true;stopButton.disabled=false;say(checkOnly?'正在检查本地模型，不会开启摄像头…':'正在加载本地模型，随后由浏览器请求摄像头授权…');
   try{
    if(!checkOnly&&(!isSecureContext||!navigator.mediaDevices?.getUserMedia)){stop('此地址不是可用的摄像头安全环境。电脑请用 localhost；手机需可信的局域网 HTTPS，或 Android USB 端口转发到 localhost。');return;}
    if(!window.Worker||!window.OffscreenCanvas||!window.createImageBitmap)throw new Error('浏览器缺少离线程识别支持');
    await boot();if(destroyed||run!==generation)return;
    if(checkOnly){stop('本地模型检查通过：WASM 已完成一次空白画面推理；未开启摄像头。');return;}
    const tracks=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing.value},width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}}});
    if(destroyed||run!==generation){tracks.getTracks().forEach(t=>t.stop());return;}
    stream=tracks;stream.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{if(active)stop('摄像头已断开。进度保留，请重新开启。');},{once:true}));
    video.srcObject=stream;await video.play();if(destroyed||run!==generation)return;
    active=true;busy=false;lastSent=lastVideo=0;lastResult=performance.now();lastFrame=0;watchdogPaused=false;
    const actualFacing=stream.getVideoTracks()[0]?.getSettings?.().facingMode;
    mirror=(actualFacing||facing.value)==='user';video.classList.toggle('mirrored',mirror);document.body.classList.add('gesture-camera-active');$('gesture-preview-label').textContent='画面仅在本机处理';
    pause('摄像头已开启。把完整的单手放入画面，先张掌保持片刻。');raf=requestAnimationFrame(tick);
   }catch(error){if(run===generation&&!destroyed)failure(error);}
  }
  function receive(data){
   busy=false;if(!active)return;const now=performance.now();
   if(now-data.timestamp>400){pause('识别响应较慢，已暂停操作。先张掌，再重新选择。');return;}
   latency=latency*.8+data.elapsed*.2;interval=Math.max(1000/24,Math.min(125,latency*1.7));
   $('gesture-performance').textContent=`识别约 ${Math.round(1000/interval)} 帧／秒 · 动画独立运行`;
   if(unfocused||nativePointer||now<nativeUntil)return;
   const result=data.score>=.65?GestureCore.classify(data.landmarks,{width:video.videoWidth,height:video.videoHeight,pinching}):null;
   if(!result){if(machine.state!=='paused')pause();$('gesture-preview-label').textContent='未识别到完整单手，请调整距离与光线';return;}
   lastResult=now;watchdogPaused=false;pinching=result.pose==='pinch';$('gesture-preview-label').textContent='已识别手部 · '+({point:'指向',pinch:'捏合',fist:'握拳',open:'张掌',neutral:'调整手势'}[result.pose]);
   const screen=p=>GestureCore.mapPoint(p,{width:innerWidth,height:innerHeight,mirror}),index=screen(result.index),palm=screen(result.palm);
   if(!indexSmooth)indexSmooth=index;else indexSmooth={x:indexSmooth.x+(index.x-indexSmooth.x)*.8,y:indexSmooth.y+(index.y-indexSmooth.y)*.8};
   machine.step({...result,index:indexSmooth,palm,confidence:data.score},now);
  }
  async function capture(now){
   if(busy||video.readyState<2||video.currentTime===lastVideo||now-lastSent<interval)return;
   busy=true;lastSent=now;lastVideo=video.currentTime;const run=generation;
   try{
    const bitmap=await createImageBitmap(video,{resizeWidth:640,resizeHeight:Math.max(1,Math.round(video.videoHeight/video.videoWidth*640))});
    if(!active||run!==generation){bitmap.close();busy=false;return;}
    worker.postMessage({type:'frame',bitmap,timestamp:now},[bitmap]);
   }catch(error){busy=false;if(run===generation)failure(error);}
  }
  function tick(now){
   if(!active)return;const dt=Math.min(64,lastFrame?now-lastFrame:16);lastFrame=now;
   if(machine.state!=='paused'&&!unfocused&&!nativePointer&&now>=nativeUntil&&now-lastResult>400&&!watchdogPaused){watchdogPaused=true;pause('手部追踪超时，操作已暂停。先张掌，再重新选择。');}
   if(targetPoint&&!nativePointer&&now>=nativeUntil&&machine.state!=='paused'){
    if(!displayPoint)displayPoint={...targetPoint};const alpha=1-Math.exp(-dt/38);
    displayPoint.x+=(targetPoint.x-displayPoint.x)*alpha;displayPoint.y+=(targetPoint.y-displayPoint.y)*alpha;
    cursor.hidden=false;cursor.style.transform=`translate(${displayPoint.x}px,${displayPoint.y}px)`;cursor.dataset.state=machine.state;
    if(machine.state==='grabbed'&&held)adapter.move(displayPoint);
   }
   capture(now);raf=requestAnimationFrame(tick);
  }
  listen(start,'click',()=>begin(false));listen(check,'click',()=>begin(true));listen(stopButton,'click',()=>stop());
  listen(facing,'change',()=>{if(active)begin(false);});
  listen($('gesture-preview-toggle'),'click',()=>{const hidden=!$('gesture-preview').hidden;$('gesture-preview').hidden=hidden;$('gesture-preview-toggle').setAttribute('aria-expanded',String(!hidden));$('gesture-preview-toggle').textContent=hidden?'展开预览':'收起预览';});
  listen($('gesture-help'),'click',()=>{pause('操作说明已打开。关闭后先张掌恢复。');$('gesture-help-dialog').showModal();});
  listen($('gesture-ready'),'click',()=>{$('gesture-help-dialog').close();});
  listen($('gesture-serve'),'click',()=>{const serve=document.querySelector('#quick-serve');if(serve.disabled){say('正在完成器具动作，请稍后再出杯。');return;}pause('正在出杯，沿用原工坊的结果反馈。');serve.click();});
  $('gesture-heat').hidden=!['melitta','chemex'].includes(tool);
  listen($('gesture-heat'),'click',()=>{document.querySelector('#heat-control')?.click();syncReadout();});
  panel.querySelectorAll('[data-gesture-view]').forEach(button=>listen(button,'click',()=>{
   pause('视角已切换，先张掌再重新选择。');
   panel.querySelectorAll('[data-gesture-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   document.dispatchEvent(new CustomEvent('coffee-camera',{detail:{view:button.dataset.gestureView}}));
  }));
  listen(window,'resize',()=>{if(active)pause('屏幕尺寸已变化，先张掌再继续。');});
  listen(document,'pointerdown',event=>{if(!active||!event.isTrusted)return;nativePointer=true;nativeUntil=performance.now()+800;pause('鼠标／触摸已接管。结束操作后，先张掌恢复手势。',{handoff:true});},true);
  listen(document,'pointerup',()=>{nativePointer=false;nativeUntil=performance.now()+800;},true);
  listen(document,'pointercancel',()=>{nativePointer=false;nativeUntil=performance.now()+800;},true);
  listen(document,'keydown',event=>{if(active&&event.isTrusted){nativeUntil=performance.now()+800;pause('键盘已接管。先张掌恢复手势。',{handoff:true});}},true);
  listen(document,'visibilitychange',()=>{if(document.hidden)stop('页面已隐藏，摄像头已关闭。返回后需主动重新开启。');});
  listen(window,'focus',()=>{unfocused=false;});
  listen(window,'blur',()=>{unfocused=true;if(active)pause('窗口失焦，操作已暂停。先张掌恢复。');});
  listen(document,'coffee-camera',()=>{if(active)pause('视角已切换。先张掌，再重新选择器具。');});
  listen(document,'scroll',()=>{if(active&&machine.state==='grabbed')pause('页面滚动，抓取已暂停。先张掌再继续。');},true);
  listen(document,'toggle',event=>{if(event.target.matches?.('dialog[open]')&&active)pause('面板已打开，台面操作暂停。关闭后先张掌继续。');},true);
  listen(window,'pagehide',()=>stop());
  current={destroy(){if(destroyed)return;destroyed=true;stop();listeners.forEach(f=>f());clearHighlight();panel.remove();cursor.remove();document.body.classList.remove('gesture-mode');}};
  let readoutObserver=null;
  function syncReadout(){
   const value=id=>(document.querySelector('#'+id)?.textContent||'0').trim().replace(/\s+/g,' ');
   $('gesture-readout').textContent=`粉 ${value('live-dose')} · 水 ${value('live-water')} · ${value('live-temp')}`;
   const heating=document.querySelector('#heat-control')?.textContent.includes('停止');
   $('gesture-heat').textContent=heating?'停止烧水':'开始烧水';$('gesture-heat').setAttribute('aria-pressed',String(Boolean(heating)));
  }
  syncReadout();if(typeof MutationObserver!=='undefined'){
   readoutObserver=new MutationObserver(syncReadout);
   for(const node of [document.querySelector('.live-dashboard'),document.querySelector('#free-controls')])if(node)readoutObserver.observe(node,{subtree:true,childList:true,characterData:true});
  }
  let layoutObserver=null,heatObserver=null;
  function placeHeat(){
   const heat=$('gesture-heat'),matrix=adapter.scene.getScreenCTM?.();if(destroyed||heat.hidden||!matrix)return;
   // Anchor to the water station, not the draggable kettle, so the switch never chases a hand.
   const rect=adapter.scene.getBoundingClientRect(),button=heat.getBoundingClientRect();
   const x=matrix.a*725+matrix.c*240+matrix.e,y=matrix.b*725+matrix.d*240+matrix.f;
   heat.style.left=`${Math.max(rect.left+8,Math.min(rect.right-button.width-8,x-button.width/2))}px`;
   heat.style.top=`${Math.max(rect.top+8,Math.min(rect.bottom-button.height-8,y-button.height-8))}px`;
  }

  function fitStage(){document.body.style.setProperty('--gesture-top',`${Math.ceil(panel.getBoundingClientRect().height)+8}px`);document.body.style.setProperty('--gesture-bottom',`${Math.ceil(panel.querySelector('.gesture-livebar').getBoundingClientRect().height)+8}px`);placeHeat();}
  if(typeof ResizeObserver!=='undefined'){layoutObserver=new ResizeObserver(fitStage);layoutObserver.observe(panel);layoutObserver.observe(panel.querySelector('.gesture-livebar'));layoutObserver.observe(adapter.scene);}
  if(typeof MutationObserver!=='undefined'){heatObserver=new MutationObserver(placeHeat);heatObserver.observe(adapter.scene,{attributes:true,attributeFilter:['viewBox']});}
  fitStage();const destroy=current.destroy;current.destroy=()=>{readoutObserver?.disconnect();layoutObserver?.disconnect();heatObserver?.disconnect();document.body.style.removeProperty('--gesture-top');document.body.style.removeProperty('--gesture-bottom');destroy();};
  document.dispatchEvent(new CustomEvent('coffee-gesture-mounted'));
  $('gesture-help-dialog').showModal();
  return current;
 }
 document.querySelectorAll('[data-play-mode="gesture"]').forEach(button=>{button.hidden=!available;});
 window.CoffeeGesture={local,available,bind,mount,renderGuides,destroy(){current?.destroy();current=null;}};
})();
