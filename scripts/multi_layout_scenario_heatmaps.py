from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List

import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, ListedColormap
import numpy as np


WMO_PROFILE = {
    "densityScale": 0.85,
    "allDay": [],
    "windows": {
        "morning": [
            {"kind": "circle", "row": 10, "col": 38, "radius": 7, "penalty": 1.8},
            {"kind": "circle", "row": 10, "col": 13, "radius": 5, "penalty": 1.3},
            {"kind": "circle", "row": 29, "col": 7, "radius": 5, "penalty": 1.3},
        ],
        "midday": [
            {"kind": "circle", "row": 10, "col": 38, "radius": 5, "penalty": 1.3},
            {"kind": "circle", "row": 10, "col": 13, "radius": 5, "penalty": 1.8},
            {"kind": "circle", "row": 29, "col": 7, "radius": 4, "penalty": 1.3},
        ],
        "afternoon": [
            {"kind": "circle", "row": 10, "col": 38, "radius": 4, "penalty": 1.3},
            {"kind": "circle", "row": 10, "col": 13, "radius": 4, "penalty": 1.3},
            {"kind": "circle", "row": 29, "col": 7, "radius": 4, "penalty": 1.3},
        ],
    },
    "bottlenecks": [],
}

ZV_PROFILE = {
    "densityScale": 1.2,
    "allDay": [
        {"kind": "circle", "row": 9, "col": 19, "radius": 3, "penalty": 1.45},
        {
            "kind": "rectRatio",
            "rowStartRatio": 0.8125,
            "rowEndRatio": 0.875,
            "colStartRatio": 0.65625,
            "colEndRatio": 0.8125,
            "penalty": 1.5,
        },
    ],
    "windows": {
        "morning": [
            {
                "kind": "rectRatio",
                "rowStartRatio": 0.875,
                "rowEndRatio": 0.9375,
                "colStartRatio": 0.15625,
                "colEndRatio": 0.25,
                "penalty": 0.9,
            },
            {
                "kind": "rectRatio",
                "rowStartRatio": 0.6875,
                "rowEndRatio": 0.9375,
                "colStartRatio": 0.28125,
                "colEndRatio": 0.5625,
                "penalty": 1.5,
            },
        ],
        "midday": [
            {"kind": "circle", "row": 11, "col": 10, "radius": 3, "penalty": 1.6},
            {
                "kind": "rectRatio",
                "rowStartRatio": 0.6875,
                "rowEndRatio": 0.9375,
                "colStartRatio": 0.28125,
                "colEndRatio": 0.5625,
                "penalty": 1.1,
            },
        ],
        "afternoon": [
            {
                "kind": "rectRatio",
                "rowStartRatio": 0.6875,
                "rowEndRatio": 0.9375,
                "colStartRatio": 0.28125,
                "colEndRatio": 0.5625,
                "penalty": 1,
            }
        ],
    },
    "bottlenecks": [
        {"kind": "circle", "row": 9, "col": 19, "radius": 1, "penalty": 1.5},
        {"kind": "circle", "row": 11, "col": 10, "radius": 1, "penalty": 1.05},
    ],
}


SCENARIOS = [
    {
        "label": "S1 Opening Calm",
        "window": "morning",
        "density_factor": 0.85,
        "obstacle_factor": 0.8,
        "surge": [],
    },
    {
        "label": "S2 Inbound Wave",
        "window": "morning",
        "density_factor": 1.05,
        "obstacle_factor": 1.05,
        "surge": [
            {
                "kind": "rectRatio",
                "rowStartRatio": 0.05,
                "rowEndRatio": 0.2,
                "colStartRatio": 0.72,
                "colEndRatio": 0.95,
                "penalty": 1.0,
            }
        ],
    },
    {
        "label": "S3 Noon Crossflow",
        "window": "midday",
        "density_factor": 1.1,
        "obstacle_factor": 1.15,
        "surge": [{"kind": "circleRatio", "rowRatio": 0.5, "colRatio": 0.5, "radiusRatio": 0.16, "penalty": 1.0}],
    },
    {
        "label": "S4 Replenishment Rush",
        "window": "midday",
        "density_factor": 1.25,
        "obstacle_factor": 1.35,
        "surge": [
            {
                "kind": "rectRatio",
                "rowStartRatio": 0.62,
                "rowEndRatio": 0.86,
                "colStartRatio": 0.25,
                "colEndRatio": 0.62,
                "penalty": 1.25,
            },
            {
                "kind": "rectRatio",
                "rowStartRatio": 0.24,
                "rowEndRatio": 0.4,
                "colStartRatio": 0.58,
                "colEndRatio": 0.76,
                "penalty": 0.95,
            },
        ],
    },
    {
        "label": "S5 Late Pick Compression",
        "window": "afternoon",
        "density_factor": 1.35,
        "obstacle_factor": 1.25,
        "surge": [
            {
                "kind": "rectRatio",
                "rowStartRatio": 0.74,
                "rowEndRatio": 0.95,
                "colStartRatio": 0.08,
                "colEndRatio": 0.36,
                "penalty": 1.15,
            },
            {"kind": "circleRatio", "rowRatio": 0.3, "colRatio": 0.8, "radiusRatio": 0.1, "penalty": 0.85},
        ],
    },
    {
        "label": "S6 End of Shift Release",
        "window": "afternoon",
        "density_factor": 0.95,
        "obstacle_factor": 0.9,
        "surge": [{"kind": "circleRatio", "rowRatio": 0.86, "colRatio": 0.62, "radiusRatio": 0.08, "penalty": 0.65}],
    },
]


