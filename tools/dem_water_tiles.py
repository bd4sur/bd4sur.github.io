#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
给 terrain/china 的 0.25° 分块补一份「水域掩膜」。

为什么需要：Copernicus DEM 把水面抹平了，但抹平到的是**当地水位**（太湖 0 m、巢湖 6 m、
洪泽湖 8 m、鄱阳湖 11 m、长江南京段 1–2 m、长江重庆段 168 m、青海湖 3194 m），不是 0。
渲染端原来只把"高程恰好为 0"当成水，于是除了海和太湖，所有江河湖都被当成陆地。

数据源（两级，后者可选）：
  · Copernicus DEM 自带的 AUXFILES/<key>_WBM.tif —— 1 角秒、与 DEM 逐像素对齐；
    取值 0 陆地 / 1 海 / 2 内陆水体 / 3 河道，这里一律按「> 0 就是水」取。
  · ESA WorldCover 2021 v200 的 class 80（永久水体，10 m）—— 补 WBM 30 m 会漏掉的窄河；
    10 m 瓦片是 3°×3°、单张 1.3 亿像素，所以单独一遍、按 3° 瓦片解码一次再切。

输出：terrain/china/<bx//16>/<bx>_<by>.<level>.w.gz
  · 位打包（每字节 8 个像元，低位在前），行优先，**行 0 在北**，与 .bin.gz 的高程图同序；
  · 边长与同层高程图一致（l1 900²，l0 225²）；
  · 降采样一律「格内有任一像元是水就算水」（BOX 面积平均 > 0），否则窄河整条消失。

清单：manifest.json 里加一段 water，记两层的 present 位图（与现有 present 同格、同编码）。
渲染端据此决定要不要请求掩膜；没有掩膜的块自动退回原来的"高程 == 0"判据，所以可以分批做。

用法：
  python3 tools/dem_water_tiles.py                       # 用 WBM 给所有已存在的块补掩膜
  python3 tools/dem_water_tiles.py --bbox 118,31,120,33  # 只处理某个范围（W,S,E,N）
  python3 tools/dem_water_tiles.py --levels l1           # 只补一层
  python3 tools/dem_water_tiles.py --worldcover          # 顺带并进 WorldCover 10 m 水体
  python3 tools/dem_water_tiles.py --force               # 重做已有的掩膜
