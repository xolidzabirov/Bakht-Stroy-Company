<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

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

Schedule::command('shop:prune-codes')->hourly();
Schedule::command('sanctum:prune-expired --hours=24')->daily();
Schedule::command('queue:prune-failed --hours=168')->daily();
Schedule::command('queue:prune-batches --hours=48')->daily();
