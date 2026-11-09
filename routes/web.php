<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\ConditionController;
use App\Http\Controllers\DraftController;
use App\Http\Controllers\GuideController;
use App\Http\Controllers\ObservationController;
use App\Http\Controllers\PhotoController;
use App\Http\Controllers\ScreeningController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => auth()->check() ? redirect()->route(auth()->user()->homeRoute()) : redirect()->route('login'))->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'loginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:20,1')->name('login.store');
    Route::get('/register', [AuthController::class, 'registerForm'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1')->name('register.store');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn () => redirect()->route(auth()->user()->homeRoute()))->name('dashboard');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/worker', [CaseController::class, 'create'])->middleware('role:worker')->name('worker.dashboard');
    Route::get('/owner', [CaseController::class, 'index'])->middleware('role:owner')->name('owner.dashboard');
    Route::get('/admin', [ConditionController::class, 'index'])->middleware('role:admin')->name('admin.dashboard');
    Route::get('/cases', [CaseController::class, 'index'])->name('cases.index');
    Route::get('/guide', [GuideController::class, 'index'])->name('guide.index');
    Route::get('/photos/{photo}', [PhotoController::class, 'show'])->name('photos.show');

    Route::middleware('role:worker,owner')->group(function () {
        Route::get('/cases/create', [CaseController::class, 'create'])->name('cases.create');
        Route::post('/cases', [CaseController::class, 'store'])->name('cases.store');
        Route::post('/screenings', [ScreeningController::class, 'store'])->middleware('throttle:6,1')->name('screenings.store');
        Route::post('/draft', [DraftController::class, 'store'])->name('draft.store');
        Route::delete('/draft', [DraftController::class, 'destroy'])->name('draft.destroy');
        Route::post('/demo/rice', [DraftController::class, 'demo'])->name('demo.rice');
        Route::patch('/cases/{case}', [CaseController::class, 'update'])->name('cases.update');
        Route::post('/cases/{case}/observations', [ObservationController::class, 'store'])->name('observations.store');
    });
    Route::get('/cases/{case}/summary', [CaseController::class, 'print'])->name('cases.print');
    Route::get('/cases/{case}', [CaseController::class, 'show'])->name('cases.show');

    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::resource('conditions', ConditionController::class)->except(['show', 'destroy']);
        Route::resource('users', UserController::class)->only(['index', 'create', 'store', 'update']);
    });
});
