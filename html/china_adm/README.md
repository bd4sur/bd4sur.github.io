# 全国行政区划边界（导航显示器底图数据）

给 `html/linglong.html` 的导航显示器（ND）用的县、地级、省级边界与行政中心坐标。
页面打开时按需 fetch 一次，找不到就只是不画这一层，其它照旧。

两个文件：

| 文件 | 内容 |
| --- | --- |
| `adm.json` | 要素表：名称、类别、adcode、中心点经纬度、父级 adcode、二进制偏移与长度；另带压缩参数（量化网格）与总顶点数 |
| `adm.bin` | 几何：每个要素一级，环形数组 + zigzag varint 差分 |

## 数据来源

DataV.GeoAtlas 的行政区划边界服务（`https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json`），
从 `100000`（全国）起逐级往下取到县级。要素类别用 adcode 与 `level` 判：

| 类别码 | 含义 | 数量 |
| --- | --- | --- |
| 0 | 省 / 自治区 / 特别行政区（台湾省只有省界，DataV 没有台湾的县级数据） | 30 |
| 1 | 直辖市（110000 / 120000 / 310000 / 500000） | 4 |
| 2 | 地级市 / 自治州 / 地区 / 盟（adcode 末两位为 00） | 333 |
| 3 | 县级市（含省直辖的济源、仙桃、五指山、石河子等） | 404 |
| 4 | 县 / 市辖区 / 旗 | 2466 |

中心点一律取 DataV 给的 `center`（省与直辖市是市政府驻地，地级是市区，县级是县城或区政府），
`centroid` 只在 `center` 缺失时兜底。坐标是 WGS-84 经纬度，与页面里的机场、跑道同一套。

## 生成

```sh
python3 tools/china_adm_fetch.py     # 抓到 terrain/.cache/adm/（约 26 MB 原始 GeoJSON，可重复跑，已有文件跳过）
python3 tools/china_adm_pack.py      # 压成这里的 adm.bin + adm.json
```

`china_adm_pack.py` 做的事：Douglas-Peucker 抽稀成两级（细层 0.002°≈250 m 给 250 km 以内的量程，
粗层 0.01°≈1.1 km 给更远的量程）、量化到整数网格（细层 1/4000°≈25 m，粗层 1/500°≈200 m）、
相邻点只存差分并 zigzag varint 编码。合计 67.6 万顶点、2.1 MB。

## 二进制格式

一个要素的一个层级 = 一段字节流：

```
varint  nRing
对每个环：
    varint  n                      该环顶点数（含首尾重合点）
    varint  zigzag(x0), zigzag(y0)  首点，单位是「度 × grid」
    重复 n-1 次：varint zigzag(dx), varint zigzag(dy)
```

`grid` 与 `gridCoarse` 写在 `adm.json` 里。页面按偏移顺序读，不需要长度字段；
`features` 数组按 (类别, adcode) 排好序，数组顺序就是标注优先级（直辖市 > 地级市 > 县级市 > 县区）。

## 版权

行政区划边界来自 DataV.GeoAtlas（阿里云），仅供学习与演示使用；
行政界线不作为任何官方依据。