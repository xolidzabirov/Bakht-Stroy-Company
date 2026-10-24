<?php

use App\Modules\User\Enums\Role;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role as RoleModel;
use Spatie\Permission\PermissionRegistrar;

/**
 * Roles are part of the schema: the app cannot work without them,
 * so they are created by a migration (also in tests), not by a seeder.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (Role::cases() as $role) {
            RoleModel::findOrCreate($role->value, 'web');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        RoleModel::query()->whereIn('name', array_column(Role::cases(), 'value'))->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
