import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine.mjs';
import {planOptions,choosePlayPlan,playPlanView} from './play-plan.mjs';
test('buying defaults to zero saving and leaves unassigned money',()=>{
 const s=E.createProfile();s.wallet=16;
 assert.deepEqual(choosePlayPlan(s,'want'),[4,4,0]);assert.equal(planOptions(s).want.free,8);
 assert.match(playPlanView(s,{playPlanChoice:'want'}).body,/Свободно/);
});
test('each card owns its savings amount, including explicit zero',()=>{
 const s=E.createProfile();s.wallet=16;
 assert.deepEqual(choosePlayPlan(s,'want',null,4,{want:3,save:7}),[4,4,3]);
 assert.deepEqual(choosePlayPlan(s,'save',null,4,{want:3,save:7}),[4,0,7]);
 assert.deepEqual(choosePlayPlan(s,'save',null,4,{save:0}),[4,0,0]);
});
test('quotes conserve allocated plus free money for every affordable card',()=>{
 for(let wallet=0;wallet<50;wallet++)for(let care=0;care<12;care++)for(const amount of [-2,0,1,4,100,NaN]){
  const s={...E.createProfile(),wallet};const o=planOptions(s,'comic',care,{want:amount,save:amount});
  for(const choice of ['want','save'])if(o[choice].available){const p=o[choice];assert.equal(p.parts.reduce((a,b)=>a+b,0)+p.free,wallet);assert(p.parts.every(n=>Number.isInteger(n)&&n>=0));}
 }
});
test('partial plan is saved without moving money and survives reload',()=>{
 const s=E.createProfile();s.wallet=16;s.tutorial='done';s.initialMoneyGranted=true;s.pendingIncome=null;s.missions.plan={cycle:1};s.giftUsed=true;
 assert(E.setPlan(s,[4,4,0]));assert.equal(s.wallet,16);assert.equal(s.savings,0);
 const restored=E.restore(JSON.stringify(s),s.lastSeen);assert.deepEqual(restored.plan,[4,4,0]);assert.equal(restored.wallet,16);
});
test('one common savings block follows both pictured choices',()=>{
 const s={...E.createProfile(),wallet:16},body=playPlanView(s).body;
 assert.equal((body.match(/data-act="plan-saving-step"/g)||[]).length,2);
 assert.match(body,/Добавить в копилку/);
 assert(body.indexOf('Добавить в копилку')>body.indexOf('Копить на мечту'));
 assert.doesNotMatch(body,/care-basket|Это план, не покупка/);
 for(const button of body.match(/<button\b[^>]*>[\s\S]*?<\/button>/g)||[])assert.equal((button.match(/<button\b/g)||[]).length,1);
});
