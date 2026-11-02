# terrain/ — 真实高程数据

两套东西：

| 东西 | 内容 | 用途 |
| --- | --- | --- |
| `qingdao.bin` / `.json` | 单个 25.6 km 窗口（1024²·25 m） | `?terrain=qingdao`，一次性窗口 |
| `china/` | 全国 0.25° 分块金字塔 + `manifest.json` | `?terrain=china`，分块流式 |

## 全国分块（`terrain/china/`）

- 块：0.25°×0.25°，整数索引 `bx = floor(lon·4)`、`by = floor(lat·4)`；
- 两级：`l1` = 900²（1 角秒 ≈ 30 m）、`l0` = 225²（≈ 120 m）；
- 高程：`china/<bx//16>/<bx>_<by>.<level>.bin.gz` —— Int16 小端、行优先、**行 0 在北**、
  单位米（相对平均海平面）；整块是水的块不写；
- 水域掩膜：`china/<bx//16>/<bx>_<by>.<level>.w.gz` —— 位打包（每字节 8 个像元、低位在前，
  与清单里的 `present` 同编码）、行 0 在北，边长与同层高程一致，`1` = 水面；
- 清单：`china/manifest.json` —— 范围 `bbox`、网格原点 `grid`、两级 `size`、
  两份 base64 位图 `present.l0/l1` 标明哪些块存在，以及 `water.present.l0/l1`
  标明哪些块有掩膜。

浏览器只按需取窗口覆盖到的块：先 `l0`，再后台换 `l1`，缺块按海处理；有掩膜的块连
掩膜一起取（每块约 10 KB gzip）。

### 为什么要单独一份水域掩膜

Copernicus DEM 确实把水面抹平了，但抹平到的是**当地水位**，不是 0：

| 水体 | DEM 里的值 |
| --- | --- |
| 太湖 | 0 m（恰好为 0，所以以前是唯一"看起来对"的内陆水） |
| 巢湖 / 洪泽湖 | 6 m / 8 m |
| 鄱阳湖 / 洞庭湖 | 11 m / 21 m |
| 长江·南京段 | 1–2 m |
| 长江·重庆段 | 168 m |
| 青海湖 | 3194 m |

早先的渲染端只把「高程恰好等于 0」当成水，于是除了海和太湖，全国的内陆水体都被画成
陆地；而恰好跨过 0 的小洼地只留一圈"空心水洼"（0 的那一圈判成水，更低的 −1 m 却被
抬成 0.35 m 陆地）。现在改由掩膜说话，判定与高程值无关。

## 生成

```bash
# 1) 下载 Copernicus GLO-30 的 1° 瓦片 + 每块的水域掩膜（可断点续传；--proxy 走代理）
python3 tools/dem_fetch_china.py --tiles-file terrain/china_tiles.txt --wbm --workers 20

# 2) 切成 0.25° 块（可反复跑，已存在的不重做）
python3 tools/dem_tiles.py --workers 8

# 3) 给每块生成水域掩膜（同样可反复跑；全国约 30 秒）
python3 tools/dem_water_tiles.py --workers 8

# 3b) 可选：再并进 ESA WorldCover 10 m 的永久水体（补 30 m 会漏掉的窄河，
#     需要先把 3°×3° 的 WorldCover 瓦片下到 terrain/.cache/worldcover/，
#     单张 1.3 亿像素、约 16 MB；这一遍慢得多）
python3 tools/dem_water_tiles.py --worldcover --workers 2
```

`terrain/china_tiles.txt` 是按中国边界（含外扩一圈）筛出来的 1° 瓦片清单。
约 1 280 块瓦片、下载 50 GB 左右；切出来的块约 2 万个（纯陆地），
实测每对块约 0.8 MB，全国约 1.6~2 万个块、合计约 16 GB（gzip 后）；
掩膜另加约 10 KB × 2 万个 ≈ 200 MB。

## 数据来源与许可

高程来自 Copernicus DEM GLO-30 Public（AWS 开放数据桶 `s3://copernicus-dem-30m`，
无需账号）：

> © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under
> COPERNICUS by the European Union and ESA; all rights reserved.
> Distributed under the Copernicus DEM licence.

水域掩膜取自同一批瓦片目录下的 `AUXFILES/<key>_WBM.tif`（Water Body Mask，1 角秒、
与 DEM 逐像素对齐，取值 0 陆地 / 1 海 / 2 内陆水体 / 3 河道），许可与上面的 DEM 相同。
可选的 WorldCover 补充数据：

> © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021)
> processed by ESA WorldCover consortium — CC BY 4.0

海底是按「到岸距离 × 陆架坡度」在浏览器里合成的，不是实测水深；
要真实海底可以换成 GEBCO / ETOPO。

`terrain/.cache/`（原始 1° GeoTIFF，每个 4–50 MB）与 `terrain/china/`（切好的块）
都不入库，见仓库根的 `.gitignore`。
