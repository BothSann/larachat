<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Data\RegisterUserData;
use App\Models\User;
use Illuminate\Auth\Events\Registered;

final class RegisterUser
{
    public function handle(RegisterUserData $data): User
    {
        $user = User::create([
            'name' => $data->name,
            'username' => $data->username,
            'email' => $data->email,
            'password' => $data->password,
        ]);

        event(new Registered($user));

        return $user;
    }
}
