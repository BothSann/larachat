<?php

declare(strict_types=1);

namespace App\Data;

final readonly class StartDirectConversationData
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        public string $userId,
    ) {}
}
