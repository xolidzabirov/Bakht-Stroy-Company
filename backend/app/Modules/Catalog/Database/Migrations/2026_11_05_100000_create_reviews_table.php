<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('body');
            $table->timestamps();

            // One review per customer per product: writing again changes it.
            $table->unique(['product_id', 'user_id']);
            $table->index(['product_id', 'rating']);
        });

        // Kept on the product, so lists of cards show the stars without counting anything.
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('rating', 3, 2)->nullable();
            $table->unsignedInteger('reviews_count')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['rating', 'reviews_count']);
        });

        Schema::dropIfExists('reviews');
    }
};
