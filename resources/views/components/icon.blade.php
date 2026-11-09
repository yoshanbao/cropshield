@props(['name' => 'leaf'])
@php
    $paths = [
        'leaf' => '<path d="M20 4c-7-1-14 2-14 8a6 6 0 0 0 6 6c6 0 9-7 8-14Z"/><path d="m4 20 10-10"/>',
        'scan' => '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10"/>',
        'cases' => '<path d="M3 7h6l2 2h10v11H3zM3 7V4h6l2 3h10v2"/>',
        'book' => '<path d="M12 5v16M12 5C8 3 5 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-3-1-6-1-10 1Z"/>',
        'settings' =>
            '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
        'camera' => '<path d="m8 5 1-2h6l1 2h5v15H3V5z"/><circle cx="12" cy="12" r="4"/>',
        'plus' => '<path d="M12 5v14M5 12h14"/>',
        'arrow' => '<path d="M5 12h14m-6-6 6 6-6 6"/>',
        'user' => '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
        'logout' => '<path d="M10 4H3v16h7m4-13 5 5-5 5M8 12h11"/>',
        'print' => '<path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6z"/>',
        'calendar' => '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
        'check' => '<path d="m5 12 4 4L19 6"/>',
        'info' => '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
        'filter' => '<path d="M4 6h16M7 12h10m-7 6h4"/>',
    ];
@endphp
<svg {{ $attributes->merge(['class' => 'h-5 w-5 shrink-0']) }} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{!! $paths[$name] ?? $paths['leaf'] !!}</svg>
