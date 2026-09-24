import {ITEMS,GOALS,LEGACY_ITEM_NAMES} from './item-catalog.mjs';
export {ITEMS,GOALS} from './item-catalog.mjs';
import {applyMissionEvent as emitAction,migrateMissions} from './missions.mjs';
export {MISSIONS,missionStatus,currentMission,completeMission,deferMission,applyMissionEvent} from './missions.mjs';
export const VERSION = 1;
export const CYCLE_SECONDS = 480;
export const DEPOSIT_BONUS = 5;
// Deliberately generous game economy: odd amounts round up once on opening.
// Only one deposit can run, and its proceeds stay locked for a whole game day.
export const depositBonus = amount => Number.isSafeInteger(amount)&&amount>0?Math.ceil(amount/2):0;
export const POOP_DIRT = 8;
export const pieceWord = n => n%100>=11&&n%100<=14?'штучек':n%10===1?'штучку':n%10>=2&&n%10<=4?'штучки':'штучек';
export const FOOD = [
 {id:'apple',name:'Яблоко',price:2,gain:40}, {id:'porridge',name:'Каша',price:3,gain:40},
 {id:'soup',name:'Суп',price:4,gain:60}, {id:'sandwich',name:'Бутерброд',price:5,gain:80}
];
export const TASKS = [
 {name:'Нужно или хочется?',theme:'Покупки',lesson:'Еда нужна каждый день. Настолку можно купить позже.'},
 {name:'Обед на 5',theme:'Покупки',lesson:'Сравнили цену и сытость. На обед хватило.'},
 {name:'На три дела',theme:'Планирование',lesson:'Сначала оставили на заботу. Остальное распределили сами.'},
 {name:'Шаг к мечте',theme:'Накопления',lesson:'Можно приближать мечту и оставлять деньги на еду.'},
 {name:'Сейчас или потом?',theme:'Накопления',lesson:'Выбирай: покупка сейчас или мечта позже.'},
 {name:'Нужен дождик',theme:'Планирование',lesson:'Планы можно менять, когда появляется важная трата.'}
];
export const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
const initialIncome=()=>({cycle:1,kind:'income',amount:20,label:'Первые карманные штучки',category:'',source:'initial'});
export function createProfile(name='Пито',color=0,hair=0,now=Date.now()) {
 return {version:VERSION,name:name.trim().slice(0,24)||'Пито',color:clamp(color,0,2),hair:clamp(hair,0,2),petType:'slime',variant:'pita',stage:0,antennae:null,pendingGrowth:false,adultNotice:false,growthPoints:0,periods:[],cycle:1,completedCycles:0,elapsed:0,cycleCare:0,needs:{food:25,affection:65,clean:85},wallet:0,savings:0,goal:'console',owned:[],goalsWon:[],shelfSeen:false,pendingPurchase:null,onboardingPaid:true,initialMoneyGranted:false,pendingIncome:null,pendingReward:null,tutorial:'money',giftUsed:false,trialUsed:false,rainHintSeen:false,missions:{},poops:[],nextPoopId:1,poopClock:0,plan:null,plans:[],ledger:[],tasks:[],taskAnswers:{},review:false,deposit:null,water:0,speed:1,lastSeen:now,finaleSeen:false};
}
export function restore(raw,now=Date.now()) {
 try {const s=JSON.parse(raw);if(s?.version!==VERSION||!s.needs||!Array.isArray(s.ledger)||!Array.isArray(s.tasks)||!Number.isFinite(s.wallet)||s.wallet<0||!['money','meet','food','fed','wash','washed','plan','done'].includes(s.tutorial))return null;
 for(const k of ['food','affection','clean'])if(!Number.isFinite(s.needs[k]))return null;
 const base=createProfile();const p={...base,...s,needs:{...s.needs},onboardingPaid:s.onboardingPaid===true};
 if(p.onboardingPaid&&p.tutorial==='plan'&&!p.giftUsed&&!p.plan)p.tutorial='meet';
 p.initialMoneyGranted=p.onboardingPaid?(s.initialMoneyGranted===true||s.ledger.some(e=>e.source==='initial')):true;
 p.pendingIncome=s.pendingIncome&&Number.isFinite(s.pendingIncome.amount)&&s.pendingIncome.amount>0?{...s.pendingIncome}:null;
 p.pendingReward=s.pendingReward&&Number.isInteger(s.pendingReward.amount)&&s.pendingReward.amount>0?{...s.pendingReward}:null;
 for(const key of ['owned','goalsWon','poops','plans','periods'])if(!Array.isArray(p[key]))p[key]=[];
 p.missions=p.missions&&typeof p.missions==='object'?p.missions:{};
 p.shelfSeen=typeof s.shelfSeen==='boolean'?s.shelfSeen:(p.owned.length+p.goalsWon.length>0);
 p.pendingPurchase=s.pendingPurchase&&[...ITEMS,...GOALS].some(i=>i.id===s.pendingPurchase.id)&&[...p.owned,...p.goalsWon].includes(s.pendingPurchase.id)?{...s.pendingPurchase}:null;
 p.speed=[0,1,3,10].includes(p.speed)?p.speed:1;
 p.stage=Number.isInteger(p.stage)?clamp(p.stage,0,2):0;
 p.growthPoints=Math.max(Number.isFinite(p.growthPoints)?p.growthPoints:0,p.stage===2?10:p.stage===1?4:0,p.pendingGrowth?4:0);
 // Legacy saves waited for an antenna choice. Growth is now automatic, but its
 // announcement still needs an explicit acknowledgement before the next day.
 if(p.pendingGrowth){p.stage=Math.max(1,p.stage);p.antennae=0;p.pendingGrowth=false;p.adultNotice=true;}
 p.elapsed=Number.isFinite(p.elapsed)?clamp(p.elapsed,0,CYCLE_SECONDS):0;
 p.savings=Number.isFinite(p.savings)&&p.savings>=0?p.savings:0;
 p.lastSeen=Number.isFinite(p.lastSeen)?p.lastSeen:now;
 if(!p.onboardingPaid&&!p.ledger.some(e=>e.source==='initial'))p.ledger.unshift(initialIncome());
 // Old builds may have fractional balances. Never silently lose those coins or
 // rewrite historical expenses: credit the difference in a service period.
 const rounding={wallet:0,savings:0};
 for(const pocket of ['wallet','savings']){
  const rounded=Math.ceil(p[pocket]),amount=rounded-p[pocket];
  if(amount>0){
   p[pocket]=rounded;rounding[pocket]=amount;
   p.ledger.push({cycle:0,kind:'income',amount,label:'Округление старого баланса',category:'',source:'migration-rounding',pocket});
  }
 }
 if(rounding.wallet||rounding.savings){
  p.migrationNotice='Дробные штучки округлили в твою пользу. Теперь все суммы целые.';
  p.migrationRounding=rounding;
 }
 // Improve still-open deposits from the previous offer; never rewrite paid income.
 if(p.deposit?.principal===10&&p.deposit.bonus===1){
  p.deposit={...p.deposit,bonus:DEPOSIT_BONUS};
  p.migrationNotice=[p.migrationNotice,'Доход по твоему вкладу теперь 5 штучек. Срок не изменился.'].filter(Boolean).join(' ');
 }
 migrateMissions(p);
 // Offline time is deliberately gentle: at most the remainder of ONE active day,
 // never a day still being planned, tutorial, review, or developer pause.
 const away=Math.max(0,Math.min(CYCLE_SECONDS-p.elapsed,(now-p.lastSeen)/1000));
 if(p.tutorial==='done'&&p.plan&&!p.review&&!p.pendingGrowth&&!p.adultNotice&&!p.pendingIncome&&!p.pendingReward&&!p.pendingPurchase&&p.speed!==0){decay(p,away);p.elapsed+=away;}
 p.ledger=p.ledger.map(entry=>LEGACY_ITEM_NAMES[entry.label]&&LEGACY_ITEM_NAMES[entry.label]!==entry.label?{...entry,originalLabel:entry.originalLabel||entry.label,label:LEGACY_ITEM_NAMES[entry.label]}:entry);
 p.lastSeen=now;return p;}catch{return null;}
}
export function grantInitialMoney(s){
 if(!s.onboardingPaid||s.tutorial!=='money'||s.initialMoneyGranted||s.ledger.some(e=>e.source==='initial'))return false;
 s.wallet+=20;s.ledger.push(initialIncome());s.initialMoneyGranted=true;s.tutorial='meet';s.pendingIncome={amount:20,source:'initial',cycle:s.cycle};return true;
}
export function acknowledgeIncome(s){if(!s.pendingIncome)return false;s.pendingIncome=null;return true;}
export function acknowledgeGrowth(s){if(!s.adultNotice&&!s.pendingGrowth)return false;if(s.pendingGrowth){s.stage=Math.max(1,s.stage);s.antennae=0;s.pendingGrowth=false;}s.adultNotice=false;return true;}
export function acknowledgePurchase(s){if(!s.pendingPurchase)return null;const purchase=s.pendingPurchase;s.pendingPurchase=null;s.shelfSeen=true;return purchase;}
export function record(s,kind,amount,label,category=''){s.ledger.push({cycle:s.cycle,kind,amount,label,category});}
export function canSpend(s,amount){return (s.tutorial==='done'&&!!s.plan||s.onboardingPaid&&['food','wash'].includes(s.tutorial))&&!s.review&&!s.pendingGrowth&&!s.adultNotice&&!s.pendingIncome&&!s.pendingReward&&Number.isInteger(amount)&&amount>=0&&s.wallet>=amount;}
function spend(s,amount,label,category){if(!canSpend(s,amount))return false;s.wallet-=amount;record(s,'expense',amount,label,category);return true;}
export function meet(s){if(s.tutorial==='meet'&&!s.pendingIncome&&!s.pendingReward){s.tutorial='food';return true;}return false;}
export function feed(s,id){const f=FOOD.find(x=>x.id===id);if(!f||s.needs.food>=100)return false;
 if(s.onboardingPaid&&s.tutorial==='food'){
  if(id!=='apple'||s.giftUsed||!spend(s,f.price,f.name,'food'))return false;
  s.ledger.at(-1).source='tutorial:feed';s.giftUsed=true;s.needs.food=clamp(s.needs.food+f.gain);s.tutorial='fed';s.cycleCare++;emitAction(s,'fed',{target:id,free:false,first:true,amount:f.price});return true;
 }
 if(!s.onboardingPaid&&s.tutorial==='food'&&!s.giftUsed&&id==='apple'){s.giftUsed=true;s.needs.food=75;s.tutorial='fed';emitAction(s,'fed',{target:id,free:true,first:true,amount:0});return true;}
 if(s.tutorial!=='done'||!spend(s,f.price,f.name,'food'))return false;s.needs.food=clamp(s.needs.food+f.gain);s.cycleCare++;emitAction(s,'fed',{target:id,free:false,first:false,amount:f.price});return true;}
