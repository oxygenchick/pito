import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from './engine.mjs';
import * as V from './views.mjs';
import {shelf} from './visuals.mjs';
import {choosePlayPlan} from './play-plan.mjs';

const MODALS = ['money-intro','income-event','reward-event','grown-event','meet-guide','guide','food','feed','care-result','result','plan','wallet','budget','review','last-period','choose-goal','goal','withdraw','shop','buy','bank','journal','growth','purchase-event','settings','help','gate','parent','dev','reset','goal-won','no-money'];
const initialRoutes = ['new','continue','story-next','back-start','color','hair','birth'];
const appSource = readFileSync(new URL('./app.mjs', import.meta.url), 'utf8');
const controllerCases = new Set([...appSource.matchAll(/\bcase\s+['"]([^'"]+)['"]\s*:/g)].map(match => match[1]));
const ui = (overrides = {}) => ({modal:null, selection:'apple', draft:[4,4,12], transferAmount:1, needsOpen:false, rainSession:null, rainHint:false, cloudX:70, feedback:null, error:'', journalTab:'active', budgetTab:'today', gate:{a:14,b:8,c:17}, ...overrides});
const done = (s, ...ids) => {for (const id of ids) s.missions[id] = {cycle:s.cycle,resolution:'completed',rewardPaid:0}; return s;};
function playing(cycle = 1) {
 const s = E.createProfile('Питер I',0,0,0);
 E.grantInitialMoney(s); E.acknowledgeIncome(s);
 s.tutorial = 'done'; s.cycle = cycle; s.completedCycles = cycle - 1;
 s.plan = [4,4,12]; s.plans = [{cycle,parts:[4,4,12],wallet:20}];
 return done(s,'feed','wash','plan');
}
const modal = (s, name, overrides = {}) => V.modalView(s,ui({modal:name,...overrides}));
const html = view => view.body + view.footer;
const plain = markup => markup.replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const actions = markup => [...markup.matchAll(/\bdata-act="([^"]+)"/g)].map(match => match[1]);
function findButton(markup, action) {
 const found = [...markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].find(match => match[1].includes(`data-act="${action}"`));
 assert.ok(found, `Button ${action} must exist`);
 return {attributes:found[1],text:plain(found[2]),disabled:/\sdisabled(?:\s|$|=)/.test(found[1])};
}

// Render-only coverage. It does not pretend to replace browser interaction tests.
for (const cycle of [1,3,6]) {
 for (const name of MODALS) {
  test(`render ${name}, day ${cycle}: complete contract and no state mutation`, () => {
   const s = playing(cycle);
   s.stage = cycle >= 6 ? 2 : cycle >= 3 ? 1 : 0;
   const before = JSON.stringify(s);
   const view = modal(s,name,{feedback:{id:'paid-food',title:'Пито поел!',lesson:'Сравнили еду.',reward:2,entries:[{kind:'expense',amount:3,label:'Каша'}]}});
   assert.equal(typeof view.title,'string');
   assert.ok(view.title.length > 0);
   assert.equal(typeof view.body,'string');
   assert.equal(typeof view.footer,'string');
   assert.equal(typeof view.closable,'boolean');
   assert.doesNotMatch(html(view),/\b(?:undefined|NaN)\b/);
   assert.equal(JSON.stringify(s),before);
  });
 }
}

test('player-controlled names are escaped in the home header and parent report', () => {
 const s = playing();
 s.name = '<img src=x onerror="bad()"> & \'Пито\'';
 for (const markup of [V.home(s,ui()),html(modal(s,'parent'))]) {
  assert.ok(markup.includes('&lt;img src=x onerror=&quot;bad()&quot;&gt; &amp; &#39;Пито&#39;'));
  assert.doesNotMatch(markup,/<img\s+src=x/);
 }
});

