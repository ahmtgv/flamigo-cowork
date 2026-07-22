# Git: создание удалённого репозитория и первый push

Локальный репозиторий уже готов: ветка `main`, первый коммит сделан, `node_modules`/`dist`/`.env` исключены.
Осталось создать пустой репозиторий на GitHub и запушить. **Команды выполняйте в своём терминале** (не в песочнице), из папки проекта.

## Вариант A — через сайт GitHub (проще)

1. Открыть https://github.com/new
2. Repository name: `flamingo` · Visibility: **Private** · **НЕ** добавлять README/.gitignore/license (репозиторий уже с файлами).
3. Create repository. GitHub покажет URL вида `https://github.com/<ваш-логин>/flamingo.git`.
4. В терминале, из папки проекта:

```bash
cd "путь/к/flamigo coworck"
git remote add origin https://github.com/<ваш-логин>/flamingo.git
git push -u origin main
```

При запросе логина/пароля используйте **Personal Access Token** вместо пароля
(GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → доступ на этот репозиторий).

## Вариант B — через GitHub CLI (если установите `gh`)

```bash
brew install gh          # macOS
gh auth login            # войти в аккаунт
cd "путь/к/flamigo coworck"
gh repo create flamingo --private --source=. --remote=origin --push
```

## После пуша: авто-деплой на Cloudflare Pages

Workflow `.github/workflows/deploy-prototype.yml` уже в репозитории. Чтобы он заработал,
добавьте два секрета в GitHub (repo → Settings → Secrets and variables → Actions → New secret):

| Секрет | Где взять |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → шаблон **"Edit Cloudflare Workers"** (или кастом с правами Pages: Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → любой домен/Workers & Pages → справа "Account ID" |

После этого любой push в `main`, затрагивающий `flamingo-prototype/**`, автоматически собирает и катит прототип на Cloudflare Pages.
Домен `flamingo.plus` привязывается один раз в Pages → Custom domains (см. `flamingo-prototype/DEPLOY.md`).

## Проверка связи (по желанию)

```bash
git remote -v      # должен показать origin
git log --oneline  # первый коммит на месте
```
