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
    color: #567;
    font-size: 10px;
    line-height: 12px;
    cursor: pointer;
    height: 26px;
    margin-left: 5px;
    letter-spacing: 1px;
}
.CategoryList {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin: 0 auto;
}
.CategoryBlock {
    display: flex;
    margin: 15px;
    border-radius: 10px;
    align-content: space-between;
    justify-content: center;
    align-items: stretch;
}
.CategoryIcon {
    display: inline-block;
    width: 26px; height:26px;
    line-height: 26px;
    background: linear-gradient(0deg, #7e90ab, #ecf5ff);
    color: #fff;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    text-shadow: 1px 1px 2px #263a66;
    border-radius: 3px;
    cursor: pointer;
}

.Horizon {
    line-height: 16px;
    margin: 24px auto;
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

.CategoryTitle {
    font-size: 13px; color: #15d; line-height: 1.5; margin: 5px auto;
}
.TopArticleFlex {
    display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline;
    margin: 0px auto;
}
.FlexTitle {
    margin: 10px 10px;
}

</style>


<div class="SectionBody">

    <div style="height: 1px;"></div>

    <div class="Horizon" onclick="$(`#amateur_radio`).fadeToggle(200);"><span class="HorizonContent">业 余 无 线 电</span></div>

    <div id="amateur_radio">
        <div class="CategoryTitle">理 论</div>
        <div class="TopArticleFlex">
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-数理基础">数理基础</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-视听技术">视听技术</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-机器学习">机器学习</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-信息通信理论">信息通信</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-射频电子技术">射频电子</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-电波传播规律">电波传播</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-能源动力技术">能源动力</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-精密测量计量">测量计量</a></div>
        </div>

        <div class="CategoryTitle">设 备 · 工 具</div>
        <div class="TopArticleFlex">
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-RIGS-IC-705备忘录">IC-705</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-RIGS-KC908U备忘录">KC908U</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-RIGS-EB200备忘录">EB200</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-RIGS-计算机备忘录">计算机</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-RIGS-仪器仪表备忘录">仪器仪表</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-RIGS-收发信机备忘录">收发信机</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-RIGS-天馈射频器件备忘录">天馈射频器件</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-RIGS-传感执行器件备忘录">传感执行器件</a></div>
        </div>

        <div class="CategoryTitle">业 务 实 践</div>
        <div class="TopArticleFlex">
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-法规协议标准">法规·协议·标准</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-架台通联对抗">架台·通联·对抗</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-软件无线电">软件无线电</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-广播电视">广播电视</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-业余电视">业余电视</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/AR-雷达遥感与射电天文">雷达·遥感·射电天文</a></div>
            <div class="FlexTitle"><a class="TopLink" href="./html/ar-flyer.html">宣传单</a></div>
        </div>

        <div class="CategoryTitle">研 究 开 发 实 践</div>
        <div class="TopArticleFlex">
            <div class="FlexTitle"><a class="TopLink" href="./Aqua">MP3编码器<sup>RC</sup></a></div>
            <div class="FlexTitle"><a class="TopLink" href="./html/bpm.html">BPM分析<sup>β</sup></a></div>
            <div class="FlexTitle"><a class="TopLink" href="./html/cw-morse-encoder.html">CW练习器<sup>β</sup></a> / <a class="TopLink" href="./html/cw-morse-decoder.html">解码器<sup>α</sup></a></div>
            <div class="FlexTitle"><a class="TopLink" href="./html/exam.html">操作证刷题<sup>RC</sup></a></div>
            <div class="FlexTitle"><a class="TopLink" href="./html/am32.html">频谱绘图<sup>RC</sup></a></div>
            <div class="FlexTitle"><a class="TopLink" href="./html/ofdm.html">OFDM<sup>α</sup></a></div>
            <!-- <div class="FlexTitle"><a class="TopLink" href="./html/sa-sim.html">频谱仪面板<sup>α</sup></a></div> -->
            <div class="FlexTitle"><a class="TopLink" href="./html/mechwatch-analyser.html">机械表校表仪<sup>α</sup></a></div>
        </div>
    </div>

    <div class="Horizon" onclick="$(`#plt`).fadeToggle(200);"><span class="HorizonContent">系 统 与 控 制</span></div>

    <div id="plt">
        <div class="TopArticleFlex" style="margin: 10px 0 15px 0;">
            <div class="FlexTitle"><a class="TopLink" href="./html/scheme-interpreter.html">Scheme解释器原型</a> / <a class="TopLink" href="./html/auroravm.html">VM原型</a> / <a class="TopLink SPA_TRIGGER" data-target="blog/PL-Animac设计备忘录">设计备忘录</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/Cyber-计算原理">计算原理</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/Cyber-信息安全">信息安全</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/Cyber-系统思维">系统思维</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/Cyber-心智进化">心智进化</a></div>
            <div class="FlexTitle"><a class="TopLink SPA_TRIGGER" data-target="blog/Cyber-新陈代谢">新陈代谢</a></div>
        </div>
    </div>

    <div class="Horizon" onclick="$(`#encyclopedia`).fadeToggle(200);"><span class="HorizonContent">百 科</span></div>

    <div id="encyclopedia" class="CategoryList">
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
