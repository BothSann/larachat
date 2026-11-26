<?php

declare(strict_types=1);

use App\Enums\ConversationType;
use App\Models\Conversation;

it('makes a direct conversation without a name', function (): void {
    $conversation = Conversation::factory()->direct()->create();

    expect($conversation->type)->toBe(ConversationType::Direct)
        ->and($conversation->name)->toBeNull()
        ->and($conversation->direct_key)->not->toBeNull();
});

it('makes a group conversation with a name', function (): void {
    $conversation = Conversation::factory()->group()->create();

    expect($conversation->type)->toBe(ConversationType::Group)
        ->and($conversation->name)->not->toBeNull()
        ->and($conversation->direct_key)->toBeNull();
});

it('makes many direct conversations without clashing', function (): void {
    Conversation::factory()->direct()->count(5)->create();

    expect(Conversation::count())->toBe(5);
});
