#!/usr/bin/env python3
"""Beri tanda merah pada screenshot tutorial, lalu pertajam.

Menghasilkan gaya yang sama dengan monolith/docs/em/img: kotak merah mengelilingi
elemen + label merah "← STEP N — instruksi" di sebelahnya. Label selalu bahasa
Inggris; teks tutorialnya yang dwibahasa.

Pakai (satu gambar, satu atau beberapa tanda):

    python3 annotate.py raw/step1.jpg out/step1-tenants-menu.png \\
        --box 20,140,240,200 --label "STEP 1 — Open the Tenants menu" --side right

    # tanpa label, kotak saja
    python3 annotate.py raw/x.jpg out/y.png --box 10,10,100,50

Koordinat `--box` adalah x1,y1,x2,y2 pada gambar ASLI (sebelum diperbesar), yaitu
koordinat yang sama dengan yang dipakai browser tool untuk klik.

`--side` menentukan letak label relatif kotak: right (default), left, top, bottom.
Kalau label tidak muat di kanan, skrip memindahkannya sendiri ke kiri.

Opsi lain: --scale (default 2), --crop (default 12, membuang border oranye
"Claude is controlling this tab"), --no-sharpen.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RED = (220, 38, 56)
WHITE = (255, 255, 255)
FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Helvetica.ttc",
    "/Library/Fonts/Arial Bold.ttf",
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def parse_box(raw: str) -> tuple[int, int, int, int]:
    parts = [int(p.strip()) for p in raw.split(",")]
    if len(parts) != 4:
        raise argparse.ArgumentTypeError("--box butuh 4 angka: x1,y1,x2,y2")
    return tuple(parts)  # type: ignore[return-value]


def draw_marker(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    label: str | None,
    side: str,
    scale: float,
    img_size: tuple[int, int],
) -> None:
    x1, y1, x2, y2 = (int(v * scale) for v in box)
    width = max(3, int(3 * scale))
    draw.rectangle([x1, y1, x2, y2], outline=RED, width=width)

    if not label:
        return

    font = load_font(int(17 * scale))
    arrow = {"right": "←", "left": "→", "top": "↓", "bottom": "↑"}[side]
    text = f"{arrow} {label}"

    pad_x, pad_y, gap = int(14 * scale), int(9 * scale), int(12 * scale)
    tw = draw.textlength(text, font=font)
    th = font.size + int(4 * scale)
    bw, bh = int(tw) + pad_x * 2, th + pad_y * 2

    if side == "right":
        lx, ly = x2 + gap, y1 + (y2 - y1 - bh) // 2
    elif side == "left":
        lx, ly = x1 - gap - bw, y1 + (y2 - y1 - bh) // 2
    elif side == "top":
        lx, ly = x1 + (x2 - x1 - bw) // 2, y1 - gap - bh
    else:
        lx, ly = x1 + (x2 - x1 - bw) // 2, y2 + gap

    # Jatuh ke sisi lain kalau label keluar kanvas — lebih baik pindah daripada terpotong.
    img_w, img_h = img_size
    if lx + bw > img_w:
        lx = x1 - gap - bw
    if lx < 0:
        lx = max(gap, min(x1, img_w - bw - gap))
        ly = y2 + gap if ly < img_h / 2 else y1 - gap - bh
    ly = max(gap, min(ly, img_h - bh - gap))

    radius = int(8 * scale)
    draw.rounded_rectangle([lx, ly, lx + bw, ly + bh], radius=radius, fill=RED)
    draw.text((lx + pad_x, ly + pad_y - int(2 * scale)), text, font=font, fill=WHITE)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--box", action="append", type=parse_box, default=[],
                    help="x1,y1,x2,y2 pada gambar asli; boleh diulang")
    ap.add_argument("--label", action="append", default=[],
                    help="teks label (Inggris); pasangkan urut dengan --box")
    ap.add_argument("--side", action="append", default=[],
                    choices=["right", "left", "top", "bottom"])
    ap.add_argument("--scale", type=float, default=2.0)
    ap.add_argument("--crop", type=int, default=12)
    ap.add_argument("--no-sharpen", action="store_true")
    args = ap.parse_args()

    src = Path(args.src)
    if not src.exists():
        sys.exit(f"tidak ada: {src}")

    im = Image.open(src).convert("RGB")
    if args.crop:
        w0, h0 = im.size
        im = im.crop((args.crop, args.crop, w0 - args.crop, h0 - args.crop))

    w, h = im.size
    im = im.resize((int(w * args.scale), int(h * args.scale)), Image.LANCZOS)
    if not args.no_sharpen:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=160, threshold=2))

    draw = ImageDraw.Draw(im)
    for i, box in enumerate(args.box):
        label = args.label[i] if i < len(args.label) else None
        side = args.side[i] if i < len(args.side) else "right"
        # Koordinat diberikan terhadap screenshot penuh, jadi geser sebanyak crop.
        shifted = (box[0] - args.crop, box[1] - args.crop, box[2] - args.crop, box[3] - args.crop)
        draw_marker(draw, shifted, label, side, args.scale, im.size)

    dst = Path(args.dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, "PNG", optimize=True)
    print(f"✓ {dst}  ({im.size[0]}×{im.size[1]})")


if __name__ == "__main__":
    main()
