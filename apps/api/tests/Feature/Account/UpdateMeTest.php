<?php

declare(strict_types=1);

use App\Models\User;

it('changes the username, trimmed and lowercased', function (): void {
    $user = User::factory()->create(['username' => 'dara_01']);

    $this->actingAs($user)
        ->patchJson('/api/v1/me', ['username' => ' Dara_02 '])
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.username', 'dara_02')
        ->assertExactJsonStructure(['data' => ['id', 'name', 'username', 'email', 'email_verified_at', 'created_at']]);

    $this->assertDatabaseHas('users', ['id' => $user->id, 'username' => 'dara_02']);
});

it('frees the old username for a new sign-up straight away', function (): void {
    $user = User::factory()->create(['username' => 'dara_01']);

    $this->actingAs($user)->patchJson('/api/v1/me', ['username' => 'dara_02'])->assertOk();

    expect(User::query()->where('username', 'dara_01')->exists())->toBeFalse();
    $this->assertDatabaseHas('users', ['id' => $user->id, 'username' => 'dara_02']);
});

it('accepts your own current username', function (): void {
    $user = User::factory()->create(['username' => 'dara_01']);

    $this->actingAs($user)
        ->patchJson('/api/v1/me', ['username' => 'DARA_01'])
        ->assertOk()
        ->assertJsonPath('data.username', 'dara_01');
});

it('rejects a username someone else has', function (): void {
    User::factory()->create(['username' => 'sokha']);
    $user = User::factory()->create(['username' => 'dara_01']);

    $this->actingAs($user)
        ->patchJson('/api/v1/me', ['username' => 'Sokha'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);

    $this->assertDatabaseHas('users', ['id' => $user->id, 'username' => 'dara_01']);
});

it('rejects a username that breaks the format', function (mixed $username): void {
    $user = User::factory()->create(['username' => 'dara_01']);

    $this->actingAs($user)
        ->patchJson('/api/v1/me', ['username' => $username])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);
})->with([
    'too short' => 'a!',
    'two letters' => 'ab',
    'too long' => str_repeat('a', 31),
    'a space inside' => 'da ra',
    'a dash' => 'da-ra',
    'empty' => '',
    'null' => null,
    'a number' => 12345,
]);

it('changes only the name when only the name is sent', function (): void {
    $user = User::factory()->create(['name' => 'Dara', 'username' => 'dara_01']);

    $this->actingAs($user)
        ->patchJson('/api/v1/me', ['name' => 'Dara Sok'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Dara Sok')
        ->assertJsonPath('data.username', 'dara_01');

    $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Dara Sok', 'username' => 'dara_01']);
});

it('rejects an empty or too long name', function (mixed $name): void {
    $user = User::factory()->create(['name' => 'Dara']);

    $this->actingAs($user)
        ->patchJson('/api/v1/me', ['name' => $name])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);

    $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Dara']);
})->with([
    'empty' => '',
    'null' => null,
    'too long' => str_repeat('a', 256),
]);

it('returns the user unchanged for an empty body', function (): void {
    $user = User::factory()->create(['name' => 'Dara', 'username' => 'dara_01']);

    $this->actingAs($user)
        ->patchJson('/api/v1/me', [])
        ->assertOk()
        ->assertJsonPath('data.name', 'Dara')
        ->assertJsonPath('data.username', 'dara_01');
});

it('lets an unverified user update', function (): void {
    $user = User::factory()->unverified()->create(['username' => 'dara_01']);

    $this->actingAs($user)
        ->patchJson('/api/v1/me', ['username' => 'dara_02'])
        ->assertOk()
        ->assertJsonPath('data.username', 'dara_02')
        ->assertJsonPath('data.email_verified_at', null);
});

it('refuses a logged-out caller with 401', function (): void {
    $this->patchJson('/api/v1/me', ['name' => 'Dara'])
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Unauthenticated.']);
});
