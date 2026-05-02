# DC Pathfinder — Development Roadmap & Implementation Guide

> This document tracks the complete development journey of the DC Pathfinder proof of concept (PoC), from the original problem definition through every technical decision made along the way. It is intended to serve as the basis for the advice report on program development and implementation for Medux.
>
> **This document is a living file and will be updated as the project evolves.**

---

## Table of Contents

1. [Context and Problem Statement](#1-context-and-problem-statement)
2. [What This Program Does](#2-what-this-program-does)
3. [Folder and File Structure](#3-folder-and-file-structure)
4. [Data Structure — The Layout Files](#4-data-structure--the-layout-files)
5. [How the Program Works — Technical Overview](#5-how-the-program-works--technical-overview)
6. [Step-by-Step: How It Was Built From Zero](#6-step-by-step-how-it-was-built-from-zero)
7. [Algorithm Design and Routing Logic](#7-algorithm-design-and-routing-logic)
8. [Congestion Intelligence Model](#8-congestion-intelligence-model)
9. [UI/UX Decisions](#9-uiux-decisions)
10. [Localization and Theme System](#10-localization-and-theme-system)
11. [Deployment — GitHub Pages](#11-deployment--github-pages)
12. [Known Constraints and PoC Limitations](#12-known-constraints-and-poc-limitations)
13. [Implementation Advice for Real Users](#13-implementation-advice-for-real-users)
14. [Glossary](#14-glossary)
15. [Changelog — Progress Log](#15-changelog--progress-log)

---

## 1. Context and Problem Statement

### The Organization

**Medux** is a medical aids distribution company operating a Distribution Center (DC) in Zwijndrecht, the Netherlands. The DC handles two distinct product types, each managed in a separate warehouse zone:

- **ZV** — Zorghulpmiddelen (medical devices, durable goods)
- **WMO** — Wmo-classified products (social support products under the Dutch WMO act)

### The Daily Challenge

Warehouse pickers (order fulfillment staff) walk the warehouse floor every day collecting dozens of items across multiple pick locations. Without a planned route:

- Pickers retrace paths unnecessarily, wasting walking time.
- Routes are improvised individually, leading to inconsistency and collisions between multiple active pickers.
- Traffic congestion zones (truck arrivals, restocking waves, inspection areas) are not factored into decisions.
- There is no data or tool to compare different routing strategies.

### The Goal of the PoC

Build a **browser-based interactive tool** that:
1. Represents both warehouse floors (ZV and WMO) as navigable grids.
2. Lets a user place a start position and up to 12 pick locations.
3. Computes the best walking route using proven pathfinding algorithms.
4. Factors in turn cost, zone preferences, and congestion windows.
5. Displays time estimates, effort score, and turn count.
6. Requires zero infrastructure — just a browser.

The PoC is intentionally kept as a **static web application** (plain HTML, CSS, JavaScript) so that it can be shared, tested, and deployed without a backend server, database, or build system.

---

## 2. What This Program Does

The application has three pages:

| Page | File | Purpose |
|---|---|---|
| Landing page | `index.html` | Warehouse selection hub |
| ZV Planner | `zv.html` | Route planner for the ZV warehouse floor |
| WMO Planner | `wmo.html` | Route planner for the WMO warehouse floor |

### User Flow

```
Landing Page
    │
    ├─► ZV Pathfinder  ──► zv.html (loads ZV_layout.csv, 33×33 grid)
    │
    └─► WMO Pathfinder ──► wmo.html (loads WMO_layout.csv, 43×41 grid)
```

Once on a planner page, the user:

1. **Taps a free cell** → sets the START position (S).
2. **Taps additional free cells** → adds pick locations (1–12).
3. **Optionally marks a Final Drop (L)** via the MARK FINAL DROP button or by double-tapping a pick location. L is always visited last.
4. **Configures route settings**:
   - Route Goal: Balanced / Fastest / Least Turns
   - Zone Constraint: None / Prefer Top / Prefer Bottom / Avoid Top / Avoid Bottom
   - Traffic Window: Morning / Midday / Afternoon
   - Heatmap overlay toggle
5. **Presses GO** → the engine computes and displays the best route.
6. Views metrics: **Time range**, **Meters**, **Turns**, **Effort (EU)**.

---

## 3. Folder and File Structure

```
PoC_Pathfinder/
│
├── index.html          # Landing page — warehouse selector
├── zv.html             # ZV planner page
├── wmo.html            # WMO planner page
│
├── script.js           # All route engine logic, grid rendering, and UI behavior
├── theme.js            # i18n (EN/NL translations) and theme/language system
├── styles.css          # All visual styling — responsive, mobile-first
│
├── README.md           # Quick-start guide and usage reference
├── ROADMAP.md          # This file — development history and implementation guide
│
└── data/
    ├── ZV_layout.csv   # 33×33 grid encoding the ZV warehouse floor
    ├── WMO_layout.csv  # 43×41 grid encoding the WMO warehouse floor
    └── logo_medux.png  # Medux brand logo for the landing page
```

### Why This Structure?

The project was consciously kept **flat and minimal**:
- No build tool (no Webpack, Vite, or Node required).
- No framework (no React, Vue, or Angular).
- No backend (no server, no database).
- A single `script.js` handles all logic to avoid module-loading issues without a bundler.
- A single `styles.css` covers all three pages.

This makes the PoC easy to run locally, share via a URL, and maintain by a single developer.

---

## 4. Data Structure — The Layout Files

### What a Layout File Is

Each warehouse floor is encoded as a **CSV file** where every cell contains a numeric code representing what occupies that position on the floor.

The grid is read **row by row**, **top to bottom**, **left to right**. Each comma-separated number is one grid cell.

### Cell Value Encoding

| Value | Meaning | Walkable? |
|---|---|---|
| `0` | **Free aisle / walkable path** | ✅ Yes |
| `1` | Shelf / rack (standard) | ❌ No |
| `2` | Shelf / rack (type 2) | ❌ No |
| `3` | Shelf / rack (type 3) | ❌ No |
| `4` | Non-warehouse area (wall, office, external) | ❌ No |
| `5` | Special fixture or gate | ❌ No |
| `6` | Large rack / bulk storage | ❌ No |
| `7` | **Outer boundary / out-of-bounds** | ❌ No |
| `8` | Packing or staging area | ❌ No |
| `9` | Special node / transition cell | ❌ No |

> **Key rule:** Only cells with value `0` are walkable. The pathfinding engine treats any non-zero cell as an impassable obstacle.

### Grid Dimensions

| Layout | Rows | Columns | Total cells |
|---|---|---|---|
| ZV | 33 | 33 | 1,089 |
| WMO | 41 | 43 | 1,763 |

### How the Grid Is Loaded

At page load, `script.js` fetches the CSV file via the browser's `fetch()` API, parses each row and column into a 2D JavaScript array, and renders the grid as a table of `<div>` elements. Each cell gets a CSS class based on its value and an `aria-label` for accessibility.

```
CSV file → fetch() → parse to 2D array → render as DOM grid → attach click handlers
```

### How the Layout Was Created

The CSV was built **manually**, cell by cell, by mapping the real warehouse floor plan (provided as a PDF or blueprint) onto the grid. The process:

1. Print or scale the floor plan to understand relative proportions.
2. Decide on a grid resolution (33×33 for ZV was chosen to balance detail vs. performance).
3. Identify every rack row, aisle, wall, and area type.
4. Assign the correct cell code value to each position in the CSV.
5. Load the CSV in the browser and visually verify the layout matches the real floor.
6. Adjust where the representation diverges from reality.

This was an iterative process — grid encoding was revised multiple times as the floor plan interpretation improved.

---

## 5. How the Program Works — Technical Overview

### High-Level Data Flow

```
User interaction (tap/click)
        │
        ▼
Cell state update (start, pick, last)
        │
        ▼
[GO pressed]
        │
        ▼
Route engine runs 4 algorithms in parallel
  ├─ BFS (Breadth-First Search)
  ├─ Dijkstra
  ├─ Greedy Best-First
  └─ A*
        │
        ▼
Multi-stop order optimizer (memoized permutation)
        │
        ▼
Route scoring (effort + turns + zone penalty + congestion penalty)
        │
        ▼
Best route selected and rendered on grid
        │
        ▼
Metrics displayed (time, meters, turns, effort)
```

### The Effort Model

The engine assigns a numeric **Effort Unit (EU)** score to every route candidate. This score accounts for:

| Component | Purpose |
|---|---|
| Base movement cost | Every step costs 1 EU |
| Center-band multiplier (×1.16) | Walking through the central aisles costs more (higher traffic density) |
| Outer-band multiplier (×1.04) | Edge aisles have a small premium |
| Turn penalty (+0.35 EU per turn) | Turns slow pickers down; penalized per direction change |
| Zone penalty weight (×0.8) | Preferences like "avoid top zone" add cost when violated |
| Congestion penalty weight (×1.0) | Traffic zones from the congestion model add cost |

The final effort score determines the ranking between algorithms and between route permutations.

### Time Estimation

Time is not calculated in real seconds from a GPS. Instead, it is derived from effort:

```
seconds = effort × secondsPerEffortByMode
```

| Route Mode | Seconds per EU |
|---|---|
| Balanced | 2.2 |
| Fastest | 2.0 |
| Least turns | 2.35 |

A **time range** is shown (min–max) using a factor of ×0.85 to ×1.20 to communicate the inherent uncertainty of planning estimates.

### Distance Calibration

The grid is abstract — each cell does not correspond to a fixed number of meters. To produce a realistic meter estimate, **real-world distance reference anchors** were embedded in the code. These anchors say: "the distance from cell A to cell B in the real warehouse is X meters." From this, a meters-per-cell conversion factor is derived and applied across the whole grid.

---

## 6. Step-by-Step: How It Was Built From Zero

### Phase 0 — Problem Scoping

- Identified the warehouse routing problem as the core need.
- Decided on a browser-based PoC to minimize infrastructure risk.
- Chose plain HTML/CSS/JS to keep the PoC accessible and maintainable without specialized skills.
- Defined success criteria: two layouts, multiple algorithms, effort metrics, congestion.

### Phase 1 — Layout Digitization

- Received warehouse floor plans for ZV and WMO.
- Decided on grid resolution (33×33 for ZV, 43×41 for WMO).
- Built the CSV files manually, encoding every cell.
- Built a basic HTML page that fetched the CSV and rendered a colored grid.
- Iterated the CSV until the visual result matched the real floor.

### Phase 2 — Basic Pathfinding

- Implemented BFS (Breadth-First Search) as the first algorithm. BFS guarantees the shortest path in unweighted grids.
- Added click handling: place START (S), then add stops (1, 2, 3...).
- Rendered the computed path back onto the grid by highlighting cells.
- Added RESET and UNDO functionality.

### Phase 3 — Multiple Algorithms

- Added Dijkstra's algorithm for weighted shortest-path.
- Added Greedy Best-First Search for fastest (but not optimal) exploration.
- Added A* (A-star) as the gold standard — combines Dijkstra's correctness with Greedy's speed using a heuristic.
- Built a **route comparison engine** that runs all four algorithms and picks the best scoring result.

### Phase 4 — Multi-Stop Optimization

- Extended from single-destination routing to multi-stop routing (up to 12 stops).
- The Traveling Salesman Problem (TSP) was the underlying challenge: what is the best order to visit N stops?
- Since N ≤ 12, a **memoized dynamic programming approach** was used to evaluate permutations efficiently.
- Added **path segment caching** so that the path between any two cells is computed once and reused.
- Added FINAL DROP (L): a designated cell that is always visited last regardless of the optimization order.

### Phase 5 — Effort Model and Metrics

- Replaced raw step count with the weighted Effort Unit (EU) model.
- Added turn counting (penalize direction changes).
- Added zone bands (top/bottom of warehouse) with preference/avoidance modifiers.
- Added the seconds-per-EU conversion and time range display.
- Added real-world distance calibration anchors.

### Phase 6 — Congestion Intelligence

- Modeled known high-traffic areas in both warehouses.
- Two congestion types: **circles** (around a point, with radius) and **rectRatio** (proportional rectangle areas).
- Three time windows: morning, midday, afternoon.
- Persistent **bottleneck** zones that are congested at all times.
- The congestion penalty is cell-specific: the engine checks each cell on a path against the active congestion zones and adds the penalty to the effort score.

### Phase 7 — UX Refinement

- Replaced the raw grid with a styled phone-frame UI.
- Added a legend and metric pills.
- Added the traffic heatmap overlay (visual color wash over congested cells).
- Added pointer coordinate display for debugging and layout verification.
- Added RESET dialog with two options: clear route only, or clear all picks.
- Added status chip bar with live feedback messages.

### Phase 8 — Localization and Theme

- Added full EN/NL translation coverage with the `theme.js` system.
- Added two visual themes: blue (default) and berry.
- Theme and language persist in `localStorage` so they survive page navigation.
- Added smooth CSS transitions for theme switching.

### Phase 9 — Two-Layout Architecture

- Separated ZV and WMO into their own HTML pages (`zv.html`, `wmo.html`).
- Each page passes the layout file and grid size to `script.js` via `data-*` attributes on the `<body>` tag.
- `script.js` is a single shared file — no duplication of logic between the two planners.
- Added the landing page (`index.html`) as the entry point with warehouse selection.

### Phase 10 — Deployment

- Connected the project to a GitHub repository.
- Enabled GitHub Pages from the repository root.
- The app is now accessible at a public URL without any server configuration.

### Phase 11 — Research Mode

- Added a Research Mode panel to both planner pages (ZV and WMO).
- Panel is hidden by default and revealed with a toggle button in the controls panel.
- The toggle starts in the off state (no flash of content before JS runs — `hidden` is set directly in HTML).
- Features: overall timer, per-stop segment timer, start/end route, start/end picking stop, obstruction logging (5 categories), and CSV export.
- All events are keyed to a run ID (timestamp + layout code) and stored in `localStorage`.
- Auto-export triggers every 10 completed routes.
- Full EN/NL translation coverage added for all Research Mode strings.

### Phase 12 — Bug Fixes and Translation Load Order

- **Metrics not displaying after GO:** `updateRouteSummary()` had an early return gated on the presence of `routeSummary` element, which did not exist in the HTML. Fixed by making the summary element optional while always updating metric pills.
- **Translation keys rendered as raw strings on GitHub Pages:** `script.js` was loaded at end of `<body>` without `defer`, so `bootstrap()` ran before `theme.js` (which has `defer`) had registered `window.__meduxTranslate`. All calls to `t()` returned the raw key. Fixed by adding `defer` to `script.js` in both planner pages so execution order is guaranteed.
- **Research Mode toggle visible on load:** Initial `aria-pressed` and `hidden` state were set to active/visible in HTML and then corrected by JS, causing a brief flash. Fixed by defaulting both to off/hidden in the HTML markup itself.

---

## 7. Algorithm Design and Routing Logic

### The Four Algorithms

| Algorithm | Strategy | Optimal? | Speed |
|---|---|---|---|
| **BFS** | Explore all cells layer by layer (by steps) | Yes (unweighted) | Medium |
| **Dijkstra** | Explore by accumulated cost (weighted) | Yes (weighted) | Medium |
| **Greedy Best-First** | Always move toward the goal (heuristic only) | No | Fast |
| **A\*** | Cost-so-far + heuristic estimate | Yes (with admissible heuristic) | Fast |

In practice, **A*** is the dominant algorithm — it finds optimal routes faster than Dijkstra and more reliably than Greedy. The engine runs all four and compares their scored results, which lets the comparison surface cases where a cheaper, faster algorithm happens to find an equally good route.

### Multi-Stop Order Optimization

For N pick locations, the number of possible visit orderings is N! (factorial). For 12 stops that is ~479 million combinations — not feasible to evaluate brute-force.

The engine uses **Held-Karp memoization** (dynamic programming): it breaks the problem into sub-problems, caches intermediate results, and builds the optimal ordering from overlapping sub-solutions. Path segments between pairs of cells are computed once and stored in a **segment cache** to avoid re-running A* for the same pair multiple times.

### Route Scoring Formula

```
score = sum_of_cell_costs + (turns × 0.35) + zone_penalty + congestion_penalty
```

The algorithm with the lowest score wins. In case of tie, A* is preferred.

---

## 8. Congestion Intelligence Model

### How It Works

The congestion model overlays penalty multipliers on grid cells. When the route engine scores a path, it multiplies each cell's base movement cost by any applicable penalty factor.

### Congestion Zone Types

**Circle zones** are defined by a center cell coordinate and a radius. Any cell within that radius receives the penalty.

**RectRatio zones** are defined by proportional coordinates (0 to 1) rather than fixed cell numbers. This makes them layout-size-agnostic. For example, `rowStartRatio: 0.62` means "starting 62% of the way down the grid."

### Time Windows

| Window | Typical activity |
|---|---|
| Morning | Truck arrivals and restocking in lower zones |
| Midday | Product placement waves, inspection flows |
| Afternoon | Generally lighter (currently no penalties defined for WMO afternoon) |

Congestion zones are defined separately for each layout (ZV and WMO) and each time window. `allDay` zones are always active regardless of the selected window. `bottleneck` zones represent persistent chronic congestion points.

### Current Congestion Profile (ZV)

- **All day:** Mid-top crossing near row 9, col 19 (radius 3, penalty ×1.35).
- **Morning:** Lower-left delivery zone (bottom 38% × left 55%, penalty ×1.30).
- **Midday:** Top-middle-right wave near row 11, col 10 (radius 3, penalty ×1.60).
- **Bottlenecks:** Two persistent choke points (same coordinates, smaller radius, milder penalties).

### Current Congestion Profile (WMO)

- **All day:** Top-middle-left inspection flow near row 10, col 13 (radius 3, penalty ×1.05).
- **Morning:** Lower-left delivery zone (bottom 40% × left 40%, penalty ×0.95 — slight reduction reflecting lighter WMO morning traffic).
- **Bottleneck:** Inspection output at row 10, col 13 (radius 1, penalty ×0.90).

> These values are initial estimates based on operational knowledge. They should be refined with real picker movement data once the tool is deployed.

---

## 9. UI/UX Decisions

### Mobile-First Design

The tool was designed to be used on warehouse handheld devices and tablets, not just desktop browsers. The phone-frame layout (centered, max-width column) simulates a mobile screen on desktop and works natively on mobile.

The `<meta name="viewport" content="..., maximum-scale=1.0, user-scalable=no" />` setting prevents unintended zooming on mobile when tapping cells rapidly.

### Grid Interaction Model

- **Single tap:** Place START or add a pick location.
- **Single tap on existing pick:** Remove it.
- **Double tap:** Mark a pick as the Final Drop (L).
- **MARK FINAL DROP button + single tap:** Alternative way to designate L.

The double-tap detection uses a short click timer (< 300 ms between taps) to distinguish single from double taps.

### Status Feedback

Every user action updates the **status chip** at the bottom of the controls panel. This gives immediate, plain-language feedback ("Pick location 3 added at (row 14, col 7)") so users are never guessing what the app registered.

### Reset Dialog

Rather than a single destructive RESET button, a dialog presents two options:
- **Clear route only** — preserve the picks, remove the highlighted path.
- **Clear all picks** — full reset including start, picks, and L.

This prevents accidental data loss during active planning sessions.

---

## 10. Localization and Theme System

### How Translations Work (`theme.js`)

All user-facing text is stored as **translation keys** in `theme.js`. The HTML uses `data-i18n="key.name"` attributes on every text element. On load, and on language switch, a scan replaces all element text content with the active language string.

Dynamic messages (e.g., "Pick location {count} added at ({row}, {col})") use a simple `{placeholder}` format resolved at render time.

### Language Persistence

The selected language is saved to `localStorage` as `medux-ui-language`. When navigating between pages (landing → ZV → WMO), the language choice is automatically restored without re-selecting.

### Themes

Two color themes are provided:

| Theme | Primary color | Intended feel |
|---|---|---|
| `blue` | Medux corporate blue | Professional, default |
| `berry` | Deep purple/magenta | Alternative for preference or accessibility |

Theme is stored as `medux-ui-theme` in `localStorage`. Theme switching applies a CSS `data-theme` attribute to `<html>`, which triggers CSS variable overrides.

---

## 11. Deployment — GitHub Pages

### Why GitHub Pages

- Free, zero-infrastructure hosting for static sites.
- Automatic deployment from the `main` branch.
- Public URL accessible from any device without VPN.
- No build step required — files are served as-is.

### Local Development Requirement

Because the app fetches CSV files via `fetch()`, it **cannot be opened by double-clicking the HTML file** (the `file://` protocol blocks cross-origin fetches). A local static HTTP server is required during development.

```powershell
# Option 1 — Python (no install needed on most machines)
python -m http.server 8080

# Option 2 — Node (if Node is installed)
npx serve .
```

Then open `http://localhost:8080` in a browser.

---

## 12. Known Constraints and PoC Limitations

| Constraint | Detail |
|---|---|
| Grid resolution | 33×33 and 43×41 cells are approximations. Exact real-world positions require calibration. |
| Distance estimation | Based on anchor references from floor plan measurements. Not GPS-accurate. |
| Congestion values | Manually estimated; not derived from real picker tracking data. |
| TSP optimization | Memoization handles up to 12 stops comfortably. Beyond ~15, performance may degrade. |
| No multi-picker coordination | The tool plans one picker's route at a time. Simultaneous multi-picker conflict is not modeled. |
| No real-time data | Traffic windows are time-of-day selections, not live feeds. |
| CSV encoding is manual | Layout updates require manually editing the CSV — there is no floor plan import tool. |
| Static deployment | No user login, no session storage server-side, no history of past routes. |

---

## 13. Implementation Advice for Real Users

This section is written for the warehouse operations team, logistics managers, and IT stakeholders who will eventually use or extend this tool in a real production context.

### 13.1 Using the PoC Today

The PoC is production-ready for **planning assistance** and **training**. Use it to:
- Train new pickers on efficient route strategies before they walk the floor.
- Compare routing strategies (Balanced vs. Fastest vs. Least Turns) for different pick list types.
- Visualize which zones are congested at different times of day.
- Build intuition for how pick list composition affects total walking effort.

**Do not use the time estimates as SLA commitments.** They are guidance, not guarantees.

### 13.2 Keeping Layouts Current

The CSV files are the "ground truth" of the warehouse floor. If racks are moved, aisles are blocked, or new zones are created, the CSV must be updated to reflect reality. Establish a process:
1. Assign one person responsible for layout maintenance.
2. After any significant floor change (new rack placement, aisle closure), update the CSV.
3. Visually verify after each update by loading the tool and checking the grid.

A future improvement would be a visual CSV editor built into the tool itself.

### 13.3 Calibrating Congestion Values

The congestion penalties currently in the code are **initial estimates**. To make them accurate:
1. Track picker movement data (e.g., via RF scanner logs or warehouse management system events).
2. Identify which zones consistently cause delays.
3. Update the `penalty` values in `CONGESTION_INTELLIGENCE` in `script.js`.
4. Higher penalty = more cost discouragement to route through that area.
5. A penalty of 1.0 = neutral. Values above 1.0 add cost; below 1.0 reduce cost.

### 13.4 Expanding to More Warehouse Zones

To add a new warehouse floor:
1. Create a new CSV file in `data/` (e.g., `ZV2_layout.csv`).
2. Copy `zv.html` to a new file (e.g., `zv2.html`) and update the `data-layout` and `data-grid-size` attributes on the `<body>` tag.
3. Add a new button on `index.html` pointing to the new page.
4. Add congestion data for the new layout code in `CONGESTION_INTELLIGENCE` in `script.js`.
5. Optionally add distance calibration anchors in `DISTANCE_CALIBRATION`.

No changes to `script.js` algorithm logic are needed for new layouts.

### 13.5 Integration Pathway (Future)

The PoC was designed to demonstrate feasibility. A full production system might include:

| Feature | What It Would Add |
|---|---|
| WMS integration | Import pick lists automatically instead of manual tap-selection |
| Real-time congestion | Pull live data from RF scanner density or IoT floor sensors |
| Multi-picker mode | Coordinate routes across simultaneous active pickers |
| Route history | Save and review past routes for KPI analysis |
| Admin layout editor | Update the floor grid visually without editing CSV manually |
| Native mobile app | Wrap the web app in a WebView shell (e.g., Capacitor) for app store distribution |

The current architecture makes integration straightforward: `script.js` exposes a well-structured route engine that can be called with any start/stop configuration, and the CSV format is simple enough to generate programmatically from a WMS export.

### 13.6 Important Notes on Scaling

- The tool handles up to **12 pick locations** per run. Real pick lists often exceed 12 items. For practical use, break pick lists into batches of ≤12 and plan each batch as a separate route.
- The tool plans **one picker at a time**. If multiple pickers are active simultaneously, route conflicts are not detected. This is a PoC limitation, not a fundamental algorithmic one.
- The tool works on any modern browser — Chrome, Edge, Safari, Firefox. No installation required.

---

## 14. Glossary

| Term | Definition |
|---|---|
| **PoC** | Proof of Concept — a working prototype to validate feasibility before full development |
| **CSV** | Comma-Separated Values — a plain text file format used to encode the warehouse grid |
| **Grid** | A 2D matrix of cells representing the warehouse floor |
| **Cell** | A single position on the warehouse grid floor |
| **Walkable cell** | A cell with value `0` — the picker can step on it |
| **BFS** | Breadth-First Search — a graph traversal algorithm, finds shortest unweighted path |
| **Dijkstra** | Weighted shortest-path algorithm; finds optimal path with movement costs |
| **Greedy Best-First** | Heuristic algorithm; fast but not always optimal |
| **A\*** (A-star) | Optimal and efficient algorithm combining cost and heuristic |
| **EU** | Effort Unit — the synthetic cost metric used to score routes |
| **Heuristic** | An estimate function used by A* to guide search toward the goal |
| **TSP** | Traveling Salesman Problem — finding the optimal order to visit all stops |
| **Memoization** | Caching intermediate computation results to avoid redundant work |
| **Congestion zone** | A region of the warehouse with elevated movement cost during certain times |
| **L (Final Drop)** | The designated last stop — always visited at the end of the route regardless of optimal order |
| **S (Start)** | The picker's starting position on the floor |
| **Zone constraint** | A user preference to prefer or avoid the top/bottom half of the warehouse |
| **Traffic window** | Time-of-day selection (Morning / Midday / Afternoon) that determines which congestion profiles are active |
| **Theme** | Visual color scheme of the UI (Blue or Berry) |
| **i18n** | Internationalization — the system that manages EN/NL language translation |
| **localStorage** | Browser storage that persists user preferences (language, theme) across sessions |
| **GitHub Pages** | Free static website hosting service provided by GitHub |
| **WMS** | Warehouse Management System — enterprise software that manages inventory and pick orders |
| **ZV** | Zorghulpmiddelen — durable medical devices warehouse zone |
| **WMO** | Wet Maatschappelijke Ondersteuning — social support products warehouse zone |

---

## 15. Changelog — Progress Log

> Updates are added here as the project evolves.

| Date | Version | What Changed |
|---|---|---|
| Initial | v0.1 | Basic ZV grid rendering from CSV, BFS-only, click to place start/stops |
| — | v0.2 | Added Dijkstra, Greedy Best-First, A*, multi-algorithm comparison |
| — | v0.3 | Multi-stop TSP optimization with memoization and segment cache |
| — | v0.4 | Effort model, turn counting, zone constraints, time estimation |
| — | v0.5 | Congestion intelligence, traffic windows, heatmap overlay |
| — | v0.6 | WMO layout added, two-page planner architecture |
| — | v0.7 | Landing page, theme system (blue/berry), EN/NL localization |
| — | v0.8 | Mobile-first UI, RESET dialog, status chip, metric pills, pointer coords |
| — | v0.9 | Distance calibration anchors, meters display |
| — | v1.0 | GitHub Pages deployment, README completed |
| Apr 2026 | v1.1 | ROADMAP.md created — development history and implementation guide |
| Apr 2026 | v1.2 | Research Mode added: timer, stop tracking, obstruction logging, CSV export, EN/NL translations |
| May 2026 | v1.2.1 | Research Mode toggle hidden by default (no JS flash); initial state set in HTML |
| May 2026 | v1.3 | Fix: metrics not showing after GO — removed early return in `updateRouteSummary` gated on missing `routeSummary` element |
| May 2026 | v1.3.1 | Fix: all translation keys rendered as raw strings on GitHub Pages — added `defer` to `script.js` to enforce load order after `theme.js` |

---

*This document will be updated continuously as the project grows. New features, UX changes, congestion data revisions, and deployment decisions should all be logged here.*
