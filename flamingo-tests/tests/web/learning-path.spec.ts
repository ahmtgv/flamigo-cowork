import { test, expect } from '@playwright/test';
import { testIds } from '../config/flamingo';

/** Основной денежный путь: запись на курс → урок → сдача задания. */
test.describe('Путь ученика', () => {
  test('запись на курс → прохождение урока → сдача задания', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId(testIds.courseCard).first().click();
    await page.getByTestId(testIds.enrollButton).click();

    await page.getByTestId(testIds.startLessonButton).first().click();
    await expect(page.getByTestId(testIds.lessonPlayer)).toBeVisible();

    await page.getByTestId(testIds.submitAssignmentButton).click();
    await expect(page.getByTestId(testIds.assignmentStatus)).toContainText(/отправлен|на проверке/i);
  });

  test('@slow повторный вход сохраняет прогресс', async ({ page }) => {
    await page.goto('/');
    const status = page.getByTestId(testIds.assignmentStatus);
    await expect(status).toBeVisible();
    const before = await status.textContent();

    await page.reload();
    await expect(status).toHaveText(before ?? '');
  });
});
