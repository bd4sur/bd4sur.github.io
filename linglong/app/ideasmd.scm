;@id=ideasmd
;@title=灵感集
;@version=2026-11-20
;; ============================================================================
;; 灵感集 —— 一个「书签式」灵机 App：主菜单点它，直接把 MD 阅读器拉起来，
;; 打开 /home/bd4sur/bd4sur.github.io/markdown/ideas.md（本站「灵感」栏目全文）。
;;
;; 实现要点（全部走既有宿主接口，不改任何宿主/C 代码）：
;;   · 本 App 自己不承担界面：boot 里 (App.launch_with "markdown" 绝对路径) 排一条
;;     拉起请求，宿主在本帧末把控制权交给 app/markdown.scm，并把本实例**冻结保留**
;;     在后台（多实例平台语义，见 am_native_App.h「拉起另一个灵机 App」）；
;;   · 阅读器退出时按「返回链」回到本实例（本实例正是它的调用者）——本实例此时已无
;;     事可做，于是 (App.exit_now) 直接退出，回主菜单；
;;   · 拉起失败（阅读器不在、参数过长等）→ 停在提示画面，硬 A/ESC 或「退出」按钮
;;     照旧可用（宿主 700ms 兜底，见 ui_scheme_app.h）。
;;
;; 路径约定：本站把业务资源根挂在 /home/bd4sur/bd4sur.github.io（见 nano/loader.js 的
;; resRoot；wasm 侧 PLATFORM_ROOT_DIR=/home/bd4sur/linglong 由 MEMFS 符号链接指向它），
;; 所以文档一律写成**宿主绝对路径**——跨 App 传递时语义与发起方的当前目录无关。
;;
;; 解释器约束（manual.md，逐条遵守）：算术恒二参数；无 let/cond 多表达式；
;;   '() 是模块级静态槽（空表用 (cdr '(0)) 现造）；define 无过程简写；块内不 define。
;; ============================================================================

(native Gfx)
(native App)
(native System)

;; 目标文档（宿主绝对路径）
(define DOC "/home/bd4sur/bd4sur.github.io/markdown/ideas.md")

;; 阶段：0 = 已排拉起请求（等待阅读器接管）  1 = 阅读器在前台（本实例冻结中）
;;       2 = 拉起失败
(define stage 0)
(define SW 320)
(define SH 240)
(define ts 0)

;; ---- 绘制 ----------------------------------------------------------------

(define draw_bar
  (lambda (text)
    (begin
      (Gfx.fill_rect 0 0 SW 18 30 38 52)
      (Gfx.draw_text text 6 3 235 240 245))))

(define draw_note
  (lambda (line1 line2 line3)
    (begin
      (Gfx.fill_rect 0 0 SW SH 14 17 22)
      (draw_bar "灵感集")
      (Gfx.draw_text line1 8 92 210 220 235)
      (Gfx.draw_text line2 8 112 150 200 235)
      (Gfx.draw_text line3 8 132 120 150 190))))

(define draw_launching
  (lambda ()
    (begin
      (draw_note "正在打开 MD 阅读器…" "markdown/ideas.md" "（阅读器退出后自动返回主菜单）")
      (Gfx.refresh))))

(define draw_failed
  (lambda ()
    (begin
      (draw_note "拉起 MD 阅读器失败" "请检查 app/markdown.scm 是否存在" "按 A / ESC 退出")
      (Gfx.refresh))))

;; ---- 每拍 ----------------------------------------------------------------

(define on_tick
  (lambda ()
    ;; 只做一件事：从阅读器返回来（stage 1）就自我退出 —— 本 App 只是一个入口，
    ;; 没有自己的界面要保持。其余阶段什么都不用做（画面已经画好）。
    (if (== stage 1)
        (App.exit_now)
        #f)))

;; ---- 启动 ----------------------------------------------------------------

(define boot
  (lambda ()
    (begin
      (set! SW (Gfx.width))
      (set! SH (Gfx.height))
      (draw_launching)
      ;; 拉起 MD 阅读器并交付文档路径；成功后本实例由宿主冻结保留，等阅读器退出后回来
      (if (App.launch_with "markdown" DOC)
          (set! stage 1)
          (begin
            (set! stage 2)
            (draw_failed)))
      (set! ts (System.set_interval 150 on_tick)))))

(boot)
