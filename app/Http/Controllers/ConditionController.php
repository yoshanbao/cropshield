<?php

namespace App\Http\Controllers;

use App\Models\Condition;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ConditionController extends Controller
{
    public function index()
    {
        return view('admin.conditions.index', ['conditions' => Condition::orderBy('crop')->orderBy('name')->get()]);
    }

    public function create()
    {
        return view('admin.conditions.create', ['condition' => new Condition(['crop' => 'Rice', 'kind' => 'Disease', 'version' => '1.0', 'review_status' => 'Pending review'])]);
    }

    public function edit(Condition $condition)
    {
        return view('admin.conditions.edit', compact('condition'));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        Condition::create(['id' => (string) Str::uuid(), ...$data]);

        return redirect()->route('admin.conditions.index')->with('success', 'Condition added.');
    }

    public function update(Request $request, Condition $condition)
    {
        $condition->update($this->validated($request));

        return redirect()->route('admin.conditions.index')->with('success', 'Guidance updated. Saved case guidance remains unchanged.');
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'crop' => ['required', Rule::in(array_keys(config('cropshield.crops')))], 'kind' => ['required', Rule::in(['Disease', 'Pest'])],
            'name' => ['required', 'string', 'max:160'], 'cues' => ['required', 'string', 'max:2500'],
            'care' => ['required', 'string', 'max:4000'], 'prevention' => ['required', 'string', 'max:4000'],
            'source' => ['required', 'string', 'max:200'], 'source_url' => ['required', 'url:http,https', 'max:1000'],
            'version' => ['required', 'string', 'max:60'], 'limitations' => ['nullable', 'string', 'max:2000'],
            'review_status' => ['required', Rule::in(['Pending review', 'Reviewed', 'Source checked', 'Needs revision', 'Pilot reference'])],
            'reviewed_on' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'], 'enabled' => ['nullable', 'boolean'],
        ]);
        $data['enabled'] = $request->boolean('enabled');
        $starter = in_array($request->route('condition')?->id, ['rice-blast', 'rice-blight', 'corn-rust']);
        if ($data['review_status'] === 'Pilot reference' && ! $starter) {
            throw ValidationException::withMessages(['review_status' => 'Only the original starter entries may use Pilot reference.']);
        }
        if ($data['enabled'] && ! in_array($data['review_status'], ['Reviewed', 'Source checked', 'Pilot reference'])) {
            throw ValidationException::withMessages(['enabled' => 'Review this content before enabling it.']);
        }
        if (in_array($data['review_status'], ['Reviewed', 'Source checked']) && empty($data['reviewed_on'])) {
            throw ValidationException::withMessages(['reviewed_on' => 'Add the content review date.']);
        }

        return $data;
    }
}
