// Planning changes intentions only. No wallet, purchases or missions are mutated.
export function resizeAllocation(parts,index,requested,total) {
 const next=[...parts];
 if(!Number.isInteger(index)||index<0||index>2||!Number.isFinite(requested))return next;
 const available=Math.max(0,Math.floor(total-next.reduce((sum,n,i)=>sum+(i===index?0:n),0)));
 next[index]=Math.max(0,Math.min(available,Math.round(requested)));
 return next;
}

export function planningFunds(s) {
 const income=s.ledger.filter(e=>e.cycle===s.cycle&&e.kind==='income').reduce((sum,e)=>sum+e.amount,0);
 const spent=s.ledger.filter(e=>e.cycle===s.cycle&&e.kind==='expense').reduce((sum,e)=>sum+e.amount,0);
 return {income,carried:Math.max(0,s.wallet+spent-income),total:s.wallet,...(spent>0?{spent}:{})};
}
