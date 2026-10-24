<?php

declare(strict_types=1);

namespace App\Modules\Order\Enums;

/**
 * Order lifecycle: new → confirmed → assembling → delivering → completed; cancelled from any active state.
 */
enum OrderStatus: string
{
    case New = 'new';
    case Confirmed = 'confirmed';
    case Assembling = 'assembling';
    case Delivering = 'delivering';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::New => 'Новый',
            self::Confirmed => 'Подтверждён',
            self::Assembling => 'Собирается',
            self::Delivering => 'В пути',
            self::Completed => 'Выполнен',
            self::Cancelled => 'Отменён',
        };
    }

    /**
     * Statuses this one may change to.
     *
     * @return list<self>
     */
    public function nextStatuses(): array
    {
        return match ($this) {
            self::New => [self::Confirmed, self::Cancelled],
            self::Confirmed => [self::Assembling, self::Cancelled],
            self::Assembling => [self::Delivering, self::Completed, self::Cancelled],
            self::Delivering => [self::Completed, self::Cancelled],
            self::Completed, self::Cancelled => [],
        };
    }

    public function canTransitionTo(self $status): bool
    {
        return in_array($status, $this->nextStatuses(), true);
    }

    public function isFinal(): bool
    {
        return $this->nextStatuses() === [];
    }

    /**
     * A client may cancel only an order nobody has started working on.
     */
    public function canBeCancelledByClient(): bool
    {
        return $this === self::New;
    }
}
