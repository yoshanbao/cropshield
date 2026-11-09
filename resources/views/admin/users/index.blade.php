<x-layout title="User access">
    <h1 class="page-title">Administration</h1>
    <p class="mt-2 mb-5 text-stone-600">Manage crop references and user access.</p><x-admin-tabs />
    <div class="mb-5 flex justify-end"><x-button :href="route('admin.users.create')"><x-icon name="plus" />Create user</x-button></div>
    <section class="panel">
        <h2 class="mb-5 text-xl font-semibold">Users and access</h2>
        @error('role')
            <x-alert type="error">{{ $message }}</x-alert>
        @enderror
        @forelse ($users as $user)
            <article class="flex flex-wrap items-center gap-5 border-t border-stone-200 py-5">
                <div class="min-w-0 flex-1">
                    <h3 class="font-semibold">{{ $user->name }} @if ($user->is_demo)
                            <x-badge tone="amber">Demo</x-badge>
                        @endif
                    </h3>
                    <p class="mt-2 text-sm break-all text-stone-500">{{ $user->email }}</p>
                    <p class="mt-1 text-sm text-stone-500">{{ $user->active ? 'Access enabled' : 'Access suspended' }}
                    </p>
                </div>
                <form action="{{ route('admin.users.update', $user) }}" method="POST"
                    class="flex flex-wrap items-end gap-3">@csrf @method('PATCH')<label
                        class="text-sm font-semibold">Role<select name="role" class="form-input mt-2"
                            @disabled($user->is(auth()->user()))>
                            @foreach (['worker' => 'Worker', 'owner' => 'Owner', 'admin' => 'Administrator'] as $key => $label)
                                <option value="{{ $key }}" @selected($user->role === $key)>{{ $label }}
                                </option>
                            @endforeach
                        </select></label><label class="text-sm font-semibold">Access<select name="active"
                            class="form-input mt-2" @disabled($user->is(auth()->user()))>
                            <option value="1" @selected($user->active)>Enabled</option>
                            <option value="0" @selected(!$user->active)>Suspended</option>
                        </select></label><x-button variant="secondary" :disabled="$user->is(auth()->user())">Save</x-button></form>
        </article>@empty<p class="text-stone-500">No users found.</p>
        @endforelse
    </section>
</x-layout>
