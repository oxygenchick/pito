import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine.mjs';

function paidPlanned(){const s=E.createProfile();assert(E.grantInitialMoney(s));assert(E.acknowledgeIncome(s));return s;}

test('unconfirmed old pre-care plan migrates to meeting; confirmed plans and rewards remain intact',()=>{
 const s=paidPlanned();s.tutorial='plan';
 const p=E.restore(JSON.stringify(s),s.lastSeen);assert.equal(p.tutorial,'meet');assert.equal(p.wallet,20);assert.equal(p.plan,null);
 s.plan=[6,4,10];s.plans=[{cycle:1,parts:s.plan,wallet:20}];s.wallet=22;s.tutorial='meet';s.pendingReward={amount:2,title:'План готов'};
 const q=E.restore(JSON.stringify(s),s.lastSeen);assert.equal(q.tutorial,'meet');assert.deepEqual(q.plan,[6,4,10]);assert.equal(q.wallet,22);assert.equal(q.pendingReward.amount,2);
});
function paidIntro(){const s=paidPlanned();assert(E.meet(s));assert(E.feed(s,'apple'));assert(E.acknowledgeCare(s));const session={spent:0};for(let i=0;i<19;i++)assert(E.rain(s,.1,80,session));for(let i=0;i<30&&s.tutorial==='wash';i++)assert(E.rain(s,.1,51,session));assert.equal(s.tutorial,'washed');assert(E.acknowledgeCare(s));assert(E.setPlan(s,[6,4,s.wallet-10]));return s;}

test('new pet starts before any money: explanation then a persistent, one-time income event',()=>{
 const s=E.createProfile();assert.equal(s.wallet,0);assert.equal(s.tutorial,'money');assert.equal(s.onboardingPaid,true);assert.equal(s.ledger.length,0);
 assert(!E.meet(s));assert(!E.feed(s,'apple'));assert(!E.setPlan(s,[0,0,0]));conserved(s);
 const p=E.restore(JSON.stringify(s),s.lastSeen);assert.equal(p.ledger.length,0);assert.equal(p.wallet,0);assert.equal(p.tutorial,'money');
 assert(E.grantInitialMoney(p));assert.equal(p.wallet,20);assert.equal(p.tutorial,'meet');assert.deepEqual(p.pendingIncome,{amount:20,source:'initial',cycle:1});
 assert(!E.grantInitialMoney(p));assert(!E.setPlan(p,[6,4,10]));assert(!E.canSpend(p,1));
 const q=E.restore(JSON.stringify(p),p.lastSeen+86400000);assert.equal(q.wallet,20);assert.equal(q.pendingIncome.amount,20);assert.equal(q.elapsed,0);assert.equal(q.ledger.length,1);
 assert(E.acknowledgeIncome(q));assert(!E.acknowledgeIncome(q));assert(!E.setPlan(q,[6,4,10]));assert.equal(q.tutorial,'meet');assert.equal(q.plan,null);conserved(q);
});
test('new first feeding and washing are real expenses before the plan, with no duplicate food mission',()=>{
 const s=paidPlanned();assert.equal(s.wallet,20);assert(!E.feed(s,'apple'));assert(E.meet(s));assert(!E.feed(s,'soup'));assert(!E.rain(s,.1,51,{spent:0}));
 assert(E.feed(s,'apple'));assert.equal(s.wallet,18);assert.equal(s.needs.food,65);assert.equal(s.tutorial,'fed');assert(s.missions.feed);assert(!s.missions['paid-food']);assert.equal(E.totals(s).food,2);
 const p=E.restore(JSON.stringify(s),s.lastSeen);assert(!p.missions['paid-food']);assert(!E.feed(p,'apple'));assert(E.acknowledgeCare(p));assert(!E.feed(p,'apple'));
 const session={spent:0};for(let i=0;i<19;i++)assert(E.rain(p,.1,80,session));for(let i=0;i<30&&p.tutorial==='wash';i++)assert(E.rain(p,.1,51,session));
 assert.equal(p.tutorial,'washed');assert.equal(session.spent,2);assert.equal(p.wallet,16);assert.equal(E.totals(p).rain,2);assert(p.missions.wash);assert(!E.rain(p,.1,51,session));
 assert(E.acknowledgeCare(p));assert.equal(p.tutorial,'plan');assert.equal(p.plan,null);assert.equal(E.currentMission(p).id,'plan');assert(E.setPlan(p,[4,4,8]));assert.equal(p.tutorial,'done');assert.equal(p.plans[0].careBeforePlan,4);assert.equal(E.cycleSummary(p).actual.care,0);assert(!E.acknowledgeCare(p));assert.equal(E.currentMission(p).id,'goal');conserved(p);
});
test('first-wash exhaustion resumes ordinary days with no free water, false completion or extra income',()=>{
 const s=paidPlanned();E.meet(s);E.feed(s,'apple');E.acknowledgeCare(s);assert(!E.deferExhaustedWash(s));
 const session={spent:0};for(let i=0;i<650;i++)E.rain(s,.1,0,session);
 assert.equal(s.wallet,0);assert.equal(session.spent,18);assert.equal(s.tutorial,'wash');assert(!s.missions.wash);assert.equal(s.water,0);
 assert(E.deferExhaustedWash(s));assert.equal(s.tutorial,'plan');assert(E.setPlan(s,[0,0,0]));assert(!E.deferExhaustedWash(s));assert(!s.missions.wash);conserved(s);
 end(s);if(s.adultNotice)assert(E.acknowledgeGrowth(s));assert(E.nextCycle(s));assert.equal(s.wallet,10);assert.equal(s.pendingIncome.amount,8);assert(!E.setPlan(s,[8,0,0]));assert(E.acknowledgeIncome(s));assert(E.setPlan(s,[8,0,0]));
 for(const p of [...s.poops])for(let i=0;i<6;i++)E.tapPoop(s,p.id);
 for(let i=0;i<60&&!s.trialUsed;i++)assert(E.rain(s,.1,51,{spent:0}));
 assert(s.missions.wash);assert(s.trialUsed);assert.equal(s.tutorial,'done');assert(E.totals(s).rain>0);conserved(s);
});
test('daily income is its own persistent event and cannot be skipped by spending or offline time',()=>{
 const s=paidIntro();end(s);const before=s.wallet;if(s.adultNotice)assert(E.acknowledgeGrowth(s));assert(E.nextCycle(s));assert.equal(s.wallet,before+8);assert.deepEqual(s.pendingIncome,{amount:8,source:'daily',cycle:2});assert(!E.nextCycle(s));
 assert(!E.setPlan(s,[4,0,0]));assert(!E.transfer(s,1));assert(!E.chooseGoal(s,'bike'));assert(!E.feed(s,'apple'));
 const p=E.restore(JSON.stringify(s),s.lastSeen+86400000);assert.equal(p.elapsed,0);assert.equal(p.wallet,s.wallet);assert(p.pendingIncome);assert(E.acknowledgeIncome(p));assert(E.setPlan(p,[4,0,0]));conserved(p);
});
test('new paid profile completes five natural cycles and adulthood has a separately acknowledged event',()=>{
 const s=paidIntro();assert(E.chooseGoal(s,'console'));
 for(let day=1;day<=5;day++){
  if(day>1){if(s.adultNotice)assert(E.acknowledgeGrowth(s));assert(E.nextCycle(s));assert(E.acknowledgeIncome(s));assert(E.setPlan(s,[6,0,1]));}
  assert(E.transfer(s,1));elapse(s,80);assert(E.feed(s,'apple'));end(s);conserved(s);
 }
 assert.equal(s.stage,2);assert(s.adultNotice);const p=E.restore(JSON.stringify(s),s.lastSeen);assert(p.adultNotice);assert(E.acknowledgeGrowth(p));assert(!E.acknowledgeGrowth(p));assert.equal(E.restore(JSON.stringify(p),p.lastSeen).adultNotice,false);conserved(p);
});
test('old saved intro never receives a second initial grant or paid-onboarding migration',()=>{
 const s=legacyProfile();delete s.onboardingPaid;delete s.initialMoneyGranted;const p=E.restore(JSON.stringify(s),s.lastSeen);assert.equal(p.onboardingPaid,false);assert.equal(p.wallet,20);assert.equal(p.tutorial,'meet');assert(!E.grantInitialMoney(p));assert(E.meet(p));assert(E.feed(p,'apple'));assert.equal(p.wallet,20);conserved(p);
});

