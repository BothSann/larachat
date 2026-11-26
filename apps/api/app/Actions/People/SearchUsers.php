<?php

declare(strict_types=1);

namespace App\Actions\People;

use App\Data\SearchUsersData;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\CursorPaginator;

final class SearchUsers
{
    /**
     * Verified users, without the caller. With a search, only usernames that start with it.
     *
     * @return CursorPaginator<int, User>
     */
    public function handle(User $user, SearchUsersData $data): CursorPaginator
    {
        return User::query()
            ->whereNotNull('email_verified_at')
            ->whereKeyNot($user->id)
            ->when($data->search, function (Builder $query, string $search): void {
                $query->whereLike('username', addcslashes($search, '\\%_').'%', caseSensitive: true);
            })
            ->orderBy('username')
            ->cursorPaginate($data->perPage)
            ->withQueryString();
    }
}
