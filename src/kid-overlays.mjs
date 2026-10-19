import * as E from './engine.mjs';
import {art, icon} from './visuals.mjs';
import {missionLearning,childLearning} from './learning-copy.mjs';
import {parentSkills} from './parent-progress.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number.isFinite(Number(value))?Number(value):0);
const coin = amount => `<span class="coin">${icon('coin')}<span>${number(amount)}</span></span>`;
const button = (text, action, {disabled=false, secondary=false, extra=''}={}) => `<button class="btn ko-button ${secondary?'secondary':'primary'}" data-act="${action}" ${disabled?'disabled':''} ${extra}>${text}</button>`;
const back = () => button('К Пито','close',{secondary:true});
const ready = s => s.tutorial==='done' && Boolean(s.plan) && !s.review && !s.pendingGrowth && !s.adultNotice && !s.pendingPurchase && !s.pendingIncome && !s.pendingReward;
const error = ui => ui.error?`<p class="ko-message error" role="alert">${esc(ui.error)}</p>`:'';
const wrap = content => `<div class="ko-content">${content}</div>`;
const goalArrow = (dir,id,disabled=false) => `<button class="btn rv-goal-arrow ${dir<0?'previous':''}" data-act="goal-choice" data-id="${esc(id)}" aria-label="${dir<0?'Предыдущая мечта':'Следующая мечта'}" ${disabled?'disabled':''}>${icon('arrow')}</button>`;

function goalView(s,ui) {
  const g = E.GOALS.find(g=>g.id===s.goal)||E.GOALS[0];
  const won = s.goalsWon.includes(g.id), enough = s.savings>=g.price;
  const limit = Math.max(0,Math.floor(Math.min(s.wallet,E.goalRemaining(s))));
  const requested = ui.transferMode==='manual'&&Number.isSafeInteger(ui.transferAmount)?ui.transferAmount:1;
  const amount = limit?Math.min(limit,Math.max(1,requested)):0, validAmount = amount>0;
  const planned = s.plan?.[2]??0, savedToday = E.cycleSummary(s).actual.savings;
  const careLeft=Math.max(0,(s.plan?.[0]??4)-Math.max(0,E.cycleSummary(s).actual.care));
  const hero = `<section class="rv-dream-hero"><div class="rv-dream-picture">${art(g.id,'art')}</div><h3>${esc(g.name)}</h3></section>`;
  const progress = `<div class="ko-progress" role="progressbar" aria-label="Накоплено на мечту" aria-valuemin="0" aria-valuemax="${g.price}" aria-valuenow="${Math.min(s.savings,g.price)}" aria-valuetext="${number(s.savings)} из ${g.price}"><i style="width:${Math.min(100,s.savings/g.price*100)}%"></i></div>`;
  const saved = `<section class="rv-plate rv-lavender rv-saved">${icon('jar','rv-jar')}<div><h3>В копилке</h3><p>${coin(s.savings)} из ${number(g.price)}</p>${progress}${won?'<small>Уже на лужайке</small>':enough?'<small>Накопили!</small>':''}</div></section>`;
  if(E.pacedIntro(s)&&s.missions?.goal)return {title:'Моя мечта',body:`<div class="revision-overlay rv-savings">${hero}${saved}<p>Это твоя мечта! Скоро составим план и начнём на неё откладывать.</p></div>`,footer:back(),closable:true};
  let body = hero+saved+`<section class="rv-plate rv-peach rv-savings-plan"><img class="rv-plan-icon" src="assets/revision/dream-plan-v2.png" alt=""><div><p><span>По плану</span>${coin(planned)}</p><p><span>Отложено</span>${coin(savedToday)}</p></div></section>`;
  if(ui.transferNotice) body+=`<p class="ko-transfer-notice" role="status">${icon('check')}${esc(ui.transferNotice)}</p>`;
  if (!won&&!enough) {
    body+=`<section class="rv-plate rv-cream rv-amount"><h3>Сколько отложим в копилку?</h3><div class="rv-stepper ko-transfer-stepper" role="group" aria-label="Сколько отложить в копилку"><button class="btn" data-act="transfer-step" data-delta="-1" aria-label="Отложить на одну штучку меньше" ${!ready(s)||amount<=1?'disabled':''}>${icon('minus')}</button><output aria-live="polite">${coin(amount)}</output><button class="btn" data-act="transfer-step" data-delta="1" aria-label="Отложить на одну штучку больше" ${!ready(s)||amount>=limit?'disabled':''}>${icon('plus')}</button></div></section>`;
    if(validAmount&&s.wallet-amount<careLeft)body+='<p class="ko-message">Если отложить ещё, останется мало на еду и воду.</p>';
    if(s.wallet<1)body+='<p class="ko-message">Завтра будут новые штучки.</p>';
  }
  body+=error(ui);
  const footer = won?back():enough?button(`Купить ${coin(g.price)}`,'claim-goal',{disabled:!ready(s),extra:`data-category="wants" data-price="${g.price}" data-effect="collection"`}) : button(`Отложить ${coin(amount)}`,'transfer',{disabled:!ready(s)||!validAmount,extra:'data-category="savings" data-effect="goal-progress"'});
  return {title:'Моя мечта',body:`<div class="revision-overlay rv-savings">${body}</div>`,footer,closable:true};
}

