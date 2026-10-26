# Bakht Stroy — Backend (Laravel 13 API)

REST API интернет-магазина строительных материалов. Архитектура — [docs/02-backend-architecture.md](../docs/02-backend-architecture.md).

## Требования

- PHP 8.4 (расширения: `pdo_pgsql`, `pgsql`, `intl`, `gd`, `exif`, `zip`, `mbstring`, `fileinfo`)
- Composer 2
- PostgreSQL 17

## Первый запуск

```bash
cd backend
composer setup            # install, .env, ключ, миграции, storage:link
```

Заполните в `.env` доступ к БД (`DB_*`) и данные первого админа (`ADMIN_*`).

Локально на этой машине PostgreSQL портативный, порт **5433**:

```powershell
powershell -File ..\scripts\db-start.ps1   # запустить БД
powershell -File ..\scripts\db-stop.ps1    # остановить БД
```

Базы: `bakht_stroy` (разработка), `bakht_stroy_test` (тесты), пользователь `bakht`.
Базы создаются с локалью `ru-RU` — иначе поиск по-русски и `lower()` не работают с заглавной кириллицей:

```sql
CREATE DATABASE bakht_stroy OWNER bakht ENCODING 'UTF8' LC_CTYPE 'ru-RU' LC_COLLATE 'ru-RU' TEMPLATE template0;
```

Демо-данные: `php artisan migrate:fresh --seed` — админ, клиенты, каталог (9 категорий × 10 товаров), новости, заказы.

## Запуск

```bash
php artisan serve
```

| Что | Адрес |
|---|---|
| API | http://localhost:8000/api/v1 |
| Swagger UI | http://localhost:8000/api/documentation |
| OpenAPI JSON | http://localhost:8000/docs/api.json |
| Health | http://localhost:8000/api/v1/health |

## Проверки

```bash
composer test         # тесты (Pest)
composer lint         # исправить стиль (Pint)
composer analyse      # статический анализ (Larastan)
composer check        # всё сразу — то же, что в CI
```

## Структура

```
app/
├── Modules/<Module>/   бизнес-модули (Auth, User, Catalog, Cart, Order, ...)
│   └── Providers/<Module>ServiceProvider.php  ← extends App\Shared\Providers\ModuleServiceProvider,
│                                               регистрируется в bootstrap/providers.php
└── Shared/             общий код: базовый провайдер модулей, исключения, middleware
```

Маршруты модуля (`app/Modules/<Module>/routes.php`) автоматически получают префикс `/api/v1`.
Все ошибки API имеют формат `{ "message": "...", "code": "...", "errors": {...} }`.

## Авторизация (как тестировать в Swagger)

1. `POST /auth/login` → `{ "email": "<ADMIN_EMAIL из .env>", "password": "<ADMIN_PASSWORD из .env>" }`.
2. Скопируйте `data.token` из ответа.
3. Нажмите **Authorize** вверху Swagger и вставьте токен (без слова `Bearer`).
4. Теперь работают закрытые методы, например `GET /auth/me`.

- Вход только по **email + пароль**. Гость может смотреть каталог, любое действие требует входа.
- Регистрация в 2 шага: `POST /auth/register/send-code` → код приходит на email → `POST /auth/register` с кодом.
  Email проверяется: формат, наличие почтового сервера у домена (DNS MX, `EMAIL_DNS_CHECK`), не занят ли.
  Код живёт 15 минут, 5 попыток, новый код — не чаще раза в минуту.
- Один номер телефона можно привязать только к одному аккаунту.
- Тестовые покупатели (не создаются в production): `client1@example.com` … `client10@example.com`, пароль `Client12345`.
- Единственный админ создаётся командой `php artisan db:seed` из `ADMIN_EMAIL` / `ADMIN_PASSWORD` в `.env`.
- Роли: `client` (при регистрации), `manager`, `admin` — создаются миграцией. Менеджер работает с заказами, товарами,
  новостями и баннерами; блокировка пользователей, роли и настройки магазина — только у админа.
- Телефон (необязательный) принимается в любом формате (`90 123 45 67`, `+998 90 123-45-67`) и хранится как `+998901234567`.
  Код страны для местных номеров — `PHONE_COUNTRY_CODE` в `.env`.
