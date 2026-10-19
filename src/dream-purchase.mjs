import {GOALS} from './item-catalog.mjs';
import {art} from './visuals.mjs';

const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** Purchase is already recorded by the engine; this screen only celebrates it. */
export function dreamPurchaseView(s) {
 const purchase=s.pendingPurchase;
 const item=GOALS.find(goal=>goal.id===purchase?.id);
 if(!purchase?.dream||!item)return null;
 const body=`<div class="revision-overlay rv-choose-dream rv-dream-success" data-dream-success="true"><section class="rv-dream-hero"><div class="rv-dream-carousel"><div class="rv-dream-picture">${art(item.id,'art')}</div></div><h3>${escape(item.name)}</h3></section></div>`;
 return {title:'Мечта сбылась!',body,footer:'<button class="btn primary wide" data-act="purchase-continue">Йу-ху!</button>',closable:false};
}
