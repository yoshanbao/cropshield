@props(['case'])
@php
    $latest = $case->observations->last();
    $photo = $case->observations->last(fn($o) => $o->photoUrl());
    [$reminder, $date, $tone] = $case->reminder();
@endphp
<article class="border-b border-stone-200 last:border-0">
    <a href="{{ route('cases.show', $case) }}" class="flex items-start gap-4 p-4 sm:items-center sm:p-6">
        <span
            class="flex h-20 w-17 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
            @if ($photo)
                <img src="{{ $photo->photoUrl() }}" alt="" class="h-full w-full object-cover"
                loading="lazy">@else<x-icon class="h-7 w-7 text-stone-400" />
            @endif
        </span>
        <div class="min-w-0 flex-1">
            <div class="mb-2 flex flex-wrap items-center gap-2"><strong
                    class="text-lg">{{ config('cropshield.crops')[$case->crop] }}</strong>
                @if ($case->sample)
                    <x-badge>Sample</x-badge>
                @endif
                <x-badge :tone="$case->status === 'open' ? 'amber' : ($case->status === 'monitoring' ? 'blue' : 'neutral')">{{ ucfirst($case->status) }}</x-badge>
            </div>
            <p class="mb-1 text-sm font-medium leading-6 sm:text-base">{{ $case->area }} · {{ $case->sample_label }}
            </p>
            <p class="text-sm leading-6 text-stone-500">
                {{ $case->screening['guidance']['name'] ?? 'Monitoring observation' }}</p>
            <p class="mt-1 text-sm leading-6 text-stone-600">Latest change:
                <strong>{{ $latest?->reported_change ?? 'Not yet assessed' }}</strong> ·
                {{ $latest?->observed_on->format('M j, Y') }}</p>
        </div><x-icon name="arrow" class="hidden text-stone-400 sm:block" />
    </a>
    <div class="flex flex-wrap items-center justify-between gap-4 px-4 pb-5 sm:px-6">
        <div class="flex flex-wrap items-center gap-3"><x-badge :tone="$tone">{{ $reminder }}</x-badge><span
                class="text-sm text-stone-500">{{ $date }}</span></div>
        @can('update', $case)@if ($case->status !== 'closed')
            <x-button :href="route('cases.show', [$case, 'followup' => 1]) . '#followup'" variant="secondary"><x-icon name="plus" />Add follow-up</x-button>
        @endif
@endcan
    </div>
</article>
