
<script>
function TurnToCollectionSection(elementId) {
    let targetTop = window.pageYOffset + $(`#${elementId}`)[0].getBoundingClientRect().top;
    $('html, body').animate({ scrollTop: targetTop-40 }, 200, 'easeOutExpo'); // 照顾顶部sticky导航栏的40px高度
}
</script>

<style>
.SectionToggle {
    cursor: pointer;
}

a {
    color: inherit;
    text-decoration: none;
    cursor: pointer;
}
a:hover {
    text-decoration: underline;
    color: #15d;
}

@media(min-width:651px) {
    .RigsTitleImage {
        display: block;
        margin: 10px auto;
        width: 50%;
    }
}
@media(max-width:650px) {
    .RigsTitleImage {
        display: block;
        margin: 10px auto;
        width: 100%;
    }
}

.RigsImage {
    display: block;
    margin: 10px auto;
    width: 100%;
    border: none;
    border-radius: 5px;
}
.CollectionTag {
    display: inline-block;
    background-color: #15e1;
    color: #15e;
    font-size: smaller;
    border-radius: 100px;
    padding: 2px 6px 2px 6px;
    margin: 0 3px;
}

.RigListContainer {
    text-align: center;
    overflow-x: auto;
}
.RigList {
    /* width: 100%; */
    border-collapse: collapse;
    border-spacing: 0;
    margin: 0 auto;
}

.RigName { min-width: 12em; text-align: left; font-weight: bold; padding: 5px 5px 5px 30px; }
.RigInfo { text-align: left; padding: 5px 30px 5px 5px; }

.RigList th, .RigList td {
    color: #666;
    font-size: 12px;
    line-height: 20px;
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    border-left: none;
    border-right: none;
}

.RigType {
    padding: 15px 0 !important;
    /* font-weight: bold !important; */
    font-size: 15px !important;
    letter-spacing: 2px;
    color: #15e !important;
    border-top: none !important;
}

.CollectionNav {
    text-align: center;
    margin: 30px auto;
    color: #ccc;
    background: #f7f8f9;
    width: fit-content;
    padding: 10px 20px;
    border-radius: 100px;
    font-size: 14px;
    line-height: 25px;
}
.CollectionSectionSwitch {
    margin: 5px;
    color: #333;
    font-weight: 600;
    cursor: pointer;
}
.CollectionSectionSwitch:hover {
    color: #15e;
}

.ComputerListToggle {
    margin: 20px 0;
    font-size: 16px;
    font-weight: bold;
    color: #234;
    cursor: pointer;
}
</style>

<div class="CollectionNav">
    <!-- <span class="CollectionSectionSwitch" onclick="TurnToCollectionSection(`collections_radio`);">无线电设备</span> / -->
    <span class="CollectionSectionSwitch" onclick="TurnToCollectionSection(`collections_link`);">网上邻居</span> /
    <span class="CollectionSectionSwitch" onclick="TurnToCollectionSection(`collections_anime`);">动画·影视</span> /
    <span class="CollectionSectionSwitch" onclick="TurnToCollectionSection(`collections_music`);">音乐</span>
</div>

<!--
<div class="SectionHeader SectionToggle" id="collections_radio" onclick="$(`#collections_radio_main`).fadeToggle(200);">
    无线电设备
</div>

<div id="collections_radio_main">

    <img src="image/G3/rigs/rigs.jpg" class="RigsTitleImage">

    <div class="RigListContainer">
        <table class="RigList">
            <tr><td class="RigType" colspan="2">业余收发信机</td></tr>
            <tr>
                <td class="RigName">Icom IC-705</td>
                <td class="RigInfo">HF/VHF/UHF便携电台，最大发射功率10W。<br>型号核准码：2020FP14257。</td>
            </tr>
            <tr>
                <td class="RigName">宝锋 UV-5R</td>
                <td class="RigInfo">VHF/UHF手持电台，标称发射功率5W。<br>型号核准码：2017FR3280。</td>
            </tr>
        </table>
    </div>
</div>
-->



<style>
.BlogrollContainer {
    display: flex;
    justify-content: center;
    align-items: baseline;
    flex-wrap: wrap;
    padding: 0 20px;
    margin: 20px auto;
}
.BlogrollLink {
    margin: 3px 10px;
    font-size: 13px;
    line-height: 25px;
    text-align: center;
    color: #394653;
}
.CatTitle {
    font-size: 14px;
    color: #15d;
    line-height: 1.5;
    text-align: center;
}
</style>

