<?php

namespace App\Models;

use App\Models\Concerns\HasCropShieldId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasCropShieldId, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'active'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed', 'active' => 'boolean', 'is_demo' => 'boolean'];
    }

    public function homeRoute(): string
    {
        return match ($this->role) {
            'admin' => 'admin.dashboard',
            'owner' => 'owner.dashboard',
            default => 'worker.dashboard',
        };
    }
}
