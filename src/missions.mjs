// One journal, one current action. Opening a window never completes a mission.
import {pacedIntro,calmIntro,introMission} from './onboarding.mjs';
import {ITEMS,GOALS} from './item-catalog.mjs';
import {currentDailyChallenge} from './daily-challenges.mjs';
import {bankAvailable} from './bank-access.mjs';
const REPLACED=new Set(['replan','save-step','plan-save','plan-want','big-save','deposit-big']);
export const FOLLOW_PLAN={id:'follow-plan',title:'Следуй своему плану',icon:'task',theme:'Планирование',action:'plan',description:'Заботься о Пито, сверяй покупки с планом и откладывай на мечту.',reward:0};
export const INTRO_PET={id:'intro-pet',title:'Погладь Пито',icon:'hand',action:'close',nonblocking:true,description:'Поводи по Пито пальцем, чтобы погладить его. Ему это понравится!',reward:0};
export const MISSIONS = [
 {id:'dream-first',title:'Накопи на первую мечту',icon:'jar',action:'goal',nonblocking:true,description:'Откладывай штучки в копилку. Когда накопишь нужную сумму, купи мечту.',criterion:{event:'dream-purchased',min:{dreams:1}},reward:0},
 {id:'dream-second',title:'Накопи на вторую мечту',icon:'jar',action:'goal',nonblocking:true,description:'Первая мечта сбылась! Копи на новую и купи её, когда хватит штучек.',criterion:{event:'dream-purchased',min:{dreams:2}},reward:0},
 {id:'feed',title:'Покорми Пито',icon:'apple',theme:'Уход',action:'food',nonblocking:true,description:'Твой Пито проголодался. Нажми на кнопку еды и покорми его.',after:[],day:1,criterion:{"event":"fed","first":true},reward:0,lesson:'Пито сыт! Следи за его сытостью, чтобы он рос быстрее.'},
 {id:'wash',title:'Помой Пито',icon:'rain',theme:'Уход',action:'rain',nonblocking:true,description:'Нажми на тучку. Пито нужно помыть и прогнать какули, которые появились рядом.',after:['feed'],day:1,criterion:{"event":"washed","first":true},reward:0,lesson:'Пито чистый! Отпускай облачко, когда воды достаточно.'},
 {id:'plan',title:'Первый финансовый план!',icon:'task',theme:'Планирование',action:'plan',description:'У тебя уже есть мечта. Давай составим план, как её воплотить.',after:['wash'],day:1,criterion:{"event":"plan-confirmed","first":true},reward:2,lesson:'План помогает оставить деньги на нужное. Это пока не трата: все штучки у тебя.'},
 {id:'goal',title:'Выбери мечту',icon:'jar',theme:'Накопления',action:'choose-goal',description:'Пришло время выбрать свою первую мечту. Выбери то, о чём ты мечтаешь больше всего.',after:['plan','wash'],day:1,criterion:{"event":"goal-selected"},reward:2,lesson:'Теперь у копилки есть цель. Покупать мечту сразу не нужно.'},
 {id:'paid-food',title:'Пора подкрепиться',icon:'apple',theme:'Покупки',action:'food',description:'Пито снова проголодался. Угости его яблоком за 2 штучки.',after:['goal'],day:1,criterion:{"event":"fed","free":false,"first":false,"minAmount":1},reward:2,lesson:'Пито нужно есть регулярно. Следи за его сытостью.'},
 {id:'save',title:'Отложи на мечту',icon:'jar',theme:'Накопления',action:'goal',nonblocking:true,description:'Нажми на мечту над заданием и отложи столько, сколько запланировал сегодня.',after:['goal'],day:1,criterion:{"event":"transferred","minAmount":1},reward:2,lesson:'Штучки в копилке остаются твоими. Можно копить понемногу.'},
 {id:'buy',title:'Выбери себе вещь',icon:'kite',theme:'Покупки',action:'shop',description:'Нажми «Вещи». Купи понравившееся или отложи покупку.',after:['save'],day:1,criterion:{"event":"want-decided","resolution":["purchased","deferred"]},reward:2,lesson:'Хотелку можно купить сейчас или отложить. Важно, чтобы оставалось на нужное.',deferredLesson:'Покупку отложили. Штучки остались на нужное и на мечту.'},
 {id:'replan',title:'Спланируй следующий день',icon:'coin',theme:'Планирование',action:'plan',description:'Посмотри на вчерашние траты. Что стоит изменить в новом плане?',after:['plan'],day:2,criterion:{"event":"plan-confirmed","first":false},reward:2,lesson:'План можно менять: вчерашние траты помогают решить, сколько оставить сегодня.',},
 {id:'save-step',title:'Больше на мечту',icon:'jar',theme:'Накопления',action:'goal',description:'Отложи сегодня в копилку больше, чем указал в плане. Оставь штучки на заботу о Пито.',after:['replan'],day:2,criterion:{event:'transferred',minAmount:1,min:{abovePlan:1}},reward:2,lesson:'Удалось отложить больше плана. Мечта стала ближе!'},
 {id:'plan-save',title:'Копилка в плане',icon:'coin',theme:'Планирование',action:'plan',description:'Составь план и оставь в нём на мечту 3 штучки или больше.',after:['replan'],day:3,criterion:{"event":"plan-confirmed","first":false,"min":{"savings":3}},reward:2,lesson:'Когда решаешь заранее, сколько отложить, копить проще.'},
 {id:'plan-want',title:'Покупка по плану',icon:'kite',theme:'Покупки',action:'plan',description:'Оставь в плане штучки на вещь. Купи её, только если хватит и на заботу.',after:['replan'],day:4,needsItems:true,criterion:{"event":"plan-confirmed","first":false,"min":{"wants":1}},reward:2,lesson:'Хотелки тоже можно планировать. Сверяйся с планом перед покупкой.'},
 {id:'big-save',title:'Большой шаг к мечте',icon:'jar',theme:'Накопления',action:'goal',description:'Отложи в копилку сразу 5 штучек или больше.',after:['save-step'],day:5,criterion:{"event":"transferred","minAmount":5},reward:3,lesson:'Чем больше откладываешь, тем раньше сбудется мечта.'},
 {id:'deposit',title:'Получи доход по вкладу',icon:'coin',theme:'Накопления',action:'bank',description:'Вложи штучки, дождись конца срока и забери их с доходом.',after:['save','goal'],day:3,criterion:{"event":"deposit-collected","minAmount":1},reward:0,optional:true,lesson:'Деньги остаются твоими. Дождись конца срока, чтобы получить обещанный доход.'},
 {id:'deposit-big',title:'Вклад побольше',icon:'coin',theme:'Накопления',action:'bank',description:'Положи на вклад больше 10 штучек. Сначала оставь на заботу о Пито.',after:['deposit'],day:6,criterion:{"event":"deposit-opened","minAmount":11},reward:0,optional:true,lesson:'Чем больше вклад, тем больше доход.'}
];

