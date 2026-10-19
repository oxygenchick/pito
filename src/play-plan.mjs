import {ITEMS, GOALS, goalRemaining} from './engine.mjs';
import {icon, art} from './visuals.mjs';
import {savedPlanView} from './money-review.mjs';
import {currentDailyChallenge,challengeFitsPlan} from './daily-challenges.mjs';

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
 return goals.find(g => g.id===(s.missions?.goal?s.goal:s.plannedGoal)) || goals[0] || null;
}

// Independent envelopes: planning never transfers money or buys the preview.
export function independentPlan(s,ui={}) {
 const o=planOptions(s,ui.playPlanItem,ui.playPlanCare,{},s.goal);
 const goal=previewGoal(s,ui);
 const bound=(v,max)=>Math.min(max,Math.max(0,Math.floor(Number(v)||0)));
 const wants=bound(ui.playPlanWants,Math.min(o.remaining,o.item?.price||0));
 const saving=bound(ui.playPlanSaving,Math.min(o.remaining-wants,goal?goalRemaining(s,goal.id):0));
 return {...o,goal,parts:[o.care,wants,saving],free:o.remaining-wants-saving};
}

const browse = (action,dir,label,disabled=false) => `<button class="plan-browse ${dir<0?'previous':''}" data-act="${action}" data-id="${dir}" aria-label="${label}" ${disabled?'disabled':''}>${controlArt('chevron')}</button>`;
function picker(image,action,previous,next,count) {
 return `<div class="plan-picture-picker">${browse(action,-1,previous,count<2)}${image}${browse(action,1,next,count<2)}</div>`;
}

export function playPlanView(s, ui = {}) {
 return Array.isArray(s.plan) ? savedPlanView(s) : independentPlanView(s,ui);
}

function independentPlanView(s,ui) {
 const o=independentPlan(s,ui),[care,wants,saving]=o.parts;
 const step=(key,value,max,label)=>`<div class="plan-saving-stepper" role="group" aria-label="${label}"><button data-act="plan-allocation-step" data-id="${key}" data-delta="-1" aria-label="${label}: меньше" ${value?'':'disabled'}>${controlArt('minus')}</button>${coins(value)}<button data-act="plan-allocation-step" data-id="${key}" data-delta="1" aria-label="${label}: больше" ${value<max?'':'disabled'}>${controlArt('plus')}</button></div>`;
 const card=(title,entry,key,value,max)=>`<section class="play-plan-choice ${key==='saving'?'play-plan-save':'play-plan-want'}"><h3>${title}</h3>${key==='saving'?`<div class="plan-picture-picker fixed-goal">${entry?art(entry.id,'play-plan-art'):icon('check','play-plan-art')}</div>`:picker(entry?art(entry.id,'play-plan-art'):icon('check','play-plan-art'),'plan-item-step','Предыдущая хотелка','Следующая хотелка',o.items.length)}<strong class="plan-choice-name">${entry?escape(entry.name):'Всё собрано'}</strong><div class="plan-item-cost">${entry?(key==='saving'?`Осталось ${coins(goalRemaining(s,entry.id))}`:coins(entry.price)):''}</div><div class="plan-envelope">${step(key,value,max,key==='saving'?'В копилку':'На хотелки')}</div></section>`;
 const body=`<div class="play-plan play-plan-v10 play-plan-v11 play-plan-v12 play-plan-independent revision-plan"><div class="play-plan-wallet plan-block"><span>У тебя</span>${coins(o.wallet)}</div><section class="play-plan-care plan-block"><div class="plan-care-label"><strong>Поесть и помыться</strong><span>Лучше оставить не меньше 4</span></div><span class="plan-care-apple">${icon('apple')}</span>${step('care',care,o.wallet-wants-saving,'На еду и воду')}<span class="plan-care-cloud">${icon('cloud')}</span></section><section class="plan-rest-block plan-block"><div class="play-plan-choices">${card('На хотелки',o.item,'wants',wants,Math.min(o.item?.price||0,o.wallet-care-saving))}${card('На мечту',o.goal,'saving',saving,Math.min(o.wallet-care-wants,o.goal?goalRemaining(s,o.goal.id):0))}</div></section><div class="plan-free" aria-live="polite">Останутся свободными ${coins(o.free)}</div></div>`;
 const daily=currentDailyChallenge(s),notice=daily&&!challengeFitsPlan(s,o.parts)?'<p class="plan-day-note">С этим планом задание дня отложим на другой раз.</p>':'';
 return {title:`План на день ${s.cycle}`,body,footer:notice+'<button class="btn primary wide play-plan-confirm" data-act="plan-confirm">План готов</button>',closable:true};
}
