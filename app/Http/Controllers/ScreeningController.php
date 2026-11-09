<?php

namespace App\Http\Controllers;

use App\Exceptions\ScreeningUnavailable;
use App\Services\DraftService;
use App\Services\ScreeningService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ScreeningController extends Controller
{
    public function store(Request $request, DraftService $drafts, ScreeningService $screening)
    {
        $draft = $drafts->save($request);
        $drafts->validateComplete($draft->data);
        if (isset($draft->data['result'])) {
            return redirect()->route('cases.create', ['result' => 'ready'])->withFragment('result');
        }
        $lock = Cache::lock('crop-screen:'.$request->user()->id, 55);
        if (! $lock->get()) {
            return back()->with('error', 'A check is already running. Your draft is saved.');
        }
        $data = $draft->data;
        try {
            $result = $screening->screen($data);
            if (! $drafts->finishCheck($draft, $data, $result)) {
                return redirect()->route('cases.create')->with('error', 'Your draft changed while the photo was being checked. Check the current photo and symptoms again.');
            }

            return redirect()->route('cases.create', ['result' => 'ready'])->withFragment('result');
        } catch (ScreeningUnavailable $error) {
            $drafts->finishCheck($draft, $data, null, $error->getMessage());

            return redirect()->route('cases.create')->with('error', $error->getMessage());
        } finally {
            $lock->release();
        }
    }
}
