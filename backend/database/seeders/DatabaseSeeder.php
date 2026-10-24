<?php

namespace Database\Seeders;

use App\Modules\Catalog\Database\Seeders\CatalogSeeder;
use App\Modules\Content\Database\Seeders\ContentSeeder;
use App\Modules\News\Database\Seeders\NewsSeeder;
use App\Modules\Order\Database\Seeders\DemoOrdersSeeder;
use App\Modules\User\Database\Seeders\AdminSeeder;
use App\Modules\User\Database\Seeders\DemoUsersSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Everything except the admin is demo data and is skipped in production.
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            DemoUsersSeeder::class,
            CatalogSeeder::class,
            ContentSeeder::class,
            NewsSeeder::class,
            DemoOrdersSeeder::class,
        ]);
    }
}
