<?php

declare(strict_types=1);

namespace App\Modules\Admin\Http\Requests;

use App\Modules\User\Enums\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class AdminUserIndexRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $blocked = $this->query('blocked');

        if ($blocked === 'true' || $blocked === 'false') {
            $this->merge(['blocked' => $blocked === 'true' ? '1' : '0']);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /**
             * Имя, email или телефон.
             *
             * @example алишер
             */
            'search' => ['nullable', 'string', 'max:100'],
            /** client — покупатели, admin — администраторы. */
            'role' => ['nullable', Rule::enum(Role::class)],
            /** 1 — только заблокированные, 0 — только активные. */
            'blocked' => ['nullable', 'boolean'],
            /** new (по умолчанию), name, orders (больше всего покупок). */
            'sort' => ['nullable', 'string', 'in:new,name,orders'],
            /** @example 20 */
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
