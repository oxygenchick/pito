# Pito — итерация v10, 24 сентября 2026

## Что изменено

- Плоский, более широкий силуэт тела по авторскому листу; тёмные рты; новая вторая причёска. Единая система координат лица для лужайки, создания и событий роста.
- Во вступлении нет причёски. Высота текстовой карточки и положение персонажа не зависят от длины абзаца.
- Поле имени, маски цветных кружков и кольцо выбора используют PNG. Группы создания подняты; отдельно проверены три причёски.
- Ладонь, облако, комикс перекрашены в самих изображениях, убраны дополнительные круглые подложки. У велосипеда вырезан случайный фрагмент соседнего спрайта.
- Иконки потребностей вписаны в одинаковые оптические слоты. Концы круговой шкалы скруглены; закрытие анимировано. Открытые потребности временно скрывают карточку задания, чтобы та не закрывала верхний индикатор.
- Реакция на кормление видна до результата. Новые задания въезжают слева, предыдущие уходят вправо. Это визуальный переход, не новая звуковая система.
- Текстовые блоки знакомства со штучками разделены цветом; подсказка дождя крупнее, цена обозначена «Полив: 1 штучка за 3 секунды».
- План предлагает конкретную вещь и её цену, рядом отдельно подписано «В копилку». Вещи и мечты листаются стрелками; покупка при составлении плана не происходит.
- Первоначальная мечта выбирается с подтверждением. Позже её можно листать в копилке; смена выбранной мечты при подтверждении очередного плана применяется согласованно.
- Пополнение разделено на «По плану» / «Вручную». Выполненный план не оставляет кнопку «Отложить 0». Успех показан внутри окна, без всплывающего сообщения поверх него.
- Кнопки заданий ведут к соответствующему действию: еде, дождику, вещам, мечте, вкладу.
- Реплики вещей привязаны к предметам рисованными баблами. Хвостик выделен отдельным PNG и может указывать не в центр. При открытии окна реплика убирается.
- День длится 480 секунд активной игры; баланс расхода потребностей масштабирован вместе с длительностью. Отладочное завершение дня и ускорение сохранены.
- Итог дня сообщает «План выполнен» или конкретные отклонения, без набора непонятных галочек.
- Новый вклад: 10 → 15 через один игровой день. Существующие старые вклады сохраняют свой записанный срок. Возврат тела вклада больше не увеличивает сумму, которую нужно отложить сегодня.
- События роста не используют ошибочный белый CSS-фон тела и масштабируются относительно игрового поля.

## Фактически выполненная проверка

Отдельное тестовое сохранение iteration-v10, без сброса пользовательского:
1. Старт → история → имя/цвет/причёска → знакомство со штучками → +20.
2. Платные первое кормление и мойка; затем план и подтверждение мечты.
3. Плановое и ручное пополнение; блокировка случайного повторного пополнения.
4. Покупка комикса и появление полки; реплика над вещью.
5. Итог первого дня с отклонением: на хотелки планировали 0, потратили 6.
6. Следующий день с выполненным планом; отдельное событие усиков.
7. Вклад в третьем дне; отсутствие раннего снятия; возврат 15 в четвёртом дне и отдельное событие дохода +5.
8. Регрессия после возврата вклада: плановые 8 не превращаются в 18; итог правильно засчитывает 8.
9. Смена мечты в плане; покупка домика; событие длинных ног после пятого дня.
10. Переход в шестой день и продолжение игры со взрослым Пито; потребности, лицо и полка проверены вместе.
11. Экран 360×640: основное прохождение и финансовые окна. Экран 320×568: отдельный новый профиль, вступление и создание с каждой причёской.
12. Ошибок JavaScript в проверенных вкладках не зарегистрировано.

Дни 1–5 завершались через видимое меню разработчика для ускорения теста. Это не тест восьмиминутного ожидания каждого дня. Проверка на ребёнке была экспертным разбором пути, НЕ исследованием с реальными детьми. Unity в этой итерации не изменялся.

