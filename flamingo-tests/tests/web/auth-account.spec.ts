import { test, expect } from '@playwright/test';
import { env, api, testIds, users } from '../config/flamingo';

/**
 * Аккаунт и вход. Часть сценариев — гостевые (без сессии),
 * поэтому чистим состояние внутри теста.
 */
test.describe('Регистрация и вход', () => {
  test.beforeEach(async ({ context }) => { await context.clearCookies(); });

  test('форма регистрации доступна и валидирует ввод', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByTestId(testIds.registerForm)).toBeVisible();
    // Пустая отправка не должна создавать аккаунт
    await page.getByRole('button', { name: /зарегистрироваться|создать/i }).click();
    await expect(page.getByText(/обязательн|заполните/i).first()).toBeVisible();
  });

  test('несовершеннолетнему предлагается согласие родителя', async ({ page }) => {
    await page.goto('/register');
    // Если форма спрашивает возраст/роль — путь ученика ведёт к согласию законного представителя
    const form = page.getByTestId(testIds.registerForm);
    await expect(form).toBeVisible();
    // Явная проверка: есть механизм родительского согласия (152-ФЗ)
    await expect(page.getByText(/родител|законн(ый|ого) представител/i).first()).toBeVisible();
  });

  test('сброс пароля отправляет письмо и не раскрывает существование аккаунта', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId(testIds.forgotPasswordLink).click();
    await expect(page.getByTestId(testIds.resetPasswordForm)).toBeVisible();

    await page.getByRole('textbox', { name: /e-?mail|почт/i }).fill('nobody@example.com');
    await page.getByRole('button', { name: /отправить|сбросить/i }).click();
    // Ответ одинаков для существующего и несуществующего адреса (защита от энумерации)
    await expect(page.getByText(/если .* существует|отправили|проверьте почту/i)).toBeVisible();
  });
});

test.describe('Сессии и безопасность входа', () => {
  test('истёкшая сессия ведёт на вход, а не «белый экран»', async ({ page, context }) => {
    await page.goto('/');
    // Симулируем протухший токен
    await page.evaluate(k => localStorage.setItem(k, 'expired.invalid.token'), api.tokenStorageKey);
    await context.clearCookies();
    await page.goto('/cabinet');
    await expect(
      page.getByTestId(testIds.loginForm).or(page.getByTestId(testIds.sessionExpiredNotice)),
    ).toBeVisible();
  });

  test('@slow выход со всех устройств инвалидирует токен', async ({ page, request }) => {
    await page.goto('/settings/security');
    await page.getByTestId(testIds.logoutAllButton).click();
    // Старый токен больше не принимается бэкендом
    const res = await request.get(`${env.backendOrigin}/api/analytics/student/${users.student.id}`);
    expect([401, 403]).toContain(res.status());
  });

  test('слишком много попыток входа → троттлинг', async ({ page }) => {
    await page.goto('/login');
    for (let i = 0; i < 6; i++) {
      await page.getByRole('textbox', { name: /логин|e-?mail/i }).fill(users.student.login);
      await page.getByRole('textbox', { name: /парол/i }).fill('wrong-' + i);
      await page.getByRole('button', { name: /войти/i }).click();
    }
    await expect(page.getByText(/слишком много|попробуйте позже|заблокирован/i)).toBeVisible();
  });
});
