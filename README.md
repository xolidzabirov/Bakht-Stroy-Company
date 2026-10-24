# Bakht Stroy Company

Интернет-магазин строительных материалов.

| Папка | Что внутри |
|---|---|
| [`frontend/`](frontend/) | Next.js 16 — сайт, личный кабинет, админ-панель |
| [`backend/`](backend/) | Laravel 13 — REST API `/api/v1` (PostgreSQL 17) |
| [`docs/`](docs/) | Документация: [оглавление](docs/README.md), [этапы](docs/ROADMAP.md), [план кода](docs/CODING-PLAN.md) |

## Запуск frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:3000.

## Запуск backend

```bash
cd backend
composer setup
php artisan serve
```

Swagger: http://localhost:8000/api/documentation. Подробно — [backend/README.md](backend/README.md).
