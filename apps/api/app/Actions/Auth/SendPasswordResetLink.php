<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Data\ForgotPasswordData;
use Illuminate\Support\Facades\Password;

final class SendPasswordResetLink
{
    /**
     * Email a reset link if the address has an account.
     *
     * The broker's answer (sent, no such user, or wait 60 seconds) is
     * thrown away on purpose: the caller must not learn which one it was.
     */
    public function handle(ForgotPasswordData $data): void
    {
        Password::sendResetLink(['email' => $data->email]);
    }
}
