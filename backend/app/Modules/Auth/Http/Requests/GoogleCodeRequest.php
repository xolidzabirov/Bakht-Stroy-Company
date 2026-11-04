<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class GoogleCodeRequest extends FormRequest
{
    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            /** Код, с которым Google вернул человека на сайт. */
            'code' => ['required', 'string', 'max:2000'],
            /**
             * Тот же адрес возврата, что и при запросе адреса Google.
             *
             * @example https://bakht-stroy-company.vercel.app/api/auth/google/callback
             */
            'redirect_uri' => ['required', 'url', 'max:300'],
            /**
             * Название устройства для списка сессий.
             *
             * @example Chrome Windows
             */
            'device_name' => ['nullable', 'string', 'max:100'],
        ];
    }
}
