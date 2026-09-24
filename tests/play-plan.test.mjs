import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/engine.mjs';
import {planOptions,choosePlayPlan,playPlanView} from '../src/play-plan.mjs';
const profile = wallet => ({...E.createProfile(),wallet});
const text = html => html.replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();

test('pictured choices use a common care reserve and actual cheapest item price',()=>{
 const s=profile(16),options=planOptions(s);
 assert.equal(options.care,4);assert.equal(options.item.id,'ball');
 assert.deepEqual(choosePlayPlan(s,'want'),[4,4,0]);
 assert.deepEqual(choosePlayPlan(s,'save'),[4,0,12]);
 assert.equal(choosePlayPlan(s,null),null);
});
test('all integer balances conserve money and never offer unaffordable wants',()=>{
 for(let wallet=0;wallet<=300;wallet++){
  const s=profile(wallet),options=planOptions(s);
  for(const choice of ['want','save']){
   const parts=choosePlayPlan(s,choice);
   if(parts){assert(parts.reduce((a,b)=>a+b,0)<=wallet);assert(parts.every(n=>Number.isInteger(n)&&n>=0));}
   if(wallet&&choice==='want'&&wallet<8)assert.equal(parts,null);
  }
  assert.equal(options.care,Math.min(4,wallet));
 }
});
test('zero wallet has a valid plan without a choice or a purchase promise',()=>{
 const s=profile(0),view=playPlanView(s);
 assert.deepEqual(choosePlayPlan(s,null),[0,0,0]);
 assert.doesNotMatch(view.footer,/disabled/);
 assert.doesNotMatch(view.body,/data-act="play-plan-choice"/);
 assert.match(text(view.body),/Новые штучки завтра/);
 assert.doesNotMatch(view.body,/NaN|Infinity/);
});
test('small balances reserve everything for care without fake zero-saving choices',()=>{
 for(const wallet of [1,2,3,4]){
  const s=profile(wallet),view=playPlanView(s,{playPlanChoice:null});
  assert.deepEqual(choosePlayPlan(s,'save'),[wallet,0,0]);
  assert.deepEqual(choosePlayPlan(s,null),[wallet,0,0]);
  assert.match(text(view.body),/Поесть и помыться/);
  assert.doesNotMatch(view.body,/data-act="play-plan-choice"/);
  assert.doesNotMatch(view.footer,/disabled/);
 }
});
test('zero and small wallets reject invalid choices while allowing the no-choice care plan',()=>{
 for(const wallet of [0,1,4]){
  const s=profile(wallet);
  assert.deepEqual(choosePlayPlan(s,null),[wallet,0,0]);
  assert.deepEqual(choosePlayPlan(s,undefined),[wallet,0,0]);
  for(const choice of ['garbage',0,false,{},[]])assert.equal(choosePlayPlan(s,choice),null);
 }
});
test('cheapest unowned choice advances through real catalog and handles completed collection',()=>{
 const s=profile(20);
 for(const item of [...E.ITEMS].sort((a,b)=>a.price-b.price)){
  assert.equal(planOptions(s).item.id,item.id);
  assert.deepEqual(choosePlayPlan(s,'want'),[4,item.price,0]);
  s.owned.push(item.id);
 }
 assert.equal(planOptions(s).item,null);assert.equal(choosePlayPlan(s,'want'),null);
 assert.match(text(playPlanView(s,{playPlanChoice:'save'}).body),/Всё уже есть/);
 assert.deepEqual(choosePlayPlan(s,'save'),[4,0,16]);
});
test('explicit available choice is required and stale unavailable choice cannot enable confirmation',()=>{
 const s=profile(16);
 for(const choice of [null,undefined,'invalid'])assert.match(playPlanView(s,{playPlanChoice:choice}).footer,/disabled/);
 assert.doesNotMatch(playPlanView(s,{playPlanChoice:'want'}).footer,/disabled/);
 s.wallet=7;assert.match(playPlanView(s,{playPlanChoice:'want'}).footer,/disabled/);
 assert.doesNotMatch(playPlanView(s,{playPlanChoice:'save'}).footer,/disabled/);
});
test('saved plans remain read-only and do not get recalculated after income or spending',()=>{
 const s=profile(2);s.plan=[4,4,8];
 const view=playPlanView(s,{playPlanChoice:'save'});
 assert.equal(choosePlayPlan(s,'save'),null);
 assert.match(view.footer,/data-act="expenses"/);assert.doesNotMatch(view.footer,/plan-confirm/);
 assert.doesNotMatch(view.body,/data-act="play-plan-choice"/);
 assert.match(text(view.body),/Поесть и помыться 4 0 Хотелки 4 0 Копилка 8 0/);
});
test('savings preview shows a concrete dream without choosing it and excludes completed goals',()=>{
 const s=profile(16);
 assert.match(text(playPlanView(s).body),/Приставка Цена 24/);
 assert.match(text(playPlanView(s,{playPlanChoice:'save'}).body),/Добавить в копилку 12 Свободно 0/);
 assert.ok(!s.missions.goal);
 assert.match(text(playPlanView(s,{playPlanGoal:'bike'}).body),/Мега шопинг/);
 s.missions.goal={cycle:1};s.goal='bike';
 assert.match(text(playPlanView(s).body),/Мега шопинг/);
 s.goalsWon=['bike'];assert.doesNotMatch(text(playPlanView(s).body),/Мега шопинг/);
});
test('rendering and choosing never transfer money, buy an item, choose a goal or mutate UI',()=>{
 const s=profile(16),ui={playPlanChoice:'want'},before=JSON.stringify({s,ui});
 planOptions(s);playPlanView(s,ui);const chosen=choosePlayPlan(s,'want');chosen[0]=999;
 assert.equal(JSON.stringify({s,ui}),before);
});
test('mandatory view has one current balance and no ledger, forecast arithmetic or sliders',()=>{
 const view=playPlanView(profile(16),{playPlanChoice:'want'}),copy=text(view.body);
 assert.equal(view.title,'План на день 1');
 assert.equal((copy.match(/У тебя/g)||[]).length,1);
 assert.doesNotMatch(copy,/Сегодня дали|Осталось со вчера|секунд|сек\.|Первые карманные|План Вышло/);
 assert.doesNotMatch(view.body,/<input|<table|data-act="plan-goal"/);
 assert.equal((view.body.match(/data-act="play-plan-choice"/g)||[]).length,2);
 assert.match(view.body,/aria-pressed="true"/);
 assert.match(copy,/Купить вещь/);assert.doesNotMatch(copy,/Вещь сейчас/);
 assert.match(view.footer,/План готов/);
});

