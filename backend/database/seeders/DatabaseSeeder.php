<?php

namespace Database\Seeders;

use App\Modules\Catalog\Database\Seeders\CatalogSeeder;
use App\Modules\User\Database\Seeders\AdminSeeder;
use App\Modules\User\Database\Seeders\DemoUsersSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            DemoUsersSeeder::class,
            CatalogSeeder::class,
        ]);
    }
}
