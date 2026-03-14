# Comic Trans Studio
## Addendum — Design & Technical Deep Dive
### Routes · UI System · Canvas Editor · Database Schema

| **§ A** Route & API Design | **§ B** Manga UI Design System | **§ C** Canvas Editor Deep Dive | **§ D** Optimised DB Schema |
|---|---|---|---|

---

## § A Route & API Design

SvelteKit page routes + serverless API endpoints — complete path inventory

---

### A.1 SvelteKit Page Routes

Every URL a user can navigate to is listed below. SvelteKit uses file-based routing inside `src/routes/`. Routes inside `(app)/` are protected by a Kinde auth hook that redirects unauthenticated visitors to `/login`. Routes inside `(auth)/` are public and handle the OAuth flow. The route groups in parentheses are layout-only directories — they do not appear in the URL.

| **Route Path** | **File Location** | **Description** | **Auth** |
|---|---|---|---|
| **/** | src/routes/+page.svelte | Landing page: hero, feature list, demo GIF, Sign Up CTA | Public |
| **/login** | src/routes/(auth)/login/+page.svelte | Kinde sign-in widget (Google OAuth + magic link) | Public |
| **/auth/callback** | src/routes/(auth)/callback/+server.ts | Kinde OAuth redirect handler — sets session cookie, redirects to /projects | Public |
| **/logout** | src/routes/(auth)/logout/+server.ts | Invalidates session, redirects to / | Public |
| **/projects** | src/routes/(app)/projects/+page.svelte | Project list grid. Each card shows title, source→target lang, chapter count, last updated | Required |
| **/projects/new** | src/routes/(app)/projects/new/+page.svelte | Create project: title, source language, target language, style preset, character glossary upload (CSV/JSON) | Required |
| **/projects/[pid]** | src/routes/(app)/projects/[pid]/+page.svelte | Project home: chapter cards with status, progress bar, quick-translate button | Required |
| **/projects/[pid]/edit** | src/routes/(app)/projects/[pid]/edit/+page.svelte | Edit project metadata and character glossary | Required |
| **/projects/[pid]/chapters/new** | src/routes/(app)/projects/[pid]/chapters/new/+page.svelte | Create chapter: number, title, bulk image upload via Uploadcare widget | Required |
| **/projects/[pid]/chapters/[cid]** | src/routes/(app)/projects/[pid]/chapters/[cid]/+page.svelte | Chapter dashboard: page thumbnail grid, per-page status badges, batch-process all button | Required |
| **/projects/[pid]/chapters/[cid]/edit** | src/routes/(app)/projects/[pid]/chapters/[cid]/edit/+page.svelte | Edit chapter title, reorder pages, delete pages | Required |
| **/editor/[pageId]** | src/routes/(app)/editor/[pageId]/+page.svelte | Unified editor: canvas panel (left) + translation spreadsheet (right). Core app surface. | Required |
| **/editor/[pageId]/preview** | src/routes/(app)/editor/[pageId]/preview/+page.svelte | Full-screen preview of rendered final page (cleaned image + translated text overlaid) | Required |
| **/settings** | src/routes/(app)/settings/+page.svelte | User profile, OpenRouter API key, default translation style, notification preferences | Required |
| **/settings/plan** | src/routes/(app)/settings/plan/+page.svelte | Storage usage meter, plan comparison, upgrade button | Required |
| **/404** | src/routes/+error.svelte | Custom 404 / error page styled as a manga panel with a confused character illustration | Public |

---

### A.2 API Route Design

All API routes are SvelteKit server endpoints living in `src/routes/api/`. They are deployed as Vercel serverless functions. Each endpoint follows a consistent convention: POST for create/trigger actions, GET for reads, PATCH for partial updates, DELETE for removals. All endpoints return JSON with a consistent envelope: `{ ok: boolean, data?: any, error?: string }`.

**Authentication Middleware**

