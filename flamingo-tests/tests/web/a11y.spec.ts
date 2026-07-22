import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Доступность. Для школьной аудитории (и госзакупок) это часто формальное требование.
 * Пока — предупреждающий режим на serious/critical; ужесточить после первой чистки.
 */
const pages = ['/', '/courses', '/lesson/1', '/settings/privacy'];

for (const url of pages) {
  test(`a11y: ${url}`, async ({ page }) => {
    await page.goto(url);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? ''));
    const report = serious.map(v => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} узл.`).join('\n');
    expect(serious, `Серьёзные нарушения доступности на ${url}:\n${report}`).toEqual([]);
  });
}
