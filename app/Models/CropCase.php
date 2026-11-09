<?php

namespace App\Models;

use App\Models\Concerns\HasCropShieldId;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class CropCase extends Model
{
    use HasCropShieldId;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['screening' => 'array', 'sample' => 'boolean', 'observed_on' => 'date', 'next_follow_up' => 'date'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function observations()
    {
        return $this->hasMany(Observation::class)->orderBy('observed_on')->orderBy('created_at');
    }

    public function assignedWorkers()
    {
        return $this->belongsToMany(User::class, 'case_assignments');
    }

    public function statusEvents()
    {
        return $this->hasMany(CaseStatusEvent::class)->orderBy('created_at');
    }

    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if ($user->role === 'worker') {
            $query->where(function (Builder $query) use ($user) {
                $query->where('user_id', $user->id)->orWhereHas('assignedWorkers', fn (Builder $q) => $q->where('users.id', $user->id));
            });
        }
    }

    public function reminder(): array
    {
        if ($this->status === 'closed') {
            return ['Closed', 'No follow-up needed', 'neutral'];
        }
        if (! $this->next_follow_up) {
            return ['No follow-up scheduled', 'Choose a date in the case plan', 'neutral'];
        }
        if ($this->next_follow_up->isToday()) {
            return ['Due today', $this->next_follow_up->format('M j, Y'), 'amber'];
        }
        if ($this->next_follow_up->isBefore(today())) {
            return ['Overdue', $this->next_follow_up->format('M j, Y'), 'red'];
        }

        return ['Upcoming', $this->next_follow_up->format('M j, Y'), 'blue'];
    }
}
