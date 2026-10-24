<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'name' => config('app.name'),
    'api' => url('/api/v1'),
    'docs' => url('/api/documentation'),
]));

Route::get('/api/documentation', fn () => view('swagger', [
    'specUrl' => route('scramble.docs.document'),
]))->middleware(config('scramble.middleware'))->name('swagger');
