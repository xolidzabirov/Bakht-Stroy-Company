<?php

declare(strict_types=1);

namespace App\Modules\Account\Actions;

use App\Modules\Account\Exceptions\AccountHasActiveOrdersException;
use App\Modules\Cart\Models\CartItem;
use App\Modules\Favorite\Models\Favorite;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\Address;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Soft-deletes the account. Email and phone are released (so they can be used again),
 * personal data is removed, orders stay for accounting with their own contact copies.
 */
final class DeleteAccount
{
    public function handle(User $user, string $password): void
    {
        if (! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages(['password' => 'Неверный пароль.']);
        }

        $hasActiveOrders = Order::query()
            ->where('user_id', $user->id)
            ->whereNotIn('status', [OrderStatus::Completed, OrderStatus::Cancelled])
            ->exists();

        if ($hasActiveOrders) {
            throw new AccountHasActiveOrdersException;
        }

        DB::transaction(function () use ($user): void {
            $user->tokens()->delete();
            CartItem::query()->where('user_id', $user->id)->delete();
            Favorite::query()->where('user_id', $user->id)->delete();
            Address::query()->where('user_id', $user->id)->delete();
            $user->notifications()->delete();

            $user->forceFill([
                'name' => 'Удалённый пользователь',
                'email' => "deleted-{$user->id}@deleted.invalid",
                'phone' => null,
            ])->save();

            $user->delete();
        });
    }
}