export function spawnPoop(s){if(s.poops.length<3){const positions=[80,92,70],x=positions.find(x=>!s.poops.some(p=>Math.abs(p.x-x)<5));const cleanPenalty=Math.min(POOP_DIRT,s.needs.clean);s.needs.clean=clamp(s.needs.clean-cleanPenalty);s.poops.push({id:s.nextPoopId++,x:x??80,taps:0,wet:0,cleanPenalty});}}
export function acknowledgeCare(s){if(s.tutorial==='fed'){s.tutorial='wash';s.needs.clean=35;spawnPoop(s);return true;}if(s.tutorial==='washed'){s.tutorial=s.plan?'done':'plan';return true;}return false;}
// Running out of water is not a tutorial dead end: keep the wash mission open,
// let this ordinary day elapse, and use tomorrow's announced income to continue.
export function deferExhaustedWash(s){if(!s.onboardingPaid||s.tutorial!=='wash'||s.wallet>0||s.water>.001)return false;s.tutorial=s.plan?'done':'plan';return true;}
export function finishFirstWash(s){if((s.tutorial==='wash'||s.onboardingPaid&&s.tutorial==='done'&&!s.trialUsed)&&s.poops.length===0&&s.needs.clean>=90){s.trialUsed=true;s.needs.clean=100;if(s.tutorial==='wash')s.tutorial='washed';emitAction(s,'washed',{free:!s.onboardingPaid,first:true,amount:s.onboardingPaid?totals(s).rain:0});return true;}return false;}
function restoreCleanGround(s,removed){s.needs.clean=clamp(s.needs.clean+removed.reduce((sum,p)=>sum+(Number.isFinite(p.cleanPenalty)?clamp(p.cleanPenalty,0,POOP_DIRT):0),0));}
export function tapPoop(s,id){const p=s.poops.find(x=>x.id===id);if(!p)return false;p.taps++;if(p.taps>=6){s.poops=s.poops.filter(x=>x.id!==id);restoreCleanGround(s,[p]);s.cycleCare++;finishFirstWash(s);return true;}return false;}
export function stroke(s,distance){if(s.tutorial!=='done')return false;s.needs.affection=clamp(s.needs.affection+Math.min(6,distance*.09));if(distance>12)s.cycleCare++;return true;}
// Charge a 3-second portion only when water starts. Paid unused water persists.
export function rain(s,dt,x,session){if(!(dt>0)||!Number.isFinite(dt)||!session||!['wash','done'].includes(s.tutorial))return false;const free=!s.onboardingPaid&&s.tutorial==='wash'&&!s.trialUsed;
 if(!free&&!canSpend(s,0))return false;
 if(!free&&s.water<=.001){if(!spend(s,1,'Дождик','rain'))return false;s.water=3;session.spent++;}
 const used=free?dt:Math.min(dt,s.water);if(!free)s.water=Math.max(0,s.water-used);
 if(Math.abs(x-51)<21)s.needs.clean=clamp(s.needs.clean+used*20);
 for(const p of s.poops)if(Math.abs(x-p.x)<13)p.wet+=used;
 const removed=s.poops.filter(p=>p.wet>=1.8);s.poops=s.poops.filter(p=>p.wet<1.8);if(removed.length){restoreCleanGround(s,removed);s.cycleCare++;}
 if(used>0)s.cycleCare++;finishFirstWash(s);return true;
}
export function setPlan(s,parts){if(s.pendingIncome||s.pendingReward||s.review||s.pendingGrowth||s.adultNotice||s.plan||!['plan','done'].includes(s.tutorial))return false;
 if(!Array.isArray(parts)||parts.length!==3||parts.some(v=>!Number.isInteger(v)||v<0)||parts.reduce((a,b)=>a+b,0)>s.wallet)return false;
 const first=s.plans.length===0;
 s.plan=[...parts];s.plans.push({cycle:s.cycle,parts:[...parts],wallet:s.wallet,careBeforePlan:totals(s).food+totals(s).rain});s.tutorial=s.onboardingPaid&&first&&!s.giftUsed?'meet':'done';
 emitAction(s,'plan-confirmed',{first,amount:parts.reduce((sum,n)=>sum+n,0),care:parts[0],wants:parts[1],savings:parts[2]});
 return true;}
