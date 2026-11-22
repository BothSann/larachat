<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Data\UpdateProfileData;
use App\Models\User;

final class UpdateProfile
{
    public function handle(User $user, UpdateProfileData $data): User
    {
        $user->fill(array_filter([
            'name' => $data->name,
            'username' => $data->username,
        ], fn (?string $value): bool => $value !== null));

        $user->save();

        return $user;
    }
}
