@props(['label', 'name', 'value' => '', 'type' => 'text', 'help' => null])
<div class="mb-5 min-w-0">
    <label for="{{ $name }}" class="mb-2 block text-sm font-semibold text-stone-700">
        {{ $label }} @if ($attributes->has('required'))
            <span class="text-red-700" aria-hidden="true">*</span>
        @endif
    </label>
    @if ($type === 'textarea')
        <textarea id="{{ $name }}" name="{{ $name }}" rows="3"
            aria-describedby="{{ $name }}-help {{ $name }}-error"
            @if ($errors->has($name)) aria-invalid="true" @endif {{ $attributes->merge(['class' => 'form-input']) }}>{{ old($name, $value) }}</textarea>
    @elseif ($type === 'password')
        <input id="{{ $name }}" name="{{ $name }}" type="password"
            aria-describedby="{{ $name }}-help {{ $name }}-error"
            @if ($errors->has($name)) aria-invalid="true" @endif
            {{ $attributes->merge(['class' => 'form-input']) }}>
    @else
        <input id="{{ $name }}" name="{{ $name }}" type="{{ $type }}"
            value="{{ old($name, $value) }}" aria-describedby="{{ $name }}-help {{ $name }}-error"
            @if ($errors->has($name)) aria-invalid="true" @endif
            {{ $attributes->merge(['class' => 'form-input']) }}>
    @endif
    @if ($help)
        <p id="{{ $name }}-help" class="mt-2 text-sm leading-6 text-stone-600">{{ $help }}</p>
    @endif
    @error($name)
        <p id="{{ $name }}-error" class="mt-2 text-sm text-red-700">{{ $message }}</p>
    @enderror
</div>
