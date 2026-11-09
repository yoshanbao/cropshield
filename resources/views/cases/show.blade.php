<x-layout title="Case details">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3"><a href="{{ route('cases.index') }}"
            class="text-link text-sm">← Back to cases</a>
        <div class="flex flex-wrap gap-3"><x-button :href="route('cases.print', $case)" variant="secondary"><x-icon name="print" />Print
                summary</x-button>
            @can('update', $case)@if ($case->status !== 'closed')
                <x-button :href="route('cases.show', [$case, 'followup' => 1]) . '#followup'"><x-icon name="plus" />Add follow-up</x-button>
            @endif
        @endcan
    </div>
</div>
<div class="mb-6 flex items-start justify-between gap-4">
    <div>
        <p class="eyebrow">CS-{{ Str::upper(Str::limit($case->id, 8, '')) }} @if ($case->sample)
                · PRACTICE RECORD
            @endif
        </p>
        <h1 class="page-title mt-2">{{ config('cropshield.crops')[$case->crop] }}</h1>
        <p class="mt-2 text-stone-600">{{ $case->area }} · {{ $case->sample_label }}</p>
    </div><x-badge :tone="$case->status === 'open' ? 'amber' : 'blue'">{{ ucfirst($case->status) }}</x-badge>
</div>
<x-alert type="info">Screening is preliminary. Status records whether this case is open, being monitored, or
    closed.</x-alert>
