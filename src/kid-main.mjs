import * as E from './engine.mjs';
import {icon,art,pet} from './visuals.mjs';
import {COLLECTION_PLACES} from './collection-layout.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const coin=n=>`<span class="coin">${icon('coin')}<span>${n}</span></span>`;
const btn=(label,action,disabled=false,cls='primary')=>`<button class="btn ${cls} wide" data-act="${action}" ${disabled?'disabled':''}>${label}</button>`;
const picture=id=>art(id,'km-art');
const freeIntro=s=>!s.onboardingPaid&&['food','fed','wash','washed'].includes(s.tutorial);
export function foodBar(value,gain=0){return `<div class="km-food-bar" role="img" aria-label="Сытость: сейчас ${Math.round(E.clamp(value))} из 100, после еды ${Math.round(E.clamp(value+gain))} из 100">${Array.from({length:5},(_,i)=>{const current=E.clamp(value/20-i,0,1)*100,total=E.clamp((value+gain)/20-i,0,1)*100;return `<i style="background:linear-gradient(to right,#8659a0 0 ${current}%,#76a280 ${current}% ${total}%,#e6dece ${total}% 100%)"></i>`;}).join('')}</div><span class="km-label">Сытость</span>`;}
export function kidMain(s,ui){
 let title,body,footer,closable=true;
 switch(ui.modal){
 case 'money-intro':
  title='Знакомься, штучки';closable=false;
  body=`<div class="money-introduction"><div class="km-coin-hero">${icon('coin')}</div><p class="money-meaning">Штучками называют деньги в мире Пито. На них можно купить еду и помыть Пито. А ещё их можно отложить на мечту.</p><div class="money-allowance"><div class="money-start">${coin(20)}<span>Дадим<br>на старте</span></div><div class="money-daily">${coin(8)}<span>Каждый<br>игровой день</span></div></div><div class="money-reward">${icon('task')}<p>Выполняй задания и получай награды.</p></div></div>`;
  footer=btn('Получить штучки','money-explained');break;
 case 'income-event':{
  const e=s.pendingIncome||{amount:0,source:'daily'};
  title=e.source==='deposit'?'Вклад принёс доход':e.source==='initial'?'Первые штучки!':'Карманные штучки';closable=false;
  body=`<div class="km-coin-hero${e.source==='initial'?' initial-receipt':''}">${icon('coin')}</div><div class="km-amount">+${e.amount}</div><p class="lead">${e.source==='initial'?'Купим Пито еду и помоем его.':e.source==='deposit'?`Вклад тоже вернулся в кошелёк: ${coin(e.principal)}.`:'На новый игровой день.'}</p>`;
  footer=btn(s.plan||!['plan','done'].includes(s.tutorial)?'К Пито':'Выбрать план','income-continue');break;
 }
 case 'reward-event':{
  const r=s.pendingReward||{};title=r.title||'Получилось!';closable=false;
  body=`<div class="km-coin-hero">${icon('coin')}</div><div class="km-amount">+${r.amount||0}</div><p>За выполненное задание</p><p class="lead">${esc(r.lesson)}</p>`;
  footer=btn('К Пито','reward-continue');break;
 }
 case 'food':case 'feed':{
  const f=E.FOOD[0],free=freeIntro(s),gain=Math.min(100-s.needs.food,free?50:f.gain),full=s.needs.food>=100,short=!free&&s.wallet<f.price;
  title='Покормим Пито?';
  body=`${picture('apple')}${foodBar(s.needs.food,gain)}<p class="km-category">Еда нужна Пито регулярно. Следи за его сытостью.</p>${full?'<p>Пито уже сыт.</p>':short?'<p>Штучек пока не хватает. Новый день принесёт ещё 8.</p>':''}`;
  footer=btn(free?'Угостить':`Покормить ${coin(f.price)}`,'feed-confirm',full||short).replace('data-act="feed-confirm"',`data-act="feed-confirm" data-category="food" data-price="${free?0:f.price}" data-effect="food" data-gain="${gain}"`)+(short||full?btn('К Пито','close',false,'secondary'):'');break;
 }
 case 'care-result':{
  const fed=s.tutorial==='fed';title=fed?'Пито поел!':'Теперь чисто!';closable=false;
  body=`${picture(fed?'apple':'rain')}<p class="lead">${fed?(freeIntro(s)?'Пито поел. Теперь познакомимся с дождиком.':'Еда добавила сытости. Яблоко стоило 2 штучки.'):'Дождик смыл грязь. Отпускай облако, когда всё чисто.'}</p>`;
  footer=btn('К Пито','care-next');break;
 }
 case 'meet-guide':
  title='Познакомься с Пито';body=`${picture('hand')}<p class="lead">Нажми на него, чтобы увидеть, как он себя чувствует.</p>`;footer=btn('К Пито','close');break;
 case 'buy':{
  const item=E.ITEMS.find(x=>x.id===ui.selection)||E.ITEMS[0],short=s.wallet<item.price;
  title=item.name;body=`${picture(item.id)}<p class="lead">${esc(item.description)}</p>${short?'<p>Штучек пока не хватает. Можно купить позже.</p>':s.wallet-item.price<4?'<p>На еду и воду останется мало.</p>':''}`;
  footer=btn(`Купить ${coin(item.price)}`,'buy-confirm',short||s.owned.includes(item.id)).replace('data-act="buy-confirm"',`data-act="buy-confirm" data-category="wants" data-price="${item.price}" data-effect="collection"`)+(short?btn('К Пито','close',false,'secondary'):'');break;
 }
 case 'purchase-event':{
  const purchase=s.pendingPurchase||{},item=[...E.ITEMS,...E.GOALS].find(i=>i.id===purchase.id)||E.ITEMS[0];
  title=purchase.dream?'Мечта сбылась!':`${item.name} для Пито`;closable=false;
  body=`${picture(item.id)}<p class="lead">${esc(item.name)} теперь ${COLLECTION_PLACES[item.id]?.place||'на лужайке'}.</p><p>Нажми на новую вещь. Пито обрадуется!</p>${purchase.dream?`<p>Покупка ${coin(item.price)}. В копилке осталось ${coin(s.savings)}.</p>`:''}${purchase.reward?`<p class="km-purchase-reward">За задание +${coin(purchase.reward)}</p>`:''}`;
  footer=btn('Посмотреть','purchase-continue');break;
 }
 case 'result':{
  const feedback=ui.feedback||{},m=E.MISSIONS.find(x=>x.id===feedback.id);
  title=feedback.title||'Получилось!';body=`${picture(m?.icon||'task')}<p class="lead">${esc(feedback.lesson)}</p>`;footer=btn('К Пито','close');break;
 }
 case 'guide':{
  const m=E.MISSIONS.find(m=>m.id===(typeof ui.selection==='object'?ui.selection?.id:ui.selection))||E.currentMission(s);
  if(!m)return null;
  const copy={feed:'Нажми на еду и угости Пито яблоком.',wash:'Веди облако над Пито и грязью, пока шкала чистоты не заполнится. Полив стоит 1 штучку за 3 секунды.',plan:'Оставь штучки на еду и воду. Остальные можно потратить на вещь или отложить на мечту.',replan:'Выбери: купить вещь или отложить на большую покупку.',goal:'Выбери вещь, на которую хочешь накопить.',save:'Положи штучки в копилку. Твоя мечта станет ближе.','paid-food':'Пито снова проголодался. Угости его яблоком.',buy:'Можно купить вещь сейчас или оставить деньги на потом.',deposit:'Выбери, сколько штучек положить. Через один игровой день заберёшь их с доходом.'};
  const label={feed:'Выбрать еду',wash:'Включить дождик',plan:'Составить план',replan:'Составить план',goal:'Выбрать мечту',save:'Пополнить копилку','paid-food':'Выбрать еду',buy:'Выбрать вещь',deposit:'Открыть вклад'};
  title=m.title;body=`${picture(m.icon)}<p class="lead">${copy[m.id]||esc(m.description)}</p>`;footer=btn(label[m.id]||'Открыть','guide-go').replace('data-act="guide-go"',`data-act="guide-go" data-id="${m.id}" data-target="${m.action}"`);break;
 }
 case 'review':{
  const raw=s.periods?.at(-1)||E.cycleSummary(s),p={...raw,planned:raw.planned||{care:raw.plan?.[0]||0,wants:raw.plan?.[1]||0,savings:raw.plan?.[2]||0},expenses:raw.expenses||{food:0,rain:0,wants:0},growthReasons:raw.growthReasons||[]};title=`День ${p.cycle} завершён`;closable=false;
  const outcome=E.planOutcome(p);
  body=`<div class="km-plan-result ${outcome.met?'met':'changed'}">${picture(outcome.met?'check':'task')}<h3>${outcome.title}</h3>${outcome.lines.map(line=>`<p class="lead">${line}</p>`).join('')}</div><button class="btn secondary km-details" data-act="day-details">Посмотреть расходы</button>`;
  footer=btn('Новый день','next-cycle');break;
 }
 default:return null;
 }
 return {title,body:`<div class="kid-main">${body}</div>`,footer,closable};
}
