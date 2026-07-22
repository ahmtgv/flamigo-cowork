import { test, expect } from '@playwright/test';
import { testIds, fatigueHintText, sedumFixtureProjects } from '../config/flamingo';

/**
 * Углублённый SEduM — по одному проекту на видео-фикстуру
 * (camera-флаги задаются в playwright.config.ts на уровне проекта).
 * Тест читает project.name → берёт ожидаемое ДИСКРЕТНОЕ состояние из конфига.
 *
 * Ассертим только дискретные состояния и UI. Никаких float.
 */
test.describe('SEduM: состояния по фикстурам', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const consent = page.getByTestId(testIds.consentDialog);
    if (await consent.isVisible().catch(() => false)) {
      await page.getByTestId(testIds.consentAcceptButton).click();
    }
    await page.getByTestId(testIds.startLessonButton).first().click();
    await expect(page.getByTestId(testIds.sedumSession)).toBeVisible();
  });

  test('корректное дискретное состояние внимания', async ({ page }, testInfo) => {
    const c = sedumFixtureProjects[testInfo.project.name];
    test.skip(!c, 'Проект не сопоставлен с SEduM-фикстурой');

    if (c.noFace) {
      // Кадр без лица: сессия не падает, состояние — «Лицо не видно»
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(e.message));
      await expect(page.getByTestId(testIds.attentionBadge)).toHaveText(c.expect, { timeout: 20_000 });
      expect(errors, `Краш на кадре без лица:\n${errors.join('\n')}`).toEqual([]);
    } else {
      await expect(page.getByTestId(testIds.attentionBadge)).toHaveText(c.expect, { timeout: 20_000 });
    }
  });

  test('подсказка об усталости появляется только на закрытых глазах', async ({ page }, testInfo) => {
    const c = sedumFixtureProjects[testInfo.project.name];
    test.skip(!c, 'нет фикстуры');
    const hint = page.getByTestId(testIds.fatigueHint);
    if (c.fatigue) {
      await expect(hint).toBeVisible({ timeout: 20_000 });
      await expect(hint).toContainText(fatigueHintText);
    } else {
      // На «внимателен»/«отвлёкся» подсказки усталости быть не должно
      await page.waitForTimeout(5_000);
      await expect(hint).toBeHidden();
    }
  });
});

test.describe('SEduM: устойчивость и приватность в динамике', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const consent = page.getByTestId(testIds.consentDialog);
    if (await consent.isVisible().catch(() => false)) {
      await page.getByTestId(testIds.consentAcceptButton).click();
    }
    await page.getByTestId(testIds.startLessonButton).first().click();
    await expect(page.getByTestId(testIds.sedumSession)).toBeVisible();
  });

  test('пауза сессии останавливает отправку данных', async ({ page }) => {
    let sentDuringPause = false;
    await page.getByTestId(testIds.pauseSessionButton).click();

    page.on('request', req => {
      if (req.url().includes('/sedum/') && req.method() !== 'GET') sentDuringPause = true;
    });
    await page.waitForTimeout(8_000);

    expect(sentDuringPause, 'SEduM продолжал слать данные на паузе').toBe(false);
    await expect(page.getByTestId(testIds.privacyIndicator)).toBeHidden();
  });

  test('индикатор приватности виден всю активную сессию', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await expect(page.getByTestId(testIds.privacyIndicator)).toBeVisible();
      await page.waitForTimeout(3_000);
    }
  });

  test('лонгитюдный тренд доступен и подаётся как тренд, не диагноз', async ({ page }) => {
    await page.goto('/cabinet');
    const trend = page.getByTestId(testIds.sedumTrend);
    await expect(trend).toBeVisible();
    // Формулировки-«диагнозы» недопустимы (этическая рамка проекта)
    const forbidden = ['диагноз', 'неспособен', 'не способен', 'СДВГ', 'отсталость'];
    const text = ((await trend.textContent()) ?? '').toLowerCase();
    for (const w of forbidden) {
      expect(text, `Тренд содержит недопустимую формулировку «${w}»`).not.toContain(w.toLowerCase());
    }
  });
});

test.describe('SEduM: обработка отказа камеры', () => {
  test('при запрете камеры урок доступен без SEduM, с понятным уведомлением', async ({ browser }) => {
    // Контекст БЕЗ разрешения на камеру
    const ctx = await browser.newContext({
      storageState: 'tests/.auth/student.json',
      permissions: [],
    });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.getByTestId(testIds.startLessonButton).first().click();

    // Урок должен работать; SEduM — деградирует мягко, а не ломает страницу
    await expect(page.getByTestId(testIds.lessonPlayer)).toBeVisible();
    await expect(page.getByTestId(testIds.cameraDeniedNotice)).toBeVisible();
    await ctx.close();
  });
});
