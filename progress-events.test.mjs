import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine.mjs';
import {progressEvent} from './progress-events.mjs';
import {modalView} from './views.mjs';

test('deposit income has its own celebration, without repeating the daily grant or planning',()=>{
 const s=E.createProfile();s.tutorial='done';s.plan=[4,6,10];s.wallet=25;
 s.pendingIncome={amount:5,principal:10,source:'deposit',cycle:3};
 const view=modalView(s,{modal:'income-event'});
 assert.equal(view.title,'Вклад принёс доход');
 assert.match(view.body,/Вклад тоже вернулся в кошелёк/);
 assert.match(view.body,/<span>10<\/span>/);
 assert.doesNotMatch(view.body,/Начался игровой день/);
 assert.match(view.footer,/К Пито/);
 assert.doesNotMatch(view.footer,/Составить план/);
});

test('an unpaid presentation of legacy fractional deposit income survives reload without another payout',()=>{
 const s=E.createProfile();s.tutorial='done';s.plan=[4,6,10];s.wallet=25;
 s.pendingIncome={amount:1.5,principal:10.5,source:'deposit',cycle:3};
 const restored=E.restore(JSON.stringify(s),s.lastSeen+60000);
 assert.equal(restored.wallet,25);assert.equal(restored.elapsed,0);
 assert.equal(restored.pendingIncome.amount,1.5);
 assert.equal(progressEvent(restored),'income-event');
});

test('only one important event is chosen, in income/reward/growth order',()=>{
 const s=E.createProfile();
 s.pendingIncome={amount:20};s.pendingReward={amount:2};s.pendingGrowth=true;s.adultNotice=true;
 assert.equal(progressEvent(s),'money-intro');
 s.tutorial='plan';assert.equal(progressEvent(s),'income-event');
 s.pendingIncome=null;assert.equal(progressEvent(s),'reward-event');
 s.pendingReward=null;assert.equal(progressEvent(s),'grown-event');
 s.pendingGrowth=false;assert.equal(progressEvent(s),'grown-event');
 s.adultNotice=false;assert.equal(progressEvent(s),null);
});

test('checking the event repeatedly never acknowledges it, pays twice, or mutates saved progress',()=>{
 const s=E.createProfile();E.grantInitialMoney(s);
 const before=JSON.stringify(s);
 for(let i=0;i<20;i++)assert.equal(progressEvent(s),'income-event');
 assert.equal(JSON.stringify(s),before);assert.equal(s.wallet,20);
 assert.equal(s.ledger.filter(entry=>entry.source==='initial').length,1);
});

test('no player has no pending event and a normal active day has none',()=>{
 assert.equal(progressEvent(null),null);assert.equal(progressEvent(undefined),null);
 const s=E.createProfile();E.grantInitialMoney(s);E.acknowledgeIncome(s);s.tutorial='done';
 assert.equal(progressEvent(s),null);
});

test('acknowledging income or adulthood removes the event once without changing the credited money',()=>{
 const s=E.createProfile();E.grantInitialMoney(s);
 assert.equal(E.acknowledgeIncome(s),true);assert.equal(E.acknowledgeIncome(s),false);
 assert.equal(s.wallet,20);assert.equal(progressEvent(s),null);
 s.stage=2;s.adultNotice=true;
 assert.equal(progressEvent(s),'grown-event');assert.equal(E.acknowledgeGrowth(s),true);assert.equal(E.acknowledgeGrowth(s),false);
 assert.equal(s.wallet,20);assert.equal(s.stage,2);assert.equal(progressEvent(s),null);
});

test('income and growth remain separate screens even when both are pending',()=>{
 const s=E.createProfile();E.grantInitialMoney(s);s.stage=2;s.adultNotice=true;
 const before=JSON.stringify(s),income=modalView(s,{modal:progressEvent(s)});
 assert.equal(income.title,'Первые штучки!');assert.match(income.body,/\+20/);
 assert.doesNotMatch(income.body,/Пито вырос|Теперь у тебя|event-pet/);assert.equal(JSON.stringify(s),before);
 E.acknowledgeIncome(s);const growth=modalView(s,{modal:progressEvent(s)});
 assert.equal(growth.title,'Пито вырос!');assert.doesNotMatch(growth.body,/km-amount|\+20/);
 assert.equal(s.wallet,20);assert(s.adultNotice);
});
