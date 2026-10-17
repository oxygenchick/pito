import {CYCLE_SECONDS} from './engine.mjs';
export const DAY_PHASES=['morning','day','afternoon','evening','twilight','night'];
export function dayPhase(s){return s.review?'morning':DAY_PHASES[Math.min(DAY_PHASES.length-1,Math.max(0,Math.floor((s.elapsed||0)/CYCLE_SECONDS*DAY_PHASES.length)))];}
export function nightBeat(seconds){return seconds<1.8?'sleep':seconds<3?'wake':'done';}
export const dayArtPath=phase=>phase==='day'?'assets/location-v15/planet-platforms.png':`assets/daylight-v3/${phase}.webp`;
export const sleepMarks=()=>`<span class="sleep-marks" aria-hidden="true">${[0,1,2].map(i=>`<img src="assets/daylight-v3/sleep-z.svg" alt="" style="--i:${i}">`).join('')}</span>`;
