<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20);
            $table->string('title', 200);
            $table->string('slug', 220)->unique();
            $table->string('excerpt', 500)->nullable();
            // Sanitized HTML from the rich text editor.
            $table->longText('body');
            $table->string('video_url', 300)->nullable();
            $table->boolean('is_published')->default(false);
            // Visible from this moment (may be in the future — scheduled publication).
            $table->timestamp('published_at')->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->unsignedBigInteger('views_count')->default(0);
            $table->string('meta_title', 200)->nullable();
            $table->string('meta_description', 300)->nullable();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_published', 'published_at']);
            $table->index(['type', 'published_at']);
        });

        Schema::create('news_product', function (Blueprint $table) {
            $table->foreignId('news_id')->constrained('news')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->primary(['news_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_product');
        Schema::dropIfExists('news');
    }
};
