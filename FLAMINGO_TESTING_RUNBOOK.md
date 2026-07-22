# Flamingo — Runbook глубокого тестирования

**Периметр:** веб + мобильные приложения + публичное API
**Стек:** Playwright · Maestro · k6 · Schemathesis · Claude Code
**Дата:** 21 июля 2026 · **Статус:** к исполнению

---

## 0. Резюме: три решения, определяющие всё остальное

| # | Решение | Почему |
|---|---|---|
| 1 | **Абстракция `FrameSource` закладывается ДО тестов** | У iOS Simulator камеры нет вообще. Без этой абстракции мобильное покрытие SEduM физически невозможно. Ретрофит потом — дорого. |
| 2 | **Тестируем поведенческие последствия, а не координаты** | Vision-пайплайн даёт непрерывные float'ы. Ассерты на них = вечно красный CI. Ассертим дискретный сигнал и UI. |
| 3 | **Privacy-gate — обязательный шаг CI, не «тест»** | Утечка сырой биометрии = юридический инцидент по 152-ФЗ, а не баг. Значит, блокирующий гейт на merge. |

**Порядок внедрения:** Фаза 0 → 1 → 2 → 3 (первые 3–4 недели дают 80% ценности) → далее 4–8.

---

## 1. Архитектурное решение №1: seam `FrameSource`

> Это единственный пункт, который нужно сделать **до** написания тестов.

### Проблема

| Платформа | Инъекция камеры |
|---|---|
| Chrome desktop | ✅ видео (Y4M) |
| Firefox | ⚠️ только синтетический паттерн, свой файл нельзя |
| WebKit / Safari | ❌ нет механизма |
| Android emulator | ⚠️ статика штатно; видео — только через виртуальную вебкамеру хоста |
| **iOS Simulator** | ❌ **камеры нет в принципе** |
| Real device (BrowserStack) | ✅ изображение + видео (MP4 ≤15 МБ) |
| Real device (Sauce Labs) | ⚠️ только изображения (≤5 МБ) |

Вывод: **нельзя делать ОС-камеру зависимостью тест-сьюта.** Инвертируем.

### Решение

```
┌──────────────────────────────────────────────┐
│  UI (оверлей, экран согласия, статус сессии) │
└───────────────────▲──────────────────────────┘
                    │ AttentionSignal (дискретный)
┌───────────────────┴──────────────────────────┐
│  VisionPipeline (MediaPipe / CMF)            │ ← golden-тесты
└───────────────────▲──────────────────────────┘
                    │ Frame (буфер + timestamp)
┌───────────────────┴──────────────────────────┐
│           FrameSource (интерфейс)  ← SEAM    │
└──┬───────────────┬───────────────┬───────────┘
   │               │               │
LiveCamera     FileFrame       ScriptedFrame
(prod)         (тест: MP4)     (тест: синтетика)
```

```kotlin
// Android
interface FrameSource {
    fun frames(): Flow<Frame>   // Frame = буфер пикселей + монотонный timestamp
    fun stop()
}
```
```swift
// iOS
protocol FrameSource {
    var frames: AsyncStream<Frame> { get }
    func stop()
}
```

### Правила (нарушение любого ломает тестируемость)

1. **`FrameSource` — единственное место, импортирующее `AVFoundation` / `androidx.camera`.** Выше по стеку — никогда.
2. **Фикстурное видео зашито в test/debug-сборку.** Переключение — через launch-аргумент: `--es frame_source fixture_attentive` (Android) / `-FrameSource fixture:attentive_30s` (iOS). Это единственный способ покрыть SEduM на iOS Simulator.
3. **`FileFrameSource` работает по виртуальным часам,** не по wall-clock. 300 кадров прокручиваются мгновенно вместо 10 секунд ожидания. Убирает бóльшую часть флака и ускоряет сьют в разы.
4. **Контрактный тест на сам seam:** один общий набор тестов гоняется и против `LiveCameraSource` (на реальном устройстве, ночью), и против `FileFrameSource` — проверяет одинаковый контракт (порядок кадров, монотонность timestamp, backpressure, семантика `stop()`). Это то, что не даёт фейку разойтись с реальностью.

