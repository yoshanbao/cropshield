<?php

namespace App\Services;

use App\Models\Draft;
use App\Support\DemoAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DraftService
{
    public function current(string $userId): Draft
    {
        return Draft::firstOrCreate(['user_id' => $userId], ['data' => ['submission_id' => (string) Str::uuid(), 'crop' => 'Rice', 'observed_on' => today()->toDateString(), 'mode' => 'live', 'sample_label' => 'Plant 01']]);
    }

    public function save(Request $request): Draft
    {
        $draft = $this->current($request->user()->id);
        $data = $request->validate([
            'submission_id' => ['required', 'uuid'],
            'crop' => ['nullable', Rule::in(array_keys(config('cropshield.crops')))],
            'area' => ['nullable', 'string', 'max:120'],
            'sample_label' => ['nullable', 'string', 'max:80'],
            'plant_age' => ['nullable', 'string', 'max:60'],
            'symptoms' => ['nullable', 'string', 'max:2000'],
            'actions' => ['nullable', 'string', 'max:2000'],
            'observed_on' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'next_follow_up' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:observed_on'],
            'photo_id' => ['nullable', Rule::exists('photos', 'id')->where('user_id', $request->user()->id)],
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'mode' => ['required', Rule::in(['live', 'demo'])],
            'scenario' => ['nullable', Rule::in(['supported', 'unclear', 'service-error', 'outside'])],
            'demo_kind' => ['nullable', Rule::in(['Disease', 'Pest'])],
        ]);
        abort_if($data['mode'] === 'demo' && (! $request->user()->is_demo || ! DemoAccess::allowed($request)), 403);
        unset($data['photo']);
        if ($request->hasFile('photo')) {
            $data['photo_id'] = app(PhotoService::class)->store($request->file('photo'), $request->user()->id)->id;
            $data['mode'] = 'live';
        }
        // Sample images originate only from the server's Load example action.
        $data['sample_photo'] = $data['mode'] === 'demo' ? ($draft->data['sample_photo'] ?? null) : null;
        $prior = $draft->data;
        if ($this->fingerprint($data) === ($prior['result_fingerprint'] ?? null)) {
            $data['result'] = $prior['result'];
            $data['result_fingerprint'] = $prior['result_fingerprint'];
        }
        $draft->update(['data' => $data]);

        return $draft;
    }

    public function validateComplete(array $data): void
    {
        Validator::make($data, [
            'crop' => ['required', Rule::in(array_keys(config('cropshield.crops')))],
            'area' => ['required', 'string', 'max:120'],
            'symptoms' => ['required', 'string', 'max:2000'],
            'observed_on' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'photo_id' => ['required_without:sample_photo'],
        ], ['photo_id.required_without' => 'Add a crop photo before continuing.'])->validate();
    }

    public function fingerprint(array $data): string
    {
        $mode = $data['mode'] ?? 'live';

        return hash('sha256', json_encode([
            $data['crop'] ?? '', trim($data['symptoms'] ?? ''),
            $data['photo_id'] ?? '', $data['sample_photo'] ?? '', $mode,
            $mode === 'demo' ? ($data['scenario'] ?? 'supported') : '',
            $mode === 'demo' ? ($data['demo_kind'] ?? 'Disease') : '',
        ]));
    }

    public function finishCheck(Draft $draft, array $submitted, ?array $result, ?string $error = null): bool
    {
        return DB::transaction(function () use ($draft, $submitted, $result, $error) {
            $latest = Draft::where('user_id', $draft->user_id)->lockForUpdate()->first();
            if (! $latest) {
                return false;
            }
            $data = $latest->data;
            if (($data['submission_id'] ?? '') !== $submitted['submission_id'] || $this->fingerprint($data) !== $this->fingerprint($submitted)) {
                return false;
            }
            if ($result !== null) {
                $data['result'] = $result;
                $data['result_fingerprint'] = $this->fingerprint($data);
                unset($data['screen_error']);
            } else {
                $data['screen_error'] = $error;
                if (($data['mode'] ?? '') === 'demo' && ($data['scenario'] ?? '') === 'service-error') {
                    $data['scenario'] = 'supported';
                }
            }
            $latest->update(['data' => $data]);

            return true;
        });
    }
}
