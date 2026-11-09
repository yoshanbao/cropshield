<?php

namespace App\Http\Controllers;

use App\Models\Draft;
use App\Services\DraftService;
use App\Support\DemoAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DraftController extends Controller
{
    public function store(Request $request, DraftService $drafts)
    {
        $drafts->save($request);

        return redirect()->route('cases.create')->with('success', 'Draft saved to your account.');
    }

    public function destroy(Request $request)
    {
        Draft::where('user_id', $request->user()->id)->delete();

        return redirect()->route('cases.create')->with('success', 'Draft discarded. Saved cases are unchanged.');
    }

    public function demo(Request $request)
    {
        abort_unless($request->user()->is_demo && DemoAccess::allowed($request), 403);
        Draft::updateOrCreate(['user_id' => $request->user()->id], ['data' => [
            'submission_id' => (string) Str::uuid(), 'crop' => 'Rice', 'mode' => 'demo', 'scenario' => 'supported', 'demo_kind' => 'Disease',
            'sample_photo' => 'demo-rice-first.svg', 'area' => 'Rice field · Practice plot', 'sample_label' => 'Plant 01',
            'symptoms' => 'Spindle-shaped brown spots with gray centers are visible on lower leaves.', 'observed_on' => today()->subDays(3)->toDateString(),
        ]]);

        return redirect()->route('cases.create')->with('success', 'Rice example loaded. Results will be clearly labeled as simulated.');
    }
}
