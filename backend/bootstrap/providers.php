<?php

use App\Modules\Account\Providers\AccountServiceProvider;
use App\Modules\Auth\Providers\AuthServiceProvider;
use App\Modules\Cart\Providers\CartServiceProvider;
use App\Modules\Catalog\Providers\CatalogServiceProvider;
use App\Modules\Favorite\Providers\FavoriteServiceProvider;
use App\Modules\Order\Providers\OrderServiceProvider;
use App\Modules\User\Providers\UserServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,

    // Modules (app/Modules/*)
    UserServiceProvider::class,
    AuthServiceProvider::class,
    CatalogServiceProvider::class,
    FavoriteServiceProvider::class,
    CartServiceProvider::class,
    OrderServiceProvider::class,
    AccountServiceProvider::class,
];
