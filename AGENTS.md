# Working agreement

- This directory is the active Pito web + Android project. Edit here, not in the sibling `web-prototype`, which is the preserved snapshot from 2026-09-24.
- Do not restore/remove legacy Unity files through Git unless explicitly requested. Their deletions predate the web migration.
- Keep game logic in engine/budget/missions modules, shared by web and Android. Do not fork gameplay in Java.
- Run `node --test` after logic changes. Run `node scripts/build-web.mjs` before an Android build.
- Never commit `.signing`, credentials, SDKs, generated `dist`, APKs, or build caches. Preserve the release key for app updates.
- Update README and docs when commands, balance, data format or requirements status change.
- Keep Russian copy short and child-friendly; use existing art and Balsamiq Sans. Preserve fixed world positions and stage/color/hair consistency.
- Browser and APK saves are independent. Never reset a user's profile as part of QA.
