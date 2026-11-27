<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Conversations;

use App\Actions\Conversations\StartDirectConversation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Conversations\StartDirectConversationRequest;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Knuckles\Scribe\Attributes\Authenticated;
use Knuckles\Scribe\Attributes\BodyParam;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ExampleResponse;
use Knuckles\Scribe\Attributes\ResponseFromApiResource;

#[Group('Conversations', 'Direct and group conversations.')]
final class StartDirectConversationController extends Controller
{
    /**
     * Handle the incoming request.
     */
    #[Endpoint('Start a direct conversation', 'Start a direct conversation with another verified user, or get the one you already have. Either of you asking gets the same conversation.')]
    #[Authenticated]
    #[BodyParam('user_id', 'string', 'ULID of the other user. Must be verified, and not you.', example: '01kb0m7v4qg5r8n3d2w6y9x1ze')]
    #[ResponseFromApiResource(ConversationResource::class, Conversation::class, 201, 'New conversation', factoryStates: ['direct'], with: ['participants'])]
    #[ResponseFromApiResource(ConversationResource::class, Conversation::class, 200, 'You already had one with this user', factoryStates: ['direct'], with: ['participants'])]
    #[ExampleResponse(['message' => 'Unauthenticated.'], 401, 'Not logged in')]
    #[ExampleResponse(['message' => 'Your email address is not verified.', 'code' => 'email_not_verified'], 403, 'Email not verified')]
    #[ExampleResponse(['message' => 'You cannot start a conversation with yourself.', 'errors' => ['user_id' => ['You cannot start a conversation with yourself.']]], 422, 'user_id is you, missing, or not a ULID')]
    #[ExampleResponse(['message' => 'The selected user is invalid.', 'errors' => ['user_id' => ['The selected user is invalid.']]], 422, 'No verified user has this id')]
    public function __invoke(#[CurrentUser] User $user, StartDirectConversationRequest $request, StartDirectConversation $startDirectConversation): JsonResponse
    {
        $conversation = $startDirectConversation->handle($user, $request->toDto());

        return ConversationResource::make($conversation)
            ->response()
            ->setStatusCode($conversation->wasRecentlyCreated ? 201 : 200);
    }
}
