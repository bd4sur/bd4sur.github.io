#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_manifest.py —— 生成 linglong/manifest.json（首页玲珑掌机的业务资源清单）

清单格式与 Nano 仓库 infer/build_wasm_gui.sh 生成的一致：
    {"p1_dirs": ["linglong"],
     "files": [{"path": "linglong/app/xxx.scm", "size": 1234, "priority": 1}, ...]}

分级规则（**自动发现**，往 linglong/ 里丢东西就会自动登记，不用改本脚本）：

  P0  = `linglong/app/` `icon/` `wallpaper/`（+ 站点根下的 `markdown/ideas.md`）
        → `priority: 1`：每次刷新由 loader 从站点**全量重取**、覆盖 MEMFS，不写 IndexedDB。
  P1  = `linglong/` 里**除 P0 之外的一切业务数据**
        → `priority: 2`：点「资源」按钮才拉（站点目录 → MEMFS + IndexedDB，再点=重下替换）。
        排除两类（它们不是“业务资源”，不进清单）：
          · `linglong/wasm/` 整个目录：掌机运行时代码、清单与文档
          （manifest.json、gen_manifest.py、loader.js、nano_page.js/.css、
          nano_gui.js/.wasm、store.js、vfs.js、dl_models.js、README.md）；
          · `llm/`：那是 P2（远端 HuggingFace 模型），永远不从站点拉。
  P2  = `linglong/llm/` 的两个模型权重 → 不在本清单里，由 `resources.js`/`dl_models.js`
        从 HuggingFace 下载并写 MEMFS + IndexedDB。

其它约定（与 Nano 原页面的区别）：

  · **玲珑的一切都在站点下的 linglong/ 里**：业务数据在 linglong/（app/ icon/ wallpaper/
    等），掌机的运行时代码与清单在 linglong/wasm/（唯一权威目录，别处无副本）；
  · 资源根（掌机内的文件系统根）= 站点根目录 /home/bd4sur/bd4sur.github.io，
    所以清单里的 path 就是**站点相对路径**：`linglong/app/…`、`linglong/dict/…`；
  · wasm 的编译期常量 PLATFORM_ROOT_DIR=/home/bd4sur/linglong 由 loader.js 用 MEMFS
    符号链接指到 `/home/bd4sur/bd4sur.github.io/linglong`（见 loader.js 的 nanoDataRoot）；
  · `markdown/ideas.md` 留在站点根目录（站点「灵感」页也用它），单独登记为 P0。

用法：python3 linglong/wasm/gen_manifest.py
"""
import json
import os

# 本脚本在 <站点>/linglong/wasm/ 下 → 站点根是它的上三级
SITE_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = "linglong"                          # 玲珑的数据与产物目录（站点相对路径）
P0_SUBDIRS = ("app", "icon", "wallpaper")      # 启动必需：每次刷新全量重取
P0_EXTRA = ("markdown/ideas.md",)              # 站点根下的文档（P0，灵感集 App 要读）
# 掌机自身的运行时代码 / 清单 / 文档现在统一放在 linglong/wasm/ 下：整个目录跳过，
# 它们不是“业务资源”，永不进清单。
RUNTIME_DIR = "wasm"
# 这些顶层目录同样不算 P1：llm/ 是 P2（远端 HuggingFace 模型，永远不从站点拉）
P2_ONLY_SUBDIRS = ("llm",)
# 清单就写在运行时代码目录里（与 nano_page.js 的 NANO_MANIFEST_URL 对应）
OUT = os.path.join(SITE_ROOT, DATA_DIR, RUNTIME_DIR, "manifest.json")


def entry(full, priority):
    return {"path": os.path.relpath(full, SITE_ROOT),
            "size": os.path.getsize(full),
            "priority": priority}


def collect():
    """返回 (p0, p1, skipped)；p1 = linglong/ 里除 P0 与运行时代码之外的一切。"""
    base = os.path.join(SITE_ROOT, DATA_DIR)
    p0, p1, skipped = [], [], []
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = sorted(d for d in dirnames if not d.startswith("."))
        for fn in sorted(filenames):
            if fn.startswith("."):             # .DS_Store 之类
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, base)   # 形如 app/x.scm、dict/a.csv
            top = rel.split(os.sep)[0]
            if top in P0_SUBDIRS:
                p0.append(entry(full, 1))
            elif top in P2_ONLY_SUBDIRS or top == RUNTIME_DIR:
                skipped.append(rel)             # 运行时代码目录 / P2 模型：不进清单
            else:
                p1.append(entry(full, 2))       # 其余业务数据 → P1（点按钮才拉）
    return p0, p1, skipped


def main():
    p0, p1, skipped = collect()

    files = p0 + p1
    for rel in P0_EXTRA:                        # 站点根下的文档（P0）
        full = os.path.join(SITE_ROOT, rel)
        if os.path.isfile(full):
            files.append({"path": rel, "size": os.path.getsize(full), "priority": 1})
        else:
            print("警告：缺少", rel, "（「灵感集」App 将打不开文档）")
    files.sort(key=lambda f: (f["priority"], f["path"]))

    # p1_dirs 用顶层目录 linglong：页面据它判定“哪些路径归服务器管”
    # （IndexedDB 里属于这里的残留/墓碑在每次加载时清掉）。
    with open(OUT, "w", encoding="utf-8") as fp:
        json.dump({"p1_dirs": [DATA_DIR], "files": files}, fp, ensure_ascii=False)

    b0 = sum(f["size"] for f in p0) + sum(os.path.getsize(os.path.join(SITE_ROOT, r))
                                          for r in P0_EXTRA if os.path.isfile(os.path.join(SITE_ROOT, r)))
    b1 = sum(f["size"] for f in p1)
    print("已写出 %s" % OUT)
    print("  P0（启动必需，每次刷新全量重取）: %d 个 / %.1fMB" % (len(p0) + len([r for r in P0_EXTRA if os.path.isfile(os.path.join(SITE_ROOT, r))]), b0 / 1048576.0))
    print("  P1（点「资源」按钮才拉，站点目录）: %d 个 / %.1fMB" % (len(p1), b1 / 1048576.0))
    if p1:
        tops = sorted({f["path"].split("/")[1] for f in p1 if f["path"].count("/") >= 2})
        loose = sorted({os.path.basename(f["path"]) for f in p1 if f["path"].count("/") == 1})
        if tops:
            print("       P1 目录:", ", ".join(t + "/" for t in tops))
        if loose:
            print("       P1 顶层文件:", ", ".join(loose))
    else:
        print("       P1 为空：linglong/ 里除 %s/ 与 wasm/（运行时代码）外没有业务数据 —— "
              "往 linglong/ 里放任何目录/文件（如 dict/）后重跑本脚本即可出现"
              % "/".join(P0_SUBDIRS))
    if skipped:
        print("  跳过（运行时代码/清单/文档、P2 的 llm/）: %d 个" % len(skipped))


if __name__ == "__main__":
    main()
