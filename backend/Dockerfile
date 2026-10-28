# Laravel API for production (see docs/DEPLOY.md, docs/DEPLOY-FREE.md).
#   web    — nginx + PHP-FPM on :8080 (runs migrations, storage:link and caches on start) — the default (last) stage
#   worker — the same image for queue:work / reverb:start / schedule:work (docker-compose sets the command)
# PHP extensions are compiled once in "base" and shared by every stage (builds on small servers take long).

# ---------- PHP with the extensions the shop needs ----------
FROM serversideup/php:8.4-fpm-nginx AS base
USER root
RUN install-php-extensions intl gd exif bcmath
USER www-data
WORKDIR /var/www/html

# ---------- code + composer packages (no dev tools) ----------
FROM base AS app
COPY --chown=www-data:www-data composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress

COPY --chown=www-data:www-data . .
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev --no-interaction

# ---------- background processes: queue, WebSocket (Reverb), scheduler ----------
FROM app AS worker
ENV AUTORUN_ENABLED=false
CMD ["php", "artisan", "queue:work", "--tries=3", "--max-time=3600"]

# ---------- HTTP: nginx + PHP-FPM ----------
FROM app AS web
ENV AUTORUN_ENABLED=true \
    AUTORUN_LARAVEL_MIGRATION=true \
    AUTORUN_LARAVEL_STORAGE_LINK=true \
    PHP_OPCACHE_ENABLE=1 \
    PHP_UPLOAD_MAX_FILE_SIZE=60M \
    PHP_POST_MAX_SIZE=60M

# Start-up hook after migrations: admin + first data when SHOP_BOOTSTRAP=true (servers without a console).
USER root
COPY --chmod=755 docker/entrypoint.d/60-shop-bootstrap.sh /etc/entrypoint.d/60-shop-bootstrap.sh
RUN sed -i 's/\r$//' /etc/entrypoint.d/60-shop-bootstrap.sh
USER www-data
