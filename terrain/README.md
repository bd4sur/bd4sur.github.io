# terrain/ — 真实高程数据（DEM）窗口

本目录下的 `.bin` / `.json` 是 `tools/dem_bake.py` 从 **Copernicus DEM GLO-30 Public**
烘焙出来的世界高程图，给 `html/linglong.html` 的「实时海洋」地形用：

- `.bin`：Int16 小端、行优先，**第 0 行是最南一行**（与渲染器纹理 v 方向一致），
  每格 ≈ 相对平均海平面的高程（米）；海面与海底为负值。
- `.json`：窗口中心经纬、UTM 带、格距、高程范围、来源与署名。

页面用法：`html/linglong.html?terrain=qingdao`（25.6 km / 1024² / 25 m）。
不带参数时用程序化生成的随机群岛。

重新烘焙（需要 rasterio / pyproj / numpy / scipy）：

```bash
python3 -m venv /tmp/demvenv && /tmp/demvenv/bin/pip install rasterio pyproj numpy scipy
/tmp/demvenv/bin/python tools/dem_bake.py --lon 120.55 --lat 36.10 \
    --size-km 25.6 --res 1024 --name qingdao --out-dir terrain
```

## 数据来源与许可

高程数据来自 Copernicus DEM GLO-30 Public（AWS 开放数据桶 `s3://copernicus-dem-30m`，
无需账号）：

> © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under
> COPERNICUS by the European Union and ESA; all rights reserved.
> Distributed under the Copernicus DEM licence.

海底是程序化合成的（到岸距离 × 陆架坡度 + 低频扰动），不是实测水深；
正式用可以换成 GEBCO / ETOPO。

> 注：`terrain/.cache/` 里是下载下来的原始 1° GeoTIFF 瓦片（每块 4–50 MB），
> 已在 `.gitignore` 里排除，不入库。
