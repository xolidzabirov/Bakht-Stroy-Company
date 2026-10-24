<?php

declare(strict_types=1);

namespace App\Modules\Order\DTO;

use App\Modules\Order\Enums\DeliveryType;
use App\Modules\Order\Enums\PaymentMethod;

final readonly class PlaceOrderData
{
    /**
     * @param  array{city: string, street: string, house: string, apartment: ?string, comment: ?string}|null  $address
     */
    public function __construct(
        public DeliveryType $deliveryType,
        public PaymentMethod $paymentMethod,
        public string $customerName,
        public string $customerPhone,
        public ?array $address,
        public ?string $comment,
    ) {}
}
