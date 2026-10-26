<?php

return [

    /*
    | Tajik somoni. All money in the API and the database is in dirams (1 somoni = 100 dirams):
    | 6550 means 65,50 сом.
    */
    'currency' => [
        'code' => 'TJS',
        'name' => 'сомони',
        'symbol' => 'сом.',
        'minor_units' => 100,
    ],

    /*
    | Phone numbers are stored in E.164 format (+992931234567).
    | A local number without a country code gets this code prepended.
    */
    'phone' => [
        'default_country_code' => env('PHONE_COUNTRY_CODE', '992'),
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
    | Requests per minute to the API for one user (or one IP for guests).
    */
    'api_rate_limit' => (int) env('API_RATE_LIMIT', 120),

    /*
    | How long the public category tree is cached, in seconds (it is also dropped on every change).
    */
    'catalog_cache_ttl' => (int) env('CATALOG_CACHE_TTL', 600),

    /*
    | Products with stock at or below this value are shown as "low stock" to admins.
    */
    'low_stock_threshold' => (int) env('LOW_STOCK_THRESHOLD', 10),

    /*
    | Delivery cost in dirams (1/100 somoni). Pickup from the warehouse is free.
    | Will be editable in the admin panel (stage 5).
    */
    'delivery' => [
        'price' => (int) env('DELIVERY_PRICE', 5000),
        // Free delivery for orders from this subtotal; 0 — never free.
        'free_from' => (int) env('DELIVERY_FREE_FROM', 300000),
    ],

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
