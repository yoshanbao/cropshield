<?php

namespace App\Http\Controllers;

use App\Models\CropCase;
use App\Models\Observation;
use App\Services\PhotoService;
use App\Support\DemoAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ObservationController extends Controller
{
    public function store(Request $request, CropCase $case, PhotoService $photos)
    {
        Gate::authorize('update', $case);
        abort_if($case->status === 'closed', 403, 'Reopen this case before adding a follow-up.');
        $data = $request->validate([
            'observation_id' => ['required', 'uuid'], 'revision' => ['required', 'integer'],
            'observed_on' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.$case->observed_on->toDateString(), 'before_or_equal:today'],
            'symptoms' => ['required', 'string', 'max:2000'], 'actions' => ['required', 'string', 'max:2000'],
            'reported_change' => ['required', Rule::in(['Improved', 'Unchanged', 'Worsened', 'Uncertain'])],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'demo_photo' => ['nullable', 'boolean'],
        ]);
        if ($existing = Observation::find($data['observation_id'])) {
            abort_unless($existing->crop_case_id === $case->id && $existing->user_id === $request->user()->id, 403);

            return redirect()->route('cases.show', $case);
        }
        if ($request->boolean('demo_photo')) {
            abort_unless($case->sample && $case->crop === 'Rice' && $request->user()->is_demo && DemoAccess::allowed($request), 403);
        }
        $photo = $request->hasFile('photo') ? $photos->store($request->file('photo'), $request->user()->id) : null;
        DB::transaction(function () use ($case, $request, $data, $photo) {
            $locked = CropCase::lockForUpdate()->findOrFail($case->id);
            if ($locked->revision !== (int) $data['revision']) {
                throw ValidationException::withMessages(['revision' => 'This case changed. Reload before adding your follow-up.']);
            }
            $locked->observations()->create(['id' => $data['observation_id'], 'user_id' => $request->user()->id, 'observed_on' => $data['observed_on'],
                'symptoms' => $data['symptoms'], 'actions' => $data['actions'], 'reported_change' => $data['reported_change'],
                'photo_id' => $photo?->id, 'sample_photo' => ! $photo && $request->boolean('demo_photo') ? 'demo-rice-later.svg' : null]);
            $locked->increment('revision');
        });

        return redirect()->route('cases.show', [$case, 'tab' => 'compare'])->with('success', 'Follow-up saved. The initial observation is unchanged.');
    }
}
