<?php

declare(strict_types=1);

namespace App\Shared\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use ReflectionClass;

/**
 * Base provider for every module in app/Modules.
 *
 * A module provider lives in app/Modules/<Module>/Providers and automatically
 * loads the module's routes.php (under the api/v1 prefix) and its migrations.
 */
abstract class ModuleServiceProvider extends ServiceProvider
{
    public const API_PREFIX = 'api/v1';

    public function boot(): void
    {
        $modulePath = $this->modulePath();

        if (is_dir($modulePath.'/Database/Migrations')) {
            $this->loadMigrationsFrom($modulePath.'/Database/Migrations');
        }

        if (is_file($modulePath.'/routes.php') && ! $this->app->routesAreCached()) {
            Route::middleware('api')
                ->prefix(self::API_PREFIX)
                ->group($modulePath.'/routes.php');
        }

        $this->bootModule();
    }

    /**
     * Hook for module specific boot logic (policies, event listeners, etc.).
     */
    protected function bootModule(): void {}

    /**
     * Absolute path to the module root (the parent of the Providers directory).
     */
    protected function modulePath(): string
    {
        $file = (string) (new ReflectionClass(static::class))->getFileName();

        return dirname($file, 2);
    }
}
