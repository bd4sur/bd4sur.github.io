#!/usr/bin/env node
"use strict";
// 用法：
//   node server.js                     # https://0.0.0.0:8443 + http:8088 → 308
//   node server.js 9443                # 只改 HTTPS 端口（等价 --port 9443）
//   node server.js --port 8443 --http-port 8088
//   node server.js --no-http           # 只起 HTTPS
//   node server.js --no-https          # 退回纯 HTTP（传感器不可用，仅应急）
//   node server.js --cert c.pem --key k.pem   # 用自己签的/正式的证书
//   node server.js --cors              # 加 Access-Control-Allow-Origin: *
//   node server.js --isolation         # 加 COOP/COEP（给 SharedArrayBuffer 用）
//   node server.js --no-compress --no-list --quiet
//   node server.js --help
// =============================================================================

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const http = require("http");
const https = require("https");
const os = require("os");
const zlib = require("zlib");
const net = require("net");
const { execFileSync } = require("child_process");
const { pipeline, Transform } = require("stream");

const SITE_ROOT = __dirname;

// -----------------------------------------------------------------------------
// 命令行
// -----------------------------------------------------------------------------
const USAGE = `
bd4sur.github.io 本地预览服务（HTTPS + HTTP 跳转，零依赖）

用法：node server.js [选项]

  --port <n>          HTTPS 端口（默认 8443）
  --http-port <n>     HTTP 跳转端口（默认 8088，收到请求就 308 到 HTTPS）
  --host <addr>       监听地址（默认 0.0.0.0，即局域网可访问）
  --root <dir>        站点根目录（默认 server.js 所在目录）
  --cert <file>       证书 PEM（不配合 --key 时自动生成自签证书）
  --key <file>        私钥 PEM
  --cert-dir <dir>    自签证书存放/复用目录（默认 ./.certs）
  --cors              加 Access-Control-Allow-Origin: *
  --isolation         加 COOP/COEP 头（crossOriginIsolated，SharedArrayBuffer 需要）
  --no-https          只起 HTTP
  --no-http           只起 HTTPS
  --no-compress       关闭 br/gzip 实时压缩
  --no-list           目录没有 index.html 时回 403 而不是列出文件
  --quiet, -q         只记录 4xx/5xx
  --help, -h          显示本帮助
`;

function die(msg) {
    console.error(`[错误] ${msg}`);
    process.exit(1);
}

function parseArgs(argv) {
    const o = {
        port: 8443,
        httpPort: 8088,
        host: "0.0.0.0",
        root: SITE_ROOT,
        certDir: path.join(SITE_ROOT, ".certs"),
        cert: null,
        key: null,
        https: true,
        http: true,
        cors: false,
        isolation: false,
        compress: true,
        list: true,
        quiet: false,
    };

    for (let i = 0; i < argv.length; i++) {
        let arg = argv[i];
        if (!arg.startsWith("-")) {                 // 裸数字 = 端口
            o.port = Number(arg);
            continue;
        }
        let value = null;
        const eq = arg.indexOf("=");
        if (eq >= 0) { value = arg.slice(eq + 1); arg = arg.slice(0, eq); }
        const name = arg.replace(/^--?/, "");
        const take = () => {
            if (value !== null) return value;
            i += 1;
            if (i >= argv.length) die(`选项 --${name} 缺少取值`);
            return argv[i];
        };

        switch (name) {
            case "port":        o.port = Number(take()); break;
            case "http-port":   o.httpPort = Number(take()); break;
            case "host":        o.host = take(); break;
            case "root":        o.root = path.resolve(take()); break;
            case "cert":        o.cert = path.resolve(take()); break;
            case "key":         o.key = path.resolve(take()); break;
            case "cert-dir":    o.certDir = path.resolve(take()); break;
            case "cors":        o.cors = true; break;
            case "isolation":   o.isolation = true; break;
            case "no-https":    o.https = false; break;
            case "no-http":     o.http = false; break;
            case "no-compress": o.compress = false; break;
            case "no-list":     o.list = false; break;
            case "quiet": case "q": o.quiet = true; break;
            case "help": case "h":  process.stdout.write(USAGE); process.exit(0); break;
            default:            die(`未知选项：${arg}（--help 看用法）`);
        }
    }

    const badPort = (p) => !Number.isInteger(p) || p < 0 || p > 65535;
    if (badPort(o.port)) die(`端口不合法：${o.port}`);
    if (badPort(o.httpPort)) die(`HTTP 端口不合法：${o.httpPort}`);
    if (o.https && o.http && o.port === o.httpPort) die("HTTPS 与 HTTP 不能同端口");
    if (!o.https) o.http = true;                    // 两个都关就没得服务了
    if (!fs.existsSync(o.root) || !fs.statSync(o.root).isDirectory()) die(`站点根目录不存在：${o.root}`);
    if (o.cert && !o.key) die("--cert 必须和 --key 一起用");
    return o;
}

