<?php

declare(strict_types=1);

namespace App\Modules\User\Models;

use App\Modules\User\Database\Factories\UserFactory;
use App\Modules\User\Enums\Role;
use App\Shared\Support\Phone;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $phone
 * @property string|null $email
 * @property string $locale
 * @property string $theme
 * @property Carbon|null $phone_verified_at
 * @property Carbon|null $email_verified_at
 * @property Carbon|null $blocked_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 *
 * @method static Builder<static> byLogin(string $login)
 */
#[UseFactory(UserFactory::class)]
#[Fillable(['name', 'phone', 'email', 'password', 'locale', 'theme'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    /**
     * Spatie roles are stored for the "web" guard; Sanctum authenticates the same users.
     */
    protected string $guard_name = 'web';

    /**
     * Same defaults as the migration, so a freshly created model is complete.
     *
     * @var array<string, string>
     */
    protected $attributes = [
        'locale' => 'ru',
        'theme' => 'system',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'phone_verified_at' => 'datetime',
            'email_verified_at' => 'datetime',
            'blocked_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Find by login: an email (contains "@") or a phone in any common format.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function byLogin(Builder $query, string $login): void
    {
        $login = trim($login);

        if (str_contains($login, '@')) {
            $query->where('email', mb_strtolower($login));

            return;
        }

        $query->where('phone', Phone::normalize($login));
    }

    public function isBlocked(): bool
    {
        return $this->blocked_at !== null;
    }

    public function isStaff(): bool
    {
        return $this->hasAnyRole(Role::staff());
    }

    /**
     * Phone number for App\Shared\Notifications\Channels\SmsChannel.
     */
    public function routeNotificationForSms(): string
    {
        return $this->phone;
    }
}
