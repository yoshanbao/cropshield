<?php

namespace App\Services;

use App\Models\Photo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PhotoService
{
    public function store(UploadedFile $file, string $userId): Photo
    {
        $size = getimagesize($file->getRealPath());
        if (! $size || $size[0] * $size[1] > 12000000) {
            throw ValidationException::withMessages(['photo' => 'Use a photo of 12 megapixels or less.']);
        }
        $source = @imagecreatefromstring($file->getContent());
        if (! $source) {
            throw ValidationException::withMessages(['photo' => 'This image could not be read. Choose another JPEG, PNG, or WebP.']);
        }
        $scale = min(1, 1600 / max($size[0], $size[1]));
        $image = imagecreatetruecolor(max(1, (int) ($size[0] * $scale)), max(1, (int) ($size[1] * $scale)));
        imagefill($image, 0, 0, imagecolorallocate($image, 255, 255, 255));
        imagecopyresampled($image, $source, 0, 0, 0, 0, imagesx($image), imagesy($image), $size[0], $size[1]);
        ob_start();
        imagejpeg($image, null, 85);
        $bytes = ob_get_clean();
        $id = (string) Str::uuid();
        $path = 'crop-photos/'.$id.'.jpg';
        if (! Storage::disk('local')->put($path, $bytes)) {
            throw ValidationException::withMessages(['photo' => 'The photo could not be saved. Try again.']);
        }

        return Photo::create(['id' => $id, 'user_id' => $userId, 'path' => $path, 'mime_type' => 'image/jpeg']);
    }
}
