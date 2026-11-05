#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把已经切好的 0.25° l0 块再压一层「远景粗层」，供导航显示器（ND）一次铺到几百公里外。

  · 瓦片：4°×4° 一格，文件名 terrain/china/ov/<x0>_<y0>.ov.bin.gz，
    x0/y0 = 该格西南角的整数经纬度（4 的倍数）；
  · 内容：Int16 小端、行优先、行 0 在北、单位米（相对平均海平面），边长 TILE_N = 256，
    即每个纹素 0.015625°（= 0.25°/16，约 1.74 km）。一块 4° 格里正好 16×16 个 0.25° 块
    × 16×16 个纹素/块，所以块的边界与纹素边界对齐，不用插值；
  · 纹素值 = 该纹素覆盖的 l0 纹素（约 14×14 个，25 m 级）的算术平均：低通一下，
    既压掉降采样带来的锯齿（否则山体阴影会布满噪点），又保留山脉骨架；
  · 整格都没有 l0 块（外海）的格子不写文件 —— 浏览器把「没有瓦片」当没数据（透明），
    而格子内缺块（纯水面）本来就写 0，照旧按海面着色；
  · 清单：terrain/china/ov/manifest.json —— 各参数 + 现存瓦片列表。

量级：全国约 170 块、每块 128 KB（gzip 后 ~60 KB），合计约 10 MB；ND 视角 500 km
（栅格 ±640 km）一次要 12–16 块、约 1 MB，其余按机位流式补。

用法：
  python3 tools/dem_overview_tiles.py                       # 全部
  python3 tools/dem_overview_tiles.py --bbox 110,30,125,45  # 只做某个范围（W,S,E,N）
  python3 tools/dem_overview_tiles.py --workers 8
