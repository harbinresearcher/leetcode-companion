"""生成 AlgoRhythm 的 GitHub 社交预览图（1280x640）。

配色取自 src/index.css：底色 #101419、正文 #e8e8e3、强调 #dcb967。
输出到脚本同级目录的 social-preview.png，与本地仓库目录名无关。
"""

from __future__ import annotations

import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 640
BG = (16, 20, 25)
INK = (232, 232, 227)
GOLD = (220, 185, 103)
MUTED = (154, 164, 174)
MUTED_DARK = (127, 138, 149)
FAINT = (107, 118, 129)

FONT_DIR = Path("C:/Windows/Fonts")
OUT = Path(__file__).resolve().parent / "social-preview.png"

LEFT = 80
TEXT_X = LEFT + 76 + 28


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_DIR / name), size)


def radial_glow(w: int, h: int, cx: float, cy: float, radius: float,
                color: tuple[int, int, int], strength: float) -> np.ndarray:
    """返回一张 (h, w, 3) 的加性光晕图。"""
    ys, xs = np.mgrid[0:h, 0:w]
    dist = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)
    falloff = np.clip(1.0 - dist / radius, 0.0, 1.0) ** 2.4
    layer = np.zeros((h, w, 3), dtype=np.float64)
    for i in range(3):
        layer[:, :, i] = falloff * color[i] * strength
    return layer


def build_background() -> Image.Image:
    # 竖向渐变：上方略亮，底部更深。
    ys = np.linspace(0, 1, H)[:, None]  # (H, 1)，靠广播铺满宽度
    base = np.zeros((H, W, 3), dtype=np.float64)
    shade = 1.06 - 0.12 * ys
    for i in range(3):
        base[:, :, i] = BG[i] * shade

    base += radial_glow(W, H, W * 0.80, H * 0.42, 560, GOLD, 0.085)
    base += radial_glow(W, H, W * 0.06, H * 0.06, 480, (120, 160, 200), 0.05)

    # 细网格，弱化到几乎只是质感。
    grid = np.zeros((H, W, 3), dtype=np.float64)
    grid[::40, :, :] = 16
    grid[:, ::40, :] = 16
    base += grid

    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), "RGB")


def draw_pattern_graph(img: Image.Image) -> None:
    """右侧装饰：一张“模式网络”图，暗示把题目归纳成模式。"""
    rng = random.Random(20261009)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    origin_x, origin_y = 905, 320
    nodes: list[tuple[float, float]] = []
    for i in range(15):
        angle = (i / 15) * 2 * math.pi + rng.uniform(-0.28, 0.28)
        radius = rng.uniform(72, 205)
        nodes.append((origin_x + math.cos(angle) * radius * 1.12,
                      origin_y + math.sin(angle) * radius * 0.94))
    nodes.append((origin_x, origin_y))

    for i, (x1, y1) in enumerate(nodes):
        for j, (x2, y2) in enumerate(nodes):
            if j <= i:
                continue
            dist = math.hypot(x2 - x1, y2 - y1)
            if dist < 150:
                alpha = int(58 * (1 - dist / 150))
                d.line([(x1, y1), (x2, y2)], fill=(220, 185, 103, alpha), width=1)

    for i, (x, y) in enumerate(nodes):
        if i == len(nodes) - 1:
            d.ellipse([x - 11, y - 11, x + 11, y + 11], fill=(220, 185, 103, 240))
            d.ellipse([x - 20, y - 20, x + 20, y + 20], outline=(220, 185, 103, 90), width=1)
        else:
            r = rng.choice([3, 4, 4, 5, 6])
            fill = (232, 232, 227, 200) if r >= 5 else (154, 164, 174, 165)
            d.ellipse([x - r, y - r, x + r, y + r], fill=fill)

    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"), (0, 0))


def chip(d: ImageDraw.ImageDraw, x: int, y: int, label: str,
         f: ImageFont.FreeTypeFont, pad_x: int = 16, pad_y: int = 9) -> int:
    box = d.textbbox((0, 0), label, font=f)
    w = box[2] - box[0]
    h = box[3] - box[1]
    d.rounded_rectangle([x, y, x + w + pad_x * 2, y + h + pad_y * 2],
                        radius=(h + pad_y * 2) // 2,
                        fill=(22, 28, 35), outline=(43, 51, 61), width=1)
    d.text((x + pad_x, y + pad_y - box[1]), label, font=f, fill=(201, 209, 217))
    return x + w + pad_x * 2 + 12


def main() -> None:
    img = build_background()
    draw_pattern_graph(img)
    d = ImageDraw.Draw(img)

    # 顶部金色细条。
    d.rectangle([0, 0, W, 4], fill=GOLD)

    # 品牌徽标：与应用头部的 [ar] 品牌标记一致。
    badge = [LEFT, 74, LEFT + 76, 74 + 76]
    d.rounded_rectangle(badge, radius=18, fill=(20, 25, 31), outline=GOLD, width=2)
    f_badge = font("consolab.ttf", 25)
    bb = d.textbbox((0, 0), "[ar]", font=f_badge)
    d.text((badge[0] + (76 - (bb[2] - bb[0])) / 2 - bb[0],
            badge[1] + (76 - (bb[3] - bb[1])) / 2 - bb[1]),
           "[ar]", font=f_badge, fill=GOLD)

    # 字标：Algo 常规 + Rhythm 加粗，与应用头部同构。
    f_algo = font("msyh.ttc", 46)
    f_rhythm = font("msyhbd.ttc", 46)
    d.text((TEXT_X, 80), "Algo", font=f_algo, fill=INK)
    algo_w = d.textbbox((0, 0), "Algo", font=f_algo)[2]
    d.text((TEXT_X + algo_w, 80), "Rhythm", font=f_rhythm, fill=INK)

    d.text((TEXT_X, 142), "在算法里找到你的节奏", font=font("msyh.ttc", 25), fill=GOLD)
    d.text((TEXT_X, 178), "Find your rhythm in algorithms.",
           font=font("consola.ttf", 18), fill=MUTED_DARK)

    d.line([LEFT, 226, 800, 226], fill=(38, 46, 56), width=1)

    d.text((LEFT, 252), "AI 提炼解题模式 · 主动回忆 · FSRS 间隔重复",
           font=font("msyh.ttc", 25), fill=MUTED)

    f_body = font("msyh.ttc", 21)
    d.text((LEFT, 308), "粘贴题目 → 归纳为 16 种算法模式 → 存入本地题库",
           font=f_body, fill=MUTED_DARK)
    d.text((LEFT, 348), "→ 先独立回忆 → 揭示洞察与骨架 → FSRS 安排下次复习",
           font=f_body, fill=MUTED_DARK)

    f_chip = font("msyh.ttc", 18)
    x = LEFT
    for label in ("React 18", "TypeScript", "Vite 6", "Tailwind 4",
                  "Dexie", "ts-fsrs", "纯前端 · 本地优先"):
        x = chip(d, x, 458, label, f_chip)

    d.text((LEFT, 550), "无需后端 · 无需账号 · Key 只留在你自己的浏览器",
           font=font("msyh.ttc", 19), fill=FAINT)
    d.text((LEFT, 584), "github.com/harbinresearcher/algorhythm",
           font=font("consola.ttf", 17), fill=(88, 98, 108))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"saved: {OUT}")
    print(f"size: {img.size[0]}x{img.size[1]}  bytes={OUT.stat().st_size}")


if __name__ == "__main__":
    main()
