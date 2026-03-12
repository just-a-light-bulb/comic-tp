# Comic Trans Studio — AI Agent Build Prompt (Full)

## ROLE & GOAL
You are a senior full-stack engineer building **Comic Trans Studio**: a SvelteKit + Vercel serverless app that lets users upload manga/webtoon pages and receive AI-generated Thai translations with a canvas-based review editor.

Deliver production-ready code. Every file must be runnable without modification. Follow the exact architecture below — do not substitute libraries or patterns without flagging the change.

---

## TECH STACK (non-negotiable)

| Layer | Technology |
|---|---|
| Framework | SvelteKit (TypeScript) |
| Hosting | Vercel (serverless functions + Edge Config) |
| Auth | Kinde (OAuth2 — Google + magic link) |
| File storage | Uploadcare (signed uploads, CDN delivery) |
| Database | PostgreSQL via **Prisma ORM** |
| AI routing | OpenRouter (Claude 3.5 Sonnet as default model) |
| Canvas editor | **Fabric.js v5** (do NOT use raw Canvas API) |
| PDF export | pdf-lib |
| Job scheduling | Vercel Cron (30-second interval) |

---

## PROJECT STRUCTURE

```
src/
  routes/
    +page.svelte                          # Landing page
    (auth)/
      login/+page.svelte
      callback/+server.ts                 # Kinde OAuth redirect handler
      logout/+server.ts
    (app)/                                # Auth-gated routes
      projects/
        +page.svelte                      # Project list grid
        new/+page.svelte
        [pid]/
          +page.svelte                    # Project detail
          edit/+page.svelte
          chapters/
            new/+page.svelte
            [cid]/
              +page.svelte               # Chapter dashboard
              edit/+page.svelte
      editor/
        [pageId]/
          +page.svelte                   # MAIN EDITOR (canvas + spreadsheet)
          preview/+page.svelte
      settings/
        +page.svelte
        plan/+page.svelte
    api/
      pages/
        +server.ts                       # POST (create), routes below per ID
        [id]/+server.ts                  # GET, DELETE
      jobs/
        process/+server.ts               # POST — queue single page job
        process-batch/+server.ts         # POST — queue chapter batch
        [id]/+server.ts                  # GET — poll status
      cron/
        run-jobs/+server.ts              # GET — Vercel Cron engine
      ai/
        vision/+server.ts                # POST — Step 1: OCR + bbox
        characters/+server.ts            # POST — Step 2: speaker ID
        translate/+server.ts             # POST — Step 3: translation
      regions/
        [id]/+server.ts                  # PATCH, DELETE
        bulk-approve/+server.ts          # POST
        manual/+server.ts               # POST
      render/
        page/+server.ts                  # POST — compose final image
        chapter/+server.ts               # POST — render all pages
      export/
        zip/+server.ts                   # POST — ZIP download
        pdf/+server.ts                   # POST — PDF download
      projects/
        +server.ts                       # GET list, POST create
        [id]/+server.ts                  # PATCH, DELETE
      chapters/
        +server.ts                       # POST create
        [id]/+server.ts                  # PATCH, DELETE
      storage/
        sign/+server.ts                  # POST — Uploadcare signed URL
        [fileId]/+server.ts              # DELETE
  lib/
    components/
      editor/
        CanvasEditor.svelte              # Fabric.js canvas panel
        TranslationTable.svelte          # Spreadsheet panel
        Toolbar.svelte
    stores/
      editor.ts                         # activeRegionId writable store
    server/
      db.ts                             # Prisma client singleton
      kinde.ts                          # Kinde server helpers
      uploadcare.ts                     # Uploadcare REST helpers
      openrouter.ts                     # OpenRouter fetch wrapper
  app.html
prisma/
  schema.prisma
vercel.json
```

---

