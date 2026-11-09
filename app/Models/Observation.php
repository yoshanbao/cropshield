<?php

namespace App\Models;

use App\Models\Concerns\HasCropShieldId;
use Illuminate\Database\Eloquent\Model;

class Observation extends Model
{
    use HasCropShieldId;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['observed_on' => 'date'];
    }

    public function cropCase()
    {
        return $this->belongsTo(CropCase::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function photo()
    {
        return $this->belongsTo(Photo::class);
    }

    public function photoUrl(): ?string
    {
        if ($this->photo_id) {
            return route('photos.show', $this->photo_id);
        }

        return in_array($this->sample_photo, ['demo-rice-first.svg', 'demo-rice-later.svg', 'demo-okra-first.svg']) ? asset('images/'.$this->sample_photo) : null;
    }
}
