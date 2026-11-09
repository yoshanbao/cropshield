@props(['screening', 'title' => 'Referenced care steps'])
<section {{ $attributes->merge(['class' => 'panel']) }}>
    <h2 class="mb-5 text-lg font-semibold">{{ $title }}</h2>
    @if (!empty($screening['guidance']))
        @php $guidance = $screening['guidance']; @endphp
        <p class="mb-5 font-semibold">{{ $guidance['name'] }}</p>
        <h3 class="mb-2 text-sm font-semibold">Care for the current crop</h3>
        <p class="mb-5 leading-7 text-stone-600">{{ $guidance['care'] }}</p>
        <h3 class="mb-2 text-sm font-semibold">Prevention practices</h3>
        <p class="mb-5 leading-7 text-stone-600">{{ $guidance['prevention'] }}</p>
        @php $sourceUrl = $guidance['source_url'] ?? $guidance['sourceUrl'] ?? ''; @endphp
        @if (preg_match('/^https?:\/\//i', $sourceUrl))
            <a href="{{ $sourceUrl }}" target="_blank" rel="noopener noreferrer"
                class="text-link text-sm">{{ $guidance['source'] }} ↗</a>
        @endif
        <p class="mt-4 text-xs text-stone-500">Saved guidance version: {{ $guidance['version'] }}. Source guidance stays
            with this case.</p>
    @else
        <p class="text-sm leading-7 text-stone-600">No condition-specific guidance is attached. The submission is
            unclear, outside coverage, or has not been screened. You can save the observation and continue monitoring.
        </p>
    @endif
</section>
