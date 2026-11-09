<?php

namespace App\Http\Controllers;

use App\Models\Condition;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GuideController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['crop' => ['nullable', Rule::in(array_keys(config('cropshield.crops')))], 'kind' => ['nullable', Rule::in(['Disease', 'Pest'])], 'search' => ['nullable', 'string', 'max:100']]);
        $conditions = Condition::where('enabled', true)->when($filters['crop'] ?? null, fn ($q, $v) => $q->where('crop', $v))->when($filters['kind'] ?? null, fn ($q, $v) => $q->where('kind', $v))->when($filters['search'] ?? null, fn ($q, $v) => $q->where('name', 'like', '%'.$v.'%'))->orderBy('crop')->orderBy('name')->get();

        return view('guide.index', compact('conditions', 'filters'));
    }
}
