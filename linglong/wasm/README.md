# linglong/ —— 首页「玲珑掌机（Nano WASM GUI / WebAssembly）」

**本站与玲珑掌机有关的一切都在 `linglong/` 下**（唯一权威目录，站点别处没有副本）：

* `linglong/` 根：**业务数据** —— `app/` `icon/` `wallpaper/` 是 P0，其余目录（如
  `dict/` `ebook/`）都是 P1；
* `linglong/wasm/`：**掌机的运行时代码与清单**（本 README 也在这里）。

首页（`index.html` 的「首页」）里那台 320×240 掌机就是这套文件：它把 Nano 仓库
`infer/webgui/` 的 WASM 产物原封搬过来运行，**不改动 Nano 仓库任何文件**。

```
index.html                    站点首页：<div id="nano-host"> 掌机界面 +
                              依赖脚本（见文件尾，全部指向 ./linglong/wasm/）
linglong/
  app/ icon/ wallpaper/       P0 业务资源（启动必需，每次刷新全量重取，约 7.7MB）
  dict/ ebook/ …              P1 业务数据（点「资源」按钮才拉；任意目录名都会被自动登记）
  wasm/
    nano_page.css             掌机界面样式（选择器全部带 #nano-host 前缀；掌机区 320px 宽，
                              画布 CSS 尺寸 320×240 = 帧缓冲 1:1）
    nano_page.js              页面胶水层（源自 infer/webgui/index.html 的内联 <script>）
    nano_gui.js               emscripten 产物（首次显示首页时才按需插入）
    nano_gui.wasm             掌机操作系统本体（约 5.4MB）
    loader.js                 资源清单挂载（WASM 下载进度 + 业务资源拉取）+ 兼容符号链接
    vfs.js                    资源面板的虚拟文件系统逻辑层
    store.js                  浏览器本地存储层（IndexedDB）
    dl_models.js              「拉取 LLM」按钮：从 HuggingFace 下模型权重（P2）
    manifest.json             业务资源清单（由 gen_manifest.py 生成，勿手改）
    gen_manifest.py           重新生成 manifest.json 的脚本
markdown/ideas.md             「灵感集」App 要打开的文档（站点根目录，与「灵感」页共用）
```

## 资源根：站点根目录 = 掌机的文件系统根，数据在 linglong/ 下

Nano 侧的资源根是编译期常量 `PLATFORM_ROOT_DIR`（`infer/platform.h`，值为
`/home/bd4sur/linglong`）。本站的映射是：

* 掌机的文件系统根 = 站点根目录 **`/home/bd4sur/bd4sur.github.io`**；
* 业务数据在 **`linglong/`** 下（运行时代码在 `linglong/wasm/`），于是掌机内路径与
  站点 URL 一一对应：`./linglong/app/xxx.scm` ↔
  `/home/bd4sur/bd4sur.github.io/linglong/app/xxx.scm`；
* MEMFS 里另建符号链接 `/home/bd4sur/linglong → /home/bd4sur/bd4sur.github.io/linglong`
  （见 `loader.js` 的 `nanoDataRoot`），所以 wasm 侧所有 `PLATFORM_ROOT_DIR + "/…"`
  的老路径照旧可用，**无需重新构建 wasm**；
* 清单里的 `path` 就是站点相对路径（`linglong/app/…`），因此 `filesBaseUrl` 是空串；
* `markdown/ideas.md` 仍在站点根目录（站点「灵感」页也用它），单独登记为 p1。

改 App 只要改 `linglong/app/`，刷新即生效。

## 「灵感集」App（主菜单新增入口）

`linglong/app/ideasmd.scm`（`;@title=灵感集`）是一个「书签式」App：主菜单点它 →
`(App.launch_with "markdown" "/home/bd4sur/bd4sur.github.io/markdown/ideas.md")`
拉起 MD 阅读器并打开该文档；阅读器退出后按返回链回到本 App，本 App 立即自我退出回主菜单。
新增 App 只需往 `linglong/app/` 丢一个带 `;@id=` / `;@title=` 元数据的 `.scm`（图标可选：
`linglong/icon/<id>.png`），然后重跑清单脚本。

## 维护

改动 `linglong/` 下的**任何**东西（P0 的 app/icon/wallpaper、新加的 P1 目录、
或换掉 `markdown/ideas.md`）之后，重跑一次：

```bash
python3 linglong/wasm/gen_manifest.py    # 重新生成 linglong/manifest.json（分级自动判定）
```

