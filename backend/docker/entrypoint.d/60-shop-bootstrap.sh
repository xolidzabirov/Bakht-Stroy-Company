#!/bin/sh
# Runs on every container start after migrations (serversideup/php entrypoint hooks).
# SHOP_BOOTSTRAP=true — create / update the admin from ADMIN_* and seed an empty database.
# Used where there is no console to run commands by hand (Render free).
set -e

if [ "${SHOP_BOOTSTRAP:-false}" = "true" ]; then
    echo "shop:bootstrap — admin and first data"
    php /var/www/html/artisan shop:bootstrap --no-interaction
fi
