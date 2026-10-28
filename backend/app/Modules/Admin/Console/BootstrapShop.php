<?php

declare(strict_types=1);

namespace App\Modules\Admin\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

/**
 * php artisan shop:bootstrap
 *
 * First start of a server without a console (Render free, a fresh Docker volume): makes sure the main
 * administrator exists and seeds the database once. The seeders are idempotent, so a start that was
 * interrupted halfway finishes the job next time; after a full run a marker skips them on later starts.
 */
final class BootstrapShop extends Command
{
    public const DONE_MARKER = 'shop:bootstrapped';

    protected $signature = 'shop:bootstrap';

    protected $description = 'Ensure the admin exists and seed the database once (safe to run on every start)';

    public function handle(): int
    {
        if (filled(config('shop.admin.email'))) {
            $this->call('admin:seed');
        }

        if (Cache::get(self::DONE_MARKER) === true) {
            $this->components->info('shop:bootstrap: already seeded — skipped.');

            return self::SUCCESS;
        }

        $this->components->info('shop:bootstrap: seeding the database (first start).');

        $result = $this->call('db:seed', ['--force' => true]);

        if ($result === self::SUCCESS) {
            Cache::forever(self::DONE_MARKER, true);
            $this->components->info('shop:bootstrap: done.');
        }

        return $result;
    }
}
