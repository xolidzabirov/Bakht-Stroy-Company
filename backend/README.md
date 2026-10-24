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

1. `POST /auth/login` → `{ "login": "<ADMIN_PHONE из .env>", "password": "<ADMIN_PASSWORD из .env>" }`.
2. Скопируйте `data.token` из ответа.
3. Нажмите **Authorize** вверху Swagger и вставьте токен (без слова `Bearer`).
4. Теперь работают закрытые методы, например `GET /auth/me`.

- Админ создаётся командой `php artisan db:seed` из `ADMIN_*` в `.env`.
- Роли: `client` (при регистрации), `manager`, `admin` — создаются миграцией.
- Телефон принимается в любом формате (`90 123 45 67`, `+998 90 123-45-67`) и хранится как `+998901234567`.
  Код страны для местных номеров — `PHONE_COUNTRY_CODE` в `.env`.
- Код для сброса пароля пока не уходит в настоящие SMS — смотрите `storage/logs/sms.log`.
- Токен живёт 30 дней (`SANCTUM_EXPIRATION`, в минутах).