test('unacknowledged reward pauses online and offline time and cannot duplicate income or advance a day',()=>{
 const s=paidIntro();s.pendingReward={amount:2,title:'План готов',lesson:'Все штучки ещё в кошельке.'};
 const before=s.wallet,ledger=JSON.stringify(s.ledger),needs={...s.needs};s.elapsed=89;
 E.tick(s,2);assert.equal(s.elapsed,89);assert.deepEqual(s.needs,needs);assert(!E.canSpend(s,1));assert(!E.feed(s,'apple'));assert(!E.rain(s,.1,51,{spent:0}));assert(!E.transfer(s,1));assert(!E.chooseGoal(s,'bike'));assert(!E.acknowledgeIncome(s));
 const p=E.restore(JSON.stringify(s),s.lastSeen+86400000);assert.equal(p.elapsed,89);assert.equal(p.wallet,before);assert.equal(JSON.stringify(p.ledger),ledger);assert.deepEqual(p.pendingReward,s.pendingReward);
 p.elapsed=90;assert(!E.finishDueCycle(p));assert(!E.endCycle(p,true));p.review=true;assert(!E.nextCycle(p));assert.equal(p.wallet,before);
 p.pendingReward=null;assert(E.nextCycle(p));assert.equal(p.wallet,before+8);assert(!E.nextCycle(p));assert.equal(p.ledger.filter(e=>e.kind==='income').length,s.ledger.filter(e=>e.kind==='income').length+1);conserved(p);
});
test('adult growth must be acknowledged before the next daily income event',()=>{
 const s=paidIntro();s.stage=2;s.adultNotice=true;s.review=true;const before=s.wallet;
 assert(!E.nextCycle(s));assert.equal(s.wallet,before);assert.equal(s.pendingIncome,null);
 const p=E.restore(JSON.stringify(s),s.lastSeen);assert(!E.nextCycle(p));assert(E.acknowledgeGrowth(p));assert(E.nextCycle(p));assert.equal(p.wallet,before+8);assert.equal(p.pendingIncome.amount,8);assert(!E.nextCycle(p));conserved(p);
});

// These fixtures preserve the already-shipped free intro for existing saves.
function legacyProfile(){const s=E.createProfile();s.onboardingPaid=false;s.initialMoneyGranted=true;s.wallet=20;s.tutorial='meet';s.ledger=[{cycle:1,kind:'income',amount:20,label:'Первые карманные штучки',category:'',source:'initial'}];return s;}

const answers=[['need','need','want','want'],[1,1,0,0],[4,4,2],4,'save',[6,2,2]];
function tutorial() {
 const s=legacyProfile();assert(E.meet(s));assert(E.feed(s,'apple'));assert(E.acknowledgeCare(s));
 const session={spent:0};for(let i=0;i<20;i++)E.rain(s,.1,80,session);for(let i=0;i<30;i++)E.rain(s,.1,51,session);
 assert.equal(s.tutorial,'washed');assert(E.acknowledgeCare(s));assert.equal(s.tutorial,'plan');return s;
}
function intro(parts=[4,4,12]) {const s=tutorial();assert(E.setPlan(s,parts));return s;}
// Legacy scenarios express time in the original 90-second balance-day units.
function elapse(s,seconds) {seconds*=E.CYCLE_SECONDS/90;for(let n=0;n<seconds;n+=2)E.tick(s,Math.min(2,seconds-n));}
function end(s) {if(s.pendingPurchase)assert(E.acknowledgePurchase(s));elapse(s,90);assert(E.finishDueCycle(s));assert(!E.finishDueCycle(s));}
function next(s,parts=[4,4,4]) {if(s.adultNotice)assert(E.acknowledgeGrowth(s));assert(E.nextCycle(s));assert(E.acknowledgeIncome(s));assert(E.setPlan(s,parts));}
function rainFor(s,seconds=3,x=51) {const session={spent:0};for(let n=0;n<seconds*10;n++)assert(E.rain(s,.1,x,session));return session;}
function conserved(s) {
 const income=s.ledger.filter(e=>e.kind==='income').reduce((n,e)=>n+e.amount,0);
 const expense=s.ledger.filter(e=>e.kind==='expense').reduce((n,e)=>n+e.amount,0);
 assert.equal(income-expense,s.wallet+s.savings+(s.deposit?.principal||0));
 for(const value of [s.wallet,s.savings,s.deposit?.principal||0])assert(Number.isInteger(value)&&value>=0);
}
function startSaving(s) {assert(E.chooseGoal(s,'console'));assert(E.transfer(s,1));}
function goodDay(s) {elapse(s,80);assert(E.feed(s,'porridge'));rainFor(s);assert(E.transfer(s,4));E.stroke(s,30);end(s);conserved(s);}