function bankView(s,ui) {
  const deposit = s.deposit;
  const validDeposit = !deposit || Number.isFinite(deposit.principal)&&deposit.principal>=0&&Number.isFinite(deposit.bonus)&&deposit.bonus>=0&&Number.isFinite(deposit.due);
  const funding = 'wallet';
  const available = Math.max(0,Math.floor(s.wallet||0));
  const amount = Number.isSafeInteger(ui.depositAmount)?Math.max(E.DEPOSIT_MIN,ui.depositAmount):E.DEPOSIT_MIN;
  const principal = deposit?.principal??Math.max(0,amount);
  const returned = deposit?Math.ceil(deposit.principal+deposit.bonus):principal+E.depositBonus(principal);
  const left = deposit?Math.max(0,deposit.due-s.completedCycles):E.DEPOSIT_DAYS;
  const eligible = ready(s)&&E.bankAvailable(s);
  const canOpen = eligible && !deposit && Number.isSafeInteger(amount)&&amount>=E.DEPOSIT_MIN&&amount<=available;
  const canCollect = s.tutorial==='done'&&!s.review&&!s.pendingGrowth&&!s.adultNotice&&!s.pendingIncome&&!s.pendingReward&&!s.pendingPurchase&&Boolean(deposit)&&left===0&&validDeposit;
  let message = left>0?'Штучки остаются твоими. Забрать можно в любой момент, но раньше срока — без дохода.':'Можно забрать штучки и доход!';
  if (!deposit&&!eligible) message = 'Сначала попробуй копилку. Вклад появится на третий день.';
  else if (!deposit&&available<E.DEPOSIT_MIN) message = 'Для вклада нужно хотя бы 3 штучки в кошельке.';
  if (!validDeposit) message='Этот вклад не удалось прочитать.';
  const term = left===0?'Срок закончился':left===1?'Через 1 игровой день':`Через ${number(left)} игровых дня`;
  const controls = deposit?'':`<section class="rv-plate rv-mint rv-amount"><img class="rv-amount-bush left" src="assets/revision/bank-amount-bush.png" alt=""><img class="rv-amount-bush right" src="assets/revision/bank-amount-bush.png" alt=""><h3>Сколько положим?</h3><div class="rv-stepper ko-transfer-stepper ko-bank-stepper"><button class="btn" data-act="bank-step" data-delta="-1" aria-label="Вложить на одну штучку меньше" ${!eligible||amount<=E.DEPOSIT_MIN?'disabled':''}>${icon('minus')}</button><output aria-live="polite">${coin(principal)}</output><button class="btn" data-act="bank-step" data-delta="1" aria-label="Вложить на одну штучку больше" ${!eligible||amount>=available?'disabled':''}>${icon('plus')}</button></div><p class="rv-caption">От ${E.DEPOSIT_MIN} штучек · В кошельке ${number(s.wallet)}</p></section>`;
  const warning='';
  const picture=`<div class="rv-bank-picture ${deposit&&left===0?'rv-bank-celebrate':''}" aria-hidden="true"><img class="rv-bank-scene" src="assets/revision/bank-intro-safe-v2.png" alt="">${deposit&&left===0?Array.from({length:6},(_,i)=>`<span class="rv-celebration-coin rv-celebration-coin-${i}">${icon('coin')}</span>`).join(''):''}</div>`;
  const offer=`<section class="rv-plate rv-lavender rv-offer"><div class="ko-bank-offer"><div><span>${deposit?'Положено':'Положишь'}</span>${coin(principal)}</div>${icon('arrow')}<div><span>Получишь</span>${coin(returned)}</div></div>${!deposit?`<p class="rv-bonus">Доход +${number(returned-principal)}</p><p class="rv-caption">Через ${E.DEPOSIT_DAYS} игровых дня</p>`:''}</section>`;
  const elapsed=deposit?Math.max(0,Math.min(E.DEPOSIT_DAYS,E.DEPOSIT_DAYS-left)):0;
  const timeline=deposit&&left>0?`<section class="rv-plate rv-mint rv-term"><div class="rv-calendar"><img src="assets/revision/bank-calendar.png" alt=""></div><div><h3>${left===1?'Остался 1 игровой день':`Осталось ${number(left)} игровых дня`}</h3><div class="rv-day-dots" aria-label="Прошло ${elapsed} из ${E.DEPOSIT_DAYS} игровых дней">${Array.from({length:E.DEPOSIT_DAYS},(_,i)=>`<span class="${i<elapsed?'done':''}">${i<elapsed?icon('check'):''}</span>`).join('')}</div></div></section>`:'';
  const body=picture+(deposit&&left===0&&validDeposit?`<section class="rv-plate rv-lavender rv-mature"><p>Можно забрать</p><strong>${coin(returned)}</strong><h3>Вложил ${number(principal)}, а получил ${number(returned)}</h3></section>`:offer+timeline+controls+ (deposit?`<section class="rv-plate rv-peach rv-bank-note">${!deposit?icon('coin'):''}<p>${deposit?'Дождись конца срока,<br>чтобы получить доход.':'Можно забрать раньше,<br>но без дохода.'}</p></section>`:'') )+(!validDeposit?`<p class="ko-message" role="status">${message}</p>`:'')+warning+error(ui);
  const canWithdraw=validDeposit&&left>0&&s.tutorial==='done'&&!s.review&&!s.pendingGrowth&&!s.adultNotice&&!s.pendingIncome&&!s.pendingReward&&!s.pendingPurchase;
  const footer = deposit ? canCollect?button(`Забрать ${coin(returned)}`,'bank-collect',{extra:'data-category="savings" data-effect="income"'}):button(`Забрать ${coin(principal)} без дохода`,'bank-withdraw',{disabled:!canWithdraw,secondary:true}) : button(`Положить ${coin(principal)}`,'bank-open',{disabled:!canOpen,extra:`data-category="savings" data-effect="deposit-lock" data-funding-source="${funding}" data-deposit-amount="${principal}"`})+(!canOpen?back():'');
  return {title:deposit?(left===0&&validDeposit?'Вклад принёс доход!':'Твой вклад'):'Открой вклад',body:`<div class="revision-overlay rv-bank ${deposit?'rv-bank-opened':'rv-bank-opening'} ${deposit&&left===0?'rv-bank-mature':''}">${body}</div>`,footer,closable:true};
}

