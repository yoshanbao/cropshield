<x-layout :title="$title">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 class="page-title">{{ $title }}</h1>
            <p class="mt-2 text-stone-600">Check what needs a follow-up, or open an earlier observation.</p>
        </div>
        @if (auth()->user()->role !== 'admin')
            <x-button :href="route('cases.create')"><x-icon name="plus" />Check a crop</x-button>
        @endif
    </div>
    <div class="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-600"><x-icon
            name="calendar" /><span><strong>{{ $due }}</strong> due
            today</span><span><strong>{{ $overdue }}</strong> overdue</span></div>
    <details class="panel mb-5 !p-0" @if (array_filter($filters)) open @endif>
        <summary class="flex cursor-pointer items-center gap-3 px-5 py-4 font-semibold"><x-icon name="filter" />Filter
            cases<span class="ml-auto text-sm font-normal text-stone-500">{{ $cases->total() }} matching</span></summary>
        <form action="{{ route('cases.index') }}" method="GET" class="border-t border-stone-200 p-5">
            <div class="grid gap-x-5 sm:grid-cols-2 xl:grid-cols-3">
                <x-select-field label="Crop" name="crop" :value="$filters['crop'] ?? ''" :options="config('cropshield.crops')"
                    placeholder="All crops" />
                <x-select-field label="Case status" name="status" :value="$filters['status'] ?? ''" :options="['open' => 'Open', 'monitoring' => 'Monitoring', 'closed' => 'Closed']"
                    placeholder="All statuses" />
                <x-input-field label="Plant or area" name="area" :value="$filters['area'] ?? ''" />
                <x-input-field label="From date" name="from" type="date" :value="$filters['from'] ?? ''" /><x-input-field
                    label="To date" name="to" type="date" :value="$filters['to'] ?? ''" />
            </div>
            <div class="flex gap-3"><x-button variant="secondary">Apply filters</x-button><a
                    href="{{ route('cases.index') }}" class="text-button">Clear filters</a></div>
        </form>
    </details>
    <section class="panel !p-0">
        <h2 class="border-b border-stone-200 px-5 py-5 font-semibold">{{ $cases->total() }}
            {{ Str::plural('case', $cases->total()) }}</h2>
        @forelse ($cases as $case)
            <x-case-card :case="$case" />
        @empty
            <div class="p-8 text-center">
                <h3 class="font-semibold">No matching cases</h3>
                <p class="mt-3 text-stone-500">Clear the filters or record a new observation.</p>
            </div>
        @endforelse
    </section>
    <div class="mt-6">{{ $cases->links() }}</div>
</x-layout>
