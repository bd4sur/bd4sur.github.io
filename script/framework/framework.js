
// Framework IROHA V4.0
// BD4SUR.com
// Copyright © 2016-2019 BD4SUR

////////////////////////////////////////////////////////
//  常 量 / 配 置 项
////////////////////////////////////////////////////////

// 监听器节流延时（无需纳入配置项）
const OBSERVER_THROTTLE_DELAY = 100;

// 页面标题
const PAGE_TITLE = "BD4SUR 业余无线电台";

////////////////////////////////////////////////////////
//  SPA 全 局 状 态
////////////////////////////////////////////////////////

// 滚动状态 NOTE 设置此状态位的目的是为了防止图片懒加载在滚动时被触发，导致滚动目标的位置计算错误。
let IS_SCROLLING = false;

// 滚动位置记录
let SCROLL_POSITION_STACK = new Array();

// 监听器
let ARTICLE_OBSERVER;  // Article节点监听器
let LIST_OBSERVER;     // 列表监听器

let SPA_MAIN_CONTAINER_OBSERVER; // SPA_MAIN_CONTAINER监听器

// 监听器节流
let OBSERVER_THROTTLE_TIMER;

////////////////////////////////////////////////////////
//  注 册 SPA 触 发 器
////////////////////////////////////////////////////////

function SPA_RegisterTriggers() {
    $('.SPA_TRIGGER').off('click'); // 避免重复绑定
    $('.SPA_TRIGGER').each(function(i,e) {
        $(e).on("click", ()=>{
            let targetid = $(e).attr('data-target');
            history.pushState({PageID: targetid}, '', `#/${targetid}`);
            SCROLL_POSITION_STACK.push(window.pageYOffset);
            SPA_Render(targetid);
        });
    });
}

//////////////////////////////////////////////////////
//  工 具 函 数
//////////////////////////////////////////////////////

// 终端类型判断："Desktop" or "Mobile"
function GetMediaType() {
    return ($(window).width() >= 650) ? "Desktop" : "Mobile";
}

// 通过XHR，从特定位置取纯文本并返回，不作任何处理。这个函数用于进一步实现内容与框架页面的解耦。
function GetTextContentFrom(path, onload, onerror) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", path);
    xhr.onreadystatechange = () => {
        // 进度条读满
        $("#Progressbar").animate({width: `100%`});
        $("#Progressbar").fadeOut();
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            onload(xhr.responseText);
            return;
        }
        else if(xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200){
            onerror();
            return;
        }
    };
    xhr.onprogress = (event) => {
        const MAX_ARTICLE_LENGTH = 64000; // 最大字节数，用于近似计算进度
        let percentage = parseInt((event.loaded / MAX_ARTICLE_LENGTH) * 100);
        $("#Progressbar").animate({width: `${((percentage > 100) ? 100 : percentage)}%`});
    };
    xhr.send();
}

////////////////////////////////////////////////////////
//  SPA 页 面 渲 染 / 格 局 切 换 管 理
////////////////////////////////////////////////////////

