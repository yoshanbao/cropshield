<x-layout title="Add condition">
    <h1 class="page-title mb-4">Add a sourced condition</h1>
    <p class="mb-6 text-sm text-stone-600">Use reviewed content and a traceable source. Do not invent advice to fill
        missing entries.</p>
    <form action="{{ route('admin.conditions.store') }}" method="POST" class="panel">@csrf<x-condition-fields
            :condition="$condition" />
        <div class="flex flex-wrap gap-3"><x-button>Save condition</x-button><x-button :href="route('admin.conditions.index')"
                variant="secondary">Cancel</x-button></div>
    </form>
</x-layout>
