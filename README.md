# Flamingo

Онлайн-образование (РФ/СНГ, 1–11 классы + взрослые) с модулем аналитики вовлечённости **SEduM**
(приватность: сырые биометрические сигналы не покидают устройство, на сервер — только агрегаты).

## Структура репозитория

| Папка | Что это |
|---|---|
| `flamingo-prototype/` | Кликабельный веб-прототип (React+Vite), деплой на Cloudflare Pages → flamingo.plus |
| `flamingo-tests/` | Автотесты (Playwright): E2E, SEduM, privacy-gate, права/IDOR, адаптив, нагрузка |
| `*.md`, `*.docx` | R&D-отчёт SEduM, runbook'и тестирования, планы |

## Быстрый старт

```bash
# прототип
cd flamingo-prototype && npm install && npm run dev

# тесты против прототипа (demo-режим)
cd flamingo-tests && npm install && npx playwright install --with-deps chromium
BASE_URL=http://localhost:4173 npm run test:demo
```

Деплой: `flamingo-prototype/DEPLOY.md`. Тест-стратегия: `flamingo-tests/PLATFORM_TEST_MATRIX.md`.

## ⚠️ Прототип — только синтетические данные
Публичный demo не должен содержать реальных данных детей и реальной обработки камеры
с отправкой на сервер (152-ФЗ). SEduM в прототипе замокан.
