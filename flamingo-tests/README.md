# flamingo-tests

Каркас автотестов Flamingo: web E2E (92 теста), SEduM с детерминированной камерой,
privacy-gate под 152-ФЗ, матрица прав доступа, нагрузка, контракт API.

## Быстрый старт

```bash
npm install
npx playwright install --with-deps
cp .env.example .env      # заполнить адреса и тестовые учётки
npm run fixtures          # собрать видео-фикстуры (нужен ffmpeg)
npm test
```

## Единственная точка адаптации

**`tests/config/flamingo.ts`** — здесь живут все селекторы, эндпоинты, роли,
матрица прав и маркеры приватности. В самих тестах нет ни одного literal-селектора.
Правите этот файл — всё остальное подхватывается.

Что нужно сделать один раз:
1. Попросить фронтенд проставить `data-testid` из `testIds` (работа на пару часов,
   экономит недели поддержки).
2. Заполнить `.env`.
3. Настроить сид тестовых пользователей (`student_1`, `student_2`, `teacher_1`, `admin_1`, `parent_1`).

## Команды

| Команда | Что делает |
|---|---|
| `npm test` | всё |
| `npm run test:privacy` | ⭐ только privacy-gate |
| `npm run test:sedum` | SEduM с подменённой камерой |
| `npm run test:perms` | матрица прав доступа / IDOR |
| `npm run test:flake` | 20 прогонов подряд — проверка на флак |
| `npm run typecheck` | типы |

Нагрузка: `k6 run -e BASE_URL=... tests/load/exam-spike.js`
API: `bash tests/api/run-contract-tests.sh`
Мобильные: `maestro test tests/mobile/lesson-flow.yaml`

## Что критично не сломать

1. **Privacy-gate нельзя ослаблять.** Только усиливать. Это юридический контур.
2. **`FrameSource` в мобильном приложении** — без него SEduM не покрывается на iOS
   (в Simulator камеры нет вообще). См. `mobile-reference/`.
3. **Патч `C420mpeg2 → C420`** в фикстурах — без него Chrome падает.
4. **Ассерты SEduM только на дискретные состояния**, не на float.

Полный контекст и обоснование — в `../FLAMINGO_TESTING_RUNBOOK.md`.
