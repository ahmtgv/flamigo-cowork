import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Профиль нагрузки edtech — не равномерный трафик, а ПИКИ:
 * 1 сентября, старт урока в :00, дедлайн ДЗ, начало экзамена.
 *
 * Запуск: k6 run -e BASE_URL=https://stage... tests/load/exam-spike.js
 */
export const options = {
  stages: [
    { duration: '2m',  target: 100 },   // фон
    { duration: '30s', target: 5000 },  // ← пик: все заходят одновременно в 10:00
    { duration: '5m',  target: 5000 },  // удержание
    { duration: '2m',  target: 100 },   // спад
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
  },
};

const BASE = __ENV.BASE_URL;

export default function () {
  const join = http.get(`${BASE}/api/lesson/1/join`);
  check(join, { 'вход в урок 200': r => r.status === 200 });
  sleep(1);
}
