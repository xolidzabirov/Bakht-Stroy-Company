<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phone numbers that people shared with @BakhtStroyBot (Telegram confirms the number belongs to the account):
 * the bot can write the next codes to this chat right away.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telegram_chats', function (Blueprint $table) {
            $table->string('phone', 20)->primary();
            $table->bigInteger('chat_id');
            $table->bigInteger('telegram_user_id')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_chats');
    }
};
