#!/bin/sh
# Runs on every container start after migrations (serversideup/php entrypoint hooks).
# SHOP_BOOTSTRAP=true — create / update the admin from ADMIN_* and seed the database once.
# Used where there is no console to run commands by hand (Render free).
#
# It runs in the background: seeding the demo catalog (pictures uploaded to storage) takes minutes,
# and the web server must answer the platform's health check right away or the deploy is rolled back.

if [ "${SHOP_BOOTSTRAP:-false}" = "true" ]; then
    echo "shop:bootstrap — admin and first data (in the background)"
    php /var/www/html/artisan shop:bootstrap --no-interaction &
fi
