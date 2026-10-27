<?php

declare(strict_types=1);

namespace App\Modules\Auth\Support;

/**
 * What happened to a registration code: delivered to Telegram right away, or waiting in the bot
 * until the person opens it (botLink) and shares the phone number.
 */
final readonly class PhoneCodeDelivery
{
    private function __construct(public bool $delivered, public ?string $botLink = null) {}

    public static function delivered(): self
    {
        return new self(true);
    }

    public static function viaBot(string $link): self
    {
        return new self(false, $link);
    }
}
