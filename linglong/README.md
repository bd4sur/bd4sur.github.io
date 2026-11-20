# linglong/ —— 首页「玲珑掌机（Nano WASM GUI / WebAssembly）」

**本站与玲珑掌机有关的一切都在这个目录里**（唯一权威目录，站点别处没有副本）。
首页（`index.html` 的「首页」）里那台 320×240 掌机就是下面这组文件：它把 Nano 仓库
`infer/webgui/` 的 WASM 产物原封搬过来运行，**不改动 Nano 仓库任何文件**。
界面上只有「屏幕 + 四枚按钮」：状态行与操作提示行已去掉（见下方「与原页面的差异」）。

```
index.html                站点首页：<div id="nano-host"> 掌机界面 + 依赖脚本（见文件尾，全部指向 ./linglong/）
linglong/
  nano_page.css           掌机界面样式（选择器全部带 #nano-host 前缀，不污染站点样式；
                          掌机区固定 320px 宽，画布 CSS 尺寸 320×240 = 帧缓冲 1:1）
  nano_page.js            页面胶水层（源自 infer/webgui/index.html 的内联 <script>）
  nano_gui.js             emscripten 产物（首次显示首页时才按需插入）
  nano_gui.wasm           掌机操作系统本体（约 5.4MB）
  loader.js               资源清单挂载（WASM 下载进度 + 业务资源拉取）+ 兼容符号链接
  vfs.js                  资源面板的虚拟文件系统逻辑层
  store.js                浏览器本地存储层（IndexedDB）
  manifest.json           业务资源清单（由 gen_manifest.py 生成，勿手改）
  gen_manifest.py         重新生成 manifest.json 的脚本
  app/ icon/ wallpaper/   业务资源（启动必需 p1，每次加载全量重取，约 7.8MB）
../markdown/ideas.md      「灵感集」App 要打开的文档（站点原有文件，与站点「灵感」页共用）
```

## 资源根：站点根目录 = 掌机的文件系统根，数据在 linglong/ 下

Nano 侧的资源根是编译期常量 `PLATFORM_ROOT_DIR`（`infer/platform.h`，值为
`/home/bd4sur/linglong`）。本站的映射是：

* 掌机的文件系统根 = 站点根目录 **`/home/bd4sur/bd4sur.github.io`**；
* 玲珑的数据与产物都在 **`linglong/`** 子目录里，于是掌机内路径与站点 URL 一一对应：
  `./linglong/app/xxx.scm` ↔ `/home/bd4sur/bd4sur.github.io/linglong/app/xxx.scm`；
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

改动 `linglong/app/` `linglong/icon/` `linglong/wallpaper/` 或换文档后，重跑：

```bash
python3 linglong/gen_manifest.py    # 重新生成 linglong/manifest.json
```

## 与原页面的差异（有意为之）

1. **p2 大块资源本站不托管**：`dict/`（词典）、`ebook/`、`music/`、`llm/` 模型合计约
   285MB（若启用则放在 `linglong/` 下），清单里没有它们的条目，所以「资源」按钮显示「已就绪」，词典 / 音乐盒 /
   鹦鹉笼等需要这些数据的 App 会提示缺文件。要启用：把对应目录拷到站点根目录，
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
   本站不再显示 —— 界面只剩「屏幕 + ESC/姿态/资源/资源管理 四枚按钮」。状态文案仍由
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
python3 linglong/gen_manifest.py
```
