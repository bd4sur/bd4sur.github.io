<style>
#TabSwitchContainer {
    margin: 20px;
}
.TAB_SWITCH {
    margin: 2px;
    padding: 0 10px;
    border: none;
    background-color: #e8f6ff;
    color: #1ea0f0;
    border-radius: 5px;
    height: 30px;
    line-height: 30px;
    font-size: 12px;
    cursor: pointer;
}
.TAB_SWITCH:hover {
    font-weight: bold;
}
.TabSwitchSelected {
    background-color: #1ea0f0;
    color: #fff;
}
.TabSwitchDefault {
    background-color: #f0f0f0;
    color: #666;
}


.TopLink {
    color: #4c566d !important;
    border-bottom: 1px solid #bbc0cc !important;
    font-size: 13px;
    letter-spacing: 0.5px;
    line-height: normal;
    cursor: pointer;
}
.TopLink:hover {
    color: #15e !important;
    text-decoration: none;
    border-bottom: 1px solid #15e !important;
}

.TopArticleTable td {
    text-align: center;
    padding: 8px 0;
}

.CategoryArticleTitle {
    color: #b2bbc3;
    font-size: 10px;
    line-height: 13px;
    cursor: pointer;
    /* height: 26px; */
    margin-top: 1px;
    letter-spacing: 1px;
    transform: scale(0.8);
}
.CategoryList {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin: 0 auto;
}
.CategoryBlock {
    display: flex;
    margin: 8px;
    border-radius: 10px;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}