清单分级是自动的：`app/icon/wallpaper` → P0（`priority: 1`，每刷新全量重取）；
`linglong/` 里其余目录/文件 → P1（`priority: 2`，点「资源」按钮才拉）；
`llm/` 跳过（P2，走 HuggingFace）；运行时代码/清单/文档跳过。

## 两枚按钮、两件事：「资源」（p2）与「拉取 LLM」（模型）

2026-11-21 起这两件事彻底分开，各管一枚按钮——以前两个脚本抢同一枚 `#dl-btn` 的文案与
置灰状态，会出现「模型根本没下却显示已就绪、置灰后点不动」的假状态。

### 「资源」（`#dl-btn`，nano_page.js）

只做一件事：把**站点目录里确实存在**的 p2 业务资源（`manifest.json` 里 `priority=2`
的条目）拉进 MEMFS + IndexedDB。

* 状态判定基于事实，不看计数器：每个文件都去 MEMFS / IndexedDB 核对**尺寸**；
* **分级规则（自动发现，不用改脚本）**：`linglong/` 里除 `app/` `icon/` `wallpaper/`
  （P0）与掌机自身的运行时代码/清单/文档（`*.js` `nano_gui.wasm` `manifest.json`
  `README.md` …）之外，**任何目录或文件都算 P1**（`gen_manifest.py` 自动登记为
  `priority: 2`）；`llm/` 例外——它是 P2，只从 HuggingFace 拉。
* 本站**当前 P1 = 0 个文件**（`linglong/` 里只有 P0 与运行时代码），所以按钮显示
  `资源：无`：照常显示、不置灰，点一下只会重新核对；`title` 里写明规则与“怎么加”。
  往 `linglong/` 里放任何目录（如 `dict/`）后跑一次 `python3 linglong/wasm/gen_manifest.py`
  就会变成可下载条目。
* 有 p2 时：未下载 → `资源 12MB`；只在本机缓存里 → `缓存 12MB`；全部到位 →
  `资源：就绪`。**按钮永不置灰**；
* **点一次 = 重新下载一遍并替换 IndexedDB 缓存**：不看“缺什么”，清单里的 p2 全部走
  `nanoMountPending(..., force=true)` 重下（已缓存也照跑），拉下来的字节直接覆盖 MEMFS
  与 IndexedDB；失败 → 带 `·重试` 且可点，原因写在 `title` 里，旧缓存/旧文件不动。

### 「拉取 LLM」（`#llm-btn`，dl_models.js）

* 从 HuggingFace 下载两个「鹦鹉笼」模型权重
  - `nano-168m-q80.bin`（166 MB）
  - `nano-56m-q80.bin`（55 MB）

  来源：`https://huggingface.co/bd4sur/Nano-Pod-Models/resolve/main/…`（合计约 221 MB）；
* **流式**写入两处（不整体驻留内存，按钮上显示百分比、`title` 里是明细）：
  - MEMFS：`/home/bd4sur/bd4sur.github.io/linglong/llm/<文件名>`
    —— 掌机内即 `/home/bd4sur/linglong/llm/<文件名>`（符号链接），正是
    `PLATFORM_ROOT_DIR/llm` 这个模型目录，落位即可被 App 看见；
  - IndexedDB：键 `linglong/llm/<文件名>`（与 loader 的存储语义一致），下次打开页面由
    loader 当「本机文件」自动灌回 MEMFS（日志里 `本机文件: 2 个`）。
* **点一次 = 重新下载一遍并替换缓存**（不因“已就绪/已缓存”而跳过；下载中重复点击无效，
  单飞）。写入是**原子替换**：先写 `<名>.part`，字节数核对通过后 `rename` 覆盖，
  最后覆盖 IndexedDB 里的旧缓存 —— 中途失败只删 `.part`，原来的可用副本原样保留。
* **尺寸以「权威值」为准**：先向上游发一次 `HEAD` 问真实字节数（拿到就缓存；离线 / CORS
  失败则退回文件里的快照值），所以上游换文件也不会陷入「尺寸对不上就一直重下」。
* 按钮文案：`LLM 221MB`（还差多少要联网下）/ `LLM：缓存 221MB`（掌机内存里没有、本机
  已缓存，点了会重下并替换）→ `LLM 45%`（下载中）→ `LLM：就绪`。**永不置灰**（就绪态
  再点也是重下），失败显示 `…·重试` 并把原因写进 `title`。

⚠️ `linglong/llm/` 在 `p1_dirs`（= `linglong`）之下，但模型**不在服务器清单**里，
所以 `loader.js` 里有一条站点侧的豁免（`NANO_KEEP_LOCAL_PREFIXES`）：这些路径不参与
p1 的「残骸清空」，否则每次加载都会把模型从 IndexedDB 删掉。

