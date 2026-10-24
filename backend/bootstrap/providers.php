<?php

use App\Modules\Auth\Providers\AuthServiceProvider;
use App\Modules\Catalog\Providers\CatalogServiceProvider;
use App\Modules\User\Providers\UserServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,

    // Modules (app/Modules/*)
    UserServiceProvider::class,
    AuthServiceProvider::class,
    CatalogServiceProvider::class,
];
