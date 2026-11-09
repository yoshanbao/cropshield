<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\DemoAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function loginForm(Request $request)
    {
        return view('auth.login', ['demoAvailable' => DemoAccess::allowed($request)]);
    }

    public function login(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:191'], 'password' => ['required', 'string', 'max:200']]);
        $email = Str::lower(trim($data['email']));
        $key = 'login:'.hash('sha256', $email.'|'.$request->ip());
        if (RateLimiter::tooManyAttempts($key, 8)) {
            throw ValidationException::withMessages(['email' => 'Too many attempts. Wait a minute and try again.']);
        }
        RateLimiter::hit($key, 60);
        if (! Auth::attempt(['email' => $email, 'password' => $data['password'], 'active' => true])) {
            throw ValidationException::withMessages(['email' => 'The email or password is incorrect.']);
        }
        if (Auth::user()->is_demo && ! DemoAccess::allowed($request)) {
            Auth::logout();
            throw ValidationException::withMessages(['email' => 'The email or password is incorrect.']);
        }
        RateLimiter::clear($key);
        $request->session()->regenerate();

        return redirect()->route($request->user()->homeRoute());
    }

    public function registerForm()
    {
        return view('auth.register');
    }

    public function register(Request $request)
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'email' => ['required', 'email', 'max:191', 'unique:users,email'],
            'password' => ['required', 'string', 'min:10', 'confirmed', function ($attribute, $value, $fail) {
                if (strlen($value) > 72) {
                    $fail('Use a password of 72 bytes or less.');
                }
            }],
            'role' => ['prohibited'], 'active' => ['prohibited'], 'is_demo' => ['prohibited'],
        ]);
        User::create(['name' => $data['name'], 'email' => $data['email'], 'password' => $data['password'], 'role' => 'worker']);

        return redirect()->route('login')->with('success', 'Account created. Log in to open your worker workspace.');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'You have logged out.');
    }
}
