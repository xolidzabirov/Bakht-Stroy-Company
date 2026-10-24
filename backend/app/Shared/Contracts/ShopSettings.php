<?php

declare(strict_types=1);

namespace App\Shared\Contracts;

/**
 * Store settings edited in the admin panel (contacts, delivery prices, ...).
 */
interface ShopSettings
{
    /**
     * Settings group merged with defaults, e.g. get('delivery')['price'].
     *
     * @return array<string, mixed>
     */
    public function get(string $group): array;
}
