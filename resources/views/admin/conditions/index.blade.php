<x-layout title="Administration">
    <h1 class="page-title">Administration</h1>
    <p class="mt-2 mb-5 text-stone-600">Manage crop references and user access.</p><x-admin-tabs />
    <section class="panel">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-semibold">Crop conditions</h2>
                <p class="mt-2 text-sm text-stone-500">{{ $conditions->count() }} entries · Enabled references support
                    disease and pest screening.</p>
            </div><x-button :href="route('admin.conditions.create')"><x-icon name="plus" />Add condition</x-button>
        </div>
        @forelse ($conditions as $condition)
            <article class="flex flex-wrap items-start gap-4 border-t border-stone-200 py-5"><x-icon
                    class="mt-1 text-stone-400" />
                <div class="min-w-0 flex-1">
                    <h3 class="font-semibold">{{ $condition->name }}</h3>
                    <p class="my-2 text-sm leading-7 text-stone-500">{{ config('cropshield.crops')[$condition->crop] }}
                        · {{ $condition->kind }} · {{ $condition->version }}</p><a href="{{ $condition->source_url }}"
                        target="_blank" rel="noopener noreferrer" class="text-link text-sm">{{ $condition->source }}
                        ↗</a>
                </div>
                <div class="text-right"><x-badge>{{ $condition->review_status }}</x-badge>
                    <p class="mt-2 text-xs text-stone-500">
                        {{ $condition->enabled ? 'Available in library' : 'Not enabled' }}</p>
                </div><x-button :href="route('admin.conditions.edit', $condition)" variant="secondary">Edit</x-button>
        </article>@empty<p class="text-stone-500">No condition entries yet. Add a sourced reference.</p>
        @endforelse
    </section>
</x-layout>