A `hooks.server.ts` guard runs before every request. For routes under `/api/`, it validates the Kinde session JWT from the `Authorization` header (Bearer token). If invalid or missing, it returns 401. This single check means no individual API route needs to repeat auth logic.

| **Endpoint** | **Method + Purpose** | **Key Request / Response** |
|---|---|---|
| **POST /api/pages** | Create page record after Uploadcare upload completes. Called by the chapter creation form's onUpload callback. | body: `{ chapterId, uploadcareUrl, pageNumber }` → `{ page: Page }` |
| **GET /api/pages/[id]** | Fetch a single page with all its TextRegions and job status. Used by the editor on mount. | → `{ page, regions: TextRegion[], job: TranslationJob \| null }` |
| **DELETE /api/pages/[id]** | Delete a page and all its TextRegions. Triggers Uploadcare file deletion via their REST API. | → `{ ok: true }` |
| **POST /api/jobs/process** | Queue a full translation job for one page. Writes TranslationJob row with status='queued'. Returns immediately; work happens async. | body: `{ pageId, modelOverride? }` → `{ jobId }` |
| **POST /api/jobs/process-batch** | Queue translation jobs for all pages in a chapter that haven't been processed yet. | body: `{ chapterId }` → `{ queued: number }` |
| **GET /api/jobs/[id]** | Poll job status. Used by the progress indicator on the chapter dashboard. | → `{ job: TranslationJob }` |
| **GET /api/cron/run-jobs** | Called by Vercel Cron every 30 seconds. Picks the oldest queued job, runs the 3-step AI pipeline, saves results, marks job done. | Vercel Cron secret in header. Returns `{ processed: jobId \| null }` |
| **POST /api/ai/vision** | Run Step 1 Vision Agent on a page image URL. Returns raw bounding boxes + OCR text. Internal — called only by /api/cron/run-jobs. | body: `{ pageId, imageUrl }` → `{ regions: RawRegion[] }` |
| **POST /api/ai/characters** | Run Step 2 Character ID Agent. Takes page image + region list. Returns speaker metadata per region. | body: `{ pageId, imageUrl, regions }` → `{ speakers: SpeakerMeta[] }` |
| **POST /api/ai/translate** | Run Step 3 Translation Agent. Takes regions + speaker meta + project glossary. Returns translated text per region. | body: `{ pageId, regions, speakers, glossary, memory }` → `{ translations: Translation[] }` |
| **PATCH /api/regions/[id]** | Update a single TextRegion. Used by the editor spreadsheet when a translator edits a cell. | body: `Partial<TextRegion>` (translatedText, isApproved, speakerGender, fontSizeOverride) → `{ region }` |
| **POST /api/regions/bulk-approve** | Approve all regions for a page that meet a minimum confidence threshold. | body: `{ pageId, minConfidence: 0-100 }` → `{ approved: number }` |
| **POST /api/regions/manual** | Create a manually drawn text region (no AI detection). Optionally trigger single-bubble translation. | body: `{ pageId, bbox, originalText, translate?: boolean }` → `{ region }` |
| **DELETE /api/regions/[id]** | Delete a single TextRegion (e.g. a falsely detected region). | → `{ ok: true }` |
| **POST /api/render/page** | Compose final image for one page: inpaint original text → overlay translated text. Stores result as Page.renderedImageUrl. | body: `{ pageId }` → `{ renderedUrl }` |
| **POST /api/render/chapter** | Trigger render for all approved pages in a chapter in sequence. | body: `{ chapterId }` → `{ rendered: number }` |
| **POST /api/export/zip** | Generate ZIP archive of all rendered page PNGs for a chapter. Returns a signed Uploadcare CDN URL. | body: `{ chapterId }` → `{ downloadUrl }` |
| **POST /api/export/pdf** | Combine all rendered pages into a single PDF using pdf-lib. Returns CDN URL. | body: `{ chapterId }` → `{ downloadUrl }` |
| **GET /api/projects** | List all projects for authenticated user. | → `{ projects: Project[] }` |
| **POST /api/projects** | Create project. | body: `{ title, srcLang, tgtLang, glossary? }` → `{ project }` |
| **PATCH /api/projects/[id]** | Update project metadata. | → `{ project }` |
| **DELETE /api/projects/[id]** | Delete project and cascade all chapters/pages/regions. | → `{ ok: true }` |
| **POST /api/chapters** | Create chapter. | body: `{ projectId, title, number }` → `{ chapter }` |
| **PATCH /api/chapters/[id]** | Update chapter title or status. | → `{ chapter }` |
| **DELETE /api/chapters/[id]** | Delete chapter and cascade. | → `{ ok: true }` |
| **POST /api/storage/sign** | Generate Uploadcare signed upload URL. Called client-side before uploading so the secret API key stays server-only. | body: `{ fileName, mimeType }` → `{ uploadUrl, fileId }` |
| **DELETE /api/storage/[fileId]** | Delete a file from Uploadcare. Called when pages are deleted. | → `{ ok: true }` |