## DATABASE SCHEMA (Prisma — copy exactly)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Lang { JA ZH KO TH EN VI }
enum PageStatus { PENDING PROCESSING DETECTED TRANSLATED APPROVED RENDERED }
enum JobStatus { QUEUED RUNNING DONE ERROR }
enum GenderCode { MALE FEMALE NEUTRAL UNKNOWN }
enum RegionType { DIALOGUE THOUGHT NARRATION SFX SIGNAGE }
enum TranslationStyle { NATURAL LITERAL FORMAL CASUAL }

model User {
  id        String    @id @default(cuid())
  kindeId   String    @unique
  email     String    @unique
  isPro     Boolean   @default(false)
  apiKey    String?   @db.VarChar(200)
  createdAt DateTime  @default(now())
  projects  Project[]
}

model Project {
  id         String               @id @default(cuid())
  userId     String
  user       User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  title      String               @db.VarChar(120)
  srcLang    Lang
  tgtLang    Lang
  style      TranslationStyle     @default(NATURAL)
  createdAt  DateTime             @default(now())
  chapters   Chapter[]
  characters ProjectCharacter[]
  memory     TranslationMemory[]
  @@index([userId])
}

model ProjectCharacter {
  id        Int        @id @default(autoincrement())
  projectId String
  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name      String     @db.VarChar(80)
  gender    GenderCode @default(UNKNOWN)
  particle  String?    @db.VarChar(10)
  notes     String?    @db.VarChar(300)
  @@unique([projectId, name])
  @@index([projectId])
}

model Chapter {
  id        Int        @id @default(autoincrement())
  projectId String
  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  number    Int
  title     String     @db.VarChar(120)
  status    PageStatus @default(PENDING)
  createdAt DateTime   @default(now())
  pages     Page[]
  @@unique([projectId, number])
  @@index([projectId])
}

model Page {
  id             Int        @id @default(autoincrement())
  chapterId      Int
  chapter        Chapter    @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  pageNumber     Int
  srcFileId      String     @db.Uuid
  cleanFileId    String?    @db.Uuid
  renderedFileId String?    @db.Uuid
  status         PageStatus @default(PENDING)
  createdAt      DateTime   @default(now())
  regions        TextRegion[]
  jobs           TranslationJob[]
  @@unique([chapterId, pageNumber])
  @@index([chapterId])
  @@index([status])
}

model TextRegion {
  id             Int        @id @default(autoincrement())
  pageId         Int
  page           Page       @relation(fields: [pageId], references: [id], onDelete: Cascade)
  bubbleIndex    Int
  regionType     RegionType @default(DIALOGUE)
  bboxX          Int
  bboxY          Int
  bboxW          Int
  bboxH          Int
  originalText   String     @db.Text
  translatedText String?    @db.Text
  speakerName    String?    @db.VarChar(80)
  speakerGender  GenderCode @default(UNKNOWN)
  thaiParticle   String?    @db.VarChar(10)
  confidence     Int        @default(0)
  isApproved     Boolean    @default(false)
  isManual       Boolean    @default(false)
  fontSizeOverride Int?
  memoryId       Int?
  memory         TranslationMemory? @relation(fields: [memoryId], references: [id])
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  @@index([pageId])
  @@index([pageId, isApproved])
}

model TranslationMemory {
  id          Int      @id @default(autoincrement())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sourceText  String   @db.Text
  sourceHash  String   @db.VarChar(64)
  targetText  String   @db.Text
  useCount    Int      @default(1)
  createdAt   DateTime @default(now())
  regions     TextRegion[]
  @@unique([projectId, sourceHash])
  @@index([projectId])
}

