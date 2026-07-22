import { test, expect } from '@playwright/test';
import {
  env, testIds, rawBiometricMarkers, allowedSedumEndpoints,
} from '../config/flamingo';

/**
 * ⭐ PRIVACY-GATE — блокирующий тест.
 *
 * Проверяет ключевое обещание Flamingo: сырые биометрические данные
 * не покидают устройство ученика; на сервер уходят только агрегаты.
 *
 * Это одновременно:
 *   1) защита от регрессии,
 *   2) воспроизводимый комплаенс-артефакт под 152-ФЗ
 *      (отчёт прогона сохраняется в CI с датой и хешем коммита).
 *
 * ЭТОТ ТЕСТ НЕЛЬЗЯ ОСЛАБЛЯТЬ. Его можно только усиливать.
 */
test.describe('@privacy Приватность SEduM', () => {
  test('сырая биометрия не покидает устройство', async ({ page }) => {
    const violations: string[] = [];

    const inspect = (channel: string, url: string, contentType: string, body: string | null) => {
      // Интересует только трафик на наш бэкенд
      if (!url.startsWith(env.backendOrigin)) return;

      // 1. Бинарные payload'ы (кадры, видео) недопустимы в принципе
      if (/^(image|video)\//i.test(contentType) || /application\/octet-stream/i.test(contentType)) {
        violations.push(`[${channel}] Бинарный payload → ${url} (content-type: ${contentType})`);
      }

      if (!body) return;
      const lower = body.toLowerCase();

      // 2. Маркеры сырых биометрических признаков
      for (const marker of rawBiometricMarkers) {
        if (lower.includes(marker.toLowerCase())) {
          violations.push(`[${channel}] Маркер сырой биометрии "${marker}" → ${url}`);
        }
      }

      // 3. Размер: агрегат обязан быть маленьким. Большой payload = подозрение на кадры.
      if (body.length > env.maxAggregateBytes) {
        violations.push(
          `[${channel}] Payload ${body.length} Б > лимита ${env.maxAggregateBytes} Б → ${url}`,
        );
      }
    };

    // HTTP
    page.on('request', req => {
      inspect('http', req.url(), req.headers()['content-type'] ?? '', req.postData());
    });

    // WebSocket — агрегаты часто идут именно сюда. Про этот канал обычно забывают.
    page.on('websocket', ws => {
      ws.on('framesent', frame => {
        inspect('ws', ws.url(), 'application/json', String(frame.payload));
      });
    });

    await page.goto('/');
    await page.getByTestId(testIds.startLessonButton).first().click();
    await expect(page.getByTestId(testIds.sedumSession)).toBeVisible();

    // Наблюдаем за реальным потоком данных
    await page.waitForTimeout(env.privacyObserveMs);

    expect(
      violations,
      `Обнаружены утечки сырой биометрии:\n${violations.join('\n')}`,
    ).toEqual([]);
  });

  test('SEduM обращается только к разрешённым эндпоинтам', async ({ page }) => {
    const unexpected: string[] = [];

    page.on('request', req => {
      const url = req.url();
      if (!url.startsWith(env.backendOrigin)) return;
      if (req.method() === 'GET') return;               // интересует исходящая запись

      const pathname = new URL(url).pathname;
      const isSedum = pathname.includes('sedum') || pathname.includes('analytics');
      if (!isSedum) return;

      if (!allowedSedumEndpoints.some(a => pathname.startsWith(a))) {
        unexpected.push(`${req.method()} ${pathname}`);
      }
    });

    await page.goto('/');
    await page.getByTestId(testIds.startLessonButton).first().click();
    await page.waitForTimeout(env.privacyObserveMs);

    expect(
      unexpected,
      `SEduM пишет в незадекларированные эндпоинты:\n${unexpected.join('\n')}`,
    ).toEqual([]);
  });

  test('без согласия SEduM не отправляет ничего', async ({ page, context }) => {
    await context.clearCookies();
    let sentAnything = false;

    page.on('request', req => {
      const url = req.url();
      if (url.startsWith(env.backendOrigin) && url.includes('sedum') && req.method() !== 'GET') {
        sentAnything = true;
      }
    });

    await page.goto('/');
    const consent = page.getByTestId(testIds.consentDialog);
    if (await consent.isVisible().catch(() => false)) {
      await page.getByTestId(testIds.consentDeclineButton).click();
    }
    await page.waitForTimeout(10_000);

    expect(sentAnything, 'SEduM отправлял данные до/без получения согласия').toBe(false);
  });
});
