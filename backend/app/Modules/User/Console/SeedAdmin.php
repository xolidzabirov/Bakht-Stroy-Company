<?php

declare(strict_types=1);

namespace App\Modules\User\Console;

use App\Modules\User\Actions\EnsureAdminAccount;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;

/**
 * php artisan admin:seed  (or: composer admin:seed)
 *
 * Creates or updates the main administrator from .env — one command, safe to repeat.
 * Sign in: /login → ADMIN_EMAIL + ADMIN_PASSWORD → /admin.
 */
final class SeedAdmin extends Command
{
    protected $signature = 'admin:seed';

    protected $description = 'Create or update the main administrator from ADMIN_* in .env';

    public function handle(EnsureAdminAccount $ensureAdmin): int
    {
        try {
            $result = $ensureAdmin->handle((array) config('shop.admin'));
        } catch (ValidationException $exception) {
            foreach ($exception->errors() as $messages) {
                $this->components->error($messages[0]);
            }

            return self::FAILURE;
        }

        $user = $result['user'];

        $this->components->info(sprintf('Администратор %s: %s', $result['created'] ? 'создан' : 'обновлён', $user->email));
        $this->components->twoColumnDetail('Имя', $user->name);
        $this->components->twoColumnDetail('Телефон', $user->phone ?? '—');
        $this->components->twoColumnDetail('Пароль', $result['password_changed'] ? 'из ADMIN_PASSWORD' : 'не изменён');
        $this->components->twoColumnDetail('Вход', rtrim((string) config('app.frontend_url'), '/').'/login → /admin');

        return self::SUCCESS;
    }
}
