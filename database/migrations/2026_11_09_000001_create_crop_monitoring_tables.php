<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conditions', function (Blueprint $table) {
            $table->string('id', 191)->primary();
            $table->string('crop', 30)->index();
            $table->enum('kind', ['Disease', 'Pest']);
            $table->string('name', 160);
            foreach (['cues', 'care', 'prevention'] as $field) {
                $table->text($field);
            }
            $table->string('source', 200);
            $table->text('source_url');
            $table->string('version', 60);
            $table->string('review_status', 40);
            $table->date('reviewed_on')->nullable();
            $table->boolean('enabled')->default(false);
            $table->text('limitations')->nullable();
            $table->timestamps();
        });
        Schema::create('photos', function (Blueprint $table) {
            $table->string('id', 191)->primary();
            $table->string('user_id', 191);
            $table->foreign('user_id')->references('id')->on('users');
            $table->string('path');
            $table->string('mime_type', 40);
            $table->timestamps();
        });
        Schema::create('crop_cases', function (Blueprint $table) {
            $table->string('id', 191)->primary();
            $table->string('user_id', 191);
            $table->foreign('user_id')->references('id')->on('users');
            $table->string('crop', 30);
            $table->string('area', 120);
            $table->string('sample_label', 80)->default('Plant 01');
            $table->string('plant_age', 60)->nullable();
            $table->date('observed_on');
            $table->enum('status', ['open', 'monitoring', 'closed'])->default('open');
            $table->date('next_follow_up')->nullable();
            $table->json('screening');
            $table->boolean('sample')->default(false);
            $table->unsignedInteger('revision')->default(0);
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index(['crop', 'observed_on']);
        });
        Schema::create('observations', function (Blueprint $table) {
            $table->string('id', 191)->primary();
            $table->string('crop_case_id', 191);
            $table->foreign('crop_case_id')->references('id')->on('crop_cases');
            $table->string('user_id', 191);
            $table->foreign('user_id')->references('id')->on('users');
            $table->date('observed_on');
            $table->text('symptoms');
            $table->text('actions');
            $table->string('reported_change', 30)->default('Uncertain');
            $table->string('photo_id', 191)->nullable();
            $table->foreign('photo_id')->references('id')->on('photos');
            $table->string('sample_photo')->nullable();
            $table->timestamps();
            $table->index(['crop_case_id', 'observed_on']);
        });
        Schema::create('case_assignments', function (Blueprint $table) {
            $table->string('crop_case_id', 191);
            $table->string('user_id', 191);
            $table->foreign('crop_case_id')->references('id')->on('crop_cases');
            $table->foreign('user_id')->references('id')->on('users');
            $table->primary(['crop_case_id', 'user_id']);
        });
        Schema::create('case_status_events', function (Blueprint $table) {
            $table->id();
            $table->string('crop_case_id', 191);
            $table->foreign('crop_case_id')->references('id')->on('crop_cases');
            $table->string('status', 20);
            $table->text('reason');
            $table->timestamps();
        });
        Schema::create('drafts', function (Blueprint $table) {
            $table->string('user_id', 191)->primary();
            $table->foreign('user_id')->references('id')->on('users');
            $table->json('data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['drafts', 'case_status_events', 'case_assignments', 'observations', 'crop_cases', 'photos', 'conditions'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
