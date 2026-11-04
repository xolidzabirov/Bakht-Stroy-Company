# Запуск Bakht Stroy на бесплатном сервере

Весь магазин работает на **одном сервере** в Docker:

| Сервис | Что делает |
|---|---|
| `web` | сайт (Next.js) |
| `api` | API (Laravel) + фото товаров и чата |
| `reverb` | живой чат (WebSocket) |
| `queue`, `scheduler` | фоновые задачи |
| `postgres` | база данных |
| `caddy` | HTTPS-сертификаты (Let's Encrypt), автоматически |

Сервер — **Oracle Cloud Always Free**: бесплатно навсегда, до 4 ядер и 24 ГБ памяти, не «засыпает», файлы на диске сохраняются.

> Почему не Vercel / Render бесплатно: Vercel Hobby запрещает коммерческое использование (магазин компании — коммерция), а бесплатные Render/Koyeb усыпляют сервер и стирают загруженные фото при каждом обновлении. Vercel можно оставить для демо-ссылки (раздел 9).

---

## 1. Аккаунт Oracle Cloud

1. Откройте <https://signup.cloud.oracle.com> → **Start for free**.
2. Страна, имя, email, телефон. Карта нужна **только для проверки** — деньги не списываются, пока вы сами не перейдёте на платный план.
3. **Home Region** выберите ближайший с свободными ресурсами (например, *Germany Central (Frankfurt)*). Поменять потом нельзя.

## 2. Сервер (виртуальная машина)

**Compute → Instances → Create instance**:

- **Image**: *Canonical Ubuntu 24.04*
- **Shape**: *Ampere* → `VM.Standard.A1.Flex`, **2 OCPU, 12 GB** (бесплатно до 4 OCPU / 24 GB)
  - Если пишет *Out of capacity* — попробуйте другой *Availability domain* или повторите через час.
- **SSH keys**: *Generate a key pair* → **скачайте приватный ключ** (без него на сервер не зайти).
- **Boot volume**: 100 GB (бесплатно до 200 GB).

После создания запишите **Public IP address**, например `158.101.12.34`.

### Открыть порты 80 и 443

1. В карточке сервера: **Subnet → Security List → Add Ingress Rules**:
   Source `0.0.0.0/0`, TCP, **Destination port 80**; ещё одно правило для **443**.
2. На самом сервере Ubuntu от Oracle есть свой файрвол — откроем его в шаге 3.

## 3. Подготовка сервера

С компьютера (PowerShell), подставьте путь к ключу и IP:

```powershell
ssh -i C:\Users\kholi\Downloads\ssh-key.key ubuntu@158.101.12.34
```

На сервере:

```bash
# файрвол Oracle Ubuntu: разрешить HTTP/HTTPS
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p udp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit
```

Зайдите по `ssh` ещё раз (чтобы заработала группа docker) и проверьте: `docker run --rm hello-world`.

## 4. Код

```bash
git clone https://github.com/xolidzabirov/Bakht-Stroy-Company.git bakhtstroy
cd bakhtstroy/deploy
cp .env.example .env
```

Если репозиторий приватный: GitHub → *Settings → Developer settings → Personal access tokens* → токен с правом `repo`, и `git clone https://<токен>@github.com/...`.

## 5. Настройки (`deploy/.env`)

Сгенерируйте секреты прямо на сервере:

```bash
echo "APP_KEY=base64:$(openssl rand -base64 32)"
echo "DB_PASSWORD=$(openssl rand -hex 24)"
echo "REVERB_APP_ID=$(shuf -i 100000-999999 -n 1)"
echo "REVERB_APP_KEY=$(openssl rand -hex 10)"
echo "REVERB_APP_SECRET=$(openssl rand -hex 20)"
echo "TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)"
```

Откройте файл: `nano .env` и заполните:

| Переменная | Значение |
|---|---|
| `SITE_DOMAIN` | пока своего домена нет: `158-101-12-34.sslip.io` (IP через дефисы) |
| `API_DOMAIN` | `api.158-101-12-34.sslip.io` |
| `ACME_EMAIL` | ваш email |
| `APP_KEY`, `DB_PASSWORD`, `REVERB_*` | из команд выше |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE` | главный администратор |
| `MAIL_*` | Gmail: `MAIL_USERNAME` — адрес, `MAIL_PASSWORD` — **пароль приложения** с <https://myaccount.google.com/apppasswords> |
| `TELEGRAM_BOT_TOKEN` | **новый** токен от @BotFather (`/revoke` → старый больше не действует) |

`sslip.io` — бесплатные адреса, которые указывают на IP сервера: HTTPS работает сразу, без покупки домена.

`APP_ENV=production` — на сайте только настоящие данные. Чтобы показать заказчику демо-каталог, поставьте `APP_ENV=staging` (см. шаг 7).

Сохранить в nano: `Ctrl+O`, `Enter`, выйти: `Ctrl+X`.

## 6. Запуск

```bash
docker compose up -d --build
```

Первая сборка — 5–15 минут. Проверка:

```bash
docker compose ps                 # все сервисы «running» / «healthy»
docker compose logs -f api        # миграции и ошибки (выход: Ctrl+C)
curl https://api.158-101-12-34.sslip.io/api/v1/health
```

## 7. Администратор и данные

```bash
docker compose exec api php artisan admin:seed           # главный админ из .env (можно повторять)
docker compose exec api php artisan db:seed --force      # контакты, доставка, оплата (+ демо-каталог при APP_ENV=staging)
docker compose exec api php artisan telegram:webhook https://api.158-101-12-34.sslip.io
```

Вход: `https://158-101-12-34.sslip.io/login` → ADMIN_EMAIL + ADMIN_PASSWORD → `/admin`.

Забыли пароль администратора → впишите новый `ADMIN_PASSWORD` в `.env` и снова `admin:seed`.

Менеджеров назначает администратор: пользователь регистрируется на сайте, затем админ меняет ему роль.

## 8. Обновление сайта

```bash
cd ~/bakhtstroy && git pull && cd deploy && docker compose up -d --build
```

Миграции базы выполняются автоматически при запуске `api`.

### Резервная копия базы (раз в день)

```bash
mkdir -p ~/backups
crontab -e
# добавить строку:
0 3 * * * cd ~/bakhtstroy/deploy && docker compose exec -T postgres pg_dump -U bakhtstroy bakhtstroy | gzip > ~/backups/db-$(date +\%F).sql.gz && find ~/backups -mtime +14 -delete
```

## 9. Свой домен bakhtstroy.tj

1. У регистратора домена добавьте DNS-записи **A**: `@` → IP сервера, `api` → IP сервера.
2. В `deploy/.env`: `SITE_DOMAIN=bakhtstroy.tj`, `API_DOMAIN=api.bakhtstroy.tj`.
3. `docker compose up -d --build` — сайт пересобирается (адрес API встроен в код страниц), Caddy сам получит сертификаты.
4. Снова `telegram:webhook https://api.bakhtstroy.tj`.

### Vercel (необязательно, для демо-ссылки)

Vercel → проект → **Settings → Build and Deployment → Root Directory = `frontend`**, переменные окружения:

```
API_URL=https://api.<домен>/api/v1
NEXT_PUBLIC_API_URL=https://api.<домен>/api/v1
NEXT_PUBLIC_SITE_URL=https://bakht-stroy-company.vercel.app
NEXT_PUBLIC_REVERB_KEY=<REVERB_APP_KEY>
NEXT_PUBLIC_REVERB_HOST=api.<домен>
NEXT_PUBLIC_REVERB_PORT=443
NEXT_PUBLIC_REVERB_SCHEME=https
```

и на сервере в `deploy/.env` впишите `EXTRA_SITE_HOST=bakht-stroy-company.vercel.app`, затем `docker compose up -d` — API и чат начнут принимать запросы с этого адреса.

## Если что-то не работает

| Симптом | Что проверить |
|---|---|
| Сайт не открывается | порты 80/443 в Security List и `iptables` (шаги 2–3); `docker compose ps` |
| «Не удалось загрузить страницу» | `docker compose logs api` — обычно ошибка в `.env` |
| Нет HTTPS | `docker compose logs caddy`; DNS / sslip-адрес должен указывать на IP сервера |
| Чат без «живых» сообщений | `docker compose logs reverb`; `REVERB_APP_KEY` в `.env` тот же, что ушёл в сборку сайта (после изменения — `up -d --build`) |
| Не приходят письма | пароль приложения Gmail, `MAIL_FROM_ADDRESS` = тот же Gmail |
