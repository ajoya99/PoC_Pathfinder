const DEFAULT_GRID_SIZE = Number(document.body.dataset.gridSize || 33);
const DATA_FILE = document.body.dataset.layout || "data/ZV_layout.csv";
const LAYOUT_CODE = DATA_FILE.toLowerCase().includes("wmo") ? "WMO" : "ZV";
const DIRECTIONS = [
  { dr: -1, dc: 0, key: "U" },
  { dr: 0, dc: 1, key: "R" },
  { dr: 1, dc: 0, key: "D" },
  { dr: 0, dc: -1, key: "L" },
];
const MAX_PICK_LOCATIONS = 12;
const EFFORT_MODEL = {
  baseMove: 1,
  centerBandMultiplier: 1.16,
  outerBandMultiplier: 1.04,
  turnPenalty: 0.35,
  zonePenaltyWeight: 0.8,
  congestionPenaltyWeight: 1,
  secondsPerEffortByMode: {
    balanced: 2.2,
    fastest: 2.0,
    "least-turns": 2.35,
  },
  minRangeFactor: 0.85,
  maxRangeFactor: 1.2,
};

// Layout calibration references from plan measurements.
// Coordinates are 1-based in Col-Row form, with edge anchors.
const DISTANCE_CALIBRATION = {
  ZV: {
    references: [
      {
        from: { col: 31, row: 31, edge: "bottom" },
        to: { col: 31, row: 7, edge: "top" },
        meters: 70,
      },
      {
        from: { col: 6, row: 31, edge: "left" },
        to: { col: 31, row: 31, edge: "right" },
        meters: 47,
      },
      {
        from: { col: 10, row: 28, edge: "bottom" },
        to: { col: 10, row: 11, edge: "top" },
        meters: 40,
      },
      {
        from: { col: 10, row: 11, edge: "left" },
        to: { col: 18, row: 11, edge: "right" },
        meters: 12,
      },
      {
        from: { col: 19, row: 7, edge: "left" },
        to: { col: 31, row: 8, edge: "right" },
        meters: 25,
      },
    ],
    fallback: {
      horizontalMetersPerCell: 1.8,
      verticalMetersPerCell: 2.6,
    },
  },
};

// Phase 1 congestion intelligence for picker routing.
// Coordinates are zero-based and can be tuned as operations evolve.
const CONGESTION_INTELLIGENCE = {
  ZV: {
    densityScale: 1.2,
    allDay: [
      {
        kind: "circle",
        row: 9,
        col: 19,
        radius: 3,
        penalty: 1.35,
        note: "Mid-top flow congestion from products around R10/C20.",
      },
    ],
    windows: {
      morning: [
        {
          kind: "rectRatio",
          rowStartRatio: 0.62,
          rowEndRatio: 1,
          colStartRatio: 0,
          colEndRatio: 0.55,
          penalty: 1.3,
          note: "Bottom delivery/truck arrival zone gets crowded.",
        },
      ],
      midday: [
        {
          kind: "circle",
          row: 11,
          col: 10,
          radius: 3,
          penalty: 1.6,
          note: "Top-middle-right product placement wave around R12/C11.",
        },
      ],
      afternoon: [],
    },
    bottlenecks: [
      {
        kind: "circle",
        row: 9,
        col: 19,
        radius: 1,
        penalty: 1.5,
        note: "Persistent choke point near mid-top crossing.",
      },
      {
        kind: "circle",
        row: 11,
        col: 10,
        radius: 1,
        penalty: 1.05,
        note: "Midday bottleneck cluster near top-middle-right.",
      },
    ],
  },
  WMO: {
    densityScale: 0.75,
    allDay: [
      {
        kind: "circle",
        row: 10,
        col: 13,
        radius: 3,
        penalty: 1.05,
        note: "Top-middle-left outbound cleaning and inspection flow.",
      },
    ],
    windows: {
      morning: [
        {
          kind: "rectRatio",
          rowStartRatio: 0.6,
          rowEndRatio: 1,
          colStartRatio: 0,
          colEndRatio: 0.4,
          penalty: 0.95,
          note: "Lower-left delivery activity in the morning.",
        },
      ],
      midday: [],
      afternoon: [],
    },
    bottlenecks: [
      {
        kind: "circle",
        row: 10,
        col: 13,
        radius: 1,
        penalty: 0.9,
        note: "Daily narrow flow near inspection output.",
      },
    ],
  },
};

const gridElement = document.getElementById("grid");
const goButton = document.getElementById("goButton");
const undoButton = document.getElementById("undoButton");
const resetButton = document.getElementById("resetButton");
const statusChip = document.getElementById("statusChip");
const routeSummary = document.getElementById("routeSummary");
const metricTime = document.getElementById("metricTime");
const metricMeters = document.getElementById("metricMeters");
const metricEffort = document.getElementById("metricEffort");
const metricTurns = document.getElementById("metricTurns");
const routeModeSelect = document.getElementById("routeModeSelect");
const zoneConstraintSelect = document.getElementById("zoneConstraintSelect");
const trafficTimeSelect = document.getElementById("trafficTimeSelect");
const heatmapToggle = document.getElementById("heatmapToggle");
const markLastToggle = document.getElementById("markLastToggle");
const pointerCoords = document.getElementById("pointerCoords");
const resetDialog = document.getElementById("resetDialog");
const clearRouteButton = document.getElementById("clearRouteButton");
const clearAllButton = document.getElementById("clearAllButton");
const cancelResetButton = document.getElementById("cancelResetButton");
const t = (key, params = {}) =>
  typeof window.__meduxTranslate === "function" ? window.__meduxTranslate(key, params) : key;
