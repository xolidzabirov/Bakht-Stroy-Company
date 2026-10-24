<?php

declare(strict_types=1);

namespace App\Modules\News\Http\Requests\Admin;

use App\Modules\News\Http\Requests\NewsIndexRequest;
use Illuminate\Contracts\Validation\ValidationRule;

final class AdminNewsIndexRequest extends NewsIndexRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            /** draft — черновики, scheduled — запланированные, published — опубликованные. */
            'status' => ['nullable', 'string', 'in:draft,scheduled,published'],
        ];
    }
}
