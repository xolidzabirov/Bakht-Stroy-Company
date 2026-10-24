# План написания кода

Пошагово: что пишем, в каком порядке и какие файлы появляются.
Пути backend — относительно `backend/`. Общий чек-лист этапов — в [ROADMAP.md](ROADMAP.md).

---

## Шаблон: как пишется любая фича backend

Для каждой фичи — строго в этом порядке:

1. **Enum** (если есть статусы/типы) — `Modules/X/Enums/`
2. **Миграция** — `Modules/X/Database/Migrations/`
3. **Модель** — `$fillable`, `casts()`, связи, scope'ы
4. **Factory** — для тестов и сидеров
5. **DTO** — `Modules/X/DTO/XData.php` (`readonly` класс, `fromRequest()`)
6. **Action** — `Modules/X/Actions/DoSomething.php` (метод `handle()`, `DB::transaction` при изменениях нескольких таблиц)
7. **FormRequest** — правила валидации + `authorize()`
8. **Policy** — права доступа
9. **Resource** — формат JSON
10. **Controller** — тонкий
11. **Маршрут** — `Modules/X/routes.php`
12. **Тест** (Pest) — успех, валидация, права (401/403), граничные случаи
13. **Проверка в Swagger** — запрос выполняется, пример ответа верный
14. **Pint + Larastan + тесты зелёные → коммит**

---

## ЧАСТЬ A — BACKEND

### Этап 0 — Подготовка

**0.1 Окружение**
- Установить PHP 8.4 + Composer, PostgreSQL 17 (локально — портативный, порт 5433, см. `scripts/db-start.ps1`)
- Расширения PHP: `pdo_pgsql`, `pgsql`, `gd` или `imagick`, `intl`, `mbstring`, `zip`, `fileinfo`
- Создать БД `bakht_stroy` и пользователя `bakht`

**0.2 Laravel**
```bash
composer create-project laravel/laravel backend
cd backend
php artisan install:api            # Sanctum + routes/api.php
```
- `.env`: `DB_CONNECTION=pgsql`, `APP_TIMEZONE=Asia/Tashkent`, `APP_LOCALE=ru`, `APP_URL=http://localhost:8000`
- `.env.example` — те же ключи без секретов

**0.3 Пакеты**
```bash
composer require spatie/laravel-permission spatie/laravel-medialibrary dedoc/scramble
composer require --dev pestphp/pest pestphp/pest-plugin-laravel larastan/larastan laravel/pint
```
- Опубликовать конфиги и миграции spatie
- `phpstan.neon` (уровень 6+), `pint.json` (preset `laravel`)
- `composer.json` scripts: `test`, `lint` (`pint --test`), `analyse` (`phpstan`)

**0.4 Каркас модулей**
```
app/Shared/
├── Exceptions/DomainException.php        code + HTTP-статус
├── Http/Controllers/Controller.php       базовый контроллер
└── Providers/ModuleServiceProvider.php   базовый: грузит routes.php и Migrations модуля
```
- Каждый модуль имеет `Providers/<Module>ServiceProvider.php`, наследник базового
- Регистрация провайдеров в `bootstrap/providers.php`
- Маршруты модулей подключаются с префиксом `api/v1` и middleware `api`

