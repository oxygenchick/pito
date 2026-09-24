import * as E from './engine.mjs';
import {planView} from './budget-view.mjs';
import {playPlanView} from './play-plan.mjs';
import {kidMain} from './kid-main.mjs';
import {kidOverlay} from './kid-overlays.mjs';
import {icon, art, svg, world, pet, poop, shelf} from './visuals.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const number = value => new Intl.NumberFormat('ru-RU', {maximumFractionDigits:2}).format(Number.isFinite(Number(value)) ? Number(value) : 0);
const labels = ['Поесть и помыться', 'Хотелки', 'Копилка'];
const catalog = [...E.ITEMS, ...E.GOALS];
const hasGoal = s => Boolean(s.missions?.goal);
const currentGoal = s => E.GOALS.find(g => g.id === s.goal) || E.GOALS[0];
const missionById = id => E.MISSIONS.find(m => m.id === id);
const missionLesson = (s,m) => !s.onboardingPaid&&m?.id==='feed'?'Первое яблоко было бесплатным. Следующую еду будем покупать за штучки.':!s.onboardingPaid&&m?.id==='wash'?'Первое мытьё было бесплатным. Теперь дождик стоит 1 штучку за 3 секунды.':m?.lesson||'';
const missionDescription = m => m.id === 'plan' ? 'Нажми на кошелёк. Оставь на еду и воду, остальные можно потратить на хотелки или отложить.' : m.id === 'replan' ? 'Нажми на кошелёк и составь план на новый день. Вчерашние траты помогут выбрать.' : m.description;
const selectedId = ui => typeof ui.selection === 'object' ? ui.selection?.id : ui.selection;
export const coin = n => `<span class="coin">${icon('coin')}<span>${number(n)}</span></span>`;
export const button = (label, action, extra = '', cls = 'primary') => `<button class="btn ${cls}" data-act="${action}" ${extra}>${label}</button>`;
const back = () => button('К Пито', 'close', '', 'secondary wide');
const error = ui => ui.error ? `<p class="error" role="alert">${esc(ui.error)}</p>` : '';
const itemArt = (id, cls = 'art') => art(id, cls);

function stepper(action, value, id = '', maximum = 99, disabled = false) {
 const label=action==='plan-step'?labels[Number(id)]:'сумму в копилке';
 return `<div class="stepper"><button data-act="${action}" data-id="${id}" data-delta="-1" ${value <= 0 || disabled ? 'disabled' : ''} aria-label="Уменьшить ${esc(label)}">−</button><output>${number(value)}</output><button data-act="${action}" data-id="${id}" data-delta="1" ${value >= maximum || disabled ? 'disabled' : ''} aria-label="Увеличить ${esc(label)}">+</button></div>`;
}

function segments(current = 0, gain = 0) {
 return `<div class="segments" aria-label="Сытость сейчас и прибавка от еды">${Array.from({length:5}, (_, i) => {
  const filled = E.clamp(current - i, 0, 1) * 100;
  const added = E.clamp(current + gain - i, 0, 1) * 100;
  return `<i style="background:linear-gradient(to right,#995fc2 0 ${filled}%,#6aaa80 ${filled}% ${added}%,#e3dbe6 ${added}% 100%)"></i>`;
 }).join('')}</div>`;
}

