<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Auth\ResendVerificationEmailController;
use App\Http\Controllers\Api\V1\Auth\VerifyEmailController;
use App\Http\Controllers\Api\V1\MeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/me', [MeController::class, 'show'])->name('me.show');
    Route::post('/auth/logout', LogoutController::class)->name('auth.logout');

    Route::post('/auth/email/verification-notification', ResendVerificationEmailController::class)
        ->middleware('throttle:verification-notification')
        ->name('verification.send');

    Route::patch('/me', [MeController::class, 'update'])->name('me.update');
});

Route::post('/auth/register', RegisterController::class)->name('auth.register');

Route::post('/auth/login', LoginController::class)
    ->middleware('throttle:login')
    ->name('auth.login');

Route::get('/auth/email/verify/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['signed', 'throttle:6,1'])
    ->whereUlid('id')
    ->name('verification.verify');
