// Introduce one new mechanic between the first and second dream.
// Existing deposits and previously learned banking remain accessible.
export function bankAvailable(s){
 if(s.deposit||s.missions?.deposit||s.ledger?.some(e=>e.kind==='bank-in'))return true;
 const learnedSaving=s.missions?.goal&&(s.missions?.save||s.ledger?.some(e=>e.kind==='transfer'&&e.amount>0));
 if(s.tutorial!=='done'||s.cycle<3||!learnedSaving)return false;
 if(s.onboarding?.version!==2)return true;
 return (s.goalsWon||[]).length>0&&!(s.goalsWon||[]).includes(s.goal);
}
