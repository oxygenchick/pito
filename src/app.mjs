import * as E from './engine.mjs';
import * as V from './views.mjs';
import {resizeAllocation} from './budget.mjs';
import {planDetail,planFooter} from './budget-view.mjs';
import {progressEvent} from './progress-events.mjs';
import {renderStart} from './start-screens.mjs';
import {choosePlayPlan,planOptions} from './play-plan.mjs';
import {icon,world,pet,poop} from './visuals.mjs';
import {installGaze} from './character-gaze.mjs';
import {missionRoute,stepChoice} from './interactions-v10.mjs';

const $=q=>document.querySelector(q), root=$('#game');
installGaze(root);
const slot=new URLSearchParams(location.search).get('qa');
const KEY=slot===null?'pita.web.v1':slot==='1'?'pita.web.qa.v1':'pita.web.qa.'+(slot.replace(/[^a-z0-9-]/gi,'').slice(0,40)||'test')+'.v1';
let s=null,storageOK=true;
try{s=E.restore(localStorage.getItem(KEY));}catch{storageOK=false;}
const ui={modal:null,selection:null,draft:[0,0,0],playPlanChoice:null,playPlanItem:null,playPlanGoal:null,goalChoice:null,transferMode:'plan',transferNotice:'',transferAmount:1,needsOpen:false,rainSession:null,rainHint:false,cloudX:75,feedback:null,error:'',journalTab:'active',budgetTab:'today',gate:null,key:KEY,shelfPage:0};
let presentedMission=null,presentedTicket='',bubbleTimer;
let screen='start',story=0,color=0,hair=0,petName='Пито',gesture=null,devTimer=null,toastTimer=null,rainHeld=false,lastMission='';
let petReaction=null,petReactionUntil=0;
function emotion(){return rainHeld&&Math.abs(ui.cloudX-51)<21?'washing':petReactionUntil>performance.now()?petReaction:Math.min(...Object.values(s?.needs||{food:100}))<25?'sad':'neutral';}
function syncEmotion(){ui.petEmotion=emotion();const character=$('[data-pet]');if(character)character.dataset.emotion=ui.petEmotion;}
function reactPet(value,duration=1600){petReaction=value;petReactionUntil=performance.now()+duration;syncEmotion();}
const face=Math.floor(Math.random()*3);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const goal=()=>E.GOALS.find(g=>g.id===s.goal);
const hasGoal=()=>!!s?.missions?.goal;
const resultTitles={plan:'План сохранён',replan:'План сохранён',goal:'Мечта выбрана',save:'Штучки в копилке','paid-food':'Пито поел!',buy:'Новая вещь у Пито',deposit:'Вклад открыт'};

