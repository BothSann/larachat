<?php

declare(strict_types=1);

use App\Enums\ConversationType;
use App\Enums\ParticipantRole;

it('lists the conversation types', function (): void {
    expect(array_map(fn (ConversationType $type): string => $type->value, ConversationType::cases()))
        ->toBe(['direct', 'group']);
});

it('lists the participant roles', function (): void {
    expect(array_map(fn (ParticipantRole $role): string => $role->value, ParticipantRole::cases()))
        ->toBe(['owner', 'admin', 'member']);
});

it('turns a stored string into a case', function (): void {
    expect(ConversationType::from('direct'))->toBe(ConversationType::Direct)
        ->and(ParticipantRole::tryFrom('boss'))->toBeNull();
});
