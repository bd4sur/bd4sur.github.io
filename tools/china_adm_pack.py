#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 terrain/.cache/adm/ 里的行政区划边界压成导航显示器（ND）用的二进制。

先跑 tools/china_adm_fetch.py 把原始 GeoJSON 抓到本地，再跑这个脚本。

产出（写进 html/china_adm/，随仓库发布）：
    adm.bin     几何：每级一个块，环形数组 + zigzag varint 差分
    adm.json    要素表（名称 / 类别 / 中心点 / 父级 / 二进制偏移）与压缩参数

为什么要自己定格式：原始 GeoJSON 25.9 MB、115 万个顶点，直接塞进页面没法用。
这里做两件事——
  1. 抽稀：Douglas-Peucker，粗层 0.01°（约 1.1 km，给 500/1000 km 量程），
     细层 0.002°（约 220 m，给 200 km 以内的量程）。
  2. 量化+差分：1e-4 度（约 11 m）落到整数网格，相邻点只存差值，
     zigzag + varint，每点平均不到 2 字节。

坐标一律 WGS-84 经纬度，与页面其它地理数据（机场、跑道）同一套。
"""
import json
import os
import sys
import math

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CACHE = os.path.join(ROOT, 'terrain', '.cache', 'adm')
OUT_DIR = os.path.join(ROOT, 'html', 'china_adm')

GRID = float(os.environ.get('ADM_GRID', 4000.0))      # 细层网格：每度多少个整数单位（4e3 → 2.5e-4 度 ≈ 25 m）
GRID_C = float(os.environ.get('ADM_GRID_C', 500.0))   # 粗层网格：2e-3 度 ≈ 200 m
TOL_FINE = 0.002        # 度
TOL_COARSE = 0.010      # 度

# 类别码（与页面里的 ADM_KIND 常量一一对应）
K_PROVINCE = 0          # 省 / 自治区 / 特别行政区
K_MUNI = 1              # 直辖市
K_CITY = 2              # 地级市 / 自治州 / 地区 / 盟
K_CITY_CTY = 3          # 县级市
K_COUNTY = 4            # 县 / 区 / 旗 / 其它县级

MUNI = {110000, 120000, 310000, 500000}


def rings_of(geom):
    """GeoJSON 几何 → 环列表（每个环是 [(lon,lat), ...]）。"""
    t = geom['type']
    if t == 'Polygon':
        for r in geom['coordinates']:
            yield r
    elif t == 'MultiPolygon':
        for poly in geom['coordinates']:
            for r in poly:
                yield r


def dp(pts, tol):
    """Douglas-Peucker（迭代版，避免深递归）。"""
    n = len(pts)
    if n < 3:
        return pts
    keep = bytearray(n)
    keep[0] = keep[n - 1] = 1
    stack = [(0, n - 1)]
    t2 = tol * tol
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        x1, y1 = pts[i]
        x2, y2 = pts[j]
        dx = x2 - x1
        dy = y2 - y1
        d2 = dx * dx + dy * dy
        best = -1.0
        bi = -1
        if d2 == 0.0:
            for k in range(i + 1, j):
                x, y = pts[k]
                dd = (x - x1) ** 2 + (y - y1) ** 2
                if dd > best:
                    best = dd
                    bi = k
        else:
            for k in range(i + 1, j):
                x, y = pts[k]
                tt = ((x - x1) * dx + (y - y1) * dy) / d2
                if tt < 0.0:
                    tt = 0.0
                elif tt > 1.0:
                    tt = 1.0
                px = x - x1 - tt * dx
                py = y - y1 - tt * dy
                dd = px * px + py * py
                if dd > best:
                    best = dd
                    bi = k
        if best > t2:
            keep[bi] = 1
            stack.append((i, bi))
            stack.append((bi, j))
    return [p for p, k in zip(pts, keep) if k]


def varint(buf, v):
    while True:
        b = v & 0x7F
        v >>= 7
        if v:
            buf.append(b | 0x80)
        else:
            buf.append(b)
            return


def zigzag(v):
    return (v << 1) if v >= 0 else ((-v << 1) - 1)


def pack_rings(buf, rings, grid=GRID):
    """一个要素的全部环 → 二进制；返回 (点总数)。"""
    varint(buf, len(rings))
    npts = 0
    for pts in rings:
        n = len(pts)
        varint(buf, n)
        x0 = int(round(pts[0][0] * grid))
        y0 = int(round(pts[0][1] * grid))
        varint(buf, zigzag(x0))
        varint(buf, zigzag(y0))
        px, py = x0, y0
        for p in pts[1:]:
            x = int(round(p[0] * grid))
            y = int(round(p[1] * grid))
            varint(buf, zigzag(x - px))
            varint(buf, zigzag(y - py))
            px, py = x, y
        npts += n
    return npts


def kind_of(props, parent_level):
    lv = props.get('level')
    ad = int(props.get('adcode') or 0)
    name = props.get('name') or ''
    if lv == 'province':
        return K_MUNI if ad in MUNI else K_PROVINCE
    if lv == 'city':
        # 省直辖县级市（济源 / 仙桃 / 五指山 / 石河子……）的 adcode 末两位不是 00
        return K_CITY if ad % 100 == 0 else K_CITY_CTY
    # district 级：名字带「市」的是县级市
    return K_CITY_CTY if name.endswith('市') else K_COUNTY


def short_name(name, kind):
    """给窄屏/密标用：直辖市与地级市去掉尾字，县区保留全名。"""
    if kind in (K_MUNI, K_CITY, K_CITY_CTY) and name.endswith('市') and len(name) > 2:
        return name[:-1]
    return name


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    files = sorted(f for f in os.listdir(CACHE) if f.endswith('.json'))
    if not files:
        sys.exit('缓存是空的，先跑 tools/china_adm_fetch.py')

    # ---- 收集要素：同一个 adcode 只留第一次（省级文件里也会带下级？没有，但保险）----
    seen = set()
    feats = []
    for fn in files:
        try:
            with open(os.path.join(CACHE, fn), encoding='utf-8') as f:
                d = json.load(f)
        except Exception:
            continue
        for ft in d.get('features', []):
            props = ft.get('properties') or {}
            g = ft.get('geometry')
            if not g or not props.get('name'):
                continue
            ad = int(props.get('adcode') or 0)
            if ad in seen:
                continue
            seen.add(ad)
            feats.append((props, g))

    print('要素 %d 个' % len(feats))

    # 省级文件里的「省级要素」与地级文件的「地级要素」互不重叠，直接按 level 分类。
    out_feats = []
    buf = bytearray()
    stat = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}
    tot_pts = 0
    lon0 = lat0 = 1e9
    lon1 = lat1 = -1e9

    for props, g in feats:
        kind = kind_of(props, props.get('level'))
        stat[kind] += 1
        ctr = props.get('center') or props.get('centroid')
        if not ctr:
            continue
        rings = [list(map(lambda c: (float(c[0]), float(c[1])), r)) for r in rings_of(g)]
        rings = [r for r in rings if len(r) >= 3]
        if not rings:
            continue

        off = len(buf)
        n_fine = 0
        for r in rings:
            n_fine += pack_rings(buf, [dp(r, TOL_FINE)])
        len_fine = len(buf) - off

        off2 = len(buf)
        for r in rings:
            pack_rings(buf, [dp(r, TOL_COARSE)], GRID_C)
        len_coarse = len(buf) - off2
        tot_pts += n_fine

        for r in rings:
            for x, y in r:
                if x < lon0: lon0 = x
                if x > lon1: lon1 = x
                if y < lat0: lat0 = y
                if y > lat1: lat1 = y

        parent = (props.get('parent') or {}).get('adcode') or 0
        out_feats.append([
            props['name'],
            kind,
            int(props['adcode']),
            round(float(ctr[0]), 5),
            round(float(ctr[1]), 5),
            int(parent),
            off, len_fine, off2, len_coarse,
        ])
        if len(out_feats) % 500 == 0:
            print('  ..%d' % len(out_feats))

    # 排序：先级别、再 adcode，页面据此决定标注优先级（数组顺序即优先级）
    out_feats.sort(key=lambda f: (f[1], f[2]))

    with open(os.path.join(OUT_DIR, 'adm.bin'), 'wb') as f:
        f.write(buf)

    meta = {
        'version': 1,
        'grid': GRID,
        'gridCoarse': GRID_C,
        'bbox': [round(lon0, 4), round(lat0, 4), round(lon1, 4), round(lat1, 4)],
        'bin': 'adm.bin',
        'kinds': stat,
        'points': tot_pts,
        'features': out_feats,
    }
    with open(os.path.join(OUT_DIR, 'adm.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, separators=(',', ':'))

    mb = os.path.getsize(os.path.join(OUT_DIR, 'adm.bin')) / 1048576.0
    jb = os.path.getsize(os.path.join(OUT_DIR, 'adm.json')) / 1048576.0
    print('要素 %d（省 %d / 直辖市 %d / 地级 %d / 县级市 %d / 县区 %d）'
          % (len(out_feats), stat[0], stat[1], stat[2], stat[3], stat[4]))
    print('细层顶点 %d，adm.bin %.2f MB，adm.json %.2f MB' % (tot_pts, mb, jb))
    print('bbox %s' % meta['bbox'])


if __name__ == '__main__':
    main()