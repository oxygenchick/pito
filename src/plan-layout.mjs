// Scale the entire authored popup uniformly, never its individual panels.
export function planScale(width,height) {
 return Math.max(.1,Math.min(1,(width-12)/400,(height-12)/720));
}
export function installPlanLayout(root) {
 const update=()=>{
  const {width,height}=root.getBoundingClientRect();
  root.style.setProperty('--plan-scale',String(planScale(width,height)));
  root.style.setProperty('--money-scale',String(Math.max(.1,Math.min(1,(width-12)/400,(height-12)/684))));
 };
 const observer=new ResizeObserver(update);
 observer.observe(root);update();
 return ()=>observer.disconnect();
}
