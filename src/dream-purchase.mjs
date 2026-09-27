import {GOALS} from './item-catalog.mjs';
import {art,icon} from './visuals.mjs';

const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** Purchase is already recorded by the engine; this screen only celebrates it. */
export function dreamPurchaseView(s) {
 const purchase=s.pendingPurchase;
 const item=GOALS.find(goal=>goal.id===purchase?.id);
 if(!purchase?.dream||!item)return null;
 const reward=Number(purchase.reward);
 const rewardCopy=Number.isFinite(reward)&&reward>0?`<p class="sv-win-reward">За задание +<span class="coin">${icon('coin')}<span>${escape(reward)}</span></span></p>`:'';
 const body=`<div class="savings-screen ss-dream-win" data-dream-success="true"><section class="sv-hero"><div class="sv-win-picture"><img class="sv-win-decor left" src="assets/finance-polish/confetti.png" alt="">${art(item.id,'sv-win-art')}<img class="sv-win-decor right" src="assets/finance-polish/confetti.png" alt=""></div><h3 class="sv-goal-name">${escape(item.name)}</h3></section><div class="sv-win-message">${icon('check')}<span>Ты накопил на мечту!</span></div><p class="sv-win-place">Новая вещь ждёт на лужайке.</p>${rewardCopy}</div>`;
 return {title:'Мечта сбылась!',body,footer:'<button class="btn primary wide" data-act="purchase-continue">К новой вещи</button>',closable:false};
}
