<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public function observations()
    {
        return $this->hasMany(Observation::class);
    }
}