// -----------------------------------------------------------------------------
// 日志
// -----------------------------------------------------------------------------
const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code) => (s) => (COLOR ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const dim = c("90"), green = c("32"), yellow = c("33"), red = c("31"), cyan = c("36"), bold = c("1");

function stamp(d = new Date()) {
    const p = (n, w = 2) => String(n).padStart(w, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

function human(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const units = ["kB", "MB", "GB"];
    let v = bytes / 1024;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
    return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

function statusPaint(code) {
    if (code >= 500) return red(code);
    if (code >= 400) return yellow(code);
    if (code >= 300) return cyan(code);
    return green(code);
}

function line(req, res, ms, bytes) {
    const scheme = req.socket.encrypted ? "https" : "http";
    const target = `${req.method} ${decodeURIQuiet(req.url)}`;
    console.log(
        `${dim(stamp())} ${statusPaint(res.statusCode)} ${dim(scheme)} ${target} ` +
        `${dim("→")} ${bytes ? human(bytes) : "-"} ${dim(`${ms} ms`)}`
    );
}

function decodeURIQuiet(s) {
    try { return decodeURI(s); } catch { return s; }
}

// -----------------------------------------------------------------------------
// MIME
// -----------------------------------------------------------------------------
const MIME = {
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "text/javascript; charset=utf-8",
    mjs: "text/javascript; charset=utf-8",
    cjs: "text/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    map: "application/json; charset=utf-8",
    md: "text/markdown; charset=utf-8",
    markdown: "text/markdown; charset=utf-8",
    txt: "text/plain; charset=utf-8",
    scm: "text/plain; charset=utf-8",
    py: "text/plain; charset=utf-8",
    sh: "text/plain; charset=utf-8",
    bat: "text/plain; charset=utf-8",
    csv: "text/csv; charset=utf-8",
    tsv: "text/tab-separated-values; charset=utf-8",
    xml: "application/xml; charset=utf-8",
    feed: "application/rss+xml; charset=utf-8",
    svg: "image/svg+xml",
    ico: "image/vnd.microsoft.icon",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    bmp: "image/bmp",
    webp: "image/webp",
    avif: "image/avif",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    eot: "application/vnd.ms-fontobject",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    wav: "audio/wav",
    mp4: "video/mp4",
    m4v: "video/mp4",
    webm: "video/webm",
    ogv: "video/ogg",
    wasm: "application/wasm",
    gz: "application/gzip",
    br: "application/x-brotli",
    zip: "application/zip",
    bin: "application/octet-stream",
    pdf: "application/pdf",
    webmanifest: "application/manifest+json; charset=utf-8",
};

const COMPRESSIBLE = /^(text\/|application\/(json|javascript|xml|wasm|manifest\+json)|image\/svg\+xml)/;

function mimeOf(file) {
    const ext = path.extname(file).slice(1).toLowerCase();
    return MIME[ext] || "application/octet-stream";
}

// -----------------------------------------------------------------------------
// 自签证书
// -----------------------------------------------------------------------------
function ensureCert(o) {
    if (o.cert && o.key) {
        return { key: fs.readFileSync(o.key), cert: fs.readFileSync(o.cert), paths: { cert: o.cert, key: o.key }, generated: false };
    }

    const certPath = path.join(o.certDir, "cert.pem");
    const keyPath = path.join(o.certDir, "key.pem");
    let generated = false;

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
        fs.mkdirSync(o.certDir, { recursive: true });

        // SAN 覆盖：localhost、回环、主机名、本机所有 IPv4/IPv6 地址
        // —— 用手机连局域网 IP 时，证书不匹配的警告至少只报一次（自签本来就要点一次「继续」）。
        const sans = new Set(["DNS:localhost", "IP:127.0.0.1", "IP:::1", `DNS:${os.hostname()}`]);
        for (const list of Object.values(os.networkInterfaces())) {
            for (const ni of list || []) sans.add(`IP:${ni.address}`);
        }

        try {
            execFileSync("openssl", [
                "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-sha256", "-days", "825",
                "-keyout", keyPath, "-out", certPath,
                "-subj", "/CN=bd4sur.github.io local preview",
                "-addext", `subjectAltName=${[...sans].join(",")}`,
            ], { stdio: ["ignore", "pipe", "pipe"] });
            generated = true;
        } catch (e) {
            const stderr = e.stderr ? e.stderr.toString().trim() : "";
            die(`生成自签证书失败（需要 openssl 命令）：${stderr || e.message}\n` +
                `  可以改用 --no-https 跑纯 HTTP，或 --cert/--key 指定现成证书。`);
        }
        // 私钥别让同组用户读到
        try { fs.chmodSync(keyPath, 0o600); } catch { /* 某些文件系统不支持，忽略 */ }
    }

    return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        paths: { cert: certPath, key: keyPath },
        generated,
    };
}

// -----------------------------------------------------------------------------
// 基础响应工具
// -----------------------------------------------------------------------------
// 每个响应上挂一个「已发送字节」计数器：流式响应由 Transform 累加，
// 一次性 buffer 响应由 sendBuffer 累加，日志里报的都是**实际上线字节**（压缩后）。
const SENT = Symbol("sentBytes");

const HTML_HEAD = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">`;

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
    ));
}

