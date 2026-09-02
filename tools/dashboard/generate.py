#!/usr/bin/env python3
"""Generate dashboard HTML dari beads + docs/dashboard.md.

Read-only: tidak pernah menulis ke sumber mana pun. Output satu file HTML
statis dengan data ter-embed, dibuka lewat file:// tanpa server.

Jalankan:  python3 tools/dashboard/generate.py
"""

import json
import os
import re
import subprocess
import sys
from datetime import date, datetime, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "out")
DASHBOARD_MD = os.path.join(ROOT, "docs/dashboard.md")

# GANTI "sm" dengan prefix issue project ini (bd list menampilkannya).
ISSUE_PREFIX = "oims"
ID_RE = re.compile(rf"\b({ISSUE_PREFIX}-[a-z0-9]+(?:\.[0-9]+)?)\b")


def run(cmd):
    try:
        r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=60)
        return r.stdout if r.returncode == 0 else None
    except Exception:
        return None


# ---------------------------------------------------------------- beads

def load_beads():
    """Semua issue dari beads. Sumber STATUS."""
    raw = run(["bd", "list", "--all", "--json", "--limit", "0"])
    if not raw:
        return None, "bd list --json gagal — beads tidak terbaca"
    try:
        return json.loads(raw), None
    except json.JSONDecodeError as e:
        return None, f"output bd bukan JSON: {e}"


# ---------------------------------------------------------------- dashboard.md

def load_md():
    """Parse dashboard.md: tanggal update, gelombang urutan rencana, id yang disebut aktif."""
    if not os.path.exists(DASHBOARD_MD):
        return None, "docs/dashboard.md tidak ditemukan"
    text = open(DASHBOARD_MD, encoding="utf-8").read()

    m = re.search(r"Diperbarui:\s*(\d{4}-\d{2}-\d{2})", text)
    updated = m.group(1) if m else None
    m = re.search(r"Versi app: \*\*(v[\d.]+)\*\*", text)
    version = m.group(1) if m else None

    # Gelombang: header "### Gelombang N — judul" + baris tabel "| # | `sm-x` judul | Prio | catatan |"
    waves = []
    for wm in re.finditer(r"^### \S*\s*Gelombang (\d+)\+? — (.+?)$([\s\S]*?)(?=^###|^---)", text, re.M):
        items = []
        for row in re.finditer(rf"^\|\s*(\d+)\s*\|\s*(~{{0,2}})`({ISSUE_PREFIX}-[a-z0-9]+(?:\.[0-9]+)?)`\s*([^|]*)\|\s*(P\d)\s*\|\s*([^|]*)\|", wm.group(3), re.M):
            note = row.group(6).strip()
            # "plan:" di awal catatan = issue ini perlu plan file dulu sebelum dikerjakan
            needs_plan = note.lower().startswith("plan:")
            if needs_plan:
                note = note[5:].strip()
            items.append({
                "seq": int(row.group(1)), "id": row.group(3), "struck": bool(row.group(2)),
                "title": row.group(4).strip().rstrip("~ "), "prio": row.group(5),
                "note": note, "needs_plan": needs_plan,
            })
        # Baris sesi: "- `<nama sesi>` | id,id | fokus"  (baris tanpa backtick = catatan)
        sesi, notes = [], []
        for line in re.findall(r"^- (.+)$", wm.group(3), re.M):
            m = re.match(r"`([^`]+)`\s*\|\s*([^|]+)\|\s*(.+)$", line)
            if m:
                sesi.append({"name": m.group(1).strip(),
                             "ids": [i.strip() for i in m.group(2).split(",") if i.strip()],
                             "focus": m.group(3).strip()})
            else:
                notes.append(re.sub(r"[`()]", "", line).strip())
        waves.append({"n": int(wm.group(1)), "title": wm.group(2).strip(), "items": items,
                      "sesi": sesi, "notes": notes})

    # Section arsip ("Sudah Dikerjakan") memang menyebut issue closed — bukan drift.
    active = re.split(r"^##\s*\S*\s*Sudah Dikerjakan", text, maxsplit=1, flags=re.M)[0]
    active = re.sub(r"~~.*?~~", "", active, flags=re.S)

    return {
        "updated": updated,
        "version": version,
        "waves": waves,
        "ids_active": sorted(set(ID_RE.findall(active))),
        "mtime": os.path.getmtime(DASHBOARD_MD),
    }, None


# ---------------------------------------------------------------- drift

