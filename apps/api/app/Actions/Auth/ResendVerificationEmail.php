<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Exceptions\EmailAlreadyVerified;
use App\Models\User;

final class ResendVerificationEmail
{
    /**
     * Send the verification email again.
     *
     * @throws EmailAlreadyVerified when there is nothing left to verify
     */
    public function handle(User $user): void
    {
        if ($user->hasVerifiedEmail()) {
            throw new EmailAlreadyVerified;
        }

        $user->sendEmailVerificationNotification();
    }
}
