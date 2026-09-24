export const missionRoute=id=>({feed:'food',wash:'rain',plan:'plan',replan:'plan',goal:'choose-goal',save:'goal','paid-food':'food',buy:'shop',deposit:'bank'}[id]||'close');
export function stepChoice(items,current,step){
 if(!items.length)return null;
 const index=Math.max(0,items.findIndex(x=>x.id===current));
 return items[(index+(Number(step)<0?-1:1)+items.length)%items.length].id;
}
