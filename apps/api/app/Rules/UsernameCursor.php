<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Pagination\Cursor;
use Illuminate\Translation\PotentiallyTranslatedString;

final class UsernameCursor implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $cursor = is_string($value) ? Cursor::fromEncoded($value) : null;
        $username = $cursor?->toArray()['username'] ?? null;

        if (! is_string($username)) {
            $fail('The :attribute is not valid.');
        }
    }
}
