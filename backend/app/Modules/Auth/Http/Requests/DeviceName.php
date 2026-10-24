<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Token name: the "device_name" field, or the User-Agent when it is absent.
 */
final class DeviceName
{
    public static function from(Request $request): string
    {
        $name = $request->input('device_name') ?: $request->userAgent() ?: 'API';

        return Str::limit((string) $name, 100, '');
    }
}
