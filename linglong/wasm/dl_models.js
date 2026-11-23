"use strict";
// =============================================================================
// dl_models.js —— 「拉取 LLM」按钮（#llm-btn）：下载两个 Nano 模型权重
// -----------------------------------------------------------------------------
// 2026-11-21 拆分：以前模型下载挂在「资源」按钮（#dl-btn）上，和 p2 业务资源抢同一枚
// 按钮的文案与置灰状态，结果两边状态互相覆盖——明明没下模型却显示「已就绪」并置灰，
// 用户点了没反应，也没别处可点。现在职责彻底分开：
//   · #dl-btn  「资源」  —— 只拉站点 manifest 里 priority=2 的 p2 业务资源（nano_page.js）
//   · #llm-btn 「拉取 LLM」—— 只拉模型权重（本文件）
//
// 与宿主约定的路径（关键，未变）：
//   · MEMFS：/home/bd4sur/bd4sur.github.io/linglong/llm/<文件名>
//     掌机内看到的是 /home/bd4sur/linglong/llm/<文件名>（loader.js 建的符号链接
//     /home/bd4sur/linglong → <资源根>/linglong），而 PLATFORM_ROOT_DIR/llm 正是
//     nanochat 找模型的地方，所以落位即生效。
//   · IndexedDB：键 = `linglong/llm/<文件名>`。下次加载时 loader.js 会把它当「本机
//     文件」灌回 MEMFS —— 为此 loader.js 的 NANO_KEEP_LOCAL_PREFIXES 对
//     `linglong/llm/` 做了 p1 豁免（否则会被当成“服务器上已删的残骸”清掉）。
//
// 状态判定（按钮文案/置灰的唯一依据）：
//   每个模型都实地核对 —— MEMFS 里的尺寸、IndexedDB 里 Blob 的尺寸，都要和**权威
//   尺寸**一致才算到位。权威尺寸优先向 HuggingFace 发一次 HEAD 问（拿到就缓存；
//   离线/CORS 失败则退回本文件的硬编码快照），避免“上游换了文件、本地尺寸对不上
//   就永远重下”。任何一环没核实通过，按钮都不会显示「就绪」。
//   · **点一次 = 重新下载一遍并替换缓存**：已缓存也不置灰；点下去一律从 HuggingFace
//     重下（force）：先写 `<名>.part`，校验字节数通过后 rename 覆盖，最后覆盖 IndexedDB
//     里的旧缓存 —— 中途失败只丢 .part，原来的可用副本原样保留；
//   · 下载失败 → 删掉半截的 .part + 按钮回到可点状态并把原因写进 title；
//   · 下载中重复点击无效（单飞）。
// =============================================================================

