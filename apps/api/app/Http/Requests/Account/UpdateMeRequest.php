<?php

declare(strict_types=1);

namespace App\Http\Requests\Account;

use App\Data\UpdateProfileData;
use App\Rules\Username;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Override;

final class UpdateMeRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'username' => [
                'sometimes',
                'required',
                'string',
                new Username,
                Rule::unique('users', 'username')->ignore($this->user()),
            ],
        ];
    }

    public function toDto(): UpdateProfileData
    {
        return new UpdateProfileData(
            name: $this->has('name') ? $this->string('name')->toString() : null,
            username: $this->has('username') ? $this->string('username')->toString() : null,
        );
    }

    #[Override]
    protected function prepareForValidation(): void
    {
        if ($this->has('username')) {
            $this->merge(['username' => Username::normalize($this->input('username'))]);
        }
    }
}