---

### A.3 Cron Job Flow (Detailed)

The most critical API route is `/api/cron/run-jobs` because it is the engine that drives the entire AI pipeline. The cron job is configured in `vercel.json` and fires every 30 seconds. It is protected by a shared secret header (`CRON_SECRET` env var) so only Vercel's scheduler can call it — any external call returns 401.

```json
// vercel.json
{
  "crons": [{ "path": "/api/cron/run-jobs", "schedule": "*/30 * * * *" }]
}
```

```
// /api/cron/run-jobs logic (pseudocode)
1. SELECT oldest TranslationJob WHERE status = 'queued' LIMIT 1  (concurrency safety)
2. UPDATE job SET status = 'running', startedAt = now()
3. CALL /api/ai/vision      → save TextRegion rows (status='detected')
4. CALL /api/ai/characters  → update TextRegion rows (speakerName, genderCode, thaiParticle)
5. CALL /api/ai/translate   → update TextRegion rows (translatedText, confidence)
6. UPDATE job SET status = 'done', completedAt = now()

ON ERROR: UPDATE job SET status = 'error', errorMessage = err.message
→ client polls GET /api/jobs/[id] every 3s to detect completion
```

---

## § B Manga UI Design System

Visual language, colour palette, typography, components — inspired by ink, paper & panels

---

ref: design_docs

## § C Canvas Editor — Step-by-Step Implementation

---

### C.1 Architecture Decision: Fabric.js vs Raw Canvas API

| **Fabric.js** | **Raw Canvas 2D API** |
|---|---|
| Free object model — every shape and text box is a JS object. Selection, drag, resize handles work out of the box. | You manage all objects, hit-testing, and redraw yourself. |
| Built-in events: `object:selected`, `object:modified`, `object:moving`. | Must implement hit-testing manually on every mousedown. |
| 50 KB gzipped. Requires manual HiDPI pixel ratio handling. | Zero bundle cost. HiDPI handled once with `canvas.width = naturalWidth * devicePixelRatio`. |
| **RECOMMENDATION: Use Fabric.js for MVP.** Switch to raw Canvas only if > 500 objects/page (unrealistic for manga). | Better for a generalized raster editor; overkill for manga bubble overlays. |

### C.2 Step 1 — Project Setup

```bash
npm install fabric
npm install --save-dev @types/fabric
```

```ts
// SSR guard — Fabric uses browser-only APIs
import { onMount } from 'svelte';
let fabricModule: typeof import('fabric') | null = null;
onMount(async () => {
  fabricModule = await import('fabric');
  initCanvas();
});
```

### C.3 Step 2 — Canvas Initialisation & HiDPI Handling

```ts
function initCanvas() {
  const { Canvas } = fabricModule!;
  const dpr = window.devicePixelRatio || 1;
  const container = canvasEl.parentElement!;
  const displayW = container.clientWidth;
  const displayH = container.clientHeight;

  canvasEl.width  = displayW * dpr;
  canvasEl.height = displayH * dpr;
  canvasEl.style.width  = `${displayW}px`;
  canvasEl.style.height = `${displayH}px`;

  fc = new Canvas(canvasEl, {
    selection: true,
    preserveObjectStacking: true,
    renderOnAddRemove: false,
  });
  fc.setDimensions({ width: displayW, height: displayH });
  fc.setZoom(1);
}
```

