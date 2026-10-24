<?php

declare(strict_types=1);

namespace App\Modules\Favorite\Providers;

use App\Modules\Favorite\Support\CurrentUserFavorites;
use App\Shared\Contracts\FavoriteProducts;
use App\Shared\Providers\ModuleServiceProvider;

final class FavoriteServiceProvider extends ModuleServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FavoriteProducts::class, CurrentUserFavorites::class);
    }
}
