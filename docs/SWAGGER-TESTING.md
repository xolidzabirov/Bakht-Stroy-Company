# Как проверить backend в Swagger

Swagger: **http://localhost:8000/api/documentation**
(запуск: `powershell -File scripts\db-start.ps1`, затем в папке `backend`: `php artisan serve`)

Все эндпоинты сгруппированы, у каждого — описание на русском, поля запроса с примерами и все возможные ошибки
с кодами (`INVALID_CREDENTIALS`, `NOT_ENOUGH_STOCK`, `CART_HAS_PROBLEMS`…).

## Тестовые аккаунты

| Роль | Email | Пароль |
|---|---|---|
| Администратор | `admin@gmail.com` | значение `ADMIN_PASSWORD` в `backend/.env` (в репозиторий не попадает) |
| Менеджер | `manager@example.com` | `Manager12345` |
| Покупатели (10) | `client1@example.com` … `client10@example.com` | `Client12345` |

Демо-данные пересоздаются командой `php artisan migrate:fresh --seed` (в папке `backend`).

## Как войти

1. **Авторизация → `POST /auth/login`** → *Try it out* → `{ "email": "client1@example.com", "password": "Client12345" }` → *Execute*.
2. Скопируйте `data.token`.
3. Кнопка **Authorize** вверху → вставьте токен (без слова `Bearer`) → *Authorize* → *Close*.
4. Чтобы сменить пользователя — *Authorize* → *Logout* → вставьте другой токен.

## Сценарии проверки

| # | Группа | Что проверить | Ожидаем |
|---|---|---|---|
| 1 | Каталог | `GET /categories` | 9 категорий, у каждой картинка и 10 товаров |
| 2 | Каталог | `GET /products?search=цементы&sort=price` | цемент, по возрастанию цены (цены в дирамах: 6800 = 68 сом.) |
| 3 | Каталог | `GET /products/{product}` (slug из списка) | фото, характеристики, категория |
| 4 | Новости | `GET /news`, `GET /news/{slug}` | 6 новостей, текст, обложка, галерея, товары |
| 5 | Магазин | `GET /settings/public`, `GET /banners` | контакты, 3 баннера |
| 6 | Авторизация | `POST /auth/register/send-code` с новым email | 202, код — в `backend/storage/logs/laravel-<дата>.log` |
| 7 | Авторизация | `POST /auth/register` с кодом, телефоном `+992 93 …` и паролем | 201 и токен |
| 8 | Авторизация | регистрация с телефоном `93 123 45 67` (без кода) или `+992 99 999 99 99` | 422, понятное сообщение |
| 9 | Авторизация | регистрация с паролем `qwerty123` | 422 «слишком простой» |
| 10 | Корзина | `POST /cart/items` `{ "product_id": 2, "quantity": 5 }` | корзина с суммой |
| 11 | Корзина | кирпич меньше 500 шт | 422 `BELOW_MIN_ORDER` |
| 12 | Заказы | `POST /orders` `{ "delivery_type": "pickup", "payment_method": "cash" }` | 201, номер `BS-…`, корзина пуста |
| 13 | Заказы | `POST /orders/{number}/cancel` | статус «Отменён», товар вернулся на склад |
| 14 | Кабинет | `GET /me/dashboard`, `/me/addresses`, `/me/notifications` | данные покупателя |
| 15 | Админ | войти как admin → `GET /admin/stats` | зарегистрированные пользователи, заказы, выручка, график |
| 16 | Админ | `PATCH /admin/orders/{id}/status` `{ "status": "confirmed" }` | статус сменился, покупателю пришло уведомление |
| 17 | Админ | `POST /admin/products` + `POST /admin/products/{id}/images` | товар с фото в каталоге |
| 18 | Админ | `POST /admin/news` с HTML и `<script>` | скрипт удалён, текст остался |
| 19 | Админ | `PATCH /admin/users/{id}/block` | покупатель не может войти |
| 20 | Права | любой `/admin/...` с токеном покупателя | 403 `FORBIDDEN` |
| 21 | Права | менеджер: `PATCH /admin/users/{id}/block` или `PUT /admin/settings` | 403 — это только для админа |

## Формат ответов

- Успех: `{ "data": ... }`, списки — плюс `meta` (страницы, `total`) и `links`.
- Ошибка: `{ "message": "текст для человека", "code": "КОД_ДЛЯ_ПРОГРАММЫ", "errors": {...}, "details": {...} }`.
- В каждом ответе заголовок `X-Request-Id` — по нему ошибку легко найти в логах.

## Если что-то не так

Пришлите номер сценария, запрос и ответ из Swagger (или `X-Request-Id`) — исправим.
