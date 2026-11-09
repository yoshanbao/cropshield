<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

trait HasCropShieldId
{
    use HasUuids;

    // New records use UUIDs. Imported records keep their original safe IDs.
    protected function isValidUniqueId($value): bool
    {
        return is_string($value) && preg_match('/^[a-zA-Z0-9-]{1,191}$/', $value) === 1;
    }
}
