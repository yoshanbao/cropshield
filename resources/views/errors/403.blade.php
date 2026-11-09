<x-layout title="Access restricted" guest>
    <section class="panel mx-auto max-w-lg">
        <p class="eyebrow mb-3">Access restricted</p>
        <h1 class="mb-4 text-2xl font-bold">This page is not available to your role</h1>
        <p class="mb-6 text-sm leading-7 text-stone-600">Your account can open the pages and records assigned to it.</p>
        <x-button :href="auth()->check() ? route(auth()->user()->homeRoute()) : route('login')">Go to my workspace</x-button>
    </section>
</x-layout>
