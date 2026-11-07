# CropShield

Photo-first crop disease and pest screening, with dated monitoring records for Ja-ron Fish Farm, Solana, Cagayan. Built with Next.js, TypeScript, Tailwind CSS, Prisma, MySQL, Auth.js, and the server-side Gemini SDK.

## Group members

Add your capstone group members here before submission. Names were not supplied in the project request.

## Accounts and roles

Users log in with an email and password and log out from **Your account**. There is no passwordless role selector or automatic demo login. Public registration creates a worker; an authenticated administrator can create workers, owners, and administrators in **Administration → User access → Create user**.

| Role | Landing page | Prototype access |
|---|---|---|
| Worker | `/worker` | Create crop cases; view/update own or assigned cases; follow-up photos and history. |
| Owner | `/owner` | Review farm cases; assign workers; record follow-ups and case plans. |
| Administrator | `/admin` | Maintain disease/pest references and sources; create accounts and manage access. |

Every protected page rechecks the current database account and role. An anonymous request redirects to `/login`; a wrong-role page redirects to `/access-denied`. API requests independently return 401/403 or scoped records. Passwords use bcrypt hashes. Earlier role-switch sessions are rejected, and signing out removes the login session. Existing real-user passwords are preserved.

### Local demo logins

These published passwords belong only to the seeded local presentation accounts. They must not be reused for real accounts or public deployment. All four use normal email/password login, not role switching.

| Role | Email | Password |
|---|---|---|
| Worker | `worker-1@demo.cropshield.local` | `WorkerDemo123!` |
| Worker 2 | `worker-2@demo.cropshield.local` | `WorkerDemo123!` |
| Owner | `owner@demo.cropshield.local` | `OwnerDemo123!` |
| Admin | `admin@demo.cropshield.local` | `AdminDemo123!` |

Demo accounts and simulated screening are restricted to loopback development, or an explicitly enabled loopback presentation build. Public registration creates real worker accounts. Source-linked screening and monitoring work for signed-in farm users.

## Fresh setup

Prerequisites: Node.js/npm and a running MySQL server. Create an empty database for a fresh installation and configure its connection in `.env`; Prisma migrations create the tables. The existing project already points to `cropshield_db`.

