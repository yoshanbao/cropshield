<nav class="mb-6 flex gap-6 border-b border-stone-200 text-sm font-semibold" aria-label="Administration">
    <a href="{{ route('admin.conditions.index') }}"
        class="border-b-2 py-4 {{ request()->routeIs('admin.conditions.*', 'admin.dashboard') ? 'border-green-800 text-green-800' : 'border-transparent text-stone-500' }}">Guidance
        library</a>
    <a href="{{ route('admin.users.index') }}"
        class="border-b-2 py-4 {{ request()->routeIs('admin.users.*') ? 'border-green-800 text-green-800' : 'border-transparent text-stone-500' }}">User
        access</a>
</nav>
