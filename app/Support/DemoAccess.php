<?php

namespace App\Support;

use Illuminate\Http\Request;

class DemoAccess
{
    public static function allowed(Request $request): bool
    {
        return app()->environment('local', 'testing') && config('cropshield.local_demo') && in_array($request->getHost(), ['localhost', '127.0.0.1', '::1'], true);
    }
}
