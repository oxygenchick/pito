import {cycleSummary} from './engine.mjs';
import {icon} from './visuals.mjs';

const number=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number(n)||0);
const coins=n=>`<span class="mr-coins">${icon('coin')}<b>${number(n)}</b></span>`;
const chevron=()=>icon('chevron','mr-chevron');
const careArt=()=>`<span class="mr-care-art">${icon('apple')}${icon('cloud')}</span>`;

export function savedPlanView(s) {
 const summary=cycleSummary(s),actual=summary.actual;
 const rows=[['care','Поесть и помыться',actual.care,careArt()],['wants','Хотелки',actual.wants,icon('ball')],['savings',summary.depositEnd||summary.bankSaved?'Копилка и вклад':'В копилку',actual.savings,icon('jar')]];
 const body=`<div class="money-review mr-plan"><div class="mr-wallet">${icon('coin')}<span>В кошельке<strong>${number(s.wallet)}</strong></span></div><div class="mr-plan-cards">${rows.map(([key,label,value,picture],i)=>{
  const planned=s.plan[i]||0,fill=planned>0?Math.max(0,Math.min(100,value/planned*100)):0;
  const verb=i===2?(value<0?'Забрали':'Отложено'):'Потрачено';
  return `<section class="mr-plan-card mr-${key}"><div class="mr-picture">${picture}</div><div class="mr-card-copy"><h3>${label}</h3><p>${verb} <b>${number(Math.abs(value))}</b> из ${number(planned)}</p><div class="mr-bar" role="img" aria-label="${verb} ${number(value)}, по плану ${number(planned)}"><i style="width:${fill}%"></i></div>${value>planned&&i<2?`<small>Больше плана на ${number(value-planned)}</small>`:''}</div></section>`;
 }).join('')}</div><p class="mr-note">После составления плана</p></div>`;
 return {title:`План на день ${s.cycle}`,body,footer:`<button class="btn primary wide" data-act="expenses">Посмотреть расходы ${chevron()}</button>`,closable:true};
}

export function expensesView(s,ui={}) {
 const last=ui.budgetTab==='last',summary=last?s.periods?.at(-1):cycleSummary(s);
 if(!summary)return {title:'Расходы',body:'<div class="money-review"><p class="mr-note">Первый день ещё идёт.</p></div>',footer:'',closable:true};
 const spending=summary.expenses||{},rows=[['food','Еда','apple','#f16d79'],['rain','Дождик','cloud','#629ce3'],['wants','Хотелки','ball','#f3a15a']];
 const fromSavings=Math.max(0,(spending.wants||0)-(summary.actual?.wants??spending.wants??0));
 const total=rows.reduce((sum,[key])=>sum+(spending[key]||0),0);
 // Transfers are savings activity, never slices of the spending chart. Read
 // only this day's entries; legacy snapshots can retain just the net amount.
 const transfers=(s.ledger||[]).filter(entry=>entry.cycle===summary.cycle&&entry.kind==='transfer');
 const saved=transfers.length?transfers.reduce((sum,entry)=>sum+Math.max(0,entry.amount),0):Math.max(0,summary.saved||0);
 const withdrawn=transfers.length?transfers.reduce((sum,entry)=>sum+Math.max(0,-entry.amount),0):Math.max(0,-(summary.saved||0));
 const savings=`<section class="mr-daily-savings" aria-label="Копилка за день ${summary.cycle}"><div class="mr-expense-row mr-savings">${icon('jar')}<strong>В копилку</strong>${coins(saved)}</div>${withdrawn?`<p class="mr-note">Из копилки ${coins(withdrawn)}</p>`:''}</section>`;
 let offset=0;
 const arcs=rows.map(([key,,,color])=>{const fraction=total?(spending[key]||0)/total*100:0;const circle=fraction?`<circle cx="60" cy="60" r="45" pathLength="100" fill="none" stroke="${color}" stroke-width="24" stroke-dasharray="${fraction} ${100-fraction}" stroke-dashoffset="${-offset}"/>`:'';offset+=fraction;return circle;}).join('');
 const tabs=s.periods?.length?`<div class="mr-tabs" role="tablist" aria-label="Период расходов">${[['today','Сегодня'],['last','Прошлый день']].map(([id,label])=>`<button class="tab ${ui.budgetTab===id||!ui.budgetTab&&id==='today'?'selected':''}" data-act="budget-tab" data-id="${id}" role="tab" aria-selected="${last===(id==='last')}">${label}</button>`).join('')}</div>`:'';
 const body=`<div class="money-review mr-expenses">${tabs}<div class="mr-chart"><svg viewBox="0 0 120 120" role="img" aria-label="Расходы: еда ${number(spending.food)}, дождик ${number(spending.rain)}, хотелки ${number(spending.wants)}"><circle cx="60" cy="60" r="45" fill="none" stroke="#e8e1ec" stroke-width="24"/><g transform="rotate(-90 60 60)">${arcs}</g></svg><div class="mr-chart-center"><span>${total?'Потрачено':'Пока без трат'}</span>${coins(total)}</div></div><div class="mr-expense-rows">${rows.map(([key,label,image])=>`<div class="mr-expense-row mr-${key}">${icon(image)}<strong>${label}</strong>${coins(spending[key]||0)}</div>`).join('')}</div>${fromSavings?`<p class="mr-note">Мечта куплена из копилки: ${number(fromSavings)}</p>`:''}${summary.careBeforePlan?`<p class="mr-note">Из них до плана: ${number(summary.careBeforePlan)} штучки</p>`:''}${savings}</div>`;
 return {title:`Расходы за день ${summary.cycle}`,body,footer:`<button class="btn primary wide" data-act="expenses-back">${chevron()} ${s.review?'К итогу дня':'К плану'}</button>`,closable:true};
}
