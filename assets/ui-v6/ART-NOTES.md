# Рисованная графика Pita v6

Дата: 2026-09-24. Генерация через встроенный инструмент imagegen с локальным стилевым референсом `ui concept reference.png`. Точный идентификатор модели инструмент не сообщает; не подставляем выдуманный. Оригиналы сохранены в `.codex/generated_images/01a0a7fa-c2c3-7932-83a5-292be7f5427c` и скопированы сюда. Условия лицензирования перед конкурсной сдачей проверить отдельно.

## Что находится в папке

- `panels-source.png`: исходный атлас 1536×1024, 3×2. Из него — `panel-cream`, `button-purple`, `button-round`, три `tile-*`.
- `objects-source.png`: такой же атлас: `care-basket`, `toy-box`, `jar`, `cloud`, `drum`, `telescope`.
- `apple-source.png`, `apple.png`: отдельная генерация яблока, затем обрезка прозрачных полей. Заменяет старое яблоко с заметной прямоугольной подложкой.
- `meadow.png`: самостоятельный портретный фон, исходные размеры генератора сохранены. В интерфейсе `background-size:cover`; нет непропорционального растягивания.
- `sprite-manifest.json`: размеры и проверенные диапазоны альфа-канала отдельных PNG.

Всего 13 прозрачных спрайтов и один фон. Исходники не перезаписаны. `slice-ui-art.mjs` механически извлекает ячейки и обрезает прозрачные поля, не перерисовывает графику. Текст не запечён в спрайты. Панели/основные кнопки используют 9-slice, остальные изображения — contain.

## Брифы генерации

Первые два запроса были production-атласами: ровно шесть непересекающихся элементов, сетка 3×2, настоящая прозрачность, свободные поля, без букв, подписей, персонажей и интерфейсных макетов. Стиль — мягкая гуашь, бумажные формы, спокойные кремовые/лиловые/мятные цвета по приложенному референсу. Панели: большие ровные середины для 9-slice. Предметы: корзина яблоко/вода, деревянный ящик игрушек, голубая стеклянная копилка с монетками, облако, барабан и телескоп. Это краткие брифы двух атласов, а не дословная стенограмма запросов.

### Meadow — запрос

Create ONE production-ready background painting for a portrait 2D children's pet game, inspired by the attached art reference. Output portrait 9:16 approximately 1080x1920, keep natural circles, no interface, NO characters, NO text, NO coins, NO objects in middle. This is ONLY an empty softly painted meadow environment to layer live pet and buttons over. Friendly hand-painted gouache, paper cutout shapes, creamy pastel blue sky upper 70%, muted lavender rolling hills mostly below y=58%, sage green foreground meadow starts with softly curved horizon at y=71% and fills lower29%. Pet's feet will be at x50%,y74%; leave central rectangle x20%-80%, y25%-83% perfectly uncluttered for pet. Tiny yellow-white daisy at x8%,y86% and x91%,y92%, one small bush at farleft bottom. Two tiny offwhite clouds at edges x6%,y32% and x91%,y45%. Flat Japanese playful LocoRoco/Pikuniku feeling, calm charming paper texture, minimal shapes. Subtle grain uniform across picture. No hard shadows, no 3D, no photo, no gradient UI, no frame, no panels, no checkerboard. Match reference's warm hand-painted pigments, but much quieter empty composition, absolutely no pet or eyes.

### Apple — запрос

Single transparent PNG game sprite: ONE simple juicy red apple with one short brown stem and one sage-green leaf. Friendly hand-painted gouache and flat cut-paper texture matching reference palette, soft irregular contour, no face, no eyes, no text, no shadow, no ground, no square behind it, no frame, no other objects. Centered apple fills 75% of canvas, entire outline visible with generous transparent margin. Pure clean genuine transparent background alpha. Production icon for a children's 2D pet game; readable at 48px. Not 3D. Not photographic. Gentle pigment texture only inside the apple.

## Проверка

Прозрачность PNG проверена по метаданным и в браузере на реальной подложке. У атласов alpha 0…254, у яблока 0…255. Большое облако получило отдельное положение кольца чистоты, чтобы не перекрывать его. Панели и основные экраны проверяются в 360×640; окончательная проверка реальных мобильных устройств — отдельный этап.