export function buy(s,id){const item=ITEMS.find(x=>x.id===id);if(!item||s.tutorial!=='done'||s.owned.includes(id))return false;if(!spend(s,item.price,item.name,'wants'))return false;const first=s.owned.length+s.goalsWon.length===0,hadMission=!!s.missions?.buy;s.owned.push(id);emitAction(s,'want-decided',{target:id,amount:item.price,resolution:'purchased'});s.pendingPurchase={id,first,reward:hadMission?0:s.missions?.buy?.rewardPaid||0};return true;}
export function transfer(s,amount){if(!Number.isInteger(amount)||amount===0||s.tutorial!=='done'||!s.plan||s.review||s.pendingGrowth||s.adultNotice||s.pendingIncome||s.pendingReward)return false;
 if(amount>0){if(s.wallet<amount)return false;s.wallet-=amount;s.savings+=amount;}else{if(s.savings< -amount)return false;s.savings+=amount;s.wallet-=amount;}
 record(s,'transfer',amount,'Копилка');emitAction(s,'transferred',{amount,target:'savings'});return true;}
export function chooseGoal(s,id){const goal=GOALS.find(x=>x.id===id);if(!goal||s.tutorial!=='done'||!s.plan||s.review||s.pendingGrowth||s.adultNotice||s.pendingIncome||s.pendingReward)return false;s.goal=id;emitAction(s,'goal-selected',{target:id,amount:goal.price});return true;}
export function claimGoal(s){const g=GOALS.find(x=>x.id===s.goal);if(!g||s.savings<g.price||s.goalsWon.includes(g.id)||!s.plan||s.review||s.pendingGrowth||s.adultNotice||s.pendingIncome||s.pendingReward||s.tutorial!=='done')return false;const first=s.owned.length+s.goalsWon.length===0,firstDream=s.goalsWon.length===0;s.savings-=g.price;s.goalsWon.push(g.id);record(s,'expense',g.price,g.name,'wants');s.ledger.at(-1).source='savings';s.pendingPurchase={id:g.id,first,firstDream,reward:0,dream:true};return true;}
// Recommend a source without forbidding a child's deliberate budget choice.
// Actual affordability is checked again in openDeposit; UI shows a care warning.
export function careReserve(s){return Math.max(0,(s.plan?.[0]??4)-(s.plan?cycleSummary(s).actual.care:0));}
export function depositFunding(s,amount=10){if(!Number.isSafeInteger(amount)||amount<1)return null;return s.wallet>=amount+careReserve(s)?'wallet':s.savings>=amount?'savings':s.wallet>=amount?'wallet':null;}
// Quote only what is still planned for the goal. Already-paid care or wants no
// longer reserve wallet coins; moving money between savings and a bank is neutral.
export function goalRemaining(s,id=s.goal){const g=GOALS.find(g=>g.id===id);return !g||s.goalsWon.includes(id)?0:Math.max(0,g.price-s.savings);}
export function availableGoalChoice(s,preferred){return [preferred,s.missions?.goal?s.goal:null,s.plannedGoal].find(id=>id&&!s.goalsWon.includes(id)&&GOALS.some(g=>g.id===id));}
export function transferToGoal(s,amount){return Number.isInteger(amount)&&amount>0&&amount<=goalRemaining(s)?transfer(s,amount):false;}
export function plannedSavingsAmount(s){
 if(!Array.isArray(s.plan)||s.plan.length!==3)return 0;
 const whole=n=>Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
 const wallet=whole(s.wallet),actual=cycleSummary(s).actual;
 const reserve=Math.max(0,whole(s.plan[0])-whole(actual.care))+Math.max(0,whole(s.plan[1])-whole(actual.wants));
 // Voluntary withdrawals reverse saving; returning a matured deposit does not.
 const netSaved=Number.isFinite(actual.savings)?Math.floor(actual.savings):0;
 const remaining=Math.max(0,whole(s.plan[2])-netSaved);
 return Math.min(Math.max(0,wallet-reserve),remaining,goalRemaining(s));
}
export function openDeposit(s,source='wallet',amount=10){
 if(s.cycle<3||s.deposit||!s.plan||s.review||s.pendingGrowth||s.adultNotice||s.pendingIncome||s.pendingReward||s.tutorial!=='done'||!s.missions?.save||!s.missions?.goal)return false;
 if(!Number.isSafeInteger(amount)||amount<1||!Number.isSafeInteger(amount+depositBonus(amount)))return false;
 if(source==='wallet'){if(s.wallet<amount)return false;s.wallet-=amount;}
 else if(source==='savings'){
  if(s.savings<amount)return false;
  // Explicitly confirmed rerouting of savings, not new saving or earned income.
  // Its two ledger legs net to zero saving; the wallet balance does not change.
  s.savings-=amount;record(s,'transfer',-amount,'Из копилки на вклад');
 }else return false;
 s.deposit={principal:amount,bonus:depositBonus(amount),due:s.completedCycles+1};record(s,'bank-in',amount,'Вклад');emitAction(s,'deposit-opened',{amount,target:'deposit'});return true;
}
export function collectDeposit(s){
 if(!s.deposit||s.completedCycles<s.deposit.due||s.tutorial!=='done'||!s.plan||s.review||s.pendingGrowth||s.adultNotice||s.pendingIncome||s.pendingReward)return false;
 const d=s.deposit;
 if(!Number.isFinite(d.principal)||d.principal<0||!Number.isFinite(d.bonus)||d.bonus<0)return false;
 // Preserve the real old principal in accounting; only the actual final payout
 // is rounded up, so a legacy fractional bonus cannot break tomorrow's plan.
 const payout=Math.ceil(d.principal+d.bonus),income=payout-d.principal;
 s.wallet+=payout;record(s,'bank-out',d.principal,'Возврат вклада');record(s,'income',income,'Награда по вкладу');s.deposit=null;return true;
}
export function evaluateTask(id,a){
 switch(id){case 0:return a?.join(',')==='need,need,want,want';
 case 1:{if(!Array.isArray(a)||a.length!==4||a.some(n=>!Number.isInteger(n)||n<0||n>5))return false;return a.reduce((v,n,i)=>v+n*FOOD[i].price,0)<=5&&a.reduce((v,n,i)=>v+n*FOOD[i].gain/20,0)>=3;}
 case 2:return Array.isArray(a)&&a.length===3&&a.every(n=>Number.isInteger(n)&&n>=0)&&a.reduce((v,n)=>v+n,0)===10&&a[0]>=4&&a[2]>=2;
 case 3:return Number.isInteger(a)&&a>=1&&a<=4;
 case 4:return a==='comic'||a==='save';
 case 5:return Array.isArray(a)&&a.length===3&&a.every(n=>Number.isInteger(n)&&n>=0)&&a.reduce((v,n)=>v+n,0)===10&&a[0]>=6&&a[2]>=2;
 default:return false;}}
