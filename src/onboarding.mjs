// Timed beats count visible, unblocked play time only, not offline time or ×10.
export const INTRO_WAITS = {money:12,food:10,shop:12,goal:15,plan:12};
export const pacedIntro = s => s?.onboarding?.version===2 && !s.plan && !s.plans?.length && s.cycle===1;
export const beforeMoney = s => pacedIntro(s)&&!s.initialMoneyGranted;
export const calmIntro = s => pacedIntro(s)&&s.onboarding.revision===3;
export const freeCare = s => calmIntro(s)&&!s.initialMoneyGranted;
export const giftItem = s => freeCare(s)&&s.onboarding.phase==='shop'&&!s.owned.length;
export const introPhase = s => pacedIntro(s)?s.onboarding.phase:null;
export const introShop = s => ['shop','item-play','goal-wait','goal','plan-wait','plan'].includes(introPhase(s));
export const introGoal = s => ['goal','plan-wait','plan'].includes(introPhase(s));
export const introPaidCare = s => pacedIntro(s)&&(s.initialMoneyGranted||freeCare(s))&&s.tutorial==='done'&&s.onboarding.phase!=='food-wait';
export function waitForIntro(s,next){if(!pacedIntro(s))return;s.onboarding.phase=next+'-wait';s.onboarding.remaining=INTRO_WAITS[next];}
export function tickIntro(s,dt){
 if(!pacedIntro(s)||!Number.isFinite(dt)||dt<=0||s.speed===0||s.pendingIncome||s.pendingReward||s.pendingPurchase)return false;
 const phase=s.onboarding.phase;
 if(!phase.endsWith('-wait'))return false;
 s.onboarding.remaining=Math.max(0,s.onboarding.remaining-Math.min(dt,2));
 if(s.onboarding.remaining>0)return false;
 const next=phase.slice(0,-5);s.onboarding.phase=next;
 if(next==='money')s.tutorial='money';
 if(next==='food'){s.onboarding.phase='paid-food';s.needs.food=Math.min(s.needs.food,35);}
 if(next==='plan')s.tutorial='plan';
 return true;
}
export function introMission(s){
 if(!pacedIntro(s))return undefined;
 return ({food:'feed',fed:'feed',wash:'wash',washed:'wash',plan:'plan'})[s.tutorial] || ({plan:'plan',pet:'intro-pet','item-play':'intro-play','paid-food':'paid-food',shop:'buy',goal:'goal'})[s.onboarding.phase] || null;
}
