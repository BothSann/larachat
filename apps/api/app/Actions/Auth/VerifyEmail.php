<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\Events\Verified;

final class VerifyEmail
{
    /**
     * Mark the email as verified if the link's hash matches it.
     *
     * Returns true the first time, false when it was already verified.
     *
     * @throws AuthorizationException when the hash doesn't match the email
     */
    public function handle(User $user, string $hash): bool
    {
        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            throw new AuthorizationException;
        }

        if ($user->hasVerifiedEmail()) {
            return false;
        }

        $user->markEmailAsVerified();

        event(new Verified($user));

        return true;
    }
}