const DISTANCE_SCALE = resolveDistanceScale(LAYOUT_CODE);

let currentGridSize = DEFAULT_GRID_SIZE;
let gridData = buildDefaultGrid(currentGridSize);
let startCell = null;
let goalCells = [];
let lastGoalCell = null;
let bestPath = [];
let bestVisitOrder = [];
let clickTimer = null;
let pendingLastPlacement = false;
let unreachableGoalKeys = new Set();
let lastStatusKey = "status.loading";
let lastStatusParams = {};
let lastRouteResult = null;
let showHeatmapOverlay = true;

bootstrap();

async function bootstrap() {
  showHeatmapOverlay = heatmapToggle?.checked ?? true;

  goButton.addEventListener("click", runPlanner);
  undoButton?.addEventListener("click", undoLastPickLocation);
  resetButton.addEventListener("click", openResetDialog);
  clearRouteButton?.addEventListener("click", clearRouteOnly);
  clearAllButton?.addEventListener("click", () => {
    hideResetDialog();
    resetSelections();
  });
  cancelResetButton?.addEventListener("click", hideResetDialog);
  resetDialog?.addEventListener("click", (event) => {
    if (event.target === resetDialog) {
      hideResetDialog();
    }
  });

  routeModeSelect?.addEventListener("change", () => {
    if (lastRouteResult) {
      updateRouteSummary();
    }
  });

  zoneConstraintSelect?.addEventListener("change", () => {
    clearPlannedRoute();
    unreachableGoalKeys = new Set();
    renderGrid();
    updateRouteSummary();
    setStatusKey("status.zoneConstraintChanged", { value: getZoneLabel(getZoneConstraintMode()) });
  });

  trafficTimeSelect?.addEventListener("change", () => {
    clearPlannedRoute();
    unreachableGoalKeys = new Set();
    renderGrid();
    updateRouteSummary();
    setStatusKey("status.trafficChanged", { value: getTrafficLabel(getTrafficWindow()) });
  });

  heatmapToggle?.addEventListener("change", () => {
    showHeatmapOverlay = Boolean(heatmapToggle.checked);
    renderGrid();
    setStatusKey(showHeatmapOverlay ? "status.heatmapOn" : "status.heatmapOff");
  });

  markLastToggle?.addEventListener("click", toggleFinalDropPlacementMode);
  window.addEventListener("medux:languagechange", handleLanguageChange);

  renderGrid();
  updateRouteSummary();
  await loadStoredLayout();
}

