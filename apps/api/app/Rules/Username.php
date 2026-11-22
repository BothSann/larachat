<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

final class Username implements ValidationRule
{
    public static function normalize(mixed $value): mixed
    {
        return is_string($value) ? mb_strtolower(trim($value)) : $value;
    }

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || preg_match('/^[a-z0-9_]{3,30}$/', $value) !== 1) {
            $fail('The :attribute must be 3 to 30 lowercase letters, numbers, or underscores.');
        }
    }
}
