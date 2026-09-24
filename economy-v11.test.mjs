import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine.mjs';
import {kidOverlay} from './kid-overlays.mjs';

function playing(){const s=E.createProfile();Object.assign(s,{tutorial:'done',cycle:3,completedCycles:2,wallet:20,savings:15,plan:[4,0,16],missions:{save:{},goal:{}},initialMoneyGranted:true});return s;}
function bank(s,ui={}){return kidOverlay(s,{modal:'bank',...ui});}

test('variable deposits quote a whole game bonus and accept every affordable positive integer',()=>{
 for(const amount of [1,2,3,7,10,20]){
  const s=playing();assert.equal(E.depositBonus(amount),Math.ceil(amount/2));
  assert(E.openDeposit(s,'wallet',amount));assert.equal(s.wallet,20-amount);
  assert.deepEqual(s.deposit,{principal:amount,bonus:Math.ceil(amount/2),due:3});
  assert.equal(s.ledger.at(-1).amount,amount);
  assert.equal(s.missions.deposit?.resolution,'completed');
 }
});
test('a small deposit cannot be collected early, duplicated, or rounded twice',()=>{
 const s=playing();assert(E.openDeposit(s,'wallet',1));const opened=JSON.stringify(s);
 assert(!E.openDeposit(s,'wallet',1));assert(!E.collectDeposit(s));assert.equal(JSON.stringify(s),opened);
 s.completedCycles=3;assert(E.collectDeposit(s));assert.equal(s.wallet,21);assert.equal(s.ledger.at(-1).amount,1);
 assert(!E.collectDeposit(s));assert(E.openDeposit(s,'wallet',1));assert.equal(s.deposit.due,4);assert(!E.collectDeposit(s));
});
test('invalid or unaffordable deposit attempts do not mutate balances or ledger',()=>{
 for(const amount of [-1,0,0.5,NaN,Infinity,21,Number.MAX_SAFE_INTEGER]){
  const s=playing(),before=JSON.stringify(s);assert(!E.openDeposit(s,'wallet',amount));assert.equal(JSON.stringify(s),before);
 }
 const s=playing(),before=JSON.stringify(s);assert(!E.openDeposit(s,'invalid',1));assert.equal(JSON.stringify(s),before);
});
test('savings source is explicit and its ledger legs are neutral to daily saving',()=>{
 const s=playing();s.wallet=0;const saved=E.cycleSummary(s).actual.savings;
 assert(E.openDeposit(s,'savings',3));assert.equal(s.wallet,0);assert.equal(s.savings,12);
 assert.equal(E.cycleSummary(s).actual.savings,saved);
 assert.deepEqual(s.ledger.map(e=>[e.kind,e.amount]),[['transfer',-3],['bank-in',3]]);
});
test('new and old deposits retain exact principal, bonus and maturity on reload',()=>{
 for(const deposit of [{principal:1,bonus:1,due:3},{principal:3,bonus:2,due:6},{principal:12,bonus:5,due:8}]){
  const s=playing();s.deposit=deposit;const restored=E.restore(JSON.stringify(s),s.lastSeen);
  assert.deepEqual(restored.deposit,deposit);assert.deepEqual(restored.ledger,s.ledger);
 }
});
test('bank displays chosen amount, exact payout and explicit source without showing percentages',()=>{
 const s=playing(),v=bank(s,{depositSource:'wallet',depositAmount:3});
 assert.match(v.body,/data-act="bank-step"/);assert.match(v.body,/ui-v11\/plus.png/);assert.match(v.body,/ui-v11\/minus.png/);
 assert.match(v.body,/<span>3<\/span>/);assert.match(v.body,/<span>5<\/span>/);
 assert.match(v.body,/data-act="bank-source" data-id="savings"/);
 assert.match(v.footer,/data-deposit-amount="3"/);assert.doesNotMatch(v.footer,/ disabled/);assert.doesNotMatch(v.body,/%/);
});
test('bank warns about care reserve but permits the full wallet, and rejects an overlarge quote',()=>{
 const s=playing();const v=bank(s,{depositSource:'wallet',depositAmount:20});
 assert.match(v.body,/На еду и воду останется меньше/);assert.doesNotMatch(v.footer,/ disabled/);
 assert.match(bank(s,{depositAmount:21}).footer,/ disabled/);
});
test('poop costs cleanliness immediately and continuously; one removal restores only its recorded litter penalty',()=>{
 const s=playing();s.needs.clean=80;E.spawnPoop(s);assert.equal(s.needs.clean,72);
 const id=s.poops[0].id;E.decay(s,60);const polluted=s.needs.clean;
 const clean=playing();clean.needs.clean=72;E.decay(clean,60);assert(polluted<clean.needs.clean-3);
 for(let i=0;i<6;i++)E.tapPoop(s,id);
 assert.equal(s.needs.clean,polluted+8);const after=s.needs.clean;
 assert(!E.tapPoop(s,id));assert.equal(s.needs.clean,after);
});
test('washing a poop away improves cleanliness even when cloud is not over Pito',()=>{
 const s=playing();s.needs.clean=80;E.spawnPoop(s);const x=s.poops[0].x;
 assert(x>72);assert(E.rain(s,1.8,x,{spent:0}));assert.equal(s.poops.length,0);assert.equal(s.needs.clean,80);
});
test('spawn and cleanup cannot farm cleanliness at zero or exceed original cleanliness',()=>{
 for(const initial of [0,3,70,100]){
  const s=playing();s.needs.clean=initial;
  for(let cycle=0;cycle<10;cycle++){E.spawnPoop(s);const id=s.poops[0].id;for(let i=0;i<6;i++)E.tapPoop(s,id);}
  assert.equal(s.needs.clean,initial);
 }
});
test('saved litter penalty survives reload and legacy litter cannot invent a cleanup reward',()=>{
 const s=playing();s.needs.clean=80;E.spawnPoop(s);const restored=E.restore(JSON.stringify(s),s.lastSeen);
 assert.equal(restored.poops[0].cleanPenalty,8);
 for(let i=0;i<6;i++)E.tapPoop(restored,restored.poops[0]?.id);
 assert.equal(restored.needs.clean,80);
 const old=playing();old.needs.clean=50;old.poops=[{id:1,x:80,taps:0,wet:0}];for(let i=0;i<6;i++)E.tapPoop(old,1);
 assert.equal(old.needs.clean,50);
});