### C.4 Step 3 — Loading the Manga Page Image

```ts
let baseZoom = 1;
let currentZoom = 1;

async function loadPageImage(imageUrl: string) {
  return new Promise<void>((resolve) => {
    fabric.Image.fromURL(imageUrl, (img) => {
      const containerW = fc.getWidth();
      const containerH = fc.getHeight();
      const imgW = img.naturalWidth || img.width!;
      const imgH = img.naturalHeight || img.height!;

      baseZoom = Math.min(containerW / imgW, containerH / imgH);
      currentZoom = baseZoom;
      fc.setZoom(baseZoom);

      img.set({ left: 0, top: 0, selectable: false, evented: false });
      fc.setBackgroundImage(img, fc.renderAll.bind(fc));
      resolve();
    }, { crossOrigin: 'anonymous' });
  });
}
```

### C.5 Step 4 — Rendering Text Region Overlays

```ts
const COLOUR = { approved: '#22c55e', pending: '#f59e0b', low: '#c0392b' };
const regionObjects = new Map<string, fabric.Group>();

function renderRegion(region: TextRegion) {
  const { bboxX: x, bboxY: y, bboxW: w, bboxH: h } = region;
  const colour = region.isApproved ? COLOUR.approved
    : region.confidence > 75 ? COLOUR.pending : COLOUR.low;

  const rect = new fabric.Rect({
    left: 0, top: 0, width: w, height: h,
    fill: `${colour}22`, stroke: colour,
    strokeWidth: 2 / currentZoom,
    rx: 0, ry: 0, selectable: true,
    hasControls: true, hasBorders: true,
    cornerStyle: 'circle', cornerColor: colour,
    cornerSize: 8, transparentCorners: false,
  });

  const label = new fabric.Text(String(region.bubbleIndex), {
    left: 4, top: 4,
    fontSize: 14 / currentZoom,
    fill: colour, fontFamily: 'DM Mono',
    selectable: false, evented: false,
  });

  const group = new fabric.Group([rect, label], {
    left: x, top: y,
    data: { regionId: region.id },
  });

  regionObjects.set(region.id, group);
  fc.add(group);
}

regions.forEach(renderRegion);
fc.requestRenderAll();
```

### C.6 Step 5 — Bidirectional Sync (Canvas ↔ Spreadsheet)

```ts
// src/lib/stores/editor.ts
import { writable } from 'svelte/store';
export const activeRegionId = writable<string | null>(null);

// ── CanvasEditor.svelte ──────────────────────────────────────────────────────
fc.on('selection:created', (e) => {
  const obj = e.selected?.[0];
  if (obj?.data?.regionId) activeRegionId.set(obj.data.regionId);
});
fc.on('selection:cleared', () => activeRegionId.set(null));

let suppressCanvasSync = false;
activeRegionId.subscribe((id) => {
  if (suppressCanvasSync || !id) return;
  const group = regionObjects.get(id);
  if (group) {
    suppressCanvasSync = true;
    fc.setActiveObject(group);
    const vpt = fc.viewportTransform!;
    const centre = group.getCenterPoint();
    vpt[4] = fc.getWidth()  / 2 - centre.x * currentZoom;
    vpt[5] = fc.getHeight() / 2 - centre.y * currentZoom;
    fc.requestRenderAll();
    suppressCanvasSync = false;
  }
});

// ── TranslationTable.svelte ──────────────────────────────────────────────────
function selectRow(regionId: string) { activeRegionId.set(regionId); }
$: activeId = $activeRegionId;
```

### C.7 Step 6 — Zoom & Pan

