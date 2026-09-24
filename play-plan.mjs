import {ITEMS, GOALS, cycleSummary,goalRemaining} from './engine.mjs';
import {icon, art} from './visuals.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const coins = amount => `<span class="play-plan-coins">${icon('coin')}<b>${amount}</b></span>`;
const controlArt = name => `<img class="icon" src="assets/ui-v11/${name}.png" alt="" aria-hidden="true">`;

// Browsing a picture changes the quote only. It never buys or moves any money.
export function planOptions(s, itemId = null, careAmount = 4, savings = {},goalId=null) {
 const wallet = Number.isFinite(s.wallet) ? Math.max(0, Math.floor(s.wallet)) : 0;
 const care = Math.min(wallet,Math.max(0,Number.isFinite(careAmount)?Math.floor(careAmount):4)), remaining = wallet - care;
 const items = ITEMS.filter(item => !(s.owned || []).includes(item.id)).sort((a,b) => a.price-b.price);
 const item = items.find(item => item.id===itemId) || items[0] || null;
 const available = Boolean(item && item.price <= remaining);
 const bounded=(value,max,fallback)=>Math.min(max,Math.max(0,Number.isFinite(value)?Math.floor(value):fallback));
 const goal=GOALS.find(g=>g.id===(goalId||s.goal)&&!(s.goalsWon||[]).includes(g.id))||GOALS.find(g=>!(s.goalsWon||[]).includes(g.id));
 const goalRoom=goal?goalRemaining(s,goal.id):0;
 const wantBudget=available?remaining-item.price:0,wantMax=Math.min(wantBudget,goalRoom),saveMax=Math.min(remaining,goalRoom);
 const wantSaving=bounded(savings.want,wantMax,0), saveSaving=bounded(savings.save,saveMax,saveMax);
 return {wallet, care, remaining, items, item,
  want: {parts: available ? [care,item.price,wantSaving] : null, available, maxSaving:wantMax, free:wantBudget-wantSaving,
   reason: !item ? 'Всё уже есть' : available ? '' : `Не хватает ${item.price-remaining}`},
  save: {parts: [care,0,saveSaving], available: true, maxSaving:saveMax, free:remaining-saveSaving}
 };
}

export function choosePlayPlan(s, choice, itemId = null, careAmount = 4, savings = {},goalId=null) {
 if (s.plan) return null;
 const options = planOptions(s,itemId,careAmount,savings,goalId);
 if (choice!=null && !['want','save'].includes(choice)) return null;
 if (options.remaining===0 && (choice==null || choice==='save')) return [options.care,0,0];
 if (!['want','save'].includes(choice) || !options[choice].available) return null;
 return [...options[choice].parts];
}

function previewGoal(s,ui) {
 const goals = GOALS.filter(g => !(s.goalsWon || []).includes(g.id));
 return goals.find(g => g.id===ui.playPlanGoal) || goals.find(g => g.id===(s.missions?.goal?s.goal:s.plannedGoal)) || goals[0] || null;
}

const browse = (action,dir,label,disabled=false) => `<button class="plan-browse ${dir<0?'previous':''}" data-act="${action}" data-id="${dir}" aria-label="${label}" ${disabled?'disabled':''}>${controlArt('chevron')}</button>`;
function picker(image,action,previous,next,count) {
 return `<div class="plan-picture-picker">${browse(action,-1,previous,count<2)}${image}${browse(action,1,next,count<2)}</div>`;
}

// Full-card selection and browsing are sibling buttons, never nested controls.
const selection = (choice,label,selected,available=true) => `<button class="plan-card-select" data-act="play-plan-choice" data-id="${choice}" aria-label="${escape(label)}" aria-pressed="${selected}" ${available?'':'disabled'}></button>`;
function savingControl(choice, option) {
 const value=option.parts?.[2]||0;
 return `<section class="plan-saving plan-block"><strong>Добавить в копилку</strong><div class="plan-saving-stepper" role="group" aria-label="Добавить в копилку"><button data-act="plan-saving-step" data-id="${choice}" data-delta="-1" aria-label="В копилку на одну меньше" ${value>0?'':'disabled'}>${controlArt('minus')}</button>${coins(value)}<button data-act="plan-saving-step" data-id="${choice}" data-delta="1" aria-label="В копилку на одну больше" ${option.available&&value<option.maxSaving?'':'disabled'}>${controlArt('plus')}</button></div></section>`;
}