(function () {
  // ---- 要下载的模型（HuggingFace；size 是 HEAD 不可用时的快照基准） ----
  const MODELS = [
    {
      label: "Nano-168M",
      name: "nano-168m-q80.bin",
      url: "https://huggingface.co/bd4sur/Nano-Pod-Models/resolve/main/nano-168m-q80.bin",
      size: 174117344, // 166 MB
    },
    {
      label: "Nano-56M",
      name: "nano-56m-q80.bin",
      url: "https://huggingface.co/bd4sur/Nano-Pod-Models/resolve/main/nano-56m-q80.bin",
      size: 57757152, // 55 MB
    },
  ];
  const REL_DIR = "linglong/llm";                       // manifest 风格相对路径（也是 IndexedDB 键前缀）
  const DEFAULT_ROOT = "/home/bd4sur/bd4sur.github.io"; // 掌机内的资源根（与 nano_page.js 一致）
  const HEAD_TIMEOUT_MS = 4000;

  const llmBtn = document.getElementById("llm-btn");
  if (!llmBtn) {
    console.warn("[llm] 找不到 #llm-btn，模型下载未挂载");
    return;
  }

  // ---- 状态 ----------------------------------------------------------------
  let running = false;        // 单飞
  let lastError = "";         // 上次失败原因（写进 title，成功后清空）
  let uiSeq = 0;              // 异步核对的代际号：晚到的旧结果不许覆盖新状态
  const sizeCache = new Map();// url → 权威字节数

  // ---- 小工具 --------------------------------------------------------------
  const mb = (b) => (b / 1048576).toFixed(b >= 10485760 ? 0 : 1);

  // 资源根：优先用胶水层的 RES_ROOT（脚本级 const，跨 <script> 可见）
  function dataRoot() {
    try {
      if (typeof RES_ROOT === "string" && RES_ROOT) return RES_ROOT;
    } catch (e) { /* RES_ROOT 不在作用域：用默认值 */ }
    return DEFAULT_ROOT;
  }
  const memPath = (m) => dataRoot() + "/" + REL_DIR + "/" + m.name;
  const relPath = (m) => REL_DIR + "/" + m.name;

  function fs() {
    return (window.Module && Module.FS) ? Module.FS : null;
  }

  // 掌机运行时是否已经就绪（资源根挂上了才算，否则写文件会失败）
  function fsReady() {
    const FS = fs();
    if (!FS) return false;
    try { return !!FS.analyzePath(dataRoot()).exists; } catch (e) { return false; }
  }

  // MEMFS 里某文件的大小（不存在/读不到 → -1）
  function memSize(p) {
    const FS = fs();
    if (!FS) return -1;
    try {
      const st = FS.stat(p);
      return (st && !FS.isDir(st.mode)) ? st.size : -1;
    } catch (e) { return -1; }
  }

  function ensureMemDir(p) {
    const FS = fs();
    if (!FS) return false;
    const dir = p.slice(0, p.lastIndexOf("/"));
    try {
      if (FS.mkdirTree) FS.mkdirTree(dir);
      else FS.createPath("/", dir.replace(/^\/+/, ""));
      return true;
    } catch (e) { return false; }
  }

  function setBtn(text, disabled, title) {
    llmBtn.textContent = text;
    llmBtn.disabled = !!disabled;
    if (title != null) llmBtn.title = title;
  }

  // ---- 权威尺寸：HEAD 问一次，拿到就缓存；失败退回硬编码快照 ----------------
  async function expectedSize(m) {
    if (sizeCache.has(m.url)) return sizeCache.get(m.url);
    let n = 0;
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), HEAD_TIMEOUT_MS);
      const r = await fetch(m.url, { method: "HEAD", cache: "no-store", signal: ac.signal });
      clearTimeout(timer);
      // 托管方若对响应开了压缩，Content-Length 是**压缩后**的字节数（与流里给的解压后
      // 数据对不上）→ 这种情况当作“没问出权威尺寸”，退回本文件里的快照值。
      if (r.ok && !r.headers.get("content-encoding")) n = parseInt(r.headers.get("content-length") || "0", 10) || 0;
    } catch (e) { /* 离线/CORS 不允许：用快照 */ }
    const v = n > 0 ? n : m.size;
    sizeCache.set(m.url, v);
    return v;
  }

  // ---- 单个模型的实地核对 ---------------------------------------------------
  // { m, exp, mem, memOk, storeSize, storeOk, ready }
  async function inspect(m) {
    const exp = await expectedSize(m);
    const mem = memSize(memPath(m));
    const memOk = mem > 0 && (!exp || mem === exp);

    let storeSize = 0;
    try {
      const rec = (typeof nanoStoreGet === "function") ? await nanoStoreGet(relPath(m)) : null;
      if (rec && rec.blob) storeSize = rec.blob.size;
    } catch (e) { /* 存储不可用：当作没有 */ }

    const storeOk = storeSize > 0 && (!exp || storeSize === exp);
    return { m, exp, mem, memOk, storeSize, storeOk, ready: memOk };
  }

  // ---- 按钮：按实际状态刷新（唯一入口） -------------------------------------
  async function refreshLlmBtn() {
    const seq = ++uiSeq;

    if (!fsReady()) {
      setBtn("LLM：启动中…", true, "掌机还在启动（p1 启动资源挂载中），就绪后这枚按钮会自动变成可点");
      return null;
    }
    if (running) return null;                      // 进度文案由下载回调接管

    const states = await Promise.all(MODELS.map(inspect));
    if (seq !== uiSeq) return null;                // 核对期间状态又变了：丢弃这份结果

    const notReady = states.filter((s) => !s.ready);
    const expTotal = states.reduce((s, x) => s + (x.exp || 0), 0);
    const suffix = lastError ? "·重试" : "";
    const errTitle = lastError ? `上次失败：${lastError}` : "";

    if (!notReady.length) {
      setBtn("LLM：就绪", false,
        `两个模型权重（${mb(expTotal)}）已在掌机 linglong/llm/ 与浏览器 IndexedDB 中。`
        + "再点一次会从 HuggingFace 重新下载并替换掉缓存（约 " + mb(expTotal) + "）。");
      return states;
    }

    const needBytes = notReady.reduce((s, x) => s + (x.exp || x.m.size || 0), 0);
    const mustFetch = notReady.filter((s) => !s.storeOk);
    const fetchBytes = mustFetch.reduce((s, x) => s + (x.exp || x.m.size || 0), 0);
    const missingText = notReady.map((s) => {
      const p = s.mem > 0 ? `（掌机里只有不完整的 ${mb(s.mem)}）` : "";
      return `${s.m.label} ${mb(s.exp)}${p}`;
    }).join(" / ");

    if (!mustFetch.length) {
      // 掌机内存里还没有，但浏览器 IndexedDB 里已缓存：点了照样**重下并替换缓存**
      setBtn(`LLM：缓存 ${mb(needBytes)}MB ${suffix}`, false,
        `${notReady.length} 个模型（${mb(needBytes)}）已缓存在浏览器 IndexedDB；`
        + "点一下会从 HuggingFace 重新下载，同时替换掉这份缓存。" + errTitle);
    } else {
      setBtn(`拉取LLM ${mb(fetchBytes)}MB${suffix}`, false,
        `要拉 ${notReady.length} 个模型：${missingText}。`
        + (mustFetch.length < notReady.length
          ? `其中 ${notReady.length - mustFetch.length} 个本机已缓存，只需 ${mb(fetchBytes)} 联网下载。`
          : `需联网下载 ${mb(fetchBytes)}（来源 HuggingFace）。`)
        + errTitle);
    }
    return states;
  }

  // ---- 下载 ---------------------------------------------------------------
  // 流式下载 → MEMFS（边收边写，不整体驻留）→ 校验尺寸 → 落 IndexedDB
  async function fetchIntoMemfs(m, onProgress, exp) {
    const target = memPath(m);
    const part = target + ".part";        // 先写临时文件：失败时不动原来的可用副本
    if (!ensureMemDir(target)) throw new Error("掌机文件系统目录不可用：" + target);

    const resp = await fetch(m.url, { cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status + "（" + m.name + "）");

    // 托管方若开了 Content-Encoding，Content-Length 是压缩后的字节数，而流里给的是
    // 解压后的数据 —— 这种情形一律以权威尺寸（exp）为准，不用它判完整性。
    const encoded = !!resp.headers.get("content-encoding");
    const total = (encoded ? 0 : Number(resp.headers.get("content-length"))) || exp || 0;

    const FS = fs();
    const chunks = [];                     // 给 IndexedDB 的 Blob 用
    let pos = 0;
    let closed = false;
    const stream = FS.open(part, "w");
    const closeStream = () => {
      if (closed) return;
      closed = true;
      try { FS.close(stream); } catch (e) { /* 已关 */ }
    };

    try {
      if (resp.body && resp.body.getReader) {
        const reader = resp.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value || !value.length) continue;
          FS.write(stream, value, 0, value.length, pos);   // MEMFS 顺序写
          pos += value.length;
          chunks.push(value);
          onProgress(pos, total);
        }
      } else {
        // 退化路径（无流式读取）：整取后一次写
        const buf = new Uint8Array(await resp.arrayBuffer());
        FS.write(stream, buf, 0, buf.length, 0);
        pos = buf.length;
        chunks.push(buf);
        onProgress(pos, total);
      }
    } catch (e) {
      closeStream();
      try { FS.unlink(part); } catch (e2) { /* 删不掉也留不住：下次核对会重下 */ }
      throw e;
    }
    closeStream();

    // 尺寸对不上 = 传输被截断：删掉半截的 .part，绝不覆盖旧副本、绝不落库
    if (exp && pos !== exp) {
      try { FS.unlink(part); } catch (e) { /* 同上 */ }
      throw new Error(`${m.name} 字节数不符：收到 ${pos}，应为 ${exp}`);
    }
    // 校验通过才原子替换（rename 覆盖同名文件）——失败的下载不会毁掉原来的可用副本
    try { FS.rename(part, target); }
    catch (e) {
      try { FS.unlink(part); } catch (e2) {}
      throw new Error("无法替换掌机文件：" + target + "（" + (e && e.message ? e.message : e) + "）");
    }

    // 落 IndexedDB（键 = linglong/llm/<文件名>）：下次加载由 loader 灌回 MEMFS
    const blob = new Blob(chunks, { type: "application/octet-stream" });
    chunks.length = 0;
    if (typeof nanoStorePut === "function") {
      try {
        await nanoStorePut(relPath(m), blob);
      } catch (e) {
        // 配额不足/隐私模式：MEMFS 里已经有完整模型，本次会话照用，只是下次要重下
        console.warn("[llm] 写入 IndexedDB 失败（配额/权限），本次仅驻留掌机内存：", e);
      }
    }
    return pos;
  }

  // ---- 「已下载过」再点：先弹确认框 -----------------------------------------
  // 只在“已经有模型可用”（MEMFS 到位或 IndexedDB 已缓存）时才问；从没下过就直接下，
  // 不给人添一道多余的确认。样式与掌机其它模态框一致（#nano-host 作用域内的白卡片）。
  let asking = false;                 // 确认框开着：挡住重复点击
  let modalEl = null;

  function buildModal() {
    if (modalEl) return modalEl;
    const host = document.getElementById("nano-host") || document.body;
    const el = document.createElement("div");
    el.id = "llm-modal";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML =
      '<div class="llm-card">'
      + '  <h4 id="llm-modal-title">重新下载模型？</h4>'
      + '  <p id="llm-modal-body"></p>'
      + '  <div class="llm-actions">'
      + '    <button type="button" id="llm-modal-cancel">取消</button>'
      + '    <button type="button" class="primary" id="llm-modal-ok">重新下载</button>'
      + '  </div>'
      + '</div>';
    host.appendChild(el);
    modalEl = el;
    return el;
  }

  // 返回 Promise<boolean>：true = 确认重新下载
  function askReconfirm(readyCount) {
    return new Promise((resolve) => {
      const el = buildModal();
      const card = el.querySelector(".llm-card");
      const btnOk = el.querySelector("#llm-modal-ok");
      const btnCancel = el.querySelector("#llm-modal-cancel");
      const body = el.querySelector("#llm-modal-body");
      body.textContent =
        `${readyCount === MODELS.length ? "两个模型权重" : readyCount + " 个模型权重"}已在掌机与浏览器缓存中。`
        + "重新下载会用 HuggingFace 上的文件覆盖它们，并替换掉 IndexedDB 里的缓存"
        + `（约 ${mb(MODELS.reduce((s, m) => s + (m.size || 0), 0))} MB，视网速需要几分钟）。`;

      const close = (ok) => {
        el.classList.remove("open");
        el.removeEventListener("keydown", onKey, true);
        el.removeEventListener("click", onBackdrop, false);
        btnOk.removeEventListener("click", onOk);
        btnCancel.removeEventListener("click", onCancel);
        asking = false;
        // 焦点还给按钮（键盘操作后仍可继续用）
        try { llmBtn.focus({ preventScroll: true }); } catch (e) {}
        resolve(ok);
      };
      const onOk = () => close(true);
      const onCancel = () => close(false);
      const onBackdrop = (e) => { if (e.target === el) close(false); };
      // Esc = 取消；Enter = 重新下载。**拦住冒泡**：否则按键会同时投给掌机（Esc=返回）。
      const onKey = (e) => {
        e.stopPropagation();
        if (e.key === "Escape") { e.preventDefault(); close(false); }
        else if (e.key === "Enter") { e.preventDefault(); close(true); }
      };

      btnOk.addEventListener("click", onOk);
      btnCancel.addEventListener("click", onCancel);
      el.addEventListener("click", onBackdrop);
      el.addEventListener("keydown", onKey, true);
      el.classList.add("open");
      asking = true;
      try { btnCancel.focus({ preventScroll: true }); } catch (e) {}
      void card;
    });
  }

  // ---- 主流程 --------------------------------------------------------------
  async function runModels() {
    if (running || asking) return;
    if (!fsReady()) {
      setBtn("LLM：启动中…", true, "掌机还在启动（p1 启动资源挂载中），稍候再点");
      return;
    }
    // 「已经下载过」→ 先确认；没下过就直接下
    const pre = await Promise.all(MODELS.map(inspect));
    const have = pre.filter((s) => s.ready || s.storeOk).length;
    if (have === MODELS.length) {
      const ok = await askReconfirm(have);
      console.log("[llm] 已下载过，用户选择:", ok ? "重新下载" : "取消");
      if (!ok) return;                          // 取消：什么都不做（缓存/文件原样保留）
    }
    if (running) return;                        // 确认期间别处又触发了：单飞
    running = true;
    lastError = "";
    ++uiSeq;                                    // 让在飞的核对失效
    const t0 = performance.now();

    try {
      const states = await Promise.all(MODELS.map(inspect));
      const expTotal = states.reduce((s, x) => s + (x.exp || 0), 0);
      let doneBase = 0;

      for (const st of states) {
        const m = st.m;
        // 站点约定：点一次 = **重新下载并替换缓存**（不因“已就绪/已缓存”而跳过）
        const base = doneBase;
        const label = (got, total) => {
          const done = base + Math.min(got, st.exp || total || m.size || got);
          const pct = expTotal ? Math.min(100, Math.floor(done / expTotal * 100)) : 0;
          setBtn(`LLM ${pct}%`, true,
            `${m.label}：${mb(got)}/${mb(total || st.exp)}`
            + `（总计 ${mb(done)}/${mb(expTotal)}）`);
        };
        label(0, st.exp);

        console.log(`[llm] 下载 ${m.name}（${mb(st.exp)} MB，force=替换缓存）`);
        await fetchIntoMemfs(m, label, st.exp);

        doneBase += st.exp || m.size;
      }
      console.log(`[llm] 模型就绪（${((performance.now() - t0) / 1000).toFixed(1)}s）`);
    } catch (e) {
      lastError = String((e && e.message) || e);
      console.error("[llm] 下载失败：", e);
    } finally {
      running = false;
      await refreshLlmBtn();                    // 按实际结果重定文案（失败→「·重试」可点）
    }
  }

  // ---- 挂到按钮上 ----------------------------------------------------------
  llmBtn.addEventListener("click", () => { runModels(); });

  // 启动后等运行时/资源根就绪，再把按钮从「启动中…」切成真实状态
  let pollTimer = setInterval(() => {
    if (!fsReady()) return;
    clearInterval(pollTimer);
    pollTimer = null;
    refreshLlmBtn();
  }, 500);

  // 供调试/回归：window.nanoDlModels() 等价于点一次按钮
  window.nanoDlModels = runModels;
  window.nanoLlmRefresh = refreshLlmBtn;
})();
