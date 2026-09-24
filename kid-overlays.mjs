import * as E from './engine.mjs';
import {art, icon} from './visuals.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number.isFinite(Number(value))?Number(value):0);
const coin = amount => `<span class="coin">${icon('coin')}<span>${number(amount)}</span></span>`;
const button = (text, action, {disabled=false, secondary=false, extra=''}={}) => `<button class="btn ko-button ${secondary?'secondary':'primary'}" data-act="${action}" ${disabled?'disabled':''} ${extra}>${text}</button>`;
const back = () => button('К Пито','close',{secondary:true});
const ready = s => s.tutorial==='done' && Boolean(s.plan) && !s.review && !s.pendingGrowth && !s.adultNotice && !s.pendingPurchase && !s.pendingIncome && !s.pendingReward;
const error = ui => ui.error?`<p class="ko-message error" role="alert">${esc(ui.error)}</p>`:'';
const wrap = content => `<div class="ko-content">${content}</div>`;
const goalArrow = (dir,disabled=false) => `<button class="ko-goal-arrow ${dir<0?'previous':''}" data-act="goal-step" data-id="${dir}" aria-label="${dir<0?'Предыдущая мечта':'Следующая мечта'}" ${disabled?'disabled':''}>${icon('arrow')}</button>`;

function goalView(s,ui) {
  const g = E.GOALS.find(g=>g.id===s.goal)||E.GOALS[0];
  const won = s.goalsWon.includes(g.id), enough = s.savings>=g.price;
  const amount = ui.transferMode==='manual'?Number(ui.transferAmount):E.plannedSavingsAmount(s), validAmount = Number.isInteger(amount)&&amount>0&&amount<=Math.min(s.wallet,E.goalRemaining(s));
  const planned = E.plannedSavingsAmount(s);
  const savingDone = E.cycleSummary(s).actual.savings >= (s.plan?.[2]??0);
  const manual = ui.transferMode==='manual';
  const careLeft=Math.max(0,(s.plan?.[0]??4)-Math.max(0,E.cycleSummary(s).actual.care));
  const choices=E.GOALS.filter(goal=>!s.goalsWon.includes(goal.id));
  const cannotBrowse=!ready(s)||choices.length===0||(choices.length===1&&choices[0].id===g.id);
  const hero = `<div class="ko-goal-carousel">${goalArrow(-1,cannotBrowse)}<div class="ko-goal-art">${art(g.id,'art')}</div>${goalArrow(1,cannotBrowse)}</div><p class="ko-goal-price">Цена ${coin(g.price)}</p>`;
  const progress = `<div class="ko-progress" role="progressbar" aria-label="Накоплено на мечту" aria-valuemin="0" aria-valuemax="${g.price}" aria-valuenow="${Math.min(s.savings,g.price)}" aria-valuetext="${number(s.savings)} из ${g.price}"><i style="width:${Math.min(100,s.savings/g.price*100)}%"></i></div>`;
  let body = hero+`<p class="ko-item-story">${esc(g.description)}</p>`+progress+`<div class="ko-saving-progress"><span>В копилке ${coin(s.savings)}</span><span>${won?'Уже на лужайке':enough?'Накопили!':`Осталось ${coin(Math.max(0,g.price-s.savings))}`}</span></div>`;
  if(ui.transferNotice) body+=`<p class="ko-transfer-notice" role="status">${icon('check')}${esc(ui.transferNotice)}</p>`;
  if (!won&&!enough) {
    body+=`<div class="ko-transfer-modes" role="group" aria-label="Как пополнить копилку"><button data-act="transfer-mode" data-id="plan" aria-pressed="${!manual}" ${!ready(s)?'disabled':''}>По плану</button><button data-act="transfer-mode" data-id="manual" aria-pressed="${manual}" ${!ready(s)?'disabled':''}>Вручную</button></div>`;
    if(manual) body+=`<div class="ko-transfer-stepper"><button data-act="transfer-step" data-delta="-1" aria-label="Отложить на одну штучку меньше" ${!ready(s)||amount<=1?'disabled':''}>−</button><output aria-live="polite">${coin(Number.isFinite(amount)?Math.max(0,amount):0)}</output><button data-act="transfer-step" data-delta="1" aria-label="Отложить на одну штучку больше" ${!ready(s)||amount>=Math.min(s.wallet,E.goalRemaining(s))?'disabled':''}>+</button></div>`;
    else body+=`<p class="ko-planned-amount">${planned?`Отложим ${coin(planned)}`:savingDone?'Всё по плану уже отложили':'Пока не хватает свободных штучек'}</p>`;
    if(validAmount&&s.wallet-amount<careLeft)body+='<p class="ko-message">Если отложить ещё, останется мало на еду и воду.</p>';
    if(s.wallet<1)body+='<p class="ko-message">Завтра будут новые штучки.</p>';
  }
  body+=error(ui);
  const footer = won?back():enough?button(`Купить ${coin(g.price)}`,'claim-goal',{disabled:!ready(s),extra:`data-category="wants" data-price="${g.price}" data-effect="collection"`}) : !manual&&planned===0?back():button(`Отложить ${coin(validAmount?amount:0)}`,'transfer',{disabled:!ready(s)||!validAmount,extra:'data-category="savings" data-effect="goal-progress"'});
  return {title:g.name,body:wrap(body),footer,closable:true};
}

