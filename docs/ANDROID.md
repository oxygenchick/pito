# Сборка Android

## Окружение

Установите JDK 17 и Android SDK Command-line Tools из официальных источников. Примите лицензию SDK. Установите `platforms;android-35`, `build-tools;35.0.0`, `platform-tools`. Задайте `JAVA_HOME` и `ANDROID_HOME` (корень SDK). Gradle Wrapper 8.11.1 находится в `android/`; Android Studio не обязательна. Первая сборка требует Интернет для зависимостей; сама игра работает офлайн.

```powershell
# Из корня pito, один раз. Никогда не пересоздавать ключ уже выпущенного приложения.
node scripts/init-signing.mjs

# При каждой сборке
node --test
node scripts/build-web.mjs
cd android
.\gradlew.bat assembleRelease
```

macOS/Linux: вместо последней команды `sh ./gradlew assembleRelease`. В Windows также доступна команда `npm run build:android`.

Результат: `android/app/build/outputs/apk/release/app-release.apk`. Это release, не debug; подписывается приватным RSA-ключом из `.signing/`. Отладка WebView выключена. Без ключа release-сборка намеренно завершается ошибкой. Для нового клона восстановите `.signing/` из приватной резервной копии, чтобы подпись обновления совпадала.

Готовая сборка от 24.09.2026: `builds/pito-0.1.0-release.apk` (около 56 МиБ). На текущем компьютере инструменты загружены в соседний `../tmp/android-tools/`: JDK в `jdk/jdk-17.0.20.1+1`, SDK в `sdk`. Это временное расположение вне Git, не обязательный путь для другого компьютера.

Версии фиксированы: Java 17, Gradle 8.11.1, AGP 8.9.1, AndroidX WebKit 1.12.1, compile/target 35, min 26. Версию приложения менять в `android/app/build.gradle`, увеличивая `versionCode` для каждого обновления.

## Установка

Передайте APK на телефон и откройте его. При необходимости разрешите установку приложений выбранному файловому менеджеру, затем отзовите это разрешение. Android Studio для установки не нужна. Либо при подключённом тестовом телефоне с USB-отладкой:

```sh
adb install -r android/app/build/outputs/apk/release/app-release.apk
adb shell am start -n ru.pitopito.hackathon2026/.MainActivity
```

Проверка подписи:

```sh
apksigner verify --verbose --print-certs app-release.apk
```

## Содержимое и безопасность

В APK включены `dist/index.html`, JS-модули, CSS и `assets/`. Тесты, документы, Git, SDK и закрытый ключ внутрь не попадают. WebView загружает `https://appassets.androidplatform.net/assets/index.html` из APK через локальный обработчик. Запросы вне него блокируются, доступа `file://`, content-provider и JS/native bridge нет. Разрешение `INTERNET` не запрашивается.

Профиль хранится в DOM storage приложения. Пауза/возврат Android передают события в общий JS-контроллер: сохраняют состояние и прекращают полив. Системная кнопка «Назад» предлагает закрыть игру с подтверждением. Портретная ориентация зафиксирована; на новых Android учитываются системные панели и клавиатура.

Проверка на физическом Android 8+ с ОЗУ 3 ГБ или больше обязательна по ТЗ. Сборка и проверка подписи её не заменяют. Особенно проверить актуальность System WebView, текст/экранную клавиатуру, сворачивание во время дождя, восстановление сохранения, холодный запуск до 5 секунд. На старом необновлённом WebView современная CSS-вёрстка может не работать.

## Источники

- [Android: загрузка локальных ресурсов в WebView](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content)
- [Совместимость AGP 8.9](https://developer.android.com/build/releases/agp-8-9-0-release-notes)

Формат соответствует выбранному в ТЗ подходу «другой обоснованный стек»: экономика и UI общие с веб-версией, Java отвечает только за локальный запуск и жизненный цикл. Это не Unity-сборка.
