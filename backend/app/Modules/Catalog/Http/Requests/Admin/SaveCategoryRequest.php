<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Requests\Admin;

use App\Modules\Catalog\DTO\CategoryData;
use App\Modules\Catalog\Models\Category;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create (POST — name required) and partial update (PATCH — any subset of fields).
 */
final class SaveCategoryRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $category = $this->route('category');
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            /** @example Сухие смеси */
            'name' => [$required, 'string', 'min:2', 'max:120'],
            /**
             * Латинский slug для URL. Если не указан — создаётся из названия.
             *
             * @example sukhie-smesi
             */
            'slug' => ['sometimes', 'nullable', 'string', 'max:140', 'regex:/^[a-z0-9-]+$/',
                Rule::unique('categories', 'slug')->ignore($category instanceof Category ? $category->id : null)],
            /**
             * Родительская (корневая) категория; null — корневая.
             *
             * @example 1
             */
            'parent_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            /** @example 0 */
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            /** Показывать в магазине. */
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['slug.regex' => 'Slug может содержать только латинские буквы, цифры и дефис.'];
    }

    public function toData(?Category $category = null): CategoryData
    {
        return new CategoryData(
            name: $this->has('name') ? trim($this->string('name')->toString()) : (string) $category?->name,
            slug: $this->filled('slug') ? $this->string('slug')->toString() : null,
            parentId: $this->has('parent_id')
                ? ($this->filled('parent_id') ? $this->integer('parent_id') : null)
                : $category?->parent_id,
            description: $this->has('description') ? $this->input('description') : $category?->description,
            sortOrder: $this->has('sort_order') ? $this->integer('sort_order') : ($category->sort_order ?? 0),
            isActive: $this->has('is_active') ? $this->boolean('is_active') : ($category->is_active ?? true),
        );
    }
}
