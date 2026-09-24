// Presentation only: separate pupils follow the pointer without changing game state.
export function gazeOffset(x,y,rect){
 const clamp=v=>Math.max(-1,Math.min(1,v));
 if(!rect||![x,y,rect.left,rect.top,rect.width,rect.height].every(Number.isFinite))return {x:0,y:0};
 return {x:clamp((x-rect.left-rect.width/2)/Math.max(rect.width,1)),y:clamp((y-rect.top-rect.height/2)/Math.max(rect.height,1))};
}
export function installGaze(root){
 if(!root||root.dataset.gazeInstalled)return;
 root.dataset.gazeInstalled='true';
 const move=event=>root.querySelectorAll('[data-pet]').forEach(pet=>{
  if(pet.closest?.('.event-pet')){pet.style.setProperty('--gaze-x','0');pet.style.setProperty('--gaze-y','-.35');return;}
  // The button includes empty space above a young pet: gaze must originate at its eyes.
  const face=pet.querySelector('.pet-eyes')||pet;
  const offset=gazeOffset(event.clientX,event.clientY,face.getBoundingClientRect());
  pet.style.setProperty('--gaze-x',offset.x.toFixed(3));
  pet.style.setProperty('--gaze-y',offset.y.toFixed(3));
 });
 const reset=()=>root.querySelectorAll('[data-pet]').forEach(pet=>{pet.style.removeProperty('--gaze-x');pet.style.removeProperty('--gaze-y');});
 root.addEventListener('pointermove',move,{passive:true});
 root.addEventListener('pointerdown',move,{passive:true});
 root.addEventListener('pointerleave',reset,{passive:true});
 root.addEventListener('pointercancel',reset,{passive:true});
 root.addEventListener('pointerup',event=>{if(event.pointerType==='touch')reset();},{passive:true});
}