"""
import argparse
import base64
import glob
import gzip
import json
import os
import re
import sys
from concurrent.futures import ProcessPoolExecutor

import numpy as np

TILE_DEG = 4                      # 一格多少度
BLOCK_DEG = 0.25                  # 源块边长（与 dem_tiles.py 一致）
BLOCK_N = 225                     # 源块边长（纹素）
BIN = 16                          # 0.25° 块 → 16×16 个远景纹素（225 不是 16 的倍数，按分箱平均）
TEXEL_DEG = BLOCK_DEG / BIN       # 0.015625°
TILE_N = int(round(TILE_DEG / TEXEL_DEG))     # 256
DEFAULT_OUT = "terrain/china/ov"
SRC_DIR = "terrain/china"
ATTRIBUTION = ("© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 "
               "under COPERNICUS/ESA; Copernicus DEM licence")


def load_present(src_dir):
    """读源清单的 l0 present 位图 → [(bx, by), ...]"""
    path = os.path.join(src_dir, "manifest.json")
    with open(path, "r", encoding="utf-8") as f:
        m = json.load(f)
    g = m["grid"]
    bits = base64.b64decode(m["present"]["l0"])
    out = set()
    for j in range(g["h"]):
        for i in range(g["w"]):
            idx = j * g["w"] + i
            if (bits[idx >> 3] >> (idx & 7)) & 1:
                out.add((g["bx0"] + i, g["by0"] + j))
    return out, m


def bin_edges():
    """225 → 16 的分箱边界；各箱宽 14 或 15，块内纹素与远景纹素一一对应不重不漏"""
    return np.array([int(round(k * BLOCK_N / BIN)) for k in range(BIN + 1)], dtype=np.int64)


EDGES = bin_edges()
WIDTHS = np.diff(EDGES).astype(np.float32)


def decimate_block(a):
    """225² 的块 → 16×16 面积平均（先按行分箱、再按列分箱）"""
    r = np.add.reduceat(a, EDGES[:-1], axis=0) / WIDTHS[:, None]
    c = np.add.reduceat(r, EDGES[:-1], axis=1) / WIDTHS[None, :]
    return c


def read_block(path):
    with gzip.open(path, "rb") as f:
        raw = f.read()
    if len(raw) != BLOCK_N * BLOCK_N * 2:
        raise ValueError("长度 %d，应为 %d" % (len(raw), BLOCK_N * BLOCK_N * 2))
    return np.frombuffer(raw, dtype="<i2").reshape(BLOCK_N, BLOCK_N).astype(np.float32)


def build_tile(args):
    """生成一块 4°×4° 远景瓦片，返回 (x0, y0, 用了几块, 写入字节数)"""
    x0, y0, blocks, out_dir, src_dir = args
    tile = np.zeros((TILE_N, TILE_N), dtype=np.float32)
    used = 0
    by_top = int(round(y0 / BLOCK_DEG)) + int(round(TILE_DEG / BLOCK_DEG)) - 1   # 格内最北的那排块
    for (bx, by) in blocks:
        path = os.path.join(src_dir, str(bx // 16), "%d_%d.l0.bin.gz" % (bx, by))
        try:
            a = read_block(path)
        except Exception as e:
            print("  跳过 %s：%s" % (path, e), flush=True)
            continue
        c0 = int((bx - round(x0 / BLOCK_DEG)) * BIN)
        r0 = int((by_top - by) * BIN)
        tile[r0:r0 + BIN, c0:c0 + BIN] = decimate_block(a).astype(np.float32)
        used += 1
    dst = os.path.join(out_dir, "%d_%d.ov.bin.gz" % (x0, y0))
    data = np.clip(tile, -32760.0, 32760.0).astype("<i2").tobytes()
    with gzip.open(dst, "wb", compresslevel=6) as f:
        f.write(data)
    return (x0, y0, used, os.path.getsize(dst))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=SRC_DIR, help="源块目录（默认 terrain/china）")
    ap.add_argument("--out", default=DEFAULT_OUT)
    ap.add_argument("--bbox", default=None, help="W,S,E,N；只做这个范围内的格子")
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args()

    present, src_manifest = load_present(args.src)
    if not present:
        print("源清单里没有 l0 块，先跑 tools/dem_tiles.py", flush=True)
        return 1

    if args.bbox:
        w, s, e, n = [float(v) for v in args.bbox.split(",")]
    else:
        w, s, e, n = src_manifest["bbox"]

    # 按 4° 格分组；同一格里的块一起处理。
    # --bbox 只筛「做哪几格」，不筛「格里的哪几块」——一块瓦片必须整块写满，
    # 否则按范围补几格的时候会把已经生成好的瓦片打成半张
    cells = {}
    for (bx, by) in present:
        x0 = int(np.floor(bx * BLOCK_DEG / TILE_DEG) * TILE_DEG)
        y0 = int(np.floor(by * BLOCK_DEG / TILE_DEG) * TILE_DEG)
        if args.bbox and not (x0 + TILE_DEG > w and x0 < e and y0 + TILE_DEG > s and y0 < n):
            continue
        cells.setdefault((x0, y0), []).append((bx, by))

    os.makedirs(args.out, exist_ok=True)
    # 没给 bbox 时清掉不在本次结果里的旧瓦片（换参数重跑时别留下过期文件）；
    # 给了 bbox 就是在补一小块，绝不能顺手删掉别的
    if not args.bbox:
        keep = {"%d_%d.ov.bin.gz" % (x0, y0) for (x0, y0) in cells}
        for p in glob.glob(os.path.join(args.out, "*.ov.bin.gz")):
            if os.path.basename(p) not in keep:
                os.remove(p)

    jobs = [(x0, y0, sorted(cells[(x0, y0)]), args.out, args.src) for (x0, y0) in sorted(cells)]
    print("待生成 %d 块远景瓦片（%d² 纹素，%.5f°/纹素 ≈ %.2f km）" %
          (len(jobs), TILE_N, TEXEL_DEG, TEXEL_DEG * 111.32), flush=True)

    tiles = []
    done = 0
    total = 0
    with ProcessPoolExecutor(max_workers=max(1, args.workers)) as ex:
        for (x0, y0, used, size) in ex.map(build_tile, jobs, chunksize=1):
            tiles.append([x0, y0])
            total += size
            done += 1
            if done % 10 == 0 or done == len(jobs):
                print("  %d/%d 块，已写 %.1f MB" % (done, len(jobs), total / 1048576.0),
                      flush=True)

    tiles.sort()
    manifest = {
        "version": 1,
        "kind": "china-dem-overview",
        "tileDeg": TILE_DEG,
        "texelDeg": TEXEL_DEG,
        "tileN": TILE_N,
        "bbox": [w, s, e, n],
        "tiles": tiles,
        "counts": {"tiles": len(tiles)},
        "source": "由 terrain/china 的 l0 块（Copernicus DEM GLO-30，225²/0.25°）"
                  "按 16×16 分箱平均降采样",
        "attribution": ATTRIBUTION,
    }
    path = os.path.join(args.out, "manifest.json")
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)
    print("清单 %s：%d 块，合计 %.1f MB" % (path, len(tiles), total / 1048576.0), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())