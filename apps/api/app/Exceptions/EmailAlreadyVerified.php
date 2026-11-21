<?php

declare(strict_types=1);

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

final class EmailAlreadyVerified extends Exception
{
    public function __construct()
    {
        parent::__construct('Your email is already verified.');
    }

    /**
     * Laravel calls this when the exception isn't caught.
     */
    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code' => 'already_verified',
        ], 409);
    }
}
