<?php

use App\Modules\News\Http\Controllers\Admin\NewsController as AdminNewsController;
use App\Modules\News\Http\Controllers\NewsController;
use Illuminate\Support\Facades\Route;

/*
| Public news — available to guests.
*/
Route::get('news', [NewsController::class, 'index'])->name('news.index');
Route::get('news/types', [NewsController::class, 'types'])->name('news.types');
Route::get('news/{slug}', [NewsController::class, 'show'])->name('news.show');

/*
| Admin — admins.
*/
Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'active', 'role:admin'])->group(function () {
    Route::post('news/{news}/cover', [AdminNewsController::class, 'uploadCover'])->name('news.cover.store');
    Route::delete('news/{news}/cover', [AdminNewsController::class, 'deleteCover'])->name('news.cover.destroy');
    Route::post('news/{news}/gallery', [AdminNewsController::class, 'uploadGallery'])->name('news.gallery.store');
    Route::delete('news/{news}/gallery/{media}', [AdminNewsController::class, 'deleteGalleryImage'])
        ->whereNumber('media')
        ->name('news.gallery.destroy');
    Route::apiResource('news', AdminNewsController::class)->parameters(['news' => 'news']);
});
