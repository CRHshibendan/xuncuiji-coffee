/* Fixed, local MediaPipe assets; frames never leave this worker/origin. */
import {FilesetResolver,HandLandmarker} from './vendor/mediapipe/vision_bundle.mjs';
let detector=null;
self.onmessage=async({data})=>{
 try{
  if(data.type==='init'){
   const files=await FilesetResolver.forVisionTasks(new URL('./vendor/mediapipe/wasm',import.meta.url).href,true);
   detector=await HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:new URL('./vendor/mediapipe/hand_landmarker.task',import.meta.url).href,delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.65,minHandPresenceConfidence:.65,minTrackingConfidence:.6});
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
