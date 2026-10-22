// Progressive enhancement: keep all original SVGs and teaching controls intact.
const section=document.querySelector('#equipment');
const display=section?.querySelector('#lesson-brewer-display');
if(display){
 let viewer=null,loading=false,visible=false,disposed=false,failed=false;
 const selected=()=>section.querySelector('[data-learn-brewer][aria-pressed="true"]')?.dataset.learnBrewer||'melitta';
 const stage=document.createElement('div');stage.className='brewer-3d-stage';stage.tabIndex=0;stage.setAttribute('role','img');
 const controls=document.createElement('div');controls.className='brewer-3d-controls';controls.hidden=true;
 controls.innerHTML='<p>左右拖动，换个角度看看</p><button type="button" data-model-replay>重看成器 ↻</button><button type="button" data-model-inspect aria-pressed="false">提起滤纸 ↗</button><button type="button" data-model-reset>回到正面</button>';
 display.append(stage);display.after(controls);
 function fallback(){failed=true;display.classList.remove('brewer-3d-ready');controls.hidden=true;stage.hidden=true;display.dataset.modelState='fallback';}
 async function load(){
  if(viewer||loading||failed||disposed)return;loading=true;
  try{
   const {createClassroomBrewer}=await import('./experiments/classroom-brewer.js');
   if(disposed)return;
   viewer=createClassroomBrewer({stage,controls,tool:selected(),onError:fallback});
   if(failed){viewer.dispose();return;}
   display.classList.add('brewer-3d-ready');display.dataset.modelState='ready';controls.hidden=false;
   viewer.setVisible(visible);
  }catch(error){console.warn('Classroom model unavailable:',error);fallback();}
  finally{loading=false;}
 }
 const selection=new MutationObserver(()=>{viewer?.select(selected());});
 selection.observe(section.querySelector('.brewer-selector'),{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
 // Do not load WebGL or animate while reading other chapters.
 const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)load();viewer?.setVisible(visible);},{threshold:0});
 visibility.observe(display);
 addEventListener('pagehide',event=>{if(event.persisted)return;disposed=true;selection.disconnect();visibility.disconnect();viewer?.dispose();},{once:false});
}
