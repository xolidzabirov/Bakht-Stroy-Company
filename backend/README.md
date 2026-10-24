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

Демо-данные: `php artisan migrate:fresh --seed` — админ + каталог (25 категорий, 39 товаров).

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
- Единственный админ создаётся командой `php artisan db:seed` из `ADMIN_EMAIL` / `ADMIN_PASSWORD` в `.env`.
- Роли: `client` (при регистрации), `manager`, `admin` — создаются миграцией.
- Телефон (необязательный) принимается в любом формате (`90 123 45 67`, `+998 90 123-45-67`) и хранится как `+998901234567`.
  Код страны для местных номеров — `PHONE_COUNTRY_CODE` в `.env`.
- Код для сброса пароля приходит на email. Локально письма не отправляются, а пишутся в `storage/logs/laravel-<дата>.log` (SMS — в `storage/logs/sms.log`).
- Токен живёт 30 дней (`SANCTUM_EXPIRATION`, в минутах).

## Каталог

- Гости видят только активные товары в активных категориях: `GET /categories`, `GET /products`, `GET /products/{slug}`.
- Фильтры `/products`: `category` (slug; у корневой — вместе с подкатегориями), `search` (по-русски, с учётом словоформ, плюс артикул),
  `price_min`, `price_max`, `in_stock`, `featured`, `sort` = `popular` | `new` | `price` | `-price` | `name`, `per_page` (до 60).
- Админка (`/admin/...`, роли admin и manager): CRUD категорий и товаров, фото (`images[]`, multipart, до 10 штук, превью WebP),
  остатки, заканчивающиеся товары (`LOW_STOCK_THRESHOLD`).
- Каталог двухуровневый: корневая категория → подкатегории. Удалить можно только пустую категорию, иначе — скрыть (`is_active=false`).
- Slug и артикул создаются автоматически, slug не меняется при переименовании.