function bankView(s,ui) {
  const deposit = s.deposit;
  const validDeposit = !deposit || Number.isFinite(deposit.principal)&&deposit.principal>=0&&Number.isFinite(deposit.bonus)&&deposit.bonus>=0&&Number.isFinite(deposit.due);
  const funding = ['wallet','savings'].includes(ui.depositSource)?ui.depositSource:E.depositFunding(s,1)||'wallet';
  const available = Math.max(0,Math.floor(s[funding]||0));
  const amount = Number.isSafeInteger(ui.depositAmount)?ui.depositAmount:Math.min(10,available);
  const principal = deposit?.principal??Math.max(0,amount);
  const returned = deposit?Math.ceil(deposit.principal+deposit.bonus):principal+E.depositBonus(principal);
  const left = deposit?Math.max(0,deposit.due-s.completedCycles):1;
  const eligible = ready(s)&&s.cycle>=3&&Boolean(s.missions?.save&&s.missions?.goal);
  const fromSavings = !deposit&&funding==='savings';
  const canOpen = eligible && !deposit && Number.isSafeInteger(amount)&&amount>0&&amount<=available;
  const canCollect = ready(s)&&Boolean(deposit)&&left===0&&validDeposit;
  let message = deposit ? left>0?'До конца срока эти штучки нельзя потратить.':'Можно забрать штучки и доход!' : 'До конца срока эти штучки нельзя потратить.';
  if (!deposit&&!eligible) message = 'Сначала попробуй копилку. Вклад появится на третий день.';
  else if (!deposit&&available<1) message = 'Здесь пока нет штучек.';
  if (!validDeposit) message='Этот вклад не удалось прочитать.';
  const term = left===0?'Срок закончился':left===1?'Через 1 игровой день':`Через ${number(left)} игровых дня`;
  const controls = deposit?'':`<div class="ko-transfer-modes ko-bank-sources" role="group" aria-label="Откуда взять штучки"><button data-act="bank-source" data-id="wallet" aria-pressed="${!fromSavings}" ${!eligible?'disabled':''}>Из кошелька ${coin(s.wallet)}</button><button data-act="bank-source" data-id="savings" aria-pressed="${fromSavings}" ${!eligible?'disabled':''}>Из копилки ${coin(s.savings)}</button></div><div class="ko-transfer-stepper ko-bank-stepper"><button data-act="bank-step" data-delta="-1" aria-label="Вложить на одну штучку меньше" ${!eligible||amount<=1?'disabled':''}><img src="./assets/ui-v11/minus.png" class="icon" alt=""></button><output aria-live="polite">${coin(principal)}</output><button data-act="bank-step" data-delta="1" aria-label="Вложить на одну штучку больше" ${!eligible||amount>=available?'disabled':''}><img src="./assets/ui-v11/plus.png" class="icon" alt=""></button></div>`;
  const warning=!deposit&&funding==='wallet'&&available-amount<E.careReserve(s)?'<p class="ko-message ko-bank-warning">На еду и воду останется меньше, чем ты запланировал.</p>':'';
  const body = `${controls}<div class="ko-bank-offer"><div>${coin(principal)}<span>${deposit?'Положили':'Положишь'}</span></div>${icon('arrow')}<div>${coin(returned)}<span>Заберёшь</span></div></div><div class="ko-bank-term" aria-label="${deposit?`Осталось игровых дней: ${number(left)}`:'Ждать 1 игровой день'}">${icon(left===0?'check':'lock')}<strong>${term}</strong></div><p class="ko-main-copy">${message}</p>${warning}${error(ui)}`;
  const footer = deposit ? canCollect?button(`Забрать ${coin(returned)}`,'bank-collect',{extra:'data-category="savings" data-effect="income"'}):back() : button(`${fromSavings?'Положить из копилки':'Положить'} ${coin(principal)}`,'bank-open',{disabled:!canOpen,extra:`data-category="savings" data-effect="deposit-lock" data-funding-source="${funding}" data-deposit-amount="${principal}"`})+(!canOpen?back():'');
  return {title:'Вклад',body:wrap(body),footer,closable:true};
}

