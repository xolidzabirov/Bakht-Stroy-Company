# Документация Bakht Stroy Company

Интернет-магазин строительных материалов.
Клиент: каталог → корзина → заказ → личный кабинет.
Админ: товары, категории, заказы, пользователи, статистика, настройки.
В будущем: мобильное приложение на том же API.

| Файл | О чём |
|---|---|
| [01-architecture.md](01-architecture.md) | Общая архитектура и стек технологий |
| [02-backend-architecture.md](02-backend-architecture.md) | Архитектура Laravel: модули, слои, авторизация, формат ответов |
| [03-database.md](03-database.md) | Таблицы, связи, индексы, статусы |
| [04-api.md](04-api.md) | Все эндпоинты API v1 |
| [05-frontend-architecture.md](05-frontend-architecture.md) | Архитектура Next.js (FSD), маршруты, layouts |
| [ROADMAP.md](ROADMAP.md) | Этапы проекта и чек-лист прогресса |
| [CODING-PLAN.md](CODING-PLAN.md) | Пошаговый план написания кода: что, в каком порядке, какие файлы |
| [CODE-STYLE.md](CODE-STYLE.md) | Правила кода, именования, git и коммитов |

Порядок работы: **backend целиком → Swagger (тестирование API) → frontend → деплой → мобилка.**
