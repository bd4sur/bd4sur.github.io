#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把下载好的 Copernicus GLO-30 1° 瓦片切成渲染器用的「0.25° 块」金字塔。

  · 块定义：0.25° × 0.25°，整数索引 bx = floor(lon·4)、by = floor(lat·4)；
    块的经纬范围是 [bx/4, bx/4+0.25] × [by/4, by/4+0.25]，行 0 在北。
  · 两级：l0 = 225²（约 120 m）、l1 = 900²（约 30 m，1 角秒原网格）。
  · 输出：terrain/china/<bx//16>/<bx>_<by>.bin.gz —— Int16 小端、行优先、行 0 在北，
    单位米（相对平均海平面；Copernicus 把水面抹平为 0）。
    整块都是水面（max ≤ 0）的块不写文件，运行时按「海」处理。
  · 清单：terrain/china/manifest.json —— 两份位图（l0/l1）标明哪些块存在，
    浏览器据此决定要不要发请求。

用法：
  python3 tools/dem_tiles.py                       # 处理缓存里所有瓦片
  python3 tools/dem_tiles.py --bbox 118,34,124,38  # 只处理某个范围
  python3 tools/dem_tiles.py --levels l0           # 只出粗层
  python3 tools/dem_tiles.py --workers 4           # 并行（读瓦片是 CPU 活）
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

BLOCK_DEG = 0.25
LEVELS = {"l0": 225, "l1": 900}
DEFAULT_BBOX = (73.0, 17.0, 136.0, 54.0)     # W,S,E,N
OUT_DIR = "terrain/china"
TILE_RE = re.compile(r"Copernicus_DSM_COG_10_([NS])(\d+)_00_([EW])(\d+)_00_DEM\.tif$")


def tile_origin(path):
    m = TILE_RE.search(os.path.basename(path))
    if not m:
        return None
    lat = int(m.group(2)) * (1 if m.group(1) == "N" else -1)
    lon = int(m.group(4)) * (1 if m.group(3) == "E" else -1)
    return lat, lon


