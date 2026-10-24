<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Requests\Admin;

use App\Modules\Catalog\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

final class UploadImagesRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** Фото товара: JPG, PNG или WebP, до 5 МБ каждое, до 10 фото у товара. */
            'images' => ['required', 'array', 'min:1', 'max:'.Product::MAX_IMAGES],
            'images.*' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * @return list<UploadedFile>
     */
    public function images(): array
    {
        /** @var list<UploadedFile> $files */
        $files = array_values($this->file('images', []));

        return $files;
    }
}
