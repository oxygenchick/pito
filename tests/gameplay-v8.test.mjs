import {projectURL} from './project-path.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../src/engine.mjs';
import {progressEvent} from '../src/progress-events.mjs';
import {modalView,home} from '../src/views.mjs';

function playing(){const s=E.createProfile();Object.assign(s,{tutorial:'done',giftUsed:true,trialUsed:true,initialMoneyGranted:true,wallet:30,plan:[4,16,10],needs:{food:40,affection:60,clean:70}});return s;}

test('first item has a persistent reveal, no duplicate reward and an explicit shelf acknowledgement',()=>{
 const s=playing();assert(E.buy(s,'ball'));
 assert.equal(progressEvent(s),'purchase-event');assert.equal(s.shelfSeen,false);
 assert.deepEqual(s.pendingPurchase,{id:'ball',first:true,reward:s.missions.buy.rewardPaid});
 const before=s.wallet,ledger=JSON.stringify(s.ledger),restored=E.restore(JSON.stringify(s),s.lastSeen+60000);
 assert.equal(restored.elapsed,0);assert.equal(restored.wallet,before);assert.equal(JSON.stringify(restored.ledger),ledger);
 assert.equal(progressEvent(restored),'purchase-event');
 const view=modalView(restored,{modal:'purchase-event'});
 assert.match(view.body,/слева возле Пито/);assert.match(view.footer,/Посмотреть/);assert.equal(view.closable,false);
 assert(E.acknowledgePurchase(restored));assert.equal(restored.shelfSeen,true);assert.equal(progressEvent(restored),null);
 assert.equal(E.acknowledgePurchase(restored),null);assert.equal(restored.wallet,before);
 assert(E.buy(restored,'comic'));assert.equal(restored.pendingPurchase.first,false);assert.equal(restored.pendingPurchase.reward,0);
});

test('a purchase pauses online time and a legacy collection does not replay its first shelf reveal',()=>{
 const s=playing();assert(E.buy(s,'ball'));E.tick(s,2);assert.equal(s.elapsed,0);
 E.acknowledgePurchase(s);E.tick(s,2);assert.equal(s.elapsed,2);
 delete s.shelfSeen;delete s.pendingPurchase;const restored=E.restore(JSON.stringify(s),s.lastSeen);
 assert.equal(restored.shelfSeen,true);assert.equal(restored.pendingPurchase,null);
});

test('a fulfilled dream uses the same shelf reveal without charging the wallet',()=>{
 const s=playing();s.savings=24;assert(E.claimGoal(s));assert.equal(s.wallet,30);assert.equal(s.savings,0);
 assert.deepEqual(s.pendingPurchase,{id:'console',first:true,firstDream:true,reward:0,dream:true});
 const view=modalView(s,{modal:progressEvent(s)});assert.equal(view.title,'Мечта сбылась!');assert.match(view.footer,/Посмотреть/);
});

test('every item and dream has a distinct child-facing purpose and a simple reaction, not a promised minigame',()=>{
 const catalog=[...E.ITEMS,...E.GOALS];assert.equal(new Set(catalog.map(i=>i.description)).size,catalog.length);
 for(const item of catalog){assert(item.description.length>30&&item.description.length<160,item.id);assert(item.reaction);assert(['bounce','open','turn','sway','beat'].includes(item.motion));assert.doesNotMatch(item.description,/мини.?игр|уровн|соревнов|побед/);}
 const s=playing();for(const item of E.ITEMS){const v=modalView(s,{modal:'buy',selection:item.id});assert(v.body.includes(item.description));}
});

test('growth is automatic and its notice remains separate from tomorrow’s income',()=>{
 const s=playing();Object.assign(s,{stage:0,completedCycles:1,cycle:2,growthPoints:4});assert(E.endCycle(s,true));
 assert.equal(s.stage,1);assert.equal(s.antennae,0);assert.equal(s.pendingGrowth,false);assert.equal(progressEvent(s),'grown-event');
 const view=modalView(s,{modal:progressEvent(s)});assert.equal(view.title,'Пито вырос!');assert.match(view.body,/появились усики/);
 assert.doesNotMatch(view.body+view.footer,/Выбери|data-act="antennae|antenna-choices/);
 assert.equal(E.nextCycle(s),false);assert(E.acknowledgeGrowth(s));assert(E.nextCycle(s));assert.equal(progressEvent(s),'income-event');
});

test('late growth announces antennae before legs even if all adult points were already earned',()=>{
 const s=playing();Object.assign(s,{cycle:7,completedCycles:6,growthPoints:20});assert(E.endCycle(s,true));
 assert.equal(s.stage,1);assert(E.acknowledgeGrowth(s));assert(E.nextCycle(s));E.acknowledgeIncome(s);assert(E.setPlan(s,[4,0,0]));assert(E.endCycle(s,true));assert.equal(s.stage,2);
});

test('a pending legacy antenna choice migrates into an acknowledged growth event without time or money changes',()=>{
 const s=playing();s.pendingGrowth=true;const old=s.wallet;
 const r=E.restore(JSON.stringify(s),s.lastSeen+60000);assert.equal(r.stage,1);assert.equal(r.pendingGrowth,false);assert.equal(r.elapsed,0);assert.equal(r.wallet,old);assert.equal(progressEvent(r),'grown-event');
 assert.equal(E.canSpend(r,1),false);assert(E.acknowledgeGrowth(r));assert.equal(E.canSpend(r,1),true);
});

test('rain has one clear exit toggle, no orphan hint cross, and eight independent raster drops',()=>{
 const markup=home(playing(),{rainSession:{spent:0},rainHint:true,cloudX:75});
 assert.match(markup,/aria-label="Убрать тучку"/);assert.doesNotMatch(markup,/kid-rain-close|data-act="rain-exit"/);
 const drops=markup.match(/<span class="rain-drops" aria-hidden="true">([\s\S]*?)<\/span>/)?.[1];assert(drops);
 assert.equal((drops.match(/assets\/ui-v8\/drop.png/g)||[]).length,8);
});

test('controller sets transient emotion and installs gaze only once, outside rendering',()=>{
 const app=readFileSync(projectURL('./app.mjs',import.meta.url),'utf8');
 assert.equal((app.match(/installGaze\(root\)/g)||[]).length,1);
 assert.match(app,/character\.dataset\.emotion=ui\.petEmotion/);assert.match(app,/reactPet\('eating'/);assert.match(app,/reactPet\('happy'/);
 assert.match(app,/rainHeld&&Math\.abs\(ui\.cloudX-51\)<21\?'washing'/);
 assert.doesNotMatch(app,/case 'antennae'|chooseAntennae/);
 assert.match(app,/if\(ui\.modal\|\|screen!=='home'\|\|!s\)return/);
});
