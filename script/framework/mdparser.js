// Mikumark V3.0
// Markdown Parser
// 2019.10 Refactored in TypeScript
// 2022.01 Refactored in JavaScript
// Arch:
// MD → [Parser] → MarkdownDocument object(HTML included) → [Painter] → Web page
// Document:
/*
#!title: 标题
#!content
此处为正文
*/

// Markdown解析
// 输入：MD多行文本，是否懒加载图片（仅文章正文页面使用懒加载，其他场合一般不需要）
// 输出：
// {
//     "html": HTML代码,
//     "outline": [{}, ...] 文章目录
// };
function ParseMarkdown(markdown, isImageLazyLoad) {

    let OUTLINE = [];
    let TITLE_COUNT = 0;

    // 元字符常量
    const C_STAR = '@STAR@'; // *
    const C_WAVE = "@WAVE@"; // ~
    const C_REVQ = "@REVQ@"; // `
    const C_LSQB = "@LSQB@"; // [
    const C_RSQB = "@RSQB@"; // ]
    const C_LRDB = "@LRDB@"; // (
    const C_RRDB = "@RRDB@"; // )
    const C_DOLR = "@DOLR@"; // $
    const C_VERT = "@VERT@"; // |
    const C_PLUS = "@PLUS@"; // +
    const C_MNUS = "@MNUS@"; // -
    const C_BSLT = "@BSLT@"; // \
    const C_SHRP = "@SHRP@"; // #
    const C_AMPS = "@AMPS@"; // &
    const C_PCNT = "@PCNT@"; // %

    // 元字符转义
    function EscapeMetachar(str) {
        return str
        .replace(/\\\*/g, C_STAR).replace(/\\\~/g, C_WAVE).replace(/\\\`/g, C_REVQ)
        .replace(/\\\[/g, C_LSQB).replace(/\\\]/g, C_RSQB).replace(/\\\(/g, C_LRDB)
        .replace(/\\\)/g, C_RRDB).replace(/\\\$/g, C_DOLR).replace(/\\\|/g, C_VERT)
        .replace(/\\\+/g, C_PLUS).replace(/\\\\/g, C_BSLT).replace(/\\\#/g, C_SHRP)
        .replace(/\\\-/g, C_MNUS).replace(/\\\&/g, C_AMPS).replace(/\\\%/g, C_PCNT);
    }

    // 元字符覆盖
    function CoverMetachar(str) {
        return str
        .replace(/\*/g, C_STAR).replace(/\~/g, C_WAVE).replace(/\`/g, C_REVQ)
        .replace(/\[/g, C_LSQB).replace(/\]/g, C_RSQB).replace(/\(/g, C_LRDB)
        .replace(/\)/g, C_RRDB).replace(/\$/g, C_DOLR).replace(/\|/g, C_VERT)
        .replace(/\+/g, C_PLUS).replace(/\\/g, C_BSLT).replace(/\#/g, C_SHRP)
        .replace(/\-/g, C_MNUS).replace(/\&/g, C_AMPS).replace(/\%/g, C_PCNT);
    }

    // 元字符换回
    function RecoverMetachar(str) {
        return str
        .replace(new RegExp(C_STAR,'g'), '*').replace(new RegExp(C_WAVE,'g'), '~').replace(new RegExp(C_REVQ,'g'), '`')
        .replace(new RegExp(C_LSQB,'g'), '[').replace(new RegExp(C_RSQB,'g'), ']').replace(new RegExp(C_LRDB,'g'), '(')
        .replace(new RegExp(C_RRDB,'g'), ')').replace(new RegExp(C_DOLR,'g'), '$').replace(new RegExp(C_VERT,'g'), '|')
        .replace(new RegExp(C_PLUS,'g'), '+').replace(new RegExp(C_BSLT,'g'), '\\').replace(new RegExp(C_SHRP,'g'), '#')
        .replace(new RegExp(C_MNUS,'g'), '-').replace(new RegExp(C_AMPS,'g'), '&').replace(new RegExp(C_PCNT,'g'), '%');
    }

    // 覆盖HTML元字符
    function CoverHTMLchar(str) {
        return str.replace(/>/gi, "&gt;").replace(/</gi, "&lt;").replace(/&/gi, "&amp;");
    }

    // 换回HTML元字符
    function RecoverHTMLchar(str) {
        return str.replace(/&gt;/gi, ">").replace(/&lt;/gi, "<").replace(/&amp;/gi, "&");
    }


    // 段内样式解析
    function ParseInline(mdInline) {
        let RegexInlineCode = /\`(.+?)\`/g;
        let RegexTag = /\#\((.+?)\)\#/g;
        let RegexBold = /\*\*(.+?)\*\*/g;
        let RegexItalic = /%%(.+?)%%/g;
        let RegexDeleted = /~(.+?)~/g;
        let RegexColor = /\[\[(#?[a-zA-Z0-9]+?)\:(.+?)#\]\]/g;
        let RegexSelfLink = /\[(.+?)\]\(\)/g;
        let RegexLink = /\[(.+?)\]\((.+?)\)/g;

        // 首先处理换行
        let HTML = mdInline.replace(/[\n\r]/g, "<br/>");

        // 行内代码：需要特殊处理，其内的所有元字符都应被转义，防止解析成HTML标签。（不会处理已屏蔽的元字符）
        let inlineCodeSegments = RegexInlineCode.exec(HTML);
        while(inlineCodeSegments !== null) {
            let rhs = inlineCodeSegments[1];
            HTML = HTML.replace(inlineCodeSegments[0],
                `<code class="MikumarkCode"><script type="text/html" style="display: inline;">${rhs}</script></code>`);
            // HTML = HTML.replace(inlineCodeSegments[0],
            //     `<code class="MikumarkCode">${CoverHTMLchar(CoverMetachar(inlineCodeSegments[1]))}</code>`);
            inlineCodeSegments = RegexInlineCode.exec(HTML);
        }

        HTML = EscapeMetachar(HTML);

        HTML = HTML .replace(RegexTag, `<span class="MikumarkTag">$1</span>`)
                    .replace(RegexBold, `<b>$1</b>`)
                    .replace(RegexItalic, `<i>$1</i>`)
                    .replace(RegexDeleted, `<del>$1</del>`)
                    .replace(RegexColor, `<span style="color:$1;">$2</span>`)
                    .replace(RegexSelfLink, `<a target="_blank" href="$1">$1</a>`)
                    .replace(RegexLink, `<a target="_blank" href="$2">$1</a>`)
                    ;

        // return RecoverHTMLchar(RecoverMetachar(HTML));
        return RecoverMetachar(HTML);
    }


    // 段落级样式解析
    function ParseParagraph(mdParagraph) {
        if(mdParagraph.length <= 0) return "";

        let HtmlBuffer = new Array();

        mdParagraph = mdParagraph.trim();

        // 标题
        if(/^#+?(?![\!\(]).+/g.test(mdParagraph) === true) {
            let level = (mdParagraph.match(/^#+(?=[^#])/i)[0]).length;
            let title = mdParagraph.replace(/^#+/g, "").trim();
            HtmlBuffer.push(`<h${level} id="Title_${TITLE_COUNT}">${title}</h${level}>`);
            // 目录
            OUTLINE[TITLE_COUNT] = {
                level: level,
                title: title
            };
            TITLE_COUNT++;
        }
        // 分割线（至少3个连续dash的单行段落）
        else if(/^\-{3,}$/g.test(mdParagraph) === true) {
            HtmlBuffer.push(`<hr/>`);
        }
        // 有序列表（+号开头的段落）
        else if(/^\++[\s\S]+/g.test(mdParagraph) === true) {
            // 按行分割列表项
            let lines = mdParagraph.split("\n");
            // 层级计数器
            let currentLevel = 0;
            for(let i = 0; i < lines.length; i++) {
                let line = lines[i];
                // 计算+号数量（列表层级）
                let prefix = line.match(/^\++(?=[^\+])/i);
                if(prefix == null) {
                    HtmlBuffer.push(mdParagraph);
                    break;
                }
                let level = prefix[0].length;
                // 列表文本
                let item = line.replace(/^\++/g, "").trim();
                // 判断层级是否改变
                if(level > currentLevel) { // 嵌套加深
                    for(let c = 0; c < (level - currentLevel); c++) {
                        HtmlBuffer.push(`<ol>`);
                    }
                    HtmlBuffer.push(`<li>`);
                    HtmlBuffer.push(ParseInline(item));
                    currentLevel = level;
                }
                else if(level < currentLevel){ // 嵌套退出
                    for(let c = 0; c < (currentLevel - level); c++) {
                        HtmlBuffer.push(`</li></ol>`);
                    }
                    HtmlBuffer.push(`</li><li>`);
                    HtmlBuffer.push(ParseInline(item));
                    currentLevel = level;
                }
                else { // 保持同级
                    HtmlBuffer.push(`</li><li>`);
                    HtmlBuffer.push(ParseInline(item));
                    currentLevel = level;
                }
            }
            // 闭合列表标签
            for(let c = 0; c < currentLevel; c++) {
                HtmlBuffer.push(`</li></ol>`);
            }
        }
        // 无序列表（-号开头的段落）
        else if(/^\-+[\s\S]+/g.test(mdParagraph) === true) {
            // 按行分割列表项
            let lines = mdParagraph.split("\n");
            // 层级计数器
            let currentLevel = 0;
            for(let i = 0; i < lines.length; i++) {
                let line = lines[i];
                // 计算-号数量（列表层级）
                let prefix = line.match(/^\-+(?=[^\-])/i);
                if(prefix == null) {
                    HtmlBuffer.push(mdParagraph);
                    break;
                }
                let level = prefix[0].length;
                // 列表文本
                let item = line.replace(/^\-+/g, "").trim();
                // 判断层级是否改变
                if(level > currentLevel) { // 嵌套加深
                    for(let c = 0; c < (level - currentLevel); c++) {
                        HtmlBuffer.push(`<ul>`);
                    }
                    HtmlBuffer.push(`<li>`);
                    HtmlBuffer.push(ParseInline(item));
                    currentLevel = level;
                }
                else if(level < currentLevel){ // 嵌套退出
                    for(let c = 0; c < (currentLevel - level); c++) {
                        HtmlBuffer.push(`</li></ul>`);
                    }
                    HtmlBuffer.push(`</li><li>`);
                    HtmlBuffer.push(ParseInline(item));
                    currentLevel = level;
                }
                else { // 保持同级
                    HtmlBuffer.push(`</li><li>`);
                    HtmlBuffer.push(ParseInline(item));
                    currentLevel = level;
                }
            }
            // 闭合列表标签
            for(let c = 0; c < currentLevel; c++) {
                HtmlBuffer.push(`</li></ul>`);
            }
        }
        // 表格
        else if(/^\|[\s\S]+\|$/g.test(mdParagraph) === true) {
            // 按行分割
            let rows = mdParagraph.split("\n");
            // 分割线标识
            let hasHeadline = false;
            // 对齐方式：下标为列序号（从1开始）
            let alignType = new Array();
            HtmlBuffer.push('<div class="MikumarkTableContainer"><table>');

            for(let i = 0; i < rows.length; i++) {
                let row = rows[i];
                let cols = row.split("|");
                if(cols.length <= 2) {
                    console.log("Syntax error."); return;
                }
                if(cols.length == 3 && /\-{3,}/i.test(cols[1])==true) {
                    hasHeadline = true;
                }
                else {
                    HtmlBuffer.push('<tr>');
                    if(hasHeadline == true) { // TD表格主体
                        for(let c = 1; c < cols.length - 1; c++) {
                            HtmlBuffer.push(`<td${( alignType[c] ? alignType[c] : '' )}>${ParseInline(cols[c])}</td>`);
                        }
                    }
                    else { // TH表头
                        for(let c = 1; c < cols.length - 1; c++) {
                            // 记录对齐方式
                            if(/^\:.*\:$/gi.test(cols[c])) {
                                alignType[c] = ` style="text-align:center;"`;
                            }
                            else if(/\:$/gi.test(cols[c])) {
                                alignType[c] = ` style="text-align:right;"`;
                            }
                            else if(/^\:/gi.test(cols[c])) {
                                alignType[c] = ` style="text-align:left;"`;
                            }
                            else {
                                alignType[c] = '';
                            }
                            cols[c] = cols[c].replace(/\:$/gi, '').replace(/^\:/gi, '');
                            HtmlBuffer.push(`<th${( alignType[c] ? alignType[c] : '' )}>${ParseInline(cols[c])}</th>`);
                        }
                    }
                    HtmlBuffer.push('</tr>');
                }
            }
            HtmlBuffer.push('</table></div>');
        }
        // 图片
        else if(/^\!\[.+?\]\(.+?\)$/g.test(mdParagraph) === true) {
            let imgTitle = mdParagraph.match(/^\!\[.+\]\(/g)[0];
            imgTitle = imgTitle.substring(2, imgTitle.length - 2);
            let imgURL = mdParagraph.match(/\]\([^(\]\()]+\)$/g)[0];
            imgURL = imgURL.substring(2, imgURL.length - 1);

            let imgHtml = '';
            if(isImageLazyLoad === false) {
                imgHtml = `<div class="MikumarkImageContainer">
                <img class="MikumarkImage" src="${imgURL}"><div class="MikumarkImageTitle">${ParseInline(imgTitle)}</div></div>`;
            }
            else {
                imgHtml = `<div class="MikumarkImageContainer">
                <div class="loading">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>
                <a class="fancybox-a" data-fancybox="gallery" href="${imgURL}"><img class="MikumarkImage" data-src="${imgURL}"></a>
                <div class="MikumarkImageTitle">${ParseInline(imgTitle)}</div></div>`;
            }
            HtmlBuffer.push(imgHtml);
        }
        // 居中的段落
        else if(/^\:.+/g.test(mdParagraph) === true) {
            let content = mdParagraph.substring(1).trim(); // 截取:号后面的内容
            HtmlBuffer.push(`<p style="text-align:center;">${ParseInline(content)}</p>`);
        }
        // LaTeX公式段落
        else if(/^\$\$.+?\$\$$/g.test(mdParagraph) === true) {
            HtmlBuffer.push(`<p>${mdParagraph}</p>`);
        }
        // 单个HTML元素，直接原样返回
        else if(/^<.+?[\s\S]*>$/g.test(mdParagraph) === true) {
            HtmlBuffer.push(mdParagraph);
        }
        // 普通段落
        else {
            HtmlBuffer.push(`<p>${ParseInline(mdParagraph)}</p>`);
        }

        return HtmlBuffer.join("");
    }


    // 跨段落样式解析
    function ParseInterPara(md) {
        let HtmlBuffer = new Array();

        // 处理标签页 ///////////////////////////////////

        let mdBuffer = new Array();

        let tabIndexes = [];
        let tabContents = [];
        let tabCount = -1;
        let groupTabCountFrom = 0;
        let groupCount = -1;

        let lines = md.split("\n");
        let isInTabBlock = false;

        for(let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if(/^@@tab(s)?$/g.test(line) === true) { // 不支持在块引用中的Tab块
                // 进入Tab块
                if(isInTabBlock === false) {
                    isInTabBlock = true;
                    groupTabCountFrom = tabCount + 1;
                    groupCount++;
                }
                // 退出Tab块时，将缓存起来的Tab内容写回
                else {
                    isInTabBlock = false;
                    mdBuffer.push(`<div class="MikumarkTab"><div class="MikumarkTabButtonContainer">`);
                    mdBuffer.push(tabIndexes.slice(groupTabCountFrom).join("\n"));
                    mdBuffer.push(`</div><div class="MikumarkTabContentContainer">`);
                    for(let n = groupTabCountFrom; n <= tabCount; n++) {
                        if(n === groupTabCountFrom) {
                            mdBuffer.push(`<div class="MikumarkTabContent_${groupCount} MikumarkTab_${groupCount}_${n}">`);
                        }
                        else {
                            mdBuffer.push(`</div><div class="MikumarkTabContent_${groupCount} MikumarkTab_${groupCount}_${n}" style="display: none;">`);
                        }
                        let tabContent = tabContents[n];
                        for(let j = 0; j < tabContent.length; j++) {
                            mdBuffer.push(tabContent[j]);
                        }
                    }
                    mdBuffer.push(`</div></div></div>`);
                }
            }
            // 标签标题
            else if(/^@.+/g.test(line) === true) {
                tabCount++;
                let isActive = (tabCount === groupTabCountFrom) ? "MikumarkTabActive" : "";
                let tabTitle = line.substring(1).trim();
                tabIndexes[tabCount] = `
<div class="MikumarkTabButton MikumarkTabBtnGroup_${groupCount} MikumarkTabBtn_${tabCount} ${isActive}" onclick="$('.MikumarkTabContent_${groupCount}').hide(0, ()=>{ $('.MikumarkTab_${groupCount}_${tabCount}').show(); $('.MikumarkTabBtnGroup_${groupCount}').removeClass('MikumarkTabActive'); $('.MikumarkTabBtn_${tabCount}').addClass('MikumarkTabActive'); });">${tabTitle}</div>`;
                tabContents[tabCount] = [];
            }
            else {
                // 处于Tab块内部
                if(tabCount >= 0 && isInTabBlock === true) {
                    tabContents[tabCount].push(line);
                }
                else {
                    mdBuffer.push(line);
                }
            }
        }

        md = mdBuffer.join("\n"); // 重新组合起来

        // 处理代码块 ///////////////////////////////////

        let codeBlocks = new Array();

        mdBuffer = new Array();

        let codeIndex = 0;
        let codeLanguage = "";
        let codeBlockBuffer = new Array();

        lines = md.split("\n");
        let isInCodeBlock = false;
        let codeBlockQuoteLevel = 0;
        for(let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if(/^(>*)\s*```/g.test(line) === true) { // 支持在块引用中的代码块
                // 进入代码块
                if(isInCodeBlock === false) {
                    codeBlockQuoteLevel = (line.match(/^>*(?=[^>])/i)[0]).length;
                    codeLanguage = line.replace(/^(>*)\s*```:?/gi, "").toLowerCase();
                    isInCodeBlock = true;
                }
                // 退出代码块
                else {
                    isInCodeBlock = false;
                    mdBuffer.push(`${">>>>>>>>>>>>>>>>>>>".substring(0, codeBlockQuoteLevel)}\`\`\`${codeIndex}`);
                    codeBlocks[codeIndex] = {
                        language: codeLanguage,
                        code: CoverHTMLchar(codeBlockBuffer.join(""))
                    };
                    codeIndex++;
                    codeLanguage = "";
                    codeBlockBuffer = new Array();
                    codeBlockQuoteLevel = 0;
                }
            }
            else {
                // 处于代码块内部
                if(isInCodeBlock === true) {
                    codeBlockBuffer.push(line + "\n");
                }
                else {
                    mdBuffer.push(line);
                }
            }
        }

        md = mdBuffer.join("\n"); // 重新组合起来

        // 自然段落分隔
        let paragraphs = md.split(/\n{2,}/g);

        // 遍历各个段落，判断段落类型
        // 引用块计数
        let quoteFlag = false;
        let quoteLevel = 0;
        for(let pcount = 0; pcount < paragraphs.length; pcount++) {
            let paragraph = paragraphs[pcount];

            // 引用框？
            if(/^>.+/g.test(paragraph) === true) {
                quoteFlag = true;
                // >号数量（引用层级）
                let level = (paragraph.match(/^>+(?=[^>])/i)[0]).length;

                // 引用文本
                let quote = paragraph.replace(/^>+/, "").trim();

                // 判断层级是否改变
                if(level > quoteLevel) { // 嵌套加深
                    for(let c = 0; c < (level - quoteLevel); c++) {
                        HtmlBuffer.push(`<blockquote>`);
                    }
                }
                else if(level < quoteLevel){ // 嵌套退出
                    for(let c = 0; c < (quoteLevel - level); c++) {
                        HtmlBuffer.push(`</blockquote>`);
                    }
                }
                else {} // 保持同级，不加标签

                // 处理代码块
                if(/^(>*)\s*```\d+/g.test(quote) === true) {
                    HtmlBuffer.push(quote);
                }
                else {
                    HtmlBuffer.push(ParseParagraph(quote));
                }
                quoteLevel = level;
            }
            // 无前缀的段落
            else {
                // 闭合引用标签，并退出引用状态
                if(quoteFlag == true) {
                    for(let c = 0; c < quoteLevel; c++) {
                        HtmlBuffer.push(`</blockquote>`);
                    }
                    quoteLevel = 0;
                }
                quoteFlag = false;

                if(/^```\d+/g.test(paragraph) === true) {
                    HtmlBuffer.push(paragraph);
                }
                else {
                    HtmlBuffer.push(ParseParagraph(paragraph));
                }
            }
        }

        // 代码写回并高亮
        for(let i = 0; i < HtmlBuffer.length; i++) {
            let para = HtmlBuffer[i];
            if(/^(>*)\s*```/g.test(para) === true) {
                let index = parseInt(para.trim().replace(/^(>*)\s*```/g, ""));
                let codeBlock = codeBlocks[index];
                let code = RecoverMetachar(RecoverHTMLchar(codeBlock.code));
                HtmlBuffer[i] = `<pre><code>${code}</code></pre>`;
            }
        }

        return HtmlBuffer.join("");
    }

    // 函数入口

    return {
        "html": ParseInterPara(markdown),
        "outline": OUTLINE
    };

}

// 文章解析
// 仅保留必要字段
function ParseArticle(article) {
    let contentBuffer = new Array();
    let title = "";
    let date = "";

    let state = "content";

    let lines = article.split("\n");
    for(let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if(/^#!title:/g.test(line) === true) {
            title = line.replace(/^#!title:/g, "").trim();
        }
        else if(/^#!date:/g.test(line) === true) {
            date = line.replace(/^#!date:/g, "").trim();
        }
        else if(/^#!content$/.test(line) === true) { state = "content"; }
        else if(state === "content") { contentBuffer.push(line); }
    }

    let mdContent = contentBuffer.join("\n");

    let md = ParseMarkdown(mdContent);

    return  {
        "html": md.html,
        "outline": md.outline,
        "title": title,
        "date": date
    };
}
