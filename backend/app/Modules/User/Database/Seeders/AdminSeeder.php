<?php

declare(strict_types=1);

namespace App\Modules\User\Database\Seeders;

use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Database\Seeder;

/**
 * Creates (or updates) the single administrator from config/shop.php (ADMIN_* in .env).
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        /** @var array{name: string, email: ?string, password: ?string} $config */
        $config = config('shop.admin');

        if (empty($config['email']) || empty($config['password'])) {
            $this->command?->warn('AdminSeeder: set ADMIN_EMAIL and ADMIN_PASSWORD in .env — admin was not created.');

            return;
        }

        $admin = User::query()->updateOrCreate(
            ['email' => mb_strtolower(trim($config['email']))],
            [
                'name' => $config['name'],
                'password' => $config['password'],
                'email_verified_at' => now(),
            ],
        );

        $admin->syncRoles([Role::Admin]);

        $this->command?->info("AdminSeeder: admin {$admin->email} is ready.");
    }
}
