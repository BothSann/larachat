<?php

declare(strict_types=1);

use App\Actions\Conversations\StartDirectConversation;
use App\Data\StartDirectConversationData;
use App\Enums\ConversationType;
use App\Enums\ParticipantRole;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

function startDirect(User $caller, User|string $other): Conversation
{
    $userId = $other instanceof User ? $other->id : $other;

    return app(StartDirectConversation::class)->handle($caller, new StartDirectConversationData(userId: $userId));
}

/**
 * @return array{0: User, 1: User} The user with the smaller id first.
 */
function sortedPair(): array
{
    $users = User::factory()->count(2)->create()->sortBy('id')->values();

    return [$users[0], $users[1]];
}

it('builds the key with the smaller id first, whoever asks', function (): void {
    [$low, $high] = sortedPair();

    $conversation = startDirect($high, $low);

    expect($conversation->direct_key)->toBe($low->id.':'.$high->id)
        ->and($conversation->type)->toBe(ConversationType::Direct)
        ->and($conversation->created_by)->toBe($high->id)
        ->and($conversation->wasRecentlyCreated)->toBeTrue();
});

it('returns the same conversation when asked again, from either side', function (): void {
    [$ann, $bob] = sortedPair();

    $first = startDirect($ann, $bob);
    $again = startDirect($ann, $bob);
    $fromBob = startDirect($bob, $ann);

    expect($again->id)->toBe($first->id)
        ->and($fromBob->id)->toBe($first->id)
        ->and($again->wasRecentlyCreated)->toBeFalse()
        ->and($fromBob->wasRecentlyCreated)->toBeFalse()
        ->and($fromBob->created_by)->toBe($ann->id)
        ->and(Conversation::count())->toBe(1);
});

it('adds both users as members of a new conversation, once', function (): void {
    [$ann, $bob] = sortedPair();

    startDirect($ann, $bob);
    $conversation = startDirect($bob, $ann);

    expect($conversation->relationLoaded('participants'))->toBeTrue()
        ->and($conversation->participants->pluck('id')->sort()->values()->all())->toBe([$ann->id, $bob->id])
        ->and($conversation->participants->every(fn (User $user): bool => $user->pivot->role === ParticipantRole::Member))->toBeTrue()
        ->and($conversation->participants->every(fn (User $user): bool => $user->pivot->joined_at !== null))->toBeTrue();

    $this->assertDatabaseCount('conversation_participants', 2);
});

it('leaves nothing behind when adding a participant fails', function (): void {
    $ann = User::factory()->create();

    expect(fn () => startDirect($ann, mb_strtolower((string) Str::ulid())))->toThrow(QueryException::class);

    $this->assertDatabaseCount('conversations', 0);
    $this->assertDatabaseCount('conversation_participants', 0);
});