```ts
const ZOOM_MIN = 0.1, ZOOM_MAX = 5;
let isPanning = false, lastPanPoint = { x: 0, y: 0 };

fc.on('mouse:wheel', (opt) => {
  let zoom = fc.getZoom() * (0.999 ** opt.e.deltaY);
  zoom = Math.min(Math.max(zoom, ZOOM_MIN), ZOOM_MAX);
  fc.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
  currentZoom = zoom;
  opt.e.preventDefault(); opt.e.stopPropagation();
  updateOverlayLineWidths();
});

fc.on('mouse:down', (opt) => {
  if (opt.e.button === 1 || isSpaceHeld) {
    isPanning = true;
    fc.setCursor('grabbing');
    lastPanPoint = { x: opt.e.clientX, y: opt.e.clientY };
    fc.selection = false;
  }
});
fc.on('mouse:move', (opt) => {
  if (!isPanning) return;
  fc.relativePan({ x: opt.e.clientX - lastPanPoint.x, y: opt.e.clientY - lastPanPoint.y });
  lastPanPoint = { x: opt.e.clientX, y: opt.e.clientY };
});
fc.on('mouse:up', () => { isPanning = false; fc.selection = true; fc.setCursor('default'); });
```

### C.8 Step 7 — Manual Region Drawing

```ts
let isDrawingMode = false;
let drawStart: { x: number; y: number } | null = null;
let drawPreview: fabric.Rect | null = null;

export function enterDrawMode() {
  isDrawingMode = true; fc.selection = false; fc.setCursor('crosshair');
}

fc.on('mouse:down', (opt) => {
  if (!isDrawingMode) return;
  drawStart = fc.getPointer(opt.e);
  drawPreview = new fabric.Rect({
    left: drawStart.x, top: drawStart.y, width: 0, height: 0,
    stroke: '#c0392b', strokeWidth: 2 / currentZoom,
    fill: 'rgba(192,57,43,0.1)', selectable: false,
  });
  fc.add(drawPreview);
});
fc.on('mouse:move', (opt) => {
  if (!isDrawingMode || !drawStart || !drawPreview) return;
  const p = fc.getPointer(opt.e);
  const w = p.x - drawStart.x, h = p.y - drawStart.y;
  drawPreview.set({
    width: Math.abs(w), height: Math.abs(h),
    left: w < 0 ? p.x : drawStart.x, top: h < 0 ? p.y : drawStart.y,
  });
  fc.requestRenderAll();
});
fc.on('mouse:up', async () => {
  if (!isDrawingMode || !drawStart || !drawPreview) return;
  fc.remove(drawPreview);
  const bbox = { x: drawPreview.left!, y: drawPreview.top!, w: drawPreview.width!, h: drawPreview.height! };
  if (bbox.w > 10 && bbox.h > 10) {
    const region = await createManualRegion(pageId, bbox);
    renderRegion(region);
  }
  drawStart = null; drawPreview = null; isDrawingMode = false;
  fc.selection = true; fc.setCursor('default');
});
```

### C.9 Step 8 — Undo / Redo Stack

```ts
interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  description: string;
}
const undoStack: Command[] = [];
const redoStack: Command[] = [];

export async function executeCommand(cmd: Command) {
  await cmd.execute(); undoStack.push(cmd); redoStack.length = 0;
}
export async function undo() {
  const cmd = undoStack.pop(); if (!cmd) return;
  await cmd.undo(); redoStack.push(cmd);
}
export async function redo() {
  const cmd = redoStack.pop(); if (!cmd) return;
  await cmd.execute(); undoStack.push(cmd);
}

// Example
function makeEditTranslationCommand(regionId: string, oldText: string, newText: string): Command {
  return {
    description: `Edit translation for region ${regionId}`,
    execute: () => patchRegion(regionId, { translatedText: newText }),
    undo:    () => patchRegion(regionId, { translatedText: oldText }),
  };
}
```

### C.10 Step 9 — Preview Mode

