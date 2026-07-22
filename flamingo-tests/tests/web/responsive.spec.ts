import { test, expect } from '@playwright/test';
import { testIds } from '../config/flamingo';

/**
 * Базовое покрытие адаптивной вёрстки и фолдов для БРАУЗЕРНОЙ версии.
 * Viewport задаётся проектом в playwright.config.ts (tablet / folded / unfolded).
 *
 * Глубокое тестирование смены постуры на нативных планшетах — отдельно,
 * через ADB fold/unfold (см. PLATFORM_TEST_MATRIX.md). Здесь — smoke.
 */
test.describe('Адаптивная вёрстка', () => {
  const screens = ['/', '/courses', '/lesson/1', '/settings/privacy'];

  for (const url of screens) {
    test(`${url}: рендерится без горизонтального переполнения`, async ({ page }) => {
      await page.goto(url);
      // Контент не должен «вылезать» за ширину экрана (частый баг на узких/сложенных)
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `Горизонтальное переполнение ${overflow}px на ${url}`).toBeLessThanOrEqual(2);

      // Навигация доступна на любом размере (гамбургер или полное меню)
      await expect(page.getByTestId(testIds.userMenu)).toBeVisible();
    });
  }

  test('индикатор приватности SEduM виден и на сложенном экране', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(testIds.startLessonButton).first().click();
    await expect(page.getByTestId(testIds.privacyIndicator)).toBeVisible();
  });
});

test.describe('Непрерывность при fold/unfold (эмуляция resize)', () => {
  test('состояние урока сохраняется при перестроении экрана', async ({ page }) => {
    await page.goto('/lesson/1');
    await expect(page.getByTestId(testIds.lessonPlayer)).toBeVisible();

    // «Разложили» планшет: узкий → широкий внутренний экран
    await page.setViewportSize({ width: 673, height: 841 });   // сложен (cover)
    await page.waitForTimeout(300);                            // время на reflow
    await page.setViewportSize({ width: 1812, height: 2176 }); // разложен (Fold inner)
    await page.waitForTimeout(300);

    // После перестроения пользователь остаётся в том же уроке (continuity)
    await expect(page.getByTestId(testIds.lessonPlayer)).toBeVisible();
    await expect(page.getByTestId(testIds.sedumSession).or(page.getByTestId(testIds.startLessonButton)))
      .toBeVisible();
  });
});