<div class="SectionHeader SectionToggle" id="collections_link" onclick="$(`#collections_link_main`).fadeToggle(200);">网上邻居</div>
    <div id="collections_link_main" style="text-align: center;">
    <!-- <img src="./image/B/nagato-yuki.jpg" style="width: 60%; border-radius: 10px; max-width: 480px; margin: 0 auto;"> -->
    <div class="CatTitle">无 线 电 通 信</div>
    <div class="BlogrollContainer">
        <div class="BlogrollLink"><a target="_blank" href="http://www.cncalc.org/">cnCalc计算器论坛</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.by4wng.com/">BY4WNG</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://7400.me/">EE ARCHEOLOGY</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.cnvintage.org/">cnVintage</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.datamath.org/">Datamath Calculator Museum</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.analog.com/cn/analog-dialogue.html">ADI《模拟对话》期刊</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.cryptomuseum.com/">CryptoMuseum</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://websdr.ewi.utwente.nl:8901/">PI4THT的SDR</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.mods.dk/">mods.dk</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.sigidwiki.com/">sigidwiki</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://swling.com/">swling.com</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.fenu-radio.ch/">Fenu-Radio</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.hfcc.org/schedule/">HFCC时刻表</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://shortwaveschedule.com/index.php?now">短波广播查询</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.short-wave.info/index.php">short-wave.info</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://dxcluster.ha8tks.hu/hamgeocoding/">网格计算</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://spotthestation.nasa.gov/tracking_map.cfm">ISS追踪</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.hamqsl.com/radio/">传播预测</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.dxinfocentre.com/tropo_eas.html">VU传播预测</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.nsmc.org.cn/NSMC/spaceweather/cn/sws/index.html">空间天气预报</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://gnss.stern.ac.cn/index.asp">中国GNSS电离层观测网</a></div>
    </div>

    <div class="CatTitle">博 客 · Wiki</div>
    <div class="BlogrollContainer">
        <div class="BlogrollLink"><a target="_blank" href="https://kexue.fm/">科学空间</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.nayuki.io/">Project Nayuki</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.matrix67.com/">Matrix67</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.bananaspace.org/">香蕉空间</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://nightchina.net/">夜空中国</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://0.30000000000000004.com/">浮点数</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://fwjmath.wordpress.com/">方弦</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.changhai.org/">卢昌海</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://bellard.org/">Fabrice Bellard</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://madebyevan.com/">Evan Wallace</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://norvig.com/">Peter Norvig</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://matt.might.net/">Matt Might</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.codingnow.com/">云风</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://techsingular.net/">技术奇异点</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.dwenzhao.cn/">赵工个人空间</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.satcomengr.com/">卫星通信吴波洋</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.staroceans.org/">staroceans</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://wiki.jackslab.org/">Jack's Lab(BH1RBH)</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://kcores.com/reading">氪金核心</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://retronn.de/">Hardware Gallery</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://bideyuanli.com/">比的原理</a></div>

        <div class="BlogrollLink"><a target="_blank" href="https://thwiki.cc/">THBwiki</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://wuli.wiki/">小时物理百科</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.shicuojue.com/">视错觉</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.wikipathways.org/">WikiPathways</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://rosettacode.org/">Rosetta Code</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://okmij.org/ftp/">okmij.org</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://sheet.stdioa.com/">StdioA乐谱分享</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://sicp.readthedocs.io/en/latest/">SICP解题集</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://htq.minpaku.ac.jp/databases/rGyalrong/">嘉绒语数据库</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://marxists.anu.edu.au/chinese/">中文马克思主义文库</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.kegg.jp/">KEGG</a></div>
    </div>

    <div class="CatTitle">地 学 · 航 空 航 天</div>
    <div class="BlogrollContainer">
        <div class="BlogrollLink"><a target="_blank" href="http://www.nmc.cn/publish/radar/huadong.html">NMC雷达</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.nmc.cn/publish/observations/lighting.html">NMC地闪实况</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://typhoon.slt.zj.gov.cn/wap.htm">台风路径</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://himawari8.nict.go.jp/">向日葵8号云图</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://earth.nullschool.net/">气象可视化</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://planets.cug.edu.cn/lunaserv.html">中国地质大学行星地图</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.braeunig.us/space/index.htm">火箭和空间技术</a></div>
    </div>
</div>

