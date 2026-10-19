import {ITEMS,GOALS} from './item-catalog.mjs';

const definitions={
 save:{id:'daily-save',title:'День мечты',icon:'jar',action:'goal',description:'Сегодня не покупай хотелки и отложи штучки на мечту.'},
 wants:{id:'daily-wants',title:'День хотелок',icon:'kite',action:'shop',description:'Сегодня купи одну или несколько хотелок и ничего не откладывай в копилку.'},
 deposit:{id:'daily-deposit',title:'Вклад побольше',icon:'bank',action:'bank',description:'Ты уже попробовал вклад. Теперь положи на него больше 10 штучек.'}
};
// Optional day-long experiments are assigned before planning, never mid-day.
export const returnedDeposit=s=>(s.ledger||[]).some(e=>e.kind==='bank-out'&&e.amount>0);
export const ongoingDream=s=>s.onboarding?.version===2&&Boolean(s.missions?.save)&&(s.goalsWon||[]).length<2&&!(s.goalsWon||[]).includes(s.goal);
export function challengeFitsPlan(s,parts=s.plan){
 const d=s.dailyChallenge;
 if(!d||d.cycle!==s.cycle||d.status!=='active'||!parts)return true;
 return d.kind==='save'?parts[1]===0&&parts[2]>0:d.kind==='wants'?parts[1]>=Math.min(...ITEMS.filter(i=>!s.owned.includes(i.id)).map(i=>i.price))&&parts[2]===0:parts.reduce((a,b)=>a+b,0)+11<=s.wallet;
}
export function assignDailyChallenge(s){
 if(s.plan||s.dailyChallenge?.cycle===s.cycle||!s.missions?.save||s.cycle<2||ongoingDream(s))return null;
 // Do not replace the bank introduction while it is still being learned.
 if(s.onboarding?.version===2&&!s.missions?.deposit)return null;
 const history=(s.periods||[]).filter(p=>p.dailyChallenge);
 // Keep at least one ordinary day between experiments, including missed ones.
 if(history.some(p=>p.cycle>=s.cycle-1))return null;
 if((s.ledger||[]).some(e=>e.cycle>=s.cycle-1&&(e.kind==='bank-in'||e.kind==='bank-out'||e.source==='savings')))return null;
 const hasGoal=GOALS.some(g=>g.id===s.goal&&!s.goalsWon.includes(g.id)&&g.price>s.savings);
 const canBuy=ITEMS.some(i=>!s.owned.includes(i.id)&&i.price<=s.wallet-4);
 const canDeposit=returnedDeposit(s)&&!s.deposit&&s.cycle>=3&&s.wallet>=15&&Boolean(s.missions?.goal);
 const completed=new Set(history.filter(p=>p.dailyChallenge.status==='done').map(p=>p.dailyChallenge.kind));
 if(s.missions?.['deposit-big'])completed.add('deposit');
 const kind=['save','wants','deposit'].find(k=>!completed.has(k)&&(k==='save'?hasGoal&&s.wallet>=5:k==='wants'?canBuy:canDeposit));
 s.dailyChallenge=kind?{kind,cycle:s.cycle,status:'active'}:null;
 return s.dailyChallenge;
}
export function currentDailyChallenge(s){
 const d=s.dailyChallenge;
 return !ongoingDream(s)&&d?.cycle===s.cycle&&d.status==='active'&&definitions[d.kind]?{...definitions[d.kind],action:s.plan?definitions[d.kind].action:'plan',reward:0,optional:true}:null;
}
export function finishDailyChallenge(s){
 const d=s.dailyChallenge;
 if(!d||d.cycle!==s.cycle||!definitions[d.kind])return null;
 if(ongoingDream(s)&&d.status==='active')d.status='skipped';
 if(d.status==='skipped')return {...d};
 if(d.status!=='active')return null;
 const entries=s.ledger.filter(e=>e.cycle===s.cycle);
 const wants=entries.filter(e=>e.kind==='expense'&&e.category==='wants'&&e.source!=='savings').reduce((n,e)=>n+e.amount,0);
 const saved=entries.filter(e=>e.kind==='transfer'&&e.amount>0).reduce((n,e)=>n+e.amount,0);
 const netSaved=entries.filter(e=>e.kind==='transfer').reduce((n,e)=>n+e.amount,0);
 const deposited=entries.some(e=>e.kind==='bank-in'&&e.amount>10);
 d.status=(d.kind==='save'?wants===0&&netSaved>0:d.kind==='wants'?wants>0&&saved===0:deposited)?'done':'missed';
 return {...d};
}
