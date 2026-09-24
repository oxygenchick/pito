# Working agreement

- Runtime modules live in `src/`, styles in `styles/`, resources in `assets/`, automated tests in `tests/` and visual fixtures in `tools/`.
- Keep public documentation focused on the product, architecture and reproducible setup. Do not add local workstation paths, conversation history or internal handoff notes.
- Keep game logic in engine/budget/missions modules, shared by web and Android. Do not fork gameplay in Java.
- Run `node --test` after logic changes. Run `node scripts/build-web.mjs` before an Android build.
- Never commit `.signing`, credentials, SDKs, generated `dist`, APKs, or build caches. Preserve the release key for app updates.
- Update README and docs when commands, balance, data format or requirements status change.
- Keep Russian copy short and child-friendly; use existing art and Balsamiq Sans. Preserve fixed world positions and stage/color/hair consistency.
- Browser and APK saves are independent. Never reset a user's profile as part of QA.