model TranslationJob {
  id           Int       @id @default(autoincrement())
  pageId       Int
  page         Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)
  status       JobStatus @default(QUEUED)
  aiModel      String    @db.VarChar(60)
  step         Int       @default(0)
  errorMessage String?   @db.VarChar(500)
  startedAt    DateTime?
  completedAt  DateTime?
  createdAt    DateTime  @default(now())
  @@index([status, createdAt])
}
```

---

## API RESPONSE ENVELOPE

Every `/api/*` endpoint must return:
```ts
{ ok: boolean; data?: any; error?: string }
```
On success: `{ ok: true, data: ... }`. On error: `{ ok: false, error: "message" }` with appropriate HTTP status.

---

## AUTHENTICATION MIDDLEWARE

In `src/hooks.server.ts`:
- For routes under `/api/`, validate the Kinde JWT from `Authorization: Bearer <token>` header. Return 401 JSON `{ ok: false, error: "Unauthorized" }` if missing or invalid.
- For routes under `/(app)/`, redirect unauthenticated users to `/login`.
- No individual route should repeat auth logic.

---

## CRON JOB ENGINE — CRITICAL PATH

`/api/cron/run-jobs` is the AI pipeline engine. Build it exactly as follows:

```
vercel.json cron: { "path": "/api/cron/run-jobs", "schedule": "*/30 * * * *" }

Security: validate X-Vercel-Cron-Signature header (or CRON_SECRET env var). Return 401 if missing.

Pipeline per job:
1. SELECT oldest TranslationJob WHERE status = QUEUED LIMIT 1
2. UPDATE job SET status = RUNNING, startedAt = now()
3. POST /api/ai/vision    → save TextRegion rows (status=DETECTED on page)
4. POST /api/ai/characters → update TextRegion rows (speakerName, speakerGender, thaiParticle)
5. POST /api/ai/translate  → update TextRegion rows (translatedText, confidence)
6. UPDATE job SET status = DONE, completedAt = now(), step = 3
   UPDATE page SET status = TRANSLATED

ON ANY ERROR:
  UPDATE job SET status = ERROR, errorMessage = err.message
  UPDATE page SET status = PENDING (so it can be retried)
```

Client polls `GET /api/jobs/[id]` every 3 seconds to detect completion. The editor must show a live progress bar during polling.

---

## CANVAS EDITOR — IMPLEMENTATION RULES

### Setup (SSR guard required)
```ts
// Import Fabric only in onMount — it crashes during SSR
let fc: fabric.Canvas;
onMount(async () => {
  const { Canvas } = await import('fabric');
  initCanvas(Canvas);
});
```

### HiDPI / Retina (most common bug — do this correctly)
```ts
const dpr = window.devicePixelRatio || 1;
canvasEl.width  = containerW * dpr;
canvasEl.height = containerH * dpr;
canvasEl.style.width  = containerW + 'px';
canvasEl.style.height = containerH + 'px';
fc.setDimensions({ width: containerW, height: containerH });
```

### Image loading
- Load from Uploadcare CDN with `{ crossOrigin: 'anonymous' }`.
- Calculate `baseZoom = Math.min(containerW / imgW, containerH / imgH)`.
- Set image as `fc.setBackgroundImage(img, ...)` — not as a canvas object.
- Image must be `selectable: false, evented: false`.

### Region overlays
- Draw at **original image coordinates** — do NOT pre-multiply by zoom. Fabric handles zoom.
- Each region = `fabric.Group([rect, label])` with `data: { regionId }`.
- Stroke colour encoding: approved → `#22c55e`, pending → `#f59e0b`, low confidence (<60) → `#c0392b`.
- `strokeWidth: 2 / currentZoom` — rescale on every zoom change.
- Store all groups in `Map<string, fabric.Group>` keyed by regionId.

### Bidirectional sync (canvas ↔ spreadsheet)
- Use a single Svelte `writable` store: `activeRegionId`.
- Canvas `selection:created` → writes to store.
- Spreadsheet row click → writes to store.
- Store subscriber → calls `fc.setActiveObject(group)` + pans viewport to centre selected region.
- Use a `suppressCanvasSync` boolean flag to prevent infinite loops.

### Zoom & Pan
- Zoom: `fc.on('mouse:wheel')` → `fc.zoomToPoint(cursor, newZoom)`. Range: 0.1–5.
- Pan: middle-mouse-button drag OR spacebar + drag → `fc.relativePan({x, y})`.
- After zoom: call `updateOverlayLineWidths()` to rescale all stroke widths.