---

## 2. Фазы внедрения

### Фаза 0 — Подготовка (2–3 дня)

```bash
# структура
mkdir -p tests/{web,mobile,api,load,fixtures,golden}
mkdir -p tests/fixtures/video
```

- [ ] Выделить **изолированное тестовое окружение** с сидируемой БД (не stage, который все руками ломают).
- [ ] Скрипт `seed:test` — детерминированные пользователи: `student_1..N`, `teacher_1`, `admin_1`, `parent_1`.
- [ ] Тестовые аккаунты создаются **через API, не через UI** (иначе логин-флоу становится точкой отказа всех тестов).
- [ ] Определить `MAX_AGGREGATE_BYTES` — верхний предел размера агрегата SEduM. Понадобится в Фазе 3.
- [ ] Завести `tests/README.md` с политикой флака (см. §8).

### Фаза 1 — Веб E2E и роли (неделя 1)

```bash
npm init playwright@latest
npx playwright install --with-deps
```

**Аутентификация через `storageState` — по одному разу на роль, не в каждом тесте:**

```ts
// tests/web/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const ROLES = ['student', 'teacher', 'admin', 'parent'] as const;

for (const role of ROLES) {
  setup(`auth ${role}`, async ({ page, request }) => {
    // Быстрый путь: получаем токен по API, кладём в браузерный контекст
    const res = await request.post('/api/auth/login', {
      data: { login: `${role}_1`, password: process.env.TEST_PASSWORD },
    });
    expect(res.ok()).toBeTruthy();
    const { token } = await res.json();

    await page.goto('/');                     // нужен origin, иначе localStorage недоступен
    await page.evaluate(t => localStorage.setItem('auth_token', t), token);

    // storageState берём с контекста СТРАНИЦЫ — он включает и cookies, и localStorage
    await page.context().storageState({ path: `tests/.auth/${role}.json` });
  });
}
```

> ⚠️ **Частая ошибка:** `request.storageState()` (у `APIRequestContext`) сохраняет **только cookies**. Если сессия держится на токене в `localStorage`, состояние молча не сохранится и все тесты окажутся неавторизованными. Всегда берите `page.context().storageState()`.
> Если аутентификация чисто cookie-based — `request.storageState()` подойдёт, и страница не нужна.

```ts
// playwright.config.ts
projects: [
  { name: 'setup', testMatch: /auth\.setup\.ts/ },
  { name: 'student', use: { storageState: 'tests/.auth/student.json' }, dependencies: ['setup'] },
  { name: 'teacher', use: { storageState: 'tests/.auth/teacher.json' }, dependencies: ['setup'] },
  { name: 'admin',   use: { storageState: 'tests/.auth/admin.json'   }, dependencies: ['setup'] },
]
```

**Что покрываем в первую очередь (по убыванию риска):**

| Поток | Роль | Почему критично |
|---|---|---|
| Регистрация → вход → согласие родителя | student/parent | Без согласия нельзя запускать SEduM — юридический блокер |
| Запись на курс → урок → сдача задания | student | Основной денежный путь |
| Проверка работы → оценка → публикация | teacher | Второй по важности путь |
| Доступ к чужим данным (IDOR) | все | См. Фазу 1b |

**Фаза 1b — права доступа (делать сразу, не откладывать):**

```ts
// Каждый ученик НЕ должен видеть данные другого
test('IDOR: ученик не получает чужую аналитику', async ({ request }) => {
  const foreignId = process.env.STUDENT_2_ID!;
  const res = await request.get(`/api/analytics/student/${foreignId}`);
  expect(res.status()).toBe(403);   // не 200, не 500, не пустой 200
});
```

Генерируйте эти тесты **матрицей** `роль × эндпоинт × чужой ресурс`. Для edtech с данными несовершеннолетних это не «security nice-to-have», а базовое требование.

### Фаза 2 — SEduM в браузере: детерминированная камера (неделя 2)

**Подготовка фикстур:**