<div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div class="min-w-0 space-y-6">
        <section class="panel">
            <div class="mb-4 flex items-center justify-between gap-3"><span class="eyebrow">Preliminary
                    screening</span><x-badge>{{ $case->sample || !empty($case->screening['demo']) ? 'Demo result' : 'Preliminary result' }}</x-badge>
            </div>
            <h2 class="mb-4 text-2xl font-semibold">
                {{ $case->screening['guidance']['name'] ?? 'Monitoring observation' }}</h2>
            @foreach ($case->screening['observations'] ?? [] as $evidence)
                <p class="mb-2 text-sm leading-7 text-stone-600">{{ $evidence }}</p>
            @endforeach
            <p class="mt-5 text-sm text-stone-500">
                Observed {{ $case->observed_on->format('M j, Y') }}</p>
        </section>
        @can('update', $case)@if ($case->status !== 'closed')
            <details id="followup" class="panel scroll-mt-24" @if (request('followup') || $errors->hasAny(['symptoms', 'actions', 'reported_change', 'photo'])) open @endif>
                <summary class="cursor-pointer text-lg font-semibold">Record a follow-up</summary>
                <form action="{{ route('observations.store', $case) }}" method="POST"
                    enctype="multipart/form-data" class="mt-5">
                    @csrf
                    <input type="hidden" name="observation_id"
                        value="{{ old('observation_id', (string) Str::uuid()) }}"><input type="hidden"
                        name="revision" value="{{ $case->revision }}">
                    <div class="grid gap-x-5 md:grid-cols-2"><x-input-field label="Observation date"
                            name="observed_on" type="date" :value="today()->toDateString()" :min="$case->observed_on->toDateString()" :max="today()->toDateString()"
                            required /><x-select-field label="Reported change" name="reported_change"
                            value="Uncertain" :options="[
                                'Improved' => 'Improved',
                                'Unchanged' => 'Unchanged',
                                'Worsened' => 'Worsened',
                                'Uncertain' => 'Uncertain',
                            ]" required /></div>
                    <x-input-field label="Observed symptoms" name="symptoms" type="textarea" required
                        maxlength="2000" /><x-input-field label="Actions actually taken" name="actions"
                        type="textarea" required maxlength="2000" help="Write No action taken if applicable." />
                    <label for="followup_photo" class="mb-2 block text-sm font-semibold">New photo <span
                            class="font-normal text-stone-500">Optional</span></label><input id="followup_photo"
                        name="photo" type="file" accept="image/jpeg,image/png,image/webp"
                        class="form-input mb-4">
                    @error('photo')
                        <p class="mb-4 text-sm text-red-700">{{ $message }}</p>
                    @enderror
                    @if ($case->sample && $case->crop === 'Rice' && auth()->user()->is_demo)
                        <label class="mb-5 flex items-start gap-3 text-sm leading-6"><input type="checkbox"
                                name="demo_photo" value="1" class="mt-1 h-5 w-5"
                                @checked(old('demo_photo'))>Use the labeled later rice illustration for this demo
                            follow-up.</label>
                    @endif
                    <x-button>Save follow-up</x-button>
                </form>
            </details>
        @endif
    @endcan
    <nav class="flex gap-5 border-b border-stone-200 text-sm font-semibold" aria-label="Case evidence"><a
            href="{{ route('cases.show', $case) }}"
            class="border-b-2 px-1 py-4 {{ request('tab') !== 'compare' ? 'border-green-800 text-green-800' : 'border-transparent text-stone-500' }}">Observation
            history</a><a href="{{ route('cases.show', [$case, 'tab' => 'compare']) }}"
            class="border-b-2 px-1 py-4 {{ request('tab') === 'compare' ? 'border-green-800 text-green-800' : 'border-transparent text-stone-500' }}">Compare
            photos</a></nav>
    @if (request('tab') === 'compare')
        <section class="panel comparison">
            <h2 class="mb-3 text-xl font-semibold">Compare the evidence</h2>
            <p class="mb-5 text-sm leading-7 text-stone-600">First and latest available photos keep their own
                dates, symptoms, and actions.</p>
            @if ($case->sample)
                <x-alert type="demo">Illustrative images and simulated observations. This comparison does not
                    establish disease progression or recovery.</x-alert>
            @endif
            @if ($photos->count() < 2)
                <div class="py-7 text-center"><x-icon name="camera"
                        class="mx-auto mb-4 h-8 w-8 text-stone-400" />
                    <h3 class="font-semibold">A later photo will complete the picture</h3>
                    <p class="mt-3 text-sm text-stone-500">Add a follow-up with a new photo to compare dated
                        observations.</p>
                </div>
            @else
                <div class="grid gap-6 md:grid-cols-2">
                    @foreach ([$photos->first(), $photos->last()] as $photo)
                        <article>
                            <p class="mb-3 text-sm font-semibold">
                                {{ $loop->first ? 'First photo' : 'Latest photo' }}</p><img
                                src="{{ $photo->photoUrl() }}"
                                alt="Crop observation from {{ $photo->observed_on->format('M j, Y') }}"
                                class="mb-4 aspect-[4/3] w-full rounded-xl border border-stone-200 object-contain bg-stone-50">
                            <h3 class="mb-3 font-semibold">{{ $photo->observed_on->format('M j, Y') }}</h3>
                            <p class="mb-4 text-sm leading-7 text-stone-600">{{ $photo->symptoms }}</p>
                            <h4 class="mb-2 text-sm font-semibold">Actions</h4>
                            <p class="mb-4 text-sm leading-7 text-stone-600">{{ $photo->actions }}</p>
                            <x-badge>{{ $photo->reported_change }}</x-badge>
                        </article>
                    @endforeach
                </div>
            @endif
        </section>
    @else
        <section class="panel">
            <h2 class="mb-6 text-xl font-semibold">Every observation, in one place</h2>
            @foreach ($case->observations as $observation)
                <article class="mb-7 border-l-2 border-stone-200 pl-5 last:mb-0">
                    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p class="eyebrow">
                                {{ $loop->first ? 'Initial observation' : 'Follow-up ' . $loop->index }}</p>
                            <h3 class="mt-2 font-semibold">{{ $observation->observed_on->format('M j, Y') }}
                            </h3>
                        </div><x-badge>{{ $observation->reported_change }}</x-badge>
                    </div>
                    @if ($observation->photoUrl())
                        <img src="{{ $observation->photoUrl() }}"
                            alt="{{ $case->crop }} observation from {{ $observation->observed_on->format('M j, Y') }}"
                            class="mb-5 max-h-64 w-full rounded-xl border border-stone-200 object-contain bg-stone-50">
                    @else
                        <p class="mb-5 text-sm text-stone-500">No photograph attached.</p>
                    @endif
                    <h4 class="mb-2 text-sm font-semibold">
                        Observed symptoms</h4>
                    <p class="mb-4 text-sm leading-7 text-stone-600">{{ $observation->symptoms }}</p>
                    <h4 class="mb-2 text-sm font-semibold">Actions taken</h4>
                    <p class="text-sm leading-7 text-stone-600">{{ $observation->actions }}</p>
                    <p class="mt-3 text-xs text-stone-500">Recorded by {{ $observation->user->name }}</p>
                </article>
            @endforeach
        </section>
    @endif
