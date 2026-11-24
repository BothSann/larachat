<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Testing\TestResponse;

const SEARCH_USERS_URL = '/api/v1/users';

function searchUser(string $username, ?string $name = null): User
{
    return User::factory()->create(['username' => $username, ...($name === null ? [] : ['name' => $name])]);
}

/**
 * @param  array<string, mixed>  $query
 */
function searchUsersUrl(array $query): string
{
    return SEARCH_USERS_URL.'?'.http_build_query($query);
}

/**
 * @param  array<string, mixed>  $parameters
 */
function encodedCursor(array $parameters): string
{
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode((string) json_encode($parameters)));
}

/**
 * @return list<string>
 */
function foundUsernames(TestResponse $response): array
{
    return $response->json('data.*.username');
}

beforeEach(function (): void {
    $this->ann = searchUser('ann');
});

it('finds verified users by the start of their username, in username order', function (string $search): void {
    foreach (['carl', 'bora', 'bobby', 'bob'] as $username) {
        searchUser($username);
    }

    $response = $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => $search]))->assertOk();

    expect(foundUsernames($response))->toBe(['bob', 'bobby', 'bora']);
})->with(['lowercase' => 'bo', 'with @ and a capital' => '@Bo', 'with spaces around' => ' bo ']);

it('matches only the start of the username', function (): void {
    searchUser('jumbo');

    $response = $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'bo']))->assertOk();

    expect(foundUsernames($response))->toBe([]);
});

it('never finds the caller', function (): void {
    searchUser('anna');

    $response = $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'an']))->assertOk();

    expect(foundUsernames($response))->toBe(['anna']);
});

it('never finds an unverified user', function (): void {
    User::factory()->unverified()->create(['username' => 'bonnie']);

    $response = $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'bo']))->assertOk();

    expect(foundUsernames($response))->toBe([]);
});

it('sends only the id, name and username of each user', function (): void {
    $bob = searchUser('bob', 'Bob Smith');

    $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'bob']))
        ->assertOk()
        ->assertExactJsonStructure([
            'data' => ['*' => ['id', 'name', 'username']],
            'links' => ['first', 'last', 'prev', 'next'],
            'meta' => ['path', 'per_page', 'next_cursor', 'prev_cursor'],
        ])
        ->assertJsonPath('data.0', ['id' => $bob->id, 'name' => 'Bob Smith', 'username' => 'bob']);
});

it('does not search names', function (): void {
    searchUser('bob', 'Bob Smith');

    $response = $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'Smith']))->assertOk();

    expect(foundUsernames($response))->toBe([]);
});

it('treats an underscore as an underscore', function (): void {
    searchUser('b_x');
    searchUser('bax');

    $response = $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'b_']))->assertOk();

    expect(foundUsernames($response))->toBe(['b_x']);
});

it('rejects a bad search', function (array $query): void {
    $this->actingAs($this->ann)->getJson(searchUsersUrl($query))
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['search']);
})->with([
    'missing' => [[]],
    'empty' => [['search' => '']],
    'one letter' => [['search' => 'b']],
    'one letter after the @' => [['search' => '@b']],
    'only an @' => [['search' => '@']],
    'two @' => [['search' => '@@bo']],
    'a percent sign' => [['search' => 'b%']],
    '31 letters' => [['search' => str_repeat('b', 31)]],
    'an array' => [['search' => ['bo']]],
]);

it('pages with a cursor, with no repeats', function (): void {
    foreach (['bob', 'bobby', 'bora'] as $username) {
        searchUser($username);
    }

    $first = $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'bo', 'per_page' => 2]))->assertOk();
    $second = $this->getJson(searchUsersUrl(['search' => 'bo', 'per_page' => 2, 'cursor' => $first->json('meta.next_cursor')]))->assertOk();

    expect(foundUsernames($first))->toBe(['bob', 'bobby'])
        ->and(foundUsernames($second))->toBe(['bora'])
        ->and($second->json('meta.next_cursor'))->toBeNull();
});

it('keeps the search and page size in the next link', function (): void {
    foreach (['bob', 'bobby', 'bora'] as $username) {
        searchUser($username);
    }

    $first = $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'bo', 'per_page' => 2]))->assertOk();
    $next = $first->json('links.next');

    expect($next)->toContain('search=bo', 'per_page=2');

    $second = $this->getJson($next)->assertOk();

    expect(foundUsernames($second))->toBe(['bora'])
        ->and($second->json('meta.per_page'))->toBe(2);
});

it('sends 30 users a page by default and up to 100', function (array $query, int $perPage): void {
    $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'bo', ...$query]))
        ->assertOk()
        ->assertJsonPath('meta.per_page', $perPage);
})->with([
    'default' => [[], 30],
    'smallest' => [['per_page' => 1], 1],
    'largest' => [['per_page' => 100], 100],
]);

it('rejects a bad page size', function (mixed $perPage): void {
    $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'bo', 'per_page' => $perPage]))
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['per_page']);
})->with([0, 101, 'ten']);

it('treats an empty cursor as page 1', function (): void {
    searchUser('bob');

    $response = $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'bo', 'cursor' => '']))->assertOk();

    expect(foundUsernames($response))->toBe(['bob']);
});

it('rejects a bad cursor', function (mixed $cursor): void {
    $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'bo', 'cursor' => $cursor]))
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['cursor']);
})->with([
    'garbage' => 'garbage',
    'an array' => [['x']],
    'no username' => encodedCursor(['id' => 'x', '_pointsToNextItems' => true]),
    'username is an array' => encodedCursor(['username' => ['bob'], '_pointsToNextItems' => true]),
    'username is null' => encodedCursor(['username' => null, '_pointsToNextItems' => true]),
]);

it('refuses a logged-out caller with 401', function (): void {
    $this->getJson(searchUsersUrl(['search' => 'bo']))
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Unauthenticated.']);
});

it('refuses an unverified caller with 403', function (): void {
    $this->actingAs(User::factory()->unverified()->create())
        ->getJson(searchUsersUrl(['search' => 'bo']))
        ->assertForbidden()
        ->assertExactJson(['message' => 'Your email address is not verified.', 'code' => 'email_not_verified']);
});

it('allows 60 searches a minute per user, then answers 429', function (): void {
    $bob = searchUser('bob');

    foreach (range(1, 60) as $try) {
        $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'zz']))->assertOk();
    }

    $this->actingAs($this->ann)->getJson(searchUsersUrl(['search' => 'zz']))->assertTooManyRequests();
    $this->actingAs($bob)->getJson(searchUsersUrl(['search' => 'zz']))->assertOk();
});
