<?php

use App\Modules\Chat\Http\Controllers\ChatController;
use App\Modules\Chat\Http\Controllers\ChatInboxController;
use App\Modules\Chat\Http\Middleware\TouchLastSeen;
use Illuminate\Support\Facades\Route;

/*
| Customer: own conversation with the shop.
*/
Route::middleware(['auth:sanctum', 'active', TouchLastSeen::class])->prefix('chat')->name('chat.')->group(function () {
    Route::get('/', [ChatController::class, 'show'])->name('show');
    Route::get('messages', [ChatController::class, 'messages'])->name('messages.index');
    Route::post('messages', [ChatController::class, 'send'])->middleware('throttle:chat-send')->name('messages.store');
    Route::patch('messages/{message}', [ChatController::class, 'update'])->whereNumber('message')->name('messages.update');
    Route::delete('messages/{message}', [ChatController::class, 'destroy'])->whereNumber('message')->name('messages.destroy');
    Route::post('read', [ChatController::class, 'read'])->name('read');
});

/*
| Shop team: every conversation.
*/
Route::prefix('admin/chats')->name('admin.chats.')->middleware(['auth:sanctum', 'active', 'role:admin|manager', TouchLastSeen::class])->group(function () {
    Route::get('/', [ChatInboxController::class, 'index'])->name('index');
    Route::post('/', [ChatInboxController::class, 'start'])->name('start');
    Route::get('staff', [ChatInboxController::class, 'staff'])->name('staff');
    Route::get('{conversation}', [ChatInboxController::class, 'show'])->whereNumber('conversation')->name('show');
    Route::get('{conversation}/messages', [ChatInboxController::class, 'messages'])->whereNumber('conversation')->name('messages.index');
    Route::post('{conversation}/messages', [ChatInboxController::class, 'send'])->whereNumber('conversation')->middleware('throttle:chat-send')->name('messages.store');
    Route::patch('{conversation}/messages/{message}', [ChatInboxController::class, 'update'])->whereNumber(['conversation', 'message'])->name('messages.update');
    Route::delete('{conversation}/messages/{message}', [ChatInboxController::class, 'destroy'])->whereNumber(['conversation', 'message'])->name('messages.destroy');
    Route::post('{conversation}/read', [ChatInboxController::class, 'read'])->whereNumber('conversation')->name('read');

    // Admin only: who is responsible for the conversation.
    Route::patch('{conversation}/manager', [ChatInboxController::class, 'assign'])->whereNumber('conversation')->middleware('role:admin')->name('assign');
});
