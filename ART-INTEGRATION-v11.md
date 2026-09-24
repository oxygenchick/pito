# Pito: итерация v11, 24 сентября 2026

## Изменения

- План разделён на кошелёк, резерв на еду и воду и две карточки выбора. Резерв по умолчанию 4, меняется рисованными кнопками. Карточка выбирается тапом, без отдельной кнопки «Выбрать». Цена вещи и остаток в копилку видны отдельно.
- Сохранённый план сразу показывает «По плану / Уже», без ссылок на категории.
- Вклад принимает любую доступную целую сумму от 1 из кошелька или копилки. Срок один игровой день. Игровой доход составляет половину суммы с округлением вверх: 1 → 2, 2 → 3, 3 → 5, 10 → 15. Точная выплата видна перед подтверждением. Это условность игрового баланса, не обещание реальной банковской доходности. Карманные расходы оставлены 8 в день; доступность вклада исправлена снятием порога 10, а не бесконтрольным увеличением начислений.
- Старые вклады сохраняют уже записанные сумму, доход и срок.
- Новая грязь сразу снимает до 8 единиц чистоты и продолжает ускорять её расход. Уборка возвращает именно этот штраф, один раз; падение чистоты со временем требует мытья Пито. Старым какашкам без записанного штрафа не начисляется выдуманный бонус.
- Ноги зарегистрированы относительно тела с перекрытием, взрослый Пито центрирован в событии роста. Радость двигает целого персонажа вертикально; предметы тоже прыгают без вращения.
- Счастливые глаза получили нижние веки. Добавлен тёмный рот со свистящими губами, зрачки остаются отдельными и маскируются.
- Новый цельный бабл предметов исключает оторванный хвостик.
- Стартовый персонаж уменьшен. Имя по умолчанию «Пито». Поле имени использует девятисегментную рисованную подложку; причёски стоят в круглых селекторах, третья посажена ниже и правее.
- Индикатор роста виден возле дня без подписи. Описание роста центрировано, лишние строки удалены.
- Удалён переключатель анимаций, но системное предпочтение reduced-motion сохраняется.
- Длинные тире убраны из текстов исполняемых модулей. Элементы знакомства со штучками отцентрированы.
- Новая лужайка проще и площе по стилю. Для вступления и создания добавлен экспериментальный светлый планетный фон. Старые изображения не перезаписаны.
- Короткие шевроны и плюс/минус являются PNG, пропорции не растягиваются.

## Проверки

363 автоматических теста прошли, 0 ошибок. Проверены суммы бюджета, вклад от 1, возврат и срок, сохранения старых вкладов, защита от повторного начисления за уборку, тексты и визуальные связи.

В браузере на отдельном профиле пройдены создание, платное кормление и дождь, первый план, плюс/минус резерва, сохранение и показ план/факт. Проверены 360×640 и создание на 320×568. Исправлено обнаруженное переполнение карточек плана: цены теперь видны до прокрутки.

Проверен взрослый Пито в игре и отдельно в событии роста. Проверены бабл комикса и счастливое лицо. Новая грязь: чистота 100 → 92, уборка 92 → 100. Вклад 2: кошелёк 20 → 18; следующий день 26; возврат 3 даёт 29 и отдельное событие дохода +1. Ошибок браузера в этих сценариях не было.

Это автоматические проверки и проверка интерфейса агентом, не исследование с реальными детьми. Все пять дней заново вручную в этой итерации не проходились: поздние стадии проверялись на отдельном ранее созданном профиле и чистой визуальной тестовой странице. Пользовательское сохранение не сбрасывалось. Unity в этой итерации не изменялся.

Визуальные фикстуры без доступа к сохранениям: visual-qa-v11.html?screen=grown&stage=2 и ?screen=create&hair=0.

## Изображения

Использован встроенный image_gen через навык imagegen, не CLI. Финальные файлы находятся в web-prototype/assets/ui-v11/: meadow.png, planet.png, sprites-source.png, plus.png, minus.png, chevron.png, mouth-whistle.png, eyes-happy.png, eyes-happy-cut.png, bubble-left.png.

Атлас нарезан по альфа-каналу, пропорции сохранены. Исходники генерации и предыдущие версии не удалены. Скрипт подготовки: prepare-art-v11.mjs. Подключение: polish-v11.css последним стилевым слоем.

## Использованные промпты

### Лужайка

Use case: style-transfer. Production BACKGROUND ONLY for 9:16 portrait mobile 2D game. Reference1 is existing scene composition edit target, reference2 is style context. Redraw entire scene as perfectly FLAT minimalist cut-paper shapes, LocoRoco/Pikuniku playful sensibility, NOT copying characters. Preserve geometry: blue sky occupies upper 71% of frame, curved mint-green grassy hill starts at y=71.5% center and y=75.5% at left/right edges, fills bottom. Quiet blue/lavender rounded distant rock silhouettes only near horizon, tiny flat cream clouds near outer edges. Almost all centre and upper area empty for UI and pet. Very few small grass leaves at outer bottom corners. Flat solid pale blue sky, flat lavender mountain shapes, muted mint hill. No brush marks, no texture, no grain, no gradients, no shading, no lighting highlights, no outlines, no flowers obscuring gameplay, no characters, no furniture, no text, no interface. Keep reference composition and land curve; simplify materials and remove painterly strokes.

### Планета

Use case: illustration-story. Portrait 9:16 BACKGROUND ONLY for opening screens of a flat playful 2D mobile pet game. Quiet pale lavender alien planet landscape, minimal cut-paper graphic shapes, solid colors with no texture. Pale cream-lavender sky covers most image; small dusty pink crescent/ringed planet very near upper-right edge. A smooth low pale mint/lavender curved planet surface across bottom 28%, a few abstract soft blue/lavender rocks exclusively along outer edges. Keep central 75% width from top to bottom calm and unobstructed for text card and pet. Cheerful welcoming not dark outer space. Reference1 palette only, do not copy UI/characters. NO characters, text, UI, faces, buildings, painterly marks, grain, volumetric shading, cast shadows, gradients, outlines. One coherent background not mockup.

### Атлас управления и лица

Use case: ui-mockup. Production sprite atlas, exactly 3 columns × 2 rows, isolated objects with generous gutters, genuinely TRANSPARENT alpha background, no grid/text. Flat solid cut-paper 2D game style, no outlines, no gradients/shadow/texture. Navy #30334f and warm cream #fff8e9. Reference character sketch for mouth shape only. Top left navy PLUS symbol with chunky soft handmade arms. Top middle navy MINUS symbol matching thickness. Top right navy right CHEVRON >, two arms only, NO horizontal arrow shaft. Bottom left a navy puckered WHISTLING MOUTH from reference: small vertical dark oval lip on right connected to a short wavy crease on left, solid dark shape without white fill or outlines, no notes. Bottom middle TWO ivory HAPPY EYE WHITES without pupils, aligned horizontal pair, each circular dome with LOWER EYELID pushing UP covering lower third, whites still rounded top; cheerful squint not droopy upper lids. Pair width about2.2times height, comfortable gap between eyes. Bottom right blank ivory speech bubble wide2:1, a SINGLE short tail built smoothly into bottomleft at about22% of bubble width, not separate piece, round soft ovalbody. No facial pupils/extra marks, no purple outlines, no faces inside bubble.

