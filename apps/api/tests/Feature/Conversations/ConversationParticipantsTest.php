<?php

declare(strict_types=1);

use App\Enums\ParticipantRole;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;

it('lists the users in a conversation with their role', function (): void {
    $conversation = Conversation::factory()->direct()->create();
    $ann = User::factory()->create();
    $bob = User::factory()->create();

    $conversation->participants()->attach([
        $ann->id => ['role' => ParticipantRole::Member, 'joined_at' => now()],
        $bob->id => ['role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $participants = $conversation->fresh()?->participants;

    expect($participants)->toHaveCount(2)
        ->and($participants?->pluck('id')->sort()->values()->all())->toBe(collect([$ann->id, $bob->id])->sort()->values()->all());
});

it('casts the pivot role to the enum and joined_at to a date', function (): void {
    $conversation = Conversation::factory()->group()->create();
    $ann = User::factory()->create();
    $conversation->participants()->attach($ann->id, ['role' => ParticipantRole::Owner, 'joined_at' => now()]);

    $pivot = $conversation->fresh()?->participants->first()?->pivot;

    expect($pivot)->toBeInstanceOf(ConversationParticipant::class)
        ->and($pivot?->role)->toBe(ParticipantRole::Owner)
        ->and($pivot?->joined_at)->toBeInstanceOf(Carbon::class);
});

it('lists the conversations a user is in', function (): void {
    $ann = User::factory()->create();
    $first = Conversation::factory()->group()->create();
    $second = Conversation::factory()->direct()->create();
    Conversation::factory()->group()->create();

    $first->participants()->attach($ann->id, ['role' => ParticipantRole::Member, 'joined_at' => now()]);
    $second->participants()->attach($ann->id, ['role' => ParticipantRole::Member, 'joined_at' => now()]);

    expect($ann->conversations()->pluck('conversations.id')->sort()->values()->all())
        ->toBe(collect([$first->id, $second->id])->sort()->values()->all());
});

it('refuses to attach the same user twice', function (): void {
    $conversation = Conversation::factory()->group()->create();
    $ann = User::factory()->create();
    $conversation->participants()->attach($ann->id, ['role' => ParticipantRole::Member, 'joined_at' => now()]);

    expect(fn () => $conversation->participants()->attach($ann->id, ['role' => ParticipantRole::Member, 'joined_at' => now()]))
        ->toThrow(UniqueConstraintViolationException::class);
});
