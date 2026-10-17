import {MISSIONS} from './missions.mjs';
export const missionRoute=id=>({'intro-play':'intro-play','follow-plan':'plan'}[id]||MISSIONS.find(m=>m.id===id)?.action||'close');
export function stepChoice(items,current,step){
 if(!items.length)return null;
 const index=Math.max(0,items.findIndex(x=>x.id===current));
 return items[(index+(Number(step)<0?-1:1)+items.length)%items.length].id;
}
