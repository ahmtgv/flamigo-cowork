import { defineConfig, devices } from '@playwright/test';
import { sedumFixtureProjects } from './tests/config/flamingo';
import path from 'path';
import fs from 'fs';

// Локально подхватываем .env без лишних зависимостей
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const fixture = (name: string) =>
  path.resolve(__dirname, 'tests/fixtures/video', name);

/** Флаги подмены камеры для детерминированных тестов SEduM. */
const fakeCameraArgs = (videoFile: string) => [
  '--use-fake-ui-for-media-stream',      // авто-разрешение камеры
  '--use-fake-device-for-media-stream',
  `--use-file-for-fake-video-capture=${fixture(videoFile)}`,
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,           // 1 ретрай ловит инфраструктурный шум, но не маскирует баги
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [['html'], ['github'], ['list']]
    : [['html'], ['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },

  projects: [
    // 1. Логинимся один раз на каждую роль
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // 2. Обычные E2E под ролями
    {
      name: 'student',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/student.json' },
      dependencies: ['setup'],
      // Явный список: иначе проект подхватит чужие спеки и прогонит их под неверной ролью
      testMatch: [/learning-path\.spec\.ts/, /consent\.spec\.ts/, /student-cabinet\.spec\.ts/],
    },
    {
      name: 'teacher',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/teacher.json' },
      dependencies: ['setup'],
      testMatch: /teacher-path\.spec\.ts/,
    },
    {
      name: 'permissions',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /permissions-idor\.spec\.ts/,
    },

    // 3. SEduM с подменённой камерой (фикстура «отвлёкся»)
    {
      name: 'sedum-chromium',
      dependencies: ['setup'],
      testMatch: /sedum-camera\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/student.json',
        permissions: ['camera'],
        launchOptions: { args: fakeCameraArgs('looking_away_15s.y4m') },
      },
    },

    // 4. ⭐ Privacy-gate — блокирующий. Камера «внимателен», чтобы шёл реальный поток данных.
    {
      name: 'privacy-gate',
      dependencies: ['setup'],
      testMatch: /privacy-gate\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/student.json',
        permissions: ['camera'],
        launchOptions: { args: fakeCameraArgs('attentive_15s.y4m') },
      },
    },

    // 5. Доступность
    {
      name: 'a11y',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/student.json' },
      dependencies: ['setup'],
      testMatch: /a11y\.spec\.ts/,
    },

    // Аккаунт и вход (часть сценариев гостевые — чистим состояние внутри теста)
    {
      name: 'account',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/student.json' },
      dependencies: ['setup'],
      testMatch: /auth-account\.spec\.ts/,
    },
    // Админ / преподаватель
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/admin.json' },
      dependencies: ['setup'],
      testMatch: /admin-teacher\.spec\.ts/,
    },
    // SEduM: по проекту на каждую видео-фикстуру (см. sedumFixtureProjects — единый источник правды)
    ...Object.entries(sedumFixtureProjects).map(([name, c]) => ({
      name,
      dependencies: ['setup'],
      testMatch: /sedum-deep\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/student.json',
        permissions: ['camera'],
        launchOptions: { args: fakeCameraArgs(c.file) },
      },
    })),

    // 6. Адаптив/фолды для БРАУЗЕРНОЙ версии (базовое покрытие).
    // Глубокое тестирование постуры на нативных планшетах — отдельно (ADB fold/unfold).
    {
      name: 'tablet-landscape',
      use: { ...devices['iPad Pro 11 landscape'], storageState: 'tests/.auth/student.json' },
      dependencies: ['setup'],
      testMatch: /responsive\.spec\.ts/,
    },
    {
      name: 'foldable-folded',      // внешний экран сложенного устройства
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 673, height: 841 },
        storageState: 'tests/.auth/student.json',
      },
      dependencies: ['setup'],
      testMatch: /responsive\.spec\.ts/,
    },
    {
      name: 'foldable-unfolded',    // внутренний экран (Galaxy Z Fold / Pixel Fold)
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1812, height: 2176 },
        storageState: 'tests/.auth/student.json',
      },
      dependencies: ['setup'],
      testMatch: /responsive\.spec\.ts/,
    },
  ],
});
