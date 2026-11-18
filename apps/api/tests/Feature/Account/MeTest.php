<?php

declare(strict_types=1);

use App\Models\User;

it('returns the logged-in user with the user resource shape', function (): void {
    $user = User::factory()->create(['username' => 'dara_01']);

    $this->actingAs($user)
        ->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.username', 'dara_01')
        ->assertExactJsonStructure(['data' => ['id', 'name', 'username', 'email', 'email_verified_at', 'created_at']]);
});

it('refuses a logged-out caller with 401', function (): void {
    $this->getJson('/api/v1/me')
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Unauthenticated.']);
});

it('no longer serves the starter /user route', function (): void {
    $this->getJson('/api/v1/user')->assertNotFound();
});