test('initial 20 is visible income, gifts are free and feeding cannot repeat',()=>{
 const s=legacyProfile();assert.equal(E.totals(s).income,20);assert(!E.feed(s,'apple'));
 E.meet(s);assert(E.feed(s,'apple'));assert.equal(s.wallet,20);assert.equal(s.tutorial,'fed');
 assert.equal(s.missions.feed.rewardPaid,0);assert.equal(s.poops.length,0);assert(!E.feed(s,'apple'));
 assert(E.acknowledgeCare(s));assert.equal(s.poops.length,1);assert(!E.acknowledgeCare(s));conserved(s);
});
test('trial rain and care feedback finish before first budget without charges',()=>{
 const s=tutorial();assert.equal(s.wallet,20);assert.equal(s.poops.length,0);assert(s.trialUsed);
 assert.equal(s.ledger.filter(e=>e.kind==='expense').length,0);assert.equal(E.currentMission(s).id,'plan');conserved(s);
});
test('taps remove dirt but the first wash also requires clean pet',()=>{
 const s=legacyProfile();E.meet(s);E.feed(s,'apple');E.acknowledgeCare(s);
 for(let i=0;i<6;i++)E.tapPoop(s,1);
 assert.equal(s.poops.length,0);assert.equal(s.tutorial,'wash');assert(!s.missions.wash);
 for(let n=0;n<30&&s.tutorial==='wash';n++)assert(E.rain(s,.1,51,{spent:0}));
 assert.equal(s.tutorial,'washed');assert(s.missions.wash);
});
test('plan validates amounts; confirming records intent, never silently transfers',()=>{
 const s=tutorial();for(const p of [[10,10,10],[-1,0,0],[1.5,0,0]])assert(!E.setPlan(s,p));
 assert(E.setPlan(s,[4,4,12]));assert.equal(s.savings,0);assert.equal(s.wallet,22);
 assert.equal(s.plans[0].wallet,20);assert.deepEqual(s.plan,[4,4,12]);assert(!E.setPlan(s,[1,0,0]));
 assert.equal(s.missions.plan.rewardPaid,2);conserved(s);
});
test('actual food charges full price then gives its ONE learning reward',()=>{
 const s=intro();s.needs.food=90;const before=s.wallet;
 assert(E.feed(s,'soup'));assert.equal(s.needs.food,100);assert.equal(s.wallet,before-4+2);
 assert.equal(E.totals(s).food,4);assert(!E.feed(s,'soup'));s.needs.food=50;
 assert(E.feed(s,'apple'));assert.equal(s.wallet,before-4);conserved(s);
});
test('paid rain charges each 3 seconds, displays costs through ledger, no cap',()=>{
 const s=intro(),before=s.wallet;s.needs.clean=10;const session=rainFor(s,7.1);
 assert.equal(s.wallet,before-3);assert.equal(session.spent,3);assert.equal(E.totals(s).rain,3);conserved(s);
});
test('unused water persists across sessions and works at zero balance',()=>{
 const s=intro();s.wallet=1;const r={spent:0};assert(E.rain(s,.1,51,r));assert.equal(s.wallet,0);
 assert(E.rain(s,.1,51,{spent:0}));s.water=0;assert(!E.rain(s,.1,51,r));assert.equal(s.wallet,0);
});
test('continuous rain stops at zero; no negative money or extra ledger charge',()=>{
 const s=intro();s.wallet=2;const r={spent:0};for(let i=0;i<200;i++)E.rain(s,.1,51,r);
 assert.equal(s.wallet,0);assert.equal(r.spent,2);assert.equal(E.totals(s).rain,2);assert(s.water<.001);
});
test('shop unlocks after care and a confirmed plan on day 1; duplicates never charge or reward twice',()=>{
 const unplanned=tutorial();assert(!E.buy(unplanned,'ball'));const s=intro();const before=s.wallet;
 assert(E.buy(s,'ball'));assert.equal(s.wallet,before-4+2);assert(!E.buy(s,'ball'));assert.deepEqual(s.owned,['ball']);conserved(s);
});
test('unaffordable actions never complete a mission',()=>{
 const s=intro();s.cycle=3;s.wallet=0;
 assert(!E.buy(s,'ball'));assert(!E.feed(s,'soup'));assert(!E.openDeposit(s));
 assert(!s.missions.buy&&!s.missions['paid-food']&&!s.missions.deposit);assert.equal(s.wallet,0);
});
test('saving is a transfer not expense, reward is separate and reversible amount bounded',()=>{
 const s=intro();const before=s.wallet;assert(E.transfer(s,6));assert.equal(s.savings,6);
 assert.equal(s.wallet,before-6+2);assert.equal(E.totals(s).saved,6);assert.equal(E.totals(s).wants,0);
 assert(!E.transfer(s,99));assert(!E.transfer(s,-7));assert(!E.transfer(s,.5));
 assert(E.transfer(s,-1));assert.equal(s.wallet,before-3);conserved(s);
});
test('goal is bought once from actual savings and does not spend wallet plan twice',()=>{
 const s=intro();assert(E.chooseGoal(s,'console'));assert(E.transfer(s,24));
 const before=s.wallet;assert(E.claimGoal(s));assert(!E.claimGoal(s));
 assert.equal(s.savings,0);assert.equal(s.wallet,before);assert.deepEqual(s.goalsWon,['console']);
 assert.equal(E.cycleSummary(s).actual.wants,0);assert.equal(E.totals(s).wants,24);conserved(s);
});
test('legacy quizzes stay compatible; wrong answers are safe, reward once',()=>{
 const s=intro(),before=s.wallet;assert(!E.completeTask(s,1,[1,0,1,0]));assert.equal(s.wallet,before);
 assert(E.completeTask(s,1,answers[1]));assert.equal(s.wallet,before+3);assert(E.completeTask(s,1,answers[1]));
 assert.equal(s.wallet,before+3);assert(!E.completeTask(s,5,answers[5]));conserved(s);
});
test('all six legacy solutions remain valid without entering normal action UI',()=>answers.forEach((a,i)=>assert(E.evaluateTask(i,a),i)));
test('journal gives one available action and does not urge feeding the just-fed pet',()=>{
 const s=intro();assert.equal(E.currentMission(s).id,'goal');assert(E.chooseGoal(s,'bike'));
 assert.equal(E.currentMission(s).id,'save');assert(E.transfer(s,1));assert.equal(E.currentMission(s).id,'buy');
 assert(E.deferMission(s,'buy'));assert.equal(E.currentMission(s),null);
 elapse(s,80);assert.equal(E.currentMission(s).id,'paid-food');assert(E.feed(s,'apple'));assert.equal(E.currentMission(s),null);
});
test('six real finance missions cover three themes and each successful decision has its reward',()=>{
 const s=intro();assert(E.chooseGoal(s,'console'));assert(E.transfer(s,4));elapse(s,80);assert(E.feed(s,'porridge'));end(s);
 next(s);assert(E.deferMission(s,'buy'));
 const ids=['plan','goal','paid-food','save','buy','replan'];
 assert(ids.every(id=>s.missions[id]?.rewardPaid===2));
 assert.equal(new Set(ids.map(id=>E.MISSIONS.find(m=>m.id===id).theme)).size,3);
 assert.equal(s.ledger.filter(e=>e.source?.startsWith('mission:')).reduce((v,e)=>v+e.amount,0),12);conserved(s);
});
test('deferring a want is a completed real choice, not fake ownership or endless blocker',()=>{
 const s=intro();startSaving(s);end(s);next(s);const before=s.wallet;
 assert(E.deferMission(s,'buy'));assert.equal(s.wallet,before+2);assert.equal(s.missions.buy.resolution,'deferred');
 assert.equal(E.missionStatus(s,E.MISSIONS.find(m=>m.id==='buy')),'done');assert.equal(s.owned.length,0);
 assert(!E.deferMission(s,'buy'));assert(!E.deferMission(s,'deposit'));assert(E.buy(s,'ball'));
 assert.equal(s.wallet,before-2);assert.equal(s.missions.buy.resolution,'deferred');conserved(s);
});
test('deposit needs real savings experience but allows a deliberate smaller care reserve',()=>{
 const s=intro();s.cycle=3;assert(!E.openDeposit(s));startSaving(s);
 s.wallet=9;assert(!E.openDeposit(s));s.wallet=13;assert(E.openDeposit(s));
 assert.equal(s.wallet,3);assert.equal(s.deposit.principal,10);assert.equal(s.missions.deposit.rewardPaid,0);
 assert(!E.openDeposit(s));assert(!E.collectDeposit(s));
});
test('deposit locks for one complete period; returns principal and bonus once',()=>{
 const s=intro();startSaving(s);end(s);next(s);end(s);next(s);
 assert.equal(s.cycle,3);const before=s.wallet;assert(E.openDeposit(s));assert.equal(s.deposit.due,3);
 assert(!E.collectDeposit(s));end(s);next(s);
 assert(E.collectDeposit(s));assert.equal(s.wallet,before-10+8+15);assert(!E.collectDeposit(s));
 assert.equal(s.ledger.filter(e=>e.label==='Награда по вкладу').length,1);conserved(s);
});