export function completeTask(s,id,answer){if(s.tutorial!=='done'||!s.plan||s.review||s.pendingIncome||s.pendingReward||id>Math.min(s.cycle,5)||!evaluateTask(id,answer))return false;
 if(!s.tasks.includes(id)){s.tasks.push(id);s.taskAnswers[id]=answer;s.wallet+=3;record(s,'income',3,TASKS[id].name);}return true;}
// Keep the care budget per day stable while giving children time to explore.
// Poop clock uses balance-seconds, not wall-clock seconds, for old-save safety.
export function decay(s,seconds){const balanceSeconds=seconds*90/CYCLE_SECONDS;s.needs.food=clamp(s.needs.food-balanceSeconds*.19);s.needs.affection=clamp(s.needs.affection-balanceSeconds*.14);s.needs.clean=clamp(s.needs.clean-balanceSeconds*(.10+s.poops.length*.38));s.poopClock+=balanceSeconds;if(s.poopClock>=60){spawnPoop(s);s.poopClock%=60;}}
export function tick(s,dt){if(s.tutorial!=='done'||!s.plan||s.review||s.pendingGrowth||s.adultNotice||s.pendingIncome||s.pendingReward||s.pendingPurchase||s.speed===0||!Number.isFinite(dt))return;const seconds=Math.min(CYCLE_SECONDS-s.elapsed,Math.max(0,Math.min(dt,2))*s.speed);s.elapsed+=seconds;decay(s,seconds);}
export function cycleBlockers(s){const b=[];if(!s.plan)b.push('Составь план');if(s.elapsed<CYCLE_SECONDS)b.push('День ещё идёт');return b;}
export function endCycle(s,force=false){
 if(s.review||s.pendingGrowth||s.adultNotice||s.pendingIncome||s.pendingReward||s.tutorial!=='done'||!s.plan||(!force&&cycleBlockers(s).length))return false;
 const summary=cycleSummary(s);s.growthPoints=(s.growthPoints||0)+summary.growthGained;
 summary.growthTotal=s.growthPoints;(s.periods??=[]).push(summary);
 s.completedCycles++;s.review=true;
 if(s.completedCycles>=2&&s.stage===0&&s.growthPoints>=4){s.stage=1;s.antennae=0;s.pendingGrowth=false;s.adultNotice=true;}
 else if(s.completedCycles>=5&&s.stage===1&&s.growthPoints>=10){s.stage=2;s.adultNotice=true;}
 return true;
}
// Also called on resume: old saves can already be waiting at the end of a day.
export function finishDueCycle(s){return endCycle(s);}
export function nextCycle(s){if(!s.review||s.pendingGrowth||s.adultNotice||s.pendingIncome||s.pendingReward)return false;s.review=false;s.cycle++;s.elapsed=0;s.cycleCare=0;s.plan=null;s.wallet+=8;record(s,'income',8,'Карманные штучки');s.pendingIncome={amount:8,source:'daily',cycle:s.cycle};s.adultNotice=false;return true;}
export function totals(s,cycle=s.cycle){const result={food:0,rain:0,wants:0,saved:0,income:0};for(const e of s.ledger.filter(e=>e.cycle===cycle)){if(e.kind==='expense')result[e.category]+=e.amount;if(e.kind==='transfer')result.saved+=e.amount;if(e.kind==='income')result.income+=e.amount;}return result;}