function bankIntroView(){
 const body=`<div class="revision-overlay rv-bank rv-bank-intro"><div class="rv-bank-picture"><img class="rv-bank-scene" src="assets/revision/bank-intro-safe-v2.png" alt="Улыбающийся сейф со штучками"></div><section class="rv-bank-explanation"><h3>Что такое вклад?</h3><p>Ты можешь отдать свои штучки этому классному банку-сейфу. Он будет использовать твои штучки, чтобы заработать, а прибылью будет делиться с тобой.</p><p>Но условие одно: если заберёшь штучки раньше срока, то прибылью он уже с тобой не поделится.</p></section></div>`;
 return {title:'Как работает вклад',body,footer:button('Попробовать','bank-intro-continue'),closable:true};
}

function journalView(s,ui) {
  const done = ui.journalTab==='done';
  const missions = done?E.MISSIONS.filter(m=>E.missionStatus(s,m)==='done'):[E.currentMission(s)].filter(Boolean);
  if(done){
    for(const skill of parentSkills(s).filter(skill=>skill.done&&['care','play','follow','day-save','day-wants','big-deposit'].includes(skill.id))){
      if(skill.id==='big-deposit'&&missions.some(m=>m.id==='deposit-big'))continue;
      missions.push({id:`skill:${skill.id}`,title:skill.id==='care'?'Погладь Пито':skill.title,learning:childLearning(skill.id)});
    }
  }
  const tabs = `<div class="ko-tabs" role="tablist" aria-label="Список заданий">${[['active','Сейчас'],['done','Выполнено']].map(([id,label])=>`<button role="tab" aria-selected="${done===(id==='done')}" data-act="journal-tab" data-id="${id}">${label}</button>`).join('')}</div>`;
  const items = missions.map(m=>{
    const deferred = s.missions?.[m.id]?.resolution==='deferred';
    if (done) {
      const lesson=deferred?'Ты научился откладывать покупку, если сейчас она не нужна.':m.learning||missionLearning(m.id);
      return `<li class="parent-skill done"><span class="parent-skill-mark" aria-label="Выполнено">${icon('check','icon status-icon')}</span><div><h3>${esc(deferred&&m.id==='buy'?'Покупку отложили':m.title)}</h3>${lesson?`<p>${esc(lesson)}</p>`:''}</div></li>`;
    }
    return `<div class="task-card task-ticket journal-current"><span class="task-marker">${art(m.id==='goal'?'dream':m.icon,'icon')}</span><span class="task-copy"><strong>${esc(m.title)}</strong><p>${esc(m.description)}</p></span></div>`;
  }).join('');
  return {title:'Мои задания',body:wrap(tabs+(items?(done?`<ul class="parent-skills journal-completed">${items}</ul>`:items):`<p class="ko-main-copy">${done?'Здесь появятся твои успехи.':'Можно поиграть с Пито.'}</p>`)),footer:'',closable:true};
}

