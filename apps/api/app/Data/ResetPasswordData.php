<?php

declare(strict_types=1);

namespace App\Data;

final readonly class ResetPasswordData
{
    public function __construct(
        public string $token,
        public string $email,
        #[\SensitiveParameter]
        public string $password,
    ) {}
}
