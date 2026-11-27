<?php

declare(strict_types=1);

use App\Enums\ParticipantRole;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\ParticipantResource;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * @return array<string, mixed>
 */
function asJson(mixed $resource): array
{
    /** @var array<string, mixed> */
    return json_decode((string) json_encode($resource->toResponse(Request::create('/'))->getData(true)), true);
}

function directWith(User ...$users): Conversation
{
    $conversation = Conversation::factory()->direct()->create();

    foreach ($users as $user) {
        $conversation->participants()->attach($user->id, ['role' => ParticipantRole::Member, 'joined_at' => now()]);
    }

    return $conversation;
}

it('shows a participant as a public user plus their role', function (): void {
    $ann = User::factory()->create(['name' => 'Ann', 'username' => 'ann']);
    $participant = directWith($ann)->participants()->first();

    expect(asJson(ParticipantResource::make($participant))['data'])->toBe([
        'id' => $ann->id,
        'name' => 'Ann',
        'username' => 'ann',
        'role' => 'member',
    ]);
});

it('leaves out role when the user was not loaded through a conversation', function (): void {
    $ann = User::factory()->create();

    expect(asJson(ParticipantResource::make($ann))['data'])->toHaveKeys(['id', 'name', 'username'])
        ->not->toHaveKey('role');
});

it('shows a conversation with its participants, and never the direct key', function (): void {
    $ann = User::factory()->create();
    $bob = User::factory()->create();
    $conversation = directWith($ann, $bob)->load('participants');

    $json = asJson(ConversationResource::make($conversation))['data'];

    expect(array_keys($json))->toBe(['id', 'type', 'name', 'last_message_at', 'created_at', 'participants'])
        ->and($json['id'])->toBe($conversation->id)
        ->and($json['type'])->toBe('direct')
        ->and($json['name'])->toBeNull()
        ->and($json['last_message_at'])->toBeNull()
        ->and($json['created_at'])->toBe($conversation->created_at?->toJSON())
        ->and($json['participants'])->toHaveCount(2)
        ->and(array_keys($json['participants'][0]))->toBe(['id', 'name', 'username', 'role']);
});

it('leaves out participants when they were not loaded', function (): void {
    $conversation = directWith(User::factory()->create());

    expect(asJson(ConversationResource::make($conversation->fresh()))['data'])->not->toHaveKey('participants');
});
