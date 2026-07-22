---
name: add-e2e-test
description: Пишет E2E-тест Playwright для Flamingo по описанию сценария, соблюдая конвенции проекта. Использовать, когда нужно покрыть новый пользовательский путь, роль или экран.
---

# Добавление E2E-теста

1. Прочитай `CLAUDE.md` и `tests/config/flamingo.ts`.
2. Определи роль (student / teacher / admin / parent) → выбери проект в `playwright.config.ts`.
3. Если нужен новый селектор — **сначала** добавь его в `testIds` в конфиге.
4. Напиши тест в `tests/web/`:
   - только `getByTestId` / `getByRole`;
   - без `waitForTimeout`;
   - осмысленное сообщение в `expect(...)`.
5. Если сценарий трогает новый API-эндпоинт — добавь строку в `permissionMatrix`.
6. Прогони: `npx playwright test <файл> --repeat-each=5`.
7. Если тест про SEduM — убедись, что ассерт на дискретное состояние, не на число.
