import {projectURL} from './project-path.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../src/engine.mjs';
import {resizeAllocation,planningFunds} from '../src/budget.mjs';
import {planView,planDetail,planFooter} from '../src/budget-view.mjs';

const plain=markup=>markup.replace(/<svg\b[\s\S]*?<\/svg>/g,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
function profile(){const s=E.createProfile();E.grantInitialMoney(s);E.acknowledgeIncome(s);return s;}
const ui=(extra={})=>({draft:[4,4,12],planCategory:0,planFood:'porridge',planGoal:'console',...extra});
const sum=parts=>parts.reduce((a,b)=>a+b,0);

test('first plan explains allowance minus introductory care and allocates only the remainder',()=>{
 const s=profile();E.meet(s);E.feed(s,'apple');E.acknowledgeCare(s);
 const water={spent:0};for(let i=0;i<19;i++)E.rain(s,.1,80,water);for(let i=0;i<30&&s.tutorial==='wash';i++)E.rain(s,.1,51,water);
 E.acknowledgeCare(s);
 assert.equal(s.tutorial,'plan');assert.equal(s.plan,null);
 assert.deepEqual(planningFunds(s),{income:20,carried:0,total:16,spent:4});
 const view=planView(s,ui({draft:[4,4,8]})),text=plain(view.body);
 assert.match(text,/Первые карманные штучки 20/);assert.match(text,/Уже потрачено 4/);assert.match(text,/Осталось 16/);
 assert.match(view.body,/max="16"/);assert.doesNotMatch(action(view.footer,'plan-confirm')[1],/disabled/);
});
const rangeTags=markup=>markup.match(/<input\b[^>]*data-plan-range[^>]*>/g)||[];
function action(markup,name){return [...markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].find(match=>match[1].includes(`data-act="${name}"`));}

test('allocation resizing never steals coins from another category or mutates input',()=>{
 const parts=Object.freeze([4,4,12]);
 assert.deepEqual(resizeAllocation(parts,0,20,20),[4,4,12]);
 assert.deepEqual(resizeAllocation(parts,0,2,20),[2,4,12]);
 assert.deepEqual(resizeAllocation([2,4,12],1,8,20),[2,6,12]);
 assert.deepEqual(parts,[4,4,12]);
});

test('dragging rounds to whole coins, clamps at zero, and rejects non-finite requests',()=>{
 assert.deepEqual(resizeAllocation([0,0,0],0,3.49,20),[3,0,0]);
 assert.deepEqual(resizeAllocation([0,0,0],0,3.5,20),[4,0,0]);
 assert.deepEqual(resizeAllocation([4,4,12],1,-20,20),[4,0,12]);
 for(const requested of [NaN,Infinity,-Infinity])assert.deepEqual(resizeAllocation([4,4,12],1,requested,20),[4,4,12]);
 for(const index of [-1,3,1.5,NaN])assert.deepEqual(resizeAllocation([4,4,12],index,9,20),[4,4,12]);
});

test('zero and very large balances conserve the total without category-dependent scaling',()=>{
 assert.deepEqual(resizeAllocation([0,0,0],0,10,0),[0,0,0]);
 assert.deepEqual(resizeAllocation([5,4,0],2,1e9,1e6),[5,4,999991]);
 assert.deepEqual(resizeAllocation([1,1,0],2,100,3.9),[1,1,1]);
});

test('repeated deterministic pointer values preserve integral non-negative allocations and remaining coins',()=>{
 for(const total of [0,1,2,20,28,1000]){
  let parts=[0,0,0];
  for(let i=0;i<180;i++){
   const category=i%3,requested=((i*37)%137-20)/100*(total+20),previous=[...parts];
   parts=resizeAllocation(parts,category,requested,total);
   assert(parts.every(n=>Number.isInteger(n)&&n>=0));
   assert(sum(parts)<=total);
   assert.equal(total-sum(parts)+sum(parts),total);
   for(let j=0;j<3;j++)if(j!==category)assert.equal(parts[j],previous[j]);
  }
 }
});

test('funds distinguish the real initial allowance from carried money without mutation',()=>{
 const s=profile(),before=JSON.stringify(s);
 assert.deepEqual(planningFunds(s),{income:20,carried:0,total:20});
 assert.equal(JSON.stringify(s),before);
});

test('funds distinguish yesterday 13 plus today 8 from a supposed allowance of 21',()=>{
 const s=profile();s.cycle=2;s.wallet=21;E.record(s,'income',8,'Карманные штучки');
 s.ledger.push({cycle:1,kind:'income',amount:2,label:'Старое задание'});
 assert.deepEqual(planningFunds(s),{income:8,carried:13,total:21});
 const text=plain(planView(s,ui({draft:[4,4,13]})).body);
 assert.match(text,/Сегодня дали 8/);assert.match(text,/Осталось со вчера 13/);assert.match(text,/Всего 21/);
});

test('funds never invent negative carry or include a deposit principal as income',()=>{
 const s=profile();s.cycle=3;s.wallet=23;
 E.record(s,'income',8,'Карманные штучки');E.record(s,'bank-out',10,'Возврат вклада');E.record(s,'income',5,'Доход');
 assert.deepEqual(planningFunds(s),{income:13,carried:10,total:23});
 s.wallet=0;assert.equal(planningFunds(s).carried,0);
});

test('three columns share the same wallet scale and have visible values and vertical keyboard-accessible ranges',()=>{
 const view=planView(profile(),ui());
 const ranges=rangeTags(view.body);assert.equal(ranges.length,3);
 for(const [i,tag] of ranges.entries()){
  assert.match(tag,/type="range"/);assert.match(tag,/min="0"/);assert.match(tag,/max="20"/);assert.match(tag,/step="1"/);
  assert.match(tag,/aria-orientation="vertical"/);assert.match(tag,new RegExp(`value="${[4,4,12][i]}"`));
  assert.match(view.body,new RegExp(`data-plan-value="${i}"`));
 }
 assert.equal((view.body.match(/--fill:20%/g)||[]).length,2);assert.match(view.body,/--fill:60%/);
 assert.equal((view.body.match(/class="budget-stack-handle"/g)||[]).length,3);
 assert.doesNotMatch(plain(view.body),/%/);
});

test('a zero wallet still renders all handles without division by zero and allows its empty plan',()=>{
 const s=profile();s.wallet=0;
 const view=planView(s,ui({draft:[0,0,0]}));
 assert.equal(rangeTags(view.body).length,3);
 assert.equal((view.body.match(/--fill:0%/g)||[]).length,3);
 assert.doesNotMatch(view.body,/NaN|Infinity/);
 assert.doesNotMatch(action(view.footer,'plan-confirm')[1],/\bdisabled\b/);
 assert.match(action(view.footer,'plan-rest')[1],/\bdisabled\b/);
});

test('read-only columns use the saved plan and disable all drags even after wallet rewards change',()=>{
 const s=profile();s.plan=[4,4,12];s.wallet=22;
 const view=planView(s,ui({draft:[0,0,0]}));
 for(const tag of rangeTags(view.body)){assert.match(tag,/\bdisabled\b/);assert.match(tag,/max="20"/);}
 assert.match(plain(view.body),/Всего 20/);
 assert.ok(action(view.footer,'close'));assert.equal(action(view.footer,'plan-confirm'),undefined);
});

test('footer keeps unallocated money next to confirmation and accepts only fully allocated integer plans',()=>{
 const s=profile();
 for(const draft of [[0,0,0],[4,4,6],[4,4,13],[4.5,4,11.5],[-1,4,17]]){
  const footer=planFooter(s,ui({draft}));
  assert.match(action(footer,'plan-confirm')[1],/\bdisabled\b/,JSON.stringify(draft));
 }
 const footer=planFooter(s,ui({draft:[4,4,6]}));
 assert.match(plain(footer),/Осталось распределить 6/);assert.doesNotMatch(action(footer,'plan-rest')[1],/\bdisabled\b/);
 assert.match(plain(footer),/деньги пока остаются в кошельке/);
 assert.doesNotMatch(action(planFooter(s,ui()),'plan-confirm')[1],/\bdisabled\b/);
});

test('care preview gives exact prices and the missing amount, never guarantees a whole day',()=>{
 const s=profile();
 const short=plain(planDetail(s,ui({draft:[2,4,14]})));
 assert.match(short,/Каша 3/);assert.match(short,/3 сек\. 1/);assert.match(short,/ещё 2/);
 assert.match(plain(planDetail(s,ui())),/Хватит на этот обед и воду/);
 assert.match(plain(planDetail(s,ui({draft:[7,4,9]}))),/Обед и вода \+ 3 про запас/);
 assert.doesNotMatch(short,/хватит на (весь )?день|достаточно на день/i);
});

test('each meal preview uses its actual catalog price plus one portion of water',()=>{
 const s=profile();
 for(const food of E.FOOD){
  const text=plain(planDetail(s,ui({planFood:food.id,draft:[food.price+1,0,19-food.price]})));
  assert.ok(text.includes(`${food.name} ${food.price}`));assert.match(text,/Хватит на этот обед и воду/);
 }
 assert.match(plain(planDetail(s,ui({planFood:'missing'}))),/Каша 3/);
});

test('wants preview states the day-one lock and lists actual prices rather than offering a purchase',()=>{
 const s=profile(),markup=planDetail(s,ui({planCategory:1}));
 const text=plain(markup);assert.match(text,/со 2-го дня/);assert.match(text,/оставить на завтра/);
 for(const item of E.ITEMS)assert.ok(text.includes(`${item.name} ${item.price}`));
 assert.doesNotMatch(markup,/data-act="(?:buy|buy-confirm|shop)"/);
});

test('wants preview distinguishes an affordable option from two simultaneous purchases',()=>{
 const s=profile();s.cycle=2;
 const markup=planDetail(s,ui({planCategory:1,draft:[4,6,10]})),text=plain(markup);
 assert.match(text,/Бабл-ти 4 Хватит/);assert.match(text,/Настолка 6 Хватит/);
 assert.match(text,/Футболка 8 Ещё 2/);assert.match(text,/Цены за одну вещь/);
 assert.equal((markup.match(/budget-want affordable/g)||[]).length,2);
 assert.match(plain(planDetail(s,ui({planCategory:1,draft:[4,3,13]}))),/Бабл-ти 4 Ещё 1/);
});

test('wants never propose rebuying an owned item and handle a completed collection',()=>{
 const s=profile();s.owned=['ball'];
 assert.doesNotMatch(plain(planDetail(s,ui({planCategory:1}))),/Бабл-ти/);
 s.owned=E.ITEMS.map(item=>item.id);
 const markup=planDetail(s,ui({planCategory:1}));
 assert.match(plain(markup),/Все вещи уже на лужайке/);assert.doesNotMatch(markup,/class="budget-want /);
});

test('savings preview distinguishes real savings from a projection and does not select a real dream or pay for anything',()=>{
 const s=profile(),options=ui({planCategory:2,planGoal:'bike'}),before=JSON.stringify(s),beforeUi=JSON.stringify(options);
 const markup=planDetail(s,options),text=plain(markup);
 assert.match(text,/Сейчас 0/);assert.match(text,/Если отложить: 12 из 32/);assert.match(text,/До мечты останется 20/);
 assert.match(text,/Мечту подтвердим после плана/);
 assert.match(markup,/width:37.5%/);assert.match(markup,/width:0%/);
 assert.equal(JSON.stringify(s),before);assert.equal(JSON.stringify(options),beforeUi);
 assert.equal(s.goal,'console');assert.equal(s.missions.goal,undefined);
});

test('an existing real dream takes precedence over a temporary preview selection',()=>{
 const s=profile();s.goal='house';s.savings=8;s.missions.goal={cycle:1};
 const markup=planDetail(s,ui({planCategory:2,planGoal:'bike'}));
 assert.match(plain(markup),/Мечта: Редкая аниме-фигурка/);assert.match(plain(markup),/Если отложить: 20 из 40/);
 assert.doesNotMatch(markup,/data-act="plan-goal"/);
 assert.match(markup,/width:50%/);assert.match(markup,/width:20%/);
});

test('savings projection caps its bars and missing amount, including an already affordable dream',()=>{
 const s=profile();s.savings=40;
 const markup=planDetail(s,ui({planCategory:2}));
 assert.equal((markup.match(/width:100%/g)||[]).length,2);
 assert.match(plain(markup),/хватит на мечту/);assert.doesNotMatch(plain(markup),/останется -/);
 assert.doesNotMatch(markup,/width:(?:1[1-9]\d|[2-9]\d\d)%/);
});

test('already purchased dreams are excluded, with a useful empty-catalog state',()=>{
 const s=profile();s.goalsWon=['console'];s.missions.goal={cycle:1};
 const markup=planDetail(s,ui({planCategory:2,planGoal:'console'}));
 assert.doesNotMatch(markup,/data-id="console"/);assert.match(plain(markup),/из 32/);
 s.goalsWon=E.GOALS.map(goal=>goal.id);
 const complete=planDetail(s,ui({planCategory:2}));
 assert.match(plain(complete),/Все мечты уже на лужайке/);assert.doesNotMatch(complete,/data-act="plan-goal"|budget-goal-bar/);
});

test('all plan previews and the complete view are read-only for model and UI inputs',()=>{
 const s=profile();
 for(const category of [0,1,2]){
  const options=ui({planCategory:category}),before=JSON.stringify({s,options});
  planView(s,options);planDetail(s,options);planFooter(s,options);
  assert.equal(JSON.stringify({s,options}),before);
 }
});

test('controller refresh preserves slider DOM identity during range input',()=>{
 // Structural regression, complemented by actual pointer testing in the browser.
 const source=readFileSync(projectURL('./app.mjs',import.meta.url),'utf8');
 const refresh=source.match(/function refreshPlan\(\)\s*\{([\s\S]*?)\n\}\nfunction showPlan/)?.[1];
 assert.ok(refresh,'refreshPlan must remain a scoped in-place update');
 assert.match(refresh,/column\.querySelector\('input'\)\.value=amount/);
 assert.doesNotMatch(refresh,/renderModal\(|render\(|root\.innerHTML|column\.innerHTML|replaceChildren\(/);
 const input=source.match(/if\(e\.target\.matches\('\[data-plan-range\]'\)[\s\S]*?\n\s*\}/)?.[0];
 assert.ok(input);assert.match(input,/resizeAllocation\(/);assert.match(input,/refreshPlan\(/);assert.doesNotMatch(input,/renderModal\(|render\(/);
});

test('replacing detail buttons restores keyboard focus by action and item identity',()=>{
 const source=readFileSync(projectURL('./app.mjs',import.meta.url),'utf8');
 const refresh=source.match(/function refreshPlanDetail\(\)\s*\{([\s\S]*?)\n\}\nfunction refreshPlan/)?.[1];
 assert.ok(refresh);assert.match(refresh,/document\.activeElement/);assert.match(refresh,/detail\?\.contains\(active\)/);
 assert.match(refresh,/el\.dataset\.act===action&&el\.dataset\.id===id/);
 assert.match(refresh,/focus\(\{preventScroll:true\}\)/);
 const remainder=source.match(/case 'plan-rest':([\s\S]*?)break;/)?.[1];
 assert.ok(remainder);assert.match(remainder,/data-act="plan-confirm"/);assert.match(remainder,/focus\(\{preventScroll:true\}\)/);
});
