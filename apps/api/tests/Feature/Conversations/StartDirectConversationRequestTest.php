<?php

declare(strict_types=1);

use App\Http\Requests\Conversations\StartDirectConversationRequest;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Run the form request's rules the way Laravel does, without a route.
 *
 * @param  array<string, mixed>  $body
 * @return array<string, list<string>>
 */
function startDirectErrors(User $caller, array $body): array
{
    $request = StartDirectConversationRequest::create('/', 'POST', $body);
    $request->setUserResolver(fn (): User => $caller);
    $request->setContainer(app())->setRedirector(app('redirect'));

    try {
        $request->validateResolved();
    } catch (ValidationException $e) {
        /** @var array<string, list<string>> */
        return $e->errors();
    }

    return [];
}

beforeEach(function (): void {
    $this->ann = User::factory()->create();
});

it('accepts a verified user who is not you', function (): void {
    $bob = User::factory()->create();

    expect(startDirectErrors($this->ann, ['user_id' => $bob->id]))->toBe([])
        ->and(startDirectErrors($this->ann, ['user_id' => mb_strtoupper($bob->id)]))->toBe([]);
});

it('refuses you, with its own message, in any letter case', function (string $case): void {
    $id = $case === 'upper' ? mb_strtoupper($this->ann->id) : $this->ann->id;

    expect(startDirectErrors($this->ann, ['user_id' => $id]))
        ->toBe(['user_id' => ['You cannot start a conversation with yourself.']]);
})->with(['lower', 'upper']);

it('gives the same answer for an unknown and an unverified user', function (): void {
    $carol = User::factory()->unverified()->create();
    $message = ['user_id' => ['The selected user is invalid.']];

    expect(startDirectErrors($this->ann, ['user_id' => mb_strtolower((string) Str::ulid())]))->toBe($message)
        ->and(startDirectErrors($this->ann, ['user_id' => $carol->id]))->toBe($message);
});

it('refuses a missing or malformed user_id', function (mixed $userId, string $message): void {
    $body = $userId === 'missing' ? [] : ['user_id' => $userId];

    expect(startDirectErrors($this->ann, $body))->toBe(['user_id' => [$message]]);
})->with([
    'missing' => ['missing', 'The user id field is required.'],
    'empty' => ['', 'The user id field is required.'],
    'not a ULID' => ['bob', 'The user id field must be a valid ULID.'],
    'a number' => [42, 'The user id field must be a string.'],
]);
