# Plan: Fix Canvas Editor & UI/UX

**Generated**: 2026-03-14
**Estimated Complexity**: High

## Overview

Apply the Manga "Ink on Paper" design system (from docs) to fix the canvas editor and all UI pages. The current implementation uses incorrect colors and styling that doesn't match the documented requirements.

## Prerequisites

- Design tokens defined in CSS variables
- Fonts loaded in app.html (Shippori Mincho B1, Cormorant Garamond Bold, Noto Serif, Noto Serif Thai, DM Mono)

## Sprint 1: Design System Foundation

**Goal**: Set up global CSS variables and typography
**Demo/Validation**: Verify CSS variables and fonts load correctly

### Task 1.1: Add Design Tokens to Global CSS

- **Location**: `src/app.css` (or create if not exists)
- **Description**: Define CSS custom properties for manga design system colors and spacing
- **Acceptance Criteria**:
  - All colors from docs implemented: --ink-black, --panel-red, --cream-paper, --screen-blue, --gold-tone, --manga-navy, --panel-light, --tone-gray, --ink-muted, --border-line
  - Halftone background pattern implemented
  - Speed-line divider style implemented
- **Validation**: Check app.css contains all tokens

### Task 1.2: Update app.html with Font Loading

- **Location**: `src/app.html`
- **Description**: Add Google Fonts preconnect and font loading for Shippori Mincho B1, Cormorant Garamond Bold, Noto Serif, Noto Serif Thai, DM Mono
- **Acceptance Criteria**:
  - Fonts load with display=swap
  - Preconnect tags for fonts.googleapis.com and fonts.gstatic.com
- **Validation**: Check network tab for font loading

### Task 1.3: Create Base Component Styles

- **Location**: `src/app.css`
- **Description**: Define .panel-frame, .btn-primary, .bubble-badge base styles per docs
- **Acceptance Criteria**:
  - .panel-frame: border: 2px solid var(--border-line), box-shadow: 2px 4px 0 rgba(26,26,46,0.08), border-radius: 0
  - .btn-primary: black bg, white text, box-shadow: 3px 3px 0 var(--panel-red), border-radius: 0
  - .bubble-badge: pill shape with triangle tail
- **Validation**: Components render with correct styles

## Sprint 2: Canvas Editor Fixes

**Goal**: Canvas editor matches documented requirements
**Demo/Validation**: Open editor page, verify colors and interactions

### Task 2.1: Fix Canvas Stroke Colors

- **Location**: `src/lib/components/editor/CanvasEditor.svelte`
- **Description**: Update tone colors to match docs: approved=#22c55e, pending=#f59e0b, low=#c0392b
- **Acceptance Criteria**:
  - Region overlays use correct colors based on approval/confidence
  - Colors match exactly as specified in docs
- **Validation**: Visual inspection of canvas regions

### Task 2.2: Fix Canvas Panel Styling

- **Location**: `src/lib/components/editor/CanvasEditor.svelte`
- **Description**: Remove border-radius, apply manga panel styling
- **Acceptance Criteria**:
  - Canvas container uses .panel-frame styling
  - No rounded corners
- **Validation**: Verify border-radius: 0

### Task 2.3: Fix Translation Table Styling

- **Location**: `src/lib/components/editor/TranslationTable.svelte`
- **Description**: Apply manga design system to table
- **Acceptance Criteria**:
  - Table uses correct colors from design system
  - No rounded corners on container
- **Validation**: Visual inspection

### Task 2.4: Fix Toolbar Styling

- **Location**: `src/lib/components/editor/Toolbar.svelte`
- **Description**: Apply manga button styles (no border-radius, correct shadows)
- **Acceptance Criteria**:
  - Buttons have border-radius: 0
  - Primary buttons have box-shadow: 3px 3px 0 var(--panel-red)
- **Validation**: Visual inspection of toolbar

## Sprint 3: Landing Page Fix

**Goal**: Landing page follows manga design system
**Demo/Validation**: Visit / page, verify styling

### Task 3.1: Style Landing Page

- **Location**: `src/routes/+page.svelte`
- **Description**: Apply manga design system to landing page
- **Acceptance Criteria**:
  - Uses Shippori Mincho for titles
  - Halftone background visible
  - Correct color palette applied
  - Panel-frame styling on cards
- **Validation**: Visual inspection

## Sprint 4: Projects Page Fix

**Goal**: Projects page follows manga design system
**Demo/Validation**: Visit /projects page, verify styling

### Task 4.1: Style Projects List Page

- **Location**: `src/routes/(app)/projects/+page.svelte`
- **Description**: Apply manga design system to projects grid
- **Acceptance Criteria**:
  - Cards use .panel-frame styling
  - Correct colors and typography
  - No rounded corners
- **Validation**: Visual inspection

### Task 4.2: Style New Project Page

- **Location**: `src/routes/(app)/projects/new/+page.svelte`
- **Description**: Apply manga design system to form
- **Acceptance Criteria**: Same as Task 4.1
- **Validation**: Visual inspection

## Sprint 5: Project Detail & Chapters Pages Fix

**Goal**: All project/chapter pages follow manga design system
**Demo/Validation**: Visit project pages, verify styling

### Task 5.1: Style Project Detail Page

- **Location**: `src/routes/(app)/projects/[pid]/+page.svelte`
- **Description**: Apply manga design system
- **Acceptance Criteria**: Panel-frame styling, correct colors
- **Validation**: Visual inspection

### Task 5.2: Style Chapter Pages

- **Location**: `src/routes/(app)/projects/[pid]/chapters/*`
- **Description**: Apply manga design system to chapter list and detail
- **Acceptance Criteria**: Consistent with other pages
- **Validation**: Visual inspection

## Sprint 6: Settings Pages Fix

**Goal**: Settings pages follow manga design system
**Demo/Validation**: Visit /settings page, verify styling

### Task 6.1: Style Settings Pages

- **Location**: `src/routes/(app)/settings/*`
- **Description**: Apply manga design system
- **Acceptance Criteria**: Consistent styling with other pages
- **Validation**: Visual inspection

## Sprint 7: Login Page Fix

**Goal**: Login page follows manga design system
**Demo/Validation**: Visit /login page, verify styling

### Task 7.1: Style Login Page

- **Location**: `src/routes/(auth)/login/+page.svelte`
- **Description**: Apply manga design system to auth page
- **Acceptance Criteria**: Consistent with design system
- **Validation**: Visual inspection

## Testing Strategy

- Run `pnpm lint` after each sprint to ensure code quality
- Run `pnpm check` for type safety
- Run `pnpm build` before commit to verify no build errors
- Manual visual testing: open each page and verify design system applied

## Potential Risks & Gotchas

1. **Font rendering**: Thai text requires Noto Serif Thai - ensure it's loaded
2. **Existing component styles**: May conflict with new global styles - use more specific selectors
3. **shadcn components**: May need overriding to match manga design system

## Rollback Plan

- Keep backup of original CSS/component files
- Design system changes are isolated to CSS variables and component styles
- Can revert by removing CSS additions
