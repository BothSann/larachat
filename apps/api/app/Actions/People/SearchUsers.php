<?php

declare(strict_types=1);

namespace App\Actions\People;

use App\Data\SearchUsersData;
use App\Models\User;
use Illuminate\Pagination\CursorPaginator;

final class SearchUsers
{
    /**
     * Verified users whose username starts with the search, without the caller.
     *
     * @return CursorPaginator<int, User>
     */
    public function handle(User $user, SearchUsersData $data): CursorPaginator
    {
        $prefix = addcslashes($data->search, '\\%_').'%';

        return User::query()
            ->whereNotNull('email_verified_at')
            ->whereKeyNot($user->id)
            ->whereLike('username', $prefix, caseSensitive: true)
            ->orderBy('username')
            ->cursorPaginate($data->perPage)
            ->withQueryString();
    }
}
