// Calibrated against assets/ui-v6/meadow.png at the fixed 9:16 game ratio.
// The horizon is a curved hill, not a horizontal floor. Wide objects use their
// lowest supporting edge so neither shelf foot floats above the grass.
export function groundBottom(x, halfWidth=0) {
 const center=Number.isFinite(Number(x))?Number(x):50;
 const width=Number.isFinite(Number(halfWidth))?Math.max(0,Number(halfWidth)):0;
 const edge=Math.min(50,Math.abs(center-50)+width)/50;
 return 27.6-4.4*edge*edge;
}
