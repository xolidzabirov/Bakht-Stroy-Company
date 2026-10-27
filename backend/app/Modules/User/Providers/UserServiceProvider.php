<?php

declare(strict_types=1);

namespace App\Modules\User\Providers;

use App\Modules\User\Console\SeedAdmin;
use App\Shared\Providers\ModuleServiceProvider;

final class UserServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([SeedAdmin::class]);
        }
    }
}