function securityHeaders(o, extra) {
    const h = {
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer-when-downgrade",
        "Cross-Origin-Resource-Policy": "cross-origin",
    };
    if (o.cors) {
        h["Access-Control-Allow-Origin"] = "*";
        h["Access-Control-Allow-Methods"] = "GET, HEAD, OPTIONS";
        h["Access-Control-Allow-Headers"] = "*";
        h["Access-Control-Max-Age"] = "86400";
    }
    if (o.isolation) {
        h["Cross-Origin-Opener-Policy"] = "same-origin";
        h["Cross-Origin-Embedder-Policy"] = "require-corp";
    }
    return extra ? Object.assign(h, extra) : h;
}

function sendBuffer(req, res, o, code, type, body, extraHeaders) {
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");
    const headers = securityHeaders(o, Object.assign({
        "Content-Type": type,
        "Content-Length": buf.length,
        "Cache-Control": "no-cache",
    }, extraHeaders || {}));
    res.writeHead(code, headers);
    if (req.method === "HEAD") res.end();
    else { res[SENT] = (res[SENT] || 0) + buf.length; res.end(buf); }
}

function sendError(req, res, o, code, message) {
    const title = `${code} ${http.STATUS_CODES[code] || ""}`.trim();
    const body = `${HTML_HEAD}<title>${title}</title>` +
        `<body style="font:16px/1.6 system-ui,sans-serif;max-width:40em;margin:12vh auto;padding:0 1.5em">` +
        `<h1 style="font-size:1.5em">${escapeHtml(title)}</h1>` +
        `<p style="color:#666">${escapeHtml(message || "")}</p>` +
        `<p style="color:#999;font-size:.9em">bd4sur.github.io 本地预览服务</p></body></html>`;
    sendBuffer(req, res, o, code, "text/html; charset=utf-8", body);
}

