<x-layout title="Printable case summary" print>
    <div class="mb-7 flex flex-wrap justify-between gap-3 no-print"><a href="{{ route('cases.show', $case) }}"
            class="text-link">← Back to case</a><x-button type="button" data-print><x-icon name="print" />Print
            summary</x-button></div>
    <header class="mb-7 border-b border-stone-300 pb-6">
        <h1 class="text-3xl font-bold">CropShield · Case summary</h1>
        <p class="mt-3 text-stone-600">Ja-ron Fish Farm · Solana, Cagayan</p>
        <p class="mt-2 text-sm">{{ $case->id }} @if ($case->sample)
                · SAMPLE RECORD
            @endif
        </p>
    </header>
    <dl class="mb-7 grid gap-4 text-sm sm:grid-cols-2">
        <div>
            <dt class="font-semibold">Crop and location</dt>
            <dd>{{ config('cropshield.crops')[$case->crop] }} · {{ $case->area }} · {{ $case->sample_label }}</dd>
        </div>
        <div>
            <dt class="font-semibold">Original observation</dt>
            <dd>{{ $case->observed_on->format('M j, Y') }} · {{ $case->user->name }}</dd>
        </div>
        <div>
            <dt class="font-semibold">Case status</dt>
            <dd>{{ ucfirst($case->status) }}</dd>
        </div>
        <div>
            <dt class="font-semibold">Next follow-up</dt>
            <dd>{{ $case->next_follow_up?->format('M j, Y') ?? 'Not scheduled' }}</dd>
        </div>
    </dl>
    <section class="panel mb-6">
        <h2 class="mb-3 text-xl font-semibold">Preliminary screening</h2>
        <p class="mb-3 font-semibold">{{ $case->screening['guidance']['name'] ?? 'Not screened / no supported match' }}
        </p>
        @if ($case->sample)
            <p class="mb-3 text-sm">Demo result; simulated observations and illustrative images.</p>
            @endif @foreach ($case->screening['observations'] ?? [] as $evidence)
                <p class="mb-2 text-sm">{{ $evidence }}</p>
            @endforeach
            <p class="text-sm text-stone-500">
                A preliminary finding, not a confirmed diagnosis.</p>
    </section>
    <x-guidance :screening="$case->screening" class="mb-6" />
    <section class="panel">
        <h2 class="mb-6 text-xl font-semibold">Original observation and follow-up history</h2>
        @foreach ($case->observations as $observation)
            <article class="print-observation mb-6 border-b border-stone-200 pb-6 last:mb-0 last:border-0">
                <h3 class="mb-3 font-semibold">{{ $loop->first ? 'Initial observation' : 'Follow-up ' . $loop->index }} ·
                    {{ $observation->observed_on->format('M j, Y') }}</h3>
                @if ($observation->photoUrl())
                    <img src="{{ $observation->photoUrl() }}" alt="Dated crop observation"
                    class="mb-4 max-h-48 max-w-full rounded-lg">@else<p class="mb-3 text-sm">No photo attached.</p>
                @endif
                <p class="mb-3 text-sm leading-7">
                    <strong>Symptoms:</strong> {{ $observation->symptoms }}
                </p>
                <p class="mb-3 text-sm leading-7"><strong>Actions:</strong> {{ $observation->actions }}</p>
                <p class="text-sm"><strong>Reported change:</strong> {{ $observation->reported_change }} ·
                    {{ $observation->user->name }}</p>
            </article>
        @endforeach
    </section>
    <section class="mt-6">
        <h2 class="mb-3 text-lg font-semibold">Case status history</h2>
        @forelse ($case->statusEvents as $event)
            <p class="mb-2 text-sm">{{ $event->created_at->format('M j, Y') }} · {{ ucfirst($event->status) }} ·
            {{ $event->reason }}</p>@empty<p class="text-sm text-stone-500">No status changes recorded.</p>
        @endforelse
    </section>
</x-layout>
