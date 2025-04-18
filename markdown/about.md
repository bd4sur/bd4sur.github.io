<style>
.bd4sur-timeline {
    --timeline-font-size: 13px;
    --circle-radius: 7px;
    --tail-left-offset: 4.5px;

    width: fit-content;
    max-width: 550px;
    box-sizing: border-box;
    line-height: 1.7;
    text-align: left;
    margin: 30px auto;
    padding: 0 30px;
    list-style: none;
    letter-spacing: 0.2px;
}
.bd4sur-timeline-item {
    position: relative;
    padding-bottom: 15px;
    font-size: var(--timeline-font-size);
    list-style: none;
}
.bd4sur-timeline-item-tail {
    position: absolute;
    top: var(--circle-radius);
    left: var(--tail-left-offset);
    height: 100%;
    border-left: 2px solid #f0f0f0;
}
.bd4sur-timeline-item:last-child .bd4sur-timeline-item-tail {
    display: none;
}
.bd4sur-timeline-item-head {
    position: absolute;
    width: var(--circle-radius);
    height: var(--circle-radius);
    background-color: #fff;
    border: 2px solid transparent;
    border-radius: 100px;
    border-color: #ccc;
}
.bd4sur-timeline-item-content {
    position: relative;
    top: calc(0px - var(--timeline-font-size) / 2);
    margin: 0 0 0 25px;
    word-break: break-word;
}
.bd4sur-timeline-item-content i { /* 标题 */
    font-weight: bold;
    font-style: normal;
}
.bd4sur-timeline-item-content p { /* 正文 */
    margin: 0;
}
.bd4sur-timeline-item-content time { /* 时间日期 */
    color: #ccc;
    font-size: 10px;
    font-weight: normal;
    padding-left: 8px;
    top: -1px;
}

