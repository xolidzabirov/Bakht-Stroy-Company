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
        'Алишер Каримов', 'Дильноза Юсупова', 'Сардор Рахимов', 'Мадина Ахмедова', 'Бахтиёр Насимов',
        'Нилуфар Исмоилова', 'Жасур Турсунов', 'Гулнора Хасанова', 'Фаррух Мирзаев', 'Шахноза Абдуллаева',
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
                    // Every demo phone is unique: +998901000001 … +998901000010.
                    'phone' => sprintf('+99890100%04d', $number),
                    'password' => self::PASSWORD,
                ],
            );

            $user->forceFill(['email_verified_at' => $user->email_verified_at ?? now()])->save();
            $user->syncRoles([Role::Client]);
        }

        $this->command?->info('DemoUsersSeeder: 10 clients (client1..10@example.com / '.self::PASSWORD.').');
    }
}
