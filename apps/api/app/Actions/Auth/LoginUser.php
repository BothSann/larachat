<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Data\LoginData;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

final class LoginUser
{
    public function handle(LoginData $data): User
    {
        $credentials = [
            'email' => $data->email,
            'password' => $data->password,
        ];

        if (! Auth::attempt($credentials, $data->remember)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        /** @var User */
        return Auth::user();
    }
}