function SPA_Render(pathString, callback) {
    callback = callback || (() => {});

    // SPA路径
    let path = pathString.replace(/^\#\//gi, "").split("/");
    let PageID = path[0];
    let ArticleID = path[1];

    // 按钮光标
    $(`.SPA_TRIGGER[data-target!="${PageID}"]`).attr("active", "false");
    $(`.SPA_TRIGGER[data-target="${PageID}"]`).attr("active", "true");

    console.log(`[Iroha-SPA] 渲染器：当前SPA路径为 ${path.map((v)=>{return decodeURI(v);}).join("/")}`);

    // 每个格局各自的渲染流程，目前包括：注册监听器以处理渲染后动作、渲染格局对应的视图布局

    // 门户格局公用渲染动作
    function PortalConfigInit(PageID) {
        $("title").html(PAGE_TITLE);            // 页面标题
        $(".StickyTitleContainer").hide();      // 控制顶栏显示
        $("#MainNavbar").show();                // 控制导航栏显示
        $("#BackButton").hide();                // 不显示返回按钮
        $(".MenuContainer").hide();             // 不显示菜单按钮
        // 使用模板设置页面内容（框架）
        $('.SPA_MAIN_CONTAINER').html($(`template#${PageID}`).html());
    }

    // 注册所有格局通用的默认监听器
    // SPA_MAIN_CONTAINER_OBSERVER.disconnect();
    SPA_MAIN_CONTAINER_OBSERVER = new MutationObserver((mutations, observer) => {
        clearTimeout(OBSERVER_THROTTLE_TIMER);
        OBSERVER_THROTTLE_TIMER = setTimeout(() => {
            console.log(`[Iroha-SPA] 监听器：SPA_MAIN_CONTAINER已更新`);
            SPA_RegisterTriggers();
            callback();
        }, 200); // 200ms节流
    });
    SPA_MAIN_CONTAINER_OBSERVER.observe(document.getElementsByClassName('SPA_MAIN_CONTAINER')[0], {characterData: true, childList: true, subtree: true});

    // 首页（电台日志）
    if(PageID === "index") {
        PortalConfigInit("index");
        LoadStationLog();
    }
    // 博客
    else if(PageID === "blog") {
        // 正文
        if(ArticleID !== undefined) {
            $("#BackButton").show();     // 显示返回按钮
            $(".MenuContainer").show();  // 显示菜单按钮
            // 控制导航栏的显示
            if(GetMediaType() === "Desktop") { $("#MainNavbar").show(); }
            else if(GetMediaType() === "Mobile") { $("#MainNavbar").hide(); }
            // 创建菜单内容的锚点"ContentsContainer"
            $("#MenuContentContainer").html(`<div id="ContentsContainer"></div>`);
            // 页面内容（框架）
            $('.SPA_MAIN_CONTAINER').html($(`template#${PageID}-article`).html());
            // 载入文章主体内容
            LoadArticle(PageID, ArticleID);
        }
        // 列表
        else {
            PortalConfigInit(PageID);
            $('.SPA_MAIN_CONTAINER').html(`<div class="Prompt">请稍等…</div>`);
            // 获取文章列表的静态内容
            GetTextContentFrom(`./markdown/blog.md`, (text) => {
                $('.SPA_MAIN_CONTAINER').html(text);
                // LoadList("blog");
            }, () => {
                console.error(`获取blog列表失败`);
            });
            
        }
    }
    // 灵感
    else if(PageID === "ideas") {
        PortalConfigInit(PageID);
        $(".MenuContainer").show();  // 显示菜单（目录）按钮
        // 创建菜单内容的锚点"ContentsContainer"
        $("#MenuContentContainer").html(`<!--标签容器--><div id="IdeaMenuTags"></div><!--目录容器--><div id="IdeaMenuList"></div>`);
        LoadIdeas();
    }
    // 收藏
    else if(PageID === "collections") {
        PortalConfigInit(PageID);
        $('.SPA_MAIN_CONTAINER').html(`<div class="Prompt">请稍等…</div>`);
        GetTextContentFrom(`./markdown/collections.md`, (text) => {
            $('.SPA_MAIN_CONTAINER').html(text);
        }, () => {
            console.error(`获取collections失败`);
        });
    }
    // 关于
    else if(PageID === "about") {
        PortalConfigInit(PageID);
        $('.SPA_MAIN_CONTAINER').html(`<div class="Prompt">请稍等…</div>`);
        GetTextContentFrom(`./markdown/about.md`, (text) => {
            $('.SPA_MAIN_CONTAINER').html(text);
        }, () => {
            console.error(`获取about失败`);
        });
    }
    else {
        PortalConfigInit(PageID);
        $('.SPA_MAIN_CONTAINER').html(`<div class="Prompt">请稍等…</div>`);
        $('.SPA_MAIN_CONTAINER').html($(`template#${PageID}`).html());
    }

    // 所有格局共享的：渲染框架布局、格局切入时的初始化工作、SPA触发器注册（通过监听器触发此行为），等等

    // 通用初始化
    ActionsOnReady();

}


//////////////////////////////////////////////////////
//  事件：Onready
//  使用方法：(() => { ...  ActionsOnReady();  ... })();
//////////////////////////////////////////////////////

function ActionsOnReady() {
    // 设置版权年份
    $(".CopyrightYear").each((i, e) => {
        $(e).html(String(new Date().getFullYear()));
    });

    // 重置进度条（进度条动作由template里面的内容控制）
    $("#Progressbar").show();
    $("#Progressbar").css('width', '0%');

    // 进场动画
    $('body').css({'opacity': '0.5'});
    $('body').animate({'opacity': '1'});

    // 绑定菜单按钮的动作
    $('#MenuButton').off('click'); // 避免重复绑定
    $("#MenuButton").on("click", () => { MenuToggle(); }); // 菜单按钮的点击事件

    // 清除首屏加载遮罩
    $(".FirstLoadingMask").fadeOut(800);

    // 设置fancybox
    $.fancybox.defaults.hash = false;
    $.fancybox.defaults.animationDuration = 200;
}


//////////////////////////////////////////////////////
//  通 用 样 式 和 动 效
//////////////////////////////////////////////////////

// 菜单折叠状态切换
function MenuToggle(state) {
    let currentState = $("#MenuButton").attr("data-state");
    if(state === "on") {
        currentState = "off";
    }
    else if(state === "off") {
        currentState = "on";
    }

    if(currentState === "on") {
        $("#MenuButton").attr("data-state", "off");
        $("#MenuButton").html(`<svg style="height: inherit;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M896.704 569.087H127.296c-31.398 0-57.087-25.689-57.087-57.087 0-31.398 25.689-57.087 57.087-57.087h769.409c31.398 0 57.087 25.689 57.087 57.087-0.001 31.398-25.69 57.087-57.088 57.087zM953.791 266c0-31.398-25.689-57.087-57.087-57.087H127.296c-31.398 0-57.087 25.689-57.087 57.087 0 31.398 25.689 57.087 57.087 57.087h769.409c31.397 0 57.086-25.689 57.086-57.087z m-57.087 549.087H127.296c-31.398 0-57.087-25.689-57.087-57.087 0-31.398 25.689-57.087 57.087-57.087h769.409c31.398 0 57.087 25.689 57.087 57.087-0.001 31.398-25.69 57.087-57.088 57.087z" fill="#505050"></path></svg>`);
        if(GetMediaType() === "Desktop") {
            $("#MenuContainer").animate({width: "40px", height: "40px"}, 200, "easeOutExpo");
        }
        else if(GetMediaType() === "Mobile") {
            $("#MenuContainer").animate({width: "40px", height: "40px"}, 200, "easeOutExpo", ()=> {
                $("#MenuContainer").css("background", "transparent");
            });
        }
    }
    else if(currentState === "off") {
        $("#MenuButton").attr("data-state", "on");
        $("#MenuButton").html(`<svg style="height: inherit;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="12" height="12"><path d="M857.085876 995.34637L511.878687 650.139181 166.773873 995.34637a97.665379 97.665379 0 0 1-138.205725-138.10335L373.775337 512.035831 28.568148 166.828642A97.665379 97.665379 0 0 1 166.773873 28.725292L511.878687 373.932481 856.983501 28.725292A97.665379 97.665379 0 0 1 995.086852 166.828642L649.982038 512.035831 995.086852 857.24302a97.563004 97.563004 0 1 1-138.000976 138.10335z" fill="#505050"></path></svg>`);
        if(GetMediaType() === "Desktop") {
            $("#MenuContainer").css("border-radius", "20px");
            $("#MenuContainer").animate({width: "400px", height: "600px"}, 200, "easeOutExpo");
        }
        else if(GetMediaType() === "Mobile") {
            $("#MenuContainer").css("background-color", "#ffffff");
            $("#MenuContainer").animate({width: $(window).width(), height: "100%"}, 200, "easeOutExpo");
        }
    }
}
