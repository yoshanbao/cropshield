<?php

namespace Tests\Feature;

use App\Models\Condition;
use App\Models\CropCase;
use App\Models\Draft;
use App\Models\Photo;
use App\Models\User;
use App\Services\DraftService;
use App\Services\ScreeningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

class CropShieldTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['cropshield.local_demo' => true]);
        $this->seed();
        Storage::fake('local');
    }

    private function worker(): User
    {
        return User::findOrFail('worker-1');
    }

    private function draftData(): array
    {
        return app(DraftService::class)->current($this->worker()->id)->data;
    }

    private function completeData(): array
    {
        return [...$this->draftData(), 'crop' => 'Rice', 'area' => 'Test Plot A', 'symptoms' => 'Spots observed on leaves.', 'observed_on' => today()->toDateString(), 'sample_label' => 'Plant 01', 'intent' => 'monitor'];
    }

    public function test_guests_cannot_open_protected_pages(): void
    {
        foreach (['/worker', '/owner', '/admin', '/cases', '/guide', '/photos/missing'] as $url) {
            $this->get($url)->assertRedirect(route('login'));
        }
    }

    public function test_three_roles_login_to_separate_pages_and_logout(): void
    {
        foreach ([['worker-1@demo.cropshield.local', 'WorkerDemo123!', 'worker.dashboard'], ['owner@demo.cropshield.local', 'OwnerDemo123!', 'owner.dashboard'], ['admin@demo.cropshield.local', 'AdminDemo123!', 'admin.dashboard']] as [$email, $password, $route]) {
            $this->post('/login', compact('email', 'password'))->assertRedirect(route($route));
            $this->get(route($route))->assertOk();
            $this->post('/logout')->assertRedirect(route('login'));
            $this->assertGuest();
        }
        $this->post('/login', ['email' => 'worker-1@demo.cropshield.local', 'password' => 'wrong'])->assertSessionHasErrors('email');
    }

    public function test_public_registration_cannot_escalate_role_and_hashes_password(): void
    {
        $data = ['name' => 'Test worker', 'email' => 'new-worker@example.test', 'password' => 'WorkerTest123!', 'password_confirmation' => 'WorkerTest123!'];
        $this->post('/register', [...$data, 'role' => 'admin'])->assertSessionHasErrors('role');
        $this->assertDatabaseMissing('users', ['email' => $data['email']]);
        $this->post('/register', $data)->assertRedirect(route('login'));
        $user = User::where('email', $data['email'])->firstOrFail();
        $this->assertSame('worker', $user->role);
        $this->assertFalse($user->is_demo);
        $this->assertTrue(Hash::check($data['password'], $user->password));
        $this->post('/register', $data)->assertSessionHasErrors('email');
    }

    public function test_role_urls_and_admin_writes_are_blocked(): void
    {
        $this->actingAs($this->worker());
        $this->get('/owner')->assertForbidden();
        $this->get('/admin')->assertForbidden();
        $this->post('/admin/users', [])->assertForbidden();
        $this->post('/admin/conditions', [])->assertForbidden();
        $this->actingAs(User::find('admin'))->get('/cases/create')->assertForbidden();
    }

    public function test_real_photo_case_is_saved_and_private_to_authorized_users(): void
    {
        $this->actingAs($this->worker());
        $data = [...$this->completeData(), 'photo' => UploadedFile::fake()->image('leaf.jpg', 400, 300)];
        $this->post('/cases', $data)->assertRedirect();
        $case = CropCase::findOrFail($data['submission_id']);
        $this->assertSame($this->worker()->id, $case->user_id);
        $this->assertSame('NOT_SCREENED', $case->screening['state']);
        $photo = $case->observations->first()->photo;
        Storage::disk('local')->assertExists($photo->path);
        $this->get(route('photos.show', $photo))->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->post('/cases', $data)->assertRedirect(route('cases.show', $case));
        $this->assertDatabaseCount('crop_cases', 6);
        $this->get(route('cases.show', $case))->assertSee('Test Plot A');
        $this->actingAs(User::find('worker-2'))->get(route('cases.show', $case))->assertForbidden();
        $this->get(route('photos.show', $photo))->assertNotFound();
        $this->actingAs(User::find('owner'))->get(route('cases.show', $case))->assertOk();
        $this->get(route('photos.show', $photo))->assertOk();
        $this->post('/logout');
        $this->get(route('photos.show', $photo))->assertRedirect(route('login'));
    }

    public function test_case_validation_rejects_unsupported_crop_and_missing_evidence(): void
    {
        $this->actingAs($this->worker());
        $this->from('/cases/create')->post('/cases', [...$this->completeData(), 'crop' => 'Tomato'])->assertSessionHasErrors('crop');
        $this->post('/cases', $this->completeData())->assertSessionHasErrors('photo_id');
        $this->assertDatabaseCount('crop_cases', 5);
    }

    public function test_demo_result_draft_is_restored_and_immutable_after_save(): void
    {
        $this->actingAs($this->worker())->post('/demo/rice')->assertRedirect();
        $data = Draft::find('worker-1')->data;
        $this->post('/screenings', $data)->assertRedirect();
        $this->get('/cases/create')->assertSee('Your screening result is ready')->assertSee('Demo result')->assertSee('Rice leaf blast');
        $cached = Draft::find('worker-1')->data;
        $this->assertSame('MATCHED', $cached['result']['state']);
        $this->post('/cases', [...$cached, 'intent' => 'screened'])->assertRedirect();
        $case = CropCase::findOrFail($cached['submission_id']);
        $snapshot = $case->screening['guidance']['care'];
        Condition::find('rice-blast')->update(['care' => 'Changed reference for future cases.']);
        $this->assertSame($snapshot, $case->fresh()->screening['guidance']['care']);
        $this->assertDatabaseMissing('drafts', ['user_id' => 'worker-1']);
    }

    public function test_changed_inputs_cannot_save_an_old_screening_result(): void
    {
        $this->actingAs($this->worker())->post('/demo/rice');
        $this->post('/screenings', Draft::find('worker-1')->data);
        $data = Draft::find('worker-1')->data;
        $this->post('/cases', [...$data, 'crop' => 'Corn', 'intent' => 'screened'])->assertSessionHasErrors('screening');
        $this->assertDatabaseCount('crop_cases', 5);
    }

    public function test_restored_live_result_can_be_saved_without_demo_metadata(): void
    {
        $this->actingAs($this->worker());
        $photo = Photo::create(['id' => (string) Str::uuid(), 'user_id' => 'worker-1', 'path' => 'restored.jpg', 'mime_type' => 'image/jpeg']);
        $data = [...$this->completeData(), 'photo_id' => $photo->id, 'scenario' => 'supported', 'demo_kind' => 'Disease'];
        $data['result'] = app(ScreeningService::class)->resolve('Rice', ['state' => 'UNCERTAIN', 'conditionId' => '', 'observations' => ['No specific cause identified.']]);
        $data['result_fingerprint'] = app(DraftService::class)->fingerprint($data);
        Draft::where('user_id', 'worker-1')->update(['data' => json_encode($data)]);
        unset($data['scenario'], $data['demo_kind'], $data['result'], $data['result_fingerprint']);
        $this->post('/cases', [...$data, 'intent' => 'screened'])->assertRedirect();
        $this->assertSame('UNCERTAIN', CropCase::findOrFail($data['submission_id'])->screening['state']);
    }

    public function test_date_filters_can_use_an_end_date_without_a_start_date(): void
    {
        $this->actingAs($this->worker())->get('/cases?to='.today()->toDateString())->assertOk();
    }

    public function test_slow_screening_cannot_replace_newer_symptoms_or_location_edits(): void
    {
        $drafts = app(DraftService::class);
        $draft = $drafts->current('worker-1');
        $submitted = [...$this->completeData(), 'photo_id' => 'same-upload'];
        $newer = [...$submitted, 'area' => 'Updated plot label', 'symptoms' => 'A newer observation.'];
        $draft->update(['data' => $newer]);
        $this->assertFalse($drafts->finishCheck($draft, $submitted, ['state' => 'UNCERTAIN', 'observations' => []]));
        $this->assertSame('A newer observation.', $draft->fresh()->data['symptoms']);
        $this->assertArrayNotHasKey('result', $draft->fresh()->data);

        $samePhoto = [...$submitted, 'area' => 'Updated plot label'];
        $draft->update(['data' => $samePhoto]);
        $this->assertTrue($drafts->finishCheck($draft, $submitted, ['state' => 'UNCERTAIN', 'observations' => []]));
        $this->assertSame('Updated plot label', $draft->fresh()->data['area']);
        $this->assertSame('UNCERTAIN', $draft->fresh()->data['result']['state']);
    }

    public function test_unclear_service_error_retry_and_outside_demo_can_be_monitored(): void
    {
        $this->actingAs($this->worker())->post('/demo/rice');
        $data = Draft::find('worker-1')->data;
        $this->post('/screenings', [...$data, 'scenario' => 'unclear']);
        $this->assertSame('UNCLEAR_IMAGE', Draft::find('worker-1')->data['result']['state']);
        $this->assertArrayNotHasKey('guidance', Draft::find('worker-1')->data['result']);
        $this->post('/screenings', [...$data, 'scenario' => 'service-error']);
        $retained = Draft::find('worker-1')->data;
        $this->assertSame($data['sample_photo'], $retained['sample_photo']);
        $this->assertSame($data['symptoms'], $retained['symptoms']);
        $this->assertArrayHasKey('screen_error', $retained);
        $this->post('/screenings', $retained);
        $this->assertSame('MATCHED', Draft::find('worker-1')->data['result']['state']);
        $this->post('/screenings', [...$data, 'crop' => 'Okra', 'scenario' => 'outside']);
        $outside = Draft::find('worker-1')->data;
        $this->assertSame('COVERAGE_LIMITED', $outside['result']['state']);
        $this->post('/cases', [...$outside, 'intent' => 'screened'])->assertRedirect();
        $this->assertDatabaseHas('crop_cases', ['id' => $outside['submission_id'], 'crop' => 'Okra']);
    }

    public function test_followup_requires_chronology_and_actions_and_keeps_original(): void
    {
        $case = CropCase::find('CS-DEMO-001');
        $initial = $case->observations->first()->symptoms;
        $this->actingAs($this->worker());
        $data = ['observation_id' => (string) Str::uuid(), 'revision' => 0, 'observed_on' => today()->toDateString(), 'symptoms' => 'Same leaf checked again.', 'actions' => 'No action taken.', 'reported_change' => 'Unchanged', 'demo_photo' => 1];
        $this->post(route('observations.store', $case), [...$data, 'actions' => ''])->assertSessionHasErrors('actions');
        $this->post(route('observations.store', $case), [...$data, 'observed_on' => today()->addDay()->toDateString()])->assertSessionHasErrors('observed_on');
        $this->post(route('observations.store', $case), $data)->assertRedirect();
        $this->post(route('observations.store', $case), $data)->assertRedirect();
        $this->assertSame(3, $case->observations()->count());
        $this->assertSame($initial, $case->observations()->first()->symptoms);
        $this->get(route('cases.print', $case))->assertOk()->assertSee('Case summary')->assertSee('Same leaf checked again.');
        $this->actingAs(User::find('worker-2'))->post(route('observations.store', $case), $data)->assertForbidden();
    }

    public function test_status_closure_requires_reason_and_cannot_silently_overwrite(): void
    {
        $case = CropCase::find('CS-DEMO-001');
        $this->actingAs($this->worker());
        $this->patch(route('cases.update', $case), ['revision' => 0, 'status' => 'closed'])->assertSessionHasErrors('reason');
        $this->patch(route('cases.update', $case), ['revision' => 0, 'status' => 'closed', 'reason' => 'Monitoring period completed.'])->assertRedirect();
        $this->assertSame('closed', $case->fresh()->status);
        $this->assertSame(1, $case->statusEvents()->count());
        $this->patch(route('cases.update', $case), ['revision' => 0, 'status' => 'open'])->assertSessionHasErrors('revision');
        $this->patch(route('cases.update', $case), ['revision' => 1, 'status' => 'monitoring'])->assertRedirect();
        $this->assertSame('monitoring', $case->fresh()->status);
        $this->assertSame(2, $case->observations()->count());
    }

    public function test_assignment_gives_a_worker_access_and_admin_can_create_roles(): void
    {
        $case = CropCase::find('CS-DEMO-001');
        $this->actingAs(User::find('owner'))->patch(route('cases.update', $case), ['revision' => 0, 'status' => 'monitoring', 'assigned_workers' => ['worker-2']])->assertRedirect();
        $this->actingAs(User::find('worker-2'))->get(route('cases.show', $case))->assertOk();
        $this->actingAs(User::find('admin'))->post('/admin/users', ['name' => 'Test owner', 'email' => 'owner@example.test', 'role' => 'owner', 'password' => 'OwnerExample123!', 'password_confirmation' => 'OwnerExample123!'])->assertRedirect(route('admin.users.index'));
        $this->assertDatabaseHas('users', ['email' => 'owner@example.test', 'role' => 'owner', 'is_demo' => false]);
        $this->patch('/admin/users/admin', ['role' => 'worker', 'active' => 0])->assertSessionHasErrors('role');
    }

    public function test_disabled_accounts_and_demo_accounts_on_public_hosts_are_denied(): void
    {
        $worker = $this->worker();
        $this->actingAs($worker);
        $worker->update(['active' => false]);
        $this->get('/worker')->assertRedirect(route('login'));
        $this->assertGuest();
        $worker->update(['active' => true]);
        config(['cropshield.local_demo' => false]);
        $this->post('/login', ['email' => $worker->email, 'password' => 'WorkerDemo123!'])->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_guidance_validates_sources_and_review_before_enabling(): void
    {
        $this->actingAs(User::find('admin'));
        $entry = Condition::find('rice-blast');
        $data = [...$entry->only(['crop', 'kind', 'name', 'cues', 'care', 'prevention', 'source', 'source_url', 'version']), 'review_status' => 'Source checked', 'reviewed_on' => today()->toDateString(), 'enabled' => 1];
        $this->put(route('admin.conditions.update', $entry), [...$data, 'source_url' => 'javascript:alert(1)'])->assertSessionHasErrors('source_url');
        $this->put(route('admin.conditions.update', $entry), [...$data, 'review_status' => 'Pending review'])->assertSessionHasErrors('enabled');
        $this->put(route('admin.conditions.update', $entry), $data)->assertRedirect();
    }

    public function test_gemini_response_matches_only_enabled_conditions_for_the_selected_crop(): void
    {
        $service = app(ScreeningService::class);
        $wrong = $service->resolve('Rice', ['state' => 'MATCHED', 'conditionId' => 'corn-rust', 'observations' => ['Visible markings.']]);
        $this->assertSame('UNCERTAIN', $wrong['state']);
        $this->assertArrayNotHasKey('guidance', $wrong);
        $right = $service->resolve('Rice', ['state' => 'MATCHED', 'conditionId' => 'rice-blast', 'observations' => ['Visible markings.']]);
        $this->assertSame('rice-blast', $right['guidance']['id']);
        $this->expectException(RuntimeException::class);
        $service->resolve('Rice', ['state' => 'MATCHED', 'observations' => str_repeat('x', 100)]);
    }

    public function test_live_transport_sends_image_server_side_and_stops_at_quota_errors(): void
    {
        config(['cropshield.gemini_key' => 'test-placeholder-key']);
        $photo = Photo::create(['id' => (string) Str::uuid(), 'user_id' => 'worker-1', 'path' => 'test.jpg', 'mime_type' => 'image/jpeg']);
        Storage::disk('local')->put('test.jpg', UploadedFile::fake()->image('leaf.jpg')->getContent());
        Http::preventStrayRequests();
        Http::fakeSequence()->push(['candidates' => [['content' => ['parts' => [['text' => json_encode(['state' => 'MATCHED', 'conditionId' => 'rice-blast', 'observations' => ['Spots visible.']])]]]]]], 200)->push([], 429);
        $result = app(ScreeningService::class)->screen(['crop' => 'Rice', 'symptoms' => 'Spots.', 'mode' => 'live', 'photo_id' => $photo->id]);
        $this->assertSame('MATCHED', $result['state']);
        Http::assertSent(fn ($request) => $request->hasHeader('x-goog-api-key', 'test-placeholder-key') && isset($request['contents'][0]['parts'][1]['inlineData']['data']));
        try {
            app(ScreeningService::class)->screen(['crop' => 'Rice', 'symptoms' => 'Spots.', 'mode' => 'live', 'photo_id' => $photo->id]);
            $this->fail('A quota error should stop screening.');
        } catch (RuntimeException $error) {
            $this->assertStringContainsString('quota', $error->getMessage());
        }
        Http::assertSentCount(2);
    }
}