test('open legacy 10+1 deposits upgrade to 10+5 without restarting the term or changing history',()=>{
 const s=intro();startSaving(s);s.cycle=3;assert(E.openDeposit(s));s.deposit.bonus=1;
 const wallet=s.wallet,due=s.deposit.due,ledger=JSON.stringify(s.ledger);
 const p=E.restore(JSON.stringify(s),s.lastSeen);
 assert.equal(p.deposit.bonus,5);assert.equal(p.deposit.due,due);assert.equal(p.wallet,wallet);
 assert.equal(JSON.stringify(p.ledger),ledger);assert.match(p.migrationNotice,/теперь 5/);
 delete p.migrationNotice;
 const q=E.restore(JSON.stringify(p),p.lastSeen);
 assert.equal(q.deposit.bonus,5);assert.equal(q.migrationNotice,undefined);assert(!E.collectDeposit(q));
 q.completedCycles=due;assert(E.collectDeposit(q));assert.equal(q.wallet,wallet+15);
 assert.equal(q.ledger.at(-1).amount,5);assert(!E.collectDeposit(q));conserved(q);
 const closed=E.restore(JSON.stringify(q),q.lastSeen);
 assert.equal(closed.deposit,null);assert.equal(closed.wallet,q.wallet);
 assert.deepEqual(closed.ledger,q.ledger);
});
test('five normal care/savings days grow pet automatically; growth notice mandatory; no legacy quizzes or debug money',()=>{
 const s=intro();assert(E.chooseGoal(s,'console'));
 for(let day=1;day<=5;day++){
  if(day>1){const wallet=s.wallet+8;next(s,[4,4,wallet-8]);}
  goodDay(s);
  if(day===2){assert.equal(s.stage,1);assert(s.adultNotice);assert(!s.pendingGrowth);assert(!E.nextCycle(s));assert(E.acknowledgeGrowth(s));}
 }
 assert.equal(s.stage,2);assert(s.growthPoints>=10);assert.equal(s.antennae,0);assert.equal(s.tasks.length,0);
 assert.equal(s.periods.length,5);assert.equal(s.completedCycles,5);conserved(s);
});
test('five empty zero-plans do not grow the pet and still never block days or income',()=>{
 const s=intro([0,0,0]);for(let i=0;i<5;i++){if(i)next(s,[0,0,0]);end(s);}
 assert.equal(s.stage,0);assert.equal(s.growthPoints,0);assert.equal(s.pendingGrowth,false);
 assert.equal(s.completedCycles,5);if(s.adultNotice)assert(E.acknowledgeGrowth(s));assert(E.nextCycle(s));assert(E.acknowledgeIncome(s));assert.equal(s.cycle,6);assert(s.wallet>20);
});
test('only care without savings grows slower; days still advance',()=>{
 const s=intro([0,0,0]);for(let i=0;i<5;i++){if(i)next(s,[0,0,0]);elapse(s,80);assert(E.feed(s,'apple'));end(s);}
 assert.equal(s.growthPoints,5);assert.equal(s.stage,1);assert.equal(s.completedCycles,5);
});
test('budget match needs real action and honors planned savings; one independent point each',()=>{
 const s=intro([4,4,6]);assert.equal(E.cycleSummary(s).growthGained,0);
 assert(E.feed(s,'apple'));assert.equal(E.cycleSummary(s).growthGained,1);
 assert(E.transfer(s,1));assert.equal(E.cycleSummary(s).growthGained,2);
 assert(E.transfer(s,5));assert.equal(E.cycleSummary(s).growthGained,3);
 assert(E.transfer(s,-1));assert.equal(E.cycleSummary(s).growthGained,2);
});
test('bank deposit is saving for budget and growth, not an expense',()=>{
 const s=intro([4,4,11]);s.cycle=3;s.plans=[];s.plan=[4,4,11];startSaving(s);
 assert(E.openDeposit(s));assert(E.feed(s,'apple'));
 const p=E.cycleSummary(s);assert.equal(p.actual.savings,11);assert.equal(p.bankSaved,10);
 assert.equal(p.expense,2);assert.equal(p.growthGained,3);conserved(s);
});
test('period history is stable after next income, later plans, and reload',()=>{
 const s=intro();startSaving(s);goodDay(s);const snapshot=JSON.stringify(E.cycleSummary(s));
 next(s);assert(E.feed(s,'apple'));assert.equal(JSON.stringify(E.cycleSummary(s,1)),snapshot);
 const p=E.restore(JSON.stringify(s),s.lastSeen);assert.equal(JSON.stringify(E.cycleSummary(p,1)),snapshot);
 assert.equal(p.periods.length,1);
});
test('automatic fifth-day finish works at zero money and zero needs without forcing growth',()=>{
 const s=intro();Object.assign(s,{cycle:5,completedCycles:4,stage:1,antennae:0,growthPoints:4,wallet:0,elapsed:E.CYCLE_SECONDS-1});
 s.needs={food:0,clean:0,affection:0};E.tick(s,1);assert(E.finishDueCycle(s));
 assert.equal(s.stage,1);assert(s.review);if(s.adultNotice)assert(E.acknowledgeGrowth(s));assert(E.nextCycle(s));assert(E.acknowledgeIncome(s));assert.equal(s.cycle,6);assert.equal(s.wallet,8);
 assert(E.setPlan(s,[4,0,4]));assert(E.feed(s,'apple'));
});
test('later financial recovery can grow after day 5, never an exact-day deadlock',()=>{
 const s=intro();Object.assign(s,{cycle:7,completedCycles:6,stage:0,growthPoints:3});
 assert(E.feed(s,'apple'));assert(E.transfer(s,4));end(s);assert(s.adultNotice);
 assert(E.acknowledgeGrowth(s));assert.equal(s.stage,1);assert(!s.pendingGrowth);
 s.growthPoints=9;next(s);assert(E.feed(s,'apple'));end(s);assert.equal(s.stage,2);
});
test('old adult and pending antenna saves never regress or receive migration rewards',()=>{
 const s=intro();Object.assign(s,{stage:2,cycle:6,completedCycles:5,growthPoints:undefined});
 const before=s.wallet,p=E.restore(JSON.stringify(s),s.lastSeen);assert.equal(p.stage,2);assert(p.growthPoints>=10);assert.equal(p.wallet,before);
 s.stage=0;s.pendingGrowth=true;s.review=true;const q=E.restore(JSON.stringify(s),s.lastSeen);
 assert(!q.pendingGrowth);assert.equal(q.stage,1);assert.equal(q.antennae,0);assert(q.adultNotice);assert(q.growthPoints>=4);assert(!E.nextCycle(q));assert(E.acknowledgeGrowth(q));assert(E.nextCycle(q));
});
test('legacy achievements migrate with no rewards or changed balance; initial income inserted once',()=>{
 const s=intro();startSaving(s);s.cycle=3;assert(E.buy(s,'ball'));assert(E.openDeposit(s));
 delete s.missions;s.ledger=s.ledger.filter(e=>e.source!=='initial');const before=s.wallet;
 const p=E.restore(JSON.stringify(s),s.lastSeen);assert.equal(p.wallet,before);
 for(const id of ['feed','wash','plan','goal','save','buy','deposit'])assert(p.missions[id],id);
 assert.equal(p.missions.buy.rewardPaid,0);assert.equal(p.ledger.filter(e=>e.source==='initial').length,1);
 const q=E.restore(JSON.stringify(p),p.lastSeen);assert.equal(q.wallet,before);assert.equal(q.ledger.filter(e=>e.source==='initial').length,1);
});
test('existing mission records prevent reward farming on repeated changes and reloads',()=>{
 const s=intro();assert(E.chooseGoal(s,'console'));const before=s.wallet;assert(E.chooseGoal(s,'bike'));
 assert.equal(s.wallet,before);const p=E.restore(JSON.stringify(s),s.lastSeen);assert(E.chooseGoal(p,'house'));
 assert.equal(p.wallet,before);assert.equal(p.ledger.filter(e=>e.source==='mission:goal').length,1);
});
test('ledger idempotency guard prevents duplicate rewards if a mission record is repaired',()=>{
 const s=intro();assert(E.chooseGoal(s,'console'));delete s.missions.goal;const before=s.wallet;
 assert(E.chooseGoal(s,'bike'));assert.equal(s.wallet,before);assert.equal(s.missions.goal.rewardPaid,0);
});
test('offline time applies only to active planned days and respects developer pause',()=>{
 const s=intro();end(s);if(s.adultNotice)assert(E.acknowledgeGrowth(s));assert(E.nextCycle(s));assert(E.acknowledgeIncome(s));s.lastSeen=1000;
 const unplanned=E.restore(JSON.stringify(s),100000);assert.equal(unplanned.elapsed,0);assert.equal(unplanned.needs.food,s.needs.food);
 assert(E.setPlan(unplanned,[4,0,0]));assert(!E.finishDueCycle(unplanned));
 s.plan=[4,0,0];s.speed=0;const paused=E.restore(JSON.stringify(s),100000);
 assert.equal(paused.elapsed,0);assert.equal(paused.needs.food,s.needs.food);
});
test('online and offline decay stop exactly at the end of remaining day',()=>{
 const s=intro();s.elapsed=E.CYCLE_SECONDS-1;s.speed=10;const food=s.needs.food;E.tick(s,2);
 assert.equal(s.elapsed,E.CYCLE_SECONDS);assert(Math.abs(s.needs.food-(food-.19*90/E.CYCLE_SECONDS))<1e-8);
 s.elapsed=E.CYCLE_SECONDS-1;s.lastSeen=1000;const p=E.restore(JSON.stringify(s),100000);
 assert.equal(p.elapsed,E.CYCLE_SECONDS);assert(Math.abs(p.needs.food-(s.needs.food-.19*90/E.CYCLE_SECONDS))<1e-8);
 assert(E.finishDueCycle(p));assert(!E.finishDueCycle(p));
});
test('bounded offline, backwards clock, and incomplete migration fields',()=>{
 const s=intro();s.lastSeen=1000;const p=E.restore(JSON.stringify(s),1e12);assert.equal(p.completedCycles,0);assert.equal(p.elapsed,E.CYCLE_SECONDS);
 const reverse=E.restore(JSON.stringify(s),500);assert.equal(reverse.needs.food,s.needs.food);
 delete s.periods;delete s.plans;delete s.owned;delete s.goalsWon;assert(E.restore(JSON.stringify(s),1000));
 assert.equal(E.restore('broken'),null);assert.equal(E.restore('{}'),null);
});
test('tutorial, review and unplanned day do not auto-advance',()=>{
 const s=legacyProfile();E.tick(s,2);assert.equal(s.elapsed,0);s.elapsed=90;assert(!E.finishDueCycle(s));
 s.tutorial='done';assert(!E.finishDueCycle(s));const p=intro();end(p);const food=p.needs.food;E.tick(p,2);assert.equal(p.needs.food,food);
});
test('care feedback survives reload, repeated confirmation never duplicates poop',()=>{
 const s=legacyProfile();E.meet(s);E.feed(s,'apple');const p=E.restore(JSON.stringify(s),s.lastSeen);
 assert.equal(p.tutorial,'fed');assert(E.acknowledgeCare(p));assert(!E.acknowledgeCare(p));assert.equal(p.poops.length,1);
});
test('poop positions stay unique after removal and respawn',()=>{
 const s=intro();E.spawnPoop(s);E.spawnPoop(s);E.spawnPoop(s);s.poops.splice(1,1);E.spawnPoop(s);
 assert.equal(new Set(s.poops.map(p=>p.x)).size,3);assert(s.poops.every(p=>p.x>=70));
});
test('full 6-day journey: care, chosen want, savings, locked deposit, adulthood and dream, no debug money',()=>{
 const s=intro([4,4,4]);assert(E.chooseGoal(s,'console'));
 for(let day=1;day<=6;day++){
  if(day>1)next(s,[4,4,4]);
  elapse(s,80);assert(E.feed(s,'porridge'));rainFor(s);assert(E.transfer(s,4));
  if(day===2)assert(E.buy(s,'ball'));
  if(day===3)assert(E.openDeposit(s));
  if(day===5)assert(E.collectDeposit(s));
  if(day===6)assert(E.claimGoal(s));
  end(s);conserved(s);
 }
 assert.equal(s.stage,2);assert(s.goalsWon.includes('console'));assert.equal(s.deposit,null);assert.equal(s.tasks.length,0);
 assert.equal(s.savings,0);assert.equal(s.periods.length,6);
 for(const m of E.MISSIONS)assert(s.missions[m.id],m.id);
});
test('finished report is financially closed: deposit cannot be collected into yesterday',()=>{
 const s=intro();startSaving(s);s.cycle=3;assert(E.openDeposit(s));s.completedCycles=2;end(s);
 const snapshot=JSON.stringify(E.cycleSummary(s));assert(!E.collectDeposit(s));if(s.adultNotice)assert(E.acknowledgeGrowth(s));assert(E.nextCycle(s));assert(E.acknowledgeIncome(s));
 assert(!E.collectDeposit(s));assert(E.setPlan(s,[4,4,4]));assert(E.collectDeposit(s));
 assert.equal(JSON.stringify(E.cycleSummary(s,3)),snapshot);
});
test('40 deterministic mixed journeys keep every coin accounted for across 6 days and reloads',()=>{
 for(let seed=1;seed<=40;seed++){
  let state=seed,s=intro();const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  for(let day=1;day<=6;day++){
   if(day>1){if(s.adultNotice)assert(E.acknowledgeGrowth(s));assert(E.nextCycle(s));assert(E.acknowledgeIncome(s));assert(E.setPlan(s,[Math.min(4,s.wallet),0,0]));}
   for(let turn=0;turn<40;turn++){
    const amount=1+Math.floor(random()*5);
    switch(Math.floor(random()*9)){
     case 0:E.feed(s,E.FOOD[Math.floor(random()*4)].id);break;
     case 1:E.rain(s,.1,51,{spent:0});break;
     case 2:E.transfer(s,amount);break;
     case 3:E.transfer(s,-amount);break;
     case 4:E.buy(s,E.ITEMS[Math.floor(random()*E.ITEMS.length)].id);break;
     case 5:E.chooseGoal(s,E.GOALS[Math.floor(random()*3)].id);break;
     case 6:E.openDeposit(s);break;
     case 7:E.collectDeposit(s);break;
     case 8:E.claimGoal(s);break;
    }
    E.tick(s,1);conserved(s);
    if(turn===20){s=E.restore(JSON.stringify(s),s.lastSeen);assert(s);conserved(s);}
   }
   end(s);conserved(s);assert(s.growthPoints>=0);assert.equal(s.periods.length,day);
  }
 }
});
test('legacy fractional pockets round up with explicit compensation, no historical edits',()=>{
 const s=intro();assert(E.chooseGoal(s,'console'));assert(E.transfer(s,1));
 // Model a genuine old fractional income and transfer, keeping accounts balanced.
 s.wallet+=.5;E.record(s,'income',.5,'Старый доход');s.wallet-=.25;s.savings+=.25;E.record(s,'transfer',.25,'Копилка');
 const oldWallet=s.wallet,oldSavings=s.savings,oldLedger=JSON.stringify(s.ledger),oldPlans=JSON.stringify(s.plans);
 s.periods=[{cycle:0,walletEnd:28.5,plan:[4,4,20.5]}];const oldHistory=JSON.stringify(s.periods);
 const p=E.restore(JSON.stringify(s),s.lastSeen);
 assert.equal(p.wallet,Math.ceil(oldWallet));assert.equal(p.savings,Math.ceil(oldSavings));
 assert.equal(JSON.stringify(p.ledger.slice(0,s.ledger.length)),oldLedger);
 assert.equal(JSON.stringify(p.plans),oldPlans);assert.equal(JSON.stringify(p.periods),oldHistory);
 const credits=p.ledger.filter(e=>e.source==='migration-rounding');assert.equal(credits.length,2);
 assert(credits.every(e=>e.kind==='income'&&e.cycle===0&&e.amount>0));
 assert.equal(credits.find(e=>e.pocket==='wallet').amount,Math.ceil(oldWallet)-oldWallet);
 assert.equal(credits.find(e=>e.pocket==='savings').amount,Math.ceil(oldSavings)-oldSavings);
 assert(p.migrationNotice);assert.deepEqual(p.migrationRounding,{wallet:.75,savings:.75});conserved(p);
});
test('28.5 legacy wallet can confirm the entire integer plan after migration',()=>{
 const s=intro();s.wallet=28.5;s.plan=null;s.cycle=3;
 const p=E.restore(JSON.stringify(s),s.lastSeen);assert.equal(p.wallet,29);
 assert(E.setPlan(p,[4,4,21]));assert.deepEqual(p.plan,[4,4,21]);
 assert.equal(p.ledger.filter(e=>e.source==='migration-rounding').length,1);
 assert.equal(p.ledger.find(e=>e.source==='migration-rounding').amount,.5);
});
test('rounding credit is idempotent and dismissed notice stays dismissed after reload',()=>{
 const s=intro();s.wallet=28.5;s.savings=.5;
 const p=E.restore(JSON.stringify(s),s.lastSeen),balance=p.wallet,ledger=JSON.stringify(p.ledger);
 delete p.migrationNotice;
 const q=E.restore(JSON.stringify(p),p.lastSeen);assert.equal(q.wallet,balance);assert.equal(q.savings,1);
 assert.equal(JSON.stringify(q.ledger),ledger);assert(!q.migrationNotice);
 assert.deepEqual(q.migrationRounding,{wallet:.5,savings:.5});
});
test('old fractional deposit bonus pays an integer once without rewriting principal',()=>{
 const s=intro();s.wallet-=10;s.deposit={principal:10,bonus:1.5,due:0};E.record(s,'bank-in',10,'Вклад');
 const before=s.wallet;assert(E.collectDeposit(s));assert.equal(s.wallet,before+12);assert(!E.collectDeposit(s));
 assert.equal(s.ledger.at(-2).amount,10);assert.equal(s.ledger.at(-1).amount,2);conserved(s);
});
test('fractional old principal remains exact in ledger; total payout and future wallet are whole',()=>{
 const s=intro();s.wallet-=10.5;s.deposit={principal:10.5,bonus:1.25,due:0};E.record(s,'bank-in',10.5,'Вклад');
 const p=E.restore(JSON.stringify(s),s.lastSeen),before=p.wallet;assert(E.collectDeposit(p));
 assert.equal(p.wallet,before+12);assert.equal(p.ledger.at(-2).amount,10.5);assert.equal(p.ledger.at(-1).amount,1.5);
 conserved(p);assert(!E.collectDeposit(p));
});
test('data-only custom mission validates event, target, amount and day; rewards once',()=>{
 const catalog=[{id:'save-five',title:'Отложи 5',icon:'jar',theme:'Накопления',action:'goal',after:[],day:1,reward:2,
  criterion:{event:'transferred',target:['savings'],minAmount:5,maxAmount:10,minDay:2,maxDay:3}}];
 const s=intro(),balance=s.wallet;
 assert.deepEqual(E.applyMissionEvent(s,'transferred',{target:'savings',amount:5},catalog),[]);
 s.cycle=2;
 for(const context of [{target:'wallet',amount:5},{target:'savings',amount:4},{target:'savings',amount:11},{target:'savings',amount:-5},{target:'savings',amount:NaN}])
  assert.deepEqual(E.applyMissionEvent(s,'transferred',context,catalog),[]);
 assert.deepEqual(E.applyMissionEvent(s,'goal-selected',{target:'savings',amount:5},catalog),[]);
 s.cycle=4;assert.deepEqual(E.applyMissionEvent(s,'transferred',{target:'savings',amount:5},catalog),[]);
 assert.equal(s.wallet,balance);assert(!s.missions['save-five']);s.cycle=2;
 assert.deepEqual(E.applyMissionEvent(s,'transferred',{target:'savings',amount:5},catalog),['save-five']);
 assert.equal(s.wallet,balance+2);assert.equal(s.missions['save-five'].rewardPaid,2);
 assert.deepEqual(E.applyMissionEvent(s,'transferred',{target:'savings',amount:5},catalog),[]);
 const p=E.restore(JSON.stringify(s),s.lastSeen);
 assert.deepEqual(E.applyMissionEvent(p,'transferred',{target:'savings',amount:5},catalog),[]);
 assert.equal(p.wallet,balance+2);assert.equal(p.ledger.filter(e=>e.source==='mission:save-five').length,1);
});
test('adding a food mission to catalog works through unchanged engine actions, never a failed purchase',()=>{
 const extra={id:'try-soup',title:'Попробуй суп',icon:'soup',theme:'Покупки',action:'food',after:[],day:1,reward:2,
  description:'Купи суп за 4 штучки.',lesson:'Суп помогает насытиться.',criterion:{event:'fed',target:'soup',free:false,minAmount:4}};
 E.MISSIONS.push(extra);
 try{
  const s=intro();assert(!s.missions['try-soup']);assert(E.chooseGoal(s,'console'));
  assert(E.transfer(s,21));assert(E.transfer(s,2));assert.equal(s.wallet,3);
  assert(!E.feed(s,'soup'));assert(!s.missions['try-soup']);
  assert(E.feed(s,'apple'));assert(!s.missions['try-soup']);assert(E.transfer(s,-1));elapse(s,2);
  const before=s.wallet;assert(E.feed(s,'soup'));assert.equal(s.wallet,before-4+2);
  assert.equal(s.missions['try-soup'].rewardPaid,2);assert(E.transfer(s,-2));elapse(s,10);
  const again=s.wallet;assert(E.feed(s,'soup'));assert.equal(s.wallet,again-4);
  assert.equal(s.ledger.filter(e=>e.source==='mission:try-soup').length,1);conserved(s);
 }finally{E.MISSIONS.splice(E.MISSIONS.indexOf(extra),1);}
});
test('all current real-action missions declare data-driven criteria while legacy quizzes remain separate',()=>{
 for(const m of E.MISSIONS)assert.equal(typeof m.criterion?.event,'string',m.id);
 const s=intro();assert(s.missions.feed&&s.missions.wash&&s.missions.plan);
 assert.equal(s.tasks.length,0);assert.equal(E.MISSIONS.filter(m=>m.reward===2).length,6);
});

