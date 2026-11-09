<x-layout title="Register" guest>
    <section class="panel mx-auto max-w-lg p-6 sm:p-8">
        <a href="{{ route('login') }}" class="mb-7 flex items-center gap-2 text-xl font-bold"><x-icon
                class="text-green-800" />CropShield</a>
        <h1 class="text-2xl font-bold">Create a worker account</h1>
        <p class="mt-3 mb-6 text-sm leading-7 text-stone-600">Fields marked * are required. An administrator creates
            owner and admin accounts.</p>
        <form action="{{ route('register.store') }}" method="POST">
            @csrf
            <x-input-field label="Full name" name="name" autocomplete="name" required minlength="2" maxlength="80" />
            <x-input-field label="Email" name="email" type="email" autocomplete="email" required maxlength="191" />
            <x-input-field label="Password" name="password" type="password" autocomplete="new-password" required
                minlength="10" help="Use at least 10 characters. Passwords are stored as hashes." />
            <x-input-field label="Confirm password" name="password_confirmation" type="password"
                autocomplete="new-password" required />
            @error('role')
                <x-alert type="error">{{ $message }}</x-alert>
            @enderror
            <x-button class="w-full">Register</x-button>
        </form>
        <p class="mt-6 text-center text-sm text-stone-600">Already registered? <a href="{{ route('login') }}"
                class="text-link">Log in</a></p>
    </section>
</x-layout>
