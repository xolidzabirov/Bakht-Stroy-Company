<?php

declare(strict_types=1);

namespace App\Modules\User\Database\Seeders;

use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Database\Seeder;

/**
 * 10 demo clients for testing (not created in production).
 * Login: client1@example.com … client10@example.com, password: Client12345.
 */
class DemoUsersSeeder extends Seeder
{
    public const PASSWORD = 'Client12345';

    private const NAMES = [
        'Фирдавс Рахимов', 'Шахзода Назарова', 'Сухроб Каримов', 'Мадина Саидова', 'Бахтиёр Шарипов',
        'Нигина Исмоилова', 'Умед Холов', 'Зарина Хасанова', 'Фаррух Мирзоев', 'Манижа Абдуллоева',
    ];

    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->warn('DemoUsersSeeder: skipped in production.');

            return;
        }

        foreach (self::NAMES as $index => $name) {
            $number = $index + 1;

            $user = User::query()->updateOrCreate(
                ['email' => "client{$number}@example.com"],
                [
                    'name' => $name,
                    // Every demo phone is unique: +992931000001 … +992931000010.
                    'phone' => sprintf('+99293100%04d', $number),
                    'password' => self::PASSWORD,
                ],
            );

            $user->forceFill(['email_verified_at' => $user->email_verified_at ?? now()])->save();
            $user->syncRoles([Role::Client]);
        }

        $manager = User::query()->updateOrCreate(
            ['email' => 'manager@example.com'],
            ['name' => 'Менеджер Bakht Stroy', 'phone' => '+992931009999', 'password' => 'Manager12345'],
        );
        $manager->forceFill(['email_verified_at' => $manager->email_verified_at ?? now()])->save();
        $manager->syncRoles([Role::Manager]);

        $this->command?->info('DemoUsersSeeder: 10 clients (client1..10@example.com / '.self::PASSWORD.'), manager@example.com / Manager12345.');
    }
}
