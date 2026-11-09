<x-layout title="Check crop">
    <div class="mb-7">
        <h1 class="page-title">Check your crop</h1>
        <p class="mt-2 text-stone-600">Photograph the problem. Record what you see.</p>
    </div>
    @if ($result)
        <x-alert>Your screening result is ready—continue saving this case. <a href="#result" class="text-link">View
                result</a></x-alert>
    @endif
    <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div class="min-w-0">
            <form id="case-form" action="{{ route('screenings.store') }}" method="POST" enctype="multipart/form-data"
                class="panel">
                @csrf
                <input type="hidden" name="submission_id" value="{{ $draft['submission_id'] }}">
                <input type="hidden" name="photo_id" value="{{ $draft['photo_id'] ?? '' }}">
                <input type="hidden" name="mode" value="{{ $draft['mode'] ?? 'live' }}">
                <p class="mb-6 text-xs text-stone-500">Fields marked <span class="text-red-700">*</span> are required.
                </p>
                <section class="mb-7">
                    <h2 class="step-title"><span>1</span>Add a photo <span class="text-red-700">*</span></h2>
                    <p class="mb-4 text-sm text-stone-600">Show the affected part or the insect clearly.</p>
                    @php $photoUrl = !empty($draft['photo_id']) ? route('photos.show', $draft['photo_id']) : (!empty($draft['sample_photo']) ? asset('images/'.$draft['sample_photo']) : ''); @endphp
                    <div id="photo-preview"
                        class="mb-4 overflow-hidden rounded-xl border border-stone-200 {{ $photoUrl ? '' : 'hidden' }}">
                        <img id="photo-preview-image" src="{{ $photoUrl }}" alt="Crop photo selected for screening"
                            class="max-h-72 w-full object-contain bg-stone-50">
                    </div>
                    @if (($draft['mode'] ?? '') === 'demo')
                        <x-alert type="demo">Illustrative demo image. This photo will not be analyzed by
                            Gemini.</x-alert>
                    @endif
                    <label for="photo" class="mb-2 flex items-center gap-2 text-sm font-semibold"><x-icon
                            name="camera" />Choose a photo</label>
                    <input id="photo" type="file" name="photo" accept="image/jpeg,image/png,image/webp"
                        data-photo-preview
                        class="block w-full rounded-lg border border-dashed border-stone-300 p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-3">
                    <input id="camera-photo" type="file" accept="image/jpeg,image/png,image/webp"
                        capture="environment" class="hidden" aria-label="Take crop photograph">
                    <x-button type="button" variant="secondary" class="mt-3" data-camera>
                        <x-icon name="camera" />Take photo
                    </x-button>
                    <p class="mt-2 text-xs text-stone-500">JPEG, PNG or WebP · Up to 5 MB · Maximum 12 megapixels</p>
                    @error('photo')
                        <p class="mt-2 text-sm text-red-700">{{ $message }}</p>
                    @enderror
                    @error('photo_id')
                        <p class="mt-2 text-sm text-red-700">{{ $message }}</p>
                    @enderror
                </section>
                <section class="border-t border-stone-200 pt-6">
                    <h2 class="step-title"><span>2</span>Select crop</h2>
                    <x-select-field label="Crop" name="crop" :options="config('cropshield.crops')" :value="$draft['crop'] ?? 'Rice'" required
                        data-analysis-input />
                </section>
                <section class="border-t border-stone-200 pt-6">
                    <h2 class="step-title"><span>3</span>Record the observation</h2>
                    <x-input-field label="Visible symptoms" name="symptoms" type="textarea" :value="$draft['symptoms'] ?? ''" required
                        maxlength="2000" placeholder="e.g. Brown spots on lower leaves; small insects underneath."
                        data-analysis-input />
                    <div class="grid gap-x-5 md:grid-cols-2">
                        <x-input-field label="Plant or area label" name="area" :value="$draft['area'] ?? ''" required
                            maxlength="120" placeholder="e.g. Rice Plot A"
                            help="Name this location so you can check it again—for example, Rice Plot A or Kalamansi Tree 5." />
                        <x-input-field label="Observation date" name="observed_on" type="date" :value="$draft['observed_on'] ?? today()->toDateString()"
                            :max="today()->toDateString()" required />
                    </div>
                    <details class="mb-6 rounded-xl border border-stone-200 p-4">
                        <summary class="cursor-pointer text-sm font-semibold">More details <span
                                class="ml-2 font-normal text-stone-500">Optional</span></summary>
                        <div class="mt-5 grid gap-x-5 md:grid-cols-2">
                            <x-input-field label="Plant / sample label" name="sample_label" :value="$draft['sample_label'] ?? 'Plant 01'"
                                maxlength="80" help="For an area, name the photographed plant so later photos match." />
                            <x-input-field label="Plant age" name="plant_age" :value="$draft['plant_age'] ?? ''" maxlength="60"
                                placeholder="e.g. 6 weeks" />
                            <x-input-field label="Next follow-up" name="next_follow_up" type="date"
                                :value="$draft['next_follow_up'] ?? ''" />
                        </div><x-input-field label="Actions already taken" name="actions" type="textarea"
                            :value="$draft['actions'] ?? ''" maxlength="2000" placeholder="What have you done so far, if anything?" />
                    </details>
                </section>
                @if (($draft['mode'] ?? '') === 'demo')
                    <div class="grid gap-x-5 md:grid-cols-2">
                        <x-select-field label="Demo outcome" name="scenario" :value="$draft['scenario'] ?? 'supported'" :options="[
                            'supported' => 'Possible condition',
                            'unclear' => 'Unclear submission',
                            'service-error' => 'Temporary service error',
                            'outside' => 'Outside named demo coverage',
                        ]"
                            data-analysis-input />
                        <x-select-field label="Demo category" name="demo_kind" :value="$draft['demo_kind'] ?? 'Disease'" :options="['Disease' => 'Disease', 'Pest' => 'Pest']"
                            data-analysis-input />
                    </div>
                @endif
                <p id="result-changed" class="mb-4 hidden text-sm text-amber-900">The screening inputs changed. Check
                    this photo again before saving its result.</p>
                @error('screening')
                    <x-alert type="error">{{ $message }}</x-alert>
                @enderror
                <x-button class="w-full" data-busy-label="Checking your photo…"><x-icon
                        name="scan" />{{ !empty($draft['screen_error']) ? 'Retry check' : (($draft['mode'] ?? '') === 'demo' ? 'Show demo result' : 'Check for diseases & pests') }}</x-button>
                <p class="my-3 text-center text-xs leading-6 text-stone-500">
                    {{ ($draft['mode'] ?? '') === 'demo' ? 'Demo result only. No Gemini request.' : 'Photo and symptoms are sent to Gemini. Results are preliminary.' }}
                </p>
                <div class="flex flex-wrap justify-between gap-2">
                    <button type="submit" formaction="{{ route('cases.store') }}" name="intent" value="monitor"
                        class="text-button">Save without screening</button>
                    <button type="submit" formaction="{{ route('draft.store') }}" formnovalidate
                        class="text-button">Save draft</button>
                </div>
            </form>
            @if ($result)
                <div id="result" class="mt-6 space-y-5 scroll-mt-24">
                    <section class="panel">
                        <div class="mb-5 flex items-center justify-between gap-3"><span class="eyebrow">Preliminary
                                screening</span><x-badge>{{ !empty($result['demo']) ? 'Demo result' : 'Image screening' }}</x-badge>
                        </div>
                        <p class="mb-2 text-sm font-semibold text-stone-500">1 · Possible condition</p>
                        <h2 class="mb-6 text-2xl font-bold">
                            {{ $result['guidance']['name'] ?? str_replace('_', ' ', ucfirst(strtolower($result['state']))) }}
                        </h2>
                        <h3 class="mb-3 text-sm font-semibold">2 · Visible evidence</h3>
                        <ul class="list-disc space-y-2 pl-5 leading-7 text-stone-600">
                            @foreach ($result['observations'] as $observation)
                                <li>{{ $observation }}</li>
                            @endforeach
                        </ul>
                        <p class="mt-5 text-sm text-stone-500">A preliminary finding, not a confirmed diagnosis.</p>
                        @if (in_array($result['state'], ['UNCLEAR_IMAGE', 'UNCERTAIN', 'NOT_PLANT', 'CROP_MISMATCH']))
                            <p class="mt-4 text-sm">Take a closer photo of the affected part or insect.</p><label
                                for="photo" class="btn btn-secondary mt-3 cursor-pointer">Take or choose another
                                photo</label>
                        @endif
                    </section>
                    <x-guidance :screening="$result" title="3 · Referenced care steps" />
                    <section class="panel">
                        <h2 class="mb-3 text-lg font-semibold">4 · Save and monitor</h2>
                        <p class="mb-5 text-sm leading-7 text-stone-600">Keep the original observation and this result,
                            then add follow-ups to the same case.</p><x-button form="case-form" :formaction="route('cases.store')"
                            name="intent" value="screened" class="w-full">Save case &amp; start
                            monitoring</x-button>
                    </section>
                </div>
            @endif
        </div>
        <aside class="space-y-5">
            <section class="panel hidden xl:block">
                <h2 class="mb-4 font-semibold">Photo checklist</h2>
                <ul class="space-y-4 text-sm leading-7 text-stone-600">
                    <li>Keep the affected part in focus.</li>
                    <li>For pests, include the insect and its damage.</li>
                    <li>Use the same plant for follow-up photos.</li>
                </ul>
            </section>
            <p class="text-sm leading-7 text-stone-500">Use <strong>Save draft</strong> to return later. Failed checks
                keep the uploaded photo and entered details.</p>
            @if ($demoAvailable)
                <details class="panel">
                    <summary class="cursor-pointer font-semibold">Try a sample</summary>
                    <p class="mt-3 text-sm leading-7 text-stone-600">Practice with labeled simulated results.</p>
                    <form action="{{ route('demo.rice') }}" method="POST" class="mt-4">@csrf <x-button
                            variant="secondary" class="w-full">Load rice example</x-button></form>
                </details>
            @endif
            <form action="{{ route('draft.destroy') }}" method="POST"
                data-confirm="Discard this draft? Saved cases will remain.">@csrf @method('DELETE')<button
                    class="text-button text-stone-500">Discard draft</button></form>
        </aside>
    </div>
</x-layout>