.CategoryIcon {
    display: inline-block;
    width: 30px; height:30px;
    line-height: 30px;
    background: linear-gradient(0deg, #aab6c7, #e6edf5);
    color: #fff;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    text-shadow: 1px 1px 2px #929aac;
    border-radius: 12px;
    cursor: pointer;
}

.Horizon {
    line-height: 16px;
    margin: 20px auto;
    text-align: center;
    cursor: pointer;
    width: fit-content;
}
.Horizon::after {
    display: block;
    content: "";
    height: 10px;
    background: linear-gradient(180deg, #fff, #f0f1f2);
    margin-top: -6px;
}
.HorizonContent {
    font-size: 16px;
    padding: 0 10px;
    color: #456;
    font-weight: bold;
}


.TopArticleFlex {
    display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline;
    margin: 0px auto;
}



@media(min-width:651px){ /*Desktop*/
    .CategoryTitle {
        width: 100%;
        background: linear-gradient(180deg, #1155ee10, #fff);
        font-size: 13px;
        color: #15e;
        line-height: 1.5;
        padding: 10px 0;
        margin: 0 auto;
        border-radius: 3px;
    }
    .category_container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }
    .block_container {
        display: flex;
        width: 120px;
        margin: 0 5px 15px 0;
        flex-wrap: wrap;
        flex-direction: column;
        align-items: center;
    }
    .item_container {
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
        align-items: center;
    }
    .FixedArticleTitle {
        margin: 3px auto;
    }
    .FixedArticleTitle2 {
        margin: 5px 10px;
    }
    .line_seperator {
        display: none;
    }
}
@media(max-width:650px) { /* Mobile */
    .CategoryTitle {
        font-size: 13px;
        color: #003cc3;
        line-height: 59px;
        padding: 0px 12px 0px 0;
        /* margin: 0px 0px 0 10px; */
        /* border-radius: 3px; */
        width: 100px;
        text-align: right;
        border-right: 2px solid #ebeef3;
        letter-spacing: -1.2px;
    }
    .category_container {
        display: flex;
        flex-wrap: nowrap;
        justify-content: flex-start;
        flex-direction: column;
        align-items: center;
    }
    .block_container {
        display: flex;
        margin: 0 0px 10px 0px;
        flex-wrap: nowrap;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
    }
    .item_container {
        display: flex;
        flex-wrap: wrap;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        margin-left: 6px;
        width: calc(100% - 110px);
    }
    .FixedArticleTitle {
        margin: 5px 10px;
    }
    .FixedArticleTitle2 {
        margin: 5px 10px;
    }
    .line_seperator {
        width: 100%;
    }
}


.DemoTagContainer {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin: 0px 0 24px 0;
}
.DemoTag {
    border-radius: 5px;
    background: linear-gradient(0deg, #f2f4f7, #ffffff);
    color: #656e83;
    margin: 5px;
    padding: 6px 10px;
    font-size: 13px;
    line-height: 1.5;
    letter-spacing: 0.5px;
    cursor: pointer;
}
.DemoTag:hover {
    background: linear-gradient(0deg, #e3e5e9, #ffffff);
}





.HorizonLine {
    line-height: 16px;
    margin: 20px auto 24px auto;
    text-align: center;
    cursor: pointer;
}

.HorizonLineContent {
    font-size: 13px;
    padding: 0 10px;
    color: #003cc3;
    background-color: #fff;
    /* font-weight: bold; */
}

.HorizonLine::after {
    display: block;
    content: "";
    height: 2px;
    background: linear-gradient(90deg, #fff, #e7e9ee, #fff);
    margin-top: -8px;
}

</style>


<div class="SectionBody">

    <div style="height: 20px;"></div>

    <div class="category_container">

        <div class="block_container">
            <div class="CategoryTitle">理 论 · 技 术</div>
            <div class="item_container">
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/Cyber-计算与证明">计算·证明</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-认知与寻优">认知·寻优</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-通信与控制">通信·控制</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-射频电子技术">电路·电波</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-能源动力技术">能源·动力</a></div>
            </div>
        </div>

        <div class="block_container">
            <div class="CategoryTitle">问 题 · 观 点</div>
            <div class="item_container">
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/Cyber-知觉智能">知觉智能</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/Cyber-信息安全">信息安全</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/Cyber-知识管理">知识管理</a></div>
            </div>
        </div>

        <div class="block_container">
            <div class="CategoryTitle">电 台 各 系 统</div>
            <div class="item_container">
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-计算平台">计算平台</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-环境系统">环境系统</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-工具系统">工具系统</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-收发信机">收发信机</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-天馈系统">天馈系统</a></div>
            </div>
        </div>

        <div class="line_seperator"></div>

        <div class="block_container">
            <div class="CategoryTitle">无 线 电 业 务</div>
            <div class="item_container">
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-法规与标准">法规·标准</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-架台与通联">架台·通联</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-猎狐与测定">猎狐·测定</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-软件无线电">软件无线电</a></div>
                <div class="FixedArticleTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-广播电视">广播电视</a></div>
            </div>
        </div>

    </div>

    <div class="HorizonLine"><span class="HorizonLineContent">实 践 创 造</span></div>

    <div class="DemoTagContainer">
        <div class="DemoTag" onclick="window.open('https://space.bilibili.com/7919331/upload/video', '_blank');"><span style="font-family: 'Font Awesome 5 Brands'; color: #00A1D6;">&#xe3d9;</span> <span style="font-weight: bold; color: #273a67;">Bilibili 投稿视频</span></div>
        <div class="DemoTag" onclick="window.open('https://github.com/BD4SUR', '_blank');"><span style="font-family: 'Font Awesome 5 Brands'; color: #273a67;">&#xf09b;</span> <span style="font-weight: bold; color: #273a67;">GitHub 仓库</span></div>
        <div style="width: 100%;"></div>
        <div class="DemoTag SPA_TRIGGER" data-target="blog/PL-Animac设计备忘录">Animac设计备忘录</div>
        <div class="DemoTag" onclick="window.open('https://bd4sur.com/Animac', '_blank');"><b>Animac</b> · Scheme解释器<sup>RC</sup></div>
        <div class="DemoTag" onclick="window.open('https://bd4sur.com/Aqua', '_blank');"><b>Aqua</b> · MP3编码器<sup>RC</sup></div>
        <div class="DemoTag" onclick="window.open('https://bd4sur.com/Nano/infer/web', '_blank');"><b>Nano</b> · 电子鹦鹉<sup>RC</sup></div>
        <div style="width: 100%;"></div>
        <div class="DemoTag" onclick="window.open('./html/bpm.html', '_blank');">BPM分析<sup>β</sup></div>
        <div class="DemoTag" onclick="window.open('./html/cw-morse-encoder.html', '_blank');">CW练习器<sup>β</sup></div>
        <div class="DemoTag" onclick="window.open('./html/cw-morse-decoder.html', '_blank');">CW解码器<sup>α</sup></div>
        <div class="DemoTag" onclick="window.open('./html/ar-exam.html', '_blank');">操作证刷题<sup>RC</sup></div>
        <div class="DemoTag" onclick="window.open('./html/am32.html', '_blank');">频谱绘图<sup>RC</sup></div>
        <div class="DemoTag" onclick="window.open('./html/ofdm.html', '_blank');">音频OFDM<sup>α</sup></div>
        <div class="DemoTag" onclick="window.open('./html/mechwatch-analyser.html', '_blank');">机械表校表仪<sup>α</sup></div>
    </div>

    <div class="HorizonLine"><span class="HorizonLineContent">百 科 笔 记</span></div>

    <div class="CategoryList">
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/A.哲学宗教伦理心理">
            <div class="CategoryIcon">A</div><div class="CategoryArticleTitle">哲学宗教<br>伦理心理</div></div>
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/B.文艺传播教育体育">
            <div class="CategoryIcon">B</div><div class="CategoryArticleTitle">文艺传播<br>教育体育</div></div>
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/C.历史地理语言文化">
            <div class="CategoryIcon">C</div><div class="CategoryArticleTitle">历史地理<br>语言文化</div></div>
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/D.政治法律社会时事">
            <div class="CategoryIcon">D</div><div class="CategoryArticleTitle">政治法律<br>社会时事</div></div>
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/E.军事战备安全消防">
            <div class="CategoryIcon">E</div><div class="CategoryArticleTitle">军事战备<br>安全消防</div></div>
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/F.经济管理贸易营销">
            <div class="CategoryIcon">F</div><div class="CategoryArticleTitle">经济管理<br>贸易营销</div></div>
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/G.数学统计电子信息">
            <div class="CategoryIcon">G</div><div class="CategoryArticleTitle">数学统计<br>电子信息</div></div>
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/H.物理化学天文地学">
            <div class="CategoryIcon">H</div><div class="CategoryArticleTitle">物理化学<br>天文地学</div></div>
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/I.医药卫生生命科学">
            <div class="CategoryIcon">I</div><div class="CategoryArticleTitle">医药卫生<br>生命科学</div></div>
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/J.农业景观生态环境">
            <div class="CategoryIcon">J</div><div class="CategoryArticleTitle">农业景观<br>生态环境</div></div>
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/K.工业交通工程技术">
            <div class="CategoryIcon">K</div><div class="CategoryArticleTitle">工业交通<br>工程技术</div></div>
        <div class="CategoryBlock SPA_TRIGGER" data-target="blog/L.家政轻工实用技术">
            <div class="CategoryIcon">L</div><div class="CategoryArticleTitle">家政轻工<br>实用技术</div></div>
    </div>

</div>

<!-- NOTE 目前暂时不需要动态的文章列表。如需重新启用，需要解除`SPA_Render()`过程中`LoadList("blog")`函数调用。 -->
<!--
<div class="Horizon"><span class="HorizonContent" style="font-weight: normal;">其 他 文 章</span></div>
<div id="TabSwitchContainer" style="text-align: center;"></div>
<table class="ArticleListContainer" id="ArticleListContainer"></table>
-->
