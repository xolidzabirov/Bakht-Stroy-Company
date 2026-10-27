<?php

declare(strict_types=1);

namespace App\Modules\Admin\Console;

use App\Modules\Catalog\Models\Category;
use Illuminate\Console\Command;

/**
 * php artisan shop:bootstrap
 *
 * First start of a server without a console (Render free, a fresh Docker volume): makes sure the main
 * administrator exists and fills an empty database with the seeders. Safe on every start — the seeders
 * run only while there are no categories, the admin is just updated.
 */
final class BootstrapShop extends Command
{
    protected $signature = 'shop:bootstrap';

    protected $description = 'Ensure the admin exists and seed an empty database (safe to run on every start)';

    public function handle(): int
    {
        if (filled(config('shop.admin.email'))) {
            $this->call('admin:seed');
        }

        if (Category::query()->exists()) {
            $this->components->info('shop:bootstrap: the database already has data — seeding skipped.');

            return self::SUCCESS;
        }

        $this->components->info('shop:bootstrap: empty database — running the seeders.');

        return $this->call('db:seed', ['--force' => true]);
    }
}
