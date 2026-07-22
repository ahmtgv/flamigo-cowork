import { test, expect } from '@playwright/test';
import { testIds, attentionLabels } from '../config/flamingo';

/**
 * Детерминированные тесты SEduM.
 * Камера подменена фикстурой looking_away_15s.y4m (см. playwright.config.ts).
 *
 * ПРАВИЛО: ассертим ДИСКРЕТНОЕ состояние и UI-последствие.
 * Никогда не ассертим float-значения (yaw=17.3°) — это гарантированный флак.
 */
test.describe('SEduM: анализ вовлечённости', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(testIds.startLessonButton).first().click();
    await expect(page.getByTestId(testIds.sedumSession)).toBeVisible();
  });

  test('отвод взгляда переводит индикатор в состояние «Отвлечён»', async ({ page }) => {
    await expect(page.getByTestId(testIds.attentionBadge))
      .toHaveText(attentionLabels.away, { timeout: 20_000 });
  });

  test('индикатор приватности виден на протяжении всей сессии', async ({ page }) => {
    // Ученик и родитель всегда должны видеть, что камера активна
    await expect(page.getByTestId(testIds.privacyIndicator)).toBeVisible();
    await page.waitForTimeout(5_000);
    await expect(page.getByTestId(testIds.privacyIndicator)).toBeVisible();
  });

  test('сессия не падает при работе камеры 30 секунд', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(30_000);
    await expect(page.getByTestId(testIds.sedumSession)).toBeVisible();
    expect(errors, `Ошибки в консоли:\n${errors.join('\n')}`).toEqual([]);
  });
});