```bash
# 480p достаточно для распознавания лица; Y4M — сырой формат, следите за размером
ffmpeg -i attentive_source.mp4 -vf scale=640:480 -t 15 -pix_fmt yuv420p \
       tests/fixtures/video/attentive_30s.y4m

# ⚠️ КРИТИЧНО: ffmpeg пишет C420mpeg2, Chrome ждёт C420 и падает без этой правки
sed -i '0,/C420mpeg2/s//C420/' tests/fixtures/video/*.y4m
```

> Y4M ≈ **1 ГБ на 10 сек 1080p**. Держите фикстуры короткими и в 480p, храните через Git LFS.

```ts
// playwright.config.ts
{
  name: 'sedum-chromium',
  use: {
    ...devices['Desktop Chrome'],
    permissions: ['camera'],
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',        // авто-разрешение камеры
        '--use-fake-device-for-media-stream',
        '--use-file-for-fake-video-capture=tests/fixtures/video/attentive_30s.y4m',
      ],
    },
  },
}
```

**Набор фикстур (минимум):**

| Фикстура | Ожидаемый сигнал |
|---|---|
| `attentive_30s` | ≥90% кадров — ATTENTIVE |
| `looking_away` | преобладает AWAY |
| `eyes_closed` | срабатывает индикатор усталости |
| `no_face` | NO_FACE, без краша |
| `low_light` | деградация без ложных срабатываний |
| `two_faces` | корректная обработка (или явный отказ) |
| `occluded` (рука/очки) | не «уверенный» неверный сигнал |

**Ассертим UI-последствие, не координаты:**

```ts
test('SEduM: отвод взгляда меняет индикатор', async ({ page }) => {
  await page.goto('/lesson/1');
  await page.getByRole('button', { name: 'Начать урок' }).click();
  // НЕ проверяем yaw=17.3°, проверяем дискретный результат
  await expect(page.getByTestId('attention-badge')).toHaveText('Отвлечён', { timeout: 15_000 });
});
```

### Фаза 3 — Privacy-gate ⭐ (неделя 2–3)

**Это ваш самый ценный тест.** Он одновременно защищает от регрессии и служит воспроизводимым комплаенс-артефактом под 152-ФЗ — его можно показывать юристам, партнёрам и инвесторам.

```ts
// tests/web/privacy.spec.ts
import { test, expect } from '@playwright/test';

const BACKEND = process.env.BACKEND_ORIGIN!;
const MAX_AGGREGATE_BYTES = 4096;
const RAW_MARKERS = ['landmark', 'blendshape', 'faceMesh', 'rawFrame', 'imageData', 'base64'];

test('SEduM: сырая биометрия не покидает устройство', async ({ page }) => {
  const violations: string[] = [];

  const inspect = (url: string, ct: string, body: string | null) => {
    if (!url.startsWith(BACKEND)) return;
    if (/^(image|video)\//.test(ct) || ct === 'application/octet-stream') {
      violations.push(`Бинарный payload → ${url} (${ct})`);
    }
    if (!body) return;
    for (const m of RAW_MARKERS) {
      if (body.toLowerCase().includes(m.toLowerCase())) violations.push(`Маркер "${m}" → ${url}`);
    }
    if (body.length > MAX_AGGREGATE_BYTES) {
      violations.push(`Payload ${body.length}B > ${MAX_AGGREGATE_BYTES}B → ${url}`);
    }
  };

  // HTTP
  page.on('request', r => inspect(r.url(), r.headers()['content-type'] ?? '', r.postData()));

  // WebSocket — агрегаты часто идут именно сюда, не забыть!
  page.on('websocket', ws => {
    ws.on('framesent', f => inspect(ws.url(), 'ws', String(f.payload)));
  });

  await page.goto('/lesson/1');
  await page.getByRole('button', { name: 'Начать урок' }).click();
  await page.waitForTimeout(30_000);

  expect(violations, `Нарушения приватности:\n${violations.join('\n')}`).toEqual([]);
});
```

**Усильте allow-list'ом:** каждый запрос к бэкенду от SEduM должен валидироваться против JSON-схемы агрегата. Всё, что схеме не соответствует, — нарушение.

