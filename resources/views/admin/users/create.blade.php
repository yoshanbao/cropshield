<x-layout title="Create user">
    <h1 class="page-title mb-3">Create an account</h1>
    <p class="mb-6 text-sm text-stone-600">Only administrators can create owner and admin accounts.</p>
    <form action="{{ route('admin.users.store') }}" method="POST" class="panel max-w-2xl">@csrf<x-input-field
            label="Full name" name="name" required minlength="2" maxlength="80" /><x-input-field label="Email"
            name="email" type="email" required maxlength="191" autocomplete="off" /><x-select-field label="Role"
            name="role" :options="['worker' => 'Worker', 'owner' => 'Owner', 'admin' => 'Administrator']" value="worker" required /><x-input-field label="Password" name="password"
            type="password" autocomplete="new-password" required minlength="10"
            help="At least 10 characters. Share the password privately with the account holder." /><x-input-field
            label="Confirm password" name="password_confirmation" type="password" autocomplete="new-password"
            required />
        <div class="flex gap-3"><x-button>Create account</x-button><x-button :href="route('admin.users.index')"
                variant="secondary">Cancel</x-button></div>
    </form>
</x-layout>
