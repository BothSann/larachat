<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Data\RegisterUserData;
use App\Rules\Username;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() === null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', new Username, 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ];
    }

    public function toDto(): RegisterUserData
    {
        return new RegisterUserData(
            name: $this->string('name')->toString(),
            username: $this->string('username')->toString(),
            email: $this->string('email')->toString(),
            password: $this->string('password')->toString(),
        );
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'username' => Username::normalize($this->username),
            'email' => is_string($this->email) ? mb_strtolower(trim($this->email)) : $this->email,
        ]);
    }
}
