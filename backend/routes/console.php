<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use Laravel\Sanctum\PersonalAccessToken;

/*
| Housekeeping. On the server run the scheduler every minute:
|   * * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
*/

Artisan::command('shop:prune-codes', function () {
    $before = now()->subMinutes((int) config('shop.verification_codes.ttl_minutes'));

    $deleted = DB::table('email_verification_codes')->where('created_at', '<', $before)->delete()
        + DB::table('password_reset_tokens')->where('created_at', '<', $before)->delete();

    $this->info("Deleted {$deleted} expired codes.");
})->purpose('Delete expired email and password reset codes');

// Not sanctum:prune-expired: it looks at the access token only and would end sessions that can still renew.
Artisan::command('shop:prune-sessions', function () {
    $deleted = PersonalAccessToken::query()
        ->where('refresh_expires_at', '<', now())
        ->orWhere(fn ($query) => $query->whereNull('refresh_expires_at')->where('expires_at', '<', now()->subDay()))
        ->delete();

    $this->info("Deleted {$deleted} ended sessions.");
})->purpose('Delete sessions that can no longer be renewed');

Schedule::command('shop:prune-codes')->hourly();
Schedule::command('shop:prune-sessions')->daily();
Schedule::command('queue:prune-failed --hours=168')->daily();
Schedule::command('queue:prune-batches --hours=48')->daily();
