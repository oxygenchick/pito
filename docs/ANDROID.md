# Сборка из исходников

Для игры сборка не нужна: [скачайте готовый APK](https://disk.yandex.ru/d/emDP3YPIXSeJRQ). Эта инструкция предназначена для разработки собственной версии.

## Окружение

Node.js 22+, JDK 17, Android SDK Platform 35 и Build Tools 35.0.0. Задайте `JAVA_HOME` и `ANDROID_HOME`. Для первой сборки требуется Интернет.

Gradle Wrapper 8.11.1 включён в репозиторий; проект использует Android Gradle Plugin 8.9.1 и AndroidX WebKit 1.12.1. Приложение 0.1.4 (5) поддерживает Android 8.0+ (min SDK 26, target SDK 35).

## APK

Из корня репозитория:

```sh
node scripts/build-web.mjs
node scripts/init-signing.mjs
cd android
```

Первой командой файлы игры копируются в `dist/` для включения в APK. Вторая создаёт ключ собственной релизной подписи; выполняйте её только при первой настройке. Ключ в `.signing/` храните приватно — он нужен для дальнейших обновлений.

Windows:

```powershell
.\gradlew.bat assembleRelease
```

macOS/Linux:

```sh
sh ./gradlew assembleRelease
```

Результат: `android/app/build/outputs/apk/release/app-release.apk` относительно корня проекта. После изменений игры повторите подготовку ресурсов и сборку.

Для отладочной версии используйте `assembleDebug` вместо `assembleRelease`; собственный ключ не нужен. Результат: `android/app/build/outputs/apk/debug/app-debug.apk`.

Обновление установленного приложения требует того же ключа подписи. Удаление приложения для установки сборки с другим ключом удалит игровой профиль.

## Публикация веб-версии

После `node scripts/build-web.mjs` содержимое `dist/` можно разместить на статическом веб-сервере. Для локального запуска подготовка `dist/` не требуется: используйте `node server.mjs`.

[Архитектура](ARCHITECTURE.md) · [Установка APK](GUIDE.md#установка-apk)
