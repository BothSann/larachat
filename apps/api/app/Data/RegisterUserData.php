<?php

declare(strict_types=1);

namespace App\Data;

final readonly class RegisterUserData
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        public string $name,
        public string $username,
        public string $email,
        public string $password,
    ) {}
}
