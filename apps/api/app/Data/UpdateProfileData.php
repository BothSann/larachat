<?php

declare(strict_types=1);

namespace App\Data;

final readonly class UpdateProfileData
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        public ?string $name = null,
        public ?string $username = null,
    ) {}
}
