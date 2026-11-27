<?php

declare(strict_types=1);

namespace App\Http\Requests\Conversations;

use App\Data\StartDirectConversationData;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Override;

final class StartDirectConversationRequest extends FormRequest
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
            'user_id' => [
                'bail',
                'required',
                'string',
                'ulid',
                Rule::notIn([$this->user()?->getAuthIdentifier()]),
                Rule::exists('users', 'id')->whereNotNull('email_verified_at'),
            ],
        ];
    }

    #[Override]
    public function messages(): array
    {
        return [
            'user_id.not_in' => 'You cannot start a conversation with yourself.',
            'user_id.exists' => 'The selected user is invalid.',
        ];
    }

    public function toDto(): StartDirectConversationData
    {
        return new StartDirectConversationData(
            userId: $this->string('user_id')->toString(),
        );
    }

    /**
     * Our ULIDs are lowercase, so "01J…" and "01j…" are the same user.
     */
    #[Override]
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('user_id'))) {
            $this->merge(['user_id' => mb_strtolower(trim($this->input('user_id')))]);
        }
    }
}