def read_layout(csv_path: Path) -> np.ndarray:
    rows: List[List[int]] = []
    with csv_path.open("r", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        for row in reader:
            if row:
                rows.append([int(value.strip()) for value in row])
    return np.array(rows, dtype=np.int16)


def feature_penalty(feature: Dict, row: int, col: int, grid_rows: int, grid_cols: int) -> float:
    kind = feature.get("kind")

    if kind == "circle":
        radius = float(feature.get("radius", 0.0))
        center_row = float(feature.get("row", 0.0))
        center_col = float(feature.get("col", 0.0))
        distance = float(np.sqrt((row - center_row) ** 2 + (col - center_col) ** 2))
        if distance > radius:
            return 0.0
        fade = 1 - distance / (radius + 1e-4) if radius > 0 else 1.0
        return float(feature.get("penalty", 0.0)) * max(0.35, fade)

    if kind == "circleRatio":
        max_r = max(1, grid_rows - 1)
        max_c = max(1, grid_cols - 1)
        center_row = float(feature.get("rowRatio", 0.0)) * max_r
        center_col = float(feature.get("colRatio", 0.0)) * max_c
        radius = float(feature.get("radiusRatio", 0.0)) * min(max_r, max_c)
        distance = float(np.sqrt((row - center_row) ** 2 + (col - center_col) ** 2))
        if distance > radius:
            return 0.0
        fade = 1 - distance / (radius + 1e-4) if radius > 0 else 1.0
        return float(feature.get("penalty", 0.0)) * max(0.35, fade)

    if kind == "rectRatio":
        max_r = max(1, grid_rows - 1)
        max_c = max(1, grid_cols - 1)
        row_start = int(np.floor(float(feature.get("rowStartRatio", 0.0)) * max_r))
        row_end = int(np.ceil(float(feature.get("rowEndRatio", 0.0)) * max_r))
        col_start = int(np.floor(float(feature.get("colStartRatio", 0.0)) * max_c))
        col_end = int(np.ceil(float(feature.get("colEndRatio", 0.0)) * max_c))
        if row_start <= row <= row_end and col_start <= col <= col_end:
            return float(feature.get("penalty", 0.0))

    return 0.0


def scenario_base_congestion(layout: np.ndarray, profile: Dict, scenario: Dict) -> np.ndarray:
    rows, cols = layout.shape
    features = [
        *profile.get("allDay", []),
        *(profile.get("windows", {}).get(scenario["window"], [])),
        *profile.get("bottlenecks", []),
        *scenario.get("surge", []),
    ]

    penalties = np.zeros_like(layout, dtype=np.float32)
    scale = float(profile.get("densityScale", 1.0)) * float(scenario.get("density_factor", 1.0))

    for r in range(rows):
        for c in range(cols):
            if layout[r, c] != 0:
                continue
            total = 0.0
            for feature in features:
                total += feature_penalty(feature, r, c, rows, cols)
            penalties[r, c] = total * scale

    return penalties


def simulated_obstacles(layout: np.ndarray, base: np.ndarray, scenario: Dict, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    walkable = layout == 0
    if not np.any(walkable):
        return np.zeros_like(base)

    norm = np.zeros_like(base)
    base_max = float(np.max(base[walkable]))
    if base_max > 0:
        norm[walkable] = base[walkable] / base_max

    multiplier = float(scenario.get("obstacle_factor", 1.0))
    detect_prob = np.clip((0.08 + 0.42 * norm) * multiplier, 0.0, 0.95)
    random_hits = (rng.random(base.shape) < detect_prob) & walkable

    obstacles = np.zeros_like(base, dtype=np.float32)
    count = int(np.count_nonzero(random_hits))
    if count > 0:
        obstacles[random_hits] = (0.45 + 0.9 * rng.random(count)).astype(np.float32)

    smoothed = np.copy(obstacles)
    for _ in range(2):
        padded = np.pad(smoothed, ((1, 1), (1, 1)), mode="constant")
        smoothed = (
            0.35 * padded[1:-1, 1:-1]
            + 0.12 * padded[:-2, 1:-1]
            + 0.12 * padded[2:, 1:-1]
            + 0.12 * padded[1:-1, :-2]
            + 0.12 * padded[1:-1, 2:]
            + 0.085 * padded[:-2, :-2]
            + 0.085 * padded[:-2, 2:]
            + 0.085 * padded[2:, :-2]
            + 0.085 * padded[2:, 2:]
        )
        smoothed *= walkable

    return smoothed


def make_values(layout: np.ndarray, profile: Dict, scenario: Dict, seed: int) -> np.ndarray:
    base = scenario_base_congestion(layout, profile, scenario)
    obstacle_boost = simulated_obstacles(layout, base, scenario, seed)
    values = np.full_like(base, 0.18, dtype=np.float32)
    walkable = layout == 0
    values[walkable] = 0.3 + base[walkable] + 0.95 * obstacle_boost[walkable]
    return values


def build_layout_scenarios(layout_name: str, layout: np.ndarray, profile: Dict) -> List[Dict]:
    results: List[Dict] = []
    for i, scenario in enumerate(SCENARIOS, start=1):
        seed = (1000 if layout_name == "WMO" else 2000) + i * 31
        values = make_values(layout, profile, scenario, seed)
        if layout_name == "WMO":
            # Slightly elevate WMO intensity to visually match ZV in this composite only.
            walkable = layout == 0
            values = values.copy()
            values[walkable] *= 1.18
        results.append(
            {
                "layout": layout_name,
                "title": f"{layout_name} {scenario['label']}",
                "values": values,
                "objects": layout != 0,
            }
        )
    return results


def render_grid(scenarios: List[Dict], output_png: Path) -> None:
    vmax = max(float(np.max(item["values"])) for item in scenarios)

    blue_map = LinearSegmentedColormap.from_list(
        "scenario_blues",
        ["#ebf7ff", "#bfe7ff", "#7bc5ff", "#3a95e6", "#0f5fa8", "#083b70"],
    )
    object_map = ListedColormap(["#8fd6ff"])

    fig, axes = plt.subplots(3, 4, figsize=(25, 19), constrained_layout=True)
    image = None

    for ax, item in zip(axes.ravel(), scenarios):
        values = item["values"]
        objects = item["objects"]

        image = ax.imshow(values, cmap=blue_map, vmin=0, vmax=vmax)
        object_layer = np.where(objects, 1.0, np.nan)
        ax.imshow(object_layer, cmap=object_map, vmin=0, vmax=1, alpha=0.5, interpolation="nearest")
        ax.contour(objects.astype(float), levels=[0.5], colors="#1b5f8f", linewidths=0.35, alpha=0.7)

        rows, cols = values.shape
        step = max(1, cols // 8)
        ax.set_xticks(np.arange(0, cols, step))
        ax.set_yticks(np.arange(0, rows, step))
        ax.grid(color="#ffffff", alpha=0.12, linewidth=0.5)

    assert image is not None
    cbar = fig.colorbar(image, ax=axes, fraction=0.02, pad=0.01)
    cbar.set_label("Congestion / obstacle intensity", rotation=90)

    output_png.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_png, dpi=220)
    plt.close(fig)
    print(f"Saved: {output_png}")


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]

    wmo_layout = read_layout(repo_root / "data" / "WMO_layout.csv")
    zv_layout = read_layout(repo_root / "data" / "ZV_layout.csv")

    all_scenarios = [
        *build_layout_scenarios("WMO", wmo_layout, WMO_PROFILE),
        *build_layout_scenarios("ZV", zv_layout, ZV_PROFILE),
    ]

    output_png = repo_root / "multi_layout_scenario_congestion_heatmaps.png"
    render_grid(all_scenarios, output_png)


if __name__ == "__main__":
    main()
