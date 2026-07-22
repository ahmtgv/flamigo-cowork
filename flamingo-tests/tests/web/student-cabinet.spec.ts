import { test, expect } from '@playwright/test';
import { testIds } from '../config/flamingo';

// Прим.: спец гоняется в проекте student (storageState ученика)
test.describe('Учебный кабинет ученика', () => {
  test('дашборд показывает прогресс, расписание и материалы', async ({ page }) => {
    await page.goto('/cabinet');
    await expect(page.getByTestId(testIds.cabinetDashboard)).toBeVisible();
    await expect(page.getByTestId(testIds.progressWidget)).toBeVisible();
    await expect(page.getByTestId(testIds.scheduleWidget)).toBeVisible();
    await expect(page.getByTestId(testIds.materialsList)).toBeVisible();
  });

  test('«продолжить обучение» ведёт к последнему уроку', async ({ page }) => {
    await page.goto('/cabinet');
    await page.getByTestId(testIds.continueLearningButton).click();
    await expect(page.getByTestId(testIds.lessonPlayer)).toBeVisible();
  });

  test('кабинет не показывает данные других учеников', async ({ page }) => {
    await page.goto('/cabinet');
    // На дашборде не должно быть чужих имён/идентификаторов
    const foreign = process.env.STUDENT_2_ID ?? '';
    if (foreign) {
      await expect(page.getByText(foreign)).toHaveCount(0);
    }
  });
});
