<?php

namespace App\Console\Commands;

use App\Models\Condition;
use App\Models\CropCase;
use App\Models\Draft;
use App\Models\Observation;
use App\Models\Photo;
use App\Models\User;
use App\Services\DraftService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportNextjsRecords extends Command
{
    protected $signature = 'cropshield:import-nextjs {--dry-run : Count source records without importing}';

    protected $description = 'Copy current monitoring records from the old database without changing the source';

    public function handle(): int
    {
        if (! config('database.connections.legacy.url')) {
            $this->error('Set LEGACY_DATABASE_URL in your private .env first.');

            return self::FAILURE;
        }
        $source = DB::connection('legacy');
        if ($source->getDatabaseName() === DB::connection()->getDatabaseName()) {
            $this->error('Use a separate target database. The original database must remain untouched.');

            return self::FAILURE;
        }
        $counts = ['users' => $source->table('User')->count(), 'cases' => $source->table('FarmCase')->count(), 'observations' => $source->table('FarmObservation')->count(), 'photos' => $source->table('FarmImage')->count(), 'conditions' => $source->table('CropCondition')->count()];
        if ($this->option('dry-run')) {
            $this->line(json_encode($counts));

            return self::SUCCESS;
        }
        DB::transaction(function () use ($source) {
            foreach ($source->table('User')->get() as $row) {
                // PHP recognizes the equivalent $2y$ prefix; retain the existing bcrypt digest.
                $password = str_starts_with($row->passwordHash, '$2b$') ? '$2y$'.substr($row->passwordHash, 4) : $row->passwordHash;
                User::unguarded(fn () => User::firstOrCreate(['id' => $row->id], ['name' => $row->name, 'email' => $row->email, 'password' => $password, 'role' => match ($row->role) {
                    'OWNER' => 'owner', 'ADMIN' => 'admin', default => 'worker'
                }, 'active' => (bool) $row->active, 'is_demo' => (bool) $row->isDemo, 'created_at' => $row->createdAt, 'updated_at' => $row->updatedAt]));
            }
            foreach ($source->table('CropCondition')->get() as $row) {
                Condition::firstOrCreate(['id' => $row->id], ['crop' => $row->crop, 'kind' => $row->kind, 'name' => $row->name, 'cues' => $row->cues, 'care' => $row->care, 'prevention' => $row->prevention, 'source' => $row->source, 'source_url' => $row->sourceUrl, 'version' => $row->version, 'review_status' => $row->reviewStatus, 'reviewed_on' => $row->reviewedAt, 'enabled' => (bool) $row->enabled, 'limitations' => $row->limitations]);
            }
            foreach ($source->table('FarmImage')->get() as $row) {
                if (Photo::find($row->id)) {
                    continue;
                }
                $extension = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$row->mimeType] ?? null;
                if (! $extension || ! preg_match('/^[a-zA-Z0-9-]+$/', $row->id)) {
                    throw new \RuntimeException('An old photo has an unsupported format or identifier.');
                }
                $path = 'crop-photos/'.$row->id.'.'.$extension;
                if (! Storage::disk('local')->put($path, $row->bytes)) {
                    throw new \RuntimeException('An imported photo could not be stored privately.');
                }
                Photo::create(['id' => $row->id, 'user_id' => $row->uploaderId, 'path' => $path, 'mime_type' => $row->mimeType, 'created_at' => $row->createdAt]);
            }
            foreach ($source->table('FarmCase')->get() as $row) {
                $date = $source->table('FarmObservation')->where('caseId', $row->id)->min('date');
                CropCase::firstOrCreate(['id' => $row->id], ['user_id' => $row->createdById, 'crop' => $row->crop, 'area' => $row->area, 'sample_label' => $row->sampleLabel, 'plant_age' => $row->plantAge, 'observed_on' => $date, 'status' => strtolower($row->status), 'next_follow_up' => $row->nextFollowUp, 'screening' => json_decode($row->screening, true), 'sample' => (bool) $row->sample, 'revision' => $row->revision, 'created_at' => $row->createdAt, 'updated_at' => $row->updatedAt]);
            }
            foreach ($source->table('FarmObservation')->get() as $row) {
                $sample = basename($row->samplePath ?? '');
                Observation::firstOrCreate(['id' => $row->id], ['crop_case_id' => $row->caseId, 'user_id' => $row->authorId, 'observed_on' => $row->date, 'symptoms' => $row->symptoms, 'actions' => $row->actions, 'reported_change' => match ($row->change) {
                    'Improving' => 'Improved', 'Worsening' => 'Worsened', 'No change' => 'Unchanged', default => $row->change
                }, 'photo_id' => $row->photoId, 'sample_photo' => in_array($sample, ['demo-rice-first.svg', 'demo-rice-later.svg', 'demo-okra-first.svg']) ? $sample : null, 'created_at' => $row->createdAt]);
            }
            foreach ($source->table('FarmAssignment')->get() as $row) {
                CropCase::findOrFail($row->caseId)->assignedWorkers()->syncWithoutDetaching([$row->userId]);
            }
            foreach ($source->table('FarmStatusEvent')->get() as $row) {
                CropCase::findOrFail($row->caseId)->statusEvents()->firstOrCreate(['status' => strtolower($row->status), 'reason' => $row->reason, 'created_at' => Carbon::parse($row->createdAt)->startOfSecond()]);
            }
            foreach ($source->table('FarmDraft')->get() as $row) {
                if (Draft::find($row->userId)) {
                    continue;
                }
                $old = json_decode($row->data, true);
                $photoId = preg_match('~^/api/images/([a-zA-Z0-9-]+)$~', $old['photo'] ?? '', $matches) ? $matches[1] : null;
                $sample = basename($old['photo'] ?? '');
                $data = ['submission_id' => Str::isUuid($old['id'] ?? '') ? $old['id'] : (string) Str::uuid(), 'crop' => $old['crop'] ?? 'Rice', 'area' => $old['area'] ?? '', 'sample_label' => $old['sampleLabel'] ?? 'Plant 01', 'plant_age' => $old['plantAge'] ?? '', 'observed_on' => $old['date'] ?? today()->toDateString(), 'next_follow_up' => ($old['nextFollowUp'] ?? '') ?: null, 'symptoms' => $old['symptoms'] ?? '', 'actions' => $old['actions'] ?? '', 'photo_id' => $photoId, 'sample_photo' => in_array($sample, ['demo-rice-first.svg', 'demo-rice-later.svg', 'demo-okra-first.svg']) ? $sample : null, 'mode' => $old['mode'] ?? 'live', 'scenario' => $old['scenario'] ?? 'supported', 'demo_kind' => $old['demoKind'] ?? 'Disease'];
                $cached = $source->table('FarmScreening')->where('id', $old['id'] ?? '')->where('userId', $row->userId)->where('state', 'COMPLETE')->first();
                $fingerprint = hash('sha256', json_encode([$data['crop'], trim($data['symptoms']), $old['photo'] ?? ''], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
                $scenario = $data['mode'] === 'demo' ? $data['scenario'].':'.$data['demo_kind'] : null;
                if ($cached && $cached->fingerprint === $fingerprint && $cached->mode === $data['mode'] && $cached->scenario === $scenario) {
                    $data['result'] = json_decode($cached->result, true);
                    $data['result_fingerprint'] = app(DraftService::class)->fingerprint($data);
                }
                Draft::create(['user_id' => $row->userId, 'data' => $data]);
            }
        });
        $this->info('Copied current accounts, monitoring cases, dated observations, images, assignments, references, and drafts. Source database unchanged.');
        $this->line(json_encode($counts));

        return self::SUCCESS;
    }
}