.bd4sur-timeline-item-head-blue  { border-color: #15e; }
.bd4sur-timeline-item-head-red   { border-color: #f33; }
.bd4sur-timeline-item-head-green { border-color: #4a1; }
.bd4sur-timeline-item-head-gold  { border-color: #fd0; }


@media(min-width:651px){
    .LicenseImage {
        width: 50%;
        max-width: 600px;
        margin: 20px auto;
        border-radius: 10px;
    }
}
@media(max-width:650px){
    .LicenseImage {
        width: 80%;
        max-width: 600px;
        margin: 20px auto;
        border-radius: 10px;
    }
}

.ContactLink { font-size: 20px; line-height: 30px; padding: 0 5px; }
a.ContactLink { text-decoration: none; border: none; color: #596275; }
a.ContactLink:hover { text-decoration: none; border: none; }
.GitHub::before {
    font-family: "Font Awesome 5 Brands";
    content: "\f09b";
    margin: 0 10px;
}
.Twitter::before {
    font-family: "Font Awesome 5 Brands";
    content: "\f099";
    margin: 0 10px;
}
.Weixin::before {
    font-family: "Font Awesome 5 Brands";
    content: "\f1d7";
    margin: 0 10px;
}
.Bilibili::before {
    font-family: "Font Awesome 5 Brands";
    content: "\e3d9";
    margin: 0 10px;
}

.BlogrollContainer {
    display: flex;
    justify-content: center;
    align-items: baseline;
    flex-wrap: wrap;
    padding: 0 20px;
    margin: 0 auto;
    max-width: 600px;
}
.BlogrollLink {
    margin: 3px 6px;
}
#dianyou {
    font-size: 13px;
    margin: 5px 0;
    color: #596275;
}
#dianyou-at:before  { content: "@"; font-style: normal; }
#dianyou-dot:before { content: "."; font-style: normal; }
</style>

<div class="SectionBody" style="margin-top: 30px;">
    <img src="image/G3/qsl/QSL2023-A-1-RGB.jpg" style="width: 80%; max-width: 550px; border-radius: 5px;">
    <!--<table style="margin: 20px auto 10px auto;">
        <tr>
            <td><img src="image/G3/crac-logo/CRAC-1.png" style="width: 40px; padding-right: 10px;"></td>
            <td style="text-align: left; font-size: 12px; line-height: 18px;">
                <div><b>BD4SUR</b> 中国B类业余无线电台</div>
                <div style="color: #909299; font-size: smaller;">Chinese Class B Amateur Radio Station</div>
                <div>中国·江苏·南京</div>
                <div style="color: #909299; font-size: smaller;">Nanjing, Jiangsu, China</div>
                <div style="font-size: smaller;">CQ 24 / ITU 44 / OM91</div>
            </td>
            <td><img src="image/nanjing-location.png" style="width: 80px; padding-left: 10px;"></td>
        </tr>
    </table>-->
</div>

<div class="SectionBody">
    <div><a class="ContactLink Weixin" onclick="alert(`微信号“bd4sur”。`);"></a><a class="ContactLink GitHub" target="_blank" href="https://github.com/bd4sur/"></a><a class="ContactLink Bilibili" target="_blank" href="https://space.bilibili.com/7919331"></a></div>
    <div id="dianyou">欢迎联系 bd4sur<span id="dianyou-at"></span>qq<span id="dianyou-dot"></span>com</div>
</div>

<div class="SectionHeader">友情链接<div class="SectionHeaderComment">以交换时间先后为序</div></div>
<div class="SectionBody">
    <div class="BlogrollContainer">
        <div class="BlogrollLink"><a target="_blank" href="https://zephray.me/">ZephRay</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://256kb.cn/">野生喵喵</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://blog.ddlee.cc/">萧爽楼</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://ice1000.org/">Tesla Ice Zhang</a></div>
        <!-- <div class="BlogrollLink"><a target="_blank" href="https://chanshiyu.com/">蝉時雨</a></div> -->
        <div class="BlogrollLink"><a target="_blank" href="https://ssshooter.com/">Usubeni Fantasy</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://typ.moe/">Brethland</a></div><!-- http://yuki.systems/ -->
        <div class="BlogrollLink"><a target="_blank" href="https://ntzyz.io">ntzyz</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://wenzhao-xiang.top/">Winzzzzard</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://blog.kaciras.com/">Kaciras</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.bg5abl.com/">YuYan<span style="font-size: smaller;">(BG5ABL)</span></a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://zwiss.fun/">BD4UNW</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://noodlefighter.com/">Noodlefighter</a></div> <!-- 2023-08-27 -->
        <div class="BlogrollLink"><a target="_blank" href="https://www.yuanshen.dev/">YuanRetro<span style="font-size: smaller;">(BI4LPZ)</span></a></div> <!-- 2025-01-20 -->
    </div>
</div>

<div class="SectionHeader">电台大事记</div>
<div class="SectionBody">
    <ul class="bd4sur-timeline">
        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>2020.07.18</i>
                <p>购买PL-380作为起床闹钟，偶然在长波和短波波段听到一些奇妙的信号，开始了解业余无线电。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>2020.08.13</i>
                <p>凌晨，在楼顶用UV-5R收听电波。1点左右，看到一颗来自英仙座的流星。这段时间研究RTL-SDR和有源小环天线，逐渐熟悉HF、VHF和UHF频谱上的情况。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>2020.09.05</i>
                <p>通过A类操作能力验证考试。11月20日领取操作证、验机、提交设台申请。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>2020.09.16</i>
                <p>当天晚间，江北发生停电事故。守听江苏无协中继时，第一时间听到这个消息。这是入门业余无线电以来，首次见证业余无线电在应急通信场景下发挥作用。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-green"></div>
            <div class="bd4sur-timeline-item-content">
                <i>2020.12.07</i>
                <p>主管机关批准设立A类业余电台。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>2021.10.24</i>
                <p>通过B类操作能力验证考试。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-green"></div>
            <div class="bd4sur-timeline-item-content">
                <i>2021.11.13</i>
                <p>主管机关批准本台升级为B类业余电台。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>2022.07.08</i>
                <p>利用<a href="https://bd4sur.com/Aqua/" target="_blank">自制MP3编码器“Aqua”</a>、GNURadio平台和KC908U设备，首次实现点对点的、单工单向的、准实时的<a href="https://www.bilibili.com/video/BV1BW4y1U7ZD" target="_blank">无线音频传输</a>。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>2023.07.09</i>
                <p>实现点对点的、单工单向的、准实时的无线音视频传输（<a href="https://www.bilibili.com/video/BV1wj411Z71x" target="_blank">演示1</a>、<a href="https://www.bilibili.com/video/BV1mF411X7Qf" target="_blank">演示2</a>）。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-green"></div>
            <div class="bd4sur-timeline-item-content">
                <i>2024.05.02 ~ 05.03</i>
                <p>参加2024年<a href="http://www.crac.org.cn/News/Detail?ID=5df06649a98e4a818eb129fb704fe811" target="_blank">成都五五节活动</a>，发表技术演讲（<a href="./image/G3/2024成都五五节活动-业余无线电数字图传技术.pdf" target="_blank">讲稿</a>）。</p>
            </div>
        </li>
    </ul>
</div>

<style>
.ssimg {
    width: 100%;
    border-radius: 6px;
    box-shadow: 0px 0px 5px 0px #aaaabb88;
}
</style>

<div class="SectionHeader" id="changelog">博客版本记录</div>

<div class="SectionBody">
    <div><a style="font-size: 13px; letter-spacing: 0.5px; cursor: pointer;" class="SPA_TRIGGER" data-target="blog/Meta-博客建设记录">博客建设记录</a></div>
    <ul class="bd4sur-timeline" style="max-width: 600px;">
        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>试验版<time>2016.11.24</time></i>
                <p>简单的个人主页。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>第1版<time>2017.09.19</time></i>
                <p>使用第三方Markdown解析器。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>第2版<time>2018.02.04</time></i>
                <p>使用自主实现的Markdown解析器。</p>
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>第3版<time>2018.07.26</time></i>
                <p>设计上开始采用 Material Design 风格。</p>
                <!-- <p><b>V3.1</b>(2019.01.11) MD解析器与文章模板重构；Markdown与模板分离。</p>
                <p><b>V3.2</b>(2019.02.20) 目录和灵感页重构；使用TravisCI自动生成RSS。</p>
                <p><b>V3.3</b>(2019.03.15) 尝试重构为SPA单页应用。</p> -->
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-tail"></div>
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>第4版<time>2019.10.23</time></i>
                <p>博客改造为单页应用（SPA）。</p>
                <!-- <p><b>V4.1</b>(2020.02.14) 提取博客框架Iroha。</p>
                <p><b>V4.2</b>(2020.07) 增加列表时间线功能。</p> -->
            </div>
        </li>

        <li class="bd4sur-timeline-item">
            <div class="bd4sur-timeline-item-head bd4sur-timeline-item-head-blue"></div>
            <div class="bd4sur-timeline-item-content">
                <i>第5版<time>2021.02.01</time></i>
                <p>博客转型为电台网站，启用<code>bd4sur.com</code>域名。</p>
            </div>
        </li>

    </ul>
</div>

<div class="SectionHeader">QSL卡片</div>
<div class="SectionBody">凡未经本台操作员签名或者加盖呼号印章的卡片<br>均为无效卡片，不能作为通联依据</div>
<div class="SectionBody">
    <div><b>2023年第2版</b></div>
    <div>使用了暖暖十周年音乐会海报底图</div>
    <img src="image/G3/qsl/QSL2023-A-1-RGB.jpg" style="width: 30%; max-width: 350px; border-radius: 5px;">
    <img src="image/G3/qsl/QSL2023-b.png" style="width: 30%; max-width: 350px; border-radius: 5px;">
    <img src="image/G3/qsl/QSL2023-A-2-RGB.jpg" style="width: 30%; max-width: 350px; border-radius: 5px;">
</div>
<div class="SectionBody">
    <div><b>2021年第1版</b></div>
    <img src="image/G3/qsl/QSL-A.png" style="width: 45%; max-width: 270px;">
    <img src="image/G3/qsl/QSL-B.png" style="width: 45%; max-width: 270px;">
</div>

<div class="SectionHeader">权利声明</div>
<div class="ContentBlock">
    <div class="SectionBody">版权所有 &copy; 2016-2025 BD4SUR</div>
    <div class="SectionBody" style="font-size: smaller;">除另有声明外，本站原创内容均可在<br>①署电台呼号BD4SUR & ②非盈利目的 & ③无实质修改<br>的前提下使用。</div>
    <div class="SectionBody" style="font-size: smaller;">非原创内容均尽可能注明原作者或出处<br>且遵守合理使用原则。</div>
    <div class="SectionBody" style="font-size: smaller;"><b>使用开源组件</b><br>jQuery / jQuery.easing / fancybox / MathJax / Highlight.js / typograms</div>
</div>

<div class="SectionBody" style="color:#ff88aa; font-size: 18px; letter-spacing: 2px; margin: 30px 0; font-weight: bold;">VY 73!</div>
