# Правила кода и работы с git

## Backend (PHP / Laravel)

- `declare(strict_types=1);` в каждом файле, типы у всех параметров и возвращаемых значений.
- Стиль — Laravel Pint (`composer lint`), анализ — Larastan (`composer analyse`).
- Классы `final`, если от них не наследуются; DTO — `final readonly class`.
- Контроллер — не больше 5–10 строк на метод. Логика только в Actions.
- Никаких `env()` вне `config/*`. Никаких «голых» массивов между слоями — DTO.
- Деньги — `int` (сумы). Никогда `float`.
- Запросы к БД — только через Eloquent / Query Builder, без сырого SQL со склейкой строк.

### Именования

| Что | Как | Пример |
|---|---|---|
| Модель | единственное число | `Product`, `OrderItem` |
| Таблица | множественное, snake_case | `order_items` |
| Action | глагол + сущность | `PlaceOrder`, `UpdateStock` |
| Request | действие + сущность + Request | `StoreProductRequest` |
| Resource | сущность + Resource | `ProductListResource` |
| Event | что произошло (прошедшее) | `OrderPlaced` |
| Listener | что делает | `NotifyAdminsAboutNewOrder` |
| Enum | сущность + признак | `OrderStatus` |
| URL | множественное, kebab-case | `/admin/low-stock` |
| JSON-поля | snake_case | `old_price`, `created_at` |

## Frontend (TypeScript / Next.js)

- `strict` TypeScript, без `any`.
- Компоненты — `PascalCase.tsx`, хуки — `useSomething.ts`, остальное — `camelCase.ts`.
- Каждый слайс FSD экспортирует наружу только через `index.ts`.
- Импорт только из нижних слоёв (`app → widgets → features → entities → shared`).
- Стили — Tailwind; цвета и размеры — только из токенов темы.

## Git

- Работаем в ветке `kholid`, в `main` — только через Pull Request.
- Коммиты по [Conventional Commits](https://www.conventionalcommits.org/):
  ```
  feat(catalog): add product filters
  fix(order): restore stock on cancel
  test(auth): login rate limit
  docs(api): swagger examples for orders
  chore(backend): install larastan
  refactor(cart): extract cart totals
  ```
- Перед коммитом: тесты, Pint, Larastan (backend) / lint, typecheck (frontend) — зелёные.
- Секреты только в `.env` (в `.gitignore`); в репозитории — `.env.example`.

## Definition of Done

- **Backend-фича**: есть тест (успех + ошибки + права), работает в Swagger, линтеры зелёные.
- **Frontend-фича**: проверена в браузере (телефон и десктоп), есть состояния загрузки, пусто и ошибки.