test('simple catalog retains legacy foods and exposes eight purchase positions with six distinct wants',()=>{
 assert.equal(E.FOOD.length,4);assert.deepEqual(E.FOOD[0],{id:'apple',name:'Яблоко',price:2,gain:40});
 assert.equal(E.ITEMS.length+2,8);assert.equal(new Set(E.ITEMS.map(x=>x.id)).size,6);
 assert.deepEqual(E.ITEMS.slice(-2).map(({id,name,price})=>({id,name,price})),[{id:'drum',name:'Ретро-приставка',price:12},{id:'telescope',name:'Фотик',price:16}]);
 const s=paidPlanned();E.meet(s);assert(E.feed(s,'apple'));assert.equal(s.needs.food,65);
 assert.equal(s.wallet,18);assert.equal(s.missions.feed.rewardPaid,0);
});

test('every want is purchasable on day one after the plan, never before or twice',()=>{
 for(const item of E.ITEMS){
  const s=paidIntro(),before=s.wallet;assert.equal(s.cycle,1);assert(E.buy(s,item.id),item.id);
  assert.equal(s.wallet,before-item.price+2);assert.deepEqual(s.owned,[item.id]);
  assert.equal(s.missions.buy.rewardPaid,2);const ledger=JSON.stringify(s.ledger),wallet=s.wallet;
  assert(!E.buy(s,item.id));assert.equal(s.wallet,wallet);assert.equal(JSON.stringify(s.ledger),ledger);conserved(s);
  const pending=paidPlanned();assert(!E.buy(pending,item.id));assert.equal(pending.owned.length,0);
 }
});

