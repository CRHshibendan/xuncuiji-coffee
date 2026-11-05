/* Fixed, local MediaPipe assets; frames never leave this worker/origin. */
import {FilesetResolver,HandLandmarker} from './vendor/mediapipe/vision_bundle.mjs';
let detector=null;
const loaded={wasm:0,model:0};let lastProgress=0;
async function asset(path,key){
 const response=await fetch(new URL(path,import.meta.url));
 if(!response.ok)throw new Error(`识别资源下载失败（${response.status}）：${key}`);
 const report=size=>{loaded[key]=size;const now=performance.now();if(now-lastProgress>200){lastProgress=now;postMessage({type:'progress',loaded:loaded.wasm+loaded.model});}};
 if(!response.body){const buffer=await response.arrayBuffer();report(buffer.byteLength);return new Uint8Array(buffer);}
 const reader=response.body.getReader(),chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);size+=value.byteLength;report(size);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 return bytes;
}
self.onmessage=async({data})=>{
 try{
  if(data.type==='init'){
   const files=await FilesetResolver.forVisionTasks(new URL('./vendor/mediapipe/wasm',import.meta.url).href,true);
   postMessage({type:'progress',loaded:0});
   // Download both large assets together; only publish ready after real inference.
   const [wasm,model]=await Promise.all([asset('./vendor/mediapipe/wasm/vision_wasm_module_internal.wasm','wasm'),asset('./vendor/mediapipe/hand_landmarker.task','model')]);
   const wasmURL=URL.createObjectURL(new Blob([wasm],{type:'application/wasm'}));
   try{
    postMessage({type:'progress',phase:'initializing',loaded:wasm.byteLength+model.byteLength});
    detector=await HandLandmarker.createFromOptions({...files,wasmBinaryPath:wasmURL},{baseOptions:{modelAssetBuffer:model,delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.6});
   }finally{URL.revokeObjectURL(wasmURL);}
   // Exercise the real WASM/model pipeline without asking for a camera.
   const canvas=new OffscreenCanvas(320,240);canvas.getContext('2d').fillRect(0,0,320,240);
   detector.detectForVideo(canvas,0);
   postMessage({type:'ready'});
  }else if(data.type==='frame'){
   const began=performance.now();
   try{const result=detector.detectForVideo(data.bitmap,data.timestamp);postMessage({type:'result',landmarks:result.landmarks[0]||null,score:result.handedness[0]?.[0]?.score||0,elapsed:performance.now()-began,timestamp:data.timestamp});}
   finally{data.bitmap.close();}
  }else if(data.type==='close'){detector?.close();detector=null;self.close();}
 }catch(error){postMessage({type:'error',message:String(error.message||error)});}
};
