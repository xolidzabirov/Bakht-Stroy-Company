# 2. Архитектура backend (Laravel)

## 2.1 Модульный монолит

Код делится не по «типам файлов», а по **доменам** (модулям). Каждый модуль —
самостоятельный кусок бизнеса. Так проект не превращается в кашу, когда растёт.

```
backend/app/
├── Modules/
│   ├── Auth/            регистрация, вход, выход, восстановление пароля
│   ├── User/            профиль, адреса, настройки, уведомления
│   ├── Catalog/         категории, товары, фото, характеристики, поиск
│   ├── Cart/            корзина
│   ├── Favorite/        избранное
│   ├── Order/           оформление, статусы, история
│   ├── Content/         баннеры, настройки магазина, обратная связь
│   ├── Admin/           статистика и дашборд
│   ├── Review/          отзывы (этап расширений)
│   └── Promo/           промокоды, акции (этап расширений)
└── Shared/              базовые классы, трейты, исключения, общие Enum'ы
```

Модуль может использовать модели другого модуля (например, `Order` читает `Product`),
но **бизнес-логику** другого модуля вызывает только через его `Action`.

## 2.2 Структура модуля (пример: Catalog)

```
Modules/Catalog/
├── Models/              Category, Product
├── Http/
│   ├── Controllers/
│   │   ├── ProductController.php          публичный API
│   │   └── Admin/ProductController.php    админский API
│   ├── Requests/        StoreProductRequest, UpdateProductRequest, ProductIndexRequest
│   └── Resources/       ProductResource, ProductListResource, CategoryResource
├── Actions/             CreateProduct, UpdateProduct, DeleteProduct, UpdateStock
├── DTO/                 ProductData, ProductFilterData
├── Queries/             ProductQuery (фильтры, сортировка, поиск)
├── Policies/            ProductPolicy
├── Events/              ProductOutOfStock
├── Listeners/           NotifyAdminLowStock
├── Enums/               ProductUnit (шт, мешок, м², м³, т, кг, п.м.)
├── Database/
│   ├── Migrations/
│   ├── Factories/
│   └── Seeders/
├── Providers/           CatalogServiceProvider (маршруты, миграции, политики)
└── routes.php           маршруты модуля
```

Тесты модулей лежат в `backend/tests/Feature/<Модуль>/` и `backend/tests/Unit/<Модуль>/`.

## 2.3 Путь запроса (слои)

```
HTTP-запрос
  → Route (routes.php модуля, префикс /api/v1)
  → Middleware (auth:sanctum, role:admin, throttle)
  → FormRequest (валидация + authorize через Policy)
  → Controller (тонкий: принять → вызвать Action → вернуть Resource)
  → Action (одна бизнес-операция, вся логика здесь, в транзакции)
  → Model / Query (Eloquent)
  → Event → Listener / Job в очереди (уведомления)
  → API Resource (единый формат JSON)
HTTP-ответ
```

| Слой | Отвечает за | Не делает |
|---|---|---|
| Controller | принять запрос, вызвать Action, вернуть Resource | логику, запросы к БД |
| FormRequest | валидация, проверка прав | изменение данных |
| Action | одна бизнес-операция (`PlaceOrder`) | работу с HTTP |
| DTO | типизированная передача данных | логику |
| Query | сложные выборки (фильтры, поиск) | изменение данных |
| Resource | какие поля и в каком виде уходят клиенту | логику |
| Policy | кто что может делать | валидацию |

Action можно вызвать из контроллера, консольной команды или Job — логика не дублируется.

## 2.4 Авторизация и права

- `POST /auth/login` → `Sanctum` создаёт токен с именем устройства (`Chrome`, `iPhone 15`).
- Клиент шлёт `Authorization: Bearer <token>` в каждом запросе.
- Роли: `client` (при регистрации), `manager` (заказы, товары, категории, новости, баннеры, сообщения),
  `admin` (всё + блокировка пользователей, роли, настройки магазина).
- Админские маршруты: `auth:sanctum` + `active` + `role:admin|manager`; блокировка, роли и настройки — `role:admin`.
- Доступ к своим данным (заказ, адрес) — через Policy: клиент видит только своё.
- Заблокированный пользователь (`blocked_at`) не может войти, его токены удаляются.

## 2.5 Единый формат ответов

```json
// список
{ "data": [ ... ], "meta": { "current_page": 1, "per_page": 20, "total": 134 }, "links": { ... } }

// один объект
{ "data": { ... } }

// ошибка
{ "message": "Товар закончился", "code": "OUT_OF_STOCK", "errors": { "items.0.quantity": ["..."] } }
```

| Код | Когда |
|---|---|
| 200 / 201 / 204 | успех / создано / удалено |
| 401 | не вошёл или токен недействителен |
| 403 | нет прав |
| 404 | не найдено |
| 409 | конфликт (нет остатка, заказ уже нельзя отменить) |
| 422 | ошибка валидации |
| 429 | слишком много запросов |

Все ошибки приводятся к этому формату в одном месте — `bootstrap/app.php` → `withExceptions`.
Бизнес-ошибки — свой класс `App\Shared\Exceptions\DomainException` с полями `code` и HTTP-статусом.

## 2.6 Деньги, даты, язык

- Деньги — сомони (TJS), хранятся и передаются в **дирамах** (`bigint`, 1 сомони = 100 дирам; 6550 = 65,50 сом.), никогда не `float`.
- Даты в API — ISO 8601 (`2026-10-24T14:30:00+05:00`), часовой пояс `Asia/Dushanbe` (совпадает с UTC+5).
- Сообщения валидации — на русском (`lang/ru`), позже добавим `uz`.

## 2.7 Версионирование

Все маршруты под `/api/v1`. Для ломающих изменений (например, ради новой версии мобилки)
делаем `/api/v2`, старые клиенты продолжают работать на `v1`.