test('all six unaffordable wants preserve money, inventory, missions and ledger exactly',()=>{
 for(const item of E.ITEMS){
  const s=paidIntro();s.wallet=item.price-1;
  const before=JSON.stringify(s);assert(!E.buy(s,item.id),item.id);assert.equal(JSON.stringify(s),before);
 }
});

test('food upgrade does not retroactively heal a saved pet or rewrite financial history',()=>{
 const s=paidIntro();s.needs.food=45;const needs={...s.needs},wallet=s.wallet,ledger=JSON.stringify(s.ledger),plans=JSON.stringify(s.plans);
 const p=E.restore(JSON.stringify(s),s.lastSeen);assert.deepEqual(p.needs,needs);assert.equal(p.wallet,wallet);
 assert.equal(JSON.stringify(p.ledger),ledger);assert.equal(JSON.stringify(p.plans),plans);
 assert(E.feed(p,'apple'));assert.equal(p.needs.food,85);assert.equal(p.wallet,wallet-2+2);conserved(p);
});

test('deposit funding recommends preserving care but does not prohibit a deliberate choice',()=>{
 assert.equal(E.depositFunding({wallet:14,savings:10}),'wallet');
 assert.equal(E.depositFunding({wallet:4,savings:10}),'savings');
 assert.equal(E.depositFunding({wallet:13,savings:9}),'wallet');
 assert.equal(E.depositFunding({wallet:3,savings:100}),'savings');
 assert.equal(E.depositFunding({wallet:0,savings:0}),null);
});

