<?php

declare(strict_types=1);

namespace App\Modules\User\Models;

use App\Modules\User\Database\Factories\UserFactory;
use App\Modules\User\Enums\Role;
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
 * @property string $email
 * @property string|null $phone
 * @property string $locale
 * @property string $theme
 * @property Carbon|null $email_verified_at
 * @property Carbon|null $phone_verified_at
 * @property Carbon|null $blocked_at
 * @property Carbon|null $last_seen_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 *
 * @method static Builder<static> byEmail(string $email)
 */
#[UseFactory(UserFactory::class)]
#[Fillable(['name', 'email', 'phone', 'password', 'locale', 'theme'])]
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
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'blocked_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Emails are stored in lower case, so the lookup is case-insensitive.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function byEmail(Builder $query, string $email): void
    {
        $query->where('email', mb_strtolower(trim($email)));
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
    public function routeNotificationForSms(): ?string
    {
        return $this->phone;
    }
}
