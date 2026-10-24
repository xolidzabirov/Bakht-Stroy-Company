<?php

use App\Shared\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

/*
| Global API routes (prefix: /api/v1).
| Feature routes live in app/Modules/<Module>/routes.php.
*/

Route::get('/health', HealthController::class)->name('health');