def detect_drift(beads, md):
    """Bandingkan beads vs dashboard.md. Tampilkan bedanya, jangan tebak penyebab."""
    items = []
    if beads is None or md is None:
        return items
    by_id = {it["id"]: it for it in beads}
    planned = {i["id"] for w in md["waves"] for i in w["items"]}
    struck = {i["id"] for w in md["waves"] for i in w["items"] if i.get("struck")}

    # 1. dashboard.md rencana menyebut issue yang sudah closed
    for pid in sorted(planned):
        it = by_id.get(pid)
        if it is None:
            items.append({"level": "warn",
                          "what": f"{pid} ada di urutan rencana tapi tidak ada di beads",
                          "hint": "issue dihapus/di-rename? koreksi dashboard.md"})
        elif it["status"] == "closed" and pid not in struck:
            items.append({"level": "info",
                          "what": f"{pid} sudah closed di beads tapi masih di urutan rencana",
                          "hint": "coret / pindah ke Sudah Dikerjakan"})

    # 2. issue open di beads yang belum masuk rencana
    for it in beads:
        if it["status"] != "closed" and it["id"] not in planned:
            items.append({"level": "warn",
                          "what": f"{it['id']} ({it['title'][:60]}) open di beads tapi belum masuk urutan rencana",
                          "hint": "issue baru — masukkan ke gelombang"})

    # 3. dashboard.md basi
    age = (datetime.now() - datetime.fromtimestamp(md["mtime"])).days
    if age > 7:
        items.append({"level": "warn",
                      "what": f"dashboard.md terakhir diubah {age} hari lalu",
                      "hint": "update tiap akhir sesi yang ubah status"})
    return items


# ---------------------------------------------------------------- build

def build():
    today = date.today()
    beads, beads_err = load_beads()
    md, md_err = load_md()

    data = {
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "today": today.strftime("%A, %d %B %Y"),
        "errors": [e for e in (beads_err, md_err) if e],
        "drift": detect_drift(beads, md),
        "waves": [], "next_up": [], "done_week": [], "stats": {},
        "md": {"updated": md["updated"], "version": md["version"]} if md else None,
    }
    if beads is None:
        return data

    by_id = {it["id"]: it for it in beads}
    # ponytail: blocked dihitung dari catatan "Unblocked setelah" di md, bukan graph beads —
    # bd list --json tidak bawa dependencies; upgrade kalau butuh akurat.
    for w in (md or {"waves": []})["waves"]:
        rows = []
        for i in w["items"]:
            it = by_id.get(i["id"])
            rows.append({**i, "status": it["status"] if it else "?",
                         "type": it.get("issue_type") if it else None})
        # Status tiap sesi diturunkan dari status issue-nya: semua closed = done.
        sesi = []
        for se in w.get("sesi", []):
            sts = [by_id[i]["status"] for i in se["ids"] if i in by_id]
            sesi.append({**se, "done": bool(sts) and all(x == "closed" for x in sts),
                         "open_ids": [i for i in se["ids"]
                                      if i in by_id and by_id[i]["status"] != "closed"]})
        data["waves"].append({"n": w["n"], "title": w["title"], "items": rows,
                              "sesi": sesi, "notes": w.get("notes", [])})

    # next up: 5 pertama yang belum closed, urut gelombang
    flat = [i for w in data["waves"] for i in w["items"]]
    data["next_up"] = [i for i in flat if i["status"] not in ("closed",)][:5]

    # selesai minggu ini (Senin..Minggu)
    wstart = today - timedelta(days=today.weekday())
    for it in beads:
        if it["status"] != "closed":
            continue
        u = (it.get("closed_at") or it.get("updated_at") or "")[:10]
        try:
            d = datetime.strptime(u, "%Y-%m-%d").date()
        except ValueError:
            continue
        if wstart <= d:
            data["done_week"].append({"id": it["id"], "title": it["title"], "date": u})
    data["done_week"].sort(key=lambda x: x["date"], reverse=True)

    data["stats"] = {
        "open": sum(1 for i in beads if i["status"] == "open"),
        "in_progress": sum(1 for i in beads if i["status"] == "in_progress"),
        "closed": sum(1 for i in beads if i["status"] == "closed"),
        "total": len(beads),
    }
    return data


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    data = build()

    tpl_path = os.path.join(HERE, "template.html")
    if not os.path.exists(tpl_path):
        sys.exit(f"template.html tidak ada di {HERE}")
    tpl = open(tpl_path, encoding="utf-8").read()

    payload = json.dumps(data, ensure_ascii=False, default=str)
    payload = payload.replace("</", "<\\/")  # </script> di data menutup tag lebih awal
    html = tpl.replace("/*__DATA__*/null", payload)

    out = os.path.join(OUT_DIR, "dashboard.html")
    open(out, "w", encoding="utf-8").write(html)

    print(f"✓ {out}")
    for e in data["errors"]:
        print(f"  ⚠ {e}")
    if data["drift"]:
        print(f"  ⚠ {len(data['drift'])} drift terdeteksi")


if __name__ == "__main__":
    main()