function save(){
 if(s)s.lastSeen=Date.now();
 try{if(s)localStorage.setItem(KEY,JSON.stringify(s));else localStorage.removeItem(KEY);}catch{storageOK=false;}
}
function toast(text){
 clearTimeout(toastTimer);$('.toast')?.remove();
 root.insertAdjacentHTML('beforeend','<div class="toast" role="status">'+text+'</div>');
 toastTimer=setTimeout(()=>$('.toast')?.remove(),3800);
}
function stopRain(){rainHeld=false;$('[data-cloud]')?.classList.remove('pouring');syncEmotion();}
function bubble(text,target=$('[data-pet]')){
 if(ui.modal||!target)return;
 clearTimeout(bubbleTimer);$('.object-bubble')?.remove();
 const anchor=target.matches('[data-pet]')?target.querySelector('.pet-silhouette')||target:target;
 const r=root.getBoundingClientRect(),a=anchor.getBoundingClientRect();
 const isPet=target.matches('[data-pet]'),width=isPet?51:40,edge=width/2+1.5;
 const node=document.createElement('div');node.className='object-bubble'+(isPet?'':' item-bubble');node.setAttribute('role','status');node.textContent=text;
 const center=(a.left+a.width/2-r.left)/r.width*100;
 const right=!isPet&&center>50;if(right)node.classList.add('bubble-right');
 const placed=E.clamp(center+(isPet?0:width*.43*(right?-1:1)),edge,100-edge);node.style.setProperty('--bubble-tail',E.clamp(50+(center-placed)/width*100,12,88)+'%');
 node.style.left=placed+'%';node.style.bottom=Math.max(22,(r.bottom-a.top)/r.height*100-.3)+'%';
 root.append(node);
 // Upper rock ledges sit close to the task card. Speak beside such objects,
 // rather than letting their bubbles cover the HUD.
 const safeTop=($('.hud')?.getBoundingClientRect().bottom||r.top)+6;
 if(!isPet&&node.getBoundingClientRect().top<safeTop){
  node.classList.add('bubble-beside');
  node.style.left=E.clamp(center+(width/2+7)*(right?-1:1),edge,100-edge)+'%';
  node.style.bottom='auto';node.style.top=(safeTop-r.top)+'px';
  const box=node.getBoundingClientRect();
  node.style.setProperty('--bubble-side-y',E.clamp(a.top+a.height/2-box.top,12,box.height-12)+'px');
 }
 bubbleTimer=setTimeout(()=>node.remove(),2600);
}
function setNeeds(value){
 ui.needsOpen=value&&!ui.rainSession;
 const old=$('.needs');
 if(old&&!value&&!ui.rainSession){old.classList.add('needs-leaving');old.setAttribute('aria-hidden','true');setTimeout(()=>old.remove(),180);return;}
 old?.remove();
 if(screen==='home'&&!ui.modal){
  if(ui.rainSession)root.insertAdjacentHTML('beforeend',V.needsView(s,'clean'));
  else if(value)root.insertAdjacentHTML('beforeend',V.needsView(s));
 }
}
function open(type,id=null){stopRain();setNeeds(false);$('.object-bubble')?.remove();if(type==='bank'){ui.depositSource=E.depositFunding(s,1)||'wallet';ui.depositAmount=Math.min(1,Math.floor(s[ui.depositSource]));}ui.error='';ui.modal=type;ui.selection=id;renderModal();}
function close(){
 if(progressEvent(s)){ui.modal=progressEvent(s);render();return;}
 ui.modal=null;ui.error='';
 if(s&&screen==='home'){
  if(['fed','washed'].includes(s.tutorial))ui.modal='care-result';
  else if(s.review)ui.modal='review';
 }
 render();
}
function initialScreens(){
 return renderStart(screen,s,{story,color,hair,petName,face});
}
function render(){
 stopRain();gesture=null;cancelDevHold();root.classList.remove('reduced-motion');
 if(screen==='home'&&progressEvent(s))ui.modal=progressEvent(s);
 if(s&&screen==='home')lastMission=E.currentMission(s)?.id||'';
 ui.petEmotion=emotion();
 root.innerHTML=(screen==='home'&&s?V.home(s,ui):initialScreens())+'<button class="dev-hotspot" data-dev aria-label="Режим разработчика: удерживать 1,2 секунды"></button>'+(screen==='home'&&s&&s.speed!==1?'<span class="dev-badge">Время ×'+s.speed+'</span>':'');
 if(screen==='home'&&s&&!ui.modal){
  const mission=E.currentMission(s)?.id||'',ticket=$('.task-card');
  if(presentedMission!==null&&mission!==presentedMission){
   ticket?.classList.add('task-arriving');
   if(presentedTicket){const ghost=document.createElement('div');ghost.innerHTML=presentedTicket;const outgoing=ghost.firstElementChild;outgoing.classList.add('task-departing');outgoing.setAttribute('inert','');outgoing.setAttribute('aria-hidden','true');root.append(outgoing);setTimeout(()=>outgoing.remove(),380);}
  }
  presentedMission=mission;presentedTicket=ticket?.outerHTML||'';
 }
 if(ui.modal)renderModal();
 if(!storageOK)toast('Прогресс не сохраняется. Не закрывай вкладку.');
}
function renderModal(){
 const old=$('.modal-backdrop'),same=old?.dataset.modal===ui.modal,scroll=old?.querySelector('.panel-body')?.scrollTop||0;
 const active=document.activeElement,focusAct=active?.dataset?.act,focusId=active?.dataset?.id,focusDelta=active?.dataset?.delta;
 const view=V.modalView(s,ui);old?.remove();
 const wrap=document.createElement('div');wrap.className='modal-backdrop';wrap.dataset.modal=ui.modal;
 wrap.innerHTML='<section class="panel panel-'+ui.modal+'" role="dialog" aria-modal="true" aria-label="'+esc(view.title)+'"><header class="panel-heading"><h2>'+view.title+'</h2>'+(view.closable===false?'':'<button class="close" data-act="close" aria-label="Закрыть">'+icon('close','icon close-icon')+'</button>')+'</header><div class="panel-body">'+view.body+'</div>'+(view.footer?'<footer class="panel-footer">'+view.footer+'</footer>':'')+'</section>';
 root.append(wrap);
 if(same)wrap.querySelector('.panel-body').scrollTop=scroll;
 const focusables=[...wrap.querySelectorAll('button:not(:disabled),input:not(:disabled),summary')].filter(el=>!el.closest('[inert]'));
 const focused=same?focusables.find(el=>el.dataset.act===focusAct&&el.dataset.id===focusId&&el.dataset.delta===focusDelta):null;
 (focused||focusables[0])?.focus({preventScroll:true});updateHUD();
}
function draftPlan(){
 ui.playPlanChoice=null;
 ui.playPlanSavings={want:0};
 ui.playPlanCare=Math.min(4,Math.floor(s.wallet));
 ui.playPlanItem=E.ITEMS.find(i=>!s.owned.includes(i.id))?.id||null;
 ui.playPlanGoal=hasGoal()&&!s.goalsWon.includes(s.goal)?s.goal:E.GOALS.find(g=>g.id===s.plannedGoal&&!s.goalsWon.includes(g.id))?.id||E.GOALS.find(g=>!s.goalsWon.includes(g.id))?.id;
 ui.draft=[0,0,0];ui.planCategory=0;ui.planFood='porridge';
 ui.planGoal=hasGoal()&&!s.goalsWon.includes(s.goal)?s.goal:s.plannedGoal||E.GOALS.find(g=>!s.goalsWon.includes(g.id))?.id;
}
function refreshPlanDetail(){
 const detail=$('[data-plan-detail]'),active=document.activeElement;
 const action=detail?.contains(active)?active.dataset.act:null,id=active?.dataset.id;
 if(detail){
  detail.innerHTML=planDetail(s,ui);
  if(action)[...detail.querySelectorAll('button')].find(el=>el.dataset.act===action&&el.dataset.id===id)?.focus({preventScroll:true});
 }
}
function refreshPlan(){
 const remainder=s.wallet-ui.draft.reduce((a,b)=>a+b,0);
 for(const column of root.querySelectorAll('[data-plan-column]')){
  const i=Number(column.dataset.planColumn),amount=ui.draft[i];
  column.style.setProperty('--fill',(s.wallet?amount/s.wallet*100:0)+'%');
  column.classList.toggle('selected',i===ui.planCategory);
  column.querySelector('.budget-category').setAttribute('aria-pressed',i===ui.planCategory);
  column.querySelector('input').value=amount;
  column.querySelector('output').innerHTML=V.coin(amount);
 }
 refreshPlanDetail();
 const footer=$('.panel-plan .panel-footer');if(footer)footer.innerHTML=planFooter(s,ui);
 const hint=$('[data-plan-hint]');if(hint)hint.textContent=remainder?'Тяни стопки вверх или вниз':'Чтобы добавить сюда, уменьши другую стопку';
}
function showPlan(){
 if(!['plan','done'].includes(s.tutorial))return;
 if(s.plan){open('plan');return;}
 draftPlan();open('plan');
}
function beforeAction(){return {ids:Object.keys(s.missions||{}),ledger:s.ledger.length};}
function result(before,message){
 const newly=E.MISSIONS.filter(m=>!before.ids.includes(m.id)&&s.missions[m.id]);
 if(newly.length){
  const m=newly[0],deferred=s.missions[m.id].resolution==='deferred';
  ui.feedback={id:m.id,title:deferred?'Покупку отложили':resultTitles[m.id]||m.title,lesson:deferred?'Штучки остались на другие дела. Вещи никуда не денутся.':m.lesson,reward:newly.reduce((n,item)=>n+(s.missions[item.id].rewardPaid||0),0),entries:s.ledger.slice(before.ledger)};
  if(ui.feedback.reward){s.pendingReward={amount:ui.feedback.reward,title:ui.feedback.title,lesson:ui.feedback.lesson};ui.modal='reward-event';}
  else ui.modal='result';
 }else{ui.modal=null;ui.feedback=null;}
 save();render();if(!newly.length&&message){if(message==='Пито поел!')bubble('Я наелся!');else toast(message);}
}
function readyHome(){
 screen='home';ui.rainSession=null;ui.needsOpen=false;
 if(E.finishDueCycle(s))save();
 ui.modal=s.review?'review':['fed','washed'].includes(s.tutorial)?'care-result':null;render();
 if(s.migrationNotice){const notice=s.migrationNotice;delete s.migrationNotice;save();toast(esc(notice));}
}
function beginRain(){
 if(!['wash','done'].includes(s.tutorial))return;
 if(s.tutorial==='done'&&!s.plan){showPlan();return;}
 if(ui.rainSession){stopRain();ui.rainSession=null;render();return;}
 if(s.needs.clean>=100&&!s.poops.length){bubble('Я уже чистый!');return;}
 ui.modal=null;ui.needsOpen=false;ui.rainSession={spent:0};ui.rainHint=!s.rainHintSeen;ui.cloudX=75;render();
 const cloud=$('[data-cloud]');cloud?.classList.add('cloud-arriving');setTimeout(()=>cloud?.classList.remove('cloud-arriving'),650);
}
function act(a,id,delta){
 if(ui.careTransition)return;
 const before=s?beforeAction():null;
 switch(a){
 case 'new':screen='story';story=0;render();break;
 case 'continue':readyHome();break;
 case 'story-next':if(story<2)story++;else screen='create';render();break;
 case 'back-start':screen='start';render();break;
 case 'color':color=Number(id);render();break;
 case 'hair':hair=Number(id);render();break;
 case 'birth':s=E.createProfile($('#pet-name').value,color,hair);screen='home';ui.modal=null;save();render();break;
 case 'close':close();break;
 case 'money-explained':if(E.grantInitialMoney(s)){save();render();}break;
 case 'income-continue':if(E.acknowledgeIncome(s)){save();if(!s.plan&&['plan','done'].includes(s.tutorial))showPlan();else readyHome();}break;
 case 'reward-continue':if(s.pendingReward){s.pendingReward=null;save();readyHome();}break;
 case 'grown-continue':if(E.acknowledgeGrowth(s)){save();readyHome();}break;
 case 'purchase-continue':{
  const purchase=E.acknowledgePurchase(s);if(!purchase)break;
  save();readyHome();
  animateItem(purchase.id);
  break;
 }
 case 'meet-guide':open('meet-guide');break;
 case 'guide':open('guide',id);break;
 case 'guide-go':{const mission=id||ui.selection||E.currentMission(s)?.id;act(missionRoute(typeof mission==='object'?mission.id:mission));break;}
 case 'journal':ui.journalTab='active';open('journal');break;
 case 'journal-tab':ui.journalTab=id;renderModal();break;
 case 'settings':case 'help':case 'growth':case 'last-period':open(a);break;
 case 'day-details':open('last-period');break;
 case 'wallet':showPlan();break;
 case 'expenses':ui.budgetTab='today';open('budget');break;
 case 'budget-tab':ui.budgetTab=id;renderModal();break;
 case 'food':if(['food','done'].includes(s.tutorial)){if(s.tutorial==='done'&&!s.plan)showPlan();else{ui.rainSession=null;open('feed','apple');}}break;
 case 'select-food':open('feed','apple');break;
 case 'feed-confirm':{
  const f=E.FOOD[0];
  if(E.feed(s,f.id)){
   save();ui.modal=null;ui.careTransition=true;render();reactPet('eating',1450);setNeeds(true);
   setTimeout(()=>{ui.careTransition=false;if(s.tutorial==='fed'){ui.modal='care-result';render();}else{result(before,'Пито поел!');if(!ui.modal){setNeeds(true);setTimeout(()=>{if(!ui.modal)setNeeds(false);},2200);}}},1450);
  }
  else{ui.error=s.wallet<f.price?'Штучек пока не хватает. Новый день принесёт ещё 8.':'Пито уже сыт.';renderModal();}break;
 }
 case 'care-next':{
  const washed=s.tutorial==='washed';if(E.acknowledgeCare(s)){ui.modal=null;save();render();if(washed&&!s.onboardingPaid)toast(V.coin(20)+' на первые покупки');}break;
 }
 case 'rain':beginRain();break;
 case 'rain-exit':stopRain();ui.rainSession=null;save();render();break;
 case 'plan':showPlan();break;
 case 'plan-step':{const i=Number(id),sum=ui.draft.reduce((a,b)=>a+b,0);if(delta<0||sum<s.wallet)ui.draft[i]=Math.max(0,ui.draft[i]+delta);renderModal();break;}
 case 'plan-rest':ui.draft=resizeAllocation(ui.draft,2,s.wallet,s.wallet);ui.planCategory=2;refreshPlan();$('[data-act="plan-confirm"]')?.focus({preventScroll:true});break;
 case 'plan-category':ui.planCategory=Number(id);refreshPlan();break;
 case 'plan-food':ui.planFood=id;refreshPlanDetail();break;
 case 'plan-goal':ui.planGoal=id;refreshPlanDetail();break;
 case 'plan-care-step':ui.playPlanCare=E.clamp((ui.playPlanCare??Math.min(4,s.wallet))+Number(id),0,Math.floor(s.wallet));if(!choosePlayPlan(s,ui.playPlanChoice,ui.playPlanItem,ui.playPlanCare,ui.playPlanSavings,ui.playPlanGoal))ui.playPlanChoice=null;renderModal();break;
 case 'plan-item-step':ui.playPlanItem=stepChoice(E.ITEMS.filter(i=>!s.owned.includes(i.id)),ui.playPlanItem,id);if(!choosePlayPlan(s,ui.playPlanChoice,ui.playPlanItem,ui.playPlanCare,ui.playPlanSavings,ui.playPlanGoal))ui.playPlanChoice=null;renderModal();break;
 case 'plan-saving-step':{if(!['want','save'].includes(id))break;const o=planOptions(s,ui.playPlanItem,ui.playPlanCare,ui.playPlanSavings,ui.playPlanGoal)[id];if(!o.available)break;ui.playPlanSavings={...ui.playPlanSavings,[id]:E.clamp(o.parts[2]+delta,0,o.maxSaving)};ui.playPlanChoice=id;renderModal();break;}
 case 'plan-goal-step':ui.playPlanGoal=stepChoice(E.GOALS.filter(g=>!s.goalsWon.includes(g.id)),ui.playPlanGoal,id);renderModal();break;
 case 'play-plan-choice':{const parts=choosePlayPlan(s,id,ui.playPlanItem,ui.playPlanCare,ui.playPlanSavings,ui.playPlanGoal);if(parts){ui.playPlanChoice=id;ui.draft=parts;renderModal();}break;}
 case 'plan-confirm':{const parts=choosePlayPlan(s,ui.playPlanChoice,ui.playPlanItem,ui.playPlanCare,ui.playPlanSavings,ui.playPlanGoal);if(parts&&E.setPlan(s,parts)){if(E.GOALS.some(g=>g.id===ui.playPlanGoal)){s.plannedGoal=ui.playPlanGoal;if(hasGoal())E.chooseGoal(s,ui.playPlanGoal);}result(before);}break;}
 case 'goal':if(s.tutorial!=='done')break;if(!s.plan){showPlan();break;}ui.transferMode='plan';ui.transferNotice='';ui.transferAmount=E.plannedSavingsAmount(s);ui.rainSession=null;ui.goalChoice=E.availableGoalChoice(s,s.plannedGoal||s.goal);open(hasGoal()?'goal':'choose-goal');break;
 case 'choose-goal':if(!s.plan)showPlan();else{ui.goalChoice=E.availableGoalChoice(s,s.plannedGoal||s.goal);open('choose-goal');}break;
 case 'goal-choice':ui.goalChoice=id;renderModal();break;
 case 'goal-confirm':if(E.chooseGoal(s,E.availableGoalChoice(s,ui.goalChoice)))result(before);break;
 case 'goal-step':{const next=stepChoice(E.GOALS.filter(g=>!s.goalsWon.includes(g.id)),s.goal,id);if(next&&E.chooseGoal(s,next)){ui.transferNotice='';ui.transferAmount=ui.transferMode==='plan'?E.plannedSavingsAmount(s):Math.min(ui.transferAmount,E.goalRemaining(s),s.wallet);save();renderModal();}break;}
 case 'transfer-mode':ui.transferMode=id==='manual'?'manual':'plan';ui.transferNotice='';ui.transferAmount=ui.transferMode==='plan'?E.plannedSavingsAmount(s):Math.min(1,s.wallet);renderModal();break;
 case 'transfer-step':ui.transferAmount=E.clamp(ui.transferAmount+(Number(id)||delta||0),1,Math.max(1,Math.min(Math.floor(s.wallet),E.goalRemaining(s))));renderModal();break;
 case 'transfer-preset':ui.transferAmount=E.clamp(Math.floor(Number(id)||0),0,Math.floor(s.wallet));renderModal();break;
 case 'transfer-plan':ui.transferAmount=E.plannedSavingsAmount(s);renderModal();break;
 case 'transfer':{const amount=ui.transferMode==='plan'?E.plannedSavingsAmount(s):ui.transferAmount;if(E.transferToGoal(s,amount)){ui.transferMode='plan';ui.transferAmount=E.plannedSavingsAmount(s);result(before);if(!ui.modal){ui.transferNotice=`Отложили ${amount} ${E.pieceWord(amount)}`;open('goal');}}else{ui.error='Выбери, сколько отложить.';renderModal();}break;}
 case 'withdraw':if(s.savings>0)open('withdraw');break;
 case 'withdraw-confirm':if(E.transfer(s,-1)){save();ui.transferAmount=Math.min(1,s.wallet);open('goal');}break;
 case 'claim-goal':if(E.claimGoal(s)){save();render();}break;
 case 'shop':if(s.tutorial==='done'){if(!s.plan)showPlan();else{ui.rainSession=null;open('shop');}}break;
 case 'select-item':open('buy',id);break;
 case 'buy-confirm':{const item=E.ITEMS.find(i=>i.id===ui.selection);if(E.buy(s,ui.selection)){save();render();}else{ui.error='Не хватает '+Math.max(0,item.price-s.wallet)+' штучек. Покупку можно отложить.';renderModal();}break;}
 case 'defer-buy':if(E.deferMission(s,'buy'))result(before);break;
 case 'play-item':if(!ui.modal&&s.tutorial==='done'&&!s.review&&[...s.owned,...s.goalsWon].includes(id)){E.stroke(s,50);save();animateItem(id);}break;
 case 'shelf-page':ui.shelfPage=E.clamp(ui.shelfPage+delta,0,Math.max(0,Math.ceil((s.owned.length+s.goalsWon.length)/4)-1));render();break;
 case 'bank':if(!s.plan)showPlan();else open('bank');break;
 case 'bank-source':ui.depositSource=id==='savings'?'savings':'wallet';ui.depositAmount=Math.min(Math.max(1,ui.depositAmount||1),Math.floor(s[ui.depositSource]));ui.error='';renderModal();break;
 case 'bank-step':ui.depositAmount=E.clamp((ui.depositAmount||0)+delta,Math.min(1,s[ui.depositSource||'wallet']),Math.floor(s[ui.depositSource||'wallet']));ui.error='';renderModal();break;
 case 'bank-open':if(E.openDeposit(s,ui.depositSource||'wallet',ui.depositAmount||0))result(before);else{ui.error='Выбери сумму, которая у тебя есть.';renderModal();}break;
 case 'bank-collect':{const principal=s.deposit?.principal||0,returned=s.deposit?Math.ceil(s.deposit.principal+s.deposit.bonus):0;if(E.collectDeposit(s)){s.pendingIncome={amount:returned-principal,principal,source:'deposit',cycle:s.cycle};save();ui.modal='income-event';render();}break;}
 case 'next-cycle':if(E.nextCycle(s)){save();ui.rainSession=null;draftPlan();ui.modal='plan';render();}break;
 case 'adult-gate':ui.gate={a:13+Math.floor(Math.random()*7),b:6+Math.floor(Math.random()*4),c:11+Math.floor(Math.random()*19)};open('gate');break;
 case 'gate-submit':if($('#gate-answer').value.trim()&&Number($('#gate-answer').value)===ui.gate.a*ui.gate.b-ui.gate.c)open('parent');else{ui.error='Проверь ответ ещё раз.';renderModal();}break;
 case 'dev-speed':s.speed=Number(id);save();renderModal();break;
 case 'dev-cycle':if(s.tutorial!=='done')toast('Сначала кормление и мытьё');else if(!s.plan)toast('Сначала план дня');else if(E.endCycle(s,true)){save();ui.rainSession=null;ui.modal='review';render();}break;
 case 'dev-money':s.wallet+=10;E.record(s,'income',10,'Отладка');save();renderModal();break;
 case 'dev-hunger':s.needs.food=25;save();renderModal();break;
 case 'dev-needs':s.needs={food:100,affection:100,clean:100};save();renderModal();break;
 case 'dev-poop':E.spawnPoop(s);save();renderModal();break;
 case 'reset-ask':open('reset');break;
 case 'reset-confirm':s=null;save();screen='start';ui.modal=null;ui.rainSession=null;ui.needsOpen=false;color=0;hair=0;petName='Пито';render();break;
}
}
function animateItem(id){
 const item=[...E.ITEMS,...E.GOALS].find(i=>i.id===id);if(!item)return;
 const node=$(`[data-act="play-item"][data-id="${id}"]`),character=$('[data-pet]');
 if(node){node.classList.remove('item-playing');void node.offsetWidth;node.dataset.itemMotion=item.motion;node.classList.add('item-playing');}
 character?.classList.add('pet-playing');reactPet('happy',1800);
 setTimeout(()=>{node?.classList.remove('item-playing');character?.classList.remove('pet-playing');},1800);
 bubble(item.reaction,node);
}
root.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(el&&!el.disabled)act(el.dataset.act,el.dataset.id,Number(el.dataset.delta));});
root.addEventListener('input',e=>{
 if(e.target.id==='pet-name')petName=e.target.value;
 if(e.target.matches('[data-plan-range]')&&ui.modal==='plan'&&!s.plan){
  const i=Number(e.target.dataset.planRange),requested=Number(e.target.value);
  ui.planCategory=i;ui.draft=resizeAllocation(ui.draft,i,requested,s.wallet);refreshPlan();
  if(ui.draft[i]<requested)$('[data-plan-hint]').textContent='Свободные штучки закончились. Уменьши другую стопку.';
 }
});
root.addEventListener('focusin',e=>{if(e.target.id==='pet-name')e.target.select();});
function xy(e){const r=root.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};}
function cancelDevHold(){clearTimeout(devTimer);devTimer=null;$('[data-dev]')?.classList.remove('holding');}
function rainStarted(){if(ui.rainHint){ui.rainHint=false;$('.cloud-hint')?.remove();s.rainHintSeen=true;save();}}
function showCleanRecovery(){
 if(!$('.needs'))root.insertAdjacentHTML('beforeend',V.needsView(s,'clean'));
 const indicator=$('.need-clean');indicator?.classList.add('clean-recovered');updateHUD();
 setTimeout(()=>{indicator?.classList.remove('clean-recovered');if(!ui.needsOpen&&!ui.rainSession)setNeeds(false);},1200);
}
root.addEventListener('pointerdown',e=>{
 const dev=e.target.closest('[data-dev]');
 if(dev){e.preventDefault();cancelDevHold();dev.classList.add('holding');devTimer=setTimeout(()=>{cancelDevHold();open('dev');},1200);return;}
 if(ui.modal||ui.careTransition||screen!=='home')return;
 const cloud=e.target.closest('[data-cloud]');
 if(cloud&&ui.rainSession){e.preventDefault();rainHeld=true;cloud.setPointerCapture(e.pointerId);cloud.classList.add('pouring');ui.cloudX=E.clamp(xy(e).x,20,80);rainStarted();return;}
 const dirt=e.target.closest('[data-poop]');
 if(dirt){const id=Number(dirt.dataset.poop),removed=E.tapPoop(s,id);save();if(s.tutorial==='washed'){ui.rainSession=null;ui.modal='care-result';render();}else{syncPoops();if(removed)showCleanRecovery();const awake=$('[data-poop="'+id+'"]');awake?.classList.add('awake');setTimeout(()=>awake?.classList.remove('awake'),600);}return;}
 const p=e.target.closest('[data-pet]');
 if(p){gesture={lastX:e.clientX,lastY:e.clientY,distance:0};p.setPointerCapture(e.pointerId);e.preventDefault();}else setNeeds(false);
});
root.addEventListener('pointerout',e=>{if(e.target.closest('[data-dev]')&&!e.relatedTarget?.closest?.('[data-dev]'))cancelDevHold();});
root.addEventListener('pointermove',e=>{
 if(rainHeld&&ui.rainSession){ui.cloudX=E.clamp(xy(e).x,20,80);const cloud=$('[data-cloud]');if(cloud)cloud.style.left=ui.cloudX+'%';return;}
 if(!gesture||ui.modal)return;
 const distance=Math.hypot(e.clientX-gesture.lastX,e.clientY-gesture.lastY);gesture.distance+=distance;gesture.lastX=e.clientX;gesture.lastY=e.clientY;
 if(gesture.distance>12&&s.tutorial==='done'){
  E.stroke(s,distance);$('[data-pet]')?.classList.add('petting');reactPet('happy',1300);
  if(!$('.hand'))root.insertAdjacentHTML('beforeend','<span class="hand">'+icon('hand')+'</span>');
  const point=xy(e);$('.hand').style.left=point.x+'%';$('.hand').style.top=point.y+'%';updateHUD();
 }
});
function petTapped(){if(ui.rainSession)return;if(E.meet(s)){ui.needsOpen=true;save();render();}else setNeeds(!ui.needsOpen);const p=$('[data-pet]');if(p){p.classList.remove('pet-tapped');void p.offsetWidth;p.classList.add('pet-tapped');setTimeout(()=>p.classList.remove('pet-tapped'),400);}}
function pointerEnd(e){
 cancelDevHold();stopRain();
 if(gesture){if(e?.type==='pointerup'&&gesture.distance<12&&!ui.modal)petTapped();else save();gesture=null;}
 $('[data-pet]')?.classList.remove('petting');$('.hand')?.remove();
 setTimeout(()=>document.querySelectorAll('.poop:not(.running)').forEach(el=>el.classList.remove('awake')),600);
}
window.addEventListener('pointerup',pointerEnd);window.addEventListener('pointercancel',pointerEnd);window.addEventListener('blur',pointerEnd);
root.addEventListener('keydown',e=>{
 if(e.target.matches('[data-dev]')&&e.key==='Enter'){e.preventDefault();open('dev');return;}
 if(ui.modal||screen!=='home'||!s)return;
 if(e.target.matches('[data-pet]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();petTapped();}
 if(e.target.matches('[data-cloud]')&&ui.rainSession){
  if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat){rainHeld=!rainHeld;e.target.classList.toggle('pouring',rainHeld);if(rainHeld)rainStarted();}}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();ui.cloudX=E.clamp(ui.cloudX+(e.key==='ArrowLeft'?-5:5),20,80);e.target.style.left=ui.cloudX+'%';}
 }
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!ui.modal&&ui.rainSession){stopRain();ui.rainSession=null;render();}
 if(e.key==='Escape'&&ui.modal&&!['care-result','review'].includes(ui.modal)&&!progressEvent(s))close();
 if(e.key==='Tab'&&ui.modal){const els=[...$('.panel').querySelectorAll('button:not(:disabled),input:not(:disabled),summary')].filter(el=>!el.closest('[inert]')),first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
});
function updateHUD(){
 if(!s||screen!=='home')return;
 syncEmotion();
 const wallet=$('.wallet');if(wallet&&wallet.dataset.balance!==String(s.wallet)){
  wallet.dataset.balance=String(s.wallet);wallet.innerHTML=V.coin(s.wallet);
  wallet.setAttribute('aria-label',s.wallet+' штучек. Мои деньги');
 }
 for(const key of ['food','affection','clean']){
  const el=$('[data-need="'+key+'"]');if(!el)continue;const n=E.clamp(s.needs[key]);
  el.classList.toggle('low',n<25);const ring=el.querySelector('.ring-fill');
  ring?.setAttribute('stroke-dasharray',n+' 100');ring?.setAttribute('transform','rotate('+(180*(1-n/100)-90)+' 40 40)');
  ring?.setAttribute('stroke-dashoffset','0');ring?.setAttribute('opacity',n===0?'0':'1');
  ring?.setAttribute('stroke',n<25?'#e69965':'#9760bd');
  el.setAttribute('aria-valuenow',Math.round(n));
 }
 const spent=$('[data-rain-spent]');if(spent)spent.textContent=ui.rainSession?.spent||0;
}
function syncPoops(){const target=$('#poops');if(target)target.innerHTML=s.poops.map(poop).join('');}
let previous=performance.now(),saveClock=0;
setInterval(()=>{
 const now=performance.now(),dt=Math.min(.5,(now-previous)/1000);previous=now;
 if(!s||screen!=='home'||document.hidden||nativePaused||ui.careTransition)return;
 if(!ui.modal&&rainHeld&&ui.rainSession){
  const before=[...s.poops],oldTut=s.tutorial,oldWallet=s.wallet;
  if(!E.rain(s,dt,ui.cloudX,ui.rainSession)){
   stopRain();
   if(E.deferExhaustedWash(s)){ui.rainSession=null;save();render();toast('Вода закончилась. В новом игровом дне получишь ещё 8 штучек.');return;}
   toast('Штучки закончились. Грязь можно убрать тапами.');
  }
  if(oldWallet>s.wallet){const flight=document.createElement('span');flight.className='rain-coin';flight.style.setProperty('--coin-x',ui.cloudX+'%');flight.innerHTML='−'+V.coin(oldWallet-s.wallet);root.append(flight);setTimeout(()=>flight.remove(),1400);}
  for(const p of before){
   const el=$('[data-poop="'+p.id+'"]');if(!el)continue;
   if(!s.poops.some(x=>x.id===p.id)){el.classList.add('running','awake','soaked');el.style.setProperty('--run',p.x>50?'190px':'-190px');setTimeout(()=>el.remove(),650);showCleanRecovery();}
   else if(p.wet>0){el.classList.add('awake');el.classList.toggle('soaked',p.wet>1);el.querySelector('.poop-progress i').style.width=p.wet/1.8*100+'%';}
  }
  if(oldTut!==s.tutorial){stopRain();reactPet('happy');ui.rainSession=null;ui.careTransition=true;save();setTimeout(()=>{ui.careTransition=false;ui.modal='care-result';render();},700);}else if(s.needs.clean>=100&&!s.poops.length){stopRain();reactPet('happy');ui.rainSession=null;save();render();bubble('Теперь я чистый!');}else updateHUD();
 }else if(!ui.modal&&!rainHeld){
  const count=s.poops.length;E.tick(s,dt);
  if(E.finishDueCycle(s)){ui.rainSession=null;ui.needsOpen=false;ui.modal='review';save();render();}
  else{if(count!==s.poops.length)syncPoops();updateHUD();const m=E.currentMission(s)?.id||'';if(m!==lastMission&&!gesture&&!devTimer){lastMission=m;if(!ui.rainSession)render();}}
 }
 saveClock+=dt;if(saveClock>2){saveClock=0;save();}
},100);
let hiddenSince=null,nativePaused=false;
function suspendGame(){
 pointerEnd();
 if(hiddenSince===null)hiddenSince=Date.now();
 save();
}
function resumeGame(){
 if(hiddenSince!==null&&s&&screen==='home'&&!ui.modal){
  // Use the same bounded offline simulation on tab resume as on a full reload.
  s=E.restore(JSON.stringify({...s,lastSeen:hiddenSince}))||s;
  if(E.finishDueCycle(s)){ui.rainSession=null;ui.needsOpen=false;ui.modal='review';}
  render();
 }
 hiddenSince=null;previous=performance.now();save();
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendGame();else if(!nativePaused)resumeGame();});
window.addEventListener('pito-native-pause',()=>{nativePaused=true;suspendGame();});
window.addEventListener('pito-native-resume',()=>{nativePaused=false;if(!document.hidden)resumeGame();});
window.addEventListener('pagehide',save);
render();