### Manual region drawing
- Toggle with toolbar button → set `fc.selection = false`, cursor = `crosshair`.
- `mouse:down` → record start coords via `fc.getPointer(e)`.
- `mouse:move` → update preview `fabric.Rect`.
- `mouse:up` → if `w > 10 && h > 10`, POST to `/api/regions/manual`, then call `renderRegion(region)`.

### Undo/Redo
- Command pattern: `{ execute(): Promise<void>; undo(): Promise<void>; description: string }`.
- Two stacks: `undoStack[]` and `redoStack[]`.
- `Ctrl+Z` → pop undoStack, call `undo()`, push to redoStack.
- `Ctrl+Shift+Z` / `Ctrl+Y` → pop redoStack, call `execute()`, push to undoStack.
- Wrap every mutation (region created, text edited, bbox moved) in a Command.

### Preview mode
- Hide all overlay groups: `group.set('visible', false)`.
- POST `/api/render/page` → load returned `renderedUrl` as a Fabric Image on top.
- Toggle back: remove preview image, restore overlay visibility.

---

## DESIGN SYSTEM (apply consistently across all pages)

### Colour tokens (CSS custom properties)
```css
--ink-black:   #1A1A2E;   /* primary text, borders */
--panel-red:   #C0392B;   /* CTA buttons, active states, errors */
--cream-paper: #FDF6E3;   /* app background */
--screen-blue: #4A90D9;   /* links, AI-suggested content, info */
--gold-tone:   #D4A853;   /* highlights, premium features */
--manga-navy:  #2C2C54;   /* sidebar, table headers, modal overlays */
--panel-light: #FFF8F0;   /* card surfaces, alternating rows */
--tone-gray:   #C8B8A2;   /* disabled states, placeholders */
--ink-muted:   #8B8680;   /* secondary text, timestamps */
--border-line: #E8E0D5;   /* borders, dividers */
```

### Typography
```
Display/H1:  Shippori Mincho B1 (Google Fonts) — project titles, chapter numbers
H2–H3:       Cormorant Garamond Bold
Body/Labels: Noto Serif + Noto Serif Thai (load both explicitly)
UI/Mono:     DM Mono — badges, scores, keyboard hints, code
```
Load via Google Fonts CDN with `display=swap`. Add `preconnect` tags in `app.html`.

### Key component rules
- **panel-frame**: `border: 2px solid var(--border-line)`, `box-shadow: 2px 4px 0 rgba(26,26,46,0.08)`, `border-radius: 0` (no rounded corners on primary panels — intentional).
- **btn-primary**: black background, white text, `box-shadow: 3px 3px 0 var(--panel-red)`, no border-radius. On hover: `box-shadow: 1px 1px 0 var(--panel-red)` + `transform: translate(2px, 2px)`.
- **bubble-badge**: pill shape (`border-radius: 50vh`), CSS `::after` triangle tail. Blue = high confidence (>85%), Gold = medium (60–85%), Red = low (<60%).
- **halftone background**: `body { background-image: radial-gradient(circle, var(--tone-gray) 1px, transparent 1px); background-size: 12px 12px; }` at ~4% opacity.
- **speed-line divider**: `repeating-linear-gradient(-60deg, ...)` between major sections.

---

## AI PIPELINE — OPENROUTER PROMPT TEMPLATES

### Step 1: Vision Agent (`/api/ai/vision`)
```
System: You are a manga OCR specialist. Analyse the image and return JSON only.
User: Find all text regions. Return: { regions: [{ x, y, w, h, text, type }] }
      type = one of: DIALOGUE | THOUGHT | NARRATION | SFX | SIGNAGE
```

### Step 2: Character ID Agent (`/api/ai/characters`)
```
System: You are a manga character analysis specialist. Return JSON only.
User: Given the image and regions, identify the speaker for each region.
      Return: { speakers: [{ regionIndex, speakerName, genderCode, thaiParticle }] }
      genderCode = MALE | FEMALE | NEUTRAL | UNKNOWN
      thaiParticle = "ครับ" | "ค่ะ" | "นะ" | "" based on gender and register
```