async function loadStoredLayout() {
  try {
    const response = await fetch(DATA_FILE, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load ${DATA_FILE} (${response.status}).`);
    }

    const text = await response.text();
    gridData = parseCsv(text);
    currentGridSize = gridData.length;
    resetSelections();
    setStatusKey("status.loaded");
  } catch (error) {
    currentGridSize = DEFAULT_GRID_SIZE;
    gridData = buildDefaultGrid(currentGridSize);
    renderGrid();
    setStatusKey("status.fallback", { file: DATA_FILE });
    console.error(error);
  }
}

function buildDefaultGrid(size = currentGridSize) {
  const grid = Array.from({ length: size }, () => Array(size).fill(0));

  if (size !== 33) {
    return grid;
  }

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      let value = 0;

      if ((row === 8 || row === 24) && col > 2 && col < 30 && col !== 10 && col !== 22) {
        value = 4;
      }

      if ((col === 6 || col === 16 || col === 26) && row > 4 && row < 29 && ![12, 20, 27].includes(row)) {
        value = col === 16 ? 7 : 3;
      }

      if (row > 12 && row < 19 && col > 10 && col < 21 && !(row === 15 && (col === 15 || col === 16))) {
        value = row % 2 === 0 ? 6 : 2;
      }

      if ((row < 4 || row > 28) && col % 7 === 0 && col !== 0 && col !== 32) {
        value = 1;
      }

      grid[row][col] = value;
    }
  }

  grid[1][1] = 0;
  grid[31][31] = 0;
  grid[16][16] = 0;
  grid[8][10] = 0;
  grid[8][22] = 0;
  grid[24][10] = 0;
  grid[24][22] = 0;

  return grid;
}

function parseCsv(text) {
  const rows = String(text)
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length !== DEFAULT_GRID_SIZE) {
    throw new Error(`CSV for ${LAYOUT_CODE} must contain exactly ${DEFAULT_GRID_SIZE} rows.`);
  }

  return rows.map((line, rowIndex) => {
    const values = line.split(/[,;\s]+/).filter(Boolean);

    if (values.length !== DEFAULT_GRID_SIZE) {
      throw new Error(`Row ${rowIndex + 1} must contain exactly ${DEFAULT_GRID_SIZE} values.`);
    }

    return values.map((value, colIndex) => {
      const num = Number(value);
      if (!Number.isInteger(num) || num < 0 || num > 9) {
        throw new Error(`Invalid value at row ${rowIndex + 1}, column ${colIndex + 1}. Use only 0-9.`);
      }
      return num;
    });
  });
}

function clearPlannedRoute() {
  bestPath = [];
  bestVisitOrder = [];
  lastRouteResult = null;
}

function openResetDialog() {
  if (!resetDialog) {
    resetSelections();
    return;
  }
  resetDialog.hidden = false;
}

function hideResetDialog() {
  if (resetDialog) {
    resetDialog.hidden = true;
  }
}

function clearRouteOnly() {
  hideResetDialog();
  clearPlannedRoute();
  unreachableGoalKeys = new Set();
  renderGrid();
  updateRouteSummary();
  setStatusKey("status.routeCleared");
}

function setPendingLastPlacement(enabled) {
  pendingLastPlacement = Boolean(enabled);
  if (markLastToggle) {
    markLastToggle.classList.toggle("is-active", pendingLastPlacement);
    markLastToggle.setAttribute("aria-pressed", pendingLastPlacement ? "true" : "false");
  }
}

function toggleFinalDropPlacementMode() {
  const nextValue = !pendingLastPlacement;
  setPendingLastPlacement(nextValue);
  setStatusKey(nextValue ? "status.finalModeOn" : "status.finalModeOff");
}

function undoLastPickLocation() {
  if (!goalCells.length) {
    setStatusKey("status.nothingToUndo");
    return;
  }

  const removed = goalCells.pop();
  if (lastGoalCell && sameCell(lastGoalCell, removed)) {
    lastGoalCell = null;
  }

  clearPlannedRoute();
  unreachableGoalKeys = new Set();
  renderGrid();
  updateRouteSummary();
  setStatusKey("status.pickRemoved", { row: removed.row + 1, col: removed.col + 1 });
}

function handleCellClick(row, col, options = {}) {
  const clicked = { row, col };
  const effectiveMarkAsLast = options.markAsLast || pendingLastPlacement;

  if (gridData[row][col] !== 0) {
    setStatusKey("status.onlyFree");
    return;
  }

  if (!startCell) {
    startCell = clicked;
    clearPlannedRoute();
    unreachableGoalKeys = new Set();
    updateRouteSummary();
    setStatusKey("status.startPlaced", { row: row + 1, col: col + 1 });
    renderGrid();
    return;
  }

  if (sameCell(clicked, startCell)) {
    setStatusKey(effectiveMarkAsLast ? "status.startCannotBeLast" : "status.startLocked");
    return;
  }

  const existingGoalIndex = goalCells.findIndex((goal) => sameCell(goal, clicked));

  if (effectiveMarkAsLast) {
    if (existingGoalIndex < 0) {
      if (goalCells.length >= MAX_PICK_LOCATIONS) {
        setStatusKey("status.maxPickLocations", { max: MAX_PICK_LOCATIONS });
        return;
      }
      goalCells.push(clicked);
    }

    lastGoalCell = { ...clicked };
    clearPlannedRoute();
    unreachableGoalKeys = new Set();
    updateRouteSummary();
    setPendingLastPlacement(false);
    setStatusKey("status.finalDropSet", { row: row + 1, col: col + 1 });
    renderGrid();
    return;
  }

  if (existingGoalIndex >= 0) {
    goalCells.splice(existingGoalIndex, 1);

    const removedFinalDrop = lastGoalCell && sameCell(lastGoalCell, clicked);
    if (removedFinalDrop) {
      lastGoalCell = null;
    }

    clearPlannedRoute();
    unreachableGoalKeys = new Set();
    updateRouteSummary();
    setStatusKey(removedFinalDrop ? "status.finalDropRemoved" : "status.pickRemoved", {
      row: row + 1,
      col: col + 1,
    });
    renderGrid();
    return;
  }

  if (goalCells.length >= MAX_PICK_LOCATIONS) {
    setStatusKey("status.maxPickLocations", { max: MAX_PICK_LOCATIONS });
    return;
  }

  goalCells.push(clicked);
  clearPlannedRoute();
  unreachableGoalKeys = new Set();
  updateRouteSummary();
  setStatusKey("status.pickAdded", { count: goalCells.length, row: row + 1, col: col + 1 });
  renderGrid();
}

function handleCellDoubleClick(row, col) {
  handleCellClick(row, col, { markAsLast: true });
}

function runPlanner() {
  if (!startCell) {
    setStatusKey("status.pickStart");
    return;
  }

  if (goalCells.length === 0) {
    setStatusKey("status.addDestination");
    return;
  }

  const strategies = [
    { name: "BFS", search: bfsSearch },
    { name: "Dijkstra", search: (_grid, start, goal) => informedSearch(start, goal, "dijkstra") },
    { name: "Greedy Best-First", search: (_grid, start, goal) => informedSearch(start, goal, "greedy") },
    { name: "A*", search: (_grid, start, goal) => informedSearch(start, goal, "astar") },
  ];

  const routeMode = getRouteMode();
  const zoneConstraint = getZoneConstraintMode();
  const trafficWindow = getTrafficWindow();
  const results = strategies.map((strategy) => buildMultiStopRoute(strategy));
  const validResults = results
    .filter((result) => result.reachedAll)
    .map((result) => {
      const zonePenalty = computeZonePenalty(result.path, zoneConstraint);
      const congestionPenalty = computeCongestionPenalty(result.path, trafficWindow);
      const effortUnits = computeEffortUnits(result.path, result.turns, zonePenalty, congestionPenalty);
      const distanceMeters = computePathDistanceMeters(result.path);
      const timeRange = computeEstimatedTimeRangeSeconds(effortUnits, routeMode);

      return {
        ...result,
        zonePenalty,
        congestionPenalty,
        effortUnits,
        distanceMeters,
        ...timeRange,
        score: computeRouteScore(result, routeMode, effortUnits),
      };
    });

  if (!validResults.length) {
    bestPath = [];
    bestVisitOrder = [];
    lastRouteResult = null;
    unreachableGoalKeys = new Set(findUnreachablePickLocations().map(cellKey));
    renderGrid();
    updateRouteSummary();

    const blocked = Array.from(unreachableGoalKeys)
      .slice(0, 3)
      .map((key) => formatCellLabel(parseCellKey(key)))
      .join(", ");

    setStatusKey(
      blocked.length ? "status.noRouteHint" : "status.noRoute",
      blocked.length ? { picks: blocked } : {},
    );
    return;
  }

  validResults.sort((left, right) => {
    return (
      left.score - right.score ||
      left.effortUnits - right.effortUnits ||
      left.steps - right.steps ||
      left.turns - right.turns ||
      Number(left.elapsed || 0) - Number(right.elapsed || 0)
    );
  });

  const best = validResults[0];
  bestPath = best.path;
  bestVisitOrder = best.visitOrder;
  unreachableGoalKeys = new Set();
  lastRouteResult = {
    algorithm: best.name,
    steps: best.steps,
    turns: best.turns,
    effortUnits: best.effortUnits,
    distanceMeters: best.distanceMeters,
    timeMinSeconds: best.minSeconds,
    timeMaxSeconds: best.maxSeconds,
    score: best.score,
    zonePenalty: best.zonePenalty,
    congestionPenalty: best.congestionPenalty,
    routeMode,
    zoneConstraint,
    trafficWindow,
  };

  renderGrid();
  updateRouteSummary();
  setStatusKey("status.routeReady");
}

function buildMultiStopRoute(strategy) {
  const startedAt = performance.now();
  const routeCache = new Map();
  const allVisitedMask = (1 << goalCells.length) - 1;
  const lastGoalIndex = lastGoalCell ? goalCells.findIndex((goal) => sameCell(goal, lastGoalCell)) : -1;
  const memo = new Map();

  function getSegment(from, to) {
    const key = `${cellKey(from)}->${cellKey(to)}`;
    if (routeCache.has(key)) {
      return routeCache.get(key);
    }

    const path = strategy.search(gridData, from, to);
    if (!path || !path.length) {
      routeCache.set(key, null);
      return null;
    }

    const directions = getPathDirections(path);
    const segment = {
      path,
      steps: path.length - 1,
      turns: countTurns(path),
      firstDir: directions.firstDir,
      lastDir: directions.lastDir,
    };

    routeCache.set(key, segment);
    return segment;
  }

  function search(current, visitedMask, incomingDir) {
    const memoKey = `${cellKey(current)}|${visitedMask}|${incomingDir}`;
    if (memo.has(memoKey)) {
      return memo.get(memoKey);
    }

    if (visitedMask === allVisitedMask) {
      const complete = {
        reachable: true,
        steps: 0,
        turns: 0,
        visitOrder: [],
        segments: [],
      };
      memo.set(memoKey, complete);
      return complete;
    }

    let best = null;

    for (let index = 0; index < goalCells.length; index += 1) {
      if (visitedMask & (1 << index)) {
        continue;
      }

      const mustStayForLast =
        lastGoalIndex >= 0 &&
        index === lastGoalIndex &&
        visitedMask !== (allVisitedMask ^ (1 << lastGoalIndex));
      if (mustStayForLast) {
        continue;
      }

      const target = goalCells[index];
      const segment = getSegment(current, target);
      if (!segment) {
        continue;
      }

      const remainder = search(target, visitedMask | (1 << index), segment.lastDir || incomingDir);
      if (!remainder?.reachable) {
        continue;
      }

      const junctionTurn = incomingDir !== "S" && segment.firstDir && incomingDir !== segment.firstDir ? 1 : 0;
      const candidate = {
        reachable: true,
        steps: segment.steps + remainder.steps,
        turns: segment.turns + junctionTurn + remainder.turns,
        visitOrder: [{ ...target }, ...remainder.visitOrder],
        segments: [segment.path, ...remainder.segments],
      };

      if (!best || compareMetrics(candidate, best) < 0) {
        best = candidate;
      }
    }

    const result =
      best ||
      {
        reachable: false,
        steps: Infinity,
        turns: Infinity,
        visitOrder: [],
        segments: [],
      };

    memo.set(memoKey, result);
    return result;
  }

  const optimized = search(startCell, 0, "S");
  if (!optimized.reachable) {
    return {
      name: strategy.name,
      reachedAll: false,
      visitedCount: 0,
      visitOrder: [],
      orderLabels: [],
      path: [],
      steps: Infinity,
      turns: Infinity,
      elapsed: (performance.now() - startedAt).toFixed(2),
    };
  }

  const path = [{ ...startCell }];
  for (const segment of optimized.segments) {
    path.push(...segment.slice(1));
  }

  const orderLabels = optimized.visitOrder.map(
    (goal) => goalCells.findIndex((candidate) => sameCell(candidate, goal)) + 1,
  );

  return {
    name: strategy.name,
    reachedAll: true,
    visitedCount: optimized.visitOrder.length,
    visitOrder: optimized.visitOrder,
    orderLabels,
    path,
    steps: path.length - 1,
    turns: countTurns(path),
    elapsed: (performance.now() - startedAt).toFixed(2),
  };
}

function bfsSearch(_grid, start, goal) {
  const queue = [{ ...start }];
  const visited = new Set([cellKey(start)]);
  const cameFrom = new Map();

  while (queue.length) {
    const current = queue.shift();
    if (sameCell(current, goal)) {
      return reconstructCellPath(cameFrom, start, goal);
    }

    const neighbors = getNeighbors(current, goal);
    for (const next of neighbors) {
      const key = cellKey(next);
      if (visited.has(key)) {
        continue;
      }

      visited.add(key);
      cameFrom.set(key, cellKey(current));
      queue.push({ row: next.row, col: next.col });
    }
  }

  return null;
}

function informedSearch(start, goal, mode) {
  const frontier = [{ row: start.row, col: start.col, dir: "S", steps: 0, turns: 0, priority: 0 }];
  const bestScores = new Map([[stateKey(start.row, start.col, "S"), { steps: 0, turns: 0 }]]);
  const cameFrom = new Map();

  while (frontier.length) {
    frontier.sort((a, b) => a.priority - b.priority || a.steps - b.steps || a.turns - b.turns);
    const current = frontier.shift();

    if (current.row === goal.row && current.col === goal.col) {
      return reconstructStatePath(cameFrom, stateKey(current.row, current.col, current.dir));
    }

    for (const next of getNeighbors(current, goal)) {
      const nextSteps = current.steps + 1;
      const nextTurns = current.turns + (current.dir !== "S" && current.dir !== next.dir ? 1 : 0);
      const nextState = stateKey(next.row, next.col, next.dir);
      const previous = bestScores.get(nextState);

      if (previous && (previous.steps < nextSteps || (previous.steps === nextSteps && previous.turns <= nextTurns))) {
        continue;
      }

      bestScores.set(nextState, { steps: nextSteps, turns: nextTurns });
      cameFrom.set(nextState, stateKey(current.row, current.col, current.dir));

      const heuristic = manhattan(next, goal);
      const zonePenalty = zonePenaltyForCell(next.row, getZoneConstraintMode());
      const congestionPenalty = congestionPenaltyForCell(next.row, next.col, getTrafficWindow());
      const priority =
        mode === "greedy"
          ? heuristic + nextTurns * 0.001 + zonePenalty + congestionPenalty
          : mode === "dijkstra"
            ? nextSteps + nextTurns * 0.001 + zonePenalty + congestionPenalty
            : nextSteps + heuristic + nextTurns * 0.001 + zonePenalty + congestionPenalty;

      frontier.push({
        row: next.row,
        col: next.col,
        dir: next.dir,
        steps: nextSteps,
        turns: nextTurns,
        priority,
      });
    }
  }

  return null;
}

function reconstructCellPath(cameFrom, start, goal) {
  const path = [{ ...goal }];
  let currentKey = cellKey(goal);

  while (currentKey !== cellKey(start)) {
    const previousKey = cameFrom.get(currentKey);
    if (!previousKey) {
      return null;
    }
    path.push(parseCellKey(previousKey));
    currentKey = previousKey;
  }

  return path.reverse();
}

function reconstructStatePath(cameFrom, finalStateKey) {
  const path = [];
  let currentKey = finalStateKey;

  while (currentKey) {
    const { row, col } = parseStateKey(currentKey);
    path.push({ row, col });
    currentKey = cameFrom.get(currentKey);
  }

  return path.reverse().filter((cell, index, array) => index === 0 || !sameCell(cell, array[index - 1]));
}

function getNeighbors(cell, goal) {
  const zoneConstraint = getZoneConstraintMode();
  const trafficWindow = getTrafficWindow();
  return DIRECTIONS
    .map((direction) => ({
      row: cell.row + direction.dr,
      col: cell.col + direction.dc,
      dir: direction.key,
    }))
    .filter((next) => isWalkable(next.row, next.col))
    .sort(
      (a, b) =>
        manhattan(a, goal) + zonePenaltyForCell(a.row, zoneConstraint) + congestionPenaltyForCell(a.row, a.col, trafficWindow) -
        (manhattan(b, goal) + zonePenaltyForCell(b.row, zoneConstraint) + congestionPenaltyForCell(b.row, b.col, trafficWindow)),
    );
}

function isWalkable(row, col) {
  return row >= 0 && row < currentGridSize && col >= 0 && col < currentGridSize && gridData[row][col] === 0;
}

function renderGrid() {
  const routeSet = new Set(bestPath.map(cellKey));
  const displayedGoals = bestVisitOrder.length === goalCells.length ? bestVisitOrder : goalCells;
  const numberedGoals = displayedGoals.filter((goal) => !sameCell(goal, lastGoalCell));

  gridElement.style.gridTemplateColumns = `repeat(${currentGridSize}, 1fr)`;
  gridElement.setAttribute("aria-label", t("grid.aria", { size: currentGridSize }));
  gridElement.innerHTML = "";
  setPointerCoordsText();

  for (let row = 0; row < currentGridSize; row += 1) {
    for (let col = 0; col < currentGridSize; col += 1) {
      const value = gridData[row][col];
      const currentCell = { row, col };
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "grid-cell";
      cell.setAttribute("aria-label", t("grid.cellAria", { row: row + 1, col: col + 1, value }));
      cell.addEventListener("mouseenter", () => setPointerCoordsText(row, col));
      cell.addEventListener("focus", () => setPointerCoordsText(row, col));
      cell.addEventListener("pointerdown", () => setPointerCoordsText(row, col));

      if (value === 0) {
        cell.classList.add("free");

        if (showHeatmapOverlay) {
          const heatClass = getHeatClassForCell(row, col, getTrafficWindow());
          if (heatClass) {
            cell.classList.add(heatClass);
          }
        }

        if (routeSet.has(`${row},${col}`)) {
          cell.classList.add("route");
        }

        if (startCell && sameCell(startCell, currentCell)) {
          cell.classList.add("start");
          cell.textContent = "S";
        } else if (lastGoalCell && sameCell(lastGoalCell, currentCell)) {
          cell.classList.add("goal-last");
          cell.textContent = "L";
        } else {
          const goalIndex = numberedGoals.findIndex((goal) => sameCell(goal, currentCell));
          if (goalIndex >= 0) {
            cell.classList.add("goal");
            cell.textContent = String(goalIndex + 1);

            if (unreachableGoalKeys.has(cellKey(currentCell))) {
              cell.classList.add("goal-unreachable");
            }
          }
        }

        cell.addEventListener("click", () => {
          if (clickTimer) {
            window.clearTimeout(clickTimer);
          }

          clickTimer = window.setTimeout(() => {
            handleCellClick(row, col);
            clickTimer = null;
          }, 140);
        });

        cell.addEventListener("dblclick", (event) => {
          event.preventDefault();
          if (clickTimer) {
            window.clearTimeout(clickTimer);
            clickTimer = null;
          }
          handleCellDoubleClick(row, col);
        });
      } else {
        cell.classList.add("obstacle", `obstacle-${value}`);
      }

      gridElement.appendChild(cell);
    }
  }
}

function resetSelections() {
  startCell = null;
  goalCells = [];
  lastGoalCell = null;
  clearPlannedRoute();
  unreachableGoalKeys = new Set();
  setPendingLastPlacement(false);

  renderGrid();
  updateRouteSummary();
  setStatusKey("status.selectionsCleared");
}

function compareMetrics(a, b) {
  return a.steps - b.steps || a.turns - b.turns;
}

function getPathDirections(path) {
  if (!path || path.length < 2) {
    return { firstDir: "", lastDir: "" };
  }

  return {
    firstDir: directionBetween(path[0], path[1]),
    lastDir: directionBetween(path[path.length - 2], path[path.length - 1]),
  };
}

function countTurns(path) {
  if (!path || path.length < 3) {
    return 0;
  }

  let turns = 0;
  for (let index = 2; index < path.length; index += 1) {
    const a = path[index - 2];
    const b = path[index - 1];
    const c = path[index];

    const firstVector = [b.row - a.row, b.col - a.col];
    const secondVector = [c.row - b.row, c.col - b.col];

    if (firstVector[0] !== secondVector[0] || firstVector[1] !== secondVector[1]) {
      turns += 1;
    }
  }

  return turns;
}

function directionBetween(from, to) {
  const match = DIRECTIONS.find(
    (direction) => direction.dr === to.row - from.row && direction.dc === to.col - from.col,
  );
  return match ? match.key : "S";
}

function manhattan(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function zonePenaltyForCell(row, zoneConstraintMode = getZoneConstraintMode()) {
  const half = currentGridSize / 2;
  const isTop = row < half;

  if (zoneConstraintMode === "prefer-top") {
    return isTop ? 0 : 0.7;
  }

  if (zoneConstraintMode === "prefer-bottom") {
    return isTop ? 0.7 : 0;
  }

  if (zoneConstraintMode === "avoid-top") {
    return isTop ? 1.4 : 0;
  }

  if (zoneConstraintMode === "avoid-bottom") {
    return isTop ? 0 : 1.4;
  }

  return 0;
}

function computeZonePenalty(path, zoneConstraintMode) {
  if (!Array.isArray(path) || path.length < 2 || zoneConstraintMode === "none") {
    return 0;
  }

  return Number(
    path
      .slice(1)
      .reduce((total, cell) => total + zonePenaltyForCell(cell.row, zoneConstraintMode), 0)
      .toFixed(2),
  );
}

function computeRouteScore(result, routeMode, effortUnits) {
  if (routeMode === "fastest") {
    return effortUnits * 0.96 + result.turns * 0.1;
  }

  if (routeMode === "least-turns") {
    return effortUnits + result.turns * 0.6;
  }

  return effortUnits + result.turns * 0.25;
}

function computeEffortUnits(path, turns, zonePenalty, congestionPenalty = 0) {
  if (!Array.isArray(path) || path.length < 2) {
    return 0;
  }

  const travelEffort = path.slice(1).reduce((total, cell) => {
    return total + EFFORT_MODEL.baseMove * stepEffortMultiplier(cell.row);
  }, 0);

  const effort =
    travelEffort +
    turns * EFFORT_MODEL.turnPenalty +
    zonePenalty * EFFORT_MODEL.zonePenaltyWeight +
    congestionPenalty * EFFORT_MODEL.congestionPenaltyWeight;
  return Number(effort.toFixed(1));
}

function stepEffortMultiplier(row) {
  const mid = (currentGridSize - 1) / 2;
  const centerBand = currentGridSize * 0.22;
  return Math.abs(row - mid) <= centerBand ? EFFORT_MODEL.centerBandMultiplier : EFFORT_MODEL.outerBandMultiplier;
}

function computeEstimatedTimeRangeSeconds(effortUnits, routeMode) {
  const secondsPerEffort = EFFORT_MODEL.secondsPerEffortByMode[routeMode] || EFFORT_MODEL.secondsPerEffortByMode.balanced;
  const baseSeconds = Math.max(0, effortUnits * secondsPerEffort);
  return {
    minSeconds: Math.round(baseSeconds * EFFORT_MODEL.minRangeFactor),
    maxSeconds: Math.round(baseSeconds * EFFORT_MODEL.maxRangeFactor),
  };
}

function formatEffort(value) {
  const rounded = Number(value || 0).toFixed(1);
  return t("planner.effortValue", { value: rounded });
}

function formatDistanceMeters(value) {
  const rounded = Number(value || 0).toFixed(1);
  return t("planner.distanceValue", { value: rounded });
}

function formatTimeRange(minSeconds, maxSeconds) {
  if (maxSeconds < 60) {
    return t("planner.timeSecondsRange", { min: minSeconds, max: maxSeconds });
  }

  const minMinutes = (Math.max(0, minSeconds) / 60).toFixed(1);
  const maxMinutes = (Math.max(0, maxSeconds) / 60).toFixed(1);
  return t("planner.timeMinutesRange", { min: minMinutes, max: maxMinutes });
}

function getRouteMode() {
  return routeModeSelect?.value || "balanced";
}

function getZoneConstraintMode() {
  return zoneConstraintSelect?.value || "none";
}

function getTrafficWindow() {
  return trafficTimeSelect?.value || "morning";
}

function getModeLabel(mode) {
  if (mode === "fastest") {
    return t("routeMode.fastest");
  }
  if (mode === "least-turns") {
    return t("routeMode.leastTurns");
  }
  return t("routeMode.balanced");
}

function getZoneLabel(zoneConstraintMode) {
  if (zoneConstraintMode === "prefer-top") {
    return t("zone.preferTop");
  }
  if (zoneConstraintMode === "prefer-bottom") {
    return t("zone.preferBottom");
  }
  if (zoneConstraintMode === "avoid-top") {
    return t("zone.avoidTop");
  }
  if (zoneConstraintMode === "avoid-bottom") {
    return t("zone.avoidBottom");
  }
  return t("zone.none");
}

function getTrafficLabel(trafficWindow) {
  if (trafficWindow === "midday") {
    return t("traffic.midday");
  }

  if (trafficWindow === "afternoon") {
    return t("traffic.afternoon");
  }

  return t("traffic.morning");
}

function getCongestionProfile() {
  return CONGESTION_INTELLIGENCE[LAYOUT_CODE] || CONGESTION_INTELLIGENCE.ZV;
}

function computeCongestionPenalty(path, trafficWindow = getTrafficWindow()) {
  if (!Array.isArray(path) || path.length < 2) {
    return 0;
  }

  const base = path.slice(1).reduce((total, cell) => {
    return total + congestionPenaltyForCell(cell.row, cell.col, trafficWindow);
  }, 0);

  return Number(base.toFixed(2));
}

function computePathDistanceMeters(path) {
  if (!Array.isArray(path) || path.length < 2) {
    return 0;
  }

  let horizontalSteps = 0;
  let verticalSteps = 0;

  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    horizontalSteps += Math.abs((current.col ?? 0) - (previous.col ?? 0));
    verticalSteps += Math.abs((current.row ?? 0) - (previous.row ?? 0));
  }

  const meters =
    horizontalSteps * DISTANCE_SCALE.horizontalMetersPerCell +
    verticalSteps * DISTANCE_SCALE.verticalMetersPerCell;
  return Number(meters.toFixed(2));
}

function congestionPenaltyForCell(row, col, trafficWindow = getTrafficWindow()) {
  const profile = getCongestionProfile();
  const features = [
    ...(profile.allDay || []),
    ...((profile.windows && profile.windows[trafficWindow]) || []),
    ...(profile.bottlenecks || []),
  ];

  const total = features.reduce((acc, feature) => {
    return acc + congestionFeaturePenalty(feature, row, col);
  }, 0);

  return Number((total * profile.densityScale).toFixed(3));
}

function congestionFeaturePenalty(feature, row, col) {
  if (!feature || typeof feature !== "object") {
    return 0;
  }

  if (feature.kind === "circle") {
    const radius = Number(feature.radius || 0);
    const distance = Math.sqrt((row - Number(feature.row || 0)) ** 2 + (col - Number(feature.col || 0)) ** 2);
    if (distance > radius) {
      return 0;
    }

    const fade = radius > 0 ? 1 - distance / (radius + 0.0001) : 1;
    return Number(feature.penalty || 0) * Math.max(0.35, fade);
  }

  if (feature.kind === "rectRatio") {
    const maxIndex = Math.max(1, currentGridSize - 1);
    const rowStart = Math.floor((Number(feature.rowStartRatio) || 0) * maxIndex);
    const rowEnd = Math.ceil((Number(feature.rowEndRatio) || 0) * maxIndex);
    const colStart = Math.floor((Number(feature.colStartRatio) || 0) * maxIndex);
    const colEnd = Math.ceil((Number(feature.colEndRatio) || 0) * maxIndex);

    if (row >= rowStart && row <= rowEnd && col >= colStart && col <= colEnd) {
      return Number(feature.penalty || 0);
    }
  }

  return 0;
}

function getHeatClassForCell(row, col, trafficWindow = getTrafficWindow()) {
  const penalty = congestionPenaltyForCell(row, col, trafficWindow);

  if (penalty <= 0.25) {
    return "";
  }

  if (penalty <= 0.7) {
    return "heat-1";
  }

  if (penalty <= 1.2) {
    return "heat-2";
  }

  return "heat-3";
}

function updateRouteSummary() {
  if (!routeSummary) {
    return;
  }

  if (!lastRouteResult) {
    routeSummary.textContent = t("planner.summaryEmpty");
    if (metricTime) {
      metricTime.textContent = t("planner.metricEmpty");
    }
    if (metricMeters) {
      metricMeters.textContent = t("planner.metricEmpty");
    }
    if (metricTurns) {
      metricTurns.textContent = t("planner.metricEmpty");
    }
    if (metricEffort) {
      metricEffort.textContent = t("planner.metricEmpty");
    }
    return;
  }

  routeSummary.textContent = t("planner.summaryReady", {
    mode: getModeLabel(lastRouteResult.routeMode),
    zone: getZoneLabel(lastRouteResult.zoneConstraint),
    traffic: getTrafficLabel(lastRouteResult.trafficWindow),
  });

  if (metricTime) {
    metricTime.textContent = formatTimeRange(lastRouteResult.timeMinSeconds, lastRouteResult.timeMaxSeconds);
  }
  if (metricMeters) {
    metricMeters.textContent = formatDistanceMeters(lastRouteResult.distanceMeters);
  }
  if (metricTurns) {
    metricTurns.textContent = String(lastRouteResult.turns);
  }
  if (metricEffort) {
    metricEffort.textContent = formatEffort(lastRouteResult.effortUnits);
  }
}

function findUnreachablePickLocations() {
  if (!startCell) {
    return [];
  }

  return goalCells.filter((goal) => {
    const testPath = bfsSearch(gridData, startCell, goal);
    return !Array.isArray(testPath) || !testPath.length;
  });
}

function formatCellLabel(cell) {
  return `R${cell.row + 1}C${cell.col + 1}`;
}

function setPointerCoordsText(row, col) {
  if (!pointerCoords) {
    return;
  }

  if (typeof row !== "number" || typeof col !== "number") {
    pointerCoords.textContent = "Pointer: -";
    return;
  }

  pointerCoords.textContent = `Pointer: C${col + 1}-R${row + 1}`;
}

function cellKey(cell) {
  return `${cell.row},${cell.col}`;
}

function stateKey(row, col, dir) {
  return `${row},${col},${dir}`;
}

function parseCellKey(key) {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

function parseStateKey(key) {
  const [row, col] = key.split(",").map((value, index) => (index < 2 ? Number(value) : value));
  return { row, col };
}

function sameCell(a, b) {
  return a?.row === b?.row && a?.col === b?.col;
}

function handleLanguageChange() {
  renderGrid();
  updateRouteSummary();
  setStatus(t(lastStatusKey, lastStatusParams));
}

function setStatusKey(key, params = {}) {
  lastStatusKey = key;
  lastStatusParams = params;
  setStatus(t(key, params));
}

function setStatus(message) {
  if (statusChip) {
    statusChip.textContent = message;
  }
}

function resolveDistanceScale(layoutCode) {
  const calibration = DISTANCE_CALIBRATION[layoutCode];
  if (!calibration?.references?.length) {
    return {
      horizontalMetersPerCell: calibration?.fallback?.horizontalMetersPerCell || 1,
      verticalMetersPerCell: calibration?.fallback?.verticalMetersPerCell || 1,
    };
  }

  const references = calibration.references
    .map((reference) => {
      const from = edgeAnchorToPoint(reference.from);
      const to = edgeAnchorToPoint(reference.to);
      const dx = Math.abs(to.x - from.x);
      const dy = Math.abs(to.y - from.y);
      const meters = Number(reference.meters);
      if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(meters) || meters <= 0) {
        return null;
      }
      return { dx2: dx * dx, dy2: dy * dy, d2: meters * meters };
    })
    .filter(Boolean);

  if (!references.length) {
    return {
      horizontalMetersPerCell: calibration.fallback.horizontalMetersPerCell,
      verticalMetersPerCell: calibration.fallback.verticalMetersPerCell,
    };
  }

  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  let bx = 0;
  let by = 0;

  for (const reference of references) {
    sxx += reference.dx2 * reference.dx2;
    syy += reference.dy2 * reference.dy2;
    sxy += reference.dx2 * reference.dy2;
    bx += reference.dx2 * reference.d2;
    by += reference.dy2 * reference.d2;
  }

  const determinant = sxx * syy - sxy * sxy;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-9) {
    return {
      horizontalMetersPerCell: calibration.fallback.horizontalMetersPerCell,
      verticalMetersPerCell: calibration.fallback.verticalMetersPerCell,
    };
  }

  const horizontalSquared = (bx * syy - by * sxy) / determinant;
  const verticalSquared = (by * sxx - bx * sxy) / determinant;

  return {
    horizontalMetersPerCell: Math.sqrt(Math.max(0.01, horizontalSquared)),
    verticalMetersPerCell: Math.sqrt(Math.max(0.01, verticalSquared)),
  };
}

function edgeAnchorToPoint(anchor) {
  const col = Number(anchor?.col);
  const row = Number(anchor?.row);
  const edge = String(anchor?.edge || "").toLowerCase();

  if (edge === "top") {
    return { x: col - 0.5, y: row - 1 };
  }
  if (edge === "bottom") {
    return { x: col - 0.5, y: row };
  }
  if (edge === "left") {
    return { x: col - 1, y: row - 0.5 };
  }
  if (edge === "right") {
    return { x: col, y: row - 0.5 };
  }

  return { x: col - 0.5, y: row - 0.5 };
}
