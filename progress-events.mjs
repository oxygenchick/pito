// One important event at a time, before ordinary panels and gameplay.
export function progressEvent(s){
 if(!s)return null;
 if(s.tutorial==='money')return 'money-intro';
 if(s.pendingIncome)return 'income-event';
 if(s.pendingReward)return 'reward-event';
 if(s.pendingPurchase)return 'purchase-event';
 if(s.pendingGrowth||s.adultNotice)return 'grown-event';
 return null;
}
