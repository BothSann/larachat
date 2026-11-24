<?php

declare(strict_types=1);

namespace App\Http\Requests\People;

use App\Data\SearchUsersData;
use App\Rules\Username;
use App\Rules\UsernameCursor;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Override;

/**
 * Query parameters, because this is a GET.
 */
final class SearchUsersRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['bail', 'required', 'string', 'regex:/^[a-z0-9_]{2,30}$/'],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
            'cursor' => ['bail', 'nullable', 'string', new UsernameCursor],
        ];
    }

    #[Override]
    public function messages(): array
    {
        return [
            'search.regex' => 'The search must be 2 to 30 letters, numbers, or underscores.',
        ];
    }

    public function toDto(): SearchUsersData
    {
        return new SearchUsersData(
            search: $this->string('search')->toString(),
            perPage: $this->integer('per_page', 30),
        );
    }

    #[Override]
    protected function prepareForValidation(): void
    {
        $search = Username::normalize($this->input('search'));

        if (is_string($search)) {
            $this->merge(['search' => preg_replace('/^@/', '', $search)]);
        }
    }
}