export function needsView(s, only=null) {
 return `<div class="needs ${s.stage === 2 ? 'grown' : ''}" aria-label="Потребности Пито">${[
  ['affection','hand','Ласка'], ['food','apple','Сытость'], ['clean','drop','Чистота']
 ].filter(([key])=>!only||key===only).map(([key, image, label]) => {
  const value = E.clamp(s.needs[key]);
  return `<div class="need need-circle need-${key} ${value < 25 ? 'low' : ''}" data-need="${key}" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value)}"><svg class="ring" viewBox="0 0 80 80" aria-hidden="true"><circle class="ring-track" cx="40" cy="40" r="33" fill="none" stroke="#e8deec" stroke-width="10"/><circle class="ring-fill" cx="40" cy="40" r="33" pathLength="100" fill="none" stroke="${value < 25 ? '#e69965' : '#9760bd'}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${value} 100" stroke-dashoffset="0" transform="rotate(${180 * (1 - value / 100) - 90} 40 40)"/></svg><span class="need-symbol">${itemArt(image, 'icon')}</span><span class="need-label">${label}</span></div>`;
 }).join('')}</div>`;
}

function taskCard(s) {
 if (s.tutorial === 'meet') return `<button class="task-card task-ticket" data-act="meet-guide"><span class="task-marker">${icon('hand')}</span><span class="task-copy"><strong>Познакомься с Пито</strong><p>Нажми на него, чтобы увидеть, как он себя чувствует.</p></span></button>`;
 if (['fed','washed'].includes(s.tutorial)) return '';
 const mission = s.tutorial==='food'?missionById('feed'):s.tutorial==='wash'?missionById('wash'):s.tutorial==='plan'?missionById('plan'):s.tutorial==='done'&&!s.plan ? missionById('replan') : E.currentMission(s);
 if (!mission) return '';
 return `<button class="task-card task-ticket" data-act="guide" data-id="${mission.id}"><span class="task-marker">${itemArt(mission.icon, 'icon')}</span><span class="task-copy"><strong>${esc(mission.title)}</strong><p>${esc(missionDescription(mission))}</p></span>${icon('arrow', 'task-arrow')}</button>`;
}

export function home(s, ui) {
 const intro = s.tutorial !== 'done';
 const growth=E.growthProgress(s),growthBase=s.stage===1?4:0,growthFill=growth.complete?100:Math.min(100,Math.max(0,(growth.points-growthBase)/(growth.nextThreshold-growthBase)*100));
 const goal = currentGoal(s), goalWon=s.goalsWon.includes(goal.id), allGoalsWon=E.GOALS.every(g=>s.goalsWon.includes(g.id));
 const canChooseGoal = !intro && Boolean(s.plan || s.missions?.plan);
 const bankAvailable = Boolean(s.deposit) || s.cycle >= 3 && Boolean(s.missions?.save && s.missions?.goal);
 let html = world() + shelf(s, catalog, ui.shelfPage||0) + pet(s,false,ui.petEmotion);
 html += `<header class="hud"><div class="topbar"><button class="identity" data-act="growth" ${intro ? 'disabled' : ''} aria-label="${esc(s.name)}, день ${s.cycle}. Рост Пито"><span class="pet-name">${esc(s.name)}</span><span class="day-row"><span class="day-label">День ${s.cycle}</span><span class="hud-growth" role="progressbar" aria-label="Рост Пито" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(growthFill)}"><i style="width:${growthFill}%"></i></span></span></button><button class="wallet ${s.tutorial === 'plan' ? 'attention' : ''}" data-act="${s.tutorial === 'plan' ? 'plan' : 'wallet'}" aria-label="${number(s.wallet)} штучек. Мои деньги" ${intro && s.tutorial !== 'plan' ? 'disabled' : ''}>${coin(s.wallet)}</button><button class="round journal-button" data-act="journal" aria-label="Мои задания">${icon('task')}</button><button class="round settings-button" data-act="settings" aria-label="Настройки">${icon('settings')}</button></div>`;
 if (!ui.rainSession) html += taskCard(s);
 if (canChooseGoal) html += `<div class="goal-strip"><button class="goal-shortcut" data-act="${hasGoal(s)&&!goalWon ? 'goal' : 'choose-goal'}">${hasGoal(s)&&!goalWon ? itemArt(goal.id, 'icon') : icon('jar')}<span>${goalWon ? (allGoalsWon ? 'Все мечты сбылись' : 'Новая мечта') : hasGoal(s) ? `${esc(goal.name)} <small>${number(s.savings)} из ${goal.price}</small>` : 'Выбрать мечту'}</span>${hasGoal(s)&&!goalWon ? `<span class="goal-mini-meter"><i style="width:${Math.min(100, s.savings / goal.price * 100)}%"></i></span>` : icon('arrow')}</button>${bankAvailable ? `<button class="bank-shortcut" data-act="bank" aria-label="Вклад">${icon(s.deposit ? 'lock' : 'coin')}<span>Вклад</span>${s.deposit && s.completedCycles >= s.deposit.due ? '<i class="ready-dot"></i>' : ''}</button>` : ''}</div>`;
 html += '</header>';
 if (ui.needsOpen && !ui.rainSession) html += needsView(s);
 html += `<div id="poops">${s.poops.map(poop).join('')}</div>`;
 if (ui.rainSession) {
  html += needsView(s,'clean');
  html += `${ui.rainHint ? '<div class="rain-hint cloud-hint">Зажми тучку и веди над Пито и грязью.<small>Полив: 1 штучка за 3 секунды.</small></div>' : ''}<button class="rain-cloud" data-cloud style="left:${ui.cloudX ?? 70}%" aria-label="Тучка: удерживай и веди над Пито и грязью">${icon('cloud')}<span class="rain-drops" aria-hidden="true">${Array.from({length:8},(_,i)=>`<img src="assets/ui-v8/drop.png" alt="" style="--i:${i}">`).join('')}</span></button>`;
 }
 if (['food','wash','done'].includes(s.tutorial)) html += `<nav class="actions bottom" aria-label="Уход за Пито"><button class="action ${s.tutorial === 'food' ? 'attention' : ''}" data-act="food" ${s.tutorial === 'wash' ? 'disabled' : ''}>${itemArt('apple')}<span>Еда</span></button>${!intro ? `<button class="action" data-act="shop">${icon('toy-box')}<span>Вещи</span></button>` : ''}<button class="action ${ui.rainSession ? 'selected' : ''} ${s.tutorial === 'wash' && !ui.rainSession ? 'attention' : ''}" data-act="rain" ${s.tutorial === 'food' ? 'disabled' : ''} aria-pressed="${Boolean(ui.rainSession)}" aria-label="${ui.rainSession?'Убрать тучку':'Дождик'}">${icon('rain')}<span>${ui.rainSession?'Убрать':'Дождик'}</span></button></nav>`;
 return html;
}

