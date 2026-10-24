# 3. База данных (PostgreSQL)

## Таблицы

### Пользователи и доступ
```
users                 id, name, phone (unique), email (unique, nullable), password,
                      locale, theme, phone_verified_at, blocked_at,
                      created_at, updated_at, deleted_at
roles, permissions,
model_has_roles ...   (spatie/laravel-permission) — client, manager, admin
personal_access_tokens (sanctum) — токены, name = название устройства
password_reset_tokens

addresses             id, user_id → users, title, city, district, street, house,
                      apartment, comment, lat, lng, is_default
```

### Каталог
```
categories            id, parent_id → categories (nullable), name, slug (unique),
                      description, sort_order, is_active
products              id, category_id → categories, name, slug (unique), sku (unique),
                      description, price, old_price, unit, stock, min_order_qty,
                      attributes (jsonb), is_active, is_featured, views_count,
                      created_at, updated_at, deleted_at
media                 (spatie/medialibrary) — фото товаров, категорий, баннеров
```

### Корзина, избранное, заказы
```
cart_items            id, user_id, product_id, quantity      unique(user_id, product_id)
favorites             user_id, product_id, created_at        primary(user_id, product_id)

orders                id, number (unique, BS-000123), user_id, status,
                      payment_method, payment_status, delivery_type (delivery|pickup),
                      address_snapshot (jsonb), customer_name, customer_phone,
                      subtotal, delivery_price, discount, total, comment,
                      created_at, updated_at
order_items           id, order_id, product_id (nullable), product_name, product_sku,
                      unit, price, quantity, total
order_status_history  id, order_id, status, comment, changed_by → users, created_at
```

В `order_items` и `address_snapshot` данные **копируются** на момент заказа — если товар
переименовали, подорожал или удалён, старый заказ не меняется.

### Контент и служебное
```
notifications         (стандартная Laravel) — уведомления в кабинете
settings              key (unique), value (jsonb) — контакты, доставка, график работы
banners               id, title, link, sort_order, is_active, starts_at, ends_at
contact_messages      id, name, phone, message, read_at, created_at
jobs, failed_jobs, cache  (стандартные Laravel)
```

### Расширения (позже)
```
reviews               id, product_id, user_id, rating (1–5), text, status (pending|approved|rejected)
promo_codes           id, code (unique), type (percent|fixed), value, min_total,
                      max_uses, used_count, starts_at, ends_at, is_active
device_tokens         id, user_id, token, platform (ios|android) — push для мобилки
```

## Связи

```
users 1──* addresses
users 1──* cart_items *──1 products
users *──* products        (favorites)
users 1──* orders 1──* order_items *──1 products
orders 1──* order_status_history
categories 1──* categories (parent_id — дерево)
categories 1──* products
```

## Enum'ы

| Enum | Значения |
|---|---|
| `OrderStatus` | `new` → `confirmed` → `assembling` → `delivering` → `completed`; `cancelled` |
| `PaymentMethod` | `cash`, `card_on_delivery`, `transfer` (позже `click`, `payme`) |
| `PaymentStatus` | `pending`, `paid`, `refunded` |
| `DeliveryType` | `delivery`, `pickup` |
| `ProductUnit` | `piece` (шт), `bag` (мешок), `kg`, `ton`, `m`, `m2`, `m3`, `pack` (упак.), `roll` (рулон), `sheet` (лист) |

Разрешённые переходы статусов заказа описываются в самом Enum (`canTransitionTo()`).

## Индексы

- `products (category_id, is_active)`, `products (is_featured)`, `products (price)`
- GIN-индекс полнотекстового поиска по `name` + `description` (`to_tsvector('russian', ...)`)
- GIN-индекс по `products.attributes` (фильтр по характеристикам)
- `orders (user_id, created_at)`, `orders (status)`, `orders (created_at)` — для статистики
- `users (created_at)` — график регистраций
