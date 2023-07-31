// BD4SUR.com
// Copyright © 2016-2022 BD4SUR

// 载入并渲染列表
function LoadList(pageId) {

    // 列表渲染为HTML
    function RenderArticleList(articleList, currentCategoty) {

        // 维护分类选项卡按钮状态
        $('.TAB_SWITCH').each(function(i,e) {
            if($(e).attr('data-category') === currentCategoty) {
                $(e).addClass("TabSwitchSelected");
            }
            else {
                $(e).removeClass("TabSwitchSelected");
            }
        });

        // 标题→文件名
        function TitleToFilename(title) {
            return title.replace(/\s+/gi, "-");
        }

        let HtmlBuffer = new Array();
        for(let i = 0; i < articleList.length; i++) {
            let articleInfo = articleList[i];
            let title = articleInfo.title;
            let date = articleInfo.date;
            let category = articleInfo.category;
            let tags = articleInfo.tags;

            let tagString = "";
            for(let j = 0; j < tags.length; j++) {
                tagString += `<span class="ArticleTag">${tags[j]}</span>`;
            }
            if(tags.length > 0) tagString += " / ";

            let html = `
<tr class="ArticleItem enter" data-title="${title}">
    <td class="ArticleTitle">
        <span class="ArticleTitleLink SPA_TRIGGER" data-target="${pageId}/${TitleToFilename(title)}">${title}</span>
        <div style="font-size: 12px; color: #c0d0e0; margin-top: 4px;">${date}</div>
    </td>
    <td class="ArticleInfo"><span class="ArticleTag">${category}</span></td>
</tr>`;

            HtmlBuffer.push(html);
        }

        document.getElementById('ArticleListContainer').innerHTML = HtmlBuffer.join("");

        console.log(`[Iroha-SPA] 列表渲染完毕，计 ${articleList.length} 项`);

    }


    // 分类Tab切换按钮
    function RenderTabSwitch(articleList) {
        let categories = {};
        for(let i = 0; i < articleList.length; i++) {
            let item = articleList[i];
            let category = item.category;
            categories[category] = true;
        }
        $(`#TabSwitchContainer`).append(`<button class="TAB_SWITCH TabSwitchDefault" data-category="">全部</button>`);
        for(cat in categories) {
            $(`#TabSwitchContainer`).append(`<button class="TAB_SWITCH" data-category="${cat}">${cat}</button>`);
        }
    }


    /////////////////////////////
    //  函 数 主 体 部 分
    /////////////////////////////

    // 初始化文章列表监听器
    LIST_OBSERVER = new MutationObserver((mutations, observer) => {
        clearTimeout(OBSERVER_THROTTLE_TIMER);
        OBSERVER_THROTTLE_TIMER = setTimeout(() => {
            console.log(`[Iroha-SPA] 监听器：列表已更新`);
            SPA_RegisterTriggers();
        }, 100); // 100ms节流
    });
    LIST_OBSERVER.observe(document.getElementById('ArticleListContainer'), {characterData: true, childList: true, subtree: true});

    let xhr = new XMLHttpRequest();
    xhr.open("GET", `markdown/${pageId}/-articles.json`);
    xhr.onreadystatechange = () => {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            $("#Progressbar").animate({width: `100%`});
            $("#Progressbar").fadeOut();

            // 获取文章列表，并立即绘制
            let contents = JSON.parse(xhr.responseText);
            RenderArticleList(contents, "");

            // 绘制分类选项卡按钮
            RenderTabSwitch(contents);

            // 给每个Tab按钮注册点击事件（筛选相应分类的文章）
            $('.TAB_SWITCH').off('click'); // 避免重复绑定
            $('.TAB_SWITCH').each(function(i,e) {
                $(e).on("click", () => {
                    let newList = [];
                    let category = $(e).attr('data-category');
                    if(category === "") {
                        RenderArticleList(contents, category);
                    }
                    else {
                        for(let i = 0; i < contents.length; i++) {
                            let item = contents[i];
                            if(item.category === category) {
                                newList.push(item);
                            }
                        }
                        RenderArticleList(newList, category);
                    }
                });
            });
        }
        else if(xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200){
            $("#Progressbar").animate({width: `100%`});
            $("#Progressbar").fadeOut();
            return;
        }
    };
    xhr.onprogress = (event) => {
        const MAX_ARTICLE_LENGTH = 20000; // 最大字节数，用于近似计算加载进度
        let percentage = parseInt((event.loaded / MAX_ARTICLE_LENGTH) * 100);
        $("#Progressbar").animate({width: `${((percentage > 100) ? 100 : percentage)}%`});
    };
    xhr.send();
}