def process_tile(args):
    """把一块 1° 瓦片切成 16 个 0.25° 块，返回存在的块列表 [(bx, by, level)]"""
    path, out_dir, levels = args
    import rasterio
    from rasterio.windows import Window
    from rasterio.enums import Resampling

    org = tile_origin(path)
    if org is None:
        return []
    lat0, lon0 = org
    written = []
    try:
        ds = rasterio.open(path)
        with ds:
            w, h = ds.width, ds.height
            # 每 0.25° 对应的像元数（高纬瓦片宽度会变小，统一重采样到固定尺寸）
            for dy in range(4):                       # dy=0 → 最北一条
                for dx in range(4):
                    col = dx * (w / 4.0)
                    row = dy * (h / 4.0)
                    win = Window(col, row, w / 4.0, h / 4.0)
                    # dy=0 是最北一条：块的南边界 = lat0 + 0.75 - dy*0.25
                    block_lat_s = lat0 + 0.75 - dy * BLOCK_DEG
                    block_lon_s = lon0 + dx * BLOCK_DEG
                    bx = int(round(block_lon_s * 4))
                    by = int(round(block_lat_s * 4))
                    for lname in levels:
                        n = LEVELS[lname]
                        a = ds.read(1, window=win, out_shape=(n, n), resampling=Resampling.bilinear)
                        if a.size == 0:
                            continue
                        a = np.nan_to_num(a.astype(np.float32), nan=0.0)
                        if a.max() <= 0.0:            # 整块是水，不写
                            continue
                        d = os.path.join(out_dir, str(bx // 16))
                        os.makedirs(d, exist_ok=True)
                        dst = os.path.join(d, "%d_%d.%s.bin.gz" % (bx, by, lname))
                        if os.path.exists(dst):
                            continue
                        with gzip.open(dst, "wb", compresslevel=6) as f:
                            f.write(np.clip(a, -32760, 32760).astype("<i2").tobytes())
                        written.append((bx, by, lname))
    except Exception as e:                     # 下载中断/文件损坏的瓦片跳过，别中断整轮
        print("  跳过有问题的瓦片 %s：%s" % (os.path.basename(path), e), flush=True)
    return written


def pack_bits(present, w, h):
    bits = bytearray((w * h + 7) // 8)
    for (i, j) in present:
        idx = j * w + i
        bits[idx >> 3] |= 1 << (idx & 7)
    return base64.b64encode(bytes(bits)).decode()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default="terrain/.cache")
    ap.add_argument("--out", default=OUT_DIR)
    ap.add_argument("--bbox", default=None, help="W,S,E,N；默认 manifest 里的范围")
    ap.add_argument("--levels", default="l0,l1")
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args()

    levels = [x for x in args.levels.split(",") if x in LEVELS]
    os.makedirs(args.out, exist_ok=True)
    manifest_path = os.path.join(args.out, "manifest.json")
    bbox = tuple(float(x) for x in args.bbox.split(",")) if args.bbox else DEFAULT_BBOX

    files = sorted(glob.glob(os.path.join(args.cache, "*.tif")))
    if not files:
        print("缓存里没有瓦片，先跑 tools/dem_fetch_china.py", flush=True)
        return
    if args.bbox:
        w, s, e, n = bbox
        files = [f for f in files
                 if (lambda o: o and s - 1 <= o[0] <= n and w - 1 <= o[1] <= e)(tile_origin(f))]
    print("待处理瓦片 %d 块，层级 %s" % (len(files), levels), flush=True)

    jobs = [(f, args.out, levels) for f in files]
    done = 0
    written = []
    with ProcessPoolExecutor(max_workers=max(1, args.workers)) as ex:
        for res in ex.map(process_tile, jobs, chunksize=1):
            written.extend(res)
            done += 1
            if done % 10 == 0 or done == len(files):
                print("  %d/%d 瓦片，新增块 %d" % (done, len(files), len(written)), flush=True)

    # ---- 重建清单：扫描输出目录，得到两级位图 ----
    # 网格范围取「名义 bbox」与「实际块范围」的并集：下游瓦片（含外扩）可能越过 bbox 边界
    w, s, e, n = bbox
    bx_min, by_min = int(np.floor(w * 4)), int(np.floor(s * 4))
    bx_max, by_max = int(np.ceil(e * 4)) - 1, int(np.ceil(n * 4)) - 1
    present = {ln: set() for ln in LEVELS}
    for ln in LEVELS:
        for p in glob.glob(os.path.join(args.out, "*", "*.%s.bin.gz" % ln)):
            m = re.search(r"(\d+)_(\d+)\.%s\.bin\.gz$" % ln, os.path.basename(p))
            if not m:
                continue
            bx, by = int(m.group(1)), int(m.group(2))
            present[ln].add((bx, by))
            bx_min, by_min = min(bx_min, bx), min(by_min, by)
            bx_max, by_max = max(bx_max, bx), max(by_max, by)
    bx0, by0 = bx_min, by_min
    gw, gh = bx_max - bx0 + 1, by_max - by0 + 1
    for ln in LEVELS:
        present[ln] = {(bx - bx0, by - by0) for (bx, by) in present[ln]}
    manifest = {
        "version": 1,
        "kind": "china-dem-blocks",
        "bbox": [w, s, e, n],
        "blockDeg": BLOCK_DEG,
        "grid": {"bx0": bx0, "by0": by0, "w": gw, "h": gh},
        "levels": {ln: {"size": LEVELS[ln]} for ln in LEVELS},
        "present": {ln: pack_bits(present[ln], gw, gh) for ln in LEVELS},
        "counts": {ln: len(present[ln]) for ln in LEVELS},
        "source": "Copernicus DEM GLO-30 Public via AWS Open Data, blocks cut at 0.25 deg",
        "attribution": "© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 under COPERNICUS/ESA; Copernicus DEM licence",
    }
    tmp = manifest_path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, manifest_path)          # 原子替换：浏览器可能正在读
    print("清单 %s：l0=%d 块，l1=%d 块，位图 %dx%d"
          % (manifest_path, manifest["counts"]["l0"], manifest["counts"]["l1"], gw, gh), flush=True)


if __name__ == "__main__":
    main()