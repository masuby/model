#!/usr/bin/env python3
"""
checksums.py - the sha256 of every derived input of the Advancement layer and of the Core's vendored
files (issue ENG-03), so that a collaborator who recomputes a hazard member can tell whether the result
is the one the release used, and a release can state exactly which inputs it was built from.

  python3 scripts/checksums.py            writes data-source/CHECKSUMS.sha256
  python3 scripts/checksums.py --check    verifies the working tree against it (exit 1 on any difference)

The list of files is the one docs/HAZARD_REPRODUCTION.md documents: the council CSVs the compute-*
scripts write, the facility join, the USGS catalogue, the registry and the climate cube.
"""
import hashlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data-source/CHECKSUMS.sha256"
FILES = [
    "data-source/tanzania-inform-risk.xlsx",
    "data-source/council_registry.csv",
    "data-source/population_2022_councils.csv",
    "data-source/council_climate.csv",
    "data-source/_council_climate_cube.npz",
    "data-source/aridity_councils.csv",
    "data-source/ndvi_councils.csv",
    "data-source/soil_moisture_councils.csv",
    "data-source/drought_members_councils.csv",
    "data-source/chirps_drought_spi_spei.csv",
    "data-source/seasonality_zones.csv",
    "data-source/landslide_slope_councils.csv",
    "data-source/rain_trigger_councils.csv",
    "data-source/wind_councils.csv",
    "data-source/heatwave_councils.csv",
    "data-source/usgs_earthquakes_tz.csv",
    "data-source/earthquake_councils.csv",
    "data-source/flood_events.csv",
    "data-source/displaced_refugees.csv",
    "data-source/facilities_by_council.json",
    "data-source/facilities_by_unit.json",
    "data-source/exposure_by_unit.json",
    "data-source/drr_status.csv",
    "data-source/inform_advanced_spec.csv",
    "data-source/inform_indicator_spec.csv",
    "src/data/tanzania-councils.json",
    "src/data/tanzania-advanced-inputs.json",
    "src/data/tanzania-inform-risk.json",
    "src/data/inform-data-notes.json",
]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main(argv: list[str]) -> int:
    if "--check" in argv:
        expected = {}
        for line in OUT.read_text().splitlines():
            if line.strip() and not line.startswith("#"):
                digest, _, name = line.partition("  ")
                expected[name] = digest
        bad = []
        for name, digest in expected.items():
            p = ROOT / name
            actual = sha256(p) if p.exists() else "missing"
            if actual != digest:
                bad.append(f"{name}: expected {digest[:12]}, found {actual[:12]}")
        print("\n".join(bad) if bad else f"all {len(expected)} files match {OUT.name}")
        return 1 if bad else 0
    lines = ["# sha256 of the inputs behind the Core display metadata and the Advancement layer (scripts/checksums.py)."]
    for name in FILES:
        p = ROOT / name
        if not p.exists():
            print(f"missing: {name}", file=sys.stderr)
            continue
        lines.append(f"{sha256(p)}  {name}")
    OUT.write_text("\n".join(lines) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)} ({len(lines) - 1} files)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
