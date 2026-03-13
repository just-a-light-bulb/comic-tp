# Plan: Editor Canvas Features Implementation

**Generated**: 2026-03-13
**Estimated Complexity**: High

## Overview

Implement all missing features in the /editor/[pageId] canvas editor to match Canva/Photoshop-like functionality. The editor already has canvas, region overlays, text overlays, undo/redo, and zoom/pan. Need to add full editing capabilities.

## Prerequisites

- Fabric.js v5 for canvas manipulation
- Svelte 5 with runes
- Existing EditorPage.svelte, CanvasEditor.svelte, Toolbar.svelte components
- Design system: Material You (from design_docs_1.md)

## Sprint 1: Core Canvas Tools

**Goal**: Enable all toolbar tools to work properly
**Demo/Validation**: All tool buttons functional in tool rail

### Task 1.1: Select Tool (Pointer)

- **Location**: src/lib/components/editor/CanvasEditor.svelte, Toolbar.svelte
- **Description**: Default select/move tool - already working via Fabric.js default
- **Dependencies**: None
- **Acceptance Criteria**: Click to select objects, drag to move
- **Validation**: Can select and move text overlays and regions

### Task 1.2: Add Textbox Tool

- **Location**: EditorPage.svelte, Toolbar.svelte
- **Description**: Add new text overlay at center of canvas
- **Dependencies**: None (already implemented in EditorPage.addTextbox)
- **Acceptance Criteria**: Click button adds textbox at canvas center
- **Validation**: Textbox appears and is editable

### Task 1.3: Shape Tool (Rectangle)

- **Location**: CanvasEditor.svelte
- **Description**: Draw rectangular shapes (e.g., for SFX boxes)
- **Dependencies**: None
- **Acceptance Criteria**: Can draw rectangle shapes on canvas
- **Validation**: Rectangle drawn and can be styled

### Task 1.4: Hand/Pan Tool

- **Location**: CanvasEditor.svelte
- **Description**: Pan tool for moving around canvas (already implemented via spacebar)
- **Dependencies**: None
- **Acceptance Criteria**: Toggle hand tool for panning
- **Validation**: Hand tool activates for panning without holding space

## Sprint 2: Manual Region Drawing

**Goal**: Draw new bubble regions on canvas
**Demo/Validation**: Can draw new region and it appears in TranslationTable

### Task 2.1: Region Draw Mode Toggle

- **Location**: CanvasEditor.svelte
- **Description**: Toggle canvas to region drawing mode
- **Dependencies**: Task 1.x
- **Acceptance Criteria**:
  - Tool rail button toggles draw mode
  - Canvas cursor changes to crosshair
  - Selection disabled during draw mode
- **Validation**: Can enter and exit draw mode

### Task 2.2: Mouse Drag Region Creation

- **Location**: CanvasEditor.svelte
- **Description**: Mouse down records start, drag shows preview, mouse up creates region
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - Mouse down captures starting coordinates
  - Mouse move shows preview rectangle
  - Mouse up creates region if size > 10x10
- **Validation**: Created region appears on canvas and in data

### Task 2.3: Region Save API Integration

- **Location**: EditorPage.svelte, CanvasEditor.svelte
- **Description**: POST new region to /api/regions/manual endpoint
- **Dependencies**: Task 2.2
- **Acceptance Criteria**: New region saved to backend
- **Validation**: Region persists after page reload

## Sprint 3: Preview Mode

**Goal**: Toggle between editing view and final rendered output
**Demo/Validation**: Preview button hides overlays, shows rendered image

### Task 3.1: Preview Toggle Button

- **Location**: Toolbar.svelte
- **Description**: Button to toggle preview mode
- **Dependencies**: None
- **Acceptance Criteria**: Toggle button in toolbar
- **Validation**: Button shows current mode state

### Task 3.2: Hide/Show Overlays

- **Location**: CanvasEditor.svelte
- **Description**: Hide region overlays and text overlays when in preview
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - Preview mode: all overlays hidden
  - Edit mode: all overlays visible
- **Validation**: Visual check of overlay visibility

### Task 3.3: Render API Call

- **Location**: CanvasEditor.svelte or API layer
- **Description**: POST to /api/render/page for final output
- **Dependencies**: Task 3.2
- **Acceptance Criteria**: Rendered image loads as overlay in preview
- **Validation**: Preview shows final output image

## Sprint 4: Export Functionality

**Goal**: Download canvas as PNG/PDF
**Demo/Validation**: Export buttons trigger download

### Task 4.1: Export PNG

- **Location**: Toolbar.svelte, CanvasEditor.svelte
- **Description**: Export canvas as PNG image
- **Dependencies**: None
- **Acceptance Criteria**: Click exports current canvas view as PNG
- **Validation**: PNG file downloads

