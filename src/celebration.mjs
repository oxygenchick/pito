// Decorative only: achievements and their rewards remain in the engine.
const seen = new WeakMap();
export function celebrationKey(profile, modal, successfulPlan = false) {
 if (!profile) return null;
 if (modal === 'grown-event') return `growth:${profile.stage}`;
 if (modal === 'purchase-event' && profile.pendingPurchase?.dream) return `dream:${profile.pendingPurchase.id}`;
 if (modal === 'review' && successfulPlan) return `plan:${profile.cycle}`;
 return null;
}
export function celebrate(root, profile, modal) {
 const key = celebrationKey(profile, modal, !!root.querySelector('[data-plan-success="true"]'));
 if (!key) { root.querySelector('.achievement-confetti')?.remove(); return; }
 const history = seen.get(profile) || new Set();
 if (history.has(key)) return;
 history.add(key); seen.set(profile, history);
 if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 root.querySelector('.achievement-confetti')?.remove();
 const layer = document.createElement('div');
 layer.className = 'achievement-confetti'; layer.setAttribute('aria-hidden', 'true');
 const {width, height} = root.getBoundingClientRect();
 for (let i = 0; i < 28; i++) {
  const side = i % 2, lane = Math.floor(i / 2), piece = document.createElement('img');
  piece.src = `assets/celebration/confetti-${i % 6}.png`;
  piece.alt = ''; piece.draggable = false;
  piece.style.left = (side ? width - 12 : 12) + 'px';
  piece.style.top = height * .73 + 'px';
  piece.style.width = (14 + i % 4 * 3) + 'px';
  layer.append(piece);
  const direction = side ? -1 : 1;
  const distance = width * (.16 + (lane % 7) * .075);
  const peak = height * (.43 + (lane % 5) * .065);
  piece.animate([
   {transform:'translate(-50%,0) rotate(0deg)',opacity:0},
   {transform:`translate(${direction * distance * .55}px,${-peak * .8}px) rotate(${direction * 110}deg)`,opacity:1,offset:.22},
   {transform:`translate(${direction * distance}px,${-peak}px) rotate(${direction * 230}deg)`,opacity:1,offset:.43},
   {transform:`translate(${direction * distance * 1.18}px,${height * .27}px) rotate(${direction * 440}deg)`,opacity:0}
  ],{duration:2200 + i % 5 * 90,delay:lane % 4 * 45,easing:'linear',fill:'both'});
 }
 root.append(layer);
 setTimeout(() => layer.remove(), 2800);
}
