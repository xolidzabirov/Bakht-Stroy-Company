<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row is one signed-in device. The refresh token lives on it, so a renewed session stays
 * the same row in the sessions list and "end this session" also ends its refresh token.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->string('refresh_token', 64)->nullable();
            $table->string('previous_refresh_token', 64)->nullable();
            $table->timestamp('refresh_expires_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropColumn(['refresh_token', 'previous_refresh_token', 'refresh_expires_at']);
        });
    }
};