// Snapshot at the end of a day; subsequent income and purchases cannot rewrite it.
export function cycleSummary(s,cycle=s.cycle) {
 const stored=s.periods?.find(p=>p.cycle===cycle);if(stored)return stored;
 const entries=s.ledger.filter(e=>e.cycle===cycle),t=totals(s,cycle);
 const sum=kind=>entries.filter(e=>e.kind===kind).reduce((v,e)=>v+e.amount,0);
 const planRecord=s.plans.find(p=>p.cycle===cycle),plan=[...(planRecord?.parts||(cycle===s.cycle?s.plan:null)||[0,0,0])];
 const bankSaved=sum('bank-in')-sum('bank-out');
 const walletWants=entries.filter(e=>e.kind==='expense'&&e.category==='wants'&&e.source!=='savings').reduce((v,e)=>v+e.amount,0);
 const careBeforePlan=planRecord?.careBeforePlan||0;
 const actual={care:Math.max(0,t.food+t.rain-careBeforePlan),wants:walletWants,savings:t.saved+sum('bank-in')};
 const planned={care:plan[0],wants:plan[1],savings:plan[2]},growthReasons=[];
 const acted=actual.care+actual.wants+Math.max(0,actual.savings)>0;
 if(t.food+t.rain>0)growthReasons.push('Купили еду или воду');
 if(acted&&actual.care<=planned.care&&actual.wants<=planned.wants&&(planned.savings===0||actual.savings>=planned.savings))growthReasons.push('Уложились в свой план');
 if(actual.savings>0)growthReasons.push('Отложили штучки');
 const expense=sum('expense');
 return {cycle,plan,careBeforePlan,walletAtPlan:planRecord?.wallet??null,walletEnd:s.wallet,savingsEnd:s.savings,depositEnd:s.deposit?.principal||0,income:t.income,expense,expenses:{food:t.food,rain:t.rain,wants:t.wants},saved:t.saved,bankSaved,savingsBasis:'new-contributions',totals:t,planned,actual,growthGained:growthReasons.length,growthReasons,growthTotal:(s.growthPoints||0)+growthReasons.length};
}
export function planOutcome(summary) {
 const planned=summary?.planned||{care:summary?.plan?.[0]||0,wants:summary?.plan?.[1]||0,savings:summary?.plan?.[2]||0};
 const actual=summary?.actual||{care:0,wants:0,savings:0};
 // A matured deposit coming back is not a failure to save today.
 const saved=Math.max(0,actual.savings+(summary?.savingsBasis==='new-contributions'?0:Math.max(0,-(summary?.bankSaved||0))));
 const differences=[];
 if(actual.care>planned.care)differences.push(`На еду и воду оставили ${planned.care}, а потратили ${actual.care}.`);
 if(actual.wants>planned.wants)differences.push(`На хотелки оставили ${planned.wants}, а потратили ${actual.wants}.`);
 if(saved<planned.savings)differences.push(`Хотели отложить ${planned.savings}, а отложили ${saved}.`);
 return {met:!differences.length,title:differences.length?'Получилось иначе':'План выполнен',lines:differences.length?differences:['На нужное хватило, лишнего не потратили.',...(saved>0?[`Отложили ${saved} ${pieceWord(saved)} на будущее.`]:[])]};
}
export function growthProgress(s) {
 const points=s.growthPoints||0,minimumCycles=s.stage===0?2:5,nextThreshold=s.stage===0?4:10;
 return {points,nextThreshold,remaining:s.stage===2?0:Math.max(0,nextThreshold-points),stage:s.stage,minimumCycles,cyclesRemaining:s.stage===2?0:Math.max(0,minimumCycles-s.completedCycles),complete:s.stage===2};
}
