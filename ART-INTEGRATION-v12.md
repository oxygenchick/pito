# Pito v12, 24 сентября 2026

## Последний согласованный экран плана

1. Текущий кошелёк.
2. Центрированный блок «Поесть и помыться», обычно 4, плюс/минус. Иконка ухода удалена.
3. Две карточки: вещь или мечта, листание и цена. Тап выбирает карточку, выделение использует рисованный PNG.
4. Одна общая копилка под карточками, на всю ширину, плюс/минус.
5. Свободный остаток.
6. Подтверждение.

Накопления добровольны. У покупки по умолчанию 0; у мечты предлагается остаток, который можно уменьшить до 0. Каждый вариант помнит введённую для него сумму до закрытия окна. При смене цены или ухода сумма ограничена доступными деньгами. План не переводит деньги и не совершает покупку. Частичный план сохраняется без автоматического распределения остатка. Старые сохранённые планы не переписаны.

У всех плюсов, минусов и шевронов этого экрана одинаковый слот изображения 24×24 и кнопка 44×44. Пропорции PNG сохранены. Фраза «Это план, не покупка» удалена. Ровная обводка выбранной карточки заменена PNG-рамкой.

## Персонаж и фон

Насвистывающий рот удалён из рендера и переключения эмоций, остальные рты сохранены. Исходный неиспользуемый спрайт не удалён.

Светлая планета с голубоватыми скалами теперь используется на старте, во вступлении, создании и игре. Добавлены только несколько травинок и камешков по краям. Вступительный Пито и создание получили ту же опорную линию пола и ширину тела 34cqw, что и игровой персонаж. В создании выбор цвета и причёски расположен над персонажем, чтобы он не висел над планетой.

## Проверка

368 автоматических тестов проходят. В браузере проверены покупка с накоплением 0, изменение общей копилки, переключение карточек, сохранение плана [4,4,0] без списания денег. На 360×640 все блоки плана помещаются целиком. Создание проверено на 320×568, персонаж стоит на поверхности, причёска не пересекается с селекторами. В тестовом профиле ошибок браузера не было. Пользовательская вкладка в этой итерации не перезагружалась принудительно, прогресс не сбрасывался.

Unity не изменялся.

## Графика

Навык imagegen, встроенный генератор, не CLI. Готовые файлы:
- assets/ui-v12/planet.png
- assets/ui-v12/selected-frame.png
- assets/ui-v12/frame-source.png

Рамка обрезана механически по альфа-каналу; при подключении применяется девятисегментное растяжение, чтобы не плющить углы. Исходники и предыдущие версии сохранены. Скрипт: prepare-art-v12.mjs.

## Промпт фона

Edit the supplied portrait game background. Preserve the existing scene layout, pale almost white lavender sky, pale mint-white planet surface curving at 71% image height, blue/lavender rocks at edges, pink ringed planet top right. Keep center empty and calm. Add only a FEW tiny playful flat grass sprigs and smooth small pebbles along bottom outer edges, no busy decorations. Make colors flat solid with no painterly texture or brush marks, no gradients. Minimal Pikuniku-inspired cut-paper friendly 2D game background, portrait 9:16. No characters, no text, no interface. Preserve large central space and land curve exactly.

## Промпт выделения

Production UI sprite on genuinely transparent alpha background. A single tall rounded rectangular hand-cut frame, width:height 1:2, thick flat muted dark purple #7956a7 ink, empty TRANSPARENT center. Slightly irregular organic edges like carefully hand-drawn paper game card outline, not wobbly scribbles. Thickness about 2% of width, soft corners radius about 8% width. No fill, no text, no shadows, no texture, no gradient, no extra marks. Large generous transparent margin. Suitable for nine-slice border of a children's 2D game selected card.

