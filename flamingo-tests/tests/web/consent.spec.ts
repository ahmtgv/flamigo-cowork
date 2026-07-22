import { test, expect } from '@playwright/test';
import { testIds } from '../config/flamingo';

/**
 * Согласие законного представителя — юридический блокер запуска SEduM.
 * По 152-ФЗ несовершеннолетний не может дать согласие сам.
 */
test.describe('Согласие на обработку данных', () => {
  test('SEduM не стартует без согласия', async ({ page }) => {
    await page.goto('/');

    const consent = page.getByTestId(testIds.consentDialog);
    await expect(consent, 'Диалог согласия не показан до старта SEduM').toBeVisible();

    await page.getByTestId(testIds.consentDeclineButton).click();
    await expect(page.getByTestId(testIds.sedumSession)).toBeHidden();
  });

  test('после согласия SEduM доступен и виден индикатор приватности', async ({ page }) => {
    await page.goto('/');
    const consent = page.getByTestId(testIds.consentDialog);
    if (await consent.isVisible().catch(() => false)) {
      await page.getByTestId(testIds.consentAcceptButton).click();
    }
    await page.getByTestId(testIds.startLessonButton).first().click();
    await expect(page.getByTestId(testIds.sedumSession)).toBeVisible();
    await expect(page.getByTestId(testIds.privacyIndicator)).toBeVisible();
  });

  test('согласие можно отозвать', async ({ page }) => {
    await page.goto('/settings/privacy');
    const revoke = page.getByRole('button', { name: /отозвать|отключить/i });
    await expect(revoke, 'Нет способа отозвать согласие — нарушение требований').toBeVisible();
  });
});
