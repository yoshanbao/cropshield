<x-layout title="Crop guide">
    <h1 class="page-title">Crop guide</h1>
    <p class="mt-2 mb-6 text-stone-600">Disease and pest references for the farm's eight crops.</p>
    <form action="{{ route('guide.index') }}" method="GET" class="panel mb-6">
        <div class="grid gap-x-5 md:grid-cols-3"><x-select-field label="Crop" name="crop" :options="config('cropshield.crops')"
                :value="$filters['crop'] ?? ''" placeholder="All crops" /><x-select-field label="Category" name="kind"
                :options="['Disease' => 'Disease', 'Pest' => 'Pest']" :value="$filters['kind'] ?? ''" placeholder="Diseases and pests" /><x-input-field
                label="Search conditions" name="search" :value="$filters['search'] ?? ''" maxlength="100" /></div><x-button
            variant="secondary">Search guide</x-button>
    </form>
    <div class="space-y-4">
        @forelse ($conditions as $condition)
            <details class="panel">
                <summary class="cursor-pointer"><span
                        class="mb-2 flex flex-wrap gap-2"><x-badge>{{ config('cropshield.crops')[$condition->crop] }}</x-badge><x-badge
                            tone="blue">{{ $condition->kind }}</x-badge></span><span
                        class="text-lg font-semibold">{{ $condition->name }}</span>
                    <p class="mt-3 text-sm leading-7 text-stone-500">{{ $condition->cues }}</p>
                </summary>
                <div class="mt-5 border-t border-stone-200 pt-5"><x-guidance :screening="['guidance' => $condition->toArray()]"
                        class="!border-0 !p-0 !shadow-none" />
                    @if ($condition->limitations)
                        <p class="mt-5 text-sm leading-7 text-stone-500">{{ $condition->limitations }}</p>
                    @endif
                </div>
        </details>@empty<section class="panel">
                <h2 class="font-semibold">No references match these filters</h2>
                <p class="mt-3 text-sm text-stone-600">Clear the search or save an observation for monitoring.</p>
            </section>
        @endforelse
    </div>
</x-layout>
