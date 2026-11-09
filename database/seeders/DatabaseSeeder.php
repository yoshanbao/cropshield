<?php

namespace Database\Seeders;

use App\Models\Condition;
use App\Models\CropCase;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Published passwords belong only to local, clearly marked demo users.
        $accounts = [
            ['worker-1', 'Demo worker 1', 'worker-1@demo.cropshield.local', 'worker', 'WorkerDemo123!'],
            ['worker-2', 'Demo worker 2', 'worker-2@demo.cropshield.local', 'worker', 'WorkerDemo123!'],
            ['owner', 'Demo farm owner', 'owner@demo.cropshield.local', 'owner', 'OwnerDemo123!'],
            ['admin', 'Demo administrator', 'admin@demo.cropshield.local', 'admin', 'AdminDemo123!'],
        ];
        foreach ($accounts as [$id, $name, $email, $role, $password]) {
            $existing = User::find($id);
            if ($existing && ! $existing->is_demo) {
                throw new RuntimeException('A demo ID belongs to a real account. No password was changed.');
            }
            User::unguarded(fn () => User::updateOrCreate(['id' => $id], ['name' => $name, 'email' => $email, 'role' => $role, 'password' => Hash::make($password), 'active' => true, 'is_demo' => true]));
        }
        foreach (json_decode(file_get_contents(database_path('data/conditions.json')), true) as $entry) {
            $entry['reviewed_on'] = $entry['reviewed_on'] ?: null;
            Condition::firstOrCreate(['id' => $entry['id']], $entry);
        }
        $samples = [
            ['CS-DEMO-001', 'Rice', 'Rice field · Plot A', 'worker-1', 'monitoring', 0, 'Spindle-shaped brown spots on lower leaves.', 'rice-blast'],
            ['CS-DEMO-002', 'Corn', 'Vegetable area · Row 02', 'worker-2', 'open', -1, 'Cinnamon-brown pustules on leaf surfaces.', 'corn-rust'],
            ['CS-DEMO-003', 'Okra', 'Vegetable area · Row 04', 'worker-1', 'monitoring', 2, 'Yellowing on two lower leaves.', null],
            ['CS-DEMO-004', 'Chili', 'Vegetable area · Row 06', 'owner', 'closed', 0, 'Leaf curling observed.', null],
            ['CS-DEMO-005', 'Eggplant', 'Vegetable area · Row 03', 'worker-2', 'monitoring', 1, 'Pale patches on lower leaves.', null],
        ];
        foreach ($samples as [$id, $crop, $area, $userId, $status, $offset, $symptoms, $conditionId]) {
            if (CropCase::find($id)) {
                continue;
            }
            $screening = ['state' => $conditionId ? 'MATCHED' : 'NOT_SCREENED', 'demo' => true, 'observations' => ['Simulated practice record. This is not a confirmed diagnosis.']];
            if ($conditionId) {
                $screening['guidance'] = Condition::findOrFail($conditionId)->only(['id', 'name', 'crop', 'kind', 'cues', 'care', 'prevention', 'source', 'source_url', 'version', 'limitations']);
            }
            $case = CropCase::create(['id' => $id, 'user_id' => $userId, 'crop' => $crop, 'area' => $area, 'sample_label' => 'Plant 01', 'observed_on' => today()->subDays(5), 'status' => $status, 'next_follow_up' => $status === 'closed' ? null : today()->addDays($offset), 'screening' => $screening, 'sample' => true]);
            $case->observations()->create(['user_id' => $userId, 'observed_on' => today()->subDays(5), 'symptoms' => $symptoms, 'actions' => 'Initial practice observation recorded.', 'reported_change' => 'Not yet assessed', 'sample_photo' => $crop === 'Rice' ? 'demo-rice-first.svg' : null]);
            if ($crop === 'Rice') {
                $case->observations()->create(['user_id' => $userId, 'observed_on' => today()->subDays(2), 'symptoms' => 'Spots still visible. No new affected leaves observed in this sample.', 'actions' => 'Reviewed water management and recorded the same marked plant.', 'reported_change' => 'Unchanged', 'sample_photo' => 'demo-rice-later.svg']);
            }
            if ($status === 'closed') {
                $case->statusEvents()->create(['status' => 'closed', 'reason' => 'Practice observation period completed; this does not establish recovery.']);
            }
        }
    }
}
