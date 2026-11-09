<x-layout title="Log in" guest>
    <div class="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <section class="hidden md:block">
            <a href="{{ route('login') }}" class="mb-12 flex items-center gap-3 text-3xl font-bold"><span
                    class="brand-mark"><x-icon class="h-7 w-7" /></span>CropShield</a>
            <p class="mb-3 text-sm text-stone-500">Ja-ron Fish Farm · Solana, Cagayan</p>
            <h1 class="mb-4 text-4xl leading-tight font-bold">Crop screening<br>and monitoring.</h1>
            <p class="mb-8 max-w-md leading-8 text-stone-600">Check a possible disease or pest, then keep later
                observations in the same case.</p>
            <dl class="space-y-5 text-sm">
                <div class="border-t border-stone-200 pt-4">
                    <dt class="font-semibold">Workers</dt>
                    <dd class="mt-1 text-stone-600">Record and update their own or assigned cases.</dd>
                </div>
                <div class="border-t border-stone-200 pt-4">
                    <dt class="font-semibold">Owners</dt>
                    <dd class="mt-1 text-stone-600">Review farm cases and follow-up records.</dd>
                </div>
                <div class="border-t border-stone-200 pt-4">
                    <dt class="font-semibold">Administrators</dt>
                    <dd class="mt-1 text-stone-600">Manage reference content and user access.</dd>
                </div>
            </dl>
        </section>
        <section class="panel p-6 sm:p-8">
            <p class="mb-6 flex items-center gap-2 text-xl font-bold md:hidden"><x-icon
                    class="text-green-800" />CropShield</p>
            <h2 class="text-2xl font-bold">Log in to CropShield</h2>
            <p class="mt-3 mb-6 text-sm leading-7 text-stone-600">Use the email and password assigned to your account.
            </p>
            <form action="{{ route('login.store') }}" method="POST">
                @csrf
                <x-input-field label="Email" name="email" type="email" autocomplete="username" required
                    maxlength="191" />
                <x-input-field label="Password" name="password" type="password" autocomplete="current-password"
                    required />
                <x-button class="mt-2 w-full"><x-icon name="arrow" />Log in</x-button>
            </form>
            <p class="mt-6 text-center text-sm text-stone-600">New worker? <a href="{{ route('register') }}"
                    class="text-link">Create an account</a></p>
            @if ($demoAvailable)
                <details class="mt-7 border-t border-stone-200 pt-4 text-sm">
                    <summary class="cursor-pointer py-2 font-semibold">Local demo accounts</summary>
                    <p class="my-3 text-stone-500">For this computer only. Published practice credentials:</p>
                    @foreach (['Worker' => ['worker-1@demo.cropshield.local', 'WorkerDemo123!'], 'Owner' => ['owner@demo.cropshield.local', 'OwnerDemo123!'], 'Admin' => ['admin@demo.cropshield.local', 'AdminDemo123!']] as $role => [$email, $password])
                        <div class="border-t border-stone-100 py-3 break-words"><strong>{{ $role }}</strong>
                            <p class="mt-1">{{ $email }}</p><code>{{ $password }}</code>
                        </div>
                    @endforeach
                </details>
            @endif
        </section>
    </div>
</x-layout>