```ts
let isPreviewMode = false;

async function togglePreview() {
  isPreviewMode = !isPreviewMode;
  if (isPreviewMode) {
    regionObjects.forEach(group => group.set('visible', false));
    const { renderedUrl } = await renderPage(pageId);
    fabric.Image.fromURL(renderedUrl, (img) => {
      img.set({ left: 0, top: 0, selectable: false, evented: false, data: { isPreview: true } });
      fc.add(img); fc.sendToBack(img); fc.requestRenderAll();
    }, { crossOrigin: 'anonymous' });
  } else {
    fc.getObjects().filter(o => o.data?.isPreview).forEach(o => fc.remove(o));
    regionObjects.forEach(group => group.set('visible', true));
    fc.requestRenderAll();
  }
}
```

---

## § D Storage-Optimised Database Schema

Drizzle ORM schema designed to minimise database size and query cost

---

### D.1 Optimisation Principles

| **Problem** | **Solution Applied** |
|---|---|
| Status fields stored as VARCHAR — wastes 5–10 bytes per row on string overhead. | Use Drizzle `pgEnum()`, which maps to native Postgres enum types. All status/type/language fields are enums. |
| Bounding boxes stored as a JSON column `{ x, y, w, h }` — ~40 bytes overhead even for 4 numbers. | Store bbox as four separate `integer()` columns (bboxX, bboxY, bboxW, bboxH) = 16 bytes total vs ~60 bytes as JSON. At 50 regions/page × 500 pages, saves ~1.3 MB per project. |
| Confidence stored as float (8 bytes) — six decimal places are useless for a 0–100% score. | Store confidence as `integer()` (0–100). Reduces from 8 bytes to 4 bytes per region row. |
| Image URLs stored in full in every Page row — Uploadcare URLs follow a predictable pattern so only the UUID fileId needs storing. | Store only the fileId as `uuid()` (16 bytes in Postgres vs ~60 bytes as text). Reconstruct full URL at application layer. |
| Translation memory duplicated verbatim across thousands of TextRegion rows. | Separate `translationMemory` table with unique constraint on `(projectId, sourceHash)`. TextRegion rows reference it by FK. |
| Character glossary stored as JSON blob on the Project row — hard to query and grows unbounded. | Normalised into a `projectCharacters` table with indexed columns. Enables efficient lookup during translation. |

### D.2 Enum Definitions

```ts
// src/lib/server/db/schema.ts
import {
  pgTable, pgEnum, serial, integer, text, varchar,
  boolean, timestamp, uuid, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const langEnum             = pgEnum('lang',              ['JA','ZH','KO','TH','EN','VI']);
export const pageStatusEnum       = pgEnum('page_status',       ['PENDING','PROCESSING','DETECTED','TRANSLATED','APPROVED','RENDERED']);
export const jobStatusEnum        = pgEnum('job_status',        ['QUEUED','RUNNING','DONE','ERROR']);
export const genderCodeEnum       = pgEnum('gender_code',       ['MALE','FEMALE','NEUTRAL','UNKNOWN']);
export const regionTypeEnum       = pgEnum('region_type',       ['DIALOGUE','THOUGHT','NARRATION','SFX','SIGNAGE']);
export const translationStyleEnum = pgEnum('translation_style', ['NATURAL','LITERAL','FORMAL','CASUAL']);
```

### D.3 Full Schema

