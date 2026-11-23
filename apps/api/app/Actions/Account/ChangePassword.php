<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Data\ChangePasswordData;
use App\Models\User;
use Illuminate\Support\Str;

final class ChangePassword
{
    /**
     * Save the new password and end every other session.
     *
     * Sanctum's AuthenticateSession keeps a copy of the password hash in each
     * session. Other sessions still hold the old copy, so their next request
     * gets 401. This session gets the new copy at the end of this request.
     * A new remember_token makes every "remember me" cookie stop working.
     */
    public function handle(User $user, ChangePasswordData $data): void
    {
        $user->forceFill([
            'password' => $data->password,
            'remember_token' => Str::random(60),
        ])->save();
    }
}
