@echo off
rem bd4sur.github.io 本地预览：默认 https://0.0.0.0:8443，http:8088 收到请求 308 到 HTTPS
rem 首次运行会在 .certs\ 下生成自签证书（浏览器会提示不安全，点「高级 → 继续访问」即可）
rem 参数全部透传，例如：start-server.bat --port 9443 --no-http
node "%~dp0server.js" %*
if errorlevel 1 pause