```ts
// ── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id:        text('id').primaryKey().$defaultFn(() => createId()),
  kindeId:   text('kinde_id').notNull().unique(),
  email:     text('email').notNull().unique(),
  isPro:     boolean('is_pro').notNull().default(false),
  apiKey:    varchar('api_key', { length: 200 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id:        text('id').primaryKey().$defaultFn(() => createId()),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title:     varchar('title', { length: 120 }).notNull(),
  srcLang:   langEnum('src_lang').notNull(),
  tgtLang:   langEnum('tgt_lang').notNull(),
  style:     translationStyleEnum('style').notNull().default('NATURAL'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('projects_user_id_idx').on(t.userId),
]);

export const projectCharacters = pgTable('project_characters', {
  id:        serial('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name:      varchar('name', { length: 80 }).notNull(),
  gender:    genderCodeEnum('gender').notNull().default('UNKNOWN'),
  particle:  varchar('particle', { length: 10 }),
  notes:     varchar('notes', { length: 300 }),
}, (t) => [
  uniqueIndex('proj_char_project_name_idx').on(t.projectId, t.name),
  index('proj_char_project_id_idx').on(t.projectId),
]);

export const chapters = pgTable('chapters', {
  id:        serial('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  number:    integer('number').notNull(),
  title:     varchar('title', { length: 120 }).notNull(),
  status:    pageStatusEnum('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('chapters_project_number_idx').on(t.projectId, t.number),
  index('chapters_project_id_idx').on(t.projectId),
]);

export const pages = pgTable('pages', {
  id:             serial('id').primaryKey(),
  chapterId:      integer('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  pageNumber:     integer('page_number').notNull(),
  srcFileId:      uuid('src_file_id').notNull(),       // Uploadcare UUID — never store full URL
  cleanFileId:    uuid('clean_file_id'),
  renderedFileId: uuid('rendered_file_id'),
  status:         pageStatusEnum('status').notNull().default('PENDING'),
  createdAt:      timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('pages_chapter_page_idx').on(t.chapterId, t.pageNumber),
  index('pages_chapter_id_idx').on(t.chapterId),
  index('pages_status_idx').on(t.status),              // cron queue scan
]);

export const textRegions = pgTable('text_regions', {
  id:               serial('id').primaryKey(),
  pageId:           integer('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  bubbleIndex:      integer('bubble_index').notNull(),
  regionType:       regionTypeEnum('region_type').notNull().default('DIALOGUE'),
  // Bounding box as 4 integer columns — NOT json() — saves ~44 bytes per row
  bboxX:            integer('bbox_x').notNull(),
  bboxY:            integer('bbox_y').notNull(),
  bboxW:            integer('bbox_w').notNull(),
  bboxH:            integer('bbox_h').notNull(),
  originalText:     text('original_text').notNull(),
  translatedText:   text('translated_text'),
  speakerName:      varchar('speaker_name', { length: 80 }),
  speakerGender:    genderCodeEnum('speaker_gender').notNull().default('UNKNOWN'),
  thaiParticle:     varchar('thai_particle', { length: 10 }),
  confidence:       integer('confidence').notNull().default(0),  // 0–100 integer, NOT float
  isApproved:       boolean('is_approved').notNull().default(false),
  isManual:         boolean('is_manual').notNull().default(false),
  fontSizeOverride: integer('font_size_override'),
  memoryId:         integer('memory_id').references(() => translationMemory.id),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow().$onUpdateFn(() => new Date()),
}, (t) => [
  index('text_regions_page_id_idx').on(t.pageId),
  index('text_regions_page_approved_idx').on(t.pageId, t.isApproved),  // bulk-approve queries
]);

export const translationMemory = pgTable('translation_memory', {
  id:         serial('id').primaryKey(),
  projectId:  text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sourceText: text('source_text').notNull(),
  sourceHash: varchar('source_hash', { length: 64 }).notNull(),  // SHA-256 for fast dedup lookup
  targetText: text('target_text').notNull(),
  useCount:   integer('use_count').notNull().default(1),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('tm_project_hash_idx').on(t.projectId, t.sourceHash),
  index('tm_project_id_idx').on(t.projectId),
]);

export const translationJobs = pgTable('translation_jobs', {
  id:           serial('id').primaryKey(),
  pageId:       integer('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  status:       jobStatusEnum('status').notNull().default('QUEUED'),
  aiModel:      varchar('ai_model', { length: 60 }).notNull(),
  step:         integer('step').notNull().default(0),  // 0=pending 1=vision 2=chars 3=translated
  errorMessage: varchar('error_message', { length: 500 }),
  startedAt:    timestamp('started_at'),
  completedAt:  timestamp('completed_at'),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('jobs_status_created_at_idx').on(t.status, t.createdAt),  // FIFO cron queue
]);

// ── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user:       one(users,       { fields: [projects.userId],    references: [users.id] }),
  chapters:   many(chapters),
  characters: many(projectCharacters),
  memory:     many(translationMemory),
}));
export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  project: one(projects, { fields: [chapters.projectId], references: [projects.id] }),
  pages:   many(pages),
}));
export const pagesRelations = relations(pages, ({ one, many }) => ({
  chapter: one(chapters, { fields: [pages.chapterId], references: [chapters.id] }),
  regions: many(textRegions),
  jobs:    many(translationJobs),
}));
export const textRegionsRelations = relations(textRegions, ({ one }) => ({
  page:   one(pages,             { fields: [textRegions.pageId],   references: [pages.id] }),
  memory: one(translationMemory, { fields: [textRegions.memoryId], references: [translationMemory.id] }),
}));
```