- Код для сброса пароля приходит на email. Локально письма не отправляются, а пишутся в `storage/logs/laravel-<дата>.log` (SMS — в `storage/logs/sms.log`).
- Токен живёт 30 дней (`SANCTUM_EXPIRATION`, в минутах).

## Каталог

- Гости видят только активные товары в активных категориях: `GET /categories`, `GET /products`, `GET /products/{slug}`.
- Фильтры `/products`: `category` (slug; у корневой — вместе с подкатегориями), `search` (по-русски, с учётом словоформ, плюс артикул),
  `price_min`, `price_max`, `in_stock`, `featured`, `sort` = `popular` | `new` | `price` | `-price` | `name`, `per_page` (до 60).
- Админка (`/admin/...`, admin и manager): CRUD категорий и товаров, фото (`images[]`, multipart, до 10 штук, превью WebP),
  остатки, заканчивающиеся товары (`LOW_STOCK_THRESHOLD`).
- Каталог двухуровневый: корневая категория → подкатегории. Удалить можно только пустую категорию, иначе — скрыть (`is_active=false`).
- Slug и артикул создаются автоматически, slug не меняется при переименовании.

## Отправка писем (коды регистрации и сброса пароля)

Локально `MAIL_MAILER=log` — письма не уходят, а пишутся в `storage/logs/laravel-<дата>.log` (там же виден код).
Чтобы письма приходили на настоящую почту, укажите SMTP в `.env`, например Gmail (нужен «пароль приложения» Google):

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
MAIL_FROM_ADDRESS=your@gmail.com
MAIL_FROM_NAME="Bakht Stroy"
```

## Корзина, избранное, заказы

Всё только для вошедших пользователей (гость получает 401).

- **Корзина** `/cart`: количество проверяется по остатку и минимальному заказу (409 `NOT_ENOUGH_STOCK`, 422 `BELOW_MIN_ORDER`).
  Если товар закончился / снят с продажи — у позиции `problem`, и `can_checkout=false`.
- **Избранное** `/favorites`; в каталоге у товаров поле `is_favorite` (с токеном).
- **Заказ** `POST /orders`: из всей корзины, в одной транзакции — блокировка товаров, проверка остатков
  (409 `CART_HAS_PROBLEMS` со списком в `details`), копия цен и названий, списание остатков, номер `BS-000123`.
  Доставка: `DELIVERY_PRICE` сум, бесплатно от `DELIVERY_FREE_FROM` и при самовывозе.
- **Мои заказы**: список (`?status=active`), детали с историей статусов, отмена (только статус «Новый», остатки возвращаются),
  «повторить заказ» — товары снова в корзину.
- Статусы: new → confirmed → assembling → delivering → completed, отмена — из любого активного. Статус меняет админ: `PATCH /admin/orders/{id}/status`.
- Уведомления (таблица `notifications` + письмо): клиенту — «заказ принят» и смена статуса, админам — «новый заказ».

## Личный кабинет (`/me`)

- `GET /me/dashboard` — профиль, счётчики заказов, сумма покупок, последний заказ, избранное, корзина, непрочитанные уведомления.
- `PATCH /me` — имя, телефон (один номер — один аккаунт), язык `ru`/`uz`, тема `light`/`dark`/`system`.
- `PUT /me/password` — с текущим паролем; другие устройства выходят из аккаунта.
- Смена email: `POST /me/email/send-code` (код на новый email) → `PUT /me/email` (код + пароль).
- Адреса `/me/addresses`: до 10, один основной; при заказе можно передать `address_id`.
- Уведомления `/me/notifications` (`?unread=1`, `meta.unread_count`), прочитать одно / все.
- Устройства `/me/sessions`: список входов и выход на любом устройстве.
- `DELETE /me` — с паролем, только без активных заказов. Email и телефон освобождаются, заказы остаются.

## Новости (`/news`)

- Для гостей: `GET /news` (`?type=news|promo|article&search=`), `GET /news/types`, `GET /news/{slug}` — текст в HTML,
  обложка, галерея, видео YouTube, товары из новости, предыдущая / следующая и похожие новости.
- Админ: CRUD `/admin/news` (черновик / публикация / по расписанию `published_at`, закрепление), обложка
  `POST /admin/news/{id}/cover`, галерея `POST /admin/news/{id}/gallery` (до 20 фото).
- HTML из редактора очищается от опасного кода (Symfony HtmlSanitizer): скрипты, `onclick`, `javascript:`, iframe удаляются.

## Админ-панель (`/admin`, роли admin и manager)

- `GET /admin/stats?period=7|30|90` — **зарегистрированные пользователи** (всего, новые за сегодня / 7 / 30 дней),
  заказы по статусам, выручка, средний чек, топ-10 товаров, графики по дням.
- Заказы: `GET /admin/orders` (фильтры, поиск по номеру / телефону / имени / email), `PATCH /admin/orders/{id}/status`,
  `PATCH /admin/orders/{id}/payment`.
- Пользователи: `GET /admin/users`, `GET /admin/users/{id}`; только admin — блокировка, разблокировка, роль client ↔ manager.
- Настройки магазина `GET/PUT /admin/settings` (контакты, соцсети, цены доставки — сразу применяются к заказам),
  баннеры `/admin/banners`, сообщения формы «Написать нам» `/admin/messages`.
- Для гостей: `GET /settings/public`, `GET /banners`, `POST /contact`.

## Демо-данные

`php artisan migrate:fresh --seed` (не создаются в production, кроме админа):

| Что | Сколько |
|---|---|
| Админ | `admin@gmail.com` / пароль из `ADMIN_PASSWORD` |
| Менеджер | `manager@example.com` / `Manager12345` |
| Покупатели | 10: `client1@example.com` … `client10@example.com`, пароль `Client12345`, с адресами и заказами |
| Каталог | 9 направлений Bakht Stroy (как в Instagram: асфальт; цемент и бетон; кирпич и блоки; окна и двери; сантехника; бытовая техника; лакокраска; арматура; оборудование) × 10 = **90 товаров** |
| Новости | 6 (новости, акции, статьи) с обложками, галереей и товарами |
| Баннеры | 3 на главную |

Картинки сгенерированы автоматически (шрифт Inter, лицензия OFL — `database/seeders/assets/fonts`);
настоящие фото загружаются через админку.

## Production (этап 6)

- **Очереди**: письма и уведомления ставятся в очередь после коммита транзакции.
  Локально `QUEUE_CONNECTION=sync` (воркер не нужен), на сервере `database` или `redis` + `php artisan queue:work`.
- **Redis**: `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, `REDIS_CLIENT=predis` — PHP-расширение не нужно.
- **Кэш**: дерево категорий (`CATALOG_CACHE_TTL`) и настройки магазина, сбрасываются автоматически при изменениях.
- **Безопасность**: CORS только для `CORS_ALLOWED_ORIGINS`, заголовки `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`; общий лимит `API_RATE_LIMIT` запросов в минуту; телефоны проверяются по базе номеров (libphonenumber),
  пароли — минимум 8 символов, буквы и цифры, без самых популярных паролей и без email.
