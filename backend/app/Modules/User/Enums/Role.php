<?php

declare(strict_types=1);

namespace App\Modules\User\Enums;

/**
 * User roles (spatie/laravel-permission role names).
 */
enum Role: string
{
    /** Покупатель — назначается при регистрации. */
    case Client = 'client';

    /** Менеджер — товары, категории, заказы. */
    case Manager = 'manager';

    /** Администратор — полный доступ. */
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Client => 'Покупатель',
            self::Manager => 'Менеджер',
            self::Admin => 'Администратор',
        };
    }

    /**
     * Roles that may open the admin panel.
     *
     * @return list<self>
     */
    public static function staff(): array
    {
        return [self::Admin, self::Manager];
    }
}