### Step 3: Translation Agent (`/api/ai/translate`)
```
System: You are a Thai manga translator. Preserve speech patterns. Return JSON only.
User: Translate each region. Respect the glossary and speaker gender.
      Glossary: {glossary}
      Regions: {regions with speakerName, thaiParticle}
      Return: { translations: [{ regionId, translatedText, confidence }] }
      confidence = 0-100 integer
```

Always use `anthropic/claude-3.5-sonnet` via OpenRouter unless `modelOverride` is set.

---

## STORAGE PATTERN

Uploadcare file IDs (UUID) are stored in the DB — never full URLs. Reconstruct URLs at the application layer:
```ts
const UPLOADCARE_BASE = 'https://ucarecdn.com';
export function fileUrl(fileId: string) {
  return `${UPLOADCARE_BASE}/${fileId}/`;
}
```

Signed uploads: always generate the signed URL server-side (`/api/storage/sign`) before returning it to the client. Never expose the Uploadcare secret key to the browser.

---

## ENVIRONMENT VARIABLES

```env
DATABASE_URL=
KINDE_CLIENT_ID=
KINDE_CLIENT_SECRET=
KINDE_ISSUER_URL=
KINDE_REDIRECT_URI=
UPLOADCARE_PUBLIC_KEY=
UPLOADCARE_SECRET_KEY=
OPENROUTER_API_KEY=
CRON_SECRET=
```

---

## EXPORT PIPELINE

### ZIP export (`/api/export/zip`)
1. Fetch all Page rows for chapter WHERE `renderedFileId IS NOT NULL`.
2. Download each rendered PNG from Uploadcare CDN.
3. Use `jszip` to bundle as `chapter-{id}/page-{n:03d}.png`.
4. Upload the ZIP to Uploadcare. Return the signed CDN URL.

### PDF export (`/api/export/pdf`)
1. Same fetch as above.
2. Use `pdf-lib` to create a PDF. Each page = one full-size image page.
3. Page dimensions = original image dimensions.
4. Upload to Uploadcare. Return CDN URL.

---

## PERFORMANCE CONSTRAINTS

- Cron job: process **one** job per invocation (prevent Vercel timeout). Max execution time must stay under 10 seconds.
- Canvas: call `fc.requestRenderAll()` (batched) — never `fc.renderAll()` in a loop.
- DB: all reads in the editor hot path must use the indexed columns. Never use `findMany` without a `where` clause on an indexed field.
- Font loading: preconnect + `display=swap` — no layout shift.

---

## WHAT TO BUILD FIRST (recommended order)

1. `prisma/schema.prisma` + migration
2. `src/hooks.server.ts` (auth middleware)
3. `/api/projects` and `/api/chapters` (CRUD)
4. `/api/pages` + Uploadcare signed upload flow
5. `/api/cron/run-jobs` + all three AI sub-routes
6. `CanvasEditor.svelte` (Fabric.js, HiDPI, overlays, zoom/pan)
7. `TranslationTable.svelte` + bidirectional sync store
8. `/api/regions` (PATCH, bulk-approve, manual)
9. `/api/render/page` + `/api/export/*`
10. UI pages (landing, projects, chapters, settings) with design system applied

---

## CRITICAL RULES — DO NOT VIOLATE

1. Import Fabric.js only inside `onMount` — SSR will crash otherwise.
2. Never store full Uploadcare URLs in the DB — only the UUID `fileId`.
3. The cron endpoint MUST validate `CRON_SECRET`. Reject all other callers.
4. Every API route returns the standard `{ ok, data?, error? }` envelope.
5. Bounding boxes are stored as 4 separate `Int` columns — never as JSON.
6. All enum values must match the Prisma enum definitions exactly.
7. Do not round corners on `.panel-frame` or `.btn-primary` — `border-radius: 0`.
8. Load `Noto Serif Thai` explicitly alongside `Noto Serif` — Thai text will break without it.
9. `strokeWidth` on canvas overlays must scale with zoom: `2 / currentZoom`.
10. The `activeRegionId` Svelte store is the only communication channel between canvas and spreadsheet — never let them communicate directly.
