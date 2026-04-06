# DC PATHFINDER PoC

This repository now contains only the Proof of Concept route planner flow:

- Home: index.html
- ZV planner: zv.html
- WMO planner: wmo.html

## Features

- Interactive route planning on both layouts
- One start cell plus multiple stop cells
- Optional final stop marker (double-click to set L)
- Best route selection by:
  - Fewest steps
  - Then fewest turns
- Algorithm comparison:
  - BFS
  - Dijkstra
  - Greedy Best-First
  - A*
- Theme and language toggle support

## Run locally

From the project folder:

```powershell
npm install
npm start
```

Server runs on port 8080 by default.

Open on your computer:

```text
http://localhost:8080
```

## Access from your phone (same Wi-Fi)

1. Find your computer local IPv4 address.
2. Keep the server running.
3. On your phone browser open:

```text
http://YOUR_PC_IP:8080
```

Example:

```text
http://192.168.1.35:8080
```

If it does not load, allow Node.js through Windows Firewall for private networks.

## Publish to a URL with GitHub Pages

This project is configured to deploy as a static site with GitHub Pages.

How it works:

1. Push to `main`
2. GitHub Actions publishes files to the `gh-pages` branch
3. GitHub gives you a URL like:

```text
https://YOUR_GITHUB_USERNAME.github.io/PoC_Pathfinder/
```

For this repository, the expected URL format is:

```text
https://ajoya99.github.io/PoC_Pathfinder/
```

To enable it the first time:

1. Open your GitHub repository
2. Go to Settings > Pages
3. Under Source, choose Deploy from a branch
4. Branch: `gh-pages` and folder: `/ (root)`

After the workflow finishes, open the GitHub Pages URL on your phone browser.

Notes:

- No Azure deployment token is needed
- The local Express server is only for local testing
- GitHub Pages is the easiest way to get a stable shareable URL for this PoC
