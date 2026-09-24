import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine.mjs';
import {kidMain} from './kid-main.mjs';
import {readFileSync} from 'node:fs';

test('variable deposit guide and journal do not promise one fixed principal or return',()=>{
 const s=E.createProfile(),mission=E.MISSIONS.find(m=>m.id==='deposit');
 assert.equal(mission.criterion.minAmount,1);
 const guide=kidMain(s,{modal:'guide',selection:'deposit'});
 for(const copy of [mission.description,mission.lesson,guide.body]){
  assert.match(copy,/один игровой день/);assert.doesNotMatch(copy,/10 штучек|заберёшь 15|ещё 5/);
 }
 assert.match(guide.footer,/data-target="bank"/);
});

test('mission and main screen copy use sentences rather than long dashes',()=>{
 for(const file of ['missions.mjs','kid-main.mjs'])assert.doesNotMatch(readFileSync(new URL(file,import.meta.url),'utf8'),/[—–]/);
});

test('deposit return copy works for a single coin without plural mismatch',()=>{
 const s=E.createProfile();s.pendingIncome={source:'deposit',amount:1,principal:1};
 const view=kidMain(s,{modal:'income-event'});
 assert.match(view.body,/Вклад тоже вернулся в кошелёк/);assert.match(view.body,/<span>1<\/span>/);
 assert.doesNotMatch(view.body,/Твои 1/);
});

test('eight-minute day slows care decay proportionally without changing per-day food cost',()=>{
 assert.equal(E.CYCLE_SECONDS,480);
 const s=E.createProfile();s.needs={food:100,affection:100,clean:100};
 E.decay(s,E.CYCLE_SECONDS);
 assert(Math.abs(s.needs.food-82.9)<1e-8);
 assert(Math.abs(s.needs.affection-87.4)<1e-8);
 assert.equal(s.poops.length,1);
});

test('old deposit term and credited history survive reload without another payment',()=>{
 const s=E.createProfile();s.deposit={principal:10,bonus:5,due:6};s.completedCycles=3;
 const before=JSON.stringify(s.ledger),r=E.restore(JSON.stringify(s),s.lastSeen);
 assert.equal(r.deposit.due,6);assert.equal(r.deposit.bonus,5);
 assert.equal(JSON.stringify(r.ledger),before);assert.equal(r.wallet,s.wallet);
});

test('day feedback names overspending and missed savings using the exact plan and actual values',()=>{
 const p={planned:{care:4,wants:0,savings:12},actual:{care:2,wants:6,savings:8}};
 assert.deepEqual(E.planOutcome(p),{met:false,title:'Получилось иначе',lines:['На хотелки оставили 0, а потратили 6.','Хотели отложить 12, а отложили 8.']});
 p.actual={care:2,wants:0,savings:12};assert.equal(E.planOutcome(p).title,'План выполнен');
});

test('matured principal is not mistaken for spending the savings plan',()=>{
 const p={planned:{care:4,wants:0,savings:6},actual:{care:2,wants:0,savings:-4},bankSaved:-10};
 const before=JSON.stringify(p),outcome=E.planOutcome(p);
 assert(outcome.met);assert.match(outcome.lines.join(' '),/Отложили 6/);assert.equal(JSON.stringify(p),before);
});

test('each guide CTA has an explicit destination and no accidental spending',()=>{
 const s=E.createProfile(),before=JSON.stringify(s);
 for(const m of E.MISSIONS){const v=kidMain(s,{modal:'guide',selection:m.id});assert.match(v.footer,/data-act="guide-go"/);assert.match(v.footer,new RegExp(`data-target="${m.action}"`));}
 assert.equal(JSON.stringify(s),before);
});

test('regular food mission waits for hunger even on a later day',()=>{
 const s=E.createProfile();s.cycle=3;s.tutorial='done';s.missions=Object.fromEntries(E.MISSIONS.filter(m=>m.id!=='paid-food').map(m=>[m.id,{cycle:1}]));
 s.needs.food=85;assert.equal(E.currentMission(s),null);s.needs.food=60;
 assert.equal(E.currentMission(s).title,'Пора подкрепиться');
});
