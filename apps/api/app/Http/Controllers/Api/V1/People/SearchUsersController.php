<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\People;

use App\Actions\People\SearchUsers;
use App\Http\Controllers\Controller;
use App\Http\Requests\People\SearchUsersRequest;
use App\Http\Resources\PublicUserResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Knuckles\Scribe\Attributes\Authenticated;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\QueryParam;
use Knuckles\Scribe\Attributes\Response as ExampleResponse;
use Knuckles\Scribe\Attributes\ResponseFromApiResource;

#[Group('People', 'Finding other users.')]
final class SearchUsersController extends Controller
{
    /**
     * Handle the incoming request.
     */
    #[Endpoint('Search users', 'List verified users in username order, or only those whose username starts with the search. Never lists you. 60 requests a minute per user.')]
    #[Authenticated]
    #[QueryParam('search', 'string', 'Start of a username: 2 to 30 letters, numbers, or underscores. Trimmed and lowercased, and one leading @ is removed. Leave out, or send empty, to list everyone.', required: false, example: 'bo')]
    #[QueryParam('per_page', 'integer', 'Users per page, 1 to 100. Default 30.', required: false, example: 30)]
    #[QueryParam('cursor', 'string', 'next_cursor or prev_cursor from the page before. Leave out for page 1.', required: false, example: 'No-example')]
    #[ResponseFromApiResource(PublicUserResource::class, User::class, 200, 'One page of users', collection: true, cursorPaginate: 30)]
    #[ExampleResponse(['message' => 'Unauthenticated.'], 401, 'Not logged in')]
    #[ExampleResponse(['message' => 'Your email address is not verified.', 'code' => 'email_not_verified'], 403, 'Email not verified')]
    #[ExampleResponse(['message' => 'The search must be 2 to 30 letters, numbers, or underscores.', 'errors' => ['search' => ['The search must be 2 to 30 letters, numbers, or underscores.']]], 422, 'A bad search, page size, or cursor')]
    #[ExampleResponse(['message' => 'Too Many Attempts.'], 429, 'More than 60 searches in a minute')]
    public function __invoke(#[CurrentUser] User $user, SearchUsersRequest $request, SearchUsers $searchUsers): AnonymousResourceCollection
    {
        return PublicUserResource::collection($searchUsers->handle($user, $request->toDto()));
    }
}