function savingsFundedDepositProfile(){
 const s=paidIntro();assert(E.chooseGoal(s,'console'));assert(E.transfer(s,10));
 end(s);next(s,[4,0,0]);end(s);next(s,[4,0,0]);assert(E.transfer(s,s.wallet-4));return s;
}

test('explicit savings-funded deposit is atomic, conserves funds and lowers visible goal savings',()=>{
 const s=savingsFundedDepositProfile(),wallet=s.wallet,savings=s.savings,start=s.ledger.length;
 const actualBefore=E.cycleSummary(s).actual.savings,growthBefore=E.cycleSummary(s).growthGained;
 assert(E.openDeposit(s,'savings'));assert.equal(s.wallet,wallet);assert.equal(s.savings,savings-10);
 assert.equal(s.deposit.principal,10);assert.equal(s.deposit.bonus,5);
 assert.deepEqual(s.ledger.slice(start).map(e=>[e.kind,e.amount]),[['transfer',-10],['bank-in',10]]);
 assert.equal(E.cycleSummary(s).actual.savings,actualBefore);assert.equal(E.cycleSummary(s).growthGained,growthBefore);
 assert.equal(E.cycleSummary(s).income,E.totals(s).income);conserved(s);
 const after=JSON.stringify(s);assert(!E.openDeposit(s,'savings'));assert(!E.openDeposit(s,'wallet'));assert.equal(JSON.stringify(s),after);
 const restored=E.restore(after,s.lastSeen);assert.equal(restored.wallet,wallet);assert.equal(restored.savings,savings-10);
 assert.deepEqual(restored.deposit,s.deposit);assert.deepEqual(restored.ledger,s.ledger);conserved(restored);
});