async function send404(req, res, o, reqPath) {
    const fallback = path.join(o.root, "404.html");
    let body;
    try {
        body = await fsp.readFile(fallback);
    } catch {
        body = `${HTML_HEAD}<title>404</title>` +
            `<body style="font:16px/1.6 system-ui,sans-serif;max-width:40em;margin:12vh auto;padding:0 1.5em">` +
            `<h1 style="font-size:1.5em">404 没有这个文件</h1>` +
            `<p style="color:#666;word-break:break-all">${escapeHtml(reqPath)}</p></body></html>`;
    }
    sendBuffer(req, res, o, 404, "text/html; charset=utf-8", body);
}

// -----------------------------------------------------------------------------
// 条件请求 / Range
// -----------------------------------------------------------------------------
function weakEtag(st) {
    return `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
}

function etagMatches(header, etag) {
    if (!header) return false;
    const bare = (t) => t.trim().replace(/^W\//, "");
    const mine = bare(etag);
    return String(header).split(",").some((t) => t.trim() === "*" || bare(t) === mine);
}

/** 单区间 Range 解析：返回 {start,end} / {unsatisfiable:true} / null（忽略，发全量） */
function parseRange(header, size) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
    if (!m) return null;
    const [, a, b] = m;
    if (a === "" && b === "") return null;
    if (size === 0) return { unsatisfiable: true };

    let start;
    let end;
    if (a === "") {
        const n = Number(b);
        if (!Number.isFinite(n) || n <= 0) return { unsatisfiable: true };
        start = Math.max(0, size - n);
        end = size - 1;
    } else {
        start = Number(a);
        end = b === "" ? size - 1 : Number(b);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size) return { unsatisfiable: true };
    if (end >= size) end = size - 1;
    if (end < start) return { unsatisfiable: true };
    return { start, end };
}

/** 按 Accept-Encoding 选一种编码（尊重 q=0，按偏好排序） */
function pickEncoding(acceptEncoding, enabled) {
    if (!enabled || !acceptEncoding) return null;
    const wanted = new Map();
    for (const part of String(acceptEncoding).split(",")) {
        const [rawName, ...params] = part.trim().toLowerCase().split(";");
        const name = rawName.trim();
        if (!name) continue;
        let q = 1;
        for (const p of params) {
            const m = /^\s*q\s*=\s*([\d.]+)\s*$/.exec(p);
            if (m) q = Number(m[1]);
        }
        wanted.set(name, Number.isFinite(q) ? q : 0);
    }
    const supported = ["br", "gzip", "deflate"];
    let best = null;
    let bestQ = 0;
    for (const name of supported) {
        let q = wanted.has(name) ? wanted.get(name) : (wanted.has("*") ? wanted.get("*") : 0);
        if (name === "br" && typeof zlib.createBrotliCompress !== "function") q = 0;
        if (q > bestQ) { bestQ = q; best = name; }
    }
    return best;
}

// -----------------------------------------------------------------------------
// 目录列表
// -----------------------------------------------------------------------------
async function sendListing(req, res, o, dirPath, urlPath) {
    const entries = await fsp.readdir(dirPath, { withFileTypes: true });
    const rows = [];

    if (urlPath !== "/") {
        rows.push(`<tr><td><a href="../">../</a></td><td></td><td></td></tr>`);
    }

    const dirs = entries.filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
    const files = entries.filter((e) => !e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));

    for (const d of dirs) {
        rows.push(`<tr class="d"><td><a href="${encodeURIComponent(d.name)}/">${escapeHtml(d.name)}/</a></td><td>—</td><td></td></tr>`);
    }
    for (const f of files) {
        let size = "";
        let mtime = "";
        try {
            const st = await fsp.stat(path.join(dirPath, f.name));
            size = human(st.size);
            mtime = st.mtime.toISOString().replace("T", " ").slice(0, 16);
        } catch { /* 读不到就留空 */ }
        rows.push(`<tr><td><a href="${encodeURIComponent(f.name)}">${escapeHtml(f.name)}</a></td><td>${size}</td><td>${mtime}</td></tr>`);
    }

    const body = `${HTML_HEAD}<title>${escapeHtml(urlPath)}</title>
<style>
 body{font:14px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;margin:2em auto;max-width:56em;padding:0 1.2em;color:#222}
 h1{font-size:1.15em;font-weight:600;margin:0 0 .2em}
 .p{color:#888;font-size:.85em;margin-bottom:1.2em;word-break:break-all}
 table{border-collapse:collapse;width:100%}
 td{padding:.25em .6em;border-bottom:1px solid #eee;white-space:nowrap}
 td:nth-child(2){text-align:right;color:#888;font-variant-numeric:tabular-nums}
 td:nth-child(3){color:#aaa;font-size:.85em}
 tr.d td:first-child{font-weight:600}
 a{color:#0a58ca;text-decoration:none}
 a:hover{text-decoration:underline}
 @media(prefers-color-scheme:dark){body{background:#16181c;color:#ddd}td{border-color:#2a2d33}a{color:#6ea8fe}.p,td:nth-child(2),td:nth-child(3){color:#8b93a1}}
</style>
<body><h1>目录</h1><div class="p">${escapeHtml(urlPath)} · ${entries.length} 项</div>
<table>${rows.join("\n")}</table></body></html>`;
    sendBuffer(req, res, o, 200, "text/html; charset=utf-8", body);
}

// -----------------------------------------------------------------------------
// 主处理
// -----------------------------------------------------------------------------
async function handle(req, res, o) {
    const started = Date.now();
    res[SENT] = 0;
    res.on("finish", () => {
        if (o.quiet && res.statusCode < 400) return;
        line(req, res, Date.now() - started, res[SENT] || 0);
    });

    // 计数用的 Transform：压缩后才知道真实字节数
    const counter = () => new Transform({
        transform(chunk, enc, cb) { res[SENT] = (res[SENT] || 0) + chunk.length; cb(null, chunk); },
    });

    if (req.url === "*") {                        // OPTIONS *
        res.writeHead(200, securityHeaders(o, { Allow: "GET, HEAD, OPTIONS", "Content-Length": 0 }));
        return res.end();
    }

    if (req.method === "OPTIONS") {
        res.writeHead(204, securityHeaders(o, { Allow: "GET, HEAD, OPTIONS", "Content-Length": 0 }));
        return res.end();
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, securityHeaders(o, { Allow: "GET, HEAD, OPTIONS", "Content-Type": "text/plain; charset=utf-8" }));
        return res.end(`405 只支持 GET / HEAD / OPTIONS\n`);
    }

    // ---- URL → 文件路径（防穿越）----
    let urlPath;
    try {
        urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    } catch {
        return sendError(req, res, o, 400, "URL 编码不合法");
    }
    if (urlPath.includes("\0")) return sendError(req, res, o, 400, "路径里含空字节");

    const segments = [];
    for (const seg of urlPath.split("/")) {
        if (seg === "" || seg === ".") continue;
        if (seg === "..") {
            if (!segments.length) return sendError(req, res, o, 403, "路径越界");
            segments.pop();
            continue;
        }
        segments.push(seg);
    }

    let filePath = path.join(o.root, ...segments);
    let st;
    try {
        st = await fsp.stat(filePath);            // 跟随符号链接
    } catch (e) {
        if (e.code === "ENOENT" || e.code === "ENOTDIR" || e.code === "ENAMETOOLONG") {
            return send404(req, res, o, urlPath);
        }
        if (e.code === "EACCES" || e.code === "EPERM") return sendError(req, res, o, 403, "没有读取权限");
        return sendError(req, res, o, 500, `${e.code || e.message}`);
    }

    // ---- 目录 ----
    if (st.isDirectory()) {
        if (!urlPath.endsWith("/")) {              // 补斜杠，否则相对链接会错
            const q = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
            res.writeHead(301, securityHeaders(o, { Location: `${urlPath}/${q}`, "Content-Length": 0 }));
            return res.end();
        }
        const indexPath = path.join(filePath, "index.html");
        try {
            st = await fsp.stat(indexPath);
            filePath = indexPath;
        } catch {
            if (!o.list) return sendError(req, res, o, 403, "目录不可浏览");
            return sendListing(req, res, o, filePath, urlPath);
        }
    }

    if (!st.isFile()) return sendError(req, res, o, 403, "不是普通文件");

    // ---- 条件请求 ----
    const etag = weakEtag(st);
    const lastMod = new Date(st.mtimeMs).toUTCString();
    const type = mimeOf(filePath);
    const cacheControl = COMPRESSIBLE.test(type) || type.startsWith("text/") ? "no-cache" : "public, max-age=600";

    let notModified = etagMatches(req.headers["if-none-match"], etag);
    if (!notModified && !req.headers["if-none-match"] && req.headers["if-modified-since"]) {
        const since = Date.parse(req.headers["if-modified-since"]);
        notModified = Number.isFinite(since) && Math.floor(st.mtimeMs / 1000) * 1000 <= since;
    }

    const common = {
        ETag: etag,
        "Last-Modified": lastMod,
        "Cache-Control": cacheControl,
        "Accept-Ranges": "bytes",
    };

    if (notModified) {
        res.writeHead(304, securityHeaders(o, common));
        return res.end();
    }

    // ---- Range ----
    let range = null;
    if (req.headers.range) {
        const ifRange = req.headers["if-range"];
        const ifRangeOk = !ifRange ||
            etagMatches(ifRange, etag) ||
            Date.parse(ifRange) === Math.floor(st.mtimeMs / 1000) * 1000;
        if (ifRangeOk) range = parseRange(req.headers.range, st.size);
    }
    if (range && range.unsatisfiable) {
        res.writeHead(416, securityHeaders(o, Object.assign({}, common, {
            "Content-Range": `bytes */${st.size}`,
            "Content-Length": 0,
        })));
        return res.end();
    }

    // ---- 压缩（不与 Range 混用）----
    const encoding = (!range && req.method !== "HEAD" && st.size > 1024 && COMPRESSIBLE.test(type))
        ? pickEncoding(req.headers["accept-encoding"], o.compress)
        : null;

    const headers = securityHeaders(o, Object.assign({}, common, {
        "Content-Type": type,
        Vary: "Accept-Encoding",
    }));

    if (range) {
        headers["Content-Range"] = `bytes ${range.start}-${range.end}/${st.size}`;
        headers["Content-Length"] = range.end - range.start + 1;
    } else if (!encoding) {
        headers["Content-Length"] = st.size;
    }
    if (encoding) headers["Content-Encoding"] = encoding;

    res.writeHead(range ? 206 : 200, headers);
    if (req.method === "HEAD") return res.end();

    const readOpts = range ? { start: range.start, end: range.end } : undefined;
    const source = fs.createReadStream(filePath, readOpts);

    const stages = [source];
    if (encoding === "br") {
        stages.push(zlib.createBrotliCompress({
            params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 4,       // 本地预览：偏速度
                [zlib.constants.BROTLI_PARAM_SIZE_HINT]: st.size,
            },
            chunkSize: 64 * 1024,
        }));
    }
    else if (encoding === "gzip") stages.push(zlib.createGzip({ level: 5, chunkSize: 64 * 1024 }));
    else if (encoding === "deflate") stages.push(zlib.createDeflate({ level: 5, chunkSize: 64 * 1024 }));
    stages.push(counter());                             // 计数放在压缩之后 = 真实上线字节
    stages.push(res);

    pipeline(...stages, (err) => {
        if (!err) return;
        if (err.code === "ERR_STREAM_PREMATURE_CLOSE" || err.code === "ECONNRESET") return;  // 客户端跑了
        console.error(`${red("[流错误]")} ${filePath}：${err.message}`);
        if (!res.headersSent) sendError(req, res, o, 500, err.message);
        else res.destroy();
    });
}

// -----------------------------------------------------------------------------
// 启动
// -----------------------------------------------------------------------------
function listenHosts(host) {
    if (host !== "0.0.0.0" && host !== "::") return [host];
    const out = ["127.0.0.1"];
    for (const list of Object.values(os.networkInterfaces())) {
        for (const ni of list || []) {
            if (!ni.internal && !ni.address.startsWith("fe80")) out.push(ni.address);
        }
    }
    return [...new Set(out)];
}

function urlFor(scheme, host, port, hostname) {
    const h = net.isIPv6(host) ? `[${host}]` : host;
    const p = (scheme === "https" && port === 443) || (scheme === "http" && port === 80) ? "" : `:${port}`;
    return `${scheme}://${h}${p}/`;
}

function main() {
    const o = parseArgs(process.argv.slice(2));

    // 打印时把 0.0.0.0 换成具体地址，方便手机直接点
    const shownHosts = listenHosts(o.host);

    const servers = [];

    if (o.https) {
        const tls = ensureCert(o);
        const server = https.createServer({
            key: tls.key,
            cert: tls.cert,
            minVersion: "TLSv1.2",
            // 自签证书下浏览器只支持 HTTP/1.1，不开 ALPN h2，省得协商出问题
            ALPNProtocols: ["http/1.1"],
        }, (req, res) => { handle(req, res, o).catch((e) => fatal(req, res, o, e)); });

        server.on("clientError", (err, socket) => {
            if (socket.writable && !socket.destroyed) {
                socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
            } else {
                socket.destroy();
            }
        });

        server.on("error", (e) => die(`HTTPS 端口 ${o.port} 启动失败：${e.code === "EADDRINUSE" ? "端口已被占用" : e.message}`));
        server.listen(o.port, o.host, () => {
            console.log("");
            console.log(`  ${bold("玲珑站本地预览")}  ${dim(`root = ${o.root}`)}`);
            console.log("");
            for (const h of shownHosts) console.log(`  ${green("HTTPS")}  ${urlFor("https", h, o.port)}`);
            if (tls.generated) {
                console.log("");
                console.log(dim(`  自签证书（首次访问需在浏览器里点「高级 → 继续访问」）：`));
                console.log(dim(`    cert: ${tls.paths.cert}`));
                console.log(dim(`    key : ${tls.paths.key}`));
                console.log(dim(`    想换掉它：删掉 ${path.basename(o.certDir)}/ 目录重启，或用 --cert/--key 指定。`));
            }
            console.log("");
        });
        servers.push(server);
    }

    if (o.http) {
        const targetPort = o.https ? o.port : o.httpPort;
        const server = http.createServer((req, res) => {
            if (!o.https) {                              // 纯 HTTP 模式：直接服务
                handle(req, res, o).catch((e) => fatal(req, res, o, e));
                return;
            }
            // 跳转模式：把 Host 里的端口换掉，其余原样保留（含 query）
            const hostHeader = (req.headers.host || "localhost").replace(/:\d+$/, "");
            const location = `https://${hostHeader}:${targetPort}${req.url}`;
            res.writeHead(308, { Location: location, "Content-Length": 0, Connection: "keep-alive" });
            res.end();
        });
        server.on("error", (e) => die(`HTTP 端口 ${o.httpPort} 启动失败：${e.code === "EADDRINUSE" ? "端口已被占用" : e.message}`));
        server.listen(o.httpPort, o.host, () => {
            if (o.https) {
                for (const h of shownHosts) console.log(`  ${dim("HTTP →")}  ${dim(urlFor("http", h, o.httpPort))} ${dim("308 永久跳到 HTTPS")}`);
                console.log("");
            } else if (!o.https) {
                console.log("");
                console.log(`  ${bold("玲珑站本地预览")}  ${yellow("纯 HTTP（传感器/剪贴板等安全上下文特性不可用）")}`);
                for (const h of shownHosts) console.log(`  ${yellow("HTTP")}   ${urlFor("http", h, o.httpPort)}`);
                console.log("");
            }
        });
        servers.push(server);
    }

    const shutdown = (sig) => {
        console.log(`\n${dim(`收到 ${sig}，正在关闭…`)}`);
        let left = servers.length;
        if (!left) process.exit(0);
        for (const s of servers) {
            s.close(() => { if (--left <= 0) process.exit(0); });
            s.closeIdleConnections?.();
        }
        setTimeout(() => process.exit(0), 2000).unref();
    };
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

function fatal(req, res, o, err) {
    console.error(`${red("[未捕获]")} ${err && err.stack ? err.stack : err}`);
    if (res.headersSent) { res.destroy(); return; }
    sendError(req, res, o, 500, "服务器内部错误");
}

main();
