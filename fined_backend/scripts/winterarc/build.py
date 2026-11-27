"""Validate the WinterArc day card files and write them as admin import JSON.

    python3 fined_backend/scripts/winterarc/build.py [out_dir]

Every card is checked against fined_backend/app/models/card_data.py (the same
check the admin runs on save), so a file that builds here imports cleanly.
Paste a day's JSON into the module's "Import module JSON" box.
"""
import importlib
import importlib.util
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location("card_data", HERE.parents[1] / "app" / "models" / "card_data.py")
card_data = importlib.util.module_from_spec(spec)
spec.loader.exec_module(card_data)

DAYS = ["day08", "day09", "day10", "day11", "day12", "day13", "day14", "day15"]


def main(out_dir: pathlib.Path) -> int:
    out_dir.mkdir(parents=True, exist_ok=True)
    bad = 0
    for name in DAYS:
        try:
            mod = importlib.import_module(name)
        except ModuleNotFoundError:
            continue
        slugs = set()
        for c in mod.CARDS["cards"]:
            if c["slug"] in slugs:
                print(f"{name}: duplicate slug {c['slug']}")
                bad += 1
            slugs.add(c["slug"])
            try:
                card_data.validate_card_data(c["card_type"], {**c["card_data"], "card_type": c["card_type"]})
            except Exception as err:  # pydantic.ValidationError or ValueError
                print(f"{name} · {c['slug']}: {err}")
                bad += 1
        (out_dir / f"{name}.json").write_text(json.dumps(mod.CARDS, ensure_ascii=False, indent=2) + "\n")
        print(f"{name}: {len(mod.CARDS['cards'])} cards")
    return bad


if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "out"
    sys.exit(1 if main(out) else 0)
