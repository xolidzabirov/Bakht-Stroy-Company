<?php

return [

    /*
    | Phone numbers are stored in E.164 format (+998901234567).
    | A local number without a country code gets this code prepended.
    */
    'phone' => [
        'default_country_code' => env('PHONE_COUNTRY_CODE', '998'),
    ],

    /*
    | The administrator account, created by AdminSeeder (php artisan db:seed).
    */
    'admin' => [
        'name' => env('ADMIN_NAME', 'Администратор'),
        'email' => env('ADMIN_EMAIL'),
        'password' => env('ADMIN_PASSWORD'),
    ],

    /*
    | Products with stock at or below this value are shown as "low stock" to admins.
    */
    'low_stock_threshold' => (int) env('LOW_STOCK_THRESHOLD', 10),

    /*
    | 6-digit email codes (registration and password reset).
    */
    'verification_codes' => [
        'ttl_minutes' => (int) env('VERIFICATION_CODE_TTL', 15),
        'max_attempts' => 5,
        // A new registration code can be requested once per this many seconds.
        'resend_after_seconds' => 60,
    ],

    /*
    | Reject emails whose domain has no mail server (DNS MX check) at registration.
    */
    'email_dns_check' => (bool) env('EMAIL_DNS_CHECK', true),

];
