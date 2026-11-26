<?php

declare(strict_types=1);

use App\Enums\ConversationType;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

it('gives a new conversation a ULID', function (): void {
    $conversation = Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Team',
        'created_by' => User::factory()->create()->id,
    ]);

    expect(Str::isUlid($conversation->id))->toBeTrue();
});

it('casts type to the enum and last_message_at to a date', function (): void {
    $conversation = Conversation::create([
        'type' => ConversationType::Direct,
        'direct_key' => 'a:b',
        'created_by' => User::factory()->create()->id,
        'last_message_at' => '2026-11-26 09:30:00',
    ]);

    $fresh = $conversation->fresh();

    expect($fresh?->type)->toBe(ConversationType::Direct)
        ->and($fresh?->last_message_at)->toBeInstanceOf(Carbon::class);
});

it('stores the enum as its string value', function (): void {
    Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Team',
        'created_by' => User::factory()->create()->id,
    ]);

    $this->assertDatabaseHas('conversations', ['type' => 'group']);
});

it('knows who started it', function (): void {
    $ann = User::factory()->create();
    $conversation = Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Team',
        'created_by' => $ann->id,
    ]);

    expect($conversation->creator->is($ann))->toBeTrue();
});
