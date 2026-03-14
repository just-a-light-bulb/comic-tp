# Comic Trans Studio — AI Agent Prompt (Short)

## WHAT YOU'RE BUILDING
A SvelteKit + Vercel app for translating manga/webtoon pages into Thai using AI. Users upload pages, an AI pipeline detects text bubbles, identifies speakers, and translates them. Translators review via a split-pane canvas editor.

---

## STACK
- **Framework**: SvelteKit (TypeScript) + Vercel serverless
- **Auth**: Kinde (Google OAuth + magic link)
- **Storage**: Uploadcare (signed uploads — store UUID only, never full URL)
- **DB**: PostgreSQL + **Drizzle ORM** + drizzle-kit
- **Canvas**: Fabric.js v5 (SSR-safe: import only inside `onMount`)
- **AI**: OpenRouter → `anthropic/claude-3.5-sonnet`
- **Jobs**: Vercel Cron every 30s
- **Export**: pdf-lib (PDF) + jszip (ZIP)

---

## DATABASE — KEY MODELS

**Install:** `npm i drizzle-orm postgres @paralleldrive/cuid2` + `npm i -D drizzle-kit`

```ts
// src/lib/server/db/schema.ts — key tables (copy full schema from full prompt)
// All enums → pgEnum (maps to native PG enum). Store fileIds as uuid(), not full URLs.
// Bounding boxes → 4 integer() columns, NOT json(). Confidence → integer() 0-100, NOT float.

// Enums
export const langEnum       = pgEnum('lang',        ['JA','ZH','KO','TH','EN','VI']);
export const pageStatusEnum = pgEnum('page_status', ['PENDING','PROCESSING','DETECTED','TRANSLATED','APPROVED','RENDERED']);
export const jobStatusEnum  = pgEnum('job_status',  ['QUEUED','RUNNING','DONE','ERROR']);
export const genderCodeEnum = pgEnum('gender_code', ['MALE','FEMALE','NEUTRAL','UNKNOWN']);
export const regionTypeEnum = pgEnum('region_type', ['DIALOGUE','THOUGHT','NARRATION','SFX','SIGNAGE']);

// Key tables (abbreviated — see full prompt for complete definitions)
textRegions: pageId(int), bubbleIndex(int), regionType(pgEnum), bboxX/Y/W/H(int×4),
             originalText(text), translatedText(text?), speakerName(varchar 80?),
             speakerGender(pgEnum), thaiParticle(varchar 10?), confidence(int 0-100),
             isApproved(bool), isManual(bool), fontSizeOverride(int?)

pages:       chapterId(int), pageNumber(int), srcFileId(uuid), cleanFileId(uuid?),
             renderedFileId(uuid?), status(pageStatusEnum)

translationJobs: pageId(int), status(jobStatusEnum), aiModel(varchar 60),
                 step(int 0-3), errorMessage(varchar 500?)

// Critical indexes: pages.status, textRegions.pageId, translationJobs(status,createdAt)
```

```ts
// src/lib/server/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
export const db = drizzle(postgres(process.env.DATABASE_URL!), { schema });
```

```ts
// drizzle.config.ts
export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
// npx drizzle-kit generate   →   npx drizzle-kit migrate
```

---

## API ENVELOPE (all endpoints)
```ts
{ ok: boolean; data?: any; error?: string }
// Auth: validate Kinde JWT in hooks.server.ts — no per-route repetition
// Cron: validate CRON_SECRET header — return 401 if missing
```

---

## AI PIPELINE (cron — 1 job per run, max 10s)

```
/api/cron/run-jobs:
  1. SELECT oldest QUEUED job LIMIT 1
  2. SET job status = RUNNING
  3. POST /api/ai/vision     → bbox + OCR text per region  (save TextRegion rows)
  4. POST /api/ai/characters → speaker name + gender + Thai particle per region
  5. POST /api/ai/translate  → Thai text + confidence (0-100 Int) per region
  6. SET job status = DONE, page status = TRANSLATED
  ON ERROR: SET job status = ERROR, reset page to PENDING
```

Client polls `GET /api/jobs/[id]` every 3s. Show live progress bar in editor.

---

## CANVAS EDITOR — CRITICAL RULES

```ts
// 1. HiDPI: set canvas buffer = displaySize × devicePixelRatio
const dpr = window.devicePixelRatio || 1;
canvasEl.width = containerW * dpr; canvasEl.style.width = containerW + 'px';

// 2. Image: load from Uploadcare with crossOrigin:'anonymous'
//    baseZoom = Math.min(containerW/imgW, containerH/imgH)
//    Set as background (selectable:false, evented:false)

// 3. Overlays: draw at ORIGINAL image coords — Fabric handles zoom scaling
//    Each region = Group([Rect, Text]) with data:{regionId}
//    strokeWidth: 2 / currentZoom  ← rescale on every zoom change
//    Colors: approved=#22c55e, pending=#f59e0b, low(<60)=#c0392b

// 4. Sync: ONE writable store (activeRegionId) — canvas and spreadsheet
//    never communicate directly. Use suppressCanvasSync flag to prevent loops.

// 5. Zoom: fc.zoomToPoint(cursor, zoom) on mouse:wheel. Range 0.1–5.
//    Pan: middle-mouse OR spacebar+drag → fc.relativePan({x,y})

// 6. Undo: command pattern { execute(), undo() } — wrap every mutation
```

---

## DESIGN SYSTEM (manga "Ink on Paper" theme)
ref: design_docs

---

## BUILD ORDER

1. DB schema (`schema.ts`) + `drizzle-kit generate && migrate` → 2. Auth middleware → 3. Projects/Chapters CRUD →
4. Page upload (Uploadcare signed flow) → 5. Cron + AI routes →
6. CanvasEditor.svelte (HiDPI, overlays, zoom, sync store) →
7. TranslationTable.svelte → 8. Region PATCH/approve/manual →
9. Render + Export → 10. UI pages with design system

---

## NON-NEGOTIABLE RULES

| Rule | Why |
|---|---|
| Import Fabric only in `onMount` | SSR crash |
| Store Uploadcare `fileId` (UUID), not full URL | Storage efficiency |
| Validate `CRON_SECRET` on cron route | Security |
| Bboxes = 4 Int columns, never JSON | 52 bytes saved per region |
| Confidence = Int 0–100, never Float | 6 bytes saved per region |
| `activeRegionId` store = only canvas↔spreadsheet channel | Prevents infinite loops |
| `strokeWidth: 2 / currentZoom` | Keeps overlays crisp at all zoom levels |
| No `border-radius` on panels/buttons | Design system intentional |
| Load `Noto Serif Thai` explicitly | Thai text rendering |