- [ ] Гейт помечен `@privacy` и **блокирует merge** — не «предупреждение».
- [ ] Отчёт гейта сохраняется как артефакт CI с датой и хешем коммита (это и есть комплаенс-след).

### Фаза 4 — Vision-пайплайн: golden-тесты (неделя 3)

Гоняется **без браузера и без устройства**, на CPU — быстро, на каждый PR.

**Правила детерминизма:**

1. **Пинить модель по хешу**, не по «latest». Версия модели — это входной параметр теста.
2. **Форсировать CPU/XNNPACK-делегат.** GPU-делегат MediaPipe даёт расхождения и падения; результаты GPU и CPU не совпадают побитово. GPU — отдельный ночной прогон с более широкими допусками.
3. Сид централизованно, в session-scoped фикстуре.
4. Кадры декодируются с диска одинаково каждый прогон, timestamp — виртуальные.

**Ассерты — по возрастанию устойчивости:**

```python
# ❌ никогда
assert yaw == 17.34

# ✅ 1. допуск, откалиброванный по ~20 прогонам + запас
assert abs(yaw - expected_yaw) < 2.0

# ✅ 2. дискретный сигнал вместо непрерывного
assert state == AttentionState.LOW

# ✅ 3. агрегат по клипу, а не по кадру
assert attentive_ratio(clip="attentive_30s") >= 0.90

# ✅ 4. порог регрессии на весь golden-набор (гейт на merge)
assert f1_score >= baseline_f1 - 0.03

# ✅ 5. инварианты (property-based)
assert 0.0 <= score <= 1.0
assert len(landmarks) == EXPECTED_LANDMARK_COUNT
assert pipeline(black_frame).state == NO_FACE   # не краш
```

**Политика:** каждый продовый инцидент в тот же день превращается в golden-фикстуру.

### Фаза 5 — Публичное API (неделя 4)

Для **публичного** API (потребители неизвестны и Pact-файлы вам не напишут) правильная модель — **schema-first**, не consumer-driven.

```bash
pip install schemathesis
st run --checks all http://localhost:8000/openapi.json
```

- [ ] OpenAPI-спека **генерируется из кода** или валидируется против него (спека «рядом с кодом» неизбежно протухает).
- [ ] **Schemathesis в CI на каждый PR** — property-based тесты прямо из схемы. Максимум покрытия на единицу усилий.
- [ ] **Детектор breaking-change** на diff спеки: падение сборки при удалении поля, сужении enum, новом required-параметре.
- [ ] Рантайм-валидация ответов против схемы на stage.
- [ ] **Pact — только когда появится известный потребитель** (ваше же мобильное приложение ↔ бэкенд, именованный партнёр). Для анонимных потребителей Pact добавляет церемонию без безопасности.

> ⚠️ **Dredd не брать** — проект официально архивирован и не поддерживается.

**Отдельно:** payload «устройство → бэкенд» с агрегатами SEduM тоже версионируйте как контракт. Старые версии приложения живут на устройствах месяцами.

### Фаза 6 — Мобильные приложения (недели 5–6)

**Maestro первым, Appium — как запасной выход.**

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
maestro test flows/lesson_flow.yaml
```

```yaml
# flows/sedum_attention.yaml
appId: com.flamingo.app
---
- launchApp:
    arguments:
      frame_source: "fixture_looking_away"   # ← seam из §1
