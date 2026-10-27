<?php

declare(strict_types=1);

namespace App\Modules\Auth\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * 6-digit one-time codes (email or Telegram), stored hashed.
 * A code lives config('shop.verification_codes.ttl_minutes') minutes and allows
 * max_attempts wrong tries; issuing a new code replaces the old one.
 */
final class VerificationCodes
{
    private function __construct(private readonly string $table, private readonly string $column = 'email') {}

    /**
     * Proves the person owns an email: registration and email change.
     */
    public static function emailOwnership(): self
    {
        return new self('email_verification_codes');
    }

    /**
     * Proves the person owns a phone number: registration (the code comes to Telegram).
     */
    public static function phoneOwnership(): self
    {
        return new self('phone_verification_codes', 'phone');
    }

    public static function passwordReset(): self
    {
        return new self('password_reset_tokens');
    }

    public static function ttlMinutes(): int
    {
        return (int) config('shop.verification_codes.ttl_minutes');
    }

    public function issue(string $key): string
    {
        $code = (string) random_int(100000, 999999);

        DB::table($this->table)->upsert(
            [$this->column => $key, 'token' => Hash::make($code), 'attempts' => 0, 'created_at' => now()],
            [$this->column],
            ['token', 'attempts', 'created_at'],
        );

        return $code;
    }

    /**
     * Seconds until a new code may be issued (0 — right now).
     */
    public function secondsUntilResend(string $key): int
    {
        $createdAt = $this->query($key)->value('created_at');

        if ($createdAt === null) {
            return 0;
        }

        $availableAt = Carbon::parse($createdAt)->addSeconds((int) config('shop.verification_codes.resend_after_seconds'));

        return max(0, (int) ceil(now()->diffInSeconds($availableAt, false)));
    }

    /**
     * Checks the code; a wrong code counts as an attempt.
     */
    public function check(string $key, string $code): bool
    {
        /** @var object{token: string, attempts: int, created_at: string}|null $row */
        $row = $this->query($key)->first();

        if ($row === null
            || Carbon::parse($row->created_at)->addMinutes(self::ttlMinutes())->isPast()
            || $row->attempts >= (int) config('shop.verification_codes.max_attempts')) {
            return false;
        }

        if (! Hash::check($code, $row->token)) {
            $this->query($key)->increment('attempts');

            return false;
        }

        return true;
    }

    public function forget(string $key): void
    {
        $this->query($key)->delete();
    }

    private function query(string $key): Builder
    {
        return DB::table($this->table)->where($this->column, $key);
    }
}