test('browsing a different item changes the quote and labels every amount',()=>{
 const s=profile(16),before=JSON.stringify(s);
 assert.equal(planOptions(s,'comic').item.id,'comic');
 assert.deepEqual(choosePlayPlan(s,'want','comic'),[4,6,0]);
 const copy=text(playPlanView(s,{playPlanChoice:'want',playPlanItem:'comic'}).body);
 assert.match(copy,/Настолка Цена 6/);assert.match(copy,/Добавить в копилку 0 Свободно 6/);
 assert.equal(JSON.stringify(s),before);
});

test('unaffordable item keeps browsing available but does not allow invalid plan',()=>{
 const s=profile(10),view=playPlanView(s,{playPlanChoice:'want',playPlanItem:'puzzle'});
 assert.equal(choosePlayPlan(s,'want','puzzle'),null);
 assert.deepEqual(choosePlayPlan(s,'want','ball'),[4,4,0]);
 assert.match(view.body,/Не хватает 2/);
 assert.match(view.body,/data-act="plan-item-step" data-id="1"[^>]*aria-label="Следующая вещь" >/) ;
 assert.match(view.footer,/disabled/);
});

test('saved plan shows progress locally and has no category navigation',()=>{
 const s=profile(8);s.plan=[4,4,8];
 s.ledger.push({cycle:1,kind:'expense',category:'food',amount:2},{cycle:1,kind:'expense',category:'wants',amount:6},{cycle:1,kind:'transfer',amount:5});
 const body=playPlanView(s).body;
 for(const action of ['food','shop','goal'])assert.doesNotMatch(body,new RegExp(`data-act="${action}"`));
 assert.match(text(body),/По плану Уже Поесть и помыться 4 2 Хотелки 4 6 Копилка 8 5/);
 assert.match(body,/aria-label="Потратили 6"/);
 assert.match(body,/aria-label="Отложили 5"/);
 assert.match(text(body),/или тоже отложить на мечту/);
});

