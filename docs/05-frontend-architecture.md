# 5. Архитектура frontend (Next.js 16, FSD)

> Перед написанием кода читаем документацию Next 16 в `frontend/node_modules/next/dist/docs/` —
> в этой версии есть ломающие изменения (см. `frontend/AGENTS.md`).

## Маршруты и layouts

```
frontend/src/app/
├── (shop)/                  layout С Header и Footer
│   ├── page.tsx             главная
│   ├── catalog/[[...slug]]/ каталог и категории
│   ├── product/[slug]/
│   ├── cart/  checkout/  search/  favorites/
│   └── about/  contacts/  delivery/
├── (auth)/                  свой layout, без Header/Footer
│   └── login/  register/  forgot-password/
├── account/                 СВОЙ layout кабинета, без Header/Footer сайта (дизайн — позже)
│   ├── page.tsx             обзор
│   └── orders/  orders/[number]/  favorites/  addresses/  notifications/  settings/
├── admin/                   СВОЙ layout админки
│   ├── page.tsx             дашборд
│   └── products/  categories/  orders/  users/  banners/  messages/  settings/
├── api/auth/                route handlers: login/logout кладут токен в httpOnly cookie
├── not-found.tsx
└── layout.tsx               корневой: шрифты, провайдеры (QueryClient, тема)
```

## Слои FSD

```
frontend/src/
├── app/          маршруты, layouts, провайдеры
├── widgets/      header, footer, account-sidebar, admin-sidebar, product-grid, cart-summary
├── features/     auth, add-to-cart, toggle-favorite, product-filters, checkout, order-status-change
├── entities/     user, product, category, order, cart — типы, API-запросы, UI-карточки
└── shared/
    ├── api/      http-клиент (fetch + токен + ошибки), TS-типы из OpenAPI
    ├── ui/       Button, Input, Modal, Table, Badge, Skeleton... + styles
    ├── lib/      formatPrice, formatDate, hooks
    └── config/   env, маршруты
```

Правило импортов: слой может импортировать только **нижние** слои
(`app → widgets → features → entities → shared`).

## Принципы

- Каталог и карточка товара — серверные компоненты (SEO, скорость).
- Корзина, формы, кабинет, админка — клиентские компоненты + TanStack Query.
- Токен хранится в httpOnly cookie; Next проксирует запросы к Laravel со своего сервера.
- Защита `/account/*` и `/admin/*` — в `proxy.ts` (так в Next 16 называется middleware —
  проверить по документации).
- TS-типы ответов API генерируются из OpenAPI (`openapi-typescript`) — фронт и мобилка
  всегда совпадают с backend.

## Дизайн (черновик)

- Цвета: графит `#1F2328`, фирменный оранжевый `#F26B1D`, фон `#F6F5F2`.
- Шрифты: Manrope (заголовки), Inter (текст).
- Дизайн личного кабинета и админки придумываем отдельно перед этапом frontend.
