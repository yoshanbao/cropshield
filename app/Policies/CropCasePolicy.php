<?php

namespace App\Policies;

use App\Models\CropCase;
use App\Models\User;

class CropCasePolicy
{
    public function view(User $user, CropCase $case): bool
    {
        return $user->role !== 'worker' || $case->user_id === $user->id || $case->assignedWorkers()->where('users.id', $user->id)->exists();
    }

    public function update(User $user, CropCase $case): bool
    {
        return $user->role !== 'admin' && $this->view($user, $case);
    }
}
