import {cycleSummary} from './engine.mjs';
import {icon,art} from './visuals.mjs';
import {completionSticker} from './completion-sticker.mjs';

const number=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number(n)||0);
const coins=n=>`<span class="mr-coins">${icon('coin')}<b>${number(n)}</b></span>`;
const chevron=()=>icon('chevron','mr-chevron');
const planArt=(side,picture)=>`<span class="mr-summary-art ${side}" aria-hidden="true">${picture}</span>`;
const careArt=name=>`<img src="assets/revision/plan-care-${name}.png" alt="">`;

export function savedPlanView(s) {
 const summary=cycleSummary(s),actual=summary.actual;
 const rows=[['care','На заботу',actual.care,careArt('apple'),careArt('cloud')],['wants','На хотелки',actual.wants,'<img src="assets/items-v14/tshirt.png" alt="">',art('ball')],['savings',summary.depositEnd||summary.bankSaved?'Копилка и вклад':'В копилку',actual.savings,art(s.goal||s.plannedGoal||'dream'),icon('jar')]];
 const body=`<div class="money-review mr-plan mr-plan-summary"><div class="mr-plan-cards">${rows.map(([key,label,value,left,right],i)=>{
  const planned=s.plan[i]||0,fill=planned>0?Math.max(0,Math.min(100,value/planned*100)):0;
  const over=i<2&&value>planned;
  const status=over?'Не по плану':i===2?(planned>0&&value>=planned?'Сделано!':''):(value>0?(s.review?'Сделано!':'По плану'):'');
  const verb=i===2?(value<0?'Забрали':'Отложено'):'Потрачено';
  return `<section class="mr-plan-card mr-${key}${status?' has-completion':''}${over?' is-over-budget':''}">${status?completionSticker(status):''}${planArt('left',left)}${planArt('right',right)}<h3>${label}</h3><div class="mr-summary-amounts"><p><span>По плану</span>${coins(planned)}</p><p><span>${verb}</span>${coins(Math.abs(value))}</p></div><div class="mr-bar" role="img" aria-label="${verb} ${number(value)}, по плану ${number(planned)}"><i style="width:${fill}%"></i></div>${over?`<small>Больше плана на ${number(value-planned)}</small>`:''}</section>`;
 }).join('')}</div></div>`;
 return {title:`План на день ${s.cycle}`,body,footer:`<button class="btn primary wide" data-act="expenses">Посмотреть расходы ${chevron()}</button>`,closable:true};
}

export function expensesView(s,ui={}) {
 const last=ui.budgetTab==='last',summary=last?s.periods?.at(-1):cycleSummary(s);
 if(!summary)return {title:'Расходы',body:'<div class="money-review"><p class="mr-note">Первый день ещё идёт.</p></div>',footer:'',closable:true};
 const spending={...(summary.expenses||{})},rows=[['food','Еда','apple','#f16d79'],['rain','Дождик','cloud','#629ce3'],['wants','Хотелки','ball','#f3a15a'],['savings','В копилку','jar','#a586ca']];
 const fromSavings=Math.max(0,(spending.wants||0)-(summary.actual?.wants??spending.wants??0)-(summary.wantsBeforePlan||0));
 // Show money allocated from the wallet. Buying a dream spends already
 // allocated savings, so it must not be counted a second time here.
 const transfers=(s.ledger||[]).filter(entry=>entry.cycle===summary.cycle&&entry.kind==='transfer');
 const saved=transfers.length?transfers.reduce((sum,entry)=>sum+Math.max(0,entry.amount),0):Math.max(0,summary.saved||0);
 const withdrawn=transfers.length?transfers.reduce((sum,entry)=>sum+Math.max(0,-entry.amount),0):Math.max(0,-(summary.saved||0));
 spending.wants=Math.max(0,(spending.wants||0)-fromSavings);
 spending.savings=Math.max(0,saved-withdrawn);
 const total=rows.reduce((sum,[key])=>sum+(spending[key]||0),0);
 const savings=withdrawn?`<p class="mr-note">Из копилки ${coins(withdrawn)}</p>`:'';
 let offset=0;
 const arcs=rows.map(([key,,,color])=>{const fraction=total?(spending[key]||0)/total*100:0;const circle=fraction?`<circle cx="60" cy="60" r="45" pathLength="100" fill="none" stroke="${color}" stroke-width="24" stroke-dasharray="${fraction} ${100-fraction}" stroke-dashoffset="${-offset}"/>`:'';offset+=fraction;return circle;}).join('');
 const tabs=s.periods?.length?`<div class="mr-tabs" role="tablist" aria-label="Период расходов">${[['today','Сегодня'],['last','Прошлый день']].map(([id,label])=>`<button class="tab ${ui.budgetTab===id||!ui.budgetTab&&id==='today'?'selected':''}" data-act="budget-tab" data-id="${id}" role="tab" aria-selected="${last===(id==='last')}">${label}</button>`).join('')}</div>`:'';
const body=`<div class="money-review mr-expenses">${tabs}<div class="mr-chart"><svg viewBox="0 0 120 120" role="img" aria-label="Расходы: еда ${number(spending.food)}, дождик ${number(spending.rain)}, хотелки ${number(spending.wants)}"><circle cx="60" cy="60" r="45" fill="none" stroke="#e8e1ec" stroke-width="24"/><g transform="rotate(-90 60 60)">${arcs}</g></svg><div class="mr-chart-center"><span>${total?'Потрачено':'Пока без трат'}</span>${coins(total)}</div></div><div class="mr-expense-rows">${rows.map(([key,label,image])=>`<div class="mr-expense-row mr-${key}">${icon(image)}<strong>${label}</strong>${coins(spending[key]||0)}</div>`).join('')}</div>${fromSavings?`<p class="mr-note">Мечта куплена из копилки: ${number(fromSavings)}</p>`:''}${savings}</div>`;
 return {title:`Расходы за день ${summary.cycle}`,body,footer:`<button class="btn primary wide" data-act="expenses-back">${chevron()} ${s.review?'К итогу дня':'К плану'}</button>`,closable:true};
}