/** Pure optional view layer; returns null for routes owned by views.mjs. */
export function kidOverlay(s,ui) {
  if (!s) return null;
  switch(ui.modal) {
    case 'goal': return goalView(s,ui);
    case 'choose-goal': {
      const choosing=ready(s)||((E.introGoal(s)||E.needsNextDream(s))&&s.tutorial==='done'&&!s.review&&!s.pendingGrowth&&!s.adultNotice&&!s.pendingIncome&&!s.pendingReward&&!s.pendingPurchase);
      const selected=E.availableGoalChoice(s,ui.goalChoice)||E.GOALS.find(g=>!s.goalsWon.includes(g.id))?.id;
      const choice=E.GOALS.find(g=>g.id===selected&&!s.goalsWon.includes(g.id));
      const choices=E.GOALS.filter(g=>!s.goalsWon.includes(g.id)),index=choices.findIndex(g=>g.id===selected);
      if(!choice)return {title:'Все мечты сбылись!',body:wrap('<p>Твоя коллекция уже на лужайке.</p>'),footer:back(),closable:true};
      const previous=choices[(index-1+choices.length)%choices.length],next=choices[(index+1)%choices.length];
      const body=`<div class="revision-overlay rv-choose-dream"><section class="rv-dream-hero"><div class="rv-dream-carousel">${goalArrow(-1,previous.id,!choosing||choices.length<2)}<div class="rv-dream-picture">${art(choice.id,'art')}</div>${goalArrow(1,next.id,!choosing||choices.length<2)}</div><h3>${esc(choice.name)}</h3><p class="rv-price">${coin(choice.price)}</p></section><p class="rv-story">${esc(choice.description)}</p><div class="rv-dream-thumbnails" role="group" aria-label="Выбор мечты">${E.GOALS.map(g=>`<button class="rv-dream-thumbnail ${selected===g.id?'selected':''}" data-act="goal-choice" data-id="${esc(g.id)}" aria-label="${esc(g.name)}${s.goalsWon.includes(g.id)?', уже есть':''}" aria-pressed="${selected===g.id}" ${!choosing||s.goalsWon.includes(g.id)?'disabled':''}>${art(g.id,'art')}${s.goalsWon.includes(g.id)?icon('check','rv-owned'):''}</button>`).join('')}</div></div>`;
      return {title:'О чём ты мечтаешь?',body,footer:button('Выбрать мечту','goal-confirm',{disabled:!choosing||!choice})+back(),closable:false};
    }
    case 'withdraw': return {title:'Взять из копилки?',body:wrap(`${art('jar','ko-jar art')}<div class="ko-main-copy">Останется ${coin(Math.max(0,s.savings-1))}</div><p class="ko-message">До мечты дальше на 1 штучку.</p>${error(ui)}`),footer:button(`Взять ${coin(1)}`,'withdraw-confirm',{disabled:!ready(s)||s.savings<1,extra:'data-category="savings" data-effect="withdraw-one"'}),closable:true};
    case 'bank': return bankView(s,ui);
    case 'bank-intro': return bankIntroView();
    case 'shop': {
      const gift=E.giftItem(s);
      const body=`<div class="revision-overlay rv-shop"><p>Хотелки это разные клевые вещи. Они появятся на лужайке. Собери всю коллекцию!</p><div class="rv-shop-grid">${E.ITEMS.map(item=>`<button class="rv-shop-item" data-act="select-item" data-id="${item.id}" ${s.owned.includes(item.id)?'disabled':''}><strong>${esc(item.name)}</strong><span class="rv-shop-picture">${art(item.id,'art')}</span><span class="rv-shop-price">${s.owned.includes(item.id)?`${icon('check')} Уже есть`:coin(gift?0:item.price)}</span></button>`).join('')}</div></div>`;
      return {title:'Хотелки',body,footer:!E.pacedIntro(s)&&E.missionStatus(s,E.MISSIONS.find(m=>m.id==='buy'))==='active'?button('Пока не покупать','defer-buy',{secondary:true}):'',closable:true};
    }
    case 'journal': return journalView(s,ui);
    default:return null;
  }
}
