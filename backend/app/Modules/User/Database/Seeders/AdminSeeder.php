<?php

declare(strict_types=1);

namespace App\Modules\User\Database\Seeders;

use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use App\Shared\Support\Phone;
use Illuminate\Database\Seeder;

/**
 * Creates (or updates) the first administrator from config/shop.php (ADMIN_* in .env).
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        /** @var array{name: string, phone: ?string, email: ?string, password: ?string} $config */
        $config = config('shop.admin');

        if (empty($config['phone']) || empty($config['password'])) {
            $this->command?->warn('AdminSeeder: set ADMIN_PHONE and ADMIN_PASSWORD in .env — admin was not created.');

            return;
        }

        $admin = User::query()->updateOrCreate(
            ['phone' => Phone::normalize($config['phone'])],
            [
                'name' => $config['name'],
                'email' => $config['email'] ?: null,
                'password' => $config['password'],
                'phone_verified_at' => now(),
            ],
        );

        $admin->syncRoles([Role::Admin]);

        $this->command?->info("AdminSeeder: admin {$admin->phone} is ready.");
    }
}
