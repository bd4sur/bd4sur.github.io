#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_manifest.py —— 生成 linglong/manifest.json（首页玲珑掌机的业务资源清单）

清单格式与 Nano 仓库 infer/build_wasm_gui.sh 生成的一致：
    {"p1_dirs": ["linglong"],
     "files": [{"path": "linglong/app/xxx.scm", "size": 1234, "priority": 1}, ...]}

本站约定（与 Nano 原页面唯一的区别）：
  · **玲珑的一切都在站点下的 linglong/ 里**（数据 + WASM 产物 + 页面胶水，唯一权威目录）；
  · 资源根（掌机内的文件系统根）= 站点根目录 /home/bd4sur/bd4sur.github.io，
    所以清单里的 path 就是**站点相对路径**：linglong/app/… linglong/icon/…
    linglong/wallpaper/…，页面按 "./" + path 取文件；
  · wasm 的编译期常量 PLATFORM_ROOT_DIR=/home/bd4sur/linglong 由 loader.js 用
    MEMFS 符号链接指到 /home/bd4sur/bd4sur.github.io/linglong（见 loader.js 的
    nanoDataRoot），因此 App/图标/壁纸的老路径照旧可用；
  · 额外文档 markdown/ideas.md 留在站点根目录（站点的「灵感」页面也用同一份），
    单独登记为 p1（首页「灵感集」App 要读的就是它）；
  · 本脚本只登记站点上**真实存在**的文件。其余大块可选资源（dict/ ebook/ music/ llm/，
    原始体量约 285MB）本站不托管：想启用就把它们放进 linglong/ 并在 P2_DIRS 里登记，
    重跑本脚本（它们会变成需手动点「下载资源」才拉取的 p2 条目）。

用法：python3 linglong/gen_manifest.py
"""
import json
import os

SITE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = "linglong"                       # 玲珑的数据与产物目录（站点相对路径）
P1_SUBDIRS = ("app", "icon", "wallpaper")   # 启动必需（每次加载全量重取）
EXTRA_P1 = ("markdown/ideas.md",)           # 灵感集 App 打开的文件（站点根目录）
P2_SUBDIRS = ()                             # 本站未托管的可选资源（如 ("dict", "music")）
OUT = os.path.join(SITE_ROOT, DATA_DIR, "manifest.json")


def walk(sub, priority):
    """走 linglong/<sub>，输出站点相对路径（含 linglong/ 前缀）。"""
    out = []
    base = os.path.join(SITE_ROOT, DATA_DIR, sub)
    if not os.path.isdir(base):
        print("跳过（不存在）:", os.path.join(DATA_DIR, sub))
        return out
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames.sort()
        for fn in sorted(filenames):
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, SITE_ROOT)
            out.append({"path": rel, "size": os.path.getsize(full), "priority": priority})
    return out


def main():
    files = []
    for d in P1_SUBDIRS:
        files += walk(d, 1)
    for rel in EXTRA_P1:
        full = os.path.join(SITE_ROOT, rel)
        if os.path.isfile(full):
            files.append({"path": rel, "size": os.path.getsize(full), "priority": 1})
        else:
            print("警告：缺少", rel, "（「灵感集」App 将打不开文档）")
    for d in P2_SUBDIRS:
        files += walk(d, 2)
    files.sort(key=lambda f: (f["priority"], f["path"]))

    # p1_dirs 用顶层目录 linglong：页面据它判定“哪些路径归服务器管”
    # （IndexedDB 里属于这里的残留/墓碑在每次加载时清掉）。
    with open(OUT, "w", encoding="utf-8") as fp:
        json.dump({"p1_dirs": [DATA_DIR], "files": files}, fp, ensure_ascii=False)

    p1 = [f for f in files if f["priority"] == 1]
    p2 = [f for f in files if f["priority"] == 2]
    print("已写出 %s：共 %d 个文件，p1 %d 个 / %.1fMB，p2 %d 个 / %.1fMB" % (
        OUT, len(files), len(p1), sum(f["size"] for f in p1) / 1048576.0,
        len(p2), sum(f["size"] for f in p2) / 1048576.0))


if __name__ == "__main__":
    main()