- **Логи**: у каждого ответа `X-Request-Id`, он же в каждой строке лога; заказы — в `storage/logs/orders-<дата>.log`.
- **Мониторинг**: `GET /api/v1/health` — база, кэш, хранилище, очередь (200 / 503).
- **Планировщик** (cron каждую минуту `php artisan schedule:run`): удаление просроченных кодов, токенов и упавших задач.

Подробная инструкция для проверки в Swagger — [docs/SWAGGER-TESTING.md](../docs/SWAGGER-TESTING.md).

## Таджикистан: валюта и телефоны

- Валюта — **сомони (TJS)**. Все суммы в API — целые числа в **дирамах**: `6550` = 65,50 сом. Фронтенд делит на 100.
  Параметры валюты — в `GET /settings/public` → `currency`.
- Телефоны — с кодом страны, по умолчанию `PHONE_COUNTRY_CODE=992`.
- Оплата **до доставки**: наличными в офисе или **переводом на карту** (реквизиты в настройках `payment`), безнал для юрлиц. Менеджер отмечает оплату; без неё заказ нельзя перевести в «В пути» / «Выполнен» (`ORDER_NOT_PAID`).
  Онлайн-оплата картой на сайте требует договора интернет-эквайринга с банком (Alif, Dushanbe City Bank, Эсхата…).
