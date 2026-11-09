<?php

namespace App\Exceptions;

use RuntimeException;

class ScreeningUnavailable extends RuntimeException
{
    // Only safe, user-facing screening messages use this exception.
}
