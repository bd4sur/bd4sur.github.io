#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载 ESA WorldCover 2021 v200 的 3°×3° 瓦片，用来给水域掩膜补窄河。

为什么要它：Copernicus 的 WBM 是 30 m 网格，比它窄的河（南方丘陵区的支流、城区
小河）抓不全；WorldCover 是 10 m 的永久水体（class 80），能把 20–40 m 宽的河补上来。
它不是必需的——main 流程（tools/dem_water_tiles.py 不加 --worldcover）只用 WBM 就
能把长江、五大淡水湖这类主体水面判对。

  · 数据源：AWS 开放数据桶 s3://esa-worldcover（eu-central-1），免账号；
    路径 v200/2021/map/ESA_WorldCover_10m_2021_v200_N30E117_Map.tif
  · 3°×3° 瓦片按**西南角**命名，单张 36000²（1.3 亿像素、约 16 MB）；
  · 覆盖中国的陆地瓦片约 300 张，合计约 5 GB；
  · 已存在且大小正确的文件直接跳过，可随时中断重跑。

用法：
  python3 tools/worldcover_fetch.py --bbox 73,17,136,54
  python3 tools/worldcover_fetch.py --bbox 117,30,123,33 --cwd terrain/.cache/worldcover
  python3 tools/worldcover_fetch.py --bbox 73,17,136,54 --proxy http://192.168.10.90:1080
"""
import argparse
import os
import queue
import threading
import time
import urllib.error
import urllib.request

BUCKET = "https://esa-worldcover.s3.eu-central-1.amazonaws.com"
PREFIX = "v200/2021/map"
TILE_MIN_BYTES = 1_000_000
OPENER = None


def wc_name(south, west):
    return "ESA_WorldCover_10m_2021_v200_%s%02d%s%03d_Map" % (
        "N" if south >= 0 else "S", abs(south), "E" if west >= 0 else "W", abs(west))


def valid(path):
    try:
        if not os.path.exists(path) or os.path.getsize(path) < TILE_MIN_BYTES:
            return False
        with open(path, "rb") as f:
            head = f.read(4)
        return head[:2] == b"II" or head[:2] == b"MM"
    except Exception:
        return False


def fetch(url, path, retries=4):
    if valid(path):
        return "skip"
    tmp = path + ".part"
    opener = OPENER if OPENER is not None else urllib.request
    for k in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "linglong-wc-fetch/1"})
            with opener.open(req, timeout=600) as r, open(tmp, "wb") as f:
                while True:
                    chunk = r.read(1 << 19)
                    if not chunk:
                        break
                    f.write(chunk)
            if not valid(tmp):
                raise IOError("bad tif")
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
    ap.add_argument("--cache", default="terrain/.cache/worldcover")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--proxy", default=None, help="HTTP(S) 代理")
    args = ap.parse_args()

    global OPENER
    if args.proxy:
        OPENER = urllib.request.build_opener(
            urllib.request.ProxyHandler({"http": args.proxy, "https": args.proxy}))

    w, s, e, n = [float(x) for x in args.bbox.split(",")]
    tiles = []
    for south in range(int((s // 3) * 3), int(n) + 1, 3):
        for west in range(int((w // 3) * 3), int(e) + 1, 3):
            tiles.append((south, west))
    os.makedirs(args.cache, exist_ok=True)
    have = sum(1 for a, b in tiles if valid(os.path.join(args.cache, wc_name(a, b) + ".tif")))
    print("范围内 %d 张 3° 瓦片，已有 %d 张，待下 %d 张 → %s"
          % (len(tiles), have, len(tiles) - have, args.cache), flush=True)

    q = queue.Queue()
    for t in tiles:
        q.put(t)
    stats = {"ok": 0, "skip": 0, "404": 0, "fail": 0}
    lock = threading.Lock()
    done = [0]
    t0 = time.time()

    def worker():
        while True:
            try:
                south, west = q.get_nowait()
            except queue.Empty:
                return
            name = wc_name(south, west)
            url = "%s/%s/%s.tif" % (BUCKET, PREFIX, name)
            res = fetch(url, os.path.join(args.cache, name + ".tif"))
            with lock:
                stats[res] = stats.get(res, 0) + 1
                done[0] += 1
                if done[0] % 5 == 0 or q.empty():
                    el = time.time() - t0
                    print("进度 %d/%d  %s  %.1f 张/分  ETA %.0f 分"
                          % (done[0], len(tiles), stats, done[0] / max(el, 1e-6) * 60.0,
                             (len(tiles) - done[0]) / max(done[0] / max(el, 1e-6), 1e-6) / 60.0),
                          flush=True)
            q.task_done()

    ts = [threading.Thread(target=worker, daemon=True) for _ in range(max(1, args.workers))]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    print("完成：%s  用时 %.1f 分" % (stats, (time.time() - t0) / 60.0), flush=True)


if __name__ == "__main__":
    main()