**0.5 Ошибки и формат ответов**
- `bootstrap/app.php` → `withExceptions`: 401/403/404/422/429/DomainException → единый JSON (см. [02-backend-architecture.md](02-backend-architecture.md#25-единый-формат-ответов))
- `JsonResource::withoutWrapping()` НЕ используем — всегда `{ "data": ... }`

**0.6 Swagger**
- Scramble: `config/scramble.php` — `api_path = api/v1`, Bearer-авторизация
- Маршрут `/api/documentation` → Swagger UI, читает `/docs/api.json`
- Проверка: `GET /api/v1/health` → `{ "data": { "status": "ok" } }` виден в Swagger

**0.7 CI**
- `.github/workflows/backend.yml`: PostgreSQL service → `composer install` → `pint --test` → `phpstan` → `pest`

**Результат:** `php artisan serve` работает, Swagger открывается, CI зелёный. Коммит `chore(backend): init laravel, modules skeleton, swagger`.

---

### Этап 1 — Модуль Auth + User (основа)

**1.1 Пользователь**
- Перенести `app/Models/User.php` → `Modules/User/Models/User.php` (`HasApiTokens`, `HasRoles`, `SoftDeletes`, `Notifiable`)
- Миграция: изменить `users` — `email` (unique, логин), `phone` (nullable, unique), `locale`, `theme`, `blocked_at`, `deleted_at`
- `config/auth.php` → новый путь модели
- `UserFactory`, `Enums/Role.php` (`client`, `manager`, `admin`)
- Роли создаются миграцией; `AdminSeeder` — один админ из `.env`: `ADMIN_EMAIL`, `ADMIN_PASSWORD`

**1.2 Регистрация и вход** — `Modules/Auth/`
```
Actions/RegisterUser.php        создать user, роль client, токен
Actions/LoginUser.php           найти по email, проверить пароль и blocked_at, токен
Actions/LogoutUser.php          удалить текущий токен / все токены
DTO/RegisterData.php, LoginData.php
Http/Requests/RegisterRequest.php   name, email (unique), password (min 8, буквы+цифры, confirmed), phone (необязательно)
Http/Requests/LoginRequest.php      login, password, device_name
Http/Resources/AuthResource.php     { user, token }
Http/Controllers/AuthController.php register, login, logout, logoutAll, me
routes.php
```
- `Modules/User/Http/Resources/UserResource.php` — id, name, phone, email, roles, created_at

**1.3 Восстановление пароля**
- `ForgotPassword` / `ResetPassword` Actions (на старте — код в лог/почту, позже SMS)

**1.4 Защита**
- Middleware `role` (spatie) — алиас в `bootstrap/app.php`
- Middleware `EnsureNotBlocked` — заблокированный получает 403
- `RateLimiter::for('login')` — 5 попыток в минуту на email + IP

**1.5 Тесты** — `tests/Feature/Auth/`
- регистрация: успех, дубль email, слабый пароль
- вход: по email, неверный пароль, заблокирован, лимит попыток
- `me` без токена → 401; logout — токен перестаёт работать; logout-all

**Коммиты:** `feat(user): user model and roles`, `feat(auth): register login logout`, `feat(auth): password reset and rate limit`

---

### Этап 2 — Модуль Catalog

**2.1 Категории**
- Миграция `categories`, модель `Category` (`parent`, `children`, `products`, scope `active`)
- Slug генерируется из названия (с транслитерацией кириллицы), уникальный
- Actions: `CreateCategory`, `UpdateCategory`, `DeleteCategory` (нельзя удалить, если есть товары → 409), `ReorderCategories`
- Resources: `CategoryResource` (с `children` для дерева)
- Публичный `CategoryController`: index (дерево), show
- Админ `Admin/CategoryController`: index, store, show, update, destroy, reorder

**2.2 Товары**
- `Enums/ProductUnit.php` (с `label()` — «мешок», «м²»)
- Миграция `products` + GIN-индексы (поиск, attributes)
- Модель `Product` (`HasMedia`, `SoftDeletes`, связи, scopes `active`, `inStock`, `featured`)
- Коллекции медиа: `images` + конверсии `thumb` (300px), `card` (600px), `full` (1200px), webp
- `Queries/ProductQuery.php` — фильтры category (включая подкатегории), search, price_min/max, in_stock, featured, sort
- `DTO/ProductData.php`, `DTO/ProductFilterData.php`
- Actions: `CreateProduct`, `UpdateProduct`, `DeleteProduct`, `UpdateStock`, `AttachProductImages`, `DeleteProductImage`
- Event `ProductStockLow` (остаток ниже порога из настроек)
- Resources: `ProductListResource` (для списков — коротко), `ProductResource` (полная карточка)
- Публичный `ProductController`: index, show (+views_count), related
- Админ `Admin/ProductController`: CRUD, images, stock, lowStock

**2.3 Сидеры**
- `CatalogSeeder`: 8 категорий (Цемент и смеси, Кирпич и блоки, Металлопрокат, Кровля, Утеплители, Гипсокартон, Инструменты, Сантехника) с подкатегориями
- ~40 товаров с реальными характеристиками (`attributes`: марка, вес, размер, производитель) и ценами в сумах

**2.4 Тесты** — `tests/Feature/Catalog/`
- каждый фильтр и сортировка, поиск по-русски, пагинация
- неактивные товары не видны публично
- админ CRUD: успех; клиент → 403; гость → 401
- загрузка фото: только изображения, макс. размер
- удаление категории с товарами → 409

---

### Этап 3 — Модули Cart, Favorite, Order

**3.1 Корзина** — `Modules/Cart/`
- Миграция `cart_items`, модель `CartItem`
- Actions: `AddToCart` (если уже есть — увеличить количество; проверка `stock` и `min_order_qty`), `UpdateCartItem`, `RemoveCartItem`, `ClearCart`
- `CartResource` — позиции + `subtotal`, `items_count`, предупреждения (товар закончился / подорожал)

**3.2 Избранное** — `Modules/Favorite/`
- Миграция `favorites`, Actions `AddFavorite` / `RemoveFavorite` (идемпотентные)
- В `ProductListResource` поле `is_favorite` для вошедшего пользователя (без N+1)

**3.3 Заказы** — `Modules/Order/`
- Enums: `OrderStatus` (с `canTransitionTo()`), `PaymentMethod`, `PaymentStatus`, `DeliveryType`
- Миграции `orders`, `order_items`, `order_status_history`
- `Actions/PlaceOrder.php` — главная операция, в одной транзакции:
  1. взять корзину, заблокировать строки товаров (`lockForUpdate`)
  2. проверить `is_active` и остаток каждого товара → иначе 409 `OUT_OF_STOCK`
  3. посчитать subtotal, доставку (из настроек), total
  4. создать `order` с номером `BS-000123`, снимком адреса и контактов
  5. создать `order_items` со снимком названия, цены, единицы
  6. списать остатки, очистить корзину
  7. записать историю статуса `new`
  8. после коммита — событие `OrderPlaced`
- `ChangeOrderStatus` (проверка перехода, история, событие `OrderStatusChanged`)
- `CancelOrder` (клиент — только из `new`; вернуть остатки)
- `RepeatOrder` (доступные товары → в корзину)
- `OrderPolicy` — клиент видит только свои заказы
- Listeners: уведомление клиенту о смене статуса, уведомление админам о новом заказе (database notifications, в очереди)

**3.4 Тесты**
- оформление: успех, пустая корзина → 422, нет остатка → 409, остатки списались, корзина пуста
- одновременные заказы последнего товара — один успешен, второй 409
- отмена: возврат остатков; из `delivering` нельзя → 409
- чужой заказ → 404

---

### Этап 4 — API личного кабинета (модуль User)
- Миграция `addresses`; Actions `CreateAddress`, `UpdateAddress`, `DeleteAddress`, `SetDefaultAddress` (только один основной)
- `UpdateProfile`, `ChangePassword` (проверка старого пароля, выход с других устройств), `DeleteAccount` (подтверждение паролем, soft delete, удаление токенов)
- `GetDashboard` — последний заказ, количество заказов, сумма покупок, количество избранного
- Уведомления: список с пагинацией, `read-all`
- Тесты на всё + чужой адрес → 404

---

### Этап 5 — API админ-панели (модули Admin, Content)
- `Modules/Admin/Actions/GetStats.php`:
  - пользователи: всего, новые за 7 и 30 дней
  - заказы: всего, по статусам, за период
  - выручка: по `completed` заказам, за период
  - графики по дням (регистрации, заказы, выручка) — `date_trunc` в PostgreSQL
  - топ-10 товаров по продажам
- Админ-заказы: список с фильтрами и поиском (номер, телефон), детали, смена статуса
- Админ-пользователи: список с поиском, профиль + заказы, блокировка (только `admin`)
- `Modules/Content/`: `settings` (типизированный `SettingsService` с кэшем), `banners` (CRUD + фото), `contact_messages` (публичная форма с лимитом + админ-список)
- Права: `manager` — товары, категории, заказы; `admin` — плюс пользователи, настройки
- Тесты: manager не может в настройки → 403, статистика считает правильно на фабричных данных

---

### Этап 6 — Backend «Pro»
- Redis: `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`; кэш дерева категорий и настроек (сброс при изменении)
- Проверка N+1: `Model::preventLazyLoading()` в dev, `with()` везде, где нужно
- CORS для `localhost:3000` и боевого домена
- Логи: отдельный канал для заказов, `daily`
- Telescope только в `local`
- `php artisan test --coverage` — покрытие Actions ≥ 80%

---

### Этап 7 — Swagger: сдача backend
- Для каждого эндпоинта: описание на русском, группы (Auth, Каталог, Корзина, Заказы, Кабинет, Админ), примеры
- Схема Bearer — кнопка **Authorize**
- `DatabaseSeeder` создаёт: админа, менеджера, 3 клиентов с заказами, весь каталог
- `backend/README.md`: как запустить, тестовые логины, как получить токен и вставить в Swagger
- Ты тестируешь → список замечаний → исправления → коммит `docs(api): swagger ready for testing`

---

## ЧАСТЬ B — FRONTEND (после принятия backend)

Перед стартом — читаем `frontend/node_modules/next/dist/docs/` и придумываем дизайн кабинета и админки.

### Шаблон фичи frontend
1. Типы — из OpenAPI (`npm run api:types` → `shared/api/schema.ts`)
2. Запросы — `entities/<x>/api/*.ts` (функции + TanStack Query хуки)
3. UI сущности — `entities/<x>/ui/` (карточка, бейдж статуса)
4. Действие пользователя — `features/<x>/` (форма, кнопка, валидация Zod)
5. Сборка блока — `widgets/<x>/`
6. Страница — `app/.../page.tsx`
7. Состояния: загрузка (skeleton), пусто, ошибка
8. Проверка в браузере: телефон + десктоп, светлая и тёмная тема

### Этап 8 — Основа
- `shared/config/env.ts`, `shared/api/http.ts` (base URL, токен, ошибки → понятное сообщение)
- `shared/ui`: Button, Input, Select, Checkbox, Modal, Drawer, Table, Badge, Skeleton, Toast, Pagination
- Провайдеры: QueryClient, тема
- `app/api/auth/*` — route handlers login/logout/register → httpOnly cookie
- `proxy.ts` — `/account/*` только вошедшим, `/admin/*` только admin/manager
- Страницы `(auth)`: login, register, forgot-password

### Этап 9 — Магазин `(shop)`
- widgets: Header (поиск, каталог, корзина с бейджем, профиль), Footer (контакты из `/settings/public`)
- Главная: баннеры, категории, хиты (`featured`)
- Каталог: фильтры в URL (`?price_min=...`), сортировка, пагинация
- Товар: галерея, характеристики, количество, «В корзину», «В избранное», похожие
- Корзина, Checkout (адрес, доставка/самовывоз, оплата), «Спасибо за заказ»

### Этап 10 — Личный кабинет `account/`
- Layout с сайдбаром (без Header/Footer сайта)
- Обзор, заказы + детали, избранное, адреса, уведомления, настройки

### Этап 11 — Админ-панель `admin/`
- Layout с сайдбаром
- Дашборд: карточки (пользователи, заказы, выручка) + графики
- Таблицы и формы: товары (с загрузкой фото), категории (дерево, перетаскивание), заказы, пользователи, баннеры, сообщения, настройки

### Этап 12 — Инфо-страницы и SEO
- About, Contacts, Delivery, `not-found.tsx`
- `generateMetadata` для товаров и категорий, Open Graph, `sitemap.ts`, `robots.ts`
- CI: `.github/workflows/frontend.yml` — lint, typecheck, build

---

## ЧАСТЬ C — Запуск и развитие
Детали этапов 13–15 расписываем, когда дойдём до них (см. [ROADMAP.md](ROADMAP.md)).
