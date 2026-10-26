<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Payment is taken before delivery now, so "card on delivery" orders become card transfers.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('orders')->where('payment_method', 'card_on_delivery')->update(['payment_method' => 'card_transfer']);
    }

    public function down(): void
    {
        //
    }
};
