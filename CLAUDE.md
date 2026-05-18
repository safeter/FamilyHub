# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GCS Partnership CRM — internal tool for the Gina Cody School of Engineering (Concordia University) partnership team. Manages the full lifecycle of industry partnerships and handles inbound professor collaboration requests.

**Deploy:** Netlify serves from the `main` branch. Push to `main` to deploy. No build step — files are served as-is.

## Development

No build tools, no package manager, no test suite. To develop locally, open `index2.html` directly in a browser. You'll need a real Supabase project URL + anon key (entered on first load; stored in `localStorage`).

## Architecture

**Three files that matter:**
- `index2.html` — ~5300-line single-file app (CSS + HTML + JS all inline). The entire CRM.
- `request.html` — ~950-line public professor intake form. Standalone, bilingual.
- `demo.html` — UI prototype/sandbox. Not deployed as a feature.

**No modules, no imports.** Everything in `index2.html` runs in one script block. Global state:
```
opps          — array of opportunity objects (in-memory)
contacts      — array of contact objects
companies     — array of company objects
oppContacts   — join table rows (opportunity_contacts)
profRequests  — professor_requests rows
settings      — shared config (members, types, sources, programs, tags)
sb            — Supabase client singleton
currentUser   — logged-in user's name (string)
currentUserRole — 'agent' | 'manager'
lang          — 'fr' | 'en'
```

**Startup flow:** `DOMContentLoaded` → `connectSupabase()` → parallel fetch of all 5 tables → `renderPipeline()` + `setupRealtime()`. If credentials are in `localStorage`, this happens automatically.

**DB mapping:** JS uses camelCase; Supabase uses snake_case. Always go through `dbToOpp(row)` when reading from DB and `oppToDb(opp)` when writing. The `fin` sub-object maps to `fin_prog`, `fin_years`, `fin_units`, `fin_unit_val`, `fin_total` columns. `activities` is a JSONB array stored directly on the opportunity row.

**i18n:** All UI strings live in the `T` object at the top of the script — `T.fr` and `T.en`. Call `ui()` to get the current language's string map. Always add new strings to both `T.fr.ui` and `T.en.ui`. The `el(id, text)` helper sets `textContent` on an element by id.

**Realtime:** Supabase channels listen to all 5 tables and patch the in-memory arrays in place, then re-render the affected view. Don't refetch from DB on realtime events — update the array and re-render.

**Rendering pattern:** Views are rendered by calling `render*()` functions that build HTML strings and set `innerHTML`. There is no virtual DOM or reactive framework. After mutating `opps`/`contacts`/`companies`, call the relevant render function to refresh the UI.

## Database tables (Supabase)

| Table | Key columns |
|---|---|
| `opportunities` | `id`, `company`, `stage`, `owner`, `activities` (JSONB), `tags` (array), `title`, `company_id`, `followup_date`, `deadline`, `fin_*` |
| `contacts` | `id`, `first_name`, `last_name`, `type`, `organisation` |
| `companies` | `id`, `name`, `sector`, `tags` (array) |
| `opportunity_contacts` | `opportunity_id`, `contact_id`, `role` |
| `professor_requests` | `id`, `token` (UUID), `status`, `data` (JSONB) |
| `crm_settings` | `key`, `value` — shared team config |

Some columns (`title`, `company_id`) may not exist in older Supabase projects. `saveOpp()` has a fallback that strips unknown columns and retries on error — maintain this pattern if adding new columns.

## CSS conventions

Design tokens are CSS custom properties on `:root` (colours, radii, shadows). All semantic colours (`--red`, `--orange`, `--green`, `--amber`, `--accent`) are defined there. New UI elements should use these tokens, not hardcoded hex values.

Mobile breakpoint is `768px`. Mobile-specific overrides are in a single `@media(max-width:768px)` block near the bottom of the `<style>` tag.