<style>
.AnimeFlexContainer {
    display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline;
    margin: 10px auto;
}
.AnimeFlex {
    width: 120px;
    margin: 5px;
    /* padding: 10px; */
    text-align: center;
    /* background: linear-gradient(0deg, #eef0f2, #fafafa, #eef0f2); */
    border-radius: 4px;
    box-shadow: 0px 0px 5px 0px #aaaabb88;
    overflow: hidden;
}
.BangumiCover {
    width: 100%;
    display: block;
    max-height: 170px;
    margin: auto;
}
.BangumiTitle { padding: 5px 5px 0 5px; color: #112; font-size: 11px; }
.BangumiSubtitle { padding: 0; font-size: 10px; font-weight: normal; color: #ccc; line-height: 1.6; transform: scale(0.86); }
.BangumiDate { padding: 0 5px 5px 5px; font-size: 10px; color: #aaa; margin: 0 auto; }

</style>


<div class="SectionHeader SectionToggle" id="collections_anime" onclick="$(`#collections_anime_main`).fadeToggle(200);">
    动画·影视
</div>

<div class="AnimeFlexContainer" id="collections_anime_main">

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/涼宮ハルヒの憂鬱.jpg">
        <div class="BangumiTitle" lang="ja">涼宮ハルヒの憂鬱</div>
        <div class="BangumiSubtitle">Suzumiya Haruhi no Yūutsu</div>
        <div class="BangumiDate">2015.4</div>
    </div>

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/四月は君の嘘.jpg">
        <div class="BangumiTitle" lang="ja">四月は君の嘘</div>
        <div class="BangumiSubtitle">Shigatsu wa Kimi no Uso</div>
        <div class="BangumiDate">2014.12</div>
    </div>

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/夏目友人帳.jpg">
        <div class="BangumiTitle" lang="ja">夏目友人帳</div>
        <div class="BangumiSubtitle">Natsume Yūjinchō</div>
        <div class="BangumiDate">2015.2</div>
    </div>

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/花咲くいろは.jpg">
        <div class="BangumiTitle" lang="ja">花咲くいろは</div>
        <div class="BangumiSubtitle">Hanasaku Iroha</div>
        <div class="BangumiDate">2016.7</div>
    </div>

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/ノラガミ.jpg">
        <div class="BangumiTitle" lang="ja">ノラガミ</div>
        <div class="BangumiSubtitle">Noragami</div>
        <div class="BangumiDate">2016.10</div>
    </div>

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/氷菓.jpg">
        <div class="BangumiTitle" lang="ja">氷菓</div>
        <div class="BangumiSubtitle">Hyōka</div>
        <div class="BangumiDate">2017.4</div>
    </div>

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/小林さんちのメイドラゴン.jpg">
        <div class="BangumiTitle" lang="ja">小林さんちのメイドラゴン</div>
        <div class="BangumiSubtitle">Kobayashi Sanchi no Maidragon</div>
        <div class="BangumiDate">2017.4/2021.7</div>
    </div>

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/少女終末旅行.jpg">
        <div class="BangumiTitle" lang="ja">少女終末旅行</div>
        <div class="BangumiSubtitle">Shōjō Shūmatsu Ryōkō</div>
        <div class="BangumiDate">2018.12</div>
    </div>

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/響け！ユーフォニアム.jpg">
        <div class="BangumiTitle" lang="ja">響け！ユーフォニアム</div>
        <div class="BangumiSubtitle">Hibike! Euphonium</div>
        <div class="BangumiDate">2019.8~2020.6</div>
    </div>

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/みなみけ.jpg">
        <div class="BangumiTitle" lang="ja">みなみけ</div>
        <div class="BangumiSubtitle">Minami-ke</div>
        <div class="BangumiDate">2019.12.15~2020.1.3</div>
    </div>

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/日常.jpg">
        <div class="BangumiTitle" lang="ja">日常</div>
        <div class="BangumiSubtitle">Nichijō</div>
        <div class="BangumiDate">2020.1.5~2020.1.12</div>
    </div>

    <div class="AnimeFlex">
        <img class="BangumiCover" src="./image/B/cover/bangumi/ゆるキャン△.jpg">
        <div class="BangumiTitle" lang="ja">ゆるキャン△</div>
        <div class="BangumiSubtitle">Yuru Camp</div>
        <div class="BangumiDate">2020.4/2021.1</div>
    </div>

</div>


<style>
@media(min-width:651px){
    .MusicItem {
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: 13px;
        padding: 5px 16px;
        border-bottom: 1px solid #ebedf1;
    }
}
@media(max-width:650px){
    .MusicItem {
        display: flex;
        align-items: flex-start;
        flex-direction: column;
        font-size: 12px;
        border-bottom: 1px solid #ebedf1;
        padding: 3px 5px;
    }
}

.MusicItemLine {
    display: flex;
    align-items: center;
    margin: 3px 0;
}
.MusicItemSlash {
    color: #c5c6c7;
    margin: 0px 6px;
}
.MusicTitle {
    color: #2a2d34;
    font-weight: bold;
}
.MusicTitle a {
    text-decoration: none;
}
.MusicArtist {
    font-size: 12px;
    color: #2a2d34;
    margin-right: 10px;
}
.MusicDate {
    font-size: 11px;
    color: #c8cdd7;
    margin-right: 10px;
}
.MusicAlbum {
    font-size: 11px;
    color: #656970;
    margin-right: 10px;
}
.MusicInfo {
    font-size: 11px;
    color: #656970;
}
</style>

<div class="SectionHeader SectionToggle" id="collections_music" onclick="$(`#collections_music_main`).fadeToggle(200);">
    音乐<!--div class="SectionHeaderComment">Music</div-->
</div>

<div id="collections_music_main"></div>

</div>
