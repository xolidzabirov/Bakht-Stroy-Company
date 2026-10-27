# Бесплатное демо Bakht Stroy в интернете

Четыре бесплатных сервиса, каждый делает своё:

| Сервис | Что там работает | Нужна карта? |
|---|---|---|
| **Neon** | база данных PostgreSQL (0,5 ГБ) | нет |
| **Supabase** | фото товаров и файлы чата (1 ГБ) | нет |
| **Render** | API (Laravel) из нашего Docker-образа | может попросить для проверки |
| **Vercel** | сайт (Next.js) — `bakht-stroy-company.vercel.app` | нет |

Ограничения бесплатного демо (для настоящего магазина — свой сервер, [DEPLOY.md](DEPLOY.md)):

- API на Render **засыпает через 15 минут без посетителей**, первое открытие после сна — до минуты. Лечится пингом (шаг 6).
- Чат обновляется раз в несколько секунд, а не мгновенно (бесплатный Render не держит WebSocket-сервер).
- Vercel Hobby — только для некоммерческого использования: для демо заказчику подходит, для работающего магазина — нет.

Порядок важен: сначала база и хранилище (их адреса нужны API), потом API (его адрес нужен сайту), потом сайт.

---

## 1. База данных — Neon

1. <https://neon.com> → **Sign up** (через Google-аккаунт быстрее всего).
2. **Create project**: Name `bakhtstroy`, Postgres 17, Region **AWS Europe Central 1 (Frankfurt)**.
3. На главной проекта **Connect** → скопируйте строку подключения (**Connection string**), она вида:
   ```
   postgresql://neondb_owner:ПАРОЛЬ@ep-xxx-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Это значение `DB_URL`. Никому не показывайте — в нём пароль.

## 2. Фото и файлы — Supabase Storage

1. <https://supabase.com> → **Start your project** → войти через GitHub или Google.
2. **New project**: Name `bakhtstroy`, пароль базы — любой (эта база не используется), Region **Central EU (Frankfurt)**.
3. Слева **Storage** → **New bucket**: имя **`media`**, включите **Public bucket** → Save.
4. **Storage → Settings (S3 Configuration)**:
   - убедитесь, что **S3 protocol** включён;
   - скопируйте **Endpoint** (вида `https://abcdefgh.supabase.co/storage/v1/s3`) — это `AWS_ENDPOINT`;
   - **Region** (например `eu-central-1`) — это `AWS_DEFAULT_REGION`;
   - **New access key** → скопируйте **Access key ID** (`AWS_ACCESS_KEY_ID`) и **Secret access key** (`AWS_SECRET_ACCESS_KEY`, показывается один раз).
5. `AWS_URL` = адрес проекта + `/storage/v1/object/public/media`, например:
   `https://abcdefgh.supabase.co/storage/v1/object/public/media`

## 3. Ключ приложения и пароль администратора

На своём компьютере в папке `backend`:

```powershell
php artisan key:generate --show
```

Скопируйте результат целиком (начинается с `base64:`) — это `APP_KEY`.

Придумайте надёжный пароль администратора (8+ символов, буквы и цифры) — это `ADMIN_PASSWORD`. Только для этого сервера; не используйте пароль, который где-то уже был показан.

## 4. API — Render

1. <https://render.com> → **Get Started** → войти через **GitHub** (аккаунт, где лежит репозиторий `Bakht-Stroy-Company`).
2. **New → Blueprint** → выберите репозиторий → Render найдёт файл `render.yaml` и покажет сервис **bakhtstroy-api**.
3. Заполните значения, которые он спросит:

| Переменная | Значение |
|---|---|
| `APP_KEY` | из шага 3 |
| `APP_URL` | `https://bakhtstroy-api.onrender.com` (если Render даст другой адрес — поправьте после первого запуска) |
| `DB_URL` | строка подключения Neon (шаг 1) |
| `AWS_DEFAULT_REGION`, `AWS_ENDPOINT`, `AWS_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | из шага 2 |
| `ADMIN_EMAIL` | ваш email для входа в админку |
| `ADMIN_PASSWORD` | из шага 3 |
| `TELEGRAM_BOT_TOKEN` | можно оставить пустым (уведомления менеджеру в Telegram) |

4. **Apply**. Первая сборка — 10–15 минут. В **Logs** должно появиться:
   - `Running migrations` … `DONE`
   - `shop:bootstrap — admin and first data` → `Администратор создан` и сидеры каталога
5. Проверка: откройте `https://bakhtstroy-api.onrender.com/api/v1/health` — в ответе `"status":"ok"`.

Демо-каталог (9 категорий × 10 товаров с картинками) создаётся сам при первом запуске, потому что в `render.yaml` стоит `APP_ENV=staging`. Для настоящего магазина поставьте `APP_ENV=production` — тогда будут только админ и контакты компании.

## 5. Сайт — Vercel

1. <https://vercel.com> → ваш проект **bakht-stroy-company** → **Settings → Build and Deployment → Root Directory** = `frontend` → Save.
2. **Settings → Environment Variables** — добавьте (Environment: Production и Preview):

```
API_URL=https://bakhtstroy-api.onrender.com/api/v1
NEXT_PUBLIC_API_URL=https://bakhtstroy-api.onrender.com/api/v1
NEXT_PUBLIC_SITE_URL=https://bakht-stroy-company.vercel.app
```

3. **Deployments** → у последнего деплоя **⋯ → Redeploy**.
4. Откройте <https://bakht-stroy-company.vercel.app> → **Войти** → ADMIN_EMAIL + ADMIN_PASSWORD → меню → **Админ-панель**.

## 6. Чтобы API не засыпал (по желанию)

<https://cron-job.org> → бесплатная регистрация → **Create cronjob**:
URL `https://bakhtstroy-api.onrender.com/up`, каждые **10 минут**.
Одного сервиса хватает на весь месяц бесплатных часов Render (750 ч).

## 7. Проверка фото (обязательно один раз)

Админ-панель → **Товары** → любой товар → **Загрузить фото** → картинка должна появиться и открываться.
Если ошибка — в Render **Logs** будет причина; пришлите её мне.

---

## Обновления

Каждый `git push` в `main`: Render и Vercel пересобирают всё сами (2–10 минут). Миграции базы — автоматически.

## Если что-то не работает

| Симптом | Что проверить |
|---|---|
| Сайт: «Не удалось загрузить страницу» | API спит — подождите минуту и нажмите «Повторить»; или Render Logs |
| Render: ошибка подключения к базе | `DB_URL` целиком, с `?sslmode=require` |
| Нет картинок у товаров | bucket `media` публичный; `AWS_URL` заканчивается на `/object/public/media` |
| Не входит админ | `ADMIN_EMAIL` / `ADMIN_PASSWORD` в Render → **Manual Deploy** (пароль обновится при запуске) |