</div>
<aside class="space-y-6">
    <section class="panel">
        <h2 class="mb-5 text-lg font-semibold">Case plan</h2>
        <dl class="mb-6 space-y-4 text-sm">
            <div>
                <dt class="text-stone-500">Next follow-up</dt>
                <dd class="mt-1 font-semibold">
                    {{ $case->next_follow_up?->format('M j, Y') ?? 'Not scheduled' }}</dd>
            </div>
            <div>
                <dt class="text-stone-500">Latest reported change</dt>
                <dd class="mt-1 font-semibold">{{ $case->observations->last()->reported_change }}</dd>
            </div>
            <div>
                <dt class="text-stone-500">Recorded by</dt>
                <dd class="mt-1 font-semibold">{{ $case->user->name }}</dd>
            </div>
            <div>
                <dt class="text-stone-500">Plant age at entry</dt>
                <dd class="mt-1 font-semibold">{{ $case->plant_age ?: 'Not recorded' }}</dd>
            </div>
            <div>
                <dt class="text-stone-500">Follow-ups</dt>
                <dd class="mt-1 font-semibold">{{ $case->observations->count() - 1 }}</dd>
            </div>
        </dl>
        @can('update', $case)<form action="{{ route('cases.update', $case) }}" method="POST"
                class="border-t border-stone-200 pt-5">@csrf @method('PATCH')<input type="hidden"
                    name="revision" value="{{ $case->revision }}"><x-select-field label="Case status"
                    name="status" :value="$case->status" :options="['open' => 'Open', 'monitoring' => 'Monitoring', 'closed' => 'Closed']" /><x-input-field label="Reason for closing"
                    name="reason" type="textarea" maxlength="1000"
                    help="Required when changing the case to Closed." /><x-input-field label="Next follow-up"
                    name="next_follow_up" type="date" :value="$case->next_follow_up?->toDateString() ?? ''" />
                @if (auth()->user()->role === 'owner')
                    <fieldset class="mb-5">
                        <legend class="mb-3 text-sm font-semibold">Assigned workers</legend>
                        @foreach ($workers as $worker)
                            <label class="mb-3 flex items-start gap-3 text-sm"><input type="checkbox"
                                    name="assigned_workers[]" value="{{ $worker->id }}" class="mt-1 h-5 w-5"
                                    @checked($case->assignedWorkers->contains('id', $worker->id))>{{ $worker->name }}</label>
                        @endforeach
                    </fieldset>
                @endif
                <x-button variant="secondary" class="w-full">Save case plan</x-button>
        </form>@else<p class="text-sm leading-7 text-stone-500">A farm worker or owner updates observations.
        </p>@endcan
        @foreach ($case->statusEvents as $event)
            <p class="mt-4 border-t border-stone-200 pt-4 text-sm leading-7 text-stone-600">
                <strong>{{ ucfirst($event->status) }} ·
                    {{ $event->created_at->format('M j, Y') }}</strong><br>{{ $event->reason }}
            </p>
        @endforeach
    </section>
    <x-guidance :screening="$case->screening" />
</aside>
</div>
</x-layout>
