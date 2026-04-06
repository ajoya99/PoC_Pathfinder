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
