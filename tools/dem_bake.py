#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把真实高程数据烘焙成 linglong.html「实时海洋」地形用的世界高程图。

数据源（默认）：Copernicus DEM GLO-30 Public
  · 1 角秒（约 30 m）数字地表模型，1°×1° 一块，Cloud Optimized GeoTIFF；
  · AWS 开放数据桶 s3://copernicus-dem-30m，无需账号：
    https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N36_00_E120_00_DEM/...
  · 海上没有瓦片（按 0 处理），水体被抹平——正好就是渲染器要的「海平面 = 0」；
  · 许可证：Copernicus DEM licence（免费，需注明来源）。

输出：
  <out-dir>/<name>.bin   Int16 小端，行优先，第 0 行是**最南**一行（与渲染器
                         纹理的 v 方向一致），每格 = 相对平均海平面高程（米）
  <out-dir>/<name>.json  元数据（窗口中心经纬、UTM 带、格距、范围、来源）

用法：
  python3 tools/dem_bake.py --lon 120.45 --lat 36.10 --size-km 25.6 --res 1024 \
      --name qingdao --out-dir terrain

依赖：rasterio（自带 GDAL）、numpy、pyproj、scipy。
"""
import argparse, json, math, os, sys, urllib.error, urllib.request
import numpy as np

BUCKET = "https://copernicus-dem-30m.s3.amazonaws.com"
TILE_LIST = BUCKET + "/tileList.txt"
NODATA = -9999.0


def tile_name(lat, lon):
    return "Copernicus_DSM_COG_10_%s%02d_00_%s%03d_00_DEM" % (
        "N" if lat >= 0 else "S", abs(lat), "E" if lon >= 0 else "W", abs(lon))


def fetch(url, dst, retries=3):
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return dst
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + ".part"
    for k in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "linglong-dem-bake/1"})
            with urllib.request.urlopen(req, timeout=180) as r, open(tmp, "wb") as f:
                while True:
                    chunk = r.read(1 << 20)
                    if not chunk:
                        break
                    f.write(chunk)
            os.replace(tmp, dst)
            return dst
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None            # 海上没有瓦片
            if k == retries - 1:
                raise
        except Exception:
            if k == retries - 1:
                raise
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lon", type=float, required=True, help="窗口中心经度")
    ap.add_argument("--lat", type=float, required=True, help="窗口中心纬度")
    ap.add_argument("--size-km", type=float, default=25.6, help="窗口边长 km（默认 25.6 = 渲染器世界周期）")
    ap.add_argument("--res", type=int, default=1024, help="高程图边长（纹素数）")
    ap.add_argument("--name", required=True)
    ap.add_argument("--out-dir", default="terrain")
    ap.add_argument("--cache-dir", default=None)
    ap.add_argument("--bathy-max", type=float, default=70.0, help="合成海底最大深度 m")
    ap.add_argument("--bathy-slope", type=float, default=0.06, help="离岸每米加深多少 m（陆架坡度）")
    args = ap.parse_args()

    import rasterio
    from rasterio.warp import reproject, Resampling
    from rasterio.transform import from_origin
    from pyproj import Transformer

    cache = args.cache_dir or os.path.join(args.out_dir, ".cache")
    half_km = args.size_km * 0.5

    # ---- UTM 带：把窗口放到以米为单位的局部平面上（经纬度网格直接当米用会拉伸）----
    zone = int((args.lon + 180.0) // 6.0) + 1
    epsg = (32600 if args.lat >= 0 else 32700) + zone
    to_utm = Transformer.from_crs("EPSG:4326", "EPSG:%d" % epsg, always_xy=True)
    to_ll = Transformer.from_crs("EPSG:%d" % epsg, "EPSG:4326", always_xy=True)
    cx, cy = to_utm.transform(args.lon, args.lat)

    # 目标窗口四角反算经纬度，得到需要下载的 1° 瓦片
    corners = [to_ll.transform(cx + dx, cy + dy)
               for dx, dy in ((-half_km, -half_km), (half_km, -half_km),
                              (-half_km, half_km), (half_km, half_km))]
    lons = [c[0] for c in corners]; lats = [c[1] for c in corners]
    pad = 0.03
    lon0, lon1 = math.floor(min(lons) - pad), math.floor(max(lons) + pad)
    lat0, lat1 = math.floor(min(lats) - pad), math.floor(max(lats) + pad)
    tiles = [(lat, lon) for lat in range(lat0, lat1 + 1) for lon in range(lon0, lon1 + 1)]
    print("窗口中心 %.5f,%.5f  UTM %d  瓦片 %d 块：%s" % (args.lon, args.lat, epsg, len(tiles),
          " ".join(tile_name(a, b) for a, b in tiles)), flush=True)

    # ---- 拼接成 1 角秒的经纬度马赛克 ----
    nx = int(round((lon1 + 1 - lon0) * 3600))
    ny = int(round((lat1 + 1 - lat0) * 3600))
    mosaic = np.zeros((ny, nx), dtype=np.float32)      # 默认 0 = 海平面
    got = 0
    for (lat, lon) in tiles:
        name = tile_name(lat, lon)
        path = fetch("%s/%s/%s.tif" % (BUCKET, name, name), os.path.join(cache, name + ".tif"))
        if path is None:
            continue
        with rasterio.open(path) as ds:
            a = ds.read(1).astype(np.float32)
            if ds.nodata is not None:
                a[a == ds.nodata] = 0.0
        h, w = a.shape
        # 该瓦片覆盖 [lon, lon+1] × [lat, lat+1]，行 0 在北
        r0 = int(round((lat1 + 1 - (lat + 1)) * 3600))
        c0 = int(round((lon - lon0) * 3600))
        mosaic[r0:r0 + h, c0:c0 + w] = a
        got += 1
    print("读到瓦片 %d/%d，马赛克 %d×%d" % (got, len(tiles), nx, ny), flush=True)

    # ---- 重投影到 UTM 并重采样到目标网格 ----
    src_transform = from_origin(lon0, lat1 + 1, 1.0 / 3600.0, 1.0 / 3600.0)
    n = args.res
    texel = args.size_km * 1000.0 / n
    dst_transform = from_origin(cx - half_km * 1000.0, cy + half_km * 1000.0, texel, texel)
    dst = np.full((n, n), NODATA, dtype=np.float32)
    reproject(source=mosaic, destination=dst,
              src_transform=src_transform, src_crs="EPSG:4326", src_nodata=0.0,
              dst_transform=dst_transform, dst_crs="EPSG:%d" % epsg, dst_nodata=NODATA,
              resampling=Resampling.bilinear)
    dst[dst == NODATA] = 0.0

    land = dst > 0.0
    print("陆地占比 %.1f%%  高程 %.0f ~ %.0f m" % (100.0 * land.mean(), dst.min(), dst.max()), flush=True)

    # ---- 合成海底：真实 DEM 的海面是平的 0，渲染器要的是水深 ----
    # 用「到最近陆地的距离」给一条陆架：先大幅低通（否则小岛周围是一圈圈完美的圆形
    # 等深线），再乘一层低频噪声让等深线碎开，看起来才像真的水下地形。
    if args.bathy_max > 0:
        try:
            from scipy.ndimage import distance_transform_edt, gaussian_filter, zoom
            dist = distance_transform_edt(~land) * texel          # 每个水格到最近陆地的米数
            dist = gaussian_filter(dist, sigma=max(1.0, 260.0 / texel))
            # 低频噪声（32² 随机场放大 + 平滑到 0.55~1.45）
            rng = np.random.default_rng(20260624)
            coarse = gaussian_filter(rng.random((48, 48)).astype(np.float32), sigma=2.2)
            noise = zoom(coarse, (n / 48.0, n / 48.0), order=1)
            noise = gaussian_filter(noise[:n, :n], sigma=8.0)
            noise = (noise - noise.min()) / max(1e-6, noise.max() - noise.min())
            mult = 0.55 + 0.9 * noise
            depth = np.minimum(args.bathy_max, dist * args.bathy_slope) * mult
            dst = np.where(land, dst, -depth).astype(np.float32)
            print("合成海底：0 ~ -%.0f m（陆架坡度 %.3f，σ=260 m 平滑 + 低频扰动）"
                  % (args.bathy_max, args.bathy_slope), flush=True)
        except ImportError:
            print("（未装 scipy，跳过合成海底，水面保持 0）", flush=True)

    # ---- 写出：行 0 = 最南（渲染器纹理 v 方向）----
    out_bin = dst[::-1, :].astype("<i2")
    os.makedirs(args.out_dir, exist_ok=True)
    bin_path = os.path.join(args.out_dir, args.name + ".bin")
    out_bin.tofile(bin_path)
    meta = {
        "name": args.name,
        "sizeKm": args.size_km,
        "res": args.res,
        "texelM": texel,
        "centerLon": args.lon, "centerLat": args.lat,
        "utmEpsg": epsg,
        "eastM": round(cx, 1), "northM": round(cy, 1),
        "minH": float(np.min(dst)), "maxH": float(np.max(dst)),
        "waterFrac": float(1.0 - land.mean()),
        "source": "Copernicus DEM GLO-30 Public (AWS Open Data, s3://copernicus-dem-30m), 1 arc-second DSM",
        "attribution": "© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. Distributed under the Copernicus DEM licence.",
        "built": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
    }
    with open(os.path.join(args.out_dir, args.name + ".json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("写出 %s（%.1f MB）与 %s.json" % (bin_path, os.path.getsize(bin_path) / 1e6, args.name), flush=True)


if __name__ == "__main__":
    main()
