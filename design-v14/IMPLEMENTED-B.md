# Реализация варианта B

Дата: 2026-09-24. Веб-прототип, не Unity.

- Каменные выступы входят в статичную локацию; купленные предметы добавляются отдельными интерактивными спрайтами.
- Все 11 мест и размеров заданы в ../collection-layout.mjs, не зависят от числа покупок, порядка покупки или стадии роста.
- Слева наверху приставка и карта; ниже фигурка и телефон. Справа фотик и настолка. На земле футболка, кроссовки, стаканчик и гитара; портативка на небольшом камне.
- Задний слой коллекции не закрывает передние какашки. Невидимая прямоугольная область питомца больше не забирает нажатия у вещей.
- Реплики верхних предметов при необходимости появляются сбоку, ниже шапки интерфейса.
- Технические ID и сохранения сохранены, экономика не менялась.

## Графика

Фон: ../assets/location-v15/planet-platforms.png. Создан встроенным image_gen по утверждённому rock-platforms-b.png. Исходный размер сохранён. Все предметные PNG из ../assets/items-v14/ переиспользованы.

### Промпт clean plate

Use case: precise-object-edit. This attached approved 9:16 portrait mobile-game concept is the EDIT TARGET. Produce ONLY its clean background scenery as a reusable full-screen game background, preserving EXACT camera, composition, positions, shapes, size and colour of every rock ledge and the curved mint ground. REMOVE ALL interface, panels, text, buttons, icons at top and bottom. REMOVE the central purple creature and its legs. REMOVE ALL ELEVEN merchandise items: console, controller, gift card, anime figurine, phone, shirt, sneakers, drink cup and straw, camera and photo, board-game box and die, handheld console, electric guitar. REMOVE both brown poop characters. Paint in the hidden background cleanly. KEEP the two small protruding stone shelves at the far LEFT (top support surface at 46.5% screen height, second at59%), the single far RIGHT stone shelf (surface at53%), the left low boulder behind the former shirt, and the tiny pedestal under the former handheld at x69% y73%. Keep central foreground clear for a future pet. Preserve pale lavender sky and distant planet, flat blue/lavender rock forms and mint curved ground. Absolutely flat cut-paper illustration, solid colours, no new gradients, no outlines, no textures, no brush strokes. Whole output full-bleed 9:16 background, no margins, NO new objects or remaining text/items. Do NOT enlarge or reposition the platforms or horizon. This is clean-plate asset extraction, not a new composition.
