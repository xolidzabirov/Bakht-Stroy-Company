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

    'password_reset' => [
        'code_ttl_minutes' => (int) env('PASSWORD_RESET_CODE_TTL', 15),
        'max_attempts' => 5,
    ],

];
