@props(['tone' => 'neutral'])
@php $color = ['neutral' => 'bg-stone-100 text-stone-700', 'blue' => 'bg-blue-50 text-blue-800', 'amber' => 'bg-amber-50 text-amber-900', 'red' => 'bg-red-50 text-red-800'][$tone] ?? 'bg-stone-100 text-stone-700'; @endphp
<span
    {{ $attributes->merge(['class' => 'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold leading-5 ' . $color]) }}>{{ $slot }}</span>