function moneyReport(summary) {
 if (!summary) return '<p class="lead">Первый день ещё идёт.</p>';
 const spending = summary.expenses || {food:0,rain:0,wants:0};
 const total = spending.food + spending.rain + spending.wants;
 const fromSavings=Math.max(0,spending.wants-(summary.actual?.wants??spending.wants));
 const carried=Math.max(0,summary.walletEnd+spending.food+spending.rain+spending.wants-fromSavings+summary.saved+(summary.bankSaved||0)-summary.income);
 const foodEnd = total ? spending.food / total * 100 : 0;
 const rainEnd = total ? (spending.food + spending.rain) / total * 100 : 0;
 const categories = [['Еда','food','#9b63be'],['Дождик','rain','#64abd9'],['Хотелки','wants','#efb56c']];
 return `<div class="budget-chart"><div class="donut" style="background:${total ? `conic-gradient(#9b63be 0 ${foodEnd}%,#64abd9 ${foodEnd}% ${rainEnd}%,#efb56c ${rainEnd}% 100%)` : '#e2dbe5'}" aria-label="Расходы: еда ${number(spending.food)}, дождик ${number(spending.rain)}, хотелки ${number(spending.wants)}"><div class="donut-center"><strong>${number(total)}</strong><small>потрачено</small></div></div><div class="budget-legend">${categories.map(([name,key,color]) => `<div class="receipt-row"><span><i class="legend-dot" style="background:${color}"></i>${name}</span><strong>${number(spending[key])}</strong></div>`).join('')}</div></div><div class="receipt">${carried>0?`<div class="receipt-row"><span>Осталось со вчера</span>${coin(carried)}</div>`:''}<div class="receipt-row"><span>Получено</span>${coin(summary.income)}</div><div class="receipt-row"><span>${summary.saved < 0 ? 'Из копилки' : 'В копилку'}</span>${coin(Math.abs(summary.saved))}</div>${summary.bankSaved ? `<div class="receipt-row"><span>${summary.bankSaved > 0 ? 'На вклад' : 'Вернули со вклада'}</span>${coin(Math.abs(summary.bankSaved))}</div>` : ''}<div class="receipt-row total"><span>В кошельке</span>${coin(summary.walletEnd)}</div></div>${fromSavings ? `<p class="muted">Мечта куплена из копилки: ${coin(fromSavings)}. План ниже относится к кошельку.</p>` : ''}${summary.careBeforePlan?`<p class="muted">До плана на еду и воду ушло ${coin(summary.careBeforePlan)}. Ниже показаны траты после плана.</p>`:''}<div class="comparison"><div class="comparison-row comparison-head"><span></span><span>План</span><span>Вышло</span></div>${labels.map((name,i) => `<div class="comparison-row"><span>${i===2&&(summary.bankSaved||summary.depositEnd)?'Копилка и вклад':name}</span><strong>${number(summary.plan?.[i] || 0)}</strong><strong>${i===2&&summary.actual?.savings<0?`Забрали ${number(-summary.actual.savings)}`:number([summary.actual?.care,summary.actual?.wants,summary.actual?.savings][i] || 0)}</strong></div>`).join('')}</div>`;
}

function growthNote(summary) {
 const outcome=E.planOutcome(summary);
 return `<section class="plan-outcome"><h3>${outcome.title}</h3>${outcome.lines.map(line=>`<p>${esc(line)}</p>`).join('')}</section>`;
}

function journal(s, tab) {
 const done = tab === 'done';
 const missions = E.MISSIONS.filter(m => done ? E.missionStatus(s,m) === 'done' : E.missionStatus(s,m) === 'active');
 const current = E.currentMission(s);
 const tabs = `<div class="tabs" role="tablist" aria-label="Список заданий"><button class="tab ${!done ? 'selected' : ''}" role="tab" aria-selected="${!done}" data-act="journal-tab" data-id="active">Сейчас</button><button class="tab ${done ? 'selected' : ''}" role="tab" aria-selected="${done}" data-act="journal-tab" data-id="done">Выполнено · ${E.MISSIONS.filter(m => E.missionStatus(s,m) === 'done').length}</button></div>`;
 return tabs + `<div class="mission-list">${missions.length ? missions.map(m => {
  const entry = s.missions?.[m.id];
  if (done) return `<details class="mission-completed"><summary><span class="done-check" aria-label="Выполнено">${icon('check','icon status-icon')}</span><span>${m.id === 'buy' && entry?.resolution === 'deferred' ? 'Покупку отложили' : esc(m.title)}</span></summary><p>${esc(entry?.resolution === 'deferred' ? m.deferredLesson || missionLesson(s,m) : missionLesson(s,m))}</p></details>`;
  return `<button class="mission-row ${current?.id === m.id ? 'current' : ''}" data-act="guide" data-id="${m.id}">${itemArt(m.icon,'icon')}<span class="mission-copy"><strong>${esc(m.title)}</strong><small>${m.optional ? 'Можно попробовать позже' : esc(m.description)}</small></span>${icon('arrow')}</button>`;
 }).join('') : `<p class="lead">${done ? 'Здесь появятся выполненные задания.' : 'На сегодня всё. Можно просто побыть с Пито.'}</p>`}</div>`;
}

export function modalView(s, ui) {
 const simplified=kidMain(s,ui)||kidOverlay(s,ui);
 if(simplified)return simplified;
 if(ui.modal==='plan')return playPlanView(s,ui);
 const id = selectedId(ui);
 let title = '', body = '', footer = '', closable = true;
 switch (ui.modal) {
  case 'money-intro':
   title='Знакомься: штучки';closable=false;
   body=`<div class="event-art">${icon('coin')}</div><p class="lead">Это деньги в игре. За них покупают еду, воду и вещи для Пито.</p><div class="money-rhythm"><div>${icon('coin')}<strong>20 на старт</strong></div><div>${icon('coin')}<strong>Ещё 8 каждый игровой день</strong></div><div>${icon('task')}<strong>За задания ты получишь награды</strong></div></div>`;
   footer=button('Получить первые штучки','money-explained','','primary wide');break;
  case 'income-event': {
   const event=s.pendingIncome||{amount:0,source:'daily'};
   title=event.source==='deposit'?'Вклад принёс доход':event.source==='initial'?'Первые штучки!':'Карманные штучки';closable=false;
   body=`<div class="event-art">${icon('coin')}</div><div class="event-amount">+${coin(event.amount)}</div><p class="lead">${event.source==='deposit'?`Твои ${number(event.principal)} тоже вернулись в кошелёк. Ты подождал, и штучек стало больше.`:event.source==='initial'?'Купим Пито еду и помоем его.':`Начался игровой день ${s.cycle}. Деньги уже в кошельке.`}</p><p class="event-wallet">Теперь у тебя ${coin(s.wallet)}</p>`;
   footer=button(s.plan||!['plan','done'].includes(s.tutorial)?'К Пито':'Составить план','income-continue','','primary wide');break;
  }
  case 'reward-event': {
   const reward=s.pendingReward||{amount:0,title:'Задание выполнено',lesson:''};
   title=reward.title;closable=false;
   body=`<div class="event-art">${icon('coin')}</div><p class="eyebrow center">Награда за задание</p><div class="event-amount">+${coin(reward.amount)}</div><p class="lead">${esc(reward.lesson)}</p><p class="event-wallet">Теперь у тебя ${coin(s.wallet)}</p>`;
   footer=button('К Пито','reward-continue','','primary wide');break;
  }
  case 'grown-event':
   title='Пито вырос!';closable=false;
   body=`<div class="event-pet pet-stage-${s.stage}" inert aria-hidden="true">${pet({...s,stage:s.pendingGrowth?Math.max(1,s.stage):s.stage},false,'happy')}</div><p class="lead">${s.stage===2?'Смотри, какие длинные ноги!':'Смотри, у Пито появились усики!'}</p>`;
   footer=button('Вот это Пито!','grown-continue','','primary wide');break;
  case 'meet-guide':
   title = 'Познакомься с Пито'; body = icon('hand','art big') + '<p class="lead">Нажми на Пито. Кружочки покажут, чего ему не хватает.</p>'; footer = back(); break;
  case 'guide': {
   const m = missionById(id) || E.currentMission(s);
   title = m?.title || 'Мои задания';
   body = m ? itemArt(m.icon,'art big') + `<p class="lead">${esc(missionDescription(m))}</p>${m.reward&&!s.missions?.[m.id] ? `<p class="mission-reward">Награда: +${coin(m.reward)}</p>` : ''}` : '<p>Все доступные задания выполнены.</p>';
   footer = back(); break;
  }
  case 'food': {
   const free = !s.onboardingPaid && s.tutorial === 'food'; title = free ? 'Угости Пито' : 'Еда';
   body = `<p class="lead">${free ? 'Первое яблоко бесплатно.' : 'Цена и сытность'}</p><div class="product-grid">${(s.tutorial==='food' ? E.FOOD.slice(0,1) : E.FOOD).map(f => `<button class="product" data-act="select-food" data-id="${f.id}">${itemArt(f.id)}<strong>${f.name}</strong><span class="product-price">${free ? 'Бесплатно' : coin(f.price)}</span>${segments(0, (free ? 50 : f.gain) / 20)}</button>`).join('')}</div>`;
   break;
  }
  case 'feed': {
   const f = E.FOOD.find(f => f.id === id) || E.FOOD[0], free = !s.onboardingPaid && s.tutorial === 'food';
   const gain = Math.min(100 - s.needs.food, free ? 50 : f.gain), full = s.needs.food >= 100, short = !free && s.wallet < f.price;
   title = f.name;
   body = itemArt(f.id,'art big') + `<div class="food-gain"><p>Сытость</p>${segments(s.needs.food / 20, gain / 20)}<small>Зелёным показана прибавка</small></div>${free ? '<p class="center">Бесплатно</p>' : `<div class="receipt"><div class="receipt-row"><span>Цена</span>${coin(f.price)}</div><div class="receipt-row"><span>У тебя</span>${coin(s.wallet)}</div></div>`}${full ? '<p class="notice">Пито уже сыт.</p>' : short ? `<p class="notice">Не хватает ${coin(f.price - s.wallet)}. Новый день принесёт ещё 8 штучек.</p>` : !free && s.needs.food + f.gain > 100 ? `<p class="muted">${f.price>E.FOOD[0].price?'Пито почти сыт. Хватит и более дешёвой еды.':'Пито почти сыт. Можно покормить его позже.'}</p>` : ''}`;
   footer = button(free ? 'Угостить' : `Покормить ${coin(f.price)}`, 'feed-confirm', full || short ? 'disabled' : '', 'primary wide') + (full || short ? back() : ''); break;
  }
  case 'care-result': {
   const m = missionById(s.tutorial === 'fed' ? 'feed' : 'wash');
   title = s.tutorial === 'fed' ? 'Пито поел!' : 'Теперь чисто!'; closable = false;
   body = itemArt(m.icon,'art big') + `<p class="lead">${esc(missionLesson(s,m))}</p><p class="completion-mark">${icon('check','icon status-icon')} ${esc(m.title)}</p>`;
   footer = button('К Пито','care-next','','primary wide'); break;
  }
  case 'result': {
   const feedback = ui.feedback || {}, m = missionById(feedback.id);
   title = feedback.title || 'Получилось!';
   const entries = (feedback.entries || []).filter(e => e.kind !== 'income' || !e.source?.startsWith('mission:'));
   const receipts = entries.map(entry => {
    let label = entry.label, prefix = '';
    if (entry.kind === 'expense') prefix = '−';
    if (entry.kind === 'transfer') {label = entry.amount > 0 ? 'Из кошелька в копилку' : 'Из копилки в кошелёк'; prefix = entry.amount > 0 ? '−' : '+';}
    if (entry.kind === 'bank-in') {label = 'На вклад'; prefix = '−';}
    if (entry.kind === 'income' || entry.kind === 'bank-out') prefix = '+';
    return `<div class="receipt-row"><span>${esc(label)}${entry.source === 'savings' ? ' · из копилки' : ''}</span><strong>${prefix}${coin(Math.abs(entry.amount))}</strong></div>`;
   }).join('');
   body = itemArt(m?.icon || 'task','art big') + `<p class="lead">${esc(feedback.lesson || m?.lesson || '')}</p>${receipts ? `<div class="receipt">${receipts}</div>` : ''}${feedback.reward ? `<div class="reward-receipt"><span>За задание</span><strong>+${coin(feedback.reward)}</strong></div>` : ''}<div class="receipt-row total"><span>В кошельке теперь</span>${coin(s.wallet)}</div>`;
   footer = back(); break;
  }
  case 'plan': return planView(s,ui);
  case 'wallet':
  case 'budget': {
   const last = ui.budgetTab === 'last', summary = last ? s.periods?.at(-1) : E.cycleSummary(s);
   title = 'Мои штучки';
   body = `<div class="tabs" role="tablist" aria-label="Период расходов"><button class="tab ${!last ? 'selected' : ''}" data-act="budget-tab" data-id="today" role="tab" aria-selected="${!last}">Сегодня</button><button class="tab ${last ? 'selected' : ''}" data-act="budget-tab" data-id="last" role="tab" aria-selected="${last}" ${!s.periods?.length ? 'disabled' : ''}>Прошлый день</button></div>${summary ? `<p class="eyebrow">День ${summary.cycle}</p>` : ''}${moneyReport(summary)}`;
   break;
  }
  case 'review':
  case 'last-period': {
   const summary = s.periods?.at(-1) || E.cycleSummary(s);
   title = `День ${summary.cycle} завершён`;
   body = '';
   body += moneyReport(summary) + growthNote(summary);
   if (ui.modal === 'review') {closable = false; footer = button(`Новый день · +${coin(8)}`,'next-cycle','','primary wide');}
   else footer = s.review?button('К итогу дня','close','','secondary wide'):back();
   break;
  }
  case 'choose-goal':
   title = 'На что будем копить?';
   body = `<div class="goal-options goal-choices">${E.GOALS.map(g => `<button class="product ${(hasGoal(s) && !s.goalsWon.includes(s.goal) ? s.goal : s.plannedGoal) === g.id ? 'selected' : ''}" data-act="goal-choice" data-id="${g.id}" ${s.goalsWon.includes(g.id)?'disabled':''}>${itemArt(g.id)}<strong>${g.name}</strong>${coin(g.price)}${s.goalsWon.includes(g.id) ? '<small>Уже на лужайке</small>' : ''}</button>`).join('')}</div>`;
   break;
  case 'goal': {
   const g = currentGoal(s), amount = Number(ui.transferAmount) || 0, won = s.goalsWon.includes(g.id);
   const plannedAmount = Math.max(0,Math.min(Math.floor(s.wallet) - 4,(s.plan?.[2] || 0) - Math.max(0,E.cycleSummary(s).actual.savings)));
   title = g.name;
   body = itemArt(g.id,'art big') + `<div class="goal-progress"><strong>${number(s.savings)} из ${g.price}</strong><span class="meter"><i style="width:${Math.min(100,s.savings / g.price * 100)}%"></i></span></div>${won ? '<p class="notice">Уже на лужайке.</p>' : s.savings >= g.price ? '<p class="lead">На мечту накопили!</p><p class="muted">Покупка оплачивается из копилки.</p>' : `<div class="receipt-row"><span>В кошельке</span>${coin(s.wallet)}</div><div class="transfer-control"><span>В копилку</span>${stepper('transfer-step',amount,'',Math.floor(s.wallet))}</div>${plannedAmount > 0 ? button(`По плану: ${coin(plannedAmount)}`,'transfer-plan','','secondary plan-amount-chip') : ''}${amount && s.wallet - amount < 4 ? '<p class="notice">На еду и воду останется меньше 4 штучек.</p>' : ''}`}<div class="goal-secondary">${button('Другая мечта','choose-goal','','text')}${button('Забрать 1 штучку','withdraw',s.savings < 1 ? 'disabled' : '', 'text')}</div>${error(ui)}`;
   footer = !won && s.savings >= g.price ? button(`Купить ${coin(g.price)}`,'claim-goal','','primary wide') : !won ? button(`Отложить ${coin(amount)}`,'transfer',amount <= 0 || amount > s.wallet ? 'disabled' : '', 'primary wide') : back();
   break;
  }
  case 'withdraw':
   title = 'Взять 1 из копилки?';
   body = icon('jar','art big') + `<div class="receipt"><div class="receipt-row"><span>В копилке сейчас</span>${coin(s.savings)}</div><div class="receipt-row"><span>Останется</span>${coin(Math.max(0,s.savings - 1))}</div></div><p class="muted">До мечты станет на одну штучку дальше.</p>`;
   footer = button('Взять 1','withdraw-confirm',s.savings < 1 ? 'disabled' : '', 'primary wide'); break;
  case 'shop':
   title = 'Хотелки';
   body = `<p class="lead">У каждой вещи есть своё место на лужайке.</p><div class="product-grid">${E.ITEMS.map(item => `<button class="product" data-act="select-item" data-id="${item.id}" ${s.owned.includes(item.id) ? 'disabled' : ''}>${itemArt(item.id)}<strong>${item.name}</strong>${s.owned.includes(item.id) ? '<small>Уже есть</small>' : coin(item.price)}</button>`).join('')}</div>`;
   if (E.missionStatus(s,missionById('buy')) === 'active') footer = button('Пока не покупать','defer-buy','','secondary wide');
   break;
  case 'buy': {
   const item = E.ITEMS.find(item => item.id === id) || E.ITEMS[0], enough = s.wallet >= item.price;
   title = item.name; body = itemArt(item.id,'art big') + `<div class="receipt"><div class="receipt-row"><span>Цена</span>${coin(item.price)}</div><div class="receipt-row"><span>У тебя</span>${coin(s.wallet)}</div>${enough ? `<div class="receipt-row"><span>Останется</span>${coin(s.wallet - item.price)}</div>` : ''}</div>${!enough ? `<p class="notice">Не хватает ${coin(item.price - s.wallet)}. Можно вернуться к Пито и подождать нового дня.</p>` : s.wallet - item.price < 4 ? '<p class="notice">После покупки на еду и воду останется меньше 4.</p>' : ''}`;
   footer = button(`Купить ${coin(item.price)}`,'buy-confirm',!enough || s.owned.includes(item.id) ? 'disabled' : '', 'primary wide') + (!enough ? back() : ''); break;
  }
  case 'bank': {
   title = 'Вклад'; const deposit = s.deposit, left = deposit ? Math.max(0,deposit.due - s.completedCycles) : 1, principal=deposit?.principal||10, returned=deposit?Math.ceil(deposit.principal+deposit.bonus):10+E.DEPOSIT_BONUS;
   body = `<div class="bank-offer"><div class="bank-step">${coin(principal)}<small>${deposit ? 'На вкладе' : 'Положить'}</small></div>${icon('arrow')}<div class="bank-step">${coin(returned)}<small>Забрать</small></div></div><p class="lead">${deposit ? left ? `Осталось дней: ${left}. Раньше забрать нельзя.` : `Можно забрать ${number(returned)}: твои ${number(principal)} и ещё ${number(returned-principal)} дохода по вкладу.` : `Подожди один игровой день. Получишь ещё ${E.DEPOSIT_BONUS} штучек.`}</p>${!deposit ? `<p class="notice">До конца срока деньги недоступны.</p><div class="receipt-row"><span>У тебя</span>${coin(s.wallet)}</div><div class="receipt-row"><span>После вклада останется</span>${coin(Math.max(0,s.wallet - 10))}</div>${s.wallet < 14 ? '<p class="muted">Нужно 10 на вклад и ещё 4 оставить на еду и воду.</p>' : ''}` : ''}${error(ui)}`;
   footer = deposit ? button(`Забрать ${coin(returned)}`,'bank-collect',left > 0 ? 'disabled' : '', 'primary wide') : button(`Положить ${coin(10)}`,'bank-open',s.wallet < 14 || s.cycle < 3 || !s.missions?.save ? 'disabled' : '', 'primary wide'); if(deposit&&left>0||!deposit&&s.wallet<14)footer+=back(); break;
  }
  case 'journal': title = 'Мои задания'; body = journal(s,ui.journalTab); break;
  case 'growth': {
   title = s.stage === 2 ? 'Пито вырос!' : 'Пито растёт'; const progress = E.growthProgress(s);
   body = `<div class="growth-details"><p class="lead">${progress.complete ? 'Можно продолжать копить на мечты и собирать вещи.' : 'Покупай нужное, откладывай штучки и сверяйся с планом. Так Пито растёт.'}</p>${!progress.complete ? `<div class="goal-progress"><span class="meter"><i style="width:${Math.min(100,Math.max(0,(progress.points-(s.stage===1?4:0))/(progress.nextThreshold-(s.stage===1?4:0))*100))}%"></i></span><p>${progress.remaining ? `Ещё ${progress.remaining} шагов роста` : 'Шаги роста собраны'}${progress.cyclesRemaining ? ` · не раньше чем через ${progress.cyclesRemaining} ${progress.cyclesRemaining === 1 ? 'день' : 'дня'}` : ''}</p></div>` : ''}</div>`;
   if (s.periods?.length) footer = button('Как прошёл прошлый день','last-period','','secondary wide'); break;
  }
  case 'settings':
   title = 'Настройки';
   body = `<div class="settings-list">${button('Как играть','help','','secondary wide')}${button('Для взрослого','adult-gate','','secondary wide')}</div><p class="muted">Прогресс сохраняется автоматически.</p>`; break;
  case 'help':
   title = 'Как играть';
   body = `<div class="help-list"><section>${icon('hand')}<div><h3>Пито</h3><p>Нажми, чтобы увидеть потребности. Зажми и поводь по нему, чтобы погладить.</p></div></section><section>${itemArt('apple','icon')}<div><h3>Еда</h3><p>Цена указана у монетки. Зелёные деления показывают, сколько сытости добавится.</p></div></section><section>${icon('rain')}<div><h3>Дождик</h3><p>Держи облако над Пито и грязью. Вода расходует штучки. Грязь можно убрать и несколькими тапами.</p></div></section><section>${icon('coin')}<div><h3>План и расходы</h3><p>В плане ты выбираешь, на что оставить деньги. Нажми на кошелёк, чтобы сравнить план с тратами.</p></div></section><section>${icon('jar')}<div><h3>Копилка и вклад</h3><p>В копилке ты собираешь на мечту. Во вкладе деньги ждут один игровой день и возвращаются с доходом. Сумму возврата увидишь до открытия.</p></div></section><section>${icon('task')}<div><h3>Задания</h3><p>Карточка под именем подсказывает, что попробовать. Список со значком блокнота хранит выполненные задания.</p></div></section></div>`;
   break;
  case 'gate':
   title = 'Для взрослого'; body = `<p class="gate-example">${ui.gate?.a} × ${ui.gate?.b} − ${ui.gate?.c} = ?</p><input class="kbd-input" id="gate-answer" aria-label="Ответ на пример" inputmode="numeric" autocomplete="off">${error(ui)}`; footer = button('Открыть','gate-submit','','primary wide'); break;
  case 'parent':
   title = 'Чему учится ребёнок';
   body = `<p class="lead">${esc(s.name)} · дней вместе: ${s.completedCycles}</p>${['Покупки','Планирование','Накопления'].map(theme => `<section class="theme-block"><h3>${theme}</h3>${E.MISSIONS.filter(m => m.theme === theme).map(m => {const entry = s.missions?.[m.id]; return `<div class="parent-topic"><strong>${entry ? icon('check','icon status-icon') : '○'} ${esc(m.title)}</strong><p>${entry ? esc(entry.resolution === 'deferred' ? m.deferredLesson || missionLesson(s,m) : missionLesson(s,m)) : 'Пока не пробовали.'}</p></div>`;}).join('')}</section>`).join('')}<p class="muted">Это журнал действий, не оценка знаний. Все деньги игровые.</p>`;
   footer = button('Начать игру заново','reset-ask','','danger wide'); break;
  case 'dev':
   title = 'Разработчик';
   body = s ? `<p class="muted">День ${s.cycle} · ${Math.floor(s.elapsed)} / ${E.CYCLE_SECONDS} сек.</p><h3>Скорость времени</h3><div class="dev-grid">${[0,1,3,10].map(n => button(n ? `×${n}` : 'Пауза','dev-speed',`data-id="${n}"`,s.speed === n ? 'primary' : 'secondary')).join('')}</div><h3>Проверка</h3><div class="dev-grid">${button('Завершить день','dev-cycle','','secondary')}${button('+10 штучек','dev-money','','secondary')}${button('Проголодаться','dev-hunger','','secondary')}${button('Полные потребности','dev-needs','','secondary')}${button('Добавить грязь','dev-poop','','secondary')}${button('Сбросить всё','reset-ask','','danger')}</div><p class="muted">Время не заменяет финансовые решения: рост проверяется по итогам дня.</p>` : '<p>Сначала создай Пито.</p>';
   break;
  case 'reset':
   title = 'Начать с нуля?'; body = '<p class="lead">Этот Пито, покупки и прогресс веб-прототипа будут удалены.</p><p class="muted">Проект Unity останется без изменений.</p>'; footer = button('Удалить и начать заново','reset-confirm','','danger wide') + button('Оставить Пито','close','','secondary wide'); break;
  case 'goal-won':
   title = 'Накопили!'; body = itemArt(currentGoal(s).id,'art big') + `<p class="lead">${esc(currentGoal(s).name)} теперь на лужайке. Можно выбрать новую мечту или просто играть.</p><div class="receipt"><div class="receipt-row"><span>Оплачено из копилки</span>${coin(currentGoal(s).price)}</div><div class="receipt-row"><span>В копилке осталось</span>${coin(s.savings)}</div></div>`; footer = back(); break;
  case 'no-money':
   title = 'Не хватает штучек'; body = `<p class="lead">У тебя ${number(s.wallet)}. Можно отложить покупку до следующего дня.</p><p class="muted">Новый день принесёт ещё 8 штучек.</p>`; footer = back(); break;
  default:
   title = 'Пито'; body = '<p class="lead">Пойдём на лужайку.</p>'; footer = back();
 }
 return {title, body, footer, closable};
}
