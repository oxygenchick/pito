// One journal, one current action. Opening a window never completes a mission.
import {pacedIntro,calmIntro,introMission} from './onboarding.mjs';
import {ITEMS} from './item-catalog.mjs';
export const FOLLOW_PLAN={id:'follow-plan',title:'Следуй своему плану',icon:'task',theme:'Планирование',action:'plan',description:'Заботься о Пито, сверяй покупки с планом и откладывай на мечту.',reward:0};
export const INTRO_PET={id:'intro-pet',title:'Погладь Пито',icon:'hand',action:'close',description:'Зажми Пито и поводь по нему пальцем. Ему нравится ласка!',reward:0};
export const MISSIONS = [
 {id:'feed',title:'Покорми Пито',icon:'apple',theme:'Уход',action:'food',description:'Пито проголодался. Нажми на еду и угости его яблоком.',after:[],day:1,criterion:{"event":"fed","first":true},reward:0,lesson:'Яблоко стоило 2 штучки. Пито поел, а монеток стало меньше.'},
 {id:'wash',title:'Помой Пито',icon:'rain',theme:'Уход',action:'rain',description:'Нажми на дождик. Держи облачко над Пито и грязью.',after:['feed'],day:1,criterion:{"event":"washed","first":true},reward:0,lesson:'Дождик стоит 1 штучку за 3 секунды. Отпускай облачко, когда воды достаточно.'},
 {id:'plan',title:'План на первый день',icon:'coin',theme:'Планирование',action:'plan',description:'Пито поел и помылся. Реши, на что оставить остальные штучки.',after:['wash'],day:1,criterion:{"event":"plan-confirmed","first":true},reward:2,lesson:'План помогает оставить деньги на нужное. Это пока не трата: все штучки у тебя.'},
 {id:'goal',title:'Выбери мечту',icon:'jar',theme:'Накопления',action:'choose-goal',description:'Нажми «Выбрать мечту» и реши, на что будешь копить.',after:['plan','wash'],day:1,criterion:{"event":"goal-selected"},reward:2,lesson:'Теперь у копилки есть цель. Покупать мечту сразу не нужно.'},
 {id:'paid-food',title:'Пора подкрепиться',icon:'apple',theme:'Покупки',action:'food',description:'Пито снова проголодался. Угости его яблоком за 2 штучки.',after:['goal'],day:1,criterion:{"event":"fed","free":false,"first":false,"minAmount":1},reward:2,lesson:'Пито нужно есть регулярно. Следи за его сытостью.'},
 {id:'save',title:'Пополни копилку',icon:'jar',theme:'Накопления',action:'goal',description:'Нажми на мечту под заданием и отложи хотя бы 1 штучку.',after:['goal'],day:1,criterion:{"event":"transferred","minAmount":1},reward:2,lesson:'Штучки в копилке остаются твоими. Можно копить понемногу.'},
 {id:'buy',title:'Выбери себе вещь',icon:'kite',theme:'Покупки',action:'shop',description:'Нажми «Вещи». Купи понравившееся или отложи покупку.',after:['save'],day:1,criterion:{"event":"want-decided","resolution":["purchased","deferred"]},reward:2,lesson:'Хотелку можно купить сейчас или отложить. Важно, чтобы оставалось на нужное.',deferredLesson:'Покупку отложили. Штучки остались на нужное и на мечту.'},
 {id:'replan',title:'Спланируй следующий день',icon:'coin',theme:'Планирование',action:'plan',description:'Посмотри на вчерашние траты. Что стоит изменить в новом плане?',after:['plan'],day:2,criterion:{"event":"plan-confirmed","first":false},reward:2,lesson:'План можно менять: вчерашние траты помогают решить, сколько оставить сегодня.',},
 {id:'save-step',title:'Больше на мечту',icon:'jar',theme:'Накопления',action:'goal',description:'Отложи сегодня в копилку больше, чем указал в плане. Оставь штучки на заботу о Пито.',after:['replan'],day:2,criterion:{event:'transferred',minAmount:1,min:{abovePlan:1}},reward:2,lesson:'Удалось отложить больше плана. Мечта стала ближе!'},
 {id:'plan-save',title:'Копилка в плане',icon:'coin',theme:'Планирование',action:'plan',description:'Составь план и оставь в нём на мечту 3 штучки или больше.',after:['replan'],day:3,criterion:{"event":"plan-confirmed","first":false,"min":{"savings":3}},reward:2,lesson:'Когда решаешь заранее, сколько отложить, копить проще.'},
 {id:'plan-want',title:'Покупка по плану',icon:'kite',theme:'Покупки',action:'plan',description:'Оставь в плане штучки на вещь. Купи её, только если хватит и на заботу.',after:['replan'],day:4,needsItems:true,criterion:{"event":"plan-confirmed","first":false,"min":{"wants":1}},reward:2,lesson:'Хотелки тоже можно планировать. Сверяйся с планом перед покупкой.'},
 {id:'big-save',title:'Большой шаг к мечте',icon:'jar',theme:'Накопления',action:'goal',description:'Отложи в копилку сразу 5 штучек или больше.',after:['save-step'],day:5,criterion:{"event":"transferred","minAmount":5},reward:3,lesson:'Чем больше откладываешь, тем раньше сбудется мечта.'},
 {id:'deposit',title:'Открой первый вклад',icon:'coin',theme:'Накопления',action:'bank',description:'Вложи от 10 штучек на два игровых дня. Можно забрать раньше, но без дохода.',after:['save','goal'],day:3,criterion:{"event":"deposit-opened","minAmount":1},reward:0,optional:true,lesson:'Деньги остаются твоими. Дождись конца срока, чтобы получить обещанный доход.'},
 {id:'deposit-big',title:'Вклад побольше',icon:'coin',theme:'Накопления',action:'bank',description:'Вложи 15 штучек или больше. Сравни доход с первым вкладом.',after:['deposit'],day:6,criterion:{"event":"deposit-opened","minAmount":15},reward:0,optional:true,lesson:'Чем больше вклад, тем больше доход: 15 штучек вернутся как 18.'}
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
  const rule=mission.criterion;
  if(!rule||rule.event!==event||s.missions?.[mission.id])continue;
  if(catalog===MISSIONS&&pacedIntro(s)&&introMission(s)!==mission.id)continue;
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
 if(s.missions?.[m.id])return 'done';
 if(pacedIntro(s))return introMission(s)===m.id?'active':'later';
 if(s.onboarding?.version===2&&m.id==='save'&&!s.missions?.plan)return 'later';
 // Nothing left to buy: skip the mission instead of blocking the journal.
 if(m.needsItems&&ITEMS.every(item=>(s.owned||[]).includes(item.id)))return 'later';
 return s.cycle>=(m.day??1)&&(m.after||[]).every(id=>s.missions?.[id])?'active':'later';
}
export function currentMission(s) {
 if(introMission(s)==='intro-pet')return INTRO_PET;
 if(introMission(s)==='intro-play')return {id:'intro-play',title:'Поиграй с новой вещью',icon:'kite',action:'intro-play',description:'Нажми на подарок на лужайке. Посмотри, как Пито обрадуется!',reward:0};
 if(calmIntro(s)&&introMission(s)==='buy')return {...MISSIONS.find(m=>m.id==='buy'),title:'Выбери подарок',description:'Первая вещь в подарок! Выбери ту, что тебе нравится.'};
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
 if(s.ledger.some(e=>e.kind==='transfer'&&e.amount>0))mark('save');
 if(s.owned.length)mark('buy');
 if(s.plans.some(p=>p.cycle>=2))mark('replan');
 if(s.deposit||s.ledger.some(e=>e.kind==='bank-in'))mark('deposit');
}
