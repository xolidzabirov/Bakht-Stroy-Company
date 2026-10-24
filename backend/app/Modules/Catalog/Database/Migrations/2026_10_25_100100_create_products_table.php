<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('name', 200);
            $table->string('slug', 220)->unique();
            $table->string('sku', 50)->nullable()->unique();
            $table->text('description')->nullable();
            // Prices in sums (whole numbers), never float.
            $table->unsignedBigInteger('price');
            $table->unsignedBigInteger('old_price')->nullable();
            $table->string('unit', 10);
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('min_order_qty')->default(1);
            // Characteristics: [{"name": "Марка", "value": "М500"}, ...]
            $table->jsonb('specs')->default('[]');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->unsignedBigInteger('views_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['category_id', 'is_active']);
            $table->index(['is_active', 'is_featured']);
            $table->index('price');
            $table->index('created_at');
        });

        // Full-text search over name and description (Russian morphology).
        DB::statement("CREATE INDEX products_search_index ON products USING GIN (to_tsvector('russian', name || ' ' || coalesce(description, '')))");
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
