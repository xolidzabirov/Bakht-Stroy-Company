<?php

use App\Shared\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

/*
| Global API routes (prefix: /api/v1).
| Feature routes live in app/Modules/<Module>/routes.php.
*/

Route::get('/', fn () => response()->json([
    'name' => config('app.name') . ' API',
    'version' => 'v1',
    'status' => 'operational',
    'docs' => url('/api/documentation'),
    'health' => url('/api/v1/health'),
]));

Route::get('/health', HealthController::class)->name('health');
