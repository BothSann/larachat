<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

it('gives every user a ULID primary key', function (): void {
    $user = User::factory()->create();

    expect($user->getKey())->toBeString()
        ->and(Str::isUlid($user->getKey()))->toBeTrue();
});

it('stores user ids in a 26-character column', function (): void {
    expect(Schema::getColumnType('users', 'id'))->toBe('bpchar')
        ->and(Schema::getColumnType('sessions', 'user_id'))->toBe('bpchar');
});
