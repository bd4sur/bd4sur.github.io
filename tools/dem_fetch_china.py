#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把覆盖中国的 Copernicus DEM GLO-30 1° 瓦片下载到本地缓存（可断点续传）。

  · 数据源：AWS 开放数据桶 s3://copernicus-dem-30m，免账号；
  · 瓦片清单：桶根目录的 tileList.txt（26 450 块，海上没有瓦片）；
  · 默认范围：中国及周边 E73–136、N17–54（含海南、台湾），共约 2 300 块 1° 瓦片；
  · 已存在且大小正确的文件直接跳过，可随时中断重跑。

用法：
  python3 tools/dem_fetch_china.py                      # 下载到 terrain/.cache
  python3 tools/dem_fetch_china.py --workers 8          # 并发连接数
  python3 tools/dem_fetch_china.py --bbox 100,25,125,45 # 只下某个范围（W,S,E,N）
  python3 tools/dem_fetch_china.py --list               # 只列出清单，不下载
"""
import argparse
import os
import queue
import sys
import threading
import time
import urllib.error
import urllib.request

BUCKET = "https://copernicus-dem-30m.s3.amazonaws.com"
TILE_LIST_URL = BUCKET + "/tileList.txt"
TILE_MIN_BYTES = 200_000          # 小于这个值基本是错误页


def tile_key(lat, lon):
    return "Copernicus_DSM_COG_10_%s%02d_00_%s%03d_00_DEM" % (
        "N" if lat >= 0 else "S", abs(lat), "E" if lon >= 0 else "W", abs(lon))


def parse_key(key):
    body = key[len("Copernicus_DSM_COG_10_"):-len("_DEM")]
    ns, lat, ew, lon = body.split("_")[0][0], body.split("_")[0][1:], body.split("_")[2][0], body.split("_")[2][1:]
    la = int(lat) * (1 if ns == "N" else -1)
    lo = int(lon) * (1 if ew == "E" else -1)
    return la, lo


def fetch_tile(url, path, retries=4):
    if os.path.exists(path) and os.path.getsize(path) > TILE_MIN_BYTES:
        return "skip"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".part"
    for k in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "linglong-dem-fetch/1"})
            with urllib.request.urlopen(req, timeout=300) as r, open(tmp, "wb") as f:
                while True:
                    chunk = r.read(1 << 18)
                    if not chunk:
                        break
                    f.write(chunk)
            if os.path.getsize(tmp) < TILE_MIN_BYTES:
                raise IOError("too small: %d" % os.path.getsize(tmp))
            os.replace(tmp, path)
            return "ok"
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return "404"
            time.sleep(2 * (k + 1))
        except Exception:
            time.sleep(2 * (k + 1))
    return "fail"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bbox", default="73,17,136,54", help="W,S,E,N（默认中国及周边）")
    ap.add_argument("--tiles-file", default=None,
                    help="瓦片清单（每行 \"lat lon\"，由地图边界预筛得到，如 terrain/china_tiles.txt）")
    ap.add_argument("--cache", default="terrain/.cache")
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--retry-failed", type=int, default=1)
    args = ap.parse_args()

    w, s, e, n = [float(x) for x in args.bbox.split(",")]
    with urllib.request.urlopen(TILE_LIST_URL, timeout=120) as r:
        all_keys = set(line.strip() for line in r.read().decode().splitlines() if line.strip())

    keys = []
    if args.tiles_file and os.path.exists(args.tiles_file):
        for line in open(args.tiles_file, encoding="utf-8"):
            parts = line.split()
            if len(parts) < 2:
                continue
            lat, lon = int(parts[0]), int(parts[1])
            k = tile_key(lat, lon)
            if k in all_keys:
                keys.append((lat, lon, k))
    else:
        for lat in range(int(s), int(n) + 1):
            for lon in range(int(w), int(e) + 1):
                k = tile_key(lat, lon)
                if k in all_keys:
                    keys.append((lat, lon, k))
    print("范围内有瓦片 %d 块（桶内共 %d）" % (len(keys), len(all_keys)), flush=True)
    if args.list:
        for _, _, k in keys:
            print(k)
        return

    have = sum(1 for _, _, k in keys if os.path.exists(os.path.join(args.cache, k + ".tif")))
    print("已有 %d 块，待下 %d 块，缓存目录 %s" % (have, len(keys) - have, args.cache), flush=True)

    q = queue.Queue()
    for item in keys:
        q.put(item)
    stats = {"ok": 0, "skip": 0, "404": 0, "fail": 0}
    lock = threading.Lock()
    t0 = time.time()
    done = [0]

    def worker():
        while True:
            try:
                lat, lon, k = q.get_nowait()
            except queue.Empty:
                return
            url = "%s/%s/%s.tif" % (BUCKET, k, k)
            res = fetch_tile(url, os.path.join(args.cache, k + ".tif"))
            with lock:
                stats[res] = stats.get(res, 0) + 1
                done[0] += 1
                if done[0] % 20 == 0 or q.empty():
                    el = time.time() - t0
                    rate = done[0] / max(el, 1e-6)
                    eta = (len(keys) - done[0]) / max(rate, 1e-6) / 60.0
                    print("进度 %d/%d  ok=%d skip=%d 404=%d fail=%d  %.1f 块/分  ETA %.0f 分"
                          % (done[0], len(keys), stats["ok"], stats["skip"], stats["404"],
                             stats["fail"], rate * 60.0, eta), flush=True)
            q.task_done()

    threads = [threading.Thread(target=worker, daemon=True) for _ in range(max(1, args.workers))]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    print("完成：%s  用时 %.0f 分" % (stats, (time.time() - t0) / 60.0), flush=True)


if __name__ == "__main__":
    main()