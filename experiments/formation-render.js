// Exercise each shader/render-list variant before the canvas is revealed. This
// also uploads textures and allocates the transmission pass, which compile()
// alone does not do. The final render restores the requested starting frame;
// intermediate warm-up frames never reach a browser paint.
export function primeFormation(renderer,scene,camera,model,progress){
 try{
  for(const value of [.34,.5,.8,1]){
   model.formation(value);
   renderer.render(scene,camera);
  }
 }finally{
  model.formation(progress);
  renderer.render(scene,camera);
 }
}