⚠️ 内存：两个模型合计约 221 MB，会常驻 MEMFS（JS 堆）——低配设备上建议只留需要的那个
（改 `dl_models.js` 的 `MODELS` 数组即可）。

## 与原页面的差异（有意为之）

1. **p2 大块资源本站不托管**：`dict/`（词典）、`ebook/`、`music/`、`llm/` 模型合计约
   285MB（若启用则放在 `linglong/` 下），清单里没有它们的条目，所以「资源」按钮整枚隐去，
   词典 / 音乐盒等需要这些数据的 App 会提示缺文件（模型权重另走「拉取 LLM」）。要启用：把对应目录拷到站点根目录，
   在 `linglong/gen_manifest.py` 的 `P2_SUBDIRS` 里登记，重跑脚本（它们会变成需要手动点
   「下载资源」才拉取的 p2 条目）。
2. **掌机区固定 320px 宽、画面 1 逻辑像素 = 1 CSS px**：原页面按 `100vw/100vh` 自适应
   放大到 480px，本站不再缩放 —— 320×240 帧缓冲与 320×240 CSS 像素一一对应
   （`image-rendering: pixelated`），在 1x/2x/3x 屏上是整数倍最近邻放大，锐利无插值；
   分数倍率屏（如 1.5x）由浏览器按最近邻抽样，CSS 侧已无可为。
3. **加载进度放在屏幕里**：进度面板（`#load-panel`）不再挂在画布下方，而是**覆盖在
   320×240 画布之上**（`#screen-box` 里绝对定位），显示「Nano 掌机 · 正在启动…」+ 程序/资源
   两条进度；启动完成（`onP1Ready`）即 `display:none`，屏幕交给 wasm。可选资源（p2）的
   下载进度显示在「资源」按钮文案上。
4. **去掉状态行与操作提示行**：原页面屏幕下方有两行文字（「● 运行中 · N fps」与键鼠提示），
   本站不再显示 —— 界面是「屏幕 + ESC/姿态/资源/拉取 LLM/资源管理 五枚按钮」
   （共五枚，必要时自动换行）。状态文案仍由
   胶水层写入（`nano_page.js` 里给 `#status` 换成空吸器），只有「中止/失败」类消息会打到
   浏览器控制台，便于排查。
5. **键盘归属**：只有当掌机可见且「焦点在画布上」或「鼠标停在掌机上」时才接管
   方向键 / 回车 / Esc / 数字键，否则键盘留给站点页面（滚动、导航）——
   原页面是 `document` 级全局接管。
6. **切页暂停**：离开首页时 `Module.pauseMainLoop()`，掌机状态（当前 App、MEMFS）
   原样保留，回到首页继续（原页面只有一个页面，无需此逻辑）。

## 更新 Nano 部分文件时

`nano_page.js` 源自 `infer/webgui/index.html` 的内联脚本（**整段同步**，含它的滚轮
三通道逻辑：GUI 平滑通道 / 未认领 App 的合成手指 / 已认领 App 的原生通道），
`loader.js` / `vfs.js` / `store.js` / `nano_gui.*` 直接拷贝。

重新拷贝时请保留下列**站点集成改动**：

* `nano_page.js`：文件头 ①②③④ 四处（资源根 `NANO_MANIFEST_URL` / `NANO_FILES_BASE_URL` /
  `resRoot`；`locateFile`；`#status` 空吸器；画布 `gesturestart`/`dblclick`；
  `reportKey` 的 `nanoKeyboardActive()` 门控；`fmFetchDefault` 的路径前缀；
  文件尾「首页嵌入」整段）；
* `loader.js`：`NANO_LEGACY_ROOT` 段（新资源根 + `linglong` 兼容符号链接）；
* `nano_page.css`：`#nano-host` 前缀、320px 定宽、`content-box` 画布与覆盖式加载面板。

同步命令（在站点仓库根目录，目标全部是 `linglong/`）：

```bash
cp  ../Nano/infer/webgui/{nano_gui.js,nano_gui.wasm} linglong/
cp  ../Nano/infer/webgui/{store.js,vfs.js} linglong/
rsync -a --delete ../Nano/infer/app/ linglong/app/   # 会删掉 linglong/app/ideasmd.scm，记得再拷回来
# 或者只拷改动过的 App 文件：cp ../Nano/infer/app/markdown.scm linglong/app/
python3 linglong/wasm/gen_manifest.py
```
