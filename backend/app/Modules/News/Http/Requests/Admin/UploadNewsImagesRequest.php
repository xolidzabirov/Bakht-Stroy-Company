<?php

declare(strict_types=1);

namespace App\Modules\News\Http\Requests\Admin;

use App\Modules\News\Models\News;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

final class UploadNewsImagesRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** Фото галереи: JPG, PNG или WebP, до 8 МБ каждое, до 20 фото в новости. */
            'images' => ['required', 'array', 'min:1', 'max:'.News::MAX_GALLERY_IMAGES],
            'images.*' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
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
