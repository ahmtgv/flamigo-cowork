import { test, expect } from '@playwright/test';
import { testIds } from '../config/flamingo';

test.describe('Путь преподавателя', () => {
  test('проверка работы → выставление оценки → публикация', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId(testIds.submissionsList)).toBeVisible();
    await page.getByTestId(testIds.submissionsList).getByRole('listitem').first().click();

    await page.getByTestId(testIds.gradeInput).fill('5');
    await page.getByTestId(testIds.publishGradeButton).click();

    await expect(page.getByTestId(testIds.assignmentStatus)).toContainText(/оцен/i);
  });
});
