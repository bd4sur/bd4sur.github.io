
let http = require("http");
let fs = require("fs");
let url = require("url");

let CONFIG = {
    "portNumber": 8088,
    "MIME":{
        "css":   "text/css",
        "jpg":   "image/jpeg",
        "jpeg":  "image/jpeg",
        "png":   "image/png",
        "gif":   "image/gif",
        "bmp":   "image/bmp",
        "webp":   "image/webp",
        "js":    "text/javascript",
        "ico":   "image/vnd.microsoft.icon",
        "mp3":   "audio/mpeg",
        "woff":  "application/font-woff",
        "woff2": "font/woff2",
        "ttf":   "application/x-font-truetype",
        "otf":   "application/x-font-opentype",
        "mp4":   "video/mp4",
        "webm":  "video/webm",
        "svg":   "image/svg+xml",
        /* 二进制数据（不能落进下面的 data.toString()，否则字节 >= 0x80 会被
           解成 U+FFFD 再编码回 UTF-8，gzip 头 1f 8b 变成 1f ef bf bd，文件就废了） */
        "gz":    "application/gzip",
        "json":  "application/json",
        "bin":   "application/octet-stream"
    },
};

function LOG(status, message) {
    function FillZero(num, digits) { return `00000${num.toString()}`.slice(-digits); }
    let now = new Date();
    let datetime = `${now.getFullYear()}-${FillZero(now.getMonth()+1, 2)}-${FillZero(now.getDate(), 2)} ${FillZero(now.getHours(), 2)}:${FillZero(now.getMinutes(), 2)}:${FillZero(now.getSeconds(), 2)}.${FillZero(now.getMilliseconds(), 3)}`;
    console.log(`[${status}] ${datetime} ${message}`);
}

function Write(response, statusCode, contentType, content) {
    response.writeHead(statusCode, {"Content-Type": contentType, "Access-Control-Allow-Origin": "*"});
    response.write(content);
    response.end();
}

/* 这段字节是不是合法 UTF-8：不是就说明它是二进制文件，必须原样发出去 */
const UTF8_STRICT = new TextDecoder("utf-8", {fatal: true});
function IsUtf8(data) {
    try { UTF8_STRICT.decode(data); return true; }
    catch(e) { return false; }
}

function ReadFile(response, reqPath) {
    fs.readFile(reqPath, (err, data) => {
        let content;
        if(err) {
            fs.readFile("404.html", (err, data) => {
                if(err) content = `<head><meta charset="utf-8"/></head><h1>真·404</h1>`;
                else content = data.toString();
                LOG("404", `失败：${reqPath}`);
                Write(response, 404, "text/html", content);
            });
        }
        else {
            let mimeType = "text/html";
            let asText = true;                  // 默认当文本发（.html/.md/.txt 靠的就是这条）
            for(let suffix in CONFIG.MIME) {    // 根据后缀，检查MIME
                if(new RegExp("\\." + suffix + "$", "gi").test(reqPath)) {
                    mimeType = CONFIG.MIME[suffix];
                    asText = /^text\//gi.test(mimeType);
                    break;
                }
            }
            // 兜底：后缀没登记、内容又不是合法 UTF-8 的，一律按二进制原样发。
            // 以前这里是先 data.toString() 再 write(string)：不认识的二进制文件
            // 会被 UTF-8 解码成 U+FFFD 再编码回去，字节全毁（terrain/*.bin.gz 就是这么坏的）。
            if(asText && !IsUtf8(data)) {
                mimeType = "application/octet-stream";
                asText = false;
            }
            content = asText ? data.toString() : data;
            LOG("200", `成功：${reqPath}`);
            Write(response, 200, mimeType, content);
        }
    });
}

http.createServer((request, response) => {
    request.on("data", (chunk) => { /**/ });
    request.on("end", () => {
        let reqPath = url.parse(request.url).pathname.substr(1);
        if(reqPath === "") {
            ReadFile(response, "index.html");
        }
        else {
            ReadFile(response, decodeURI(reqPath));
        }
    });
}).listen(CONFIG.portNumber);

LOG("   ", `Port = ${CONFIG.portNumber}`);
