<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Data\ResetPasswordData;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class ResetPassword
{
    /**
     * Set a new password if the reset link is good, and end every session.
     *
     * A wrong, expired or used token and an email with no account all get
     * the same error, so the caller can't learn which emails have accounts.
     *
     * @throws ValidationException when the reset link is not good
     */
    public function handle(ResetPasswordData $data): void
    {
        $status = Password::reset([
            'token' => $data->token,
            'email' => $data->email,
            'password' => $data->password,
        ], function (User $user, #[\SensitiveParameter] string $password): void {
            $user->forceFill([
                'password' => $password,
                'remember_token' => Str::random(60),
            ])->save();

            event(new PasswordReset($user));
        });

        match ($status) {
            Password::PASSWORD_RESET => null,
            default => throw ValidationException::withMessages([
                'token' => 'This reset link is invalid or has expired.',
            ]),
        };
    }
}
