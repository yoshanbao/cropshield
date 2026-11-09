<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index()
    {
        return view('admin.users.index', ['users' => User::orderBy('role')->orderBy('name')->get()]);
    }

    public function create()
    {
        return view('admin.users.create');
    }

    public function store(Request $request)
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:80'], 'email' => ['required', 'email', 'max:191', 'unique:users,email'],
            'role' => ['required', Rule::in(['worker', 'owner', 'admin'])],
            'password' => ['required', 'string', 'min:10', 'confirmed', function ($attribute, $value, $fail) {
                if (strlen($value) > 72) {
                    $fail('Use a password of 72 bytes or less.');
                }
            }],
        ]);
        User::create($data);

        return redirect()->route('admin.users.index')->with('success', 'Account created. The user can log in with their email and password.');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate(['role' => ['required', Rule::in(['worker', 'owner', 'admin'])], 'active' => ['required', 'boolean']]);
        if ($user->is($request->user()) && ($data['role'] !== 'admin' || ! $data['active'])) {
            throw ValidationException::withMessages(['role' => 'Keep your own administrator access enabled.']);
        }
        $user->update($data);

        return redirect()->route('admin.users.index')->with('success', 'User access updated.');
    }
}