## Изображения

Режим: встроенный image_gen, прозрачные растровые спрайты с референсами. После генерации использована только механическая нарезка с сохранением альфа-канала, без растяжения исходников. Скрипт: prepare-art-v10.mjs.

Каталог: assets/ui-v10/.
Исходники: character-source.png, ui-source.png.
Подключённые спрайты: body.png, hair-1.png, mouth-smile.png, mouth-grin.png, hand.png, cloud.png, comic.png, input-paper.png, swatch.png, selected-ring.png, arrow.png, bike.png, bubble-body.png, bubble-tail.png.
bubble.png — исходный бабл для нарезки. divider.png — подготовлен, но в интерфейс не подключён: ненужные разделители убраны.
Преобразование bike.png — только обрезка старого assets/ui-v8/bike.png ниже колёс.

### Финальный prompt персонажа

Use case: sketch-to-render. Production flat 2D sprite atlas from reference Image1 user's pencil character sheet; Image2 current body to REPLACE because too pointy/conical. Transparent alpha background. 2 columns x 2 rows, four isolated assets generous margins no grid text. Top-left: ONLY BODY SILHOUETTE matching user's upper-left sketch, WITHOUT face, WITHOUT hair/legs/feelers. A wide squat soft organic bean/slime, broad smoothly domed asymmetric top, rounded sides, broad curved belly, NO point, NO nipple, NO triangular peak, NO tall teardrop; about 1.3 wide for 1 high. Solid lavender #ad70bb. Top-right: middle-parted hairstyle like user's row2 column3, two gently curved short swept bangs fitting the rounded dome, no dangling long ears. Alone, solid darker lavender #8f579f. Bottom-left: dark navy #30334f slim upturned smiling mouth alone, rounded ends, curved band like the sketch but no outline, solid dark NOT white. Bottom-right: dark navy broad joyful open grin alone, can have a SMALL row of ivory teeth INSIDE upper edge, the majority of mouth is dark navy. Flat paper-cut silhouettes. No outlines, no gradients, no highlights, no shadows, no volumetric style. Genuine alpha, no background. These parts will be layered in a game.

### Финальный prompt UI-спрайтов

Use case: ui-mockup. Asset type: 9 isolated hand-cut UI game sprites on genuinely transparent background, 3 equal columns x 3 equal rows no grid. Style flat playful quiet cut paper for children financial tamagotchi, navy #30334f lavender #9463af warm cream #fff8e9 mint accents. Absolutely no outlines around objects, no gradients/3D/shadows. Each cell separately centered generous blank gutters.
Row1: a flat lavender-purple hand palm icon five fingers no surrounding circle; a flat medium muted BLUE smiling cloud character with dark navy eyes/mouth and coral cheeks NO drops attached no circle/background; a dark coral book/comic with navy spine and simple lavender planet on cover (clearly readable on cream) no letters.
Row2: long low irregular cream-lavender paper label for name input, ratio3.8:1, softly wonky rounded rectangle solid pale lavender fill NO border; a solid navy slightly handdrawn round disc (color swatch alpha mask); a single lavender uneven handdrawn selection ring, transparent centre, generous margin.
Row3: horizontal handdrawn short navy separator stroke, very subtle organic unevenness but solid navy; blank cream comic speech bubble with one small tail pointing down from bottomcentre, wide shape ratio2:1, no border; a dark navy simple RIGHT arrow with chunky rounded handdrawn shaft no circle no text.
All sprite sheets clean, no text, no extra scattered shapes, transparent alpha around each sprite, no paper texture outside shapes.

## Автотесты

Команда: node --test --test-reporter=tap web-prototype/*.test.mjs.
На момент записи: 340 из 340. Покрыты экономика, миграция, порядок событий, маршруты заданий, план, пополнение, срок вклада, прогресс и ссылки на ассеты.