### Task 4.2: Export PDF

- **Location**: Toolbar.svelte
- **Description**: Export canvas as PDF document
- **Dependencies**: None
- **Acceptance Criteria**: Click exports as PDF with canvas image
- **Validation**: PDF file downloads

## Sprint 5: Layer Management

**Goal**: Reorder and hide/show text layers
**Demo/Validation**: Layers panel shows all text overlays, can reorder and toggle visibility

### Task 5.1: Layer List UI

- **Location**: EditorPage.svelte (layers tab already exists)
- **Description**: Display all text overlays in layers panel
- **Dependencies**: None
- **Acceptance Criteria**: All text overlays listed with name/preview
- **Validation**: List matches canvas text overlays

### Task 5.2: Layer Visibility Toggle

- **Location**: EditorPage.svelte, CanvasEditor.svelte
- **Description**: Toggle visibility of individual layers
- **Dependencies**: Task 5.1
- **Acceptance Criteria**: Eye icon toggles layer visibility on canvas
- **Validation**: Hidden layers don't render on canvas

### Task 5.3: Layer Reorder (Z-index)

- **Location**: EditorPage.svelte, CanvasEditor.svelte
- **Description**: Drag to reorder layers (bring forward/send back)
- **Dependencies**: Task 5.1
- **Acceptance Criteria**: Can change layer order
- **Validation**: Visual z-index changes on canvas

## Sprint 6: Keyboard Shortcuts

**Goal**: Full keyboard shortcut support like Photoshop
**Demo/Validation**: All shortcuts work as expected

### Task 6.1: Delete Selected

- **Location**: CanvasEditor.svelte
- **Description**: Delete key removes selected object
- **Dependencies**: None
- **Acceptance Criteria**: Delete/Backspace removes selected text/region
- **Validation**: Object removed from canvas and data

### Task 6.2: Copy/Paste

- **Location**: CanvasEditor.svelte
- **Description**: Ctrl+C copy, Ctrl+V paste selected object
- **Dependencies**: None
- **Acceptance Criteria**: Can copy and paste text overlays
- **Validation**: New copy appears offset from original

### Task 6.3: Duplicate

- **Location**: CanvasEditor.svelte
- **Description**: Ctrl+D duplicate selected object
- **Dependencies**: None
- **Acceptance Criteria**: Duplicate created at offset position
- **Validation**: New object appears

### Task 6.4: Select All

- **Location**: CanvasEditor.svelte
- **Description**: Ctrl+A selects all objects
- **Dependencies**: None
- **Acceptance Criteria**: All objects selected
- **Validation**: Multi-select active

### Task 6.5: Escape to Deselect

- **Location**: CanvasEditor.svelte
- **Description**: Escape key clears selection
- **Dependencies**: None
- **Acceptance Criteria**: Selection cleared on Escape
- **Validation**: No objects selected

### Task 6.6: Arrow Keys Nudge

- **Location**: CanvasEditor.svelte
- **Description**: Arrow keys move selected object by 1px (10px with Shift)
- **Dependencies**: None
- **Acceptance Criteria**: Arrow keys nudge object position
- **Validation**: Position changes by expected amount

## Sprint 7: API Integration (Real Data)

**Goal**: Connect to real backend for pages, regions, jobs
**Demo/Validation**: Editor loads real project data from API

### Task 7.1: Load Page Data

- **Location**: EditorPage.svelte + page.server.ts
- **Description**: Load page and regions from database via API
- **Dependencies**: None
- **Acceptance Criteria**: Page loads with actual region data
- **Validation**: Shows real OCR/translation data

### Task 7.2: Save Region Changes

- **Location**: API routes + CanvasEditor
- **Description**: PATCH region changes to /api/regions/[id]
- **Dependencies**: Task 7.1
- **Acceptance Criteria**: Changes persist to database
- **Validation**: Reload shows updated data

### Task 7.3: Approve Region

- **Location**: TranslationTable.svelte, API
- **Description**: Mark region as approved via API
- **Dependencies**: Task 7.1
- **Acceptance Criteria**: Region approved status persists
- **Validation**: Visual indicator changes to green

## Testing Strategy

- Manual testing each sprint: open editor page, test feature
- Check console for errors
- Verify visual state matches expected
- For API tasks: verify data persists in database

## Potential Risks & Gotchas

- Fabric.js SSR: must only import in onMount (already handled)
- Z-index management: Fabric.js uses stacking order, need to sync with layer list
- Export with high DPI: need to account for devicePixelRatio
- Copy/paste needs unique IDs for new objects
- Region drawing needs coordinate transformation from screen to canvas space

## Rollback Plan

- Keep existing working features unchanged
- Feature flags for new functionality if needed
- Git restore to revert any breaking changes
