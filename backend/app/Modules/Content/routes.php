<?php

use App\Modules\Content\Http\Controllers\BannerController;
use App\Modules\Content\Http\Controllers\ContactController;
use App\Modules\Content\Http\Controllers\MailConnectionController;
use App\Modules\Content\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

/*
| Public — available to guests.
*/
Route::get('settings/public', [SettingsController::class, 'public'])->name('settings.public');
Route::get('banners', [BannerController::class, 'public'])->middleware('cache.public')->name('banners.index');
Route::post('contact', [ContactController::class, 'store'])->middleware('throttle:contact')->name('contact.store');

/*
| Admin panel — admins and managers.
*/
Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'active', 'role:admin|manager'])->group(function () {
    Route::get('settings', [SettingsController::class, 'show'])->name('settings.show');

    Route::middleware('role:admin')->prefix('mail')->name('mail.')->group(function () {
        Route::get('/', [MailConnectionController::class, 'show'])->name('show');
        Route::get('google/url', [MailConnectionController::class, 'url'])->name('google.url');
        Route::post('google', [MailConnectionController::class, 'connect'])->name('google.connect');
        Route::delete('google', [MailConnectionController::class, 'disconnect'])->name('google.disconnect');
        Route::post('test', [MailConnectionController::class, 'test'])->name('test');
    });

    Route::put('settings', [SettingsController::class, 'update'])->middleware('role:admin')->name('settings.update');

    Route::get('banners', [BannerController::class, 'index'])->name('banners.index');
    Route::post('banners', [BannerController::class, 'store'])->name('banners.store');
    Route::patch('banners/{banner}', [BannerController::class, 'update'])->name('banners.update');
    Route::delete('banners/{banner}', [BannerController::class, 'destroy'])->name('banners.destroy');
    Route::post('banners/{banner}/image', [BannerController::class, 'uploadImage'])->name('banners.image');

    Route::get('messages', [ContactController::class, 'index'])->name('messages.index');
    Route::post('messages/read-all', [ContactController::class, 'readAll'])->name('messages.read-all');
    Route::delete('messages/{message}', [ContactController::class, 'destroy'])->name('messages.destroy');
});
