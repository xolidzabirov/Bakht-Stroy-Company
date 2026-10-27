<?php

declare(strict_types=1);

namespace App\Modules\Admin\Providers;

use App\Modules\Admin\Console\BootstrapShop;
use App\Shared\Providers\ModuleServiceProvider;

final class AdminServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([BootstrapShop::class]);
        }
    }
}