test('savings-funded deposit refuses insufficient funds, missing consent source or blocked progression without mutation',()=>{
 for(const patch of [{savings:9},{cycle:2},{plan:null},{review:true},{pendingGrowth:true},{pendingIncome:{amount:8}},{pendingReward:{amount:2}},{tutorial:'wash'},{missions:{}}]){
  const s=savingsFundedDepositProfile();Object.assign(s,patch);const before=JSON.stringify(s);
  assert(!E.openDeposit(s,'savings'),JSON.stringify(patch));assert.equal(JSON.stringify(s),before);
 }
 const s=savingsFundedDepositProfile();s.wallet=4;const before=JSON.stringify(s);
 assert(!E.openDeposit(s));assert(!E.openDeposit(s,'invalid'));assert.equal(JSON.stringify(s),before);
 assert.equal(E.depositFunding(s),'savings');assert(E.openDeposit(s,'savings'));
});

test('savings-funded deposit uses the one-period lock and returns principal plus five once',()=>{
 const s=savingsFundedDepositProfile();assert.equal(s.wallet,4);const savings=s.savings;
 assert(E.openDeposit(s,'savings'));assert(!E.collectDeposit(s));end(s);next(s,[4,0,0]);
 const wallet=s.wallet;assert(E.collectDeposit(s));
 assert.equal(s.wallet,wallet+15);assert.equal(s.savings,savings-10);assert(!E.collectDeposit(s));
 assert.deepEqual(s.ledger.slice(-2).map(e=>[e.kind,e.amount]),[['bank-out',10],['income',5]]);conserved(s);
});

test('planned saving reserves only unpaid care: food already bought releases its two coins',()=>{
 const s=intro([4,0,12]);s.missions['paid-food']={cycle:1,rewardPaid:0};
 // Place the remaining coins in savings outside this period, as existing wealth.
 const excess=s.wallet-16;s.wallet-=excess;s.savings+=excess;s.ledger.push({cycle:0,kind:'transfer',amount:excess,label:'Старые накопления'});
 assert.equal(s.wallet,16);assert.equal(E.plannedSavingsAmount(s),12);
 assert(E.feed(s,'apple'));assert.equal(s.wallet,14);const before=JSON.stringify(s);
 assert.equal(E.plannedSavingsAmount(s),12);assert.equal(JSON.stringify(s),before);
 assert(E.transfer(s,12));assert.equal(E.plannedSavingsAmount(s),0);conserved(s);
});

test('planned saving protects unspent wants and releases reserve after an actual want purchase',()=>{
 const s=intro([4,6,10]);s.wallet=18;
 assert.equal(E.plannedSavingsAmount(s),8);
 s.missions.buy={cycle:1,rewardPaid:0};assert(E.buy(s,'comic'));
 assert.equal(s.wallet,12);assert.equal(E.cycleSummary(s).actual.wants,6);
 assert.equal(E.plannedSavingsAmount(s),8);
 s.wallet=16;assert.equal(E.plannedSavingsAmount(s),10);
});

test('planned saving treats bank reallocation as neutral and uses net real transfers',()=>{
 const s=savingsFundedDepositProfile();
 s.plan=[4,0,8];s.plans.at(-1).parts=[4,0,8];
 // The current period already saved more than eight; opening a bank is not another saving.
 assert.equal(E.plannedSavingsAmount(s),0);const saved=E.cycleSummary(s).actual.savings;
 assert(E.openDeposit(s,'savings'));assert.equal(E.cycleSummary(s).actual.savings,saved);assert.equal(E.plannedSavingsAmount(s),0);conserved(s);
 const t=intro([4,0,12]);t.savings=10;t.wallet=20;t.cycle=3;t.plans=[{cycle:3,parts:[4,0,12],wallet:20}];
 t.missions.save={cycle:1,rewardPaid:0};t.missions.goal={cycle:1,rewardPaid:0};
 const quote=E.plannedSavingsAmount(t);assert(E.openDeposit(t,'savings'));
 assert.equal(E.cycleSummary(t).actual.savings,0);assert.equal(E.plannedSavingsAmount(t),quote);
});

test('planned saving sanitizes malformed wallets and never mutates a quote or exceeds an integer wallet',()=>{
 const s=intro([4,0,12]);
 for(const wallet of [NaN,Infinity,-4,'20',undefined]){s.wallet=wallet;assert.equal(E.plannedSavingsAmount(s),0);}
 s.wallet=10.9;assert.equal(E.plannedSavingsAmount(s),6);
 s.plan=null;assert.equal(E.plannedSavingsAmount(s),0);
 s.plan=[4,0];assert.equal(E.plannedSavingsAmount(s),0);
});