export function playPlanView(s, ui = {}) {
 const dream=previewGoal(s,ui),options = planOptions(s,ui.playPlanItem,ui.playPlanCare,ui.playPlanSavings,dream?.id), readonly = Array.isArray(s.plan), choice = ['want','save'].includes(ui.playPlanChoice)?ui.playPlanChoice:null;
 const selected = choosePlayPlan(s,choice,ui.playPlanItem,ui.playPlanCare,ui.playPlanSavings,dream?.id);
 if (readonly) {
  const parts = [...s.plan],actual=cycleSummary(s).actual;
  const body = `<div class="play-plan play-plan-v10 play-plan-v11 play-plan-readonly"><div class="plan-saved-head"><span></span><span>По плану</span><span>Уже</span></div><div class="play-plan-saved">${[
   ['care-basket','Поесть и помыться',actual.care,'Потратили'],['toy-box','Хотелки',actual.wants,'Потратили'],['jar','Копилка',actual.savings,'Отложили']
  ].map(([image,label,spent,verb],i) => `<div class="plan-saved-row ${spent>parts[i]&&i<2?'over-plan':''}"><div class="plan-saved-label">${icon(image,'play-plan-art')}<span>${label}</span></div><span aria-label="По плану ${parts[i]}">${coins(parts[i])}</span><span aria-label="${verb} ${spent}">${coins(spent)}</span></div>`).join('')}</div><p class="play-plan-note">Деньги на хотелки можно потратить на вещь или тоже отложить на мечту.</p></div>`;
  return {title:`План на день ${s.cycle}`,body,footer:'<button class="btn secondary wide" data-act="expenses">Посмотреть расходы</button>',closable:true};
 }
 const care = `<section class="play-plan-care plan-block"><div class="plan-care-label"><strong>Поесть и помыться</strong><span>${options.wallet?'Обычно оставляем 4':'Новые штучки завтра'}</span></div><div class="plan-care-stepper" role="group" aria-label="Штучки на еду и воду"><button data-act="plan-care-step" data-id="-1" aria-label="На уход на одну меньше" ${options.care?'':'disabled'}>${controlArt('minus')}</button>${coins(options.care)}<button data-act="plan-care-step" data-id="1" aria-label="На уход на одну больше" ${options.care<options.wallet?'':'disabled'}>${controlArt('plus')}</button></div></section>`;
 let choices = '';
 if (options.remaining>0) {
  const item = options.item, wantSelected = choice==='want' && options.want.available;
  const wantCard = `<section class="play-plan-choice play-plan-want ${wantSelected?'selected':''}">${selection('want',`Купить ${item?item.name:'вещь'}${item?`, цена ${item.price}`:''}`,wantSelected,options.want.available)}<h3>Купить вещь</h3>${picker(item?art(item.id,'play-plan-art'):icon('toy-box','play-plan-art'),'plan-item-step','Предыдущая вещь','Следующая вещь',options.items.length)}<strong class="plan-choice-name">${item?escape(item.name):'Всё уже есть'}</strong><div class="plan-labeled-coins"><span>Цена</span>${item?coins(item.price):'<span>Нет вещей</span>'}</div>${!options.want.available?`<p class="play-plan-unavailable">${escape(options.want.reason)}</p>`:''}${wantSelected?icon('check','plan-card-check'):''}</section>`;
  const saving = options.save.parts[2], saveSelected = choice==='save';
  const goals = GOALS.filter(g => !(s.goalsWon || []).includes(g.id));
  const saveCard = `<section class="play-plan-choice play-plan-save ${saveSelected?'selected':''}">${selection('save',`Копить ${saving}${dream?` на ${dream.name}`:''}`,saveSelected)}<h3>Копить на мечту</h3>${picker(dream?art(dream.id,'play-plan-art'):icon('jar','play-plan-art'),'plan-goal-step','Предыдущая мечта','Следующая мечта',goals.length)}<strong class="plan-choice-name">${dream?escape(dream.name):'Все мечты сбылись'}</strong><div class="plan-labeled-coins"><span>Цена</span>${dream?coins(dream.price):'<span>Всё собрано</span>'}</div>${saveSelected?icon('check','plan-card-check'):''}</section>`;
  choices = `<section class="plan-rest-block plan-block"><p class="play-plan-prompt">Куда потратим остальные?</p><div class="play-plan-choices">${wantCard}${saveCard}</div></section>`;
 }
 const free=selected?options.wallet-selected.reduce((a,b)=>a+b,0):null;
 const body = `<div class="play-plan play-plan-v10 play-plan-v11 play-plan-v12"><div class="play-plan-wallet plan-block"><span>У тебя</span>${coins(options.wallet)}</div>${care}${choices}${options.remaining>0?savingControl(choice||'want',choice?options[choice]:{available:false,maxSaving:0,parts:[0,0,0]}):''}<div class="plan-free" aria-live="polite">${free===null?'Остаток можно не тратить':`Свободно ${coins(free)}`}</div><p class="play-plan-note">${options.wallet?'':'Сегодня можно погладить Пито и убрать грязь тапами.'}</p></div>`;
 const footer = `<button class="btn primary wide play-plan-confirm" data-act="plan-confirm" ${selected?'':'disabled'}>План готов</button>`;
 return {title:`План на день ${s.cycle}`,body,footer,closable:true};
}
