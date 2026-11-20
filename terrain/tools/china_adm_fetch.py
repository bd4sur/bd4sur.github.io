#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""抓取 DataV.GeoAtlas 的全国行政区划边界（省 / 地级 / 县级）。

产出（全部落到 terrain/.cache/adm/，已在 .gitignore 里）：
    province_100000.json          全国省级（35 个 feature，含港澳台）
    <adcode>.json                 每个省 / 地级市的 _full 文件，原样保存

用法：
    python3 tools/china_adm_fetch.py            # 抓省 + 地级 + 县级，已存在的跳过
    python3 tools/china_adm_fetch.py --refresh  # 强制重抓

接口：https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json
    adcode 取 100000（全国）时返回省级列表；取省级 adcode 时返回地级列表；
    取地级 adcode 时返回县级列表。直辖市的省级 _full 直接返回各区（县级）。
"""
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = 'https://geo.datav.aliyun.com/areas_v3/bound/%s_full.json'
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CACHE = os.path.join(ROOT, 'terrain', '.cache', 'adm')
REFRESH = '--refresh' in sys.argv


def path_for(adcode):
    return os.path.join(CACHE, '%s.json' % adcode)


def fetch(adcode, parent_level):
    """抓一个 _full 文件；该层级没有下级（如县级）时返回 None。"""
    p = path_for(adcode)
    if os.path.exists(p) and not REFRESH:
        try:
            with open(p, 'rb') as f:
                return json.loads(f.read().decode('utf-8'))
        except Exception:
            pass
    url = BASE % adcode
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=40) as r:
                raw = r.read()
            d = json.loads(raw.decode('utf-8'))
            if not isinstance(d, dict) or 'features' not in d:
                raise ValueError('bad payload')
            tmp = p + '.part'
            with open(tmp, 'wb') as f:
                f.write(raw)
            os.replace(tmp, p)
            return d
        except Exception as e:
            if attempt == 3:
                sys.stderr.write('!! %s (%s) 失败: %s\n' % (adcode, parent_level, e))
                return None
            time.sleep(1.2 * (attempt + 1))
    return None


def feats(d):
    return [] if not d else d.get('features', [])


def main():
    os.makedirs(CACHE, exist_ok=True)

    country = fetch(100000, 'country')
    if country is None:
        sys.exit('全国列表抓取失败')
    provs = feats(country)
    print('省级 %d 个' % len(provs))

    # 第一层：省 → 地级（直辖市/特别行政区直接给县级）
    jobs = []
    for f in provs:
        jobs.append(f['properties']['adcode'])
    with ThreadPoolExecutor(max_workers=8) as ex:
        list(ex.map(lambda a: fetch(a, 'province'), jobs))

    # 第二层：地级 → 县级。只抓 level == 'city' 且有下级的
    cities = []
    for a in jobs:
        d = fetch(a, 'province')
        for c in feats(d):
            pr = c['properties']
            if pr.get('level') == 'city' and pr.get('childrenNum', 0) > 0:
                cities.append(pr['adcode'])
    cities = sorted(set(cities))
    print('地级 %d 个' % len(cities))

    with ThreadPoolExecutor(max_workers=8) as ex:
        list(ex.map(lambda a: fetch(a, 'city'), cities))

    n = len([f for f in os.listdir(CACHE) if f.endswith('.json')])
    tot = sum(os.path.getsize(os.path.join(CACHE, f)) for f in os.listdir(CACHE) if f.endswith('.json'))
    print('缓存文件 %d 个，共 %.1f MB' % (n, tot / 1048576.0))


if __name__ == '__main__':
    main()