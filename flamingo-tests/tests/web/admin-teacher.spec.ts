import { test, expect } from '@playwright/test';
import { testIds } from '../config/flamingo';

/** Гоняется в проекте admin (storageState админа). */
test.describe('Панель администратора', () => {
  test('доступ к управлению курсами, группами, учениками', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByTestId(testIds.adminPanel)).toBeVisible();
    await expect(page.getByTestId(testIds.manageCoursesButton)).toBeVisible();
    await expect(page.getByTestId(testIds.manageGroupsButton)).toBeVisible();
    await expect(page.getByTestId(testIds.studentsTable)).toBeVisible();
  });

  test('отчёты SEduM показывают агрегаты, а не сырые данные', async ({ page }) => {
    await page.goto('/admin/reports');
    await expect(page.getByTestId(testIds.reportsPanel)).toBeVisible();
    // В отчётах не должно быть намёка на сырую биометрию/кадры
    const body = (await page.getByTestId(testIds.reportsPanel).textContent())?.toLowerCase() ?? '';
    for (const w of ['landmark', 'кадр', 'blendshape', 'сырые']) {
      expect(body, `В отчёте видна сырая биометрия: «${w}»`).not.toContain(w);
    }
  });

  test('экспорт данных доступен админу', async ({ page }) => {
    await page.goto('/admin/reports');
    await expect(page.getByTestId(testIds.exportDataButton)).toBeVisible();
  });
});
