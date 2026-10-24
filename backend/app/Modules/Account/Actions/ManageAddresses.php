<?php

declare(strict_types=1);

namespace App\Modules\Account\Actions;

use App\Modules\Account\Exceptions\TooManyAddressesException;
use App\Modules\User\Models\Address;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Saved addresses: exactly one of them is the default while the list is not empty.
 */
final class ManageAddresses
{
    /**
     * @param  array{title?: string|null, city: string, street: string, house: string, apartment?: string|null, comment?: string|null, is_default?: bool}  $attributes
     */
    public function create(User $user, array $attributes): Address
    {
        return DB::transaction(function () use ($user, $attributes): Address {
            // Lock the user row so two parallel requests cannot both pass the limit.
            User::query()->whereKey($user->id)->lockForUpdate()->first();
            $count = Address::query()->where('user_id', $user->id)->count();

            if ($count >= Address::MAX_PER_USER) {
                throw new TooManyAddressesException;
            }

            $address = Address::query()->create([
                ...$attributes,
                'user_id' => $user->id,
                // The first address becomes the default one.
                'is_default' => $count === 0 || ($attributes['is_default'] ?? false),
            ]);

            if ($address->is_default) {
                $this->makeOnlyDefault($address);
            }

            return $address;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Address $address, array $attributes): Address
    {
        return DB::transaction(function () use ($address, $attributes): Address {
            $makeDefault = (bool) ($attributes['is_default'] ?? false);
            unset($attributes['is_default']);

            $address->update($attributes);

            if ($makeDefault) {
                $this->setDefault($address);
            }

            return $address->refresh();
        });
    }

    public function setDefault(Address $address): Address
    {
        DB::transaction(function () use ($address): void {
            $address->update(['is_default' => true]);
            $this->makeOnlyDefault($address);
        });

        return $address->refresh();
    }

    /**
     * Deleting the default address makes the newest remaining one the default.
     */
    public function delete(Address $address): void
    {
        DB::transaction(function () use ($address): void {
            $address->delete();

            if ($address->is_default) {
                Address::query()->where('user_id', $address->user_id)->latest('id')->first()?->update(['is_default' => true]);
            }
        });
    }

    private function makeOnlyDefault(Address $address): void
    {
        Address::query()
            ->where('user_id', $address->user_id)
            ->whereKeyNot($address->id)
            ->update(['is_default' => false]);
    }
}
