<?php

return [
    'crops' => ['Rice' => 'Rice', 'Corn' => 'Mais (corn)', 'Calamansi' => 'Kalamansi', 'Okra' => 'Okra', 'Eggplant' => 'Talong (eggplant)', 'Chili' => 'Sili (chili)', 'Sweet Potato' => 'Kamote (sweet potato)', 'Pomelo' => 'Suha (pomelo)'],
    'local_demo' => env('CROPSHIELD_LOCAL_DEMO', false),
    'gemini_key' => env('GEMINI_API_KEY'),
    'gemini_model' => env('GEMINI_MODEL', 'gemini-3.1-flash-lite'),
];
