<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Resources;

use App\Modules\User\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Address
 */
final class AddressResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'city' => $this->city,
            'street' => $this->street,
            'house' => $this->house,
            'apartment' => $this->apartment,
            'comment' => $this->comment,
            'is_default' => $this->is_default,
            /**
             * Готовая строка для показа.
             *
             * @example Ташкент, ул. Бунёдкор, д. 12А, кв. 45
             */
            'full' => implode(', ', array_filter([
                $this->city,
                $this->street,
                'д. '.$this->house,
                $this->apartment ? 'кв. '.$this->apartment : null,
            ])),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
