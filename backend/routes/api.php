<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
| Global API routes (prefix: /api/v1).
| Feature routes live in app/Modules/<Module>/routes.php.
*/

/**
 * Health check.
 *
 * Returns API status and checks the database connection.
 *
 * @unauthenticated
 */
Route::get('/health', function () {
    DB::select('select 1');

    return response()->json([
        'data' => [
            'status' => 'ok',
            'version' => config('scramble.info.version'),
            'time' => now()->toIso8601String(),
        ],
    ]);
})->name('health');
