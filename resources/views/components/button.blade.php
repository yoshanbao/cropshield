@props(['href' => null, 'variant' => 'primary', 'type' => 'submit'])
@php $styles = $variant === 'primary' ? 'btn-primary' : ($variant === 'danger' ? 'btn-danger' : 'btn-secondary'); @endphp
@if ($href)
    <a href="{{ $href }}" {{ $attributes->merge(['class' => 'btn ' . $styles]) }}>{{ $slot }}</a>
@else
    <button type="{{ $type }}" {{ $attributes->merge(['class' => 'btn ' . $styles]) }}>{{ $slot }}</button>
@endif