"""
import argparse
import base64
import gzip
import json
import os
import time
from concurrent.futures import ProcessPoolExecutor

from PIL import Image
import numpy as np

Image.MAX_IMAGE_PIXELS = None          # WorldCover 单张 1.3 亿像素以上，关掉炸弹保护

BLOCK_DEG = 0.25
LEVELS = {"l0": 225, "l1": 900}
DEFAULT_OUT = "terrain/china"
DEFAULT_CACHE = "terrain/.cache"
WC_WATER_CLASS = 80                    # ESA WorldCover：80 = 永久水体


# ---------------------------------------------------------------- 公共小工具

def tile_key(lat, lon):
    return "Copernicus_DSM_COG_10_%s%02d_00_%s%03d_00_DEM" % (
        "N" if lat >= 0 else "S", abs(lat), "E" if lon >= 0 else "W", abs(lon))


def wc_key(lat0, lon0):
    """WorldCover 3° 瓦片名（用西南角命名），返回 (名字, 北边界, 西边界)"""
    s = int(np.floor(lat0 / 3.0)) * 3
    w = int(np.floor(lon0 / 3.0)) * 3
    name = "ESA_WorldCover_10m_2021_v200_%s%02d%s%03d_Map" % (
        "N" if s >= 0 else "S", abs(s), "E" if w >= 0 else "W", abs(w))
    return name, s + 3, w


def pack_bits(flags):
    """布尔数组（行优先、行 0 在北）→ 位打包字节（低位在前），与清单 present 同编码"""
    flat = flags.reshape(-1).astype(np.uint8)
    if flat.size % 8:
        flat = np.concatenate([flat, np.zeros(8 - flat.size % 8, np.uint8)])
    return np.packbits(flat, bitorder="little").tobytes()


def unpack_bits(data, n):
    return np.unpackbits(np.frombuffer(data, np.uint8), bitorder="little")[:n * n].reshape(n, n) > 0


def pool_any(arr, n):
    """布尔数组按「格内有任一为真就算真」降到 n×n（PIL BOX 面积平均 > 0）"""
    if arr.shape[0] == n and arr.shape[1] == n:
        return arr
    img = Image.fromarray(np.where(arr, 255, 0).astype(np.uint8))
    return np.array(img.resize((n, n), Image.BOX)) > 0


def mask_path(out_dir, bx, by, lv):
    return os.path.join(out_dir, str(bx // 16), "%d_%d.%s.w.gz" % (bx, by, lv))


def write_mask(path, flags):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with gzip.open(path + ".part", "wb", compresslevel=9) as f:
        f.write(pack_bits(flags))
    os.replace(path + ".part", path)


def read_mask(path, n):
    with gzip.open(path, "rb") as f:
        return unpack_bits(f.read(), n)


def block_geom(lat0, lon0, dx, dy):
    """1° 瓦片内的第 (dx, dy) 个 0.25° 子块 → (bx, by, 南边界, 西边界)"""
    bs_lat = lat0 + 0.75 - dy * BLOCK_DEG
    bs_lon = lon0 + dx * BLOCK_DEG
    return int(round(bs_lon * 4)), int(round(bs_lat * 4)), bs_lat, bs_lon


# ---------------------------------------------------------------- 第一遍：WBM

def process_wbm_tile(args):
    lat0, lon0, out_dir, cache, levels, force = args
    key = tile_key(lat0, lon0)
    p = os.path.join(cache, key + "_WBM.tif")
    if not os.path.exists(p):
        return ("no_wbm", 0)
    todo_any = False
    for dy in range(4):
        for dx in range(4):
            bx, by, _, _ = block_geom(lat0, lon0, dx, dy)
            for lv in levels:
                if force or not os.path.exists(mask_path(out_dir, bx, by, lv)):
                    todo_any = True
    if not todo_any:
        return ("skip", 0)
    try:
        wbm = np.array(Image.open(p))
    except Exception as e:
        return ("bad:%s" % e, 0)
    if wbm.dtype != np.uint8:
        wbm = wbm.astype(np.uint8)
    size = wbm.shape[0]
    step = size // 4
    written = 0
    for dy in range(4):
        for dx in range(4):
            bx, by, _, _ = block_geom(lat0, lon0, dx, dy)
            todo = [(lv, mask_path(out_dir, bx, by, lv)) for lv in levels
                    if force or not os.path.exists(mask_path(out_dir, bx, by, lv))]
            if not todo:
                continue
            win = wbm[dy * step:(dy + 1) * step, dx * step:(dx + 1) * step] > 0
            for lv, dst in todo:
                write_mask(dst, pool_any(win, LEVELS[lv]))
                written += 1
    return ("ok", written)


# ---------------------------------------------------------------- 第二遍：WorldCover

def process_wc_tile(args):
    """3°×3° 的 WorldCover 瓦片解一次，切出它盖住的 0.25° 块，把永久水体并进已有掩膜"""
    wc_name, north, west, out_dir, wc_cache, levels, force = args
    p = os.path.join(wc_cache, wc_name + ".tif")
    if not os.path.exists(p):
        return ("no_wc", 0)
    try:
        wc = np.array(Image.open(p))
    except Exception as e:
        return ("bad:%s" % e, 0)
    h, w = wc.shape
    merged = 0
    for lat0 in range(north - 3, north):
        for lon0 in range(west, west + 3):
            for dy in range(4):
                for dx in range(4):
                    bx, by, bs_lat, bs_lon = block_geom(lat0, lon0, dx, dy)
                    targets = []
                    for lv in levels:
                        mp = mask_path(out_dir, bx, by, lv)
                        if force or os.path.exists(mp):
                            targets.append((lv, mp))
                    if not targets:
                        continue
                    r1 = int(round((north - (bs_lat + BLOCK_DEG)) / 3.0 * h))
                    r2 = int(round((north - bs_lat) / 3.0 * h))
                    c1 = int(round((bs_lon - west) / 3.0 * w))
                    c2 = int(round((bs_lon + BLOCK_DEG - west) / 3.0 * w))
                    r1, c1 = max(0, r1), max(0, c1)
                    r2, c2 = min(h, r2), min(w, c2)
                    if r2 <= r1 or c2 <= c1:
                        continue
                    sub = wc[r1:r2, c1:c2] == WC_WATER_CLASS
                    if not sub.any():
                        continue
                    for lv, mp in targets:
                        n = LEVELS[lv]
                        base = read_mask(mp, n) if os.path.exists(mp) else np.zeros((n, n), bool)
                        write_mask(mp, base | pool_any(sub, n))
                        merged += 1
    return ("ok", merged)


# ---------------------------------------------------------------- 清单

def present_bits(m, lv):
    raw = base64.b64decode(m["present"][lv])
    return np.unpackbits(np.frombuffer(raw, np.uint8), bitorder="little")


def update_manifest(path, m, levels, out_dir):
    g = m["grid"]
    gw, gh = g["w"], g["h"]
    water = m.get("water") or {"version": 1}
    water["version"] = 1
    water["note"] = ("每块的水域掩膜 <bx>_<by>.<level>.w.gz：位打包、低位在前、行 0 在北，"
                     "1 = 水面。来源是 Copernicus DEM 的 AUXFILES WBM（取值 > 0），"
                     "跑过 --worldcover 的块另并进 ESA WorldCover 2021 的 class 80。"
                     "没有掩膜的块退回「高程 == 0」判据。")
    pres = water.get("present") or {}
    for lv in levels:
        old = pres.get(lv)
        bits = (np.unpackbits(np.frombuffer(base64.b64decode(old), np.uint8), bitorder="little")
                if old else np.zeros(gw * gh, np.uint8))
        if bits.size < gw * gh:
            bits = np.concatenate([bits, np.zeros(gw * gh - bits.size, np.uint8)])
        exist = present_bits(m, lv)
        n_done = 0
        for j in range(gh):
            for i in range(gw):
                if not exist[j * gw + i]:
                    continue
                bx, by = g["bx0"] + i, g["by0"] + j
                if os.path.exists(mask_path(out_dir, bx, by, lv)):
                    bits[j * gw + i] = 1
                    n_done += 1
        pres[lv] = base64.b64encode(np.packbits(bits, bitorder="little").tobytes()).decode()
        print("  %s：掩膜就绪 %d 块（该层有高程块 %d 块）" % (lv, n_done, int(exist.sum())), flush=True)
    water["present"] = pres
    m["water"] = water
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(m, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)


def blocks_in_range(m, levels, bbox):
    """清单里存在、且落在 bbox 内的 0.25° 块 → {(bx, by): (南边界, 西边界)}"""
    g = m["grid"]
    out = {}
    lim = None
    if bbox:
        w, s, e, n = [float(x) for x in bbox.split(",")]
        lim = (w, s, e, n)
    for lv in levels:
        bits = present_bits(m, lv)
        for j in range(g["h"]):
            for i in range(g["w"]):
                if not bits[j * g["w"] + i]:
                    continue
                bx, by = g["bx0"] + i, g["by0"] + j
                bs_lat, bs_lon = by * BLOCK_DEG, bx * BLOCK_DEG
                if lim and not (lim[1] <= bs_lat < lim[3] and lim[0] <= bs_lon < lim[2]):
                    continue
                out[(bx, by)] = (bs_lat, bs_lon)
    return out


# ---------------------------------------------------------------- 主

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    ap.add_argument("--cache", default=DEFAULT_CACHE)
    ap.add_argument("--levels", default="l0,l1")
    ap.add_argument("--bbox", default=None, help="W,S,E,N；只处理落在这个范围内的块")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--worldcover", action="store_true", help="第二遍：并进 WorldCover 的永久水体")
    ap.add_argument("--worldcover-cache", default=None,
                    help="WorldCover 3° 瓦片目录（默认 <cache>/worldcover）")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    levels = [x for x in args.levels.split(",") if x in LEVELS]
    if not levels:
        print("没有有效的层级")
        return
    wc_cache = args.worldcover_cache or os.path.join(args.cache, "worldcover")
    mani_path = os.path.join(args.out, "manifest.json")
    m = json.load(open(mani_path, encoding="utf-8"))

    blocks = blocks_in_range(m, levels, args.bbox)
    if not blocks:
        print("范围内没有块")
        return
    tiles = sorted({(by // 4, bx // 4) for (bx, by) in blocks})
    print("待处理 1° 瓦片 %d 块（覆盖 0.25° 块 %d 个），层级 %s"
          % (len(tiles), len(blocks), levels), flush=True)

    # ---- 第一遍：WBM（每块 0.5 MB，快）----
    jobs = [(lat0, lon0, args.out, args.cache, levels, args.force) for (lat0, lon0) in tiles]
    t0 = time.time()
    stats, done = {}, 0
    with ProcessPoolExecutor(max_workers=max(1, args.workers)) as ex:
        for res in ex.map(process_wbm_tile, jobs, chunksize=4):
            done += 1
            stats[res[0]] = stats.get(res[0], 0) + 1
            if done % 20 == 0 or done == len(jobs):
                print("WBM 进度 %d/%d  %.1f 瓦片/秒  %s"
                      % (done, len(jobs), done / max(time.time() - t0, 1e-6), stats), flush=True)
    print("WBM 完成，用时 %.1f 分" % ((time.time() - t0) / 60.0), flush=True)

    # ---- 第二遍：WorldCover（每张 3° 瓦片 1.3 亿像素，逐张来）----
    if args.worldcover:
        wct = sorted({wc_key(by * BLOCK_DEG, bx * BLOCK_DEG) for (bx, by) in blocks})
        print("WorldCover：待处理 3° 瓦片 %d 张，缓存 %s" % (len(wct), wc_cache), flush=True)
        jobs2 = [(n, north, west, args.out, wc_cache, levels, args.force)
                 for (n, north, west) in wct]
        t1 = time.time()
        stats2, done = {}, 0
        # WorldCover 单张解出来 1.3 GB，并发别开大
        with ProcessPoolExecutor(max_workers=min(2, max(1, args.workers))) as ex:
            for res in ex.map(process_wc_tile, jobs2, chunksize=1):
                done += 1
                stats2[res[0]] = stats2.get(res[0], 0) + 1
                if done % 5 == 0 or done == len(jobs2):
                    print("WorldCover 进度 %d/%d  %s  用时 %.1f 分"
                          % (done, len(jobs2), stats2, (time.time() - t1) / 60.0), flush=True)
        print("WorldCover 完成，用时 %.1f 分" % ((time.time() - t1) / 60.0), flush=True)

    print("回写清单…", flush=True)
    update_manifest(mani_path, m, levels, args.out)
    print("全部完成，总用时 %.1f 分" % ((time.time() - t0) / 60.0), flush=True)


if __name__ == "__main__":
    main()