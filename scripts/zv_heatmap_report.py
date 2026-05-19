from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List

import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, ListedColormap
import numpy as np


WINDOWS = ["morning", "midday", "afternoon"]
PANEL_LABELS = {
    "morning": "1) Morning",
    "midday": "2) Midday",
    "afternoon": "3) Afternoon",
}

# Mirrors the ZV congestion model in script.js (CONGESTION_INTELLIGENCE.ZV).
ZV_PROFILE = {
    "densityScale": 1.2,
    "allDay": [
        {
            "kind": "circle",
            "row": 9,
            "col": 19,
            "radius": 3,
            "penalty": 1.45,
        },
        {
            "kind": "rectRatio",
            "rowStartRatio": 0.8125,
            "rowEndRatio": 0.875,
            "colStartRatio": 0.65625,
            "colEndRatio": 0.8125,
            "penalty": 1.5,
        }
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
            }
        ],
        "midday": [
            {
                "kind": "circle",
                "row": 11,
                "col": 10,
                "radius": 3,
                "penalty": 1.6,
            },
            {
                "kind": "rectRatio",
                "rowStartRatio": 0.6875,
                "rowEndRatio": 0.9375,
                "colStartRatio": 0.28125,
                "colEndRatio": 0.5625,
                "penalty": 1.1,
            }
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
        {
            "kind": "circle",
            "row": 9,
            "col": 19,
            "radius": 1,
            "penalty": 1.5,
        },
        {
            "kind": "circle",
            "row": 11,
            "col": 10,
            "radius": 1,
            "penalty": 1.05,
        },
    ],
}


def read_layout(csv_path: Path) -> np.ndarray:
    rows: List[List[int]] = []
    with csv_path.open("r", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        for row in reader:
            if not row:
                continue
            rows.append([int(value.strip()) for value in row])

    layout = np.array(rows, dtype=np.int16)
    if layout.ndim != 2:
        raise ValueError("Layout must be a 2D grid.")
    return layout


def feature_penalty(feature: Dict[str, float], row: int, col: int, grid_size: int) -> float:
    kind = feature.get("kind")

    if kind == "circle":
        radius = float(feature.get("radius", 0))
        center_row = float(feature.get("row", 0))
        center_col = float(feature.get("col", 0))
        distance = float(np.sqrt((row - center_row) ** 2 + (col - center_col) ** 2))
        if distance > radius:
            return 0.0
        fade = 1 - distance / (radius + 1e-4) if radius > 0 else 1
        return float(feature.get("penalty", 0)) * max(0.35, fade)

    if kind == "rectRatio":
        max_index = max(1, grid_size - 1)
        row_start = int(np.floor(float(feature.get("rowStartRatio", 0)) * max_index))
        row_end = int(np.ceil(float(feature.get("rowEndRatio", 0)) * max_index))
        col_start = int(np.floor(float(feature.get("colStartRatio", 0)) * max_index))
        col_end = int(np.ceil(float(feature.get("colEndRatio", 0)) * max_index))

        if row_start <= row <= row_end and col_start <= col <= col_end:
            return float(feature.get("penalty", 0))

    return 0.0


def base_congestion(layout: np.ndarray, window: str) -> np.ndarray:
    grid_size = int(layout.shape[0])
    features = [
        *ZV_PROFILE.get("allDay", []),
        *(ZV_PROFILE.get("windows", {}).get(window, [])),
        *ZV_PROFILE.get("bottlenecks", []),
    ]

    penalties = np.zeros_like(layout, dtype=np.float32)
    for row in range(grid_size):
        for col in range(grid_size):
            if layout[row, col] != 0:
                continue
            total = 0.0
            for feature in features:
                total += feature_penalty(feature, row, col, grid_size)
            penalties[row, col] = total * float(ZV_PROFILE.get("densityScale", 1.0))

    return penalties


def simulated_obstacles(layout: np.ndarray, base: np.ndarray, window: str) -> np.ndarray:
    seeds = {"morning": 11, "midday": 37, "afternoon": 73}
    multipliers = {"morning": 1.0, "midday": 1.2, "afternoon": 0.9}
    rng = np.random.default_rng(seeds[window])

    walkable = layout == 0
    if not np.any(walkable):
        return np.zeros_like(base)

    norm = np.zeros_like(base)
    base_max = float(np.max(base[walkable]))
    if base_max > 0:
        norm[walkable] = base[walkable] / base_max

    # More likely obstacle detections in free cells that already have congestion.
    detect_prob = (0.08 + 0.42 * norm) * multipliers[window]
    random_hits = rng.random(base.shape) < detect_prob
    random_hits &= walkable

    obstacles = np.zeros_like(base, dtype=np.float32)
    obstacles[random_hits] = (0.45 + 0.9 * rng.random(np.count_nonzero(random_hits))).astype(np.float32)

    # Spread detections to nearby cells (simple local diffusion, no extra deps).
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


def make_heatmap_values(layout: np.ndarray, window: str) -> np.ndarray:
    base = base_congestion(layout, window)
    obstacle_boost = simulated_obstacles(layout, base, window)

    # Fixed objects appear as light blue; free cells carry congestion + detections.
    values = np.full_like(base, 0.18, dtype=np.float32)
    walkable = layout == 0
    values[walkable] = 0.3 + base[walkable] + 0.95 * obstacle_boost[walkable]
    return values


def render_three_windows(layout: np.ndarray, output_png: Path) -> None:
    heatmaps = {window: make_heatmap_values(layout, window) for window in WINDOWS}
    vmax = max(float(np.max(values)) for values in heatmaps.values())
    fixed_objects = layout != 0

    blue_map = LinearSegmentedColormap.from_list(
        "zv_blues",
        ["#ebf7ff", "#bfe7ff", "#7bc5ff", "#3a95e6", "#0f5fa8", "#083b70"],
    )
    object_map = ListedColormap(["#8fd6ff"])

    fig, axes = plt.subplots(1, 3, figsize=(18, 6), constrained_layout=True)
    image = None

    for axis, window in zip(axes, WINDOWS):
        values = heatmaps[window]
        image = axis.imshow(values, cmap=blue_map, vmin=0, vmax=vmax)
        # Keep fixed layout objects visible above the congestion layer.
        object_layer = np.where(fixed_objects, 1.0, np.nan)
        axis.imshow(object_layer, cmap=object_map, vmin=0, vmax=1, alpha=0.5, interpolation="nearest")
        axis.contour(
            fixed_objects.astype(float),
            levels=[0.5],
            colors="#1b5f8f",
            linewidths=0.35,
            alpha=0.7,
        )
        axis.set_xticks(np.arange(0, layout.shape[1], 4))
        axis.set_yticks(np.arange(0, layout.shape[0], 4))
        axis.grid(color="#ffffff", alpha=0.12, linewidth=0.5)

    assert image is not None
    cbar = fig.colorbar(image, ax=axes, fraction=0.03, pad=0.03)
    cbar.set_label("Congestion / obstacle intensity", rotation=90)

    output_png.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_png, dpi=220)
    plt.close(fig)


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    layout_path = repo_root / "data" / "ZV_layout.csv"
    output_path = repo_root / "zv_congestion_heatmaps.png"

    layout = read_layout(layout_path)
    render_three_windows(layout, output_path)

    print(f"Saved: {output_path}")


if __name__ == "__main__":
    main()
