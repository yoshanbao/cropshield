<x-layout title="Edit guidance">
    <h1 class="page-title mb-4">Edit guidance entry</h1>
    <p class="mb-6 text-sm text-stone-600">Changing this entry does not change guidance already saved in a case.</p>
    <form action="{{ route('admin.conditions.update', $condition) }}" method="POST" class="panel">@csrf
        @method('PUT')<x-condition-fields :condition="$condition" />
        <div class="flex flex-wrap gap-3"><x-button>Update guidance</x-button><x-button :href="route('admin.conditions.index')"
                variant="secondary">Cancel</x-button></div>
    </form>
</x-layout>