- tapOn: "Начать урок"
- assertVisible: "Отвлечён"
```

Почему Maestro: авто-ожидание в каждой команде убирает главный источник флака, время до первого зелёного сьюта — часы, а не недели. Ограничения (учитывать заранее): YAML — не язык программирования, сложное ветвление выражается плохо; диагностика падений скудная; локально не поддерживает физические iOS-устройства. Сложные потоки — на Appium.

**Матрица покрытия камеры на мобильных:**

| Слой | Где | Частота |
|---|---|---|
| Golden-тесты пайплайна | CPU, host | каждый PR |
| E2E через `FileFrameSource` | simulator/emulator | каждый PR |
| Реальная камера + разрешения | BrowserStack, video injection | ночью / перед релизом |

> ⚠️ **Спайк перед закупкой:** BrowserStack заявляет video injection для iOS 13+, но документированный список перехватываемых API — фото-центричный (`AVCapturePhoto`, `UIImagePickerController`). Ваш пайплайн потребляет непрерывный `AVCaptureVideoDataOutput`. **Проверьте на триале, что именно этот поток перехватывается, до того как закладывать в бюджет.** Sauce Labs video injection не имеет вовсе — только изображения.
>
> Блокеры инъекции: iOS-приложения с Enterprise-сертификатом (нужен resign), Android с ProGuard/обфускацией.

### Фаза 7 — Нагрузка (неделя 6)

Профиль edtech — не равномерный трафик, а **пики**: 1 сентября, старт урока в :00, дедлайн ДЗ, начало экзамена.

```js
// tests/load/exam_spike.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // фон
    { duration: '30s', target: 5000 }, // ← пик: все заходят в 10:00
    { duration: '5m', target: 5000 },
    { duration: '2m', target: 100 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const res = http.get(`${__ENV.BASE_URL}/api/lesson/1/join`);
  check(res, { 'status 200': r => r.status === 200 });
}
```

- [ ] Отдельно нагрузить **эндпоинт приёма агрегатов SEduM** — он получает трафик от каждого активного ученика непрерывно. Это ваш самый нагруженный путь, и он же самый новый.
- [ ] k6 — AGPL-3.0. Для внутреннего тестирования это не проблема; отметьте в политике лицензий, если когда-нибудь встроите k6 в продукт.

### Фаза 8 — CI и подключение Claude Code (неделя 7)

**Рекомендация по CI:** у вас его пока нет — берите **GitHub Actions**, если нет требования держать всё внутри контура. Если требование есть (для edtech с ПДн детей в РФ — вероятно) — **self-hosted GitLab CI**. Стадии одинаковые.

```yaml
# .github/workflows/test.yml
name: tests
on: [pull_request]
jobs:
  fast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { lfs: true }              # фикстуры в LFS
      - run: npm ci && npx playwright install --with-deps
      - run: npm run test:golden          # vision, CPU
      - run: npm run test:api             # schemathesis
      - run: npx playwright test --grep-invert @slow

  privacy-gate:                           # ⭐ блокирующий
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { lfs: true }
      - run: npm ci && npx playwright install --with-deps chromium
      - run: npx playwright test --grep @privacy
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: privacy-report, path: playwright-report/ }
```

Ночной прогон: реальные устройства, кросс-браузер, GPU-делегат, нагрузка.

---

## 3. Подключение Claude Code («навыки»)

Это ответ на исходный вопрос — где именно живёт агент.

**Шаг 1. Playwright MCP**

```bash
claude mcp add playwright npx '@playwright/mcp@latest'
```

**Шаг 2. `CLAUDE.md` в корне репозитория** — конвенции, которые агент обязан соблюдать:

```markdown
# Конвенции тестирования Flamingo

