import * as E from './engine.mjs';
import {icon,art,pet} from './visuals.mjs';
import {COLLECTION_PLACES} from './collection-layout.mjs';
import {growthPlanHelp} from './growth-review.mjs';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const coin=n=>`<span class="coin">${icon('coin')}<span>${n}</span></span>`;
const btn=(label,action,disabled=false,cls='primary')=>`<button class="btn ${cls} wide" data-act="${action}" ${disabled?'disabled':''}>${label}</button>`;
const picture=id=>art(id,'km-art');
const taskGuide=(image,copy,scene='')=>`<div class="task-guide"><div class="task-guide-art${scene?' task-guide-scene':''}" aria-hidden="true">${scene||picture(image)}</div><section class="task-guide-copy"><p>${copy}</p></section></div>`;
const dailyScene=(m,s)=>m.id==='daily-wants'?`${art('puzzle','task-side left')}${art('ball','task-center')}${art('telescope','task-side right')}`:m.id==='daily-save'?`${art(s.goal,'task-dream')}${icon('jar','task-jar')}`:m.id==='daily-deposit'?'<img class="task-bank" src="assets/revision/bank-intro-safe-v2.png" alt="">':'';
const savedArt=(name,side)=>`<span class="painted-art ${side}" aria-hidden="true"><img src="assets/revision/${name}.png" alt=""></span>`;
const freeIntro=s=>E.freeCare(s)||!s.onboardingPaid&&['food','fed','wash','washed'].includes(s.tutorial);
export function foodBar(value,gain=0){return `<div class="km-food-bar" role="img" aria-label="Сытость: сейчас ${Math.round(E.clamp(value))} из 100, после еды ${Math.round(E.clamp(value+gain))} из 100">${Array.from({length:5},(_,i)=>{const current=E.clamp(value/20-i,0,1)*100,total=E.clamp((value+gain)/20-i,0,1)*100;return `<i style="background:linear-gradient(to right,#8659a0 0 ${current}%,#76a280 ${current}% ${total}%,#e6dece ${total}% 100%)"></i>`;}).join('')}</div><span class="km-label">Сытость</span>`;}
export function kidMain(s,ui){
 let title,body,footer,closable=true;
 switch(ui.modal){
 case 'money-intro':
  title='Знакомься, штучки';closable=false;
  body=`<div class="money-introduction revision-money painted-money"><img class="money-scene" src="assets/revision/money-coin-scene.png" alt="Штучка на лужайке"><div class="money-copy"><p>Штучками называют деньги в мире Пито. Мы будем выдавать тебе немного штучек на карманные расходы. Ты сможешь сам ими распоряжаться, как взрослый!</p></div><div class="money-banners"><section><img src="assets/revision/money-food-card.png" alt=""><b>Еда</b></section><section><img src="assets/revision/money-tea-card.png" alt=""><b>Хотелки</b></section><section><img src="assets/revision/money-jar-card-clean.png" alt=""><b>Копилка</b></section></div></div>`;
  footer=btn(E.calmIntro(s)?'Получить и составить план':'Получить штучки','money-explained');break;
 case 'income-event':{
  const e=s.pendingIncome||{amount:0,source:'daily'};
  title=e.source==='first-plan-funds'?'20 штучек для плана':e.source==='deposit'?'Вклад принёс доход':e.source==='initial'?'Первые штучки!':'Карманные штучки';closable=false;
  body=`<div class="km-coin-hero${e.source==='initial'?' initial-receipt':''}">${icon('coin')}</div><div class="km-amount">+${e.amount}</div><p class="lead">${e.source==='first-plan-funds'?'Ты получил ещё 20 штучек. Реши, сколько оставить на заботу, покупки и мечту.':e.source==='initial'?'Купим Пито еду и помоем его.':e.source==='deposit'?`Вклад тоже вернулся в кошелёк: ${coin(e.principal)}.`:'На новый игровой день.'}</p>`;
  if(e.source==='daily'&&E.currentDailyChallenge(s))body+=`<div class="gr-lesson"><strong>${esc(E.currentDailyChallenge(s).title)}</strong><p>${esc(E.currentDailyChallenge(s).description)}</p></div>`;
  footer=btn(e.source==='first-plan-funds'?'Составить план':E.pacedIntro(s)||s.plan||!['plan','done'].includes(s.tutorial)?'К Пито':'Выбрать план','income-continue');break;
 }
 case 'reward-event':{
  const r=s.pendingReward||{};title=['plan','replan'].includes(r.missionId)||r.title==='План сохранён'?`План на день ${s.cycle}`:r.title||'Получилось!';closable=false;
  body=`<div class="km-coin-hero">${icon('coin')}</div><div class="km-amount">+${r.amount||0}</div><p>За выполненное задание</p><p class="lead">${esc(r.lesson)}</p>`;
  if(['plan','replan'].includes(r.missionId)||r.title==='План сохранён'){
   title='План сохранён';
   body=`<div class="revision-saved painted-saved"><div class="painted-reward"><div>${coin('+'+(r.amount||0))}</div><strong>За составление плана</strong></div><div class="painted-summary"><section class="painted-care">${savedArt('plan-care-apple','left')}<h3>На заботу</h3>${coin(s.plan?.[0]||0)}${savedArt('plan-care-cloud','right')}</section><section class="painted-wants"><span class="painted-art left original-shirt" aria-hidden="true"><img src="assets/items-v14/tshirt.png" alt=""></span><h3>На хотелки</h3>${coin(s.plan?.[1]||0)}${savedArt('saved-tea','right')}</section><section class="painted-savings"><span class="painted-art left selected-dream" aria-hidden="true">${art(E.GOALS.find(g=>g.id===s.goal)?.id||E.GOALS.find(g=>g.id===s.plannedGoal)?.id||'dream')}</span><h3>В копилку</h3>${coin(s.plan?.[2]||0)}<span class="painted-art right original-jar" aria-hidden="true">${icon('jar')}</span></section></div><div class="painted-follow"><div class="painted-pet" aria-hidden="true">${pet(s,true,'happy').replace('data-pet','disabled')}</div><div><strong>Теперь действуй<br>по плану</strong><p>Штучки пока в кошельке. Следуй плану расходов и откладывай на мечту.</p></div></div></div>`;
  }
  footer=btn('К Пито','reward-continue');break;
 }
 case 'food':case 'feed':{
  const f=E.FOOD[0],free=freeIntro(s),gain=Math.min(100-s.needs.food,free&&s.tutorial==='food'?50:f.gain),full=s.needs.food>=100,reserve=E.pacedIntro(s)&&s.initialMoneyGranted&&!s.missions.buy&&s.wallet-f.price<4,short=!free&&(s.wallet<f.price||reserve);
  title='Покормим Пито?';
  body=`<div class="food-apple-art">${picture('apple')}</div>${foodBar(s.needs.food,gain)}<p class="km-category">Еда нужна Пито регулярно. Следи, чтобы он был сытым. Так он будет расти быстрее.</p>${full?'<p>Пито уже сыт.</p>':reserve?'<p>Оставим 4 штучки на твою первую вещь.</p>':short?'<p>Штучек пока не хватает. Новый день принесёт ещё 8.</p>':''}`;
  if(full){closable=false;footer=btn('Вернуться к Пито','close');}
  else footer=btn(free?'Покормить':`Покормить ${coin(f.price)}`,'feed-confirm',short).replace('data-act="feed-confirm"',`data-act="feed-confirm" data-category="food" data-price="${free?0:f.price}" data-effect="food" data-gain="${gain}"`)+(short?btn('К Пито','close',false,'secondary'):'');break;
 }
 case 'care-result':{
  const fed=s.tutorial==='fed';title=fed?'Пито поел!':'Теперь чисто!';closable=false;
  body=`${picture(fed?'apple':'rain')}<p class="lead">${s.onboarding?.version===2?(fed?'Круто, ты впервые покормил Пито! Теперь он сыт и доволен.':'Уху, Пито чистый! Ты смыл дождиком всю грязь, и Пито стал ещё счастливее.'):(fed?(freeIntro(s)?'Пито поел. Теперь познакомимся с дождиком.':'Еда добавила сытости. Яблоко стоило 2 штучки.'):'Дождик смыл грязь. Отпускай облако, когда всё чисто.')}</p>`;
  footer=btn('К Пито','care-next');break;
 }
 case 'meet-guide':
  title='Познакомься с Пито';body=`${picture('hand')}<p class="lead">Нажми на него, чтобы увидеть, как он себя чувствует.</p>`;footer=btn('К Пито','close');break;
 case 'buy':{
  const item=E.ITEMS.find(x=>x.id===ui.selection)||E.ITEMS[0],gift=E.giftItem(s),short=!gift&&s.wallet<item.price;
  title=gift?'Твой подарок!':item.name;closable=!gift;body=`<div class="revision-gift painted-gift"><div class="revision-gift-art">${picture(item.id)}<div class="gift-ribbon">${coin(gift?0:item.price)}</div></div>${gift?`<h3 class="gift-name">${esc(item.name)}</h3>`:`<p class="lead">${esc(item.description)}</p>`}${short?'<p>Штучек пока не хватает.</p>':''}</div>`;
  footer=btn(gift?'Выбрать в подарок':`Купить ${coin(item.price)}`,'buy-confirm',short||s.owned.includes(item.id)).replace('data-act="buy-confirm"',`data-act="buy-confirm" data-category="wants" data-price="${item.price}" data-effect="collection"`)+(gift?btn('Выбрать другой','shop',false,'secondary'):short?btn('К Пито','close',false,'secondary'):'');break;
 }
 case 'purchase-event':{
  const purchase=s.pendingPurchase||{},item=[...E.ITEMS,...E.GOALS].find(i=>i.id===purchase.id)||E.ITEMS[0];
  title=purchase.dream?'Мечта сбылась!':`${item.name} для Пито`;closable=false;
  if(s.onboarding?.version===2&&purchase.first&&!purchase.dream)title=purchase.gift?'Твоя первая вещь!':'Поздравляем с первой вещью!';
  body=`${picture(item.id)}${s.onboarding?.version===2&&purchase.first&&!purchase.dream?'':`<p class="lead">${esc(item.name)} теперь ${COLLECTION_PLACES[item.id]?.place||'на лужайке'}.</p>`}<p>Нажми на новую вещь. Пито обрадуется!</p>${purchase.dream?`<p>Покупка ${coin(item.price)}. В копилке осталось ${coin(s.savings)}.</p>`:''}${purchase.reward?`<p class="km-purchase-reward">За задание +${coin(purchase.reward)}</p>`:''}`;
  footer=btn('Посмотреть','purchase-continue');break;
 }
 case 'result':{
  const feedback=ui.feedback||{},m=E.MISSIONS.find(x=>x.id===feedback.id);
  title=feedback.title||'Получилось!';body=['plan','replan'].includes(feedback.id)?growthPlanHelp(s,{saved:true}):`${picture(m?.icon||'task')}<p class="lead">${esc(feedback.lesson)}</p>`;footer=btn('К Пито','close');break;
 }
 case 'guide':{
  const selected=typeof ui.selection==='object'?ui.selection?.id:ui.selection;const m={...(E.MISSIONS.find(m=>m.id===selected)||E.currentMission(s)||{})};
  if(!m.id)return null;
  const copy={feed:'Нажми на еду и угости Пито яблоком.',wash:'Веди облако над Пито и грязью, пока шкала чистоты не заполнится. Полив стоит 1 штучку за 3 секунды.',plan:'Оставь штучки на еду и воду. Остальные можно потратить на вещь или отложить на мечту.',replan:'Выбери: купить вещь или отложить на большую покупку.',goal:'Выбери вещь, на которую хочешь накопить.',save:'Положи штучки в копилку. Твоя мечта станет ближе.','paid-food':'Пито снова проголодался. Угости его яблоком.',buy:'Можно купить вещь сейчас или оставить деньги на потом.',deposit:'Вложи от 3 штучек на два игровых дня. Можно забрать раньше, но без дохода.'};
  const label={feed:'Выбрать еду',wash:'Включить дождик',plan:'Составить план',replan:'Составить план',goal:'Выбрать мечту',save:'Пополнить копилку','paid-food':'Выбрать еду',buy:'Выбрать вещь',deposit:'Открыть вклад'};
  Object.assign(label,{'save-step':'Пополнить копилку','big-save':'Пополнить копилку','plan-save':'Составить план','plan-want':'Составить план','deposit-big':'Открыть вклад'});
  label['intro-pet']='Погладить';label.feed='Покормить';label['paid-food']='Покормить';label['follow-plan']='Посмотреть план';label.plan='Ура! Начинаем';label.replan='Ура! Начинаем';
  if(m.id.startsWith('daily-'))label[m.id]=m.action==='plan'?'Составить план':m.action==='goal'?'К копилке':m.action==='shop'?'Выбрать хотелку':'Открыть вклад';
  copy['follow-plan']='План помогает оставить штучки на заботу, приятные покупки и мечту. Перед покупкой сверяйся с ним. Деньги в копилку нужно откладывать самому.';
  if(s.onboarding?.version===2){
   copy.feed='Пито проголодался. Угости его яблоком. Еда нужна ему регулярно. Следи, чтобы он был сыт.';
   copy.wash='Иногда Пито пачкается и оставляет грязь. Мой его дождиком, когда он испачкается. Первое мытьё в подарок, а дальше вода будет стоить штучки.';
   copy['paid-food']='Пито снова проголодался. Теперь яблоко стоит 2 штучки: после покупки в кошельке станет меньше денег.';
   copy.buy='Штучки можно тратить не только на заботу. Выбери вещь, которая тебе нравится, и купи её.';
   copy.goal='Мечты делают нас счастливыми. Не всё можно купить сразу, но на мечту можно накопить. Выбери, о чём мечтаешь. Копить будем позже.';
  }
  if(E.calmIntro(s)){copy.buy='Выбери первую вещь в подарок! Потом нажми на неё на лужайке и посмотри, как Пито обрадуется.';copy.wash='Мой Пито дождиком, когда он испачкается. Пока мы знакомимся, уход бесплатный.';}
  if(E.calmIntro(s)&&m.id==='buy'){m.title='Выбери подарок';label.buy='Выбрать подарок';}
  if(m.id==='goal'&&s.goalsWon.length)m.title='Выбери новую мечту';
  title=['plan','replan'].includes(m.id)?'Финансовый план':m.title;body=['plan','replan'].includes(m.id)?growthPlanHelp(s):m.id.startsWith('daily-')?taskGuide(m.icon,esc(m.description),dailyScene(m,s)):m.id==='goal'?`<div class="painted-dream-intro"><img class="dream-intro-cloud" src="assets/revision/dream-intro-cloud.png" alt="Облачко мечты со звездой"><p class="dream-intro-message">Мечты делают нас счастливыми. Не всё можно купить сразу, но на мечту можно накопить.</p><p>${s.goalsWon.length?'Выбери новую мечту. Будем копить на неё дальше.':'Выбери свою мечту.<br>Откладывать на неё будем немного позже.'}</p></div>`:taskGuide(m.icon,copy[m.id]||esc(m.description));footer=btn(label[m.id]||'Открыть','guide-go').replace('data-act="guide-go"',`data-act="guide-go" data-id="${m.id}" data-target="${m.action}"`);break;
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
