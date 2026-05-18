# GCS Partnership CRM

Internal CRM for the Gina Cody School of Engineering and Computer Science (Concordia University) partnership team. Manages the full lifecycle of industry partnerships — from first contact to signed agreement — plus an external intake form for professor collaboration requests.

**Stack:** Single-page HTML + Supabase (PostgreSQL + Realtime) + Netlify. No build step required.

---

## Two Applications

| File | Audience | Purpose |
|---|---|---|
| `index2.html` | Partnership team | Internal CRM |
| `request.html` | Professors | Public partnership request form |

---

## index2.html — Internal CRM

### First-Time Setup

On first load, team members enter:
- Their name and role (Agent or Manager)
- Supabase project URL and anonymous API key

Credentials are saved to `localStorage` and never leave the browser. Role selection unlocks the Manager dashboard.

---

### Pipeline

The core view. Every industry partnership file lives here.

**7 stages:**
1. Prospection
2. Prise de contact
3. Exploration
4. Demande de partenariat
5. Développement de la proposition
6. Entente signée
7. Fermé / Sans suite

**Views:**
- **Kanban** — Drag-and-drop cards across columns. Each card shows company, main contact, owner avatar, funding amount, days active, and urgency indicators (overdue follow-up = red border, upcoming = orange).
- **List** — Sortable table with columns: Company, Stage, Owner, Funding, Follow-up date, Last update, Days active. Sortable by clicking any header.

**Filters:**
- Owner filter chips — show only files belonging to a specific team member
- Stage filter pills (mobile) — show only one stage at a time
- Global search — searches across company name, contact, source, and professor fields

**Actions on a file:**
- Move between stages (drag or click)
- Assign to a team member
- Set / clear follow-up date and program deadline
- Mark as blocked (⚠) or unblock
- Add a timestamped note from the overview tab
- View full activity history
- Edit all fields
- Link / unlink contacts
- Print to PDF
- Close with a documented reason
- Delete

**Bulk actions:** Select multiple files → export to CSV.

---

### Opportunity Detail Panel

Opens as a side panel (desktop) or bottom sheet (mobile) when a file is clicked. Four tabs:

**Aperçu (Overview)**
- Stage, owner, source, type, professor involved
- Financial summary (program · total · duration)
- Industry tags
- Last 3 activity notes with a quick-note input at the bottom

**Historique (History)**
- Full chronological activity log: stage changes, assignments, contact links, follow-up updates, closures, and notes — each with author and timestamp
- Note templates (Meeting, Call, Email, Follow-up, Internal)

**Contacts**
- Contacts linked to this file with their role (Champion, Decision-maker, Influencer, etc.)
- Link additional contacts from the global directory

**Finances**
- Program, duration (years), units, value per unit, calculated total
- Inline editing

---

### Contacts Directory

Searchable, paginated directory of all contacts.

**Fields per contact:** First name, Last name, Title, Type (Professor / Researcher / Company / Decision-maker / Other), Organisation, Email, Phone, LinkedIn, Notes.

**Filter by type.** Click any contact to see their detail sheet: all fields, linked opportunity files, and a "last contacted" timestamp.

**Actions:** Create, edit, delete, link to opportunities, export to CSV.

---

### Companies Directory

Searchable list of partner organisations.

**Fields:** Name, Sector, Size, City, Website, LinkedIn, Notes.

Each company card shows a count of linked opportunities. Clicking a company shows all associated files. Navigating to a company from an opportunity detail highlights the company card with a flash animation.

**Actions:** Create, edit, delete, export to CSV.

---

### Calendar

Monthly calendar view. Opportunity follow-up dates and deadlines are plotted by day. Each day cell shows the count of files due and the file names. Click a date to open the relevant opportunity.

---

### Statistics & Financement

**Summary strip:**
- Pipeline value (all active files)
- Secured value (signed files)
- Conversion rate (% signed)
- Files with a funding amount

**Bar chart breakdowns:**
- Par source (lead origin)
- Par type (partnership type)
- Par responsable (team member volume)
- Par étape (count per pipeline stage)
- Par raison de clôture (why files were closed)

