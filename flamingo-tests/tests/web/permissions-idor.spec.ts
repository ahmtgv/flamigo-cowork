import { test, expect, request as pwRequest } from '@playwright/test';
import { env, permissionMatrix, users, foreignStudentId } from '../config/flamingo';

/**
 * Матрица прав доступа.
 *
 * Для платформы с данными несовершеннолетних это не «security nice-to-have»,
 * а базовое требование: ученик не должен получать данные другого ученика
 * ни при каких обстоятельствах.
 *
 * Добавляйте строку в permissionMatrix при КАЖДОМ новом эндпоинте.
 */
test.describe('Права доступа и IDOR', () => {
  for (const c of permissionMatrix) {
    test(`${c.role}: ${c.name}`, async () => {
      const ctx = await pwRequest.newContext({
        baseURL: env.backendOrigin,
        storageState: `tests/.auth/${c.role}.json`,
      });

      const url = c.path({ foreign: foreignStudentId, own: users[c.role].id });
      const res = await ctx.fetch(url, { method: c.method, data: c.method === 'GET' ? undefined : {} });

      const allowed = Array.isArray(c.expect) ? c.expect : [c.expect];
      expect(
        allowed,
        `${c.method} ${url} вернул ${res.status()}, ожидали один из [${allowed.join(', ')}]`,
      ).toContain(res.status());

      // Отдельная проверка: отказ не должен «протекать» данными
      if (res.status() >= 400) {
        const text = (await res.text()).toLowerCase();
        expect(text, 'Тело ошибки содержит чужой идентификатор — утечка').not.toContain(
          foreignStudentId.toLowerCase(),
        );
      }
      await ctx.dispose();
    });
  }
});