```bash
npm install
cp .env.example .env
# Set DATABASE_URL, AUTH_SECRET, and GEMINI_API_KEY in .env.
# Generate a secret with: openssl rand -base64 32
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://127.0.0.1:3000/login. `.env.local`, if present, overrides corresponding `.env` settings for the application; use the same database for the application and Prisma CLI. Keep all credentials outside Git.

The migration history starts with `20261107000000_initial`. The existing database was checked against the schema and recorded as already baselined, without recreating its tables. Fresh setup was verified in a separate temporary empty database using migrations and seeding.

Seeding adds missing library entries and sample cases. It resets **only the four labeled demo accounts** to the documented roles and passwords; it does not overwrite existing farm cases, reference edits, or real-user passwords. Use a separate empty database when demonstrating a clean setup.

For an optimized local presentation:

```bash
npm run build
CROPSHIELD_LOCAL_DEMO=true npm start
```

Production disables the published demo accounts by default. Real accounts use their own passwords. The scripts bind to this computer at `127.0.0.1`.

## ITE 116 midterm alignment

The compatible requirements are implemented: email/password login and logout, worker registration, admin-managed account creation, three seeded roles, protected role pages, server validation, Prisma migrations, and a core crop-case workflow tied to its logged-in user.

**Framework conflict:** this project remains Next.js/TypeScript/Prisma/MySQL. It is not Laravel and does not use Blade, Laravel migrations/controllers, or `php artisan`. This version does not satisfy the assignment's Laravel framework requirement.

### Why this version uses Next.js

The earlier CropShield prototype brief explicitly requested Next.js, TypeScript, and Tailwind CSS, and the existing project already used that stack. Authentication was added to that application under the instruction to preserve CropShield and skip conflicting assignment requirements. Keeping Next.js preserved the screening, crop-case monitoring, private photographs, and MySQL integration.

Laravel can implement the same CropShield workflow. Moving to Laravel would require replacing the current routing, server endpoints, authentication integration, and Prisma data layer, as well as adapting the screens to the chosen Laravel frontend. It was a scope decision to retain the working prototype, not a claim that Next.js is better for the course. If Laravel is the group's required stack, the team must obtain instructor approval for this version or complete a Laravel implementation before claiming compliance.

Public repository: [yoshanbao/cropshield](https://github.com/yoshanbao/cropshield). Add the group member names before class submission.

## Public repository and private data

The repository contains application source, schema migrations, source-linked reference content, placeholder environment configuration, and clearly labeled synthetic demo records. It does not include the local MySQL database, real user records or password hashes, uploaded farm photographs, database backups, API keys, session secrets, local environment files, or private research documents. The schema migration creates tables; it is not a database export.

Copy `.env.example` to your local `.env` and supply your own credentials. The documented demo passwords are deliberately public, restricted to local presentations, and unrelated to private account passwords. Superseded local account-seeding scripts and local planning notes are excluded. The publication starts with a clean source commit rather than uploading local session/checkpoint history.

### Ten-minute demonstration

1. Introduce Ja-ron Fish Farm and the Worker, Owner, and Administrator roles.
2. Log in with each seeded role; show `/worker`, `/owner`, and `/admin` and log out between them.
3. While logged out, type `/owner`; show the login redirect. As a worker, type `/admin` or `/owner`; show the blocked-access page. Worker APIs also reject admin-only writes.
4. Register a worker or log in as the demo worker. Upload a photo, crop, location, date, and symptoms. Submit invalid input first, then save the observation. Screening remains preliminary; a service error retains the draft and permits saving for monitoring.
5. Log in as owner to review the case and add a follow-up. Compare the dated evidence and open Print summary.
6. Show `src/auth.ts` (credential checks), `src/lib/pageAccess.ts` (role pages), `src/lib/workspace.ts` (record permissions), `src/app/api/cases/route.ts` (core validation/save), and the Prisma migration and seeder.

## Main workflow

Farm navigation is **Check crop**, **My cases** (or **Farm cases** for owners), and **Crop guide**. Administration appears for administrators. Phone browsers use a fixed bottom navigation with safe-area spacing. The header uses a compact role button. It opens an account dialog (a bottom sheet on phones) containing the full account name, current role, and a text Sign out action. Users change accounts by logging out and logging in with the other credentials. Keyboard focus stays inside the dialog and returns after dismissal. Phone reminders and actions stack, narrow date filters use a single column, and guide filters have visible labels.

1. Take or choose a clear JPEG, PNG, or WebP photo, up to 5 MB.
2. Select one of the eight crops and describe visible symptoms. Enter the plant/area label and observation date; other observation fields are optional.
3. Select **Check for diseases & pests**. The server screens the actual uploaded image using Gemini and checks the result against enabled references for that crop.
4. Read the preliminary finding, visible evidence, limitations, management information, prevention steps, and source. Uncertain, normal, unclear, mismatched, or non-plant results receive no invented condition-specific advice.
5. Save the case, add dated follow-ups, compare the first/latest available images, and print the case summary.

Case status (open, monitoring, closed), reported change, and follow-up dates remain separate. Closure requires a reason, and reopening keeps the evidence. Follow-ups append to the original case; they cannot overwrite the initial result or its saved guidance snapshot.

The crop guide supports searching and filtering by crop and disease/pest category. Articles expand on demand to keep the screen concise. The design keeps green for primary actions, with warm neutral surfaces, charcoal text, blue information, and amber/red follow-up reminders. Important supporting text is at least 14px. The three-step form has a compact crop selector, explicit required fields, and persistent location help. My cases includes private photo thumbnails, reported changes, and a direct Add follow-up action; its filters expand on demand.

## MySQL persistence and private images

Core records no longer depend on browser localStorage. The new Prisma models are:

- `FarmCase`, `FarmObservation`, `FarmAssignment`, and `FarmStatusEvent`: case identity, ownership, dated evidence, assignments, and status history.
- `CropCondition`: enabled disease/pest entries, guidance, sources, content status, and versions.
- `FarmDraft`: one private draft per account, including successfully uploaded image references.
- `FarmImage`: private photograph bytes and MIME type in MySQL `MEDIUMBLOB` storage. Uploaded photos are resized to a maximum dimension of 960px before storage.
- `FarmScreening`: submission identity, request state, crop/input fingerprint, and the validated screening result.

Private image URLs require an authorized signed session; uploads are not exposed through `public/`. Account access, assignments, content mutations, and images are checked on the server. Source guidance is saved as a snapshot with each result. Version checks prevent silently overwriting a case changed in another window, and repeated completed submissions or follow-up IDs do not create duplicate observations.

Autosaved drafts and **Save draft** write to MySQL. An unchanged draft retrieves its completed screening result after navigation or reload without another Gemini request. The server checks account ownership, the image/crop/symptom fingerprint, mode, and demo scenario before returning it. Changes to image-analysis inputs clear the displayed result. Location and scheduling edits retain it. Service errors retain the form and uploaded image. Saving does not display success until the database confirms the write. Earlier browser-only prototype records are left in that browser's localStorage and are not automatically imported or deleted.

Legacy `Case`, `Disease`, and review tables were retained. Their original 7 cases and 53 disease entries were unchanged during this update. A private backup of legacy records is under the ignored `backups/` folder. No verification workflow is active in the current application.

## Disease and pest coverage

The new source-linked catalog contains **17 entries: 9 diseases and 8 pests**, covering mais, kalamansi, okra, talong, sili, kamote, suha, and rice. These are starter references, not an exhaustive diagnostic database or claims of disease occurrence at the farm.

| Crop | Disease references | Pest references |
|---|---|---|
| Rice | Leaf blast; bacterial leaf blight | Brown planthopper / hopper damage |
| Mais | Common rust | Fall armyworm |
| Kalamansi | Citrus canker | Citrus leafminer damage |
| Okra | Yellow vein mosaic symptoms | Whiteflies |
| Talong | Cercospora leaf spot | Shoot and fruit borer damage |
| Sili | Anthracnose | Thrips group |
| Kamote | Feathery mottle symptoms | Sweetpotato weevil |
| Suha | Citrus canker | Citrus leafminer damage |

`src/lib/catalog.ts` records each entry's evidence, guidance, source URL, version, and limits. Sources include PhilRice, CABI, government agriculture departments, university extension services, and the World Vegetable Center. Guidance is conservative and avoids pesticide dosages and overseas regulatory instructions. **Source checked** means source-to-text mapping was checked; it does not assert local agricultural expert verification or a confirmed diagnosis. Virus symptoms and tiny pest species require additional confirmation. Pest findings require visible insects or the specific supported damage pattern; generic holes or yellowing are insufficient.

Administrators can add or edit disease/pest entries and source links. Pending or revision-needed entries cannot be enabled. Changing library content does not change guidance already saved with a case.

## Live screening and samples

The default is live image screening. The Gemini key stays server-side. `GEMINI_MODEL` defaults to `gemini-3.1-flash-lite`, selected after the heavier model timed out in the configured project. A live public-image test returned a validated `UNCLEAR_IMAGE` result using that model. This verifies the integration, not disease-detection accuracy.

Requests use structured output, crop-scoped IDs, runtime validation, at most two automatic retries, and an enforced total deadline. SDK retry is disabled so the application controls the retry count. Completed identical screenings can be retrieved without another model call. Daily quota and input/permission errors do not trigger automatic retries. The provider can still be busy; users can retry or save for monitoring without fabricating a result.

The smaller **Try a sample** disclosure is available only in the local demo. It clearly labels simulated disease, pest, unclear-image, and temporary-error scenarios. The rice illustration is not field evidence and is never sent as a live photo. Live and demo screening caches are separated. The main checker always starts in live mode for a new draft.

## Verification

```bash
npm test
npm run lint
npm run build
```

Unit checks cover crop coverage, crop-condition isolation, no fabricated guidance, permission rules, source validation, closure/reopening, chronology, bounded retries, and a provider that never settles. End-to-end checks exercised actual MySQL writes and reads, independent browser sessions, private image access, worker assignments, follow-ups, immutable guidance versions, duplicate prevention, closure/reopening, admin edits, and desktop/phone layouts. Test-created records were removed afterward. These checks do not establish diagnostic accuracy or replace the capstone's field evaluation.