test('care reserve is adjustable within the wallet and recalculates every quote',()=>{
 const s=profile(16);
 assert.deepEqual(choosePlayPlan(s,'want','comic',6),[6,6,0]);
 assert.deepEqual(choosePlayPlan(s,'save','comic',2),[2,0,14]);
 assert.equal(choosePlayPlan(s,'want','comic',12),null);
 assert.deepEqual(choosePlayPlan(s,null,'comic',16),[16,0,0]);
 for(let wallet=0;wallet<=40;wallet++)for(let care=-2;care<=wallet+2;care++){
  const o=planOptions(profile(wallet),null,care);
  assert.equal(o.care,Math.min(wallet,Math.max(0,care)));
  for(const choice of ['want','save']){
   const parts=choosePlayPlan(profile(wallet),choice,null,care);
   if(parts){assert(parts.reduce((a,b)=>a+b,0)<=wallet);assert(parts.every(v=>Number.isInteger(v)&&v>=0));}
  }
 }
 assert.equal(planOptions(s,null,NaN).care,4);
 assert.equal(planOptions(s,null,3.9).care,3);
});

test('reducing small-wallet care unlocks choices and returning to all-care removes them',()=>{
 const s=profile(4);
 assert.match(playPlanView(s,{playPlanCare:0}).body,/data-act="play-plan-choice"/);
 assert.deepEqual(choosePlayPlan(s,'want','ball',0),[0,4,0]);
 assert.equal(choosePlayPlan(s,null,null,0),null);
 assert.doesNotMatch(playPlanView(s,{playPlanCare:4}).body,/data-act="play-plan-choice"/);
 assert.deepEqual(choosePlayPlan(s,null,null,4),[4,0,0]);
});

test('card taps select without an extra choose label and controls use drawn images',()=>{
 const view=playPlanView(profile(16),{playPlanCare:5,playPlanChoice:'want'});
 assert.doesNotMatch(text(view.body),/Выбрать|Выбрано|—/);
 assert.equal((view.body.match(/class="plan-card-select"/g)||[]).length,2);
 assert.equal((view.body.match(/data-act="plan-care-step"/g)||[]).length,2);
 for(const asset of ['plus','minus','chevron'])assert.match(view.body,new RegExp(`assets/ui-v11/${asset}\\.png`));
 const buttons=view.body.match(/<button\b[^>]*>[\s\S]*?<\/button>/g)||[];
 for(const button of buttons)assert.equal((button.match(/<button\b/g)||[]).length,1);
 assert.match(view.body,/Купить Бабл-ти, цена 4/);
});

test('saved care amount excludes the introductory spend before the first plan',()=>{
 const s=profile(16);s.plan=[4,0,12];s.plans=[{cycle:1,parts:[4,0,12],careBeforePlan:3}];
 s.ledger.push({cycle:1,kind:'expense',category:'food',amount:4},{cycle:1,kind:'expense',category:'rain',amount:1});
 assert.match(text(playPlanView(s).body),/Поесть и помыться 4 2/);
});
