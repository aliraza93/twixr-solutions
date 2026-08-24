# Twixr Studio - dashboard design

Studio is a **tool**, not the marketing site. Layout, density, and components follow IMEI Checker’s `dashboard-design.md`. Color is remapped: IMEI blue `#2563EB` becomes Twixr pine `#0F5132`. Marketing pine/lime/Sora stay on the public site only.

## Layout (full width, always)

Every page: `AdminShell` → sticky topbar (sidebar toggle + breadcrumbs) → `PageContainer` → `PageHeader` → content.

- No centered max-width. No empty gutters. `--page-x` is 24px desktop / 16px mobile.
- Sidebar: 240px, collapsible to 64px icon rail, drawer on small screens. Active item is a **solid pine fill**.
- If a form feels wide, cap the form card - never the page.

## Tokens (`.dashboard-shell`)

| Role | Value |
|---|---|
| Page | `#F8FAFC` |
| Card | `#FFFFFF` |
| Ink | `#0F172A` / muted `#475569` |
| Border | `#E2E8F0` |
| Primary | pine `#0F5132` (hover `#0A3A26`) |
| Focus | pine border + `0 0 0 3px rgba(15,81,50,0.15)` |
| Success / danger / warning | `#16A34A` / `#DC2626` / `#D97706` |

Typography: Inter, 14px base. Page title 22/600. Numbers use `tabular-nums`.

## Page patterns

- **List:** `ListPage` = header + `DataTableCard` (toolbar attached to the card, not a floating filter).
- **Form:** `PageHeader` with Cancel + `FormCard` + `FormActions`.
- **Home:** KPI row (`KpiCard`) then a `DataTableCard` of recent inquiries.
- Empty views use `EmptyState`. Status uses `StatusBadge` / `StatusPill`.

Do not use marketing lime primary buttons, Sora display titles, or dark pine sidebars inside Studio.
