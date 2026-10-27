# Laravel API for production (see docs/DEPLOY.md).
#   web    — nginx + PHP-FPM on :8080 (runs migrations, storage:link and caches on start)
#   worker — the same code for queue:work / reverb:start / schedule:work

ARG PHP_EXTENSIONS="intl gd exif bcmath"

# ---------- code + composer packages (no dev tools) ----------
FROM serversideup/php:8.4-cli AS app
ARG PHP_EXTENSIONS
USER root
RUN install-php-extensions ${PHP_EXTENSIONS}
USER www-data
WORKDIR /var/www/html

COPY --chown=www-data:www-data composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress

COPY --chown=www-data:www-data . .
RUN composer dump-autoload --optimize --classmap-authoritative --no-dev --no-interaction

# ---------- background processes: queue, WebSocket (Reverb), scheduler ----------
FROM app AS worker
ENV AUTORUN_ENABLED=false
CMD ["php", "artisan", "queue:work", "--tries=3", "--max-time=3600"]

# ---------- HTTP: nginx + PHP-FPM ----------
FROM serversideup/php:8.4-fpm-nginx AS web
ARG PHP_EXTENSIONS
USER root
RUN install-php-extensions ${PHP_EXTENSIONS}
USER www-data

ENV AUTORUN_ENABLED=true \
    AUTORUN_LARAVEL_MIGRATION=true \
    AUTORUN_LARAVEL_STORAGE_LINK=true \
    PHP_OPCACHE_ENABLE=1 \
    PHP_UPLOAD_MAX_FILE_SIZE=60M \
    PHP_POST_MAX_SIZE=60M

COPY --from=app --chown=www-data:www-data /var/www/html /var/www/html
