#!/bin/sh
# Runs on every container start after migrations (serversideup/php entrypoint hooks).
# SHOP_BOOTSTRAP=true — create / update the admin from ADMIN_* and seed the database once.
# Used where there is no console to run commands by hand (Render free).
#
# Seeding the demo catalog (pictures uploaded to storage) takes minutes, and the web server must answer
# the platform's health check right away, so the job is fully detached: its own session, no handle on
# this script's output (the init system would otherwise wait for it), logs straight to the container output.

if [ "${SHOP_BOOTSTRAP:-false}" = "true" ]; then
    echo "shop:bootstrap — admin and first data (started in the background)"
    setsid nohup php /var/www/html/artisan shop:bootstrap --no-interaction </dev/null >/proc/1/fd/1 2>&1 &
fi

exit 0
