<?php

declare(strict_types=1);

namespace App\Modules\Auth\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * 6-digit one-time codes sent by email, stored hashed.
 * A code lives config('shop.verification_codes.ttl_minutes') minutes and allows
 * max_attempts wrong tries; issuing a new code replaces the old one.
 */
final class VerificationCodes
{
    private function __construct(private readonly string $table) {}

    public static function registration(): self
    {
        return new self('email_verification_codes');
    }

    public static function passwordReset(): self
    {
        return new self('password_reset_tokens');
    }

    public static function ttlMinutes(): int
    {
        return (int) config('shop.verification_codes.ttl_minutes');
    }

    public function issue(string $email): string
    {
        $code = (string) random_int(100000, 999999);

        DB::table($this->table)->upsert(
            ['email' => $email, 'token' => Hash::make($code), 'attempts' => 0, 'created_at' => now()],
            ['email'],
            ['token', 'attempts', 'created_at'],
        );

        return $code;
    }

    /**
     * Seconds until a new code may be issued (0 — right now).
     */
    public function secondsUntilResend(string $email): int
    {
        $createdAt = $this->query($email)->value('created_at');

        if ($createdAt === null) {
            return 0;
        }

        $availableAt = Carbon::parse($createdAt)->addSeconds((int) config('shop.verification_codes.resend_after_seconds'));

        return max(0, (int) ceil(now()->diffInSeconds($availableAt, false)));
    }

    /**
     * Checks the code; a wrong code counts as an attempt.
     */
    public function check(string $email, string $code): bool
    {
        /** @var object{token: string, attempts: int, created_at: string}|null $row */
        $row = $this->query($email)->first();

        if ($row === null
            || Carbon::parse($row->created_at)->addMinutes(self::ttlMinutes())->isPast()
            || $row->attempts >= (int) config('shop.verification_codes.max_attempts')) {
            return false;
        }

        if (! Hash::check($code, $row->token)) {
            $this->query($email)->increment('attempts');

            return false;
        }

        return true;
    }

    public function forget(string $email): void
    {
        $this->query($email)->delete();
    }

    private function query(string $email): Builder
    {
        return DB::table($this->table)->where('email', $email);
    }
}