- Селекторы: только `getByRole` / `getByTestId`. НИКОГДА не CSS/XPath.
- Ассерты SEduM: только на дискретный сигнал и UI. Никогда на float-координаты.
- Каждый новый тест SEduM обязан иметь golden-фикстуру в tests/fixtures/video/.
- Privacy-тесты помечать @privacy. Их нельзя ослаблять — только усиливать.
- Аутентификация — через storageState, не через UI-логин в тесте.
- Никаких waitForTimeout в продуктовых тестах, кроме privacy-наблюдения.
```

**Шаг 3. Проектные навыки в `.claude/skills/`** — три штуки закрывают рутину:

| Навык | Что делает |
|---|---|
| `add-e2e-test` | Пишет Playwright-тест по описанию сценария, соблюдая конвенции и матрицу ролей |
| `add-golden-fixture` | Готовит видео-фикстуру (ffmpeg + патч C420), регистрирует ожидаемые значения |
| `triage-failure` | Читает трейс упавшего теста, отличает флак от реального бага, предлагает фикс |

**Рабочий цикл:** Claude Code пишет тест → запускает → читает падение → чинит → коммитит. Ровно тот цикл, ради которого он и сделан. Cowork (здесь) остаётся для стратегии, отчётов и планов покрытия.

---

## 4. Стоимость: open-source vs коммерция

*Цены проверены у вендоров 21.07.2026. Перепроверьте перед закупкой — три вендора за год меняли структуру цен.*

### Что вообще нельзя сравнить по цене

| Инструмент | Цена |
|---|---|
| **Testsigma Cloud** | **Не публикуется.** Обе платные ступени — «Get Custom Pricing». Биллинг, судя по всему, за параллели |
| **Testim (Tricentis)** | **Не публикуется**, demo-gated. Агрегаторы называют ~$450/мес как точку входа; Vendr по сделкам Tricentis — $25–75k/год за 5–15 мест. Это оценки, а не котировки |

> Любую цифру по Testsigma Cloud / Testim с сайтов-агрегаторов **нельзя ставить в презентацию как факт**.

Отдельно: **Testsigma Community Edition — реально бесплатна** (Apache 2.0, self-hosted, github.com/testsigmahq/testsigma). Но грид вы поднимаете сами; облачные 2000+ устройств и AI-функции туда не входят.

### Что сравнимо: гриды (главный драйвер стоимости)

Платят не за пользователей, а за **параллельные сессии**.

| Грид | Кросс-браузер, за параллель/мес (годовая) | Реальные устройства |
|---|---|---|
| **TestMu AI** (бывш. LambdaTest) | **$79** | $199 |
| BrowserStack | $99 | ~$199 *(не подтверждено у вендора)* |
| Sauce Labs | $149 | $199 |

Цена реального устройства сошлась у всех троих к **~$199/параллель/мес** — это близко к рыночному равновесию, сильно ниже не сторгуетесь.

> ⚠️ Ловушка TestMu AI: тарифные треки **не кумулятивны**. Нужны и виртуальные, и реальные устройства — придётся брать Enterprise либо два тарифа.

### Рекомендуемая раскладка

| Позиция | Стоимость/год |
|---|---|
| Playwright + Maestro + Appium (Apache 2.0) | **$0** |
| k6 OSS + Grafana Cloud free (500 VUh/мес) | **$0** |
| Schemathesis | **$0** |
| Кросс-браузер: 4 параллели TestMu AI @$79 | **$3 792** |
| Реальные устройства: 1–2 параллели @$199 (когда мобилка поедет) | **$2 400 – 4 800** |
| CI compute (оценка) | **~$1 000 – 3 000** |
| **Итого** | **≈ $7 000 – 12 000** |

Против **$25 000 – 55 000/год** за Testim + грид — и при этом тест-активы остаются вашими и переносимыми.

### Когда коммерция всё-таки оправдана

Ровно один аргумент выдерживает проверку: **тесты пишут не инженеры.** Если сценарии создают ручные QA или предметные эксперты, codeless-платформа конвертирует их время в покрытие, и $20k+/год могут окупиться.

Не оправдана, когда: команда инженерная и маленькая ($25–50k = треть инженера, который ещё и фичи пишет); нужна переносимость (codeless-активы залочены на вендора); продукт до PMF и UI меняется еженедельно (никакой self-healing этого не спасает).

**Гриды — обратный случай: их брать нужно.** Строить свою ферму устройств на вашей стадии не надо.

**Решение:** open-source сейчас, вернуться к вопросу через 12–18 месяцев и только если наймёте неинженерных QA.

---

## 5. Матрица покрытия

| Риск | Слой | Гейт |
|---|---|---|
| Утечка сырой биометрии | Privacy-gate (Playwright) | **блокирующий** |
| Доступ к чужим данным (IDOR) | API + E2E, матрица ролей | **блокирующий** |
| Регресс vision-пайплайна | Golden-тесты, CPU | **блокирующий** (порог −3%) |
| Слом основного пути обучения | E2E web + mobile | блокирующий |
| Слом контракта API | Schemathesis + breaking-change | блокирующий |
| Падение под пиком | k6 | ночной / пред-релиз |
| Реальная камера на устройстве | BrowserStack | ночной |
| Доступность (школы) | `@axe-core/playwright` | предупреждение → блокирующий позже |

---

## 6. Definition of Done

Тест считается готовым, только если:

- [ ] Проходит 20 прогонов подряд без флака (`--repeat-each=20`).
- [ ] Не содержит `waitForTimeout` (кроме privacy-наблюдения).
- [ ] Селекторы — `getByRole`/`getByTestId`.
- [ ] Ассерты SEduM — на дискретный сигнал, не на float.
- [ ] Данные создаются и убираются самим тестом (изоляция).
- [ ] Падение теста понятно из сообщения без чтения кода.

---

## 7. Метрики здоровья

| Метрика | Цель |
|---|---|
| Flake rate | < 1% |
| Время быстрого сьюта на PR | < 10 мин |
| Покрытие критических путей E2E | 100% |
| Время от падения прода до golden-фикстуры | < 1 день |
| Privacy-gate | 100% зелёный, никогда не отключается |

---

## 8. Подводные камни

1. **Y4M и `C420mpeg2`** — Chrome падает на дефолтном выводе ffmpeg. Патч `sed` обязателен.
2. **Размер Y4M** — ~1 ГБ на 10 сек 1080p. Только 480p, только короткие, только Git LFS.
3. **Safari/WebKit** — инъекции камеры нет. Ручное или реальное устройство.
4. **Android emulator** — камера часто падает в 640×480 и медленно инициализируется; первый init заворачивайте в щедрый таймаут.
5. **GPU-делегат MediaPipe** — недетерминирован и молча падает на CPU. В CI только CPU.
6. **Политика флака:** упавший дважды подряд тест либо чинится в тот же день, либо помечается `@quarantine` и уходит из блокирующего сьюта — но с заведённой задачей. Молча отключать нельзя, «красный CI как норма» убивает всю систему за месяц.
7. **Не ассертить FPS/тайминги в CI** — раннеры шумные.

---

## Источники

**Камера и браузеры**
- [WebRTC Testing — флаги Chromium](https://webrtc.github.io/webrtc-org/testing/)
- [Y4M для Chrome: патч C420](https://cyara.com/blog/y4m-video-chrome/)
- [Playwright #5444 — getUserMedia в WebKit/Firefox](https://github.com/microsoft/playwright/issues/5444)
- [Android Emulator — поддержка камеры](https://developer.android.com/studio/run/emulator-use-camera)
- [Apple — тестирование в Simulator против устройств](https://developer.apple.com/documentation/xcode/testing-in-simulator-versus-testing-on-hardware-devices)

**Гриды**
- [BrowserStack — camera image injection](https://www.browserstack.com/docs/app-automate/appium/advanced-features/camera-image-injection)
- [BrowserStack — video injection](https://www.browserstack.com/docs/app-automate/appium/video-injection)
- [Sauce Labs — camera image injection (только изображения)](https://docs.saucelabs.com/mobile-apps/features/camera-image-injection/)

**Цены**
- [Testsigma Pricing](https://testsigma.com/pricing) · [Testsigma CE (Apache 2.0)](https://github.com/testsigmahq/testsigma/blob/dev/LICENSE)
- [Tricentis / Testim — Vendr](https://www.vendr.com/marketplace/tricentis)
- [BrowserStack Pricing](https://www.browserstack.com/pricing?product=automate) · [Sauce Labs Pricing](https://saucelabs.com/pricing) · [TestMu AI Pricing](https://www.testmuai.com/pricing)
- [Grafana Cloud k6](https://grafana.com/products/cloud/k6/)

**Тестирование ML/CV и API**
- [CameraX — тестирование и мокирование (Android)](https://developer.android.com/agents/skills/camera/camerax/references/testing)
- [MediaPipe #4711 — делегат GPU молча уходит в XNNPACK](https://github.com/google/mediapipe/issues/4711)
- [Schemathesis](https://schemathesis.readthedocs.io/) · [Pact vs OpenAPI](https://www.speakeasy.com/blog/pact-vs-openapi/)

**Мобильные**
- [Maestro Docs](https://docs.maestro.dev/) · [Maestro vs Appium (2026)](https://revyl.com/blog/maestro-vs-appium/)
