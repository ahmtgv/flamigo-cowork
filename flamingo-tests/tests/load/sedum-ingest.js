import http from 'k6/http';
import { check } from 'k6';

/**
 * Самый нагруженный и самый НОВЫЙ путь: приём агрегатов SEduM.
 * Каждый активный ученик шлёт агрегат непрерывно всю сессию.
 *
 * Здесь проверяем именно устойчивость ingest-эндпоинта под постоянным потоком.
 */
export const options = {
  scenarios: {
    steady_stream: {
      executor: 'constant-arrival-rate',
      rate: 2000,              // агрегатов в секунду
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 500,
      maxVUs: 3000,
    },
  },
  thresholds: {
    http_req_failed:   ['rate<0.005'],
    http_req_duration: ['p(95)<300'],
  },
};

const BASE = __ENV.BASE_URL;

// Реалистичный агрегат: маленький, без сырой биометрии
const payload = JSON.stringify({
  sessionId: 'load-test',
  windowStart: Date.now(),
  windowSec: 10,
  attentionRatio: 0.82,
  awayEvents: 1,
  eyesClosedSec: 0.4,
});

export default function () {
  const res = http.post(`${BASE}/api/sedum/aggregate`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { 'агрегат принят': r => r.status === 200 || r.status === 202 });
}
