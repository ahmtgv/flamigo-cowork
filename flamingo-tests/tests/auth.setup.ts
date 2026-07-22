import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ROLES, users, env, api, authMode, demoRolePath, testIds } from './config/flamingo';

const authDir = path.resolve(__dirname, '.auth');

for (const role of ROLES) {
  setup(`аутентификация: ${role}`, async ({ page, request }) => {
    fs.mkdirSync(authDir, { recursive: true });
    const statePath = path.join(authDir, `${role}.json`);

    // Demo-режим: бэкенда нет, роль задаётся ссылкой /r/<role>
    if (authMode === 'demo') {
      await page.goto(demoRolePath(role));
      await page.evaluate(r => localStorage.setItem('demo_role', r), role);
      await page.context().storageState({ path: statePath });
      return;
    }

    const res = await request.post(`${env.backendOrigin}${api.login}`, {
      data: { login: users[role].login, password: env.password },
    });
    expect(res.ok(), `Логин ${role} провалился: ${res.status()} ${await res.text()}`).toBeTruthy();

    if (authMode === 'cookie') {
      // Сессия в cookie — состояния request-контекста достаточно
      await request.storageState({ path: statePath });
      return;
    }

    // authMode === 'token': токен нужно положить в localStorage браузера.
    // ВАЖНО: request.storageState() сохраняет ТОЛЬКО cookies и молча потеряет токен.
    const body = await res.json();
    const token = body[api.tokenResponseField];
    expect(token, `В ответе логина нет поля "${api.tokenResponseField}"`).toBeTruthy();

    await page.goto('/');   // нужен origin, иначе localStorage недоступен
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key, value),
      [api.tokenStorageKey, token] as const,
    );

    // Убеждаемся, что приложение действительно считает нас авторизованными
    await page.reload();
    await expect(
      page.getByTestId(testIds.userMenu),
      'После установки токена приложение не показало меню пользователя',
    ).toBeVisible();

    await page.context().storageState({ path: statePath });
  });
}
