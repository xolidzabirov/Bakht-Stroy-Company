<?php

declare(strict_types=1);

namespace App\Modules\Content\Models;

use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Message from the "Contact us" form.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $name
 * @property string $phone
 * @property string|null $email
 * @property string $message
 * @property string|null $ip
 * @property Carbon|null $read_at
 * @property Carbon $created_at
 * @property-read User|null $user
 */
#[Fillable(['user_id', 'name', 'phone', 'email', 'message', 'ip'])]
class ContactMessage extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['user_id' => 'integer', 'read_at' => 'datetime'];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }
}
