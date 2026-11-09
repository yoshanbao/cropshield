<?php

namespace App\Http\Controllers;

use App\Models\CropCase;
use App\Models\User;
use App\Services\DraftService;
use App\Support\DemoAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CaseController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'crop' => ['nullable', Rule::in(array_keys(config('cropshield.crops')))],
            'status' => ['nullable', Rule::in(['open', 'monitoring', 'closed'])],
            'area' => ['nullable', 'string', 'max:120'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', $request->filled('from') ? 'after_or_equal:from' : 'nullable'],
        ]);
        $query = CropCase::visibleTo($request->user());
        $due = (clone $query)->where('status', '!=', 'closed')->whereDate('next_follow_up', today())->count();
        $overdue = (clone $query)->where('status', '!=', 'closed')->whereDate('next_follow_up', '<', today())->count();
        $cases = $query->when($filters['crop'] ?? null, fn ($q, $v) => $q->where('crop', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['area'] ?? null, fn ($q, $v) => $q->where('area', 'like', '%'.$v.'%'))
            ->when($filters['from'] ?? null, fn ($q, $v) => $q->whereDate('observed_on', '>=', $v))
            ->when($filters['to'] ?? null, fn ($q, $v) => $q->whereDate('observed_on', '<=', $v))
            ->with('observations.photo')->latest()->paginate(10)->withQueryString();

        $title = $request->user()->role === 'worker' ? 'My cases' : 'Farm cases';

        return view('cases.index', compact('cases', 'filters', 'due', 'overdue', 'title'));
    }

    public function create(Request $request, DraftService $drafts)
    {
        $draft = $drafts->current($request->user()->id)->data;

        return view('cases.create', ['draft' => $draft, 'result' => $draft['result'] ?? null, 'demoAvailable' => $request->user()->is_demo && DemoAccess::allowed($request)]);
    }

    public function store(Request $request, DraftService $drafts)
    {
        if ($existing = CropCase::find($request->input('submission_id'))) {
            abort_unless($existing->user_id === $request->user()->id, 403);

            return redirect()->route('cases.show', $existing);
        }
        $draft = $drafts->save($request);
        $data = $draft->data;
        $drafts->validateComplete($data);
        if ($request->input('intent') !== 'monitor' && ! isset($data['result'])) {
            throw ValidationException::withMessages(['screening' => 'Check the current photo first, or choose Save without screening.']);
        }
        $case = DB::transaction(function () use ($request, $data, $draft) {
            $case = CropCase::create([
                'id' => $data['submission_id'], 'user_id' => $request->user()->id, 'crop' => $data['crop'], 'area' => $data['area'],
                'sample_label' => ($data['sample_label'] ?? '') ?: 'Plant 01', 'plant_age' => $data['plant_age'] ?? null, 'observed_on' => $data['observed_on'],
                'next_follow_up' => $data['next_follow_up'] ?? null, 'sample' => $data['mode'] === 'demo',
                'screening' => $request->input('intent') === 'monitor' ? ['state' => 'NOT_SCREENED', 'observations' => [], 'demo' => $data['mode'] === 'demo'] : $data['result'],
            ]);
            $case->observations()->create(['user_id' => $request->user()->id, 'observed_on' => $data['observed_on'], 'symptoms' => $data['symptoms'],
                'actions' => $data['actions'] ?? 'No action recorded.', 'reported_change' => 'Not yet assessed', 'photo_id' => $data['photo_id'] ?? null, 'sample_photo' => $data['sample_photo'] ?? null]);
            $draft->delete();

            return $case;
        });

        return redirect()->route('cases.show', $case)->with('success', 'Case saved. Add follow-ups to keep monitoring.');
    }

    public function show(Request $request, CropCase $case)
    {
        Gate::authorize('view', $case);
        $case->load(['user', 'observations.user', 'observations.photo', 'assignedWorkers', 'statusEvents']);
        $workers = $request->user()->role === 'owner' ? User::where('role', 'worker')->where('active', true)->get() : collect();
        $photos = $case->observations->filter(fn ($o) => $o->photoUrl())->values();

        return view('cases.show', compact('case', 'workers', 'photos'));
    }

    public function update(Request $request, CropCase $case)
    {
        Gate::authorize('update', $case);
        $last = $case->observations()->max('observed_on');
        $data = $request->validate([
            'revision' => ['required', 'integer'], 'status' => ['required', Rule::in(['open', 'monitoring', 'closed'])],
            'reason' => [Rule::requiredIf($request->input('status') === 'closed' && $case->status !== 'closed'), 'nullable', 'string', 'max:1000'],
            'next_follow_up' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:'.$last],
            'assigned_workers' => [$request->user()->role === 'owner' ? 'nullable' : 'prohibited', 'array'],
            'assigned_workers.*' => [Rule::exists('users', 'id')->where('role', 'worker')->where('active', true)],
        ]);
        DB::transaction(function () use ($request, $case, $data) {
            $locked = CropCase::lockForUpdate()->findOrFail($case->id);
            if ($locked->revision !== (int) $data['revision']) {
                throw ValidationException::withMessages(['revision' => 'This case changed in another window. Reload before saving.']);
            }
            if ($locked->status !== $data['status']) {
                $locked->statusEvents()->create(['status' => $data['status'], 'reason' => $data['reason'] ?? 'Monitoring resumed.']);
            }
            $locked->update(['status' => $data['status'], 'next_follow_up' => $data['status'] === 'closed' ? null : ($data['next_follow_up'] ?? null), 'revision' => $locked->revision + 1]);
            if ($request->user()->role === 'owner') {
                $locked->assignedWorkers()->sync($data['assigned_workers'] ?? []);
            }
        });

        return redirect()->route('cases.show', $case)->with('success', 'Case plan saved. Earlier observations are preserved.');
    }

    public function print(CropCase $case)
    {
        Gate::authorize('view', $case);
        $case->load(['user', 'observations.user', 'observations.photo', 'statusEvents']);

        return view('cases.print', compact('case'));
    }
}
