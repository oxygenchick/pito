import * as E from './engine.mjs';
import {icon,art} from './visuals.mjs';
import {planningFunds} from './budget.mjs';
const labels=['Поесть и помыться','Хотелки','Копилка'];
const coin=n=>`<span class="coin">${icon('coin')}<span>${n}</span></span>`;
const button=(label,action,extra='',cls='primary')=>`<button class="btn ${cls}" data-act="${action}" ${extra}>${label}</button>`;
export function planDetail(s,ui){
 const category=Number(ui.planCategory)||0,amount=ui.draft[category];
 if(category===0){
  const food=E.FOOD.find(f=>f.id===ui.planFood)||E.FOOD[1],cost=food.price+1;
  const message=amount<cost?`До обеда с водой ещё ${coin(cost-amount)}`:amount===cost?'Хватит на этот обед и воду.':`Обед и вода + ${coin(amount-cost)} про запас.`;
  return `<div class="budget-explanation"><div class="budget-detail-title">Выбери обед для примера</div><div class="budget-food-options">${E.FOOD.map(f=>`<button data-act="plan-food" data-id="${f.id}" aria-pressed="${food.id===f.id}" aria-label="${f.name}, цена ${f.price}">${art(f.id,'icon')}<span>${f.name}</span>${coin(f.price)}</button>`).join('')}</div><div class="budget-example">${art(food.id,'icon')}<span>${food.name} ${coin(food.price)} + ${icon('rain')} 3 сек. ${coin(1)}</span></div><p class="budget-answer">${message}</p><small>Чем дольше льёшь, тем больше тратишь.</small></div>`;
 }
 if(category===1){
  const available=E.ITEMS.filter(item=>!s.owned.includes(item.id));
  return `<div class="budget-explanation"><div class="budget-detail-title">${s.cycle<2?'Вещи откроются со 2-го дня':'Что можно купить'}</div>${available.length?`<div class="budget-wants">${available.map(item=>`<div class="budget-want ${amount>=item.price?'affordable':''}">${art(item.id,'icon')}<span>${item.name}</span><strong>${coin(item.price)}</strong><small>${amount>=item.price?'Хватит':`Ещё ${item.price-amount}`}</small></div>`).join('')}</div><p class="budget-answer">${s.cycle<2?'Эти штучки можно оставить на завтра.':'Цены за одну вещь. Можно выбрать одну или пока не покупать.'}</p>`:'<p>Все вещи уже на лужайке. Можно копить на мечту.</p>'}</div>`;
 }
 const available=E.GOALS.filter(g=>!s.goalsWon.includes(g.id)),chosen=Boolean(s.missions?.goal)&&!s.goalsWon.includes(s.goal);
 const g=available.find(g=>g.id===(chosen?s.goal:ui.planGoal))||available[0];
 if(!g)return '<div class="budget-explanation"><p>Все мечты уже на лужайке. Можно оставить штучки на будущие покупки.</p></div>';
 const projected=s.savings+amount,remaining=Math.max(0,g.price-projected),actual=Math.min(100,s.savings/g.price*100),added=Math.min(100,projected/g.price*100);
 return `<div class="budget-explanation"><div class="budget-detail-title">${chosen?'Мечта: '+g.name:'На что можно копить'}</div>${!chosen?`<div class="budget-dreams">${available.map(goal=>`<button data-act="plan-goal" data-id="${goal.id}" aria-pressed="${g.id===goal.id}">${art(goal.id,'icon')}<span>${goal.name}</span>${coin(goal.price)}</button>`).join('')}</div>`:`<div class="budget-example">${art(g.id,'icon')}<span>${g.name} ${coin(g.price)}</span></div>`}<div class="budget-projection"><span>Сейчас ${s.savings}</span><strong>Если отложить: ${projected} из ${g.price}</strong></div><div class="budget-goal-bar" aria-label="Накоплено ${s.savings}, запланировано добавить ${amount}, цель ${g.price}"><i style="width:${added}%" class="planned"></i><i style="width:${actual}%" class="saved"></i></div><p class="budget-answer">${remaining?`До мечты останется ${coin(remaining)}.`:'Если отложить эту сумму, хватит на мечту!'}</p><small>${!chosen?'Это пример. Мечту подтвердим после плана.':'Деньги в копилку переведём после плана.'}</small></div>`;
}
export function planFooter(s,ui,readonly=false){
 const rest=s.wallet-ui.draft.reduce((a,b)=>a+b,0);
 return readonly?button('К Пито','close','','secondary wide'):`<div class="budget-remainder"><span>Осталось распределить</span><strong data-plan-rest>${rest}</strong>${button('В копилку','plan-rest',rest<=0?'disabled':'','text')}</div><small class="budget-intent">Это план: деньги пока остаются в кошельке.</small>${button('Начать день','plan-confirm',rest!==0||ui.draft.some(v=>v<0||!Number.isInteger(v))?'disabled':'','primary wide')}`;
}
export function planView(s,ui){
 const readonly=Boolean(s.plan),parts=readonly?s.plan:Array.isArray(ui.draft)?ui.draft:[0,0,0],funds=planningFunds(s);
 const total=readonly?parts.reduce((a,b)=>a+b,0):s.wallet,current=Number(ui.planCategory)||0;
 const body=`<div class="budget-funds"><div><span>${s.cycle===1?'Первые карманные штучки':'Сегодня дали'}</span><strong>${coin(funds.income)}</strong></div>${funds.carried>0?`<div><span>Осталось со вчера</span><strong>${coin(funds.carried)}</strong></div>`:''}${funds.spent>0?`<div><span>Уже потрачено</span><strong>${coin(funds.spent)}</strong></div>`:''}<div class="budget-total"><span>${funds.spent>0?'Осталось':'Всего'}</span><strong>${coin(total)}</strong></div></div><p class="budget-gesture" data-plan-hint>${readonly?'Твой план':'Тяни стопки вверх или вниз'}</p><div class="budget-columns">${labels.map((label,i)=>`<div class="budget-column ${i===current?'selected':''}" data-plan-column="${i}" style="--category:${['#729d83','#dca051','#9868b8'][i]};--fill:${total?Math.min(100,parts[i]/total*100):0}%"><button class="budget-category" data-act="plan-category" data-id="${i}" aria-pressed="${i===current}">${icon(['rain','kite','jar'][i])}<span>${label}</span></button><div class="budget-stack"><div class="budget-stack-fill"></div><div class="budget-stack-handle" aria-hidden="true">↕</div><input type="range" data-plan-range="${i}" min="0" max="${total}" step="1" value="${parts[i]}" aria-label="${label}" aria-orientation="vertical" ${readonly?'disabled':''}></div><output data-plan-value="${i}">${coin(parts[i])}</output></div>`).join('')}</div><div data-plan-detail>${planDetail(s,{...ui,draft:parts})}</div>`;
 return {title:`План на день ${s.cycle}`,body,footer:planFooter(s,{...ui,draft:parts},readonly),closable:true};
}
