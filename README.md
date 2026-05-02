# DC Pathfinder PoC

Interactive route-planning proof of concept for two warehouse layouts:

- ZV
- WMO

The app is a static web application and is deployed with GitHub Pages.

## Overview

Users can:

- Select a START cell on the grid.
- Add up to 12 pick locations.
- Optionally mark a final drop cell (L).
- Compare route outcomes across BFS, Dijkstra, Greedy Best-First, and A*.
- Tune route behavior with route goal, zone constraint, and traffic window.
- Toggle traffic heatmap overlay.
- View effort, turns, and estimated time range.
- Switch language (EN/NL) and theme (blue/berry).

## Run Locally (No Node Required)

This project needs an HTTP server because CSV files are fetched at runtime. Do not open files directly with file://.

Use any static server. Example with Python:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## How To Use

1. Open the landing page and choose ZV or WMO.
2. Tap one free cell (value 0) to set START.
3. Tap free cells to add pick locations.
4. Optional final drop (L):
   - Tap MARK FINAL DROP and then tap a pick location, or
   - Double-tap a pick location.
5. Choose route settings:
   - Route goal (Balanced / Fastest / Least turns)
   - Zone constraint
   - Traffic window
   - Heatmap toggle
6. Tap GO.
7. Use RESET or UNDO LAST PICK as needed.

Rules:

- Only cells with value 0 are walkable.
- Maximum pick locations is 12.
- START cannot be used as final drop L.

## Route Engine Summary

- Route candidates are computed for all four algorithms.
- For multi-stop planning, stop order is optimized with memoization and path segment caching.
- Final ranking uses effort, turns, and route-goal mode.
- Zone penalties and congestion penalties are included in route scoring.
- If no full route exists, blocked selections are reported.

## Traffic, Effort, and Metrics

- Layout-specific congestion profiles exist for ZV and WMO.
- Time windows:
  - Morning
  - Midday
  - Afternoon
- Congestion zones are modeled with circles and ratio-based rectangles.
- Effort includes movement cost, turn cost, zone penalties, and congestion penalties.

Displayed output:

- Effort (EU)
- Turns
- Time range (sec/min)

## Localization and Theme

- Translations: English and Dutch.
- Themes: blue and berry.
- Theme and language are persisted in localStorage.

## Project Structure

```text
PoC_Pathfinder/
  index.html                    # Landing page
  zv.html                       # ZV planner
  wmo.html                      # WMO planner
  script.js                     # Planner logic and algorithms
  theme.js                      # i18n and theme/language toggles
  styles.css                    # Shared UI styling
  data/
    ZV_layout.csv               # ZV grid layout
    WMO_layout.csv              # WMO grid layout
    logo_medux.png              # Logo asset
  .github/workflows/
    deploy-pages.yml            # GitHub Pages deployment workflow
```

## Deployment

Deployment target: GitHub Pages only.

Workflow:

- .github/workflows/deploy-pages.yml

On push to main, the workflow publishes the site to gh-pages.

URL pattern:

```text
https://<github-username>.github.io/PoC_Pathfinder/
```

## Troubleshooting

- Layout not loading:
  - Ensure the site is served over HTTP.
  - Ensure CSV files are present in data/.
- Cannot open on phone:
  - Use your computer IPv4 on same Wi-Fi.
  - Allow local server through firewall if needed.
- No route found:
  - Remove blocked picks and try again.