---

### Professor Network

Dedicated view of all professor-type contacts, showing their department, email, and how many partnership requests they have submitted.

---

### Manager View *(role: Manager only)*

Team performance dashboard:
- Per-member summary cards: active files, signed files, pipeline value, alert count
- Full pipeline kanban filtered to a selected team member
- Team-wide alert summary (overdue follow-ups, blocked files)

---

### Partnership Requests

Internal view of all inbound professor partnership requests submitted via `request.html`.

**Statuses:** New → Pending → Under review → Outreach → Partner identified → In development → Signed / Closed

**Filter tabs:** All, New, Active, Done, Corbeille (soft-deleted).

**Actions per request:**
- View full submission (research profile, project details, budget, timeline)
- Update status with an optional note sent to the professor by email
- Integrate to pipeline — creates an official opportunity pre-filled from the request
- Delete to trash / restore / permanently delete

---

### Settings

All settings are shared across the team via Supabase.

| Category | What you configure |
|---|---|
| Team members | Add / remove team members |
| Types | Partnership type options shown in dropdowns |
| Sources | Lead source options |
| Programs | Funding program names (NSERC Alliance, MITACS, etc.) |
| Industry tags | Sector tags for classifying opportunities |
| Connection | Current user name, Supabase URL/key, reset |

---

### Alerts

A banner above the pipeline shows actionable alerts:
- **Red:** Overdue follow-ups, exceeded deadlines
- **Orange:** Follow-ups due within 3 days, deadlines within 7 days

Each alert links directly to the relevant file. The alert count is also shown in the mobile bottom navigation badge.

---

### Search

Global search bar (desktop) / search button (mobile) searches across all opportunities, contacts, and companies simultaneously. Results are grouped by type in a dropdown; selecting one navigates directly to that record.

---

### Realtime Sync

All data changes are saved immediately to Supabase. A status indicator in the topbar shows:
- **Green dot** — Online, all changes saved
- **Pulsing amber** — Saving
- **Red** — Sync error
- **Grey** — Offline

Supabase Realtime pushes remote changes from other team members to the UI without a page reload.

---

### Bilingual (FR / EN)

All UI text, labels, dates, and note templates are available in both French and English. Language is toggled via a pill in the header and persists in localStorage.

---

### Mobile

The app is fully adapted for phones:
- Bottom navigation bar (Pipeline, Contacts, Companies, Stats)
- Card-based list view replaces the kanban board
- Stage filter pills and owner chips appear above the list
- Floating action button (FAB) for creating new files
- Quick-add sheet for fast lead capture (company, contact, source, type, note)
- All modals become bottom sheets
- Last activity date shown on each card

---

## request.html — Public Professor Request Form

A standalone bilingual (FR/EN) form that professors submit to express interest in an industry partnership.

### What it collects

**Contact info:** Full name, email, department (7 GCS departments + Other), personal/lab website.

**Research profile:** Areas of expertise and interests, what the industry partner should provide (cash, in-kind, facilities access, applied expertise, student internships), past collaborations, companies of interest.

**Project details:** Whether a specific project exists, proposed start timeline, student availability, project title, description / objectives / context / timeline, estimated budget.

### Submission flow

1. Professor fills out the 3-section form with progress indicator
2. On submit, data is written to `professor_requests` in Supabase with a unique UUID token
3. A success page shows the tracking link, which can be copied to clipboard
4. The tracking URL (`/request.html?token=…`) shows a persistent status page for the professor:
   - Visual timeline of the request workflow
   - Current status with description
   - Team contact information
   - Updates automatically when the team changes the status internally

---

## Database Tables (Supabase)

| Table | Purpose |
|---|---|
| `opportunities` | Pipeline files — all deal data, activities JSONB, tags array |
| `contacts` | Contact directory |
| `companies` | Company directory |
| `opportunity_contacts` | Many-to-many join: files ↔ contacts |
| `professor_requests` | Inbound partnership requests from professors |
| `crm_settings` | Shared team configuration (types, sources, programs, tags) |
