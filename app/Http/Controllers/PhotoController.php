<?php

namespace App\Http\Controllers;

use App\Models\CropCase;
use App\Models\Photo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    public function show(Request $request, Photo $photo)
    {
        $visible = $photo->user_id === $request->user()->id || CropCase::visibleTo($request->user())->whereHas('observations', fn ($q) => $q->where('photo_id', $photo->id))->exists();
        abort_unless($visible, 404);
        abort_unless(Storage::disk('local')->exists($photo->path), 404);

        return response()->file(Storage::disk('local')->path($photo->path), ['Content-Type' => $photo->mime_type, 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}
