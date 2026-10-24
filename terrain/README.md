# terrain/ — 真实高程数据

两套东西：

| 东西 | 内容 | 用途 |
| --- | --- | --- |
| `qingdao.bin` / `.json` | 单个 25.6 km 窗口（1024²·25 m） | `?terrain=qingdao`，一次性窗口 |
| `china/` | 全国 0.25° 分块金字塔 + `manifest.json` | `?terrain=china`，分块流式 |

## 全国分块（`terrain/china/`）

- 块：0.25°×0.25°，整数索引 `bx = floor(lon·4)`、`by = floor(lat·4)`；
- 两级：`l1` = 900²（1 角秒 ≈ 30 m）、`l0` = 225²（≈ 120 m）；
- 文件：`china/<bx//16>/<bx>_<by>.<level>.bin.gz` —— Int16 小端、行优先、**行 0 在北**、
  单位米（相对平均海平面）；整块是水的块不写；
- 清单：`china/manifest.json` —— 范围 `bbox`、网格原点 `grid`、两级 `size`，
  以及两份 base64 位图 `present.l0/l1` 标明哪些块存在。

浏览器只按需取窗口覆盖到的块：先 `l0`，再后台换 `l1`，缺块按海处理。

## 生成

```bash
# 1) 下载 Copernicus GLO-30 的 1° 瓦片（可断点续传；走代理就设 http(s)_proxy）
python3 tools/dem_fetch_china.py --tiles-file terrain/china_tiles.txt --workers 20

# 2) 切成 0.25° 块（可反复跑，已存在的不重做）
python3 tools/dem_tiles.py --workers 8
```

`terrain/china_tiles.txt` 是按中国边界（含外扩一圈）筛出来的 1° 瓦片清单。
约 1 280 块瓦片、下载 50 GB 左右；切出来的块约 2 万个（纯陆地），
实测每对块约 0.8 MB，全国约 1.6~2 万个块、合计约 16 GB（gzip 后）。

## 数据来源与许可

高程来自 Copernicus DEM GLO-30 Public（AWS 开放数据桶 `s3://copernicus-dem-30m`，
无需账号）：

> © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under
> COPERNICUS by the European Union and ESA; all rights reserved.
> Distributed under the Copernicus DEM licence.

海底是按「到岸距离 × 陆架坡度」在浏览器里合成的，不是实测水深；
要真实海底可以换成 GEBCO / ETOPO。

`terrain/.cache/`（原始 1° GeoTIFF，每个 4–50 MB）与 `terrain/china/`（切好的块）
都不入库，见仓库根的 `.gitignore`。
