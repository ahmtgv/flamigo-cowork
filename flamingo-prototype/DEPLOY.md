# Деплой прототипа: Cloudflare Pages + домен flamingo.plus (GoDaddy)

Домен `flamingo.plus` куплен на GoDaddy. Хостинг — Cloudflare Pages (бесплатно,
безлимитный трафик, HTTPS, пароль на сайт через Access).

## Шаг 1. Репозиторий
1. Запушить `flamingo-prototype/` в отдельный git-репозиторий (GitHub/GitLab).

## Шаг 2. Cloudflare Pages
1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Выбрать репозиторий. Настройки сборки:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Deploy. Появится адрес вида `flamingo-prototype.pages.dev`.

## Шаг 3. Домен flamingo.plus → Cloudflare
Самый надёжный путь — перенести DNS домена в Cloudflare:
1. Cloudflare → **Add a site** → `flamingo.plus` (Free plan).
2. Cloudflare покажет **2 своих nameserver'а** (вида `xxx.ns.cloudflare.com`).
3. В **GoDaddy → My Products → flamingo.plus → DNS → Nameservers → Change** →
   вписать nameserver'ы Cloudflare. (Распространение — до нескольких часов.)
4. В Pages → проект → **Custom domains → Set up a domain** → `flamingo.plus`
   (и при желании `www.flamingo.plus`). Cloudflare сам создаст записи и выпустит SSL.

> Альтернатива без смены nameserver'ов (оставляя DNS на GoDaddy): в GoDaddy
> добавить CNAME `www` → `flamingo-prototype.pages.dev` и redirect для корня.
> Смена nameserver'ов надёжнее и даёт бесплатный Access.

## Шаг 4. Пароль на сайт (обязательно для DEMO)
1. Cloudflare → **Zero Trust → Access → Applications → Add → Self-hosted**.
2. Домен: `flamingo.plus`. Политика: разрешить конкретные e-mail (ваша команда/инвесторы),
   или One-time PIN. Это закрывает demo от случайных посетителей и поисковиков.

## Шаг 5. Проверка
- `https://flamingo.plus` открывается, виден баннер DEMO.
- `curl -sI https://flamingo.plus | grep -i robots` → `X-Robots-Tag: noindex`.
- Роли: `https://flamingo.plus/r/student` и т.д.
- Тесты: `cd flamingo-tests && BASE_URL=https://flamingo.plus npm run test:demo`
  (если включён Access — гонять против `localhost:4173` или сервисный токен Access).

## Что НЕ делать на этом хосте
- Не заливать реальные данные учеников.
- Не включать реальную обработку камеры с отправкой на сервер.
- Не снимать `noindex`/Access, пока это прототип.