function journalView(s,ui) {
  const done = ui.journalTab==='done';
  const missions = E.MISSIONS.filter(m=>E.missionStatus(s,m)===(done?'done':'active'));
  const current = E.currentMission(s);
  const tabs = `<div class="ko-tabs" role="tablist" aria-label="Список заданий">${[['active','Сейчас'],['done','Выполнено']].map(([id,label])=>`<button role="tab" aria-selected="${done===(id==='done')}" data-act="journal-tab" data-id="${id}">${label}</button>`).join('')}</div>`;
  const items = missions.map(m=>{
    const deferred = s.missions?.[m.id]?.resolution==='deferred';
    if (done) {
      let lesson=deferred?m.deferredLesson||m.lesson:m.lesson;
      if (!s.onboardingPaid&&m.id==='feed')lesson='Первое яблоко было бесплатным. Следующую еду покупают за штучки.';
      if (!s.onboardingPaid&&m.id==='wash')lesson='Первое мытьё было бесплатным. Теперь вода стоит штучки.';
      return `<details class="ko-completed"><summary><span class="ko-check" aria-hidden="true">${icon('check','icon status-icon')}</span><span>${esc(deferred&&m.id==='buy'?'Покупку отложили':m.title)}</span></summary><p>${esc(lesson)}</p></details>`;
    }
    return `<button class="ko-mission ${current?.id===m.id?'current':''}" data-act="guide" data-id="${esc(m.id)}">${art(m.icon,'icon')}<strong>${esc(m.title)}</strong>${icon('arrow')}</button>`;
  }).join('');
  return {title:'Мои задания',body:wrap(tabs+(items||`<p class="ko-main-copy">${done?'Здесь появятся твои успехи.':'Можно поиграть с Пито.'}</p>`)),footer:'',closable:true};
}

/** Pure optional view layer; returns null for routes owned by views.mjs. */
export function kidOverlay(s,ui) {
  if (!s) return null;
  switch(ui.modal) {
    case 'goal': return goalView(s,ui);
    case 'choose-goal': {
      const selected=E.availableGoalChoice(s,ui.goalChoice);
      const choice=E.GOALS.find(g=>g.id===selected&&!s.goalsWon.includes(g.id));
      const body=wrap(`<div class="ko-goal-options">${E.GOALS.map(g=>`<button class="ko-goal-choice ${selected===g.id?'selected':''}" data-act="goal-choice" data-id="${esc(g.id)}" aria-pressed="${selected===g.id}" ${!ready(s)||s.goalsWon.includes(g.id)?'disabled':''}>${art(g.id,'art')}<strong>${esc(g.name)}</strong>${s.goalsWon.includes(g.id)?`<span class="ko-owned">${icon('check','icon status-icon')} Уже есть</span>`:coin(g.price)}</button>`).join('')}</div>${choice?`<p class="ko-choice-story">${esc(choice.description)}</p>`:'<p class="ko-choice-story">На что хочешь накопить?</p>'}`);
      return {title:'Выбери мечту',body,footer:button('Выбрать мечту','goal-confirm',{disabled:!ready(s)||!choice}),closable:true};
    }
    case 'withdraw': return {title:'Взять из копилки?',body:wrap(`${art('jar','ko-jar art')}<div class="ko-main-copy">Останется ${coin(Math.max(0,s.savings-1))}</div><p class="ko-message">До мечты дальше на 1 штучку.</p>${error(ui)}`),footer:button(`Взять ${coin(1)}`,'withdraw-confirm',{disabled:!ready(s)||s.savings<1,extra:'data-category="savings" data-effect="withdraw-one"'}),closable:true};
    case 'bank': return bankView(s,ui);
    case 'journal': return journalView(s,ui);
    default:return null;
  }
}
