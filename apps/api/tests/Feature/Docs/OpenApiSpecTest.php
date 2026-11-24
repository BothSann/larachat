<?php

declare(strict_types=1);

use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Route;
use Symfony\Component\Yaml\Yaml;

/**
 * @return array<string, array<string, array<string, mixed>>>
 */
function specPaths(): array
{
    $file = base_path('openapi.yaml');

    expect($file)->toBeFile();

    /** @var array{paths: array<string, array<string, array<string, mixed>>>} $spec */
    $spec = Yaml::parseFile($file);

    return $spec['paths'];
}

it('documents every api/v1 route and nothing else', function (): void {
    $routes = collect(Route::getRoutes()->getRoutes())
        ->filter(fn (RoutingRoute $route): bool => str_starts_with($route->uri(), 'api/v1/'))
        ->flatMap(fn (RoutingRoute $route): array => collect($route->methods())
            ->reject(fn (string $method): bool => $method === 'HEAD')
            ->map(fn (string $method): string => mb_strtolower($method).' /'.$route->uri())
            ->all())
        ->sort()
        ->values()
        ->all();

    $documented = collect(specPaths())
        ->flatMap(fn (array $operations, string $path): array => collect(array_keys($operations))
            // A path can also hold shared `parameters`; only HTTP methods are operations.
            ->intersect(['get', 'post', 'put', 'patch', 'delete'])
            ->map(fn (string $method): string => $method.' '.$path)
            ->all())
        ->sort()
        ->values()
        ->all();

    expect($documented)->toBe($routes);
});

it('lists every status code each endpoint can answer', function (string $method, string $path, array $statuses): void {
    expect(array_keys(specPaths()[$path][$method]['responses']))->toBe($statuses);
})->with([
    'register' => ['post', '/api/v1/auth/register', [201, 403, 422]],
    'login' => ['post', '/api/v1/auth/login', [200, 403, 422, 429]],
    'logout' => ['post', '/api/v1/auth/logout', [204, 401]],
    'me' => ['get', '/api/v1/me', [200, 401]],
    'verify email' => ['get', '/api/v1/auth/email/verify/{id}/{hash}', [302, 403, 404, 429]],
    'resend verification email' => ['post', '/api/v1/auth/email/verification-notification', [202, 401, 409, 429]],
    'forgot password' => ['post', '/api/v1/auth/forgot-password', [202, 403, 422, 429]],
    'reset password' => ['post', '/api/v1/auth/reset-password', [204, 403, 422, 429]],
    'change password' => ['put', '/api/v1/me/password', [204, 401, 422, 429]],
    'search users' => ['get', '/api/v1/users', [200, 401, 403, 422, 429]],
]);

it('marks only the auth:sanctum routes as authenticated', function (string $method, string $path, bool $authenticated): void {
    $operation = specPaths()[$path][$method];

    expect(($operation['security'] ?? null) !== [])->toBe($authenticated);
})->with([
    'register' => ['post', '/api/v1/auth/register', false],
    'login' => ['post', '/api/v1/auth/login', false],
    'logout' => ['post', '/api/v1/auth/logout', true],
    'me' => ['get', '/api/v1/me', true],
    'verify email' => ['get', '/api/v1/auth/email/verify/{id}/{hash}', false],
    'resend verification email' => ['post', '/api/v1/auth/email/verification-notification', true],
    'forgot password' => ['post', '/api/v1/auth/forgot-password', false],
    'reset password' => ['post', '/api/v1/auth/reset-password', false],
    'change password' => ['put', '/api/v1/me/password', true],
    'search users' => ['get', '/api/v1/users', true],
]);

it('describes the user with every UserResource key', function (string $method, string $path, int $status): void {
    /** @var array<string, array<string, mixed>> $user */
    $user = specPaths()[$path][$method]['responses'][$status]['content']['application/json']['schema']['properties']['data']['properties'];

    expect(array_keys($user))->toBe(['id', 'name', 'username', 'email', 'email_verified_at', 'created_at'])
        ->and($user['email_verified_at']['nullable'] ?? false)->toBeTrue()
        ->and($user['id']['nullable'] ?? false)->toBeFalse();
})->with([
    'register' => ['post', '/api/v1/auth/register', 201],
    'login' => ['post', '/api/v1/auth/login', 200],
    'me' => ['get', '/api/v1/me', 200],
]);

it('marks every UserResource key as always sent', function (string $method, string $path, int $status): void {
    /** @var array{required?: list<string>} $user */
    $user = specPaths()[$path][$method]['responses'][$status]['content']['application/json']['schema']['properties']['data'];

    expect($user['required'] ?? [])->toEqualCanonicalizing(['id', 'name', 'username', 'email', 'email_verified_at', 'created_at']);
})->with([
    'register' => ['post', '/api/v1/auth/register', 201],
    'login' => ['post', '/api/v1/auth/login', 200],
    'me' => ['get', '/api/v1/me', 200],
    'update me' => ['patch', '/api/v1/me', 200],
]);