```ts
// src/lib/server/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

```ts
// drizzle.config.ts  (project root)
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema:        './src/lib/server/db/schema.ts',
  out:           './drizzle',
  dialect:       'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

**Migration commands:**

```bash
npm install drizzle-orm postgres @paralleldrive/cuid2
npm install -D drizzle-kit

npx drizzle-kit generate   # generate SQL files into ./drizzle/
npx drizzle-kit migrate    # apply to database
npx drizzle-kit studio     # optional: schema browser
```

---

### D.4 Storage Savings Analysis

Per manga chapter (20 pages × 30 regions = 600 TextRegion rows):

| **Field / Pattern** | **Savings per 600 rows** |
|---|---|
| **Status enum fields (×4 per row)** | VARCHAR avg 8 bytes → pgEnum 2–4 bytes per field. ~14 KB saved per chapter. |
| **Bounding box storage** | JSON blob ~60 bytes → 4×integer = 16 bytes. 44 bytes saved × 600 rows = 26 KB per chapter. |
| **Confidence score** | float 8 bytes → integer 4 bytes. 4 bytes saved × 600 rows = 2.4 KB per chapter. |
| **Image file ID (×3 per Page row)** | Full URL ~65 bytes → UUID 16 bytes. 49 bytes saved × 3 fields × 20 pages = 2.9 KB per chapter. |
| **Translation Memory deduplication** | Recurring dialogue stored once instead of per-chapter. ~60 KB saved per 20-chapter series. |
| **Integer PKs for high-volume tables** | serial/int (4 bytes) vs cuid text (25 bytes). 21 bytes saved × 4 tables × 600 rows = ~50 KB per chapter. |
| **Total estimated saving** | ~155 KB per chapter. For a 50-chapter series: ~7.7 MB saved. |

---

### D.5 Critical Indexes

| **Index** | **Justified by Query Pattern** |
|---|---|
| **users.kindeId (unique)** | Auth hook runs on every page load — must be sub-millisecond. |
| **pages.status** | Cron job polls for oldest PENDING/QUEUED page every 30s — prevents full table scan. |
| **pages.chapterId** | Chapter dashboard loads all pages for a chapter. |
| **textRegions.pageId** | Editor loads all regions for a page on mount — most frequent query in the app. |
| **textRegions(pageId, isApproved)** | Bulk-approve: `WHERE pageId = ? AND isApproved = false AND confidence >= ?`. Composite index covers both filter columns. |
| **translationJobs(status, createdAt)** | Cron queue: `SELECT ... WHERE status = QUEUED ORDER BY createdAt ASC LIMIT 1`. Makes this O(log n). |
| **translationMemory(projectId, sourceHash)** | Dedup check before insert — hash lookup, not full-text comparison. Unique index doubles as lookup index. |
| **projectCharacters(projectId, name)** | Unique constraint doubles as glossary lookup index during translation. |

---

*Comic Trans Studio — Design & Technical Deep Dive | Addendum v1.1 (Drizzle edition)*
