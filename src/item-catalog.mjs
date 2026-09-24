// Save IDs remain stable: purchased slots and active savings keep their progress.
// Display names and art below are the current catalogue, not the legacy objects.
export const ITEMS = [
 {id:'ball',art:'bubble-tea',name:'Бабл-ти',price:4,description:'Чай с шариками и любимая толстая трубочка. Красивый стаканчик останется в коллекции Пито.',reaction:'Буль-буль!',motion:'bounce'},
 {id:'comic',art:'board-game',name:'Настолка',price:6,description:'Бросаем кубик и отправляемся в приключение. Пито уже выбрал себе фишку!',reaction:'Твой ход!',motion:'bounce'},
 {id:'puzzle',art:'tshirt',name:'Футболка',price:8,description:'Крутой принт с пришельцем. Пито уже придумывает новые образы.',reaction:'Вот это принт!',motion:'bounce'},
 {id:'kite',art:'sneakers',name:'Кроссовки',price:10,description:'Яркая пара для будущих прогулок. Пригодится для прогулок по планете.',reaction:'Готовы к прогулке!',motion:'bounce'},
 {id:'drum',art:'handheld',name:'Ретро-приставка',price:12,description:'Маленькая портативка с пиксельными играми. Герои старых игр теперь всегда под рукой у Пито.',reaction:'Новый рекорд!',motion:'bounce'},
 {id:'telescope',art:'instant-camera',name:'Фотик',price:16,description:'Нажимаешь кнопку, и сразу появляется снимок. Сохраним лучшие моменты на лужайке!',reaction:'Улыбнись!',motion:'bounce'}
];
export const GOALS = [
 {id:'console',art:'console',name:'Приставка',price:24,description:'Домашняя приставка для любимых игр. Устроим игровой вечер с Пито!',reaction:'Берём второй геймпад!',motion:'bounce'},
 {id:'bike',art:'gift-card',name:'Мега шопинг',price:32,description:'Подарочная карта для большой прогулки по магазинам. Пито уже составляет список покупок.',reaction:'Выбираем самое классное!',motion:'bounce'},
 {id:'house',art:'anime-figure',name:'Аниме фигурка',price:40,description:'Фигурка космического героя. Она займёт почётное место в коллекции Пито.',reaction:'Вот это находка!',motion:'bounce'},
 {id:'phone',art:'phone',name:'Телефон',price:48,description:'Снимать видео, слушать музыку и звонить друзьям. Всё в одном кармане!',reaction:'Алло, это Пито!',motion:'bounce'},
 {id:'guitar',art:'guitar',name:'Электрогитара',price:56,description:'Для первой группы Пито. Осталось придумать название и разучить любимую мелодию.',reaction:'Устроим концерт!',motion:'bounce'}
];
export const ITEM_ART=Object.fromEntries([...ITEMS,...GOALS].map(item=>[item.id,item.art]));
const oldNames=['Мяч','Комикс','Головоломка','Воздушный змей','Барабан','Телескоп','Приставка','Велосипед','Домик на дереве'];
export const LEGACY_ITEM_NAMES=Object.fromEntries(oldNames.map((name,i)=>[name,[...ITEMS,...GOALS][i].name]));
