# 1. Общая архитектура

## Структура репозитория (монорепозиторий)

```
Bakht-Stroy-Company/
├── backend/                    Laravel — REST API /api/v1 (единый для web и mobile)
├── frontend/                   Next.js 16 — сайт + кабинет клиента + админка
├── mobile/                     (позже) Expo / React Native — тот же API
├── docs/                       документация
└── .github/workflows/          CI: тесты и линтеры для backend и frontend
```

## Принцип API-first

Backend ничего не знает о том, кто его вызывает. Сайт и мобильное приложение —
просто два клиента одного API.

```
 [Next.js web] ──┐
                 ├──► HTTPS /api/v1 (JSON) ──► Laravel ──► PostgreSQL
 [Mobile app] ───┘                               │
                                                 ├──► Redis (кэш, очереди)
                                                 ├──► Storage (фото товаров, S3 позже)
                                                 └──► Queue worker (уведомления, письма)
```

## Стек

| Слой | Технология |
|---|---|
| Backend | PHP 8.4, Laravel 13 |
| БД | PostgreSQL 17 |
| Кэш / очереди | на старте драйвер `database`, на этапе «Pro» — Redis |
| Авторизация | Laravel Sanctum — Bearer-токены (работают и для web, и для mobile) |
| Роли и права | spatie/laravel-permission (две роли: `client` — покупатель, `admin` — администратор) |
| Фото | spatie/laravel-medialibrary (ресайз, превью, webp) |
| Документация API | Scramble (OpenAPI генерируется из кода) + Swagger UI на `/api/documentation` |
| Тесты | Pest |
| Качество кода | Laravel Pint (стиль), Larastan (статический анализ) |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind 4, TanStack Query, React Hook Form + Zod |
| Mobile (позже) | Expo (React Native) — переиспользуем типы из OpenAPI |

## Почему Sanctum, а не JWT

| | Sanctum | JWT |
|---|---|---|
| Токен | случайная строка, хэш хранится в БД | подписанный JSON с данными |
| Выход / блокировка | мгновенно — удалили токен из БД | токен живёт до конца срока, нужен blacklist |
| «Выйти со всех устройств», список устройств | встроено | писать самому |
| Поддержка | официальный пакет Laravel | сторонний пакет |

Для магазина важнее мгновенный выход и блокировка, чем проверка токена без БД.
Если понадобится JWT (access + refresh), меняется только модуль `Auth`.
