@props(['label', 'name', 'value' => '', 'options' => [], 'placeholder' => null])
<div class="mb-5 min-w-0">
    <label for="{{ $name }}" class="mb-2 block text-sm font-semibold text-stone-700">{{ $label }}
        @if ($attributes->has('required'))
            <span aria-hidden="true" class="text-red-700">*</span>
        @endif
    </label>
    <select id="{{ $name }}" name="{{ $name }}" aria-describedby="{{ $name }}-error"
        @if ($errors->has($name)) aria-invalid="true" @endif
        {{ $attributes->merge(['class' => 'form-input']) }}>
        @if ($placeholder)
            <option value="">{{ $placeholder }}</option>
        @endif
        @foreach ($options as $key => $text)
            <option value="{{ $key }}" @selected((string) old($name, $value) === (string) $key)>{{ $text }}</option>
        @endforeach
    </select>
    @error($name)
        <p id="{{ $name }}-error" class="mt-2 text-sm text-red-700">{{ $message }}</p>
    @enderror
</div>