export function markMission(s,id,{reward=true,resolution='completed',catalog=MISSIONS}={}) {
 const mission=catalog.find(m=>m.id===id);
 if(!mission)return false;
 if(!s.missions)s.missions={};
 if(s.missions[id])return false;
 s.missions[id]={cycle:s.cycle,resolution,rewardPaid:0};
 // A second guard protects repaired old saves from duplicate money.
 if(reward&&mission.reward&&!(s.onboarding?.version===2&&['paid-food','buy','goal'].includes(id))&&!s.ledger.some(e=>e.kind==='income'&&e.source===`mission:${id}`)) {
  s.wallet+=mission.reward;
  s.missions[id].rewardPaid=mission.reward;
  s.ledger.push({cycle:s.cycle,kind:'income',amount:mission.reward,label:mission.title,category:'',source:`mission:${id}`});
 }
 return true;
}
export const completeMission=markMission;

// Only successful gameplay actions emit events. A new mission using an existing
// event is one catalog entry, not another branch in gameplay. "after" controls
// presentation order; a real action done early still counts, as in the prototype.
// Supported criteria: event; exact target/free/first/resolution (or allowed array);
// minAmount/maxAmount; min:{contextKey:value}; minDay/maxDay. Custom catalogs make the rule testable.
export function applyMissionEvent(s,event,context={},catalog=MISSIONS) {
 const completed=[];
 for(const mission of catalog){
  if(catalog===MISSIONS&&s.onboarding?.version===2&&REPLACED.has(mission.id))continue;
  if(catalog===MISSIONS&&mission.id==='deposit-big'&&!s.ledger.some(e=>e.kind==='bank-out'&&e.amount>0))continue;
  const rule=mission.criterion;
  if(!rule||rule.event!==event||s.missions?.[mission.id])continue;
  if(catalog===MISSIONS&&pacedIntro(s)&&introMission(s)!==mission.id)continue;
  if(catalog===MISSIONS&&mission.id==='save'&&Number.isFinite(context.plannedSavings)&&context.savedToday<context.plannedSavings)continue;
  if(s.cycle<(rule.minDay??mission.day??1)||s.cycle>(rule.maxDay??Infinity))continue;
  if(['target','free','first','resolution'].some(key=>Object.hasOwn(rule,key)&&!(Array.isArray(rule[key])?rule[key].includes(context[key]):rule[key]===context[key])))continue;
  if(rule.minAmount!==undefined&&(!Number.isFinite(context.amount)||context.amount<rule.minAmount))continue;
  if(rule.min&&Object.entries(rule.min).some(([key,value])=>!Number.isFinite(context[key])||context[key]<value))continue;
  if(rule.maxAmount!==undefined&&(!Number.isFinite(context.amount)||context.amount>rule.maxAmount))continue;
  if(markMission(s,mission.id,{catalog,resolution:context.resolution==='deferred'?'deferred':'completed'}))completed.push(mission.id);
 }
 return completed;
}
export function missionStatus(s,m) {
 if(m.id==='dream-first'||m.id==='dream-second'){
  if(s.onboarding?.version!==2)return 'later';
  const target=m.id==='dream-first'?1:2;
  if((s.goalsWon||[]).length>=target)return 'done';
  if(pacedIntro(s)||!s.missions?.save||(s.goalsWon||[]).length!==target-1)return 'later';
  if(target===2&&((s.goalsWon||[]).includes(s.goal)||(s.ledger||[]).some(e=>e.source==='savings'&&e.cycle===s.cycle)))return 'later';
  return 'active';
 }
 if(s.missions?.[m.id])return 'done';
 if(s.onboarding?.version===2&&REPLACED.has(m.id))return 'later';
 if(m.id==='deposit-big'&&!s.ledger.some(e=>e.kind==='bank-out'&&e.amount>0))return 'later';
 if(pacedIntro(s))return introMission(s)===m.id?'active':'later';
 if(s.onboarding?.version===2&&m.id==='save'&&!s.missions?.plan)return 'later';
 if(m.id==='save'&&s.plan?.[2]===0)return 'later';
 if(m.id==='paid-food'&&s.onboarding?.version===2)return 'later';
 // Nothing left to buy: skip the mission instead of blocking the journal.
 if(m.needsItems&&ITEMS.every(item=>(s.owned||[]).includes(item.id)))return 'later';
 return s.cycle>=(m.day??1)&&(m.after||[]).every(id=>s.missions?.[id]||m.id==='deposit'&&id==='save'&&s.ledger.some(e=>e.kind==='transfer'&&e.amount>0))?'active':'later';
}
export function currentMission(s) {
 if(introMission(s)==='intro-pet')return INTRO_PET;
 if(introMission(s)==='intro-play')return {id:'intro-play',title:'Поиграй с новой вещью',icon:'kite',action:'intro-play',nonblocking:true,description:'Нажми на подарок на лужайке. Посмотри, как Пито обрадуется!',reward:0};
 if(calmIntro(s)&&introMission(s)==='buy')return {...MISSIONS.find(m=>m.id==='buy'),title:'Ура! Подарок на день рождения!',nonblocking:true,description:'Выбери первую хотелку для Пито. Это подарок! Она появится на лужайке и порадует Пито.'};
 if(s.onboarding?.version===2&&!pacedIntro(s)&&s.tutorial==='done'){
  if(bankAvailable(s)&&!s.missions?.deposit)return MISSIONS.find(m=>m.id==='deposit');
  if(s.goalsWon.includes(s.goal)&&GOALS.some(g=>!s.goalsWon.includes(g.id)))return {...MISSIONS.find(m=>m.id==='goal'),title:'Выбери новую мечту',description:'Первая покупка уже твоя. Выбери, на что хочешь копить дальше.',reward:0};
  const dream=MISSIONS.find(m=>m.id.startsWith('dream-')&&missionStatus(s,m)==='active');
  if(dream)return dream;
 }
 const daily=currentDailyChallenge(s);if(daily&&!pacedIntro(s))return daily;
 if(s.onboarding?.version===2&&!pacedIntro(s)&&s.tutorial==='done'&&s.missions?.save){
  const bank=MISSIONS.find(m=>m.id==='deposit');
  const quietToday=s.dailyChallenge?.cycle===s.cycle;
  if(!quietToday&&!s.missions.deposit&&!s.deposit&&s.wallet>=15&&missionStatus(s,bank)==='active'&&!(s.ledger||[]).some(e=>e.cycle===s.cycle&&e.source==='savings'))return bank;
  const dream=MISSIONS.find(m=>m.id.startsWith('dream-')&&missionStatus(s,m)==='active');
  return dream||(s.plan?FOLLOW_PLAN:null);
 }
 // Planning missions wait for tomorrow's plan once today's plan is saved.
 return MISSIONS.find(m=>missionStatus(s,m)==='active'&&!(m.action==='plan'&&s.plan)&&(!(m.criterion?.event==='fed'&&m.criterion.free===false)||s.needs.food<=60))||(s.tutorial==='done'&&s.plan?FOLLOW_PLAN:null);
}
export function deferMission(s,id) {
 const m=MISSIONS.find(m=>m.id===id);
 if(id!=='buy'||!m||missionStatus(s,m)!=='active'||s.review||s.pendingGrowth||s.pendingIncome||s.pendingReward||!s.plan)return false;
 return applyMissionEvent(s,'want-decided',{resolution:'deferred',amount:0}).includes(id);
}
export function migrateMissions(s) {
 s.missions={...s.missions};
 const mark=id=>markMission(s,id,{reward:false});
 if(s.giftUsed)mark('feed');
 if(s.trialUsed)mark('wash');
 if(s.plans.length||s.plan)mark('plan');
 if(s.savings>0||s.goalsWon.length)mark('goal');
 if(s.ledger.some(e=>e.kind==='expense'&&e.category==='food'&&e.source!=='tutorial:feed'))mark('paid-food');
 const transfers=s.ledger.filter(e=>e.kind==='transfer'&&e.amount>0);
 if(s.onboarding?.version!==2&&transfers.length||transfers.some(entry=>{
  const planned=s.plans.find(p=>p.cycle===entry.cycle)?.parts?.[2]??(entry.cycle===s.cycle?s.plan?.[2]:undefined)??1;
  const saved=transfers.filter(e=>e.cycle===entry.cycle).reduce((n,e)=>n+e.amount,0);
  return saved>=planned;
 }))mark('save');
 if(s.owned.length)mark('buy');
 if(s.plans.some(p=>p.cycle>=2))mark('replan');
 if(s.ledger.some(e=>e.kind==='income'&&e.label==='Награда по вкладу'&&e.amount>0))mark('deposit');
 else if(s.missions.deposit)delete s.missions.deposit;
}
