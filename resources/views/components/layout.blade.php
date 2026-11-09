@props(['title' => 'CropShield', 'guest' => false, 'print' => false])
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#faf9f7">
    <title>{{ $title }} · CropShield</title>
    <link rel="icon" href="{{ asset('icon.svg') }}" type="image/svg+xml">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body class="bg-stone-100 text-stone-800">
    <a href="#main-content" class="skip-link">Skip to content</a>
    @if ($guest || $print)
        <main id="main-content" class="{{ $guest ? 'auth-shell' : 'mx-auto max-w-5xl px-5 py-8' }}">
            <div class="{{ $guest ? 'w-full max-w-5xl' : '' }}">
                @if (session('success'))
                    <x-alert>{{ session('success') }}</x-alert>
                @endif
                @if (session('error'))
                    <x-alert type="error">{{ session('error') }}</x-alert>
                @endif
                {{ $slot }}
            </div>
        </main>
    @else
        @php
            $user = auth()->user();
            $navigation = [];
            if ($user->role !== 'admin') {
                $navigation[] = [
                    'cases.create',
                    'Check crop',
                    'scan',
                    request()->routeIs('cases.create', 'worker.dashboard'),
                ];
            }
            $navigation[] = [
                'cases.index',
                $user->role === 'worker' ? 'My cases' : 'Farm cases',
                'cases',
                request()->routeIs('cases.index', 'cases.show', 'owner.dashboard'),
            ];
            $navigation[] = ['guide.index', 'Crop guide', 'book', request()->routeIs('guide.*')];
            if ($user->role === 'admin') {
                $navigation[] = ['admin.dashboard', 'Administration', 'settings', request()->routeIs('admin.*')];
            }
        @endphp
        <aside class="sidebar no-print">
            <a href="{{ route($user->homeRoute()) }}" class="mb-9 flex items-center gap-3 text-xl font-bold"><span
                    class="brand-mark"><x-icon name="leaf" class="h-7 w-7" /></span>CropShield</a>
            <div class="mb-8 rounded-xl border border-stone-200 bg-white p-4">
                <p class="text-sm font-semibold">Ja-ron Fish Farm</p>
                <p class="mt-1 text-sm text-stone-500">Solana, Cagayan</p>
            </div>
            <nav aria-label="Main navigation" class="grid gap-2">
                @foreach ($navigation as [$route, $label, $icon, $active])
                    <a href="{{ route($route) }}" @if ($active) aria-current="page" @endif
                        class="nav-link {{ $active ? 'nav-active' : '' }}"><x-icon
                            :name="$icon" />{{ $label }}</a>
                @endforeach
            </nav>
            <p class="mt-auto pt-10 text-sm leading-7 text-stone-500">Keep checking the same plant.<br>Add later
                observations to its saved case.</p>
        </aside>
        <div class="app-main">
            <header class="topbar no-print">
                <a href="{{ route($user->homeRoute()) }}" class="flex items-center gap-2 font-bold lg:hidden"><x-icon
                        name="leaf" class="text-green-800" />CropShield</a>
                <span class="hidden text-sm text-stone-500 lg:block">Ja-ron Fish Farm <span class="mx-3">/</span>
                    <span class="font-medium text-stone-700">{{ $title }}</span></span>
                <details class="account-menu ml-auto">
                    <summary
                        class="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold">
                        <x-icon name="user" />{{ ucfirst($user->role) }} @if ($user->is_demo)
                            <x-badge tone="amber">Demo</x-badge>
                        @endif
                        <span aria-hidden="true">⌄</span>
                    </summary>
                    <div class="account-panel">
                        <p class="font-semibold">{{ $user->name }}</p>
                        <p class="mt-1 text-sm text-stone-500">{{ $user->email }}</p>
                        <form action="{{ route('logout') }}" method="POST" class="mt-4">@csrf <x-button
                                variant="secondary" class="w-full"><x-icon name="logout" />Log out</x-button></form>
                    </div>
                </details>
            </header>
            <main id="main-content" class="mx-auto w-full max-w-7xl px-4 py-6 pb-28 md:px-8 md:py-9 lg:pb-12">
                @if (session('success'))
                    <x-alert>{{ session('success') }}</x-alert>
                @endif
                @if (session('error'))
                    <x-alert type="error">{{ session('error') }}</x-alert>
                @endif
                @if ($errors->has('revision'))
                    <x-alert type="error">{{ $errors->first('revision') }}</x-alert>
                @endif
                {{ $slot }}
                <footer
                    class="mt-10 flex flex-wrap justify-between gap-3 border-t border-stone-200 pt-5 text-xs text-stone-500 no-print">
                    <span>CropShield · Ja-ron Fish Farm</span><span>Screening and monitoring</span></footer>
            </main>
        </div>
        <nav class="mobile-nav no-print" aria-label="Phone navigation">
            @foreach ($navigation as [$route, $label, $icon, $active])
                <a href="{{ route($route) }}" @if ($active) aria-current="page" @endif
                    class="{{ $active ? 'nav-active' : '' }}"><x-icon :name="$icon" />{{ $label }}</a>
            @endforeach
        </nav>
    @endif
</body>

</html>
