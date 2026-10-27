<?php

declare(strict_types=1);

namespace App\Modules\User\Database\Seeders;

use App\Modules\User\Actions\EnsureAdminAccount;
use Illuminate\Database\Seeder;
use Illuminate\Validation\ValidationException;

/**
 * The main administrator from ADMIN_* in .env — the same as `php artisan admin:seed`.
 */
class AdminSeeder extends Seeder
{
    public function run(EnsureAdminAccount $ensureAdmin): void
    {
        try {
            $result = $ensureAdmin->handle((array) config('shop.admin'));
        } catch (ValidationException $exception) {
            $this->command?->warn('AdminSeeder: '.collect($exception->errors())->flatten()->first().' — администратор не создан.');

            return;
        }

        $this->command?->info("AdminSeeder: admin {$result['user']->email} is ready.");
    }
}
