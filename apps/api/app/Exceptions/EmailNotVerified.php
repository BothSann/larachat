<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;
use Illuminate\Contracts\Debug\ShouldntReport;
use Illuminate\Http\JsonResponse;

final class EmailNotVerified extends Exception implements ShouldntReport
{
    public function __construct(
    ) {
        parent::__construct('Your email address is not verified.');
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code' => 'email_not_verified',
        ], 403);
    }
}
