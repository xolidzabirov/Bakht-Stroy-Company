# 4. API v1

База: `http://localhost:8000/api/v1`
Swagger UI: `http://localhost:8000/api/documentation`
Закрытые маршруты: заголовок `Authorization: Bearer <token>`.

## Публичные

| Метод | URL | Описание |
|---|---|---|
| POST | `/auth/register/send-code` | шаг 1: email (свободный и существующий) → 6-значный код на почту |
| POST | `/auth/register` | шаг 2: имя, email, код из письма, пароль (телефон — необязательно, один номер = один аккаунт) → пользователь + токен |
| POST | `/auth/login` | email + пароль → токен |
| POST | `/auth/forgot-password` | 6-значный код на email |
| POST | `/auth/reset-password` | email + код + новый пароль |
| GET | `/categories` | дерево активных категорий |
| GET | `/categories/{slug}` | категория + подкатегории |
| GET | `/products` | `?category=&search=&price_min=&price_max=&in_stock=&featured=&sort=price\|-price\|new\|popular&page=&per_page=` |
| GET | `/products/{slug}` | карточка товара (+1 к просмотрам) |
| GET | `/products/{slug}/related` | похожие товары |
| GET | `/banners` | активные баннеры |
| GET | `/settings/public` | контакты, график, условия доставки |
| POST | `/contact` | форма обратной связи (с лимитом запросов) |

## Клиент (`auth:sanctum`)

| Метод | URL | Описание |
|---|---|---|
| GET | `/auth/me` | текущий пользователь и роли |
| POST | `/auth/logout` | выйти с текущего устройства |
| POST | `/auth/logout-all` | выйти со всех устройств |
| GET | `/me/dashboard` | обзор: последний заказ, счётчики |
| PATCH | `/me` | профиль |
| PUT | `/me/password` | смена пароля |
| DELETE | `/me` | удалить аккаунт (с паролем) |
| GET / POST | `/me/addresses` | список / добавить адрес |
| PATCH / DELETE | `/me/addresses/{id}` | изменить / удалить |
| GET | `/me/notifications` | уведомления |
| POST | `/me/notifications/read-all` | отметить прочитанными |
| GET | `/cart` | корзина с итогами |
| POST | `/cart/items` | добавить товар |
| PATCH / DELETE | `/cart/items/{id}` | изменить количество / удалить |
| DELETE | `/cart` | очистить |
| GET | `/favorites` | избранное |
| POST / DELETE | `/favorites/{productId}` | добавить / убрать |
| POST | `/orders` | оформить заказ из корзины |
| GET | `/orders` | мои заказы `?status=` |
| GET | `/orders/{number}` | детали заказа |
| POST | `/orders/{number}/cancel` | отменить (только статус `new`) |
| POST | `/orders/{number}/repeat` | товары заказа → в корзину |

## Админ (`auth:sanctum` + `role:admin|manager`)

| Метод | URL | Описание |
|---|---|---|
| GET | `/admin/stats` | пользователи (всего / 7 / 30 дней), заказы, выручка, графики по дням, топ товаров |
| CRUD | `/admin/categories` | категории |
| PATCH | `/admin/categories/reorder` | порядок категорий |
| CRUD | `/admin/products` | товары (`?search=&category=&is_active=`) |
| POST | `/admin/products/{id}/images` | загрузить фото |
| DELETE | `/admin/products/{id}/images/{mediaId}` | удалить фото |
| PATCH | `/admin/products/{id}/stock` | изменить остаток |
| GET | `/admin/products/low-stock` | товары, которые заканчиваются |
| GET | `/admin/orders` | `?status=&date_from=&date_to=&search=` |
| GET | `/admin/orders/{id}` | детали заказа |
| PATCH | `/admin/orders/{id}/status` | сменить статус (с комментарием) |
| GET | `/admin/users` | `?search=&role=` |
| GET | `/admin/users/{id}` | профиль + заказы |
| PATCH | `/admin/users/{id}/block` / `unblock` | блокировка (только `admin`) |
| GET / PUT | `/admin/settings` | настройки магазина (только `admin`) |
| CRUD | `/admin/banners` | баннеры |
| GET | `/admin/messages` | сообщения обратной связи |
| PATCH | `/admin/messages/{id}/read` | отметить прочитанным |
