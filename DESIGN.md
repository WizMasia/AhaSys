# aHaSys Design System

## 1. Atmosphere & Identity

aHaSys is a focused regulatory review console: dense, sober, and operational. The signature is evidence-first clarity, with status colors reserved for compliance meaning rather than decoration.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | --surface-primary | #FFFFFF | #0F172A | Main panels |
| Surface/secondary | --surface-secondary | #F8FAFC | #111827 | Page background, quiet sections |
| Surface/elevated | --surface-elevated | #FFFFFF | #0F1524 | Review cards and inputs |
| Text/primary | --text-primary | #0F172A | #F8FAFC | Main copy |
| Text/secondary | --text-secondary | #475569 | #CBD5E1 | Supporting text |
| Text/tertiary | --text-tertiary | #64748B | #94A3B8 | Captions and metadata |
| Border/default | --border-default | #E2E8F0 | #1E293B | Panels, inputs, dividers |
| Accent/primary | --accent-primary | #4F46E5 | #6366F1 | Primary actions, selected tabs |
| Accent/hover | --accent-hover | #4338CA | #818CF8 | Hover states |
| Status/success | --status-success | #16A34A | #22C55E | Passed states |
| Status/warning | --status-warning | #D97706 | #F59E0B | Cautions and model limitations |
| Status/error | --status-error | #E11D48 | #FB7185 | Quota/API failures |
| Status/info | --status-info | #2563EB | #60A5FA | Informational notices |

### Rules

- Warning colors communicate model limitations, quota, or partial-analysis state.
- Accent colors are for controls and focus, not ornament.
- Existing Tailwind utility colors should map to the semantic roles above.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| H1 | 36px | 800 | 1.2 | 0 | Page headings |
| H2 | 28px | 800 | 1.25 | 0 | Major panels |
| H3 | 20px | 700 | 1.35 | 0 | Card titles |
| Body | 16px | 400 | 1.6 | 0 | Default text |
| Body/sm | 14px | 400 | 1.5 | 0 | Secondary copy |
| Caption | 12px | 600 | 1.4 | 0 | Labels, metadata |
| Micro | 11px | 800 | 1.35 | 0.04em | Compact badges |

### Font Stack

- Primary: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace

### Rules

- Compact panels use Body/sm and Caption, never hero-scale type.
- Korean status text must keep generous line height to avoid clipping.

## 4. Spacing & Layout

### Base Unit

All spacing derives from 4px.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Icon gaps |
| --space-2 | 8px | Inline controls |
| --space-3 | 12px | Compact fields |
| --space-4 | 16px | Default panel rhythm |
| --space-6 | 24px | Card padding |
| --space-8 | 32px | Section separation |

### Grid

- Max content width: 896px for the review workspace.
- Breakpoints: Tailwind defaults.

### Rules

- Status banners are full-width within the workspace, not nested cards.
- Mobile controls must wrap rather than overflow.

## 5. Components

### Status Banner

- **Structure**: icon, short title, explanatory body, optional action.
- **Variants**: info, warning, error.
- **Spacing**: --space-4 panel padding, --space-2 icon gap.
- **States**: error/warning banners remain readable in light and dark themes.
- **Accessibility**: text explains the condition without relying on color.

### Progress Status

- **Structure**: progress percentage plus one concise current-step sentence.
- **Variants**: default review, OCR fallback review.
- **Accessibility**: messages must describe skipped capabilities and fallback behavior plainly.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 100-150ms | ease-out | Button and tab hover |
| Standard | 200-300ms | ease-in-out | Panel or alert transitions |

### Rules

- Keep motion limited to opacity and transform.
- Do not animate progress text layout.

## 7. Depth & Surface

### Strategy

Mixed, using borders for structure and tonal shifts for emphasis. Shadows are reserved for light-mode elevated panels that already use them in the existing interface.
