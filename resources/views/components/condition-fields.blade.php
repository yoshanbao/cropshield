@props(['condition'])
<div class="grid gap-x-5 md:grid-cols-2"><x-select-field label="Crop" name="crop" :options="config('cropshield.crops')" :value="$condition->crop"
        required /><x-select-field label="Category" name="kind" :options="['Disease' => 'Disease', 'Pest' => 'Pest']" :value="$condition->kind" required /></div>
<x-input-field label="Condition name" name="name" :value="$condition->name" required maxlength="160" /><x-input-field
    label="Visible symptoms" name="cues" type="textarea" :value="$condition->cues" required maxlength="2500" /><x-input-field
    label="Management information" name="care" type="textarea" :value="$condition->care" required
    maxlength="4000" /><x-input-field label="Prevention practices" name="prevention" type="textarea" :value="$condition->prevention"
    required maxlength="4000" />
<div class="grid gap-x-5 md:grid-cols-2"><x-input-field label="Reference organization / title" name="source"
        :value="$condition->source" required maxlength="200" /><x-input-field label="Source link" name="source_url" type="url"
        :value="$condition->source_url" required maxlength="1000" /><x-input-field label="Content version" name="version"
        :value="$condition->version" required maxlength="60" /><x-input-field label="Content review date" name="reviewed_on"
        type="date" :value="$condition->reviewed_on?->toDateString() ?? ''" :max="today()->toDateString()" /><x-select-field label="Content review status"
        name="review_status" :value="$condition->review_status" :options="array_combine($condition->review_status === 'Pilot reference' ? ['Pending review', 'Source checked', 'Reviewed', 'Needs revision', 'Pilot reference'] : ['Pending review', 'Source checked', 'Reviewed', 'Needs revision'], $condition->review_status === 'Pilot reference' ? ['Pending review', 'Source checked', 'Reviewed', 'Needs revision', 'Pilot reference'] : ['Pending review', 'Source checked', 'Reviewed', 'Needs revision'])" /></div>
<x-input-field label="Limitations" name="limitations" type="textarea" :value="$condition->limitations" maxlength="2000" />
<label class="mb-6 flex items-center gap-3 text-sm"><input type="checkbox" name="enabled" value="1" class="h-5 w-5"
        @checked(old('enabled', $condition->enabled))>Available in the screening library</label>
@error('enabled')
    <p class="mb-5 text-sm text-red-700">{{ $message }}</p>
@enderror
