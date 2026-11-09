@props(['type' => 'success'])
@php $styles = ['success' => 'border-blue-200 bg-blue-50 text-blue-950', 'error' => 'border-red-200 bg-red-50 text-red-900', 'info' => 'border-stone-200 bg-stone-100 text-stone-700', 'demo' => 'border-amber-200 bg-amber-50 text-amber-950'][$type] ?? 'border-stone-200 bg-stone-50'; @endphp
<div role="{{ $type === 'error' ? 'alert' : 'status' }}"
    {{ $attributes->merge(['class' => 'mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-7 ' . $styles]) }}>
    <x-icon :name="$type === 'success' ? 'check' : 'info'" class="mt-1 h-5 w-5" />
    <div>{{ $slot }}</div>
</div>
