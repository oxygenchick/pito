// Fixed world coordinates for approved concept B. x/bottom are scene percentages;
// width/height are in scene-width units, independent of viewport and purchase order.
// Technical item IDs are retained for existing saves.
export const COLLECTION_PLACES = Object.freeze({
 console: {x:12,width:20,height:11,bottom:53.1,support:'left-upper',place:'на верхнем каменном выступе слева'},
 bike: {x:28,width:12,height:10,bottom:53.3,support:'left-upper',place:'на верхнем каменном выступе слева'},
 house: {x:9,width:12,height:19,bottom:41.2,support:'left-lower',place:'на нижнем каменном выступе слева'},
 phone: {x:23,width:8,height:13,bottom:40.7,support:'left-lower',place:'на нижнем каменном выступе слева'},
 telescope: {x:77,width:12,height:16,bottom:46.9,support:'right',place:'на каменном выступе справа'},
 comic: {x:91,width:16,height:15,bottom:46.9,support:'right',place:'на каменном выступе справа'},
 puzzle: {x:14,width:22,height:21,bottom:25.9,support:'ground',place:'у камня слева от Пито'},
 kite: {x:21,width:24,height:15,bottom:22.3,support:'ground',place:'на земле слева от Пито'},
 ball: {x:33,width:7,height:11,bottom:24.9,support:'ground',place:'слева возле Пито'},
 drum: {x:72,width:12,height:8,bottom:28.4,support:'pebble',place:'на маленьком камне справа от Пито'},
 guitar: {x:86,width:27,height:38,bottom:23.8,support:'ground',place:'у камня справа от Пито'}
});
export function ownedPlaces(profile) {
 const owned=new Set([...profile.owned,...profile.goalsWon]);
 return Object.entries(COLLECTION_PLACES).filter(([id])=>owned.has(id));
}