test('needs are absent until requested, and their circular controls have accessible values', () => {
 const s = playing(); s.needs = {affection:0,food:50,clean:100};
 assert.doesNotMatch(V.home(s,ui()),/class="needs(?:\s|")/);
 const markup = V.home(s,ui({needsOpen:true}));
 assert.equal((markup.match(/pathLength="100"/g) || []).length,3);
 assert.equal((markup.match(/data-need="[^"]+" role="progressbar"/g) || []).length,3);
 assert.equal((markup.match(/class="hud-growth" role="progressbar"/g) || []).length,1);
 for (const [key,value] of Object.entries(s.needs)) {
  const opening = markup.match(new RegExp(`<div[^>]*data-need="${key}"[^>]*>`))?.[0];
  assert.ok(opening);
  assert.match(opening,new RegExp(`aria-valuenow="${value}"`));
  assert.match(opening,/aria-valuemin="0"/);
  assert.match(opening,/aria-valuemax="100"/);
  assert.ok(markup.includes(`stroke-dasharray="${value} 100"`));
 }
 assert.ok(markup.includes('transform="rotate(90 40 40)"'));
 assert.ok(markup.includes('transform="rotate(0 40 40)"'));
 assert.ok(markup.includes('transform="rotate(-90 40 40)"'));
 assert.doesNotMatch(V.needsView(s),/opacity="0"/);
 assert.doesNotMatch(plain(V.needsView(s)),/%/);
});

test('open needs provide the hiding contract for the goal strip next to a grown pet', () => {
 const s = done(playing(6),'goal'); s.stage = 2;
 assert.match(V.home(s,ui()),/class="goal-strip"/);
 const markup = V.home(s,ui({needsOpen:true}));
 assert.match(markup,/class="needs grown"/);
 // The controller inserts/removes needs without rerendering the entire scene.
 // Keeping the shortcut in DOM lets CSS restore it after the second tap.
 if (/class="goal-strip"/.test(markup)) {
  const stylesheet = readFileSync(new URL('./ux.css', import.meta.url),'utf8');
  assert.match(stylesheet,/#game:has\(\.needs\)\s+\.goal-strip[^{}]*\{\s*display:\s*none\b/);
 }
});

test('the first plan remains reachable from an active wallet after closing its sheet', () => {
 const s = E.createProfile(); s.tutorial = 'plan'; done(s,'feed','wash');
 const markup = V.home(s,ui());
 const wallet = findButton(markup,'plan');
 assert.match(wallet.attributes,/class="wallet attention"/);
 assert.equal(wallet.disabled,false);
 assert.match(plain(markup),/Нажми на кошелёк/);
});

test('the current task opens its own guide; the journal has a separate button', () => {
 const s = E.createProfile(); E.grantInitialMoney(s); E.acknowledgeIncome(s);
 s.plan = [4,4,12]; done(s,'plan'); s.tutorial = 'food';
 const markup = V.home(s,ui());
 const guide = findButton(markup,'guide');
 assert.match(guide.attributes,/class="task-card task-ticket"/);
 assert.match(guide.attributes,/data-id="feed"/);
 assert.match(guide.text,/Покорми Пито/);
 const journal = findButton(markup,'journal');
 assert.match(journal.attributes,/journal-button/);
 assert.doesNotMatch(journal.attributes,/task-card/);
 assert.doesNotMatch(markup,/Первое задание · бесплатный перекус/);
});

test('mission guides explain and link directly to their mechanic, without nested gameplay', () => {
 const s = playing(6);
 for (const mission of E.MISSIONS) {
  const view = modal(s,'guide',{selection:mission.id});
  assert.equal(view.title,mission.title);
  assert.deepEqual(actions(html(view)),['guide-go']);
  assert.match(view.footer,new RegExp(`data-target="${mission.action}"`));
  assert.doesNotMatch(plain(view.footer),/К Пито/);
  assert.doesNotMatch(plain(html(view)),/Попробовать|Проверить/);
 }
});

test('first plan shows one remaining balance and two concrete choices without spending', () => {
 const s = playing();s.plan=null;s.wallet=16;s.tutorial='plan';
 const before=JSON.stringify(s),view = modal(s,'plan');
 const text = plain(view.body);
 assert.equal(view.title,'План на день 1');
 assert.match(text,/У тебя 16/);assert.match(text,/Бабл-ти Цена 4/);
 for (const label of ['Поесть и помыться','Купить вещь','Копить']) assert.ok(text.includes(label));
 assert.match(text,/Остаток можно не тратить/);
 assert.equal(actions(view.body).filter(x=>x==='play-plan-choice').length,2);
 assert.equal(findButton(view.footer,'plan-confirm').disabled,true);
 assert.equal(findButton(view.footer,'plan-confirm').text,'План готов');
 assert.doesNotMatch(text,/Сегодня дали|Осталось вчера|Всего|На заботу|На желания/);
 assert.doesNotMatch(view.body,/type="range"|data-act="(?:plan-step|plan-rest)"/);assert.equal(JSON.stringify(s),before);
});

test('plan choices must be deliberate, affordable and bounded; zero balance can continue', () => {
 const s=playing();s.plan=null;
 for(const choice of [undefined,'invalid',-1,{},'want','save']){
  const view=modal(s,'plan',{playPlanChoice:choice}),parts=choosePlayPlan(s,choice);
  assert.equal(findButton(view.footer,'plan-confirm').disabled,parts===null);
  if(parts){assert(parts.every(Number.isInteger));assert(parts.every(n=>n>=0));assert(parts.reduce((a,b)=>a+b,0)<=s.wallet);}
 }
 s.wallet=3;assert.equal(choosePlayPlan(s,'want'),null);
 assert.equal(findButton(modal(s,'plan',{playPlanChoice:'want'}).footer,'plan-confirm').disabled,true);
 assert.deepEqual(choosePlayPlan(s,'save'),[3,0,0]);
 s.wallet=0;assert.equal(findButton(modal(s,'plan').footer,'plan-confirm').disabled,false);
 assert.deepEqual(choosePlayPlan(s,undefined),[0,0,0]);
});

test('a paid food explanation stays short while ledger and budget retain expense and reward separately', () => {
 const s = done(playing(),'goal'); s.needs.food = 30;
 const start = s.ledger.length;
 assert.equal(E.feed(s,'apple'),true);
 assert.equal(s.wallet,20);
 const view = modal(s,'result',{feedback:{id:'paid-food',title:'Пито поел!',lesson:'Яблоко стоило 2 штучки.',reward:s.missions['paid-food'].rewardPaid,entries:s.ledger.slice(start)}});
 const text = plain(view.body);
 assert.match(text,/Яблоко стоило 2 штучки/);assert.doesNotMatch(text,/В кошельке теперь|За задание/);
 assert.equal(s.ledger.slice(start).filter(e=>e.kind==='expense'&&e.amount===2).length,1);
 assert.equal(s.ledger.slice(start).filter(e=>e.kind==='income'&&e.amount===2).length,1);
 assert.equal(E.cycleSummary(s).expenses.food,2);
 assert.equal((view.body.match(/class="reward-receipt"/g) || []).length,0);
 assert.deepEqual(actions(view.footer),['close']);
});

test('transfer results explain the destination and never invent a catalog reward', () => {
 const s = done(playing(),'goal');
 const start = s.ledger.length;
 assert.equal(E.transfer(s,6),true);
 const view = modal(s,'result',{feedback:{id:'save',lesson:E.MISSIONS.find(m=>m.id==='save').lesson,reward:s.missions.save.rewardPaid,entries:s.ledger.slice(start)}});
 assert.match(plain(view.body),/Штучки в копилке остаются твоими/);
 assert.equal(E.cycleSummary(s).saved,6);assert.equal(s.wallet,16);
 assert.equal(s.ledger.slice(start).filter(e=>e.kind==='transfer'&&e.amount===6).length,1);
 assert.doesNotMatch(plain(view.body),/В кошельке теперь|За задание/);
 const alreadyPaid = modal(s,'result',{feedback:{id:'save',reward:0,entries:[]}});
 assert.doesNotMatch(alreadyPaid.body,/class="reward-receipt"/);
});

test('an existing deposit remains accessible without new save or goal missions', () => {
 const s = playing(6); s.missions = {}; s.deposit = {principal:10,bonus:1,due:4};
 assert.equal(findButton(V.home(s,ui()),'bank').disabled,false);
 const view = modal(s,'bank');
 assert.equal(findButton(view.footer,'bank-collect').disabled,false);
 assert.match(findButton(view.footer,'bank-collect').text,/Забрать 11/);
 s.deposit = {principal:20,bonus:2,due:7};
 const locked = modal(s,'bank');
 assert.match(plain(locked.body),/20 Положили/);
 assert.match(plain(locked.body),/22 Заберёшь/);
 assert.ok(!actions(locked.footer).includes('bank-collect'));
 assert.ok(actions(locked.footer).includes('close'));
});

test('deposit sample quote returns fifteen for ten while help and mission explain variable deposits', () => {
 const s=done(playing(3),'goal','save');
 const offer=modal(s,'bank');
 assert.match(plain(offer.body),/10 Положишь 15 Заберёшь/);
 assert.match(plain(offer.body),/Через 1 игровой день/);assert.match(plain(offer.body),/До конца срока эти штучки нельзя потратить/);
 assert.match(plain(modal(s,'help').body),/один игровой день и возвращаются с доходом/);
 assert.match(plain(modal(s,'help').body),/Сумму возврата увидишь до открытия/);
 assert.match(E.MISSIONS.find(m=>m.id==='deposit').description,/Выбери, сколько штучек положить/);
 assert.match(E.MISSIONS.find(m=>m.id==='deposit').lesson,/вернутся с доходом/);
 assert(E.openDeposit(s));
 assert.match(plain(modal(s,'bank').body),/10 Положили 15 Заберёшь/);
 assert.ok(!actions(modal(s,'bank').footer).includes('bank-collect'));
 s.completedCycles=s.deposit.due;
 assert.match(plain(modal(s,'bank').body),/Срок закончился/);
 assert.equal(findButton(modal(s,'bank').footer,'bank-collect').disabled,false);
});

test('a live rain session has a cloud and stop action but no ready button or budget prompt', () => {
 const s = playing(3);
 const markup = V.home(s,ui({rainSession:{spent:2},rainHint:true}));
 assert.match(markup,/data-cloud/);
 assert.doesNotMatch(markup,/data-rain-spent|Потрачено/);
 assert.match(markup,/cloud-hint/);
 assert.ok(actions(markup).includes('rain'));
 assert.match(markup,/aria-label="Убрать тучку"/);
 assert.doesNotMatch(markup,/kid-rain-close|data-act="rain-exit"/);
 assert.ok(actions(markup).includes('rain'));
 assert.doesNotMatch(plain(markup),/Готово|Попробовать|Сколько тратить|лимит/i);
});

test('all UI action routes resolve to controller switch cases, including startup customization', () => {
 const found = new Set(initialRoutes);
 for (const cycle of [1,3,6]) {
  const s = playing(cycle);
  done(s,'goal','save');
  s.owned = ['ball']; s.savings = 2;
  for (const tutorial of ['money','meet','food','fed','wash','washed','plan','done']) {
   s.tutorial = tutorial;
   for (const options of [{},{needsOpen:true},{rainSession:{spent:1},rainHint:true}]) for (const action of actions(V.home(s,ui(options)))) found.add(action);
  }
  s.tutorial = 'done';
  for (const name of MODALS) {
   const view = modal(s,name);
   for (const action of actions(html(view))) found.add(action);
  }
  for (const mission of E.MISSIONS) for (const action of actions(html(modal(s,'guide',{selection:mission.id})))) found.add(action);
  s.pendingGrowth = true;
  for (const action of actions(html(modal(s,'review')))) found.add(action);
  s.pendingGrowth = false; s.savings = E.GOALS[0].price;
  for (const action of actions(html(modal(s,'goal')))) found.add(action);
  s.deposit = {principal:10,bonus:1,due:0};
  for (const action of actions(html(modal(s,'bank')))) found.add(action);
 }
 // Startup HTML is owned by app.mjs; static attributes include color and hair.
 for (const action of actions(appSource)) found.add(action);
 for (const action of found) assert.ok(controllerCases.has(action),`Missing controller case: ${action}`);
 for (const route of initialRoutes) assert.ok(controllerCases.has(route),`Missing startup route: ${route}`);
 assert.ok(found.size >= 45,`Expected broad route coverage, got ${found.size}`);
});

test('normal UI has no quiz routes or imaginary training-wallet instructions', () => {
 const prohibited = new Set(['task','task-check','task-step','task-choice','task-number','classify','lesson-go','mission-start','rain-start']);
 const s = done(playing(6),'goal','save');
 let markup = V.home(s,ui());
 for (const name of MODALS.filter(name => name !== 'dev')) markup += html(modal(s,name));
 for (const action of actions(markup)) assert.equal(prohibited.has(action),false,action);
 assert.doesNotMatch(plain(markup),/Учебные штучки|Собери обед на 5|Раздели 10|Первое задание · бесплатный перекус/);
});

test('eleven collection objects remain visible on one rack and the ground without paging', () => {
 const s = playing(6), catalog = [...E.ITEMS,...E.GOALS];
 s.owned = E.ITEMS.map(item => item.id); s.goalsWon = E.GOALS.map(goal => goal.id);
 const ids = markup => [...markup.matchAll(/data-act="play-item" data-id="([^"]+)"/g)].map(match => match[1]);
 const first = V.home(s,ui({shelfPage:0}));
 assert.deepEqual(ids(first).sort(),[...s.owned,...s.goalsWon].sort());
 assert.equal(new Set(ids(first)).size,11);
 assert.equal((first.match(/class="world-collection"/g)||[]).length,1);
 assert.equal((first.match(/class="location-item"/g)||[]).length,11);
 assert.match(first,/data-id="guitar" data-support="ground"/);
 for(const oldPage of [999,-1,NaN])assert.equal(ids(shelf(s,catalog,oldPage)).length,11);
 assert.ok(!actions(first).includes('shelf-page'));
 const css = readFileSync(new URL('./shelf.css',import.meta.url),'utf8');
 assert.match(css,/min-width:\s*40px/);
 assert.match(css,/min-height:\s*40px/);
});

test('no shelf exists before the first purchase and one-page shelves have no pager', () => {
 const s = playing(), catalog = [...E.ITEMS,...E.GOALS];
 assert.equal(shelf(s,catalog),'');
 assert.doesNotMatch(V.home(s,ui()),/class="shelf"/);
 s.owned = ['ball'];
 const markup = V.home(s,ui());
 assert.match(markup,/class="world-collection"/);
 assert.doesNotMatch(markup,/data-act="shelf-page"/);
});

test('after claiming a goal the header offers a new dream, not a reset progress counter', () => {
 const s = done(playing(6),'goal','save'); s.savings = E.GOALS[0].price;
 const walletBefore = s.wallet;
 assert.equal(E.claimGoal(s),true);
 assert.equal(s.wallet,walletBefore);
 const markup = V.home(s,ui());
 const shortcut = findButton(markup,'choose-goal');
 assert.match(shortcut.attributes,/goal-shortcut/);
 assert.match(shortcut.text,/Новая мечта/);
 assert.doesNotMatch(plain(markup),/0 из 24/);
 assert.doesNotMatch(markup,/class="goal-mini-meter"/);
 s.goalsWon = E.GOALS.map(goal => goal.id);
 assert.match(findButton(V.home(s,ui()),'choose-goal').text,/Все мечты сбылись/);
});

test('a won dream receipt names savings as the payment source and shows its remainder', () => {
 const s = done(playing(6),'goal','save'); s.savings = E.GOALS[0].price + 3;
 assert.equal(E.claimGoal(s),true);
 const view = modal(s,'goal-won');
 assert.match(plain(view.body),/Оплачено из копилки 24/);
 assert.match(plain(view.body),/В копилке осталось 3/);
 assert.deepEqual(actions(view.footer),['close']);
});

test('zero-money feeding offers a return to the field and explains the next income', () => {
 const s = playing(); s.wallet = 0; s.needs.food = 15;
 const view = modal(s,'feed',{selection:'apple'});
 assert.equal(findButton(view.footer,'feed-confirm').disabled,true);
 const exit = findButton(view.footer,'close');
 assert.equal(exit.disabled,false);
 assert.match(exit.text,/К Пито/);
 assert.match(plain(view.body),/Новый день принесёт ещё 8/);
});

test('rain shows only its live cleanliness ring, even if the full needs view was previously open', () => {
 const s = playing(3); s.needs.clean = 42;
 for (const needsOpen of [false,true]) {
  const markup = V.home(s,ui({needsOpen,rainSession:{spent:0}}));
  assert.equal((markup.match(/data-need="[^"]+" role="progressbar"/g) || []).length,1);
  assert.equal((markup.match(/class="hud-growth" role="progressbar"/g) || []).length,1);
  assert.match(markup,/data-need="clean"[^>]*aria-valuenow="42"/);
  assert.doesNotMatch(markup,/data-need="(?:food|affection)"/);
 }
 assert.doesNotMatch(V.home(s,ui()),/data-need=/);
 assert.equal((V.home(s,ui({needsOpen:true})).match(/data-need="[^"]+" role="progressbar"/g) || []).length,3);
});

test('the spending report groups bank money with savings and names it accurately', () => {
 const s = done(playing(3),'goal','save');
 assert.equal(E.openDeposit(s),true);
 const summary = E.cycleSummary(s);
 assert.equal(summary.bankSaved,10);
 const text = plain(modal(s,'budget').body);
 assert.match(text,/На вклад 10/);
 assert.match(text,/Копилка и вклад 12 10/);
});

test('the report distinguishes a dream bought from savings from wallet expenses in the plan', () => {
 const s = done(playing(6),'goal','save'); s.savings = E.GOALS[0].price;
 assert.equal(E.claimGoal(s),true);
 const summary = E.cycleSummary(s);
 assert.equal(summary.expenses.wants,24);
 assert.equal(summary.actual.wants,0);
 const text = plain(modal(s,'budget').body);
 assert.match(text,/Мечта куплена из копилки: 24/);
 assert.match(text,/План ниже относится к кошельку/);
 assert.match(text,/Хотелки 4 0/);
});

test('a daily review offers a concrete next-day adjustment when care costs exceed the plan', () => {
 const s = done(playing(3),'goal'); s.needs.food = 10;
 assert.equal(E.feed(s,'sandwich'),true);
 const text = plain(modal(s,'review').body);
 assert.match(text,/На еду и воду оставили 4, а потратили 5/);
 assert.match(plain(modal(s,'last-period').body),/На еду и воду оставили 4, а потратили 5/);
});

test('a daily review explains extra wants spending without blaming the player', () => {
 const s = done(playing(3),'goal','save');
 assert.equal(E.buy(s,'kite'),true);
 const text = plain(modal(s,'review').body);
 assert.match(text,/На хотелки оставили 4, а потратили 10/);
 assert.match(plain(modal(s,'last-period').body),/На хотелки оставили 4, а потратили 10/);
});

test('a daily review explains missed savings and treats a returned deposit separately', () => {
 const s = done(playing(3),'goal','save');
 assert.match(plain(modal(s,'review').body),/Хотели отложить 12, а отложили 0/);
 s.deposit = {principal:10,bonus:1,due:0};
 assert.equal(E.collectDeposit(s),true);
 const text = plain(modal(s,'review').body);
 assert.match(text,/Хотели отложить 12, а отложили 0/);
 assert.doesNotMatch(text,/отложили -10/);
 assert.doesNotMatch(text,/попробовать отложить завтра/);
});

test('after closing a new-day plan the current card still prioritizes planning over purchases', () => {
 const s = done(playing(3),'goal','save','replan');
 s.plan = null; s.needs.food = 15;
 // A food mission would otherwise be next, but spending cannot start without a plan.
 assert.equal(E.currentMission(s)?.id,'paid-food');
 const markup = V.home(s,ui());
 const card = findButton(markup,'guide');
 assert.match(card.attributes,/data-id="replan"/);
 assert.match(card.text,/Нажми на кошелёк/);
 assert.equal(findButton(markup,'wallet').disabled,false);
});

test('a repeated planning guide never promises a reward that was already paid', () => {
 const s = playing(3); s.plan = null;
 assert.doesNotMatch(plain(modal(s,'guide',{selection:'replan'}).body),/Награда/);
 done(s,'replan');
 const repeat = modal(s,'guide',{selection:'replan'});
 assert.doesNotMatch(repeat.body,/class="mission-reward"/);
 assert.doesNotMatch(plain(repeat.body),/Награда/);
 assert.match(plain(repeat.body),/купить вещь или отложить/);
});

test('near-full feeding previews only its useful gain without a nonexistent cheaper choice', () => {
 const s = playing(); s.needs.food = 95;
 const view = modal(s,'feed',{selection:'apple'});
 assert.match(view.body,/сейчас 95 из 100, после еды 100 из 100/);
 assert.doesNotMatch(plain(view.body),/дешёв|дешев/i);
 assert.equal(findButton(view.footer,'feed-confirm').disabled,false);
});

test('stale selected meals cannot reintroduce a hidden multi-food catalog', () => {
 const s = playing(); s.needs.food = 95;
 const view = modal(s,'feed',{selection:'sandwich'});
 assert.match(findButton(view.footer,'feed-confirm').text,/Покормить 2/);
 assert.doesNotMatch(plain(view.body),/Бутерброд|дешёвой|дешевой/);
 assert.match(view.body,/сейчас 95 из 100, после еды 100 из 100/);
 assert.equal(findButton(view.footer,'feed-confirm').disabled,false);
});

test('first-day report never invents a previous-day balance', () => {
 const s = playing();
 assert.doesNotMatch(plain(modal(s,'last-period').body),/Осталось со вчера/);
 assert.match(plain(modal(s,'last-period').body),/Получено 20/);
});

test('the report separates carried money from new income, bank returns and a savings-funded dream', () => {
 const s = playing(5);
 s.periods = [{cycle:5,plan:[4,4,12],walletEnd:24,income:9,saved:5,bankSaved:-10,
  expenses:{food:2,rain:0,wants:24},actual:{care:2,wants:0,savings:-5},growthReasons:[]}];
 const text = plain(modal(s,'last-period').body);
 assert.match(text,/Осталось со вчера 12/);
 assert.match(text,/Получено 9/);
 assert.match(text,/Вернули со вклада 10/);
 assert.match(text,/Мечта куплена из копилки: 24/);
});

test('an empty wallet report still explains saving more than today\'s allowance', () => {
 const s = playing(6);
 s.periods = [{cycle:6,plan:[4,4,24],walletEnd:0,income:8,saved:32,bankSaved:0,
  expenses:{food:0,rain:0,wants:0},actual:{care:0,wants:0,savings:32},growthReasons:[]}];
 const text = plain(modal(s,'last-period').body);
 assert.match(text,/Осталось со вчера 24/);
 assert.match(text,/Получено 8/);
 assert.match(text,/В копилку 32/);
 assert.match(text,/В кошельке 0/);
});

test('money introduction explains game currency and separate sources before any balance is granted',()=>{
 const s=E.createProfile(),before=JSON.stringify(s),view=modal(s,'money-intro'),text=plain(view.body);
 assert.equal(view.closable,false);assert.match(text,/Штучками называют деньги в мире Пито/);
 assert.match(text,/20 На старте/);assert.match(text,/8 Каждый игровой день/);assert.match(text,/За выполненные задания ты получишь награды/);
 assert.deepEqual(actions(view.footer),['money-explained']);assert.equal(s.wallet,0);assert.equal(JSON.stringify(s),before);
});

test('initial and daily income each show one actual credited amount and one next action',()=>{
 for(const [amount,source,wallet,cycle] of [[20,'initial',20,1],[8,'daily',21,2]]){
  const s=playing(cycle);s.wallet=wallet;s.pendingIncome={amount,source,cycle};
  const view=modal(s,'income-event'),text=plain(view.body);
  assert.equal(view.closable,false);assert.match(text,new RegExp(`\\+\\s*${amount}`));assert.doesNotMatch(text,/Теперь у тебя|В кошельке/);
  assert.equal((view.body.match(/class="km-amount"/g)||[]).length,1);
  assert.deepEqual(actions(view.footer),['income-continue']);
  assert.doesNotMatch(view.body,/budget-columns|class="donut|growth-reasons|event-pet/);
  assert.doesNotMatch(text,/Пито вырос|Потрачено|По плану/);
 }
});

test('a reward event explains only its earned amount and lesson without creating a second income',()=>{
 const s=playing();s.wallet=22;s.pendingReward={amount:2,title:'План готов',lesson:'Штучки остаются твоими.'};
 const before=JSON.stringify(s),view=modal(s,'reward-event');
 assert.equal(view.title,'План готов');assert.equal(view.closable,false);
 assert.match(plain(view.body),/\+\s*2/);assert.match(plain(view.body),/Штучки остаются твоими/);assert.doesNotMatch(plain(view.body),/Теперь у тебя|В кошельке/);
 assert.deepEqual(actions(view.footer),['reward-continue']);assert.equal(JSON.stringify(s),before);
 assert.doesNotMatch(view.body,/budget-columns|growth-reasons|event-pet/);
});

test('adult growth is its own unskippable visual event, not a budget or money reward',()=>{
 const s=playing(6);s.stage=2;s.adultNotice=true;
 const view=modal(s,'grown-event'),text=plain(view.body);
 assert.equal(view.title,'Пито вырос!');assert.equal(view.closable,false);assert.match(view.body,/class="event-pet pet-stage-2"/);
 assert.match(text,/какие длинные ноги/);assert.deepEqual(actions(view.footer),['grown-continue']);
 assert.doesNotMatch(view.body,/event-amount|event-wallet|budget-columns|growth-reasons/);
 assert.doesNotMatch(plain(modal(s,'review').body),/Пито вырос!/);
});

test('first paid feeding offers only the apple with its real two-coin price',()=>{
 const s=playing();s.tutorial='food';
 const menu=modal(s,'food'),text=plain(menu.body);
 assert.match(findButton(menu.footer,'feed-confirm').text,/Покормить 2/);assert.doesNotMatch(text,/бесплатно/i);
 assert.equal(actions(menu.body).filter(name=>name==='select-food').length,0);
 assert.doesNotMatch(menu.body,/data-id="(?:porridge|soup|sandwich)"/);
 const confirm=modal(s,'feed',{selection:'apple'});
 assert.match(confirm.body,/сейчас 25 из 100, после еды 65 из 100/);assert.match(findButton(confirm.footer,'feed-confirm').text,/Покормить 2/);
 assert.doesNotMatch(plain(confirm.body),/Цена и сытость|Цена 2/);
 assert.equal(findButton(confirm.footer,'feed-confirm').disabled,false);
});

test('a legacy free tutorial is still displayed honestly rather than charging it retroactively',()=>{
 const s=playing();s.onboardingPaid=false;s.tutorial='food';
 assert.equal(findButton(modal(s,'food').footer,'feed-confirm').text,'Угостить');
 assert.equal(findButton(modal(s,'feed').footer,'feed-confirm').text,'Угостить');
 s.tutorial='wash';s.trialUsed=false;
 assert.doesNotMatch(plain(V.home(s,ui({rainSession:{spent:0}}))),/Потрачено|списали/);
});

test('paid tutorial rain displays the same actual cost as later care',()=>{
 const s=playing();s.tutorial='wash';s.trialUsed=false;
 const markup=V.home(s,ui({rainSession:{spent:2},rainHint:true}));
 assert.match(plain(markup),/1 штучка за 3 секунды/);assert.doesNotMatch(plain(markup),/Потрачено 2|1 \/ 3 сек\./);
 assert.doesNotMatch(plain(markup),/бесплатно|подарок/i);
});

test('legacy free care results do not claim that coins were spent',()=>{
 const s=playing();s.onboardingPaid=false;
 s.tutorial='fed';
 const fed=plain(modal(s,'care-result').body);
 assert.match(fed,/Пито поел/);assert.doesNotMatch(fed,/стоило 2|монеток стало меньше/);
 s.tutorial='washed';
 const washed=plain(modal(s,'care-result').body);
 assert.match(washed,/Дождик смыл грязь/);
 assert.doesNotMatch(washed,/потратили|списали/i);
});

test('legacy completed care entries preserve the original free lesson in the journal',()=>{
 const s=playing();s.onboardingPaid=false;
 const text=plain(modal(s,'journal',{journalTab:'done'}).body);
 assert.match(text,/Первое яблоко было бесплатным/);assert.match(text,/Первое мытьё было бесплатным/);
 assert.doesNotMatch(text,/Яблоко стоило 2/);
 s.onboardingPaid=true;
 const paid=plain(modal(s,'journal',{journalTab:'done'}).body);
 assert.match(paid,/Яблоко стоило 2/);assert.doesNotMatch(paid,/Первое яблоко было бесплатным/);
});

test('legacy free tutorial task card follows care even without a pre-existing plan',()=>{
 const s=E.createProfile();s.onboardingPaid=false;s.wallet=20;s.pendingIncome=null;s.plan=null;
 for(const [tutorial,mission,title] of [['food','feed','Покорми Пито'],['wash','wash','Помой Пито']]){
  s.tutorial=tutorial;
  const card=findButton(V.home(s,ui()),'guide');
  assert.match(card.attributes,new RegExp(`data-id="${mission}"`));assert.ok(card.text.includes(title));
  assert.doesNotMatch(card.text,/План на первый день|Нажми на кошелёк/);
 }
});

test('after buying a dream the next goal confirmation highlights the new planned preview, not the disabled old goal',()=>{
 const s=done(playing(6),'goal');s.goal='console';s.goalsWon=['console'];s.plannedGoal='bike';
 const markup=modal(s,'choose-goal').body;
 const tags=[...markup.matchAll(/<button\b[^>]*data-act="goal-choice"[^>]*>/g)].map(m=>m[0]);
 const old=tags.find(tag=>tag.includes('data-id="console"')),planned=tags.find(tag=>tag.includes('data-id="bike"'));
 assert.match(old,/\bdisabled\b/);assert.doesNotMatch(old,/class="[^"]*selected/);
 assert.match(planned,/class="[^"]*selected/);assert.doesNotMatch(planned,/\bdisabled\b/);
 assert.equal(s.goal,'console');assert.equal(s.missions.goal.cycle,6);
});

test('a current unpurchased goal remains selected rather than an obsolete preview',()=>{
 const s=done(playing(3),'goal');s.goal='house';s.plannedGoal='bike';
 const markup=modal(s,'choose-goal').body;
 const selected=[...markup.matchAll(/<button\b[^>]*class="[^"]*selected[^>]*>/g)].map(m=>m[0]);
 assert.equal(selected.length,1);assert.match(selected[0],/data-id="house"/);
});

test('the short day ending states plan outcome and gives a separate route to full accounting',()=>{
 const s=playing(3),view=modal(s,'review'),text=plain(view.body);
 assert.match(view.body,/km-plan-result/);
 assert.match(text,/План выполнен|Получилось иначе/);
 assert.doesNotMatch(view.body,/km-day-stickers/);
 assert.doesNotMatch(text,/Получено|В кошельке|Осталось со вчера|По плану/);
 assert.deepEqual(actions(html(view)),['day-details','next-cycle']);
 assert.match(appSource,/case 'day-details':open\('last-period'\)/);
 assert.match(modal(s,'budget').body,/class="donut/);
 assert.match(plain(modal(s,'last-period').body),/Получено/);
});

test('all six wants are visible on day one and unaffordable confirmation stays blocked',()=>{
 const s=done(playing(),'goal','save'),shop=modal(s,'shop');
 for(const item of E.ITEMS){
  assert.ok(shop.body.includes(`data-id="${item.id}"`));
  s.wallet=item.price-1;
  const view=modal(s,'buy',{selection:item.id});
  assert.equal(findButton(view.footer,'buy-confirm').disabled,true);
  assert.match(plain(view.body),/Штучек пока не хватает/);assert.equal(findButton(view.footer,'close').disabled,false);
  assert.match(findButton(view.footer,'buy-confirm').attributes,new RegExp(`data-price="${item.price}"`));
 }
 assert.equal(actions(shop.body).filter(a=>a==='select-item').length,6);
 assert.equal(findButton(shop.footer,'defer-buy').disabled,false);
});

test('a full pet cannot be charged for another apple and the effect preview stays bounded',()=>{
 const s=playing();s.needs.food=100;
 const view=modal(s,'food');assert.match(plain(view.body),/Пито уже сыт/);
 assert.equal(findButton(view.footer,'feed-confirm').disabled,true);
 assert.equal(findButton(view.footer,'close').disabled,false);
 assert.match(view.body,/сейчас 100 из 100, после еды 100 из 100/);
});

test('new overlay errors and reward explanations are escaped rather than injected as markup',()=>{
 const s=playing(),unsafe='<img src=x onerror="bad()"> &';
 s.pendingReward={amount:2,title:'Готово',lesson:unsafe};
 for(const view of [modal(s,'reward-event'),modal(s,'goal',{error:unsafe}),modal(s,'withdraw',{error:unsafe}),modal(s,'bank',{error:unsafe})]){
  assert.match(view.body,/&lt;img src=x onerror=&quot;bad\(\)&quot;&gt; &amp;/);
  assert.doesNotMatch(view.body,/<img\s+src=x/);
 }
});

test('the parent report names learned themes and explanations, not only completion counts',()=>{
 const s=done(playing(3),'goal','save','paid-food','buy','replan');
 const view=modal(s,'parent'),text=plain(view.body);
 for(const theme of ['Покупки','Планирование','Накопления'])assert.ok(text.includes(theme));
 for(const id of ['goal','save','paid-food','buy','replan']){
  const mission=E.MISSIONS.find(m=>m.id===id);assert.ok(text.includes(mission.title));assert.ok(text.includes(mission.lesson));
 }
 assert.match(text,/не оценка знаний/);assert.deepEqual(actions(view.footer),['reset-ask']);
 assert.match(modal(s,'gate').body,/inputmode="numeric"/);assert.ok(!actions(modal(s,'gate').footer).includes('reset-confirm'));
});

test('goal withdrawal previews the reduction and blocks missing savings or a pending event',()=>{
 const s=done(playing(),'goal');s.savings=5;
 const before=JSON.stringify(s),view=modal(s,'withdraw');
 assert.match(plain(view.body),/Останется 4/);assert.match(plain(view.body),/До мечты дальше на 1/);
 assert.equal(findButton(view.footer,'withdraw-confirm').disabled,false);assert.equal(JSON.stringify(s),before);
 s.savings=0;assert.equal(findButton(modal(s,'withdraw').footer,'withdraw-confirm').disabled,true);
 s.savings=5;s.pendingIncome={amount:8};assert.equal(findButton(modal(s,'withdraw').footer,'withdraw-confirm').disabled,true);
});

test('keyboard Escape cannot acknowledge critical events and all full-screen event buttons are explicit',()=>{
 // Static controller contract complements real browser keyboard checks.
 assert.match(appSource,/e\.key==='Escape'[^\n]+!progressEvent\(s\)\)close\(\)/);
 for(const name of ['money-intro','income-event','reward-event','grown-event','purchase-event','review','care-result']){
  const view=modal(playing(),name);assert.equal(view.closable,false,name);assert.ok(!actions(html(view)).includes('close'),name);
 }
});

test('old stored periods without planned metadata still render a short immutable review',()=>{
 const s=playing(6);s.periods=[{cycle:5,plan:[4,4,8],walletEnd:3,income:8,saved:1,bankSaved:0,
  expenses:{food:2,rain:3,wants:0},actual:{care:5,wants:0,savings:1},growthReasons:['Купили еду или воду']}];
 const before=JSON.stringify(s),view=modal(s,'review');
 assert.equal(view.title,'День 5 завершён');assert.match(plain(view.body),/На еду и воду оставили 4, а потратили 5/);
 assert.doesNotMatch(html(view),/undefined|NaN/);assert.equal(JSON.stringify(s),before);
 assert.deepEqual(actions(html(view)),['day-details','next-cycle']);
});

test('apple confirmation exposes its exact price, category and capped effect before spending',()=>{
 const s=playing();s.needs.food=25;
 let confirm=findButton(modal(s,'food').footer,'feed-confirm');
 for(const attribute of ['data-category="food"','data-price="2"','data-effect="food"','data-gain="40"'])assert.ok(confirm.attributes.includes(attribute),attribute);
 s.needs.food=95;confirm=findButton(modal(s,'feed').footer,'feed-confirm');assert.match(confirm.attributes,/data-gain="5"/);
 s.onboardingPaid=false;s.tutorial='food';confirm=findButton(modal(s,'feed').footer,'feed-confirm');
 assert.match(confirm.attributes,/data-price="0"/);assert.equal(confirm.text,'Угостить');
});

test('fresh paid onboarding advertises no free care and reaches the plan only after feed and wash',()=>{
 const s=E.createProfile();assert(E.grantInitialMoney(s));assert(E.acknowledgeIncome(s));assert.equal(s.plan,null);
 assert.match(V.home(s,ui()),/data-pet/);
 assert(E.meet(s));const before=modal(s,'food');
 assert.doesNotMatch(plain(html(before)),/бесплатно|подарок|Угостить/);
 assert.match(findButton(before.footer,'feed-confirm').attributes,/data-price="2"/);
 assert(E.feed(s,'apple'));assert.equal(s.wallet,18);assert.equal(s.plan,null);assert(E.acknowledgeCare(s));
 assert.match(plain(modal(s,'guide',{selection:'wash'}).body),/1 штучку за 3 секунды/);
 const water={spent:0};for(let i=0;i<19;i++)assert(E.rain(s,.1,80,water));
 for(let i=0;i<30&&s.tutorial==='wash';i++)assert(E.rain(s,.1,51,water));
 assert.equal(s.wallet,16);assert.equal(s.plan,null);assert(E.acknowledgeCare(s));assert.equal(s.tutorial,'plan');
 const plan=modal(s,'plan',{playPlanChoice:'save'});assert.match(plain(plan.body),/У тебя 16/);
 assert.equal(findButton(plan.footer,'plan-confirm').disabled,false);
});
