# Pito v13, 24 сентября 2026

## Персонаж и фон

Новый плавный силуэт по последнему крупному скетчу пользователя. Это генеративная интерпретация контура, не точная трассировка. Два промежуточных варианта отвергнуты и не подключены. Выбранный силуэт непрерывный, без прозрачной дырки. Вырезан только белый фон; форма программно не перерисовывалась.

Тело, ноги и усики используют свои альфа-маски и один цвет заливки для каждого выбранного цвета. При создании глаза открыты. В событии роста взгляд фиксирован, зрачки не уходят за веки вслед за курсором. Тап даёт вертикальный подскок без уменьшения персонажа. Большой левый куст из трёх травинок удалён из фона.

## Игровые исправления

- План и пополнение копилки ограничены недостающей до выбранной мечты суммой. Излишек остаётся свободным в кошельке.
- Уже накопленные сверх цены деньги старых сохранений сохраняются в копилке после покупки. На экране покупки видны цена и остаток.
- Исправлен устаревший выбор уже купленной мечты при составлении следующего плана.
- Рамка выбранной бюджетной карточки вынесена наружу.
- Все девять предметов отображаются на расширяющейся полке без страниц. Последний неполный ярус опущен, чтобы предмет не попадал под шапку.
- Бабл предмета сдвинут так, чтобы нарисованный хвост указывал на объект; текст центрирован.
- Скрытый исходный img внутри маски исключён из раскладки. Иначе его натуральная высота создавала невидимую прокрутку и при фокусе сдвигала всю поляну.

## Проверка

376 автоматических тестов, включая три сценария по 12 игровых дней: накопление, покупки и смешанный план. Проверены сохранение баланса денег, вклад, покупка мечты, перезагрузка состояния, взросление до ног. Отдельный тест: осталось накопить 5, предложить или перевести 13 нельзя. Старый избыток 8 после покупки не исчезает.

В браузере на отдельном QA-профиле проверены план, накопление 14 + 10 до цены 24 и покупка без дополнительного списания из кошелька. Проверены создание на 320×568 и 360×640, событие роста, все девять предметов на полке и реплика комикса. Ошибок консоли в проверенном игровом профиле нет. Это инженерная и визуальная проверка, не исследование с реальными детьми.

Пользовательское сохранение не сбрасывалось, его вкладка принудительно не перезагружалась. Unity не изменялся.

## Арт

Навык imagegen, встроенный генератор (не CLI). Исходники прежних версий сохранены. Механическая подготовка через prepare-art-v13.mjs.

- assets/ui-v13/body-source.png
- assets/ui-v13/body.png (1189×927, прозрачный фон)
- assets/ui-v13/planet.png

### Финальный промпт тела

Faithfully reproduce ONLY the outer body contour of the attached user's sketch, filled with completely solid opaque flat purple #AA6DB4 on a plain pure white background. Exact same rounded body shape and proportions as reference (not wider or more triangular). Remove ALL eyes, mouth and black strokes. Interior must be one UNIFORM solid opaque purple with NO HOLE and no lighter or darker areas. Smooth natural convex sides, broad rounded base, rounded apex. NO transparency in this output, no shading, glow, gradient, outline, shadow, texture, no face, no limbs. Single flat silhouette, centered with 8% white margin, landscape4:3. This is a stencil for a game sprite.

### Промпт фона

Edit only one detail in supplied game background: REMOVE the large dark blue three-leaf bush at LEFT EDGE at y≈68–82% (the tall three long blades rising above ground near left rocks). Replace its area with continuation of the nearby pale ground and distant blue rock shapes naturally. Leave the small mint grass at x20% y77% unchanged. Preserve every other element, dimensions, planet, sky, colors, floor curve and style. No new objects, no texture, no text, no characters.
