
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
    font-size: inherit;
    border-radius: 100px;
    padding: 2px 6px 2px 6px;
    margin: 3px;
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
        <div class="BlogrollLink"><a target="_blank" href="https://www.analog.com/cn/analog-dialogue.html">ADI《模拟对话》期刊</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.cryptomuseum.com/">CryptoMuseum</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://websdr.ewi.utwente.nl:8901/">PI4THT的SDR</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.mods.dk/">mods.dk</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.sigidwiki.com/">sigidwiki</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://swling.com/">swling.com</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.hfcc.org/schedule/">HFCC时刻表</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://shortwaveschedule.com/index.php?now">短波广播查询</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.short-wave.info/index.php">short-wave.info</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://dxcluster.ha8tks.hu/hamgeocoding/">网格计算</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://spotthestation.nasa.gov/tracking_map.cfm">ISS追踪</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.hamqsl.com/radio/">传播预测</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://www.dxinfocentre.com/tropo_eas.html">VU传播预测</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.nsmc.org.cn/NSMC/spaceweather/cn/sws/index.html">空间天气预报</a></div>
    </div>

    <div class="CatTitle">博 客 · Wiki</div>
    <div class="BlogrollContainer">
        <div class="BlogrollLink"><a target="_blank" href="https://www.nayuki.io/">Project Nayuki</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://www.matrix67.com/">Matrix67</a></div>
        <div class="BlogrollLink"><a target="_blank" href="http://nightchina.net/">夜空中国</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://0.30000000000000004.com/">浮点数</a></div>
        <div class="BlogrollLink"><a target="_blank" href="https://fwjmath.wordpress.com/">fwjmath</a></div>
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
        <div class="BlogrollLink"><a target="_blank" href="http://www.yinwang.org/">王垠</a></div>

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
.MusicCover {
    width: 100%;
    display: block;
    max-height: 100px;
    margin: 10px auto;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 2px 0 rgb(60 60 60 / 20%), 0 1px 3px 1px rgb(60 60 60 / 20%);
}
.MusicBox {
    max-width: 100px;
    display: inline-block;
    vertical-align: top;
    margin: 10px;
    border-radius: 10px;
}
.MusicTitle {
    color: #494f53;
    font-size: 12px;
    font-weight: bold;
    margin: 10px 0;
    text-align: center;
}
.MusicTitle a {
    text-decoration: none;
}
.MusicArtist {
    font-size: 10px;
    color: #494f53;
    margin: 3px 0;
    text-align: center;
}
.MusicSubtitle {
    font-size: 10px;
    color: #aaa;
    margin: 3px 0;
    text-align: center;
    transform: scale(0.9);
}
</style>


<div class="SectionHeader SectionToggle" id="collections_music" onclick="$(`#collections_music_main`).fadeToggle(200);">
    音乐<!--div class="SectionHeaderComment">Music</div-->
</div>

<div id="collections_music_main">

    <div style="text-align: center;">
        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/星の在り処.jpg" class="MusicCover" style="max-height: unset;">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=559262" target="_blank">星の在り処</a></div>
            <div class="MusicArtist" lang="ja">う〜み</div>
            <div class="MusicSubtitle"><span class="CollectionTag">实体CD收藏</span></div>
            <div class="MusicSubtitle">游戏「空之轨迹FC」主题歌</div>
            <div class="MusicSubtitle">2012-09</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/星の在り処-Guitar-Ver.jpg" class="MusicCover" style="max-height: unset;">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=730600" target="_blank">星の在り処 Guitar Ver.</a></div>
            <div class="MusicArtist">Falcom Sound Team jdk</div>
            <div class="MusicSubtitle"><span class="CollectionTag">实体CD收藏</span></div>
            <div class="MusicSubtitle" lang="ja">空の轨迹FC&SC スーパーアレンジバージョン</div>
            <!-- <div class="MusicSubtitle">2012-09</div> -->
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/yanhe-2022.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="https://www.bilibili.com/video/BV1We4y1R7m7" target="_blank">心音盒</a></div>
            <div class="MusicArtist">言和</div>
            <div class="MusicSubtitle">2022官方生日贺曲</div>
            <div class="MusicSubtitle">2022-07-11</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/絶対カラフル宣言.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=573115357" target="_blank">絶対カラフル宣言</a></div>
            <div class="MusicArtist" lang="ja">佐藤利奈 等</div>
            <div class="MusicSubtitle">动画『みなみけ おかえり』片尾歌</div>
            <div class="MusicSubtitle">2022-05</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/wo2022-snowflake.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="#" target="_blank">雪花</a></div>
            <div class="MusicArtist">北京爱乐合唱团</div>
            <div class="MusicSubtitle">北京冬奥会开幕式主题歌</div>
            <div class="MusicSubtitle">2022-02</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/琉璃.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="https://music.163.com/#/song?id=1465162316" target="_blank">琉璃</a></div>
            <div class="MusicArtist">银临</div>
            <!-- <div class="MusicSubtitle"><span class="CollectionTag">实体CD收藏</span></div> -->
            <div class="MusicSubtitle">琉璃</div>
            <div class="MusicSubtitle">2021-08</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/この場所で。.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://y.qq.com/n/yqq/album/003G9wKv0OXrsY.html" target="_blank">この場所で。</a></div>
            <div class="MusicArtist" lang="ja">佐々木恵梨 / 亜咲花</div>
            <div class="MusicSubtitle">动画「摇曳露营△第2季」插入歌</div>
            <div class="MusicSubtitle">2021-03</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/神代梦华谭.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="https://music.163.com/#/song?id=430026994" target="_blank">神代梦华谭</a></div>
            <div class="MusicArtist">泠鸢yousa</div>
            <div class="MusicSubtitle">游戏《神代梦华谭》主题歌</div>
            <div class="MusicSubtitle">2021-02</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/ヴィヴァーチェ！.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://i.y.qq.com/v8/playsong.html?songid=109072317" target="_blank">ヴィヴァーチェ！</a></div>
            <div class="MusicArtist" lang="ja">黒沢ともよ 等</div>
            <div class="MusicSubtitle"><span class="CollectionTag">实体CD收藏</span></div>
            <div class="MusicSubtitle" lang="ja">ヴィヴァーチェ！</div>
            <div class="MusicSubtitle">动画「吹响！悠风号2」片尾歌</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/虹のカメリア.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=836339" target="_blank">虹のカメリア</a></div>
            <div class="MusicArtist">Sensitive Heart</div>
            <div class="MusicSubtitle">Scarlet Destiny</div>
            <div class="MusicSubtitle"><a target="_blank" href="https://thwiki.cc/%E4%B8%8A%E6%B5%B7%E7%BA%A2%E8%8C%B6%E9%A6%86_%EF%BD%9E_Chinese_Tea">上海紅茶館</a>同人作</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/桜花繚乱.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=482636948" target="_blank">桜花繚乱</a></div>
            <div class="MusicArtist" lang="ja">はちみつれもん</div>
            <div class="MusicSubtitle" lang="ja">花天月地</div>
            <div class="MusicSubtitle"><a target="_blank" href="https://thwiki.cc/%E6%A8%B1%E8%8A%B1%E4%B9%8B%E6%81%8B%E5%A1%9A_%EF%BD%9E_Flower_of_Japan">桜花之恋塚</a>同人作</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/東方萃夢想.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=412785229" target="_blank">東方萃夢想</a></div>
            <div class="MusicArtist" lang="ja">交響アクティブNEETs</div>
            <div class="MusicSubtitle" lang="ja">東方フィルハーモニー交響楽団 4 永&amp;萃</div>
            <div class="MusicSubtitle"><a target="_blank" href="https://thwiki.cc/%E4%B8%9C%E6%96%B9%E8%90%83%E6%A2%A6%E6%83%B3%EF%BC%88%E6%9B%B2%E7%9B%AE%EF%BC%89">東方萃夢想</a>同人作</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/君をのせて.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=22824728" target="_blank">君をのせて</a></div>
            <div class="MusicArtist" lang="ja">久木田 薫</div>
            <div class="MusicSubtitle" lang="ja">Ghibli The Classics</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/remember.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=1311347592" target="_blank">remember</a></div>
            <div class="MusicArtist" lang="ja">Uru</div>
            <div class="MusicSubtitle" lang="ja">Remember</div>
            <div class="MusicSubtitle">剧场版动画「夏目友人帐：缘结空蝉」主题歌</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/春来发几枝.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="https://music.163.com/#/song?id=33682876" target="_blank">春来发几枝</a></div>
            <div class="MusicArtist">泠鸢yousa</div>
            <div class="MusicSubtitle">三月雨</div>
            <div class="MusicSubtitle">Days幻梦年华乐团创作</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/春のかたみ.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=574370" target="_blank">春のかたみ</a></div>
            <div class="MusicArtist" lang="ja">元ちとせ</div>
            <div class="MusicSubtitle" lang="ja">春のかたみ</div>
            <div class="MusicSubtitle">动画「怪~ayakashi~」主题歌</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/クラウドライダー.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=26125980" target="_blank">クラウドライダー</a></div>
            <div class="MusicArtist" lang="ja">IA/田中隼人</div>
            <div class="MusicSubtitle"><span class="CollectionTag">实体CD收藏</span></div>
            <div class="MusicSubtitle" lang="ja">IA/02 -COLOR-</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/京都の朝.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=26201942" target="_blank">京都の朝</a></div>
            <div class="MusicArtist" lang="ja">百石元</div>
            <div class="MusicSubtitle" lang="ja">K-ON! 原声音乐</div>
            <div class="MusicSubtitle">2017-03</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/茜さす.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=441116287" target="_blank">茜さす</a></div>
            <div class="MusicArtist" lang="ja">Aimer</div>
            <div class="MusicSubtitle" lang="ja">茜さす/everlasting snow</div>
            <div class="MusicSubtitle">动画「夏目友人帳·伍」主题歌<br>2016-11</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/黒翼は～と.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=4934355" target="_blank">黒翼は～と</a></div>
            <div class="MusicArtist">Rosebleu</div>
            <div class="MusicSubtitle">Tiny Dungeon - BLACK and WHITE OST</div>
            <div class="MusicSubtitle">信号处理实验素材</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/ハナノイロ.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=26386031" target="_blank">ハナノイロ</a></div>
            <div class="MusicArtist">nano.RIPE</div>
            <div class="MusicSubtitle">动画《花开伊吕波》OP1</div>
            <div class="MusicSubtitle">2016-05</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/あさき、ゆめみし.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=4956875" target="_blank">あさき、ゆめみし</a></div>
            <div class="MusicArtist" lang="ja">瀧沢一留</div>
            <div class="MusicSubtitle" lang="ja">ゲーム「あさき、ゆめみし」OST</div>
            <div class="MusicSubtitle">游戏「晨曦时梦见兮」主题歌</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/裁梦为魂.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="https://music.163.com/#/song?id=489092574" target="_blank">裁梦为魂</a></div>
            <div class="MusicArtist">银临</div>
            <div class="MusicSubtitle"><span class="CollectionTag">实体CD收藏</span></div>
            <div class="MusicSubtitle">蚍蜉渡海</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/棠梨煎雪.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="https://music.163.com/#/song?id=28188427" target="_blank">棠梨煎雪</a></div>
            <div class="MusicArtist">银临</div>
            <div class="MusicSubtitle">腐草为萤</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/God-knows.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=27876224" target="_blank">God knows...</a></div>
            <div class="MusicArtist" lang="ja">平野綾</div>
            <div class="MusicSubtitle"><span class="CollectionTag">实体CD收藏</span></div>
            <div class="MusicSubtitle" lang="ja">TVアニメ『涼宮ハルヒの憂鬱』 Imaginary ENOZ featuring HARUHI</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/YELL.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=718563" target="_blank">YELL</a></div>
            <div class="MusicArtist" lang="ja">いきものがかり</div>
            <div class="MusicSubtitle" lang="ja">YELL/じょいふる</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/LIFE.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="https://y.qq.com/n/yqq/song/0037bZFH0EbqAc.html" target="_blank">LIFE</a></div>
            <div class="MusicArtist">YUI</div>
            <div class="MusicSubtitle"><span class="CollectionTag">实体CD收藏</span></div>
            <div class="MusicSubtitle">LIFE</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/七色シンフォニー.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=30394711" target="_blank">七色シンフォニー</a></div>
            <div class="MusicArtist" lang="ja">コアラモード.</div>
            <div class="MusicSubtitle" lang="ja">七色シンフォニー</div>
            <div class="MusicSubtitle">动画「四月は君の嘘」主题歌</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/LEVEL5-judgelight.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=725619" target="_blank">LEVEL5 -judgelight-</a></div>
            <div class="MusicArtist" lang="ja">fripSide</div>
            <div class="MusicSubtitle" lang="ja">LEVEL5-judgelight-</div>
            <div class="MusicSubtitle">动画「とある科学の超電磁砲」主题歌</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/太阳.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="https://music.163.com/#/song?id=209112" target="_blank">太阳</a></div>
            <div class="MusicArtist">陈绮贞</div>
            <div class="MusicSubtitle"><span class="CollectionTag">实体CD收藏</span></div>
            <div class="MusicSubtitle">太阳</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/幻の大地-セルペンティナ.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=731799" target="_blank">幻の大地 セルペンティナ</a></div>
            <div class="MusicArtist" lang="ja">Falcom Sound Team jdk</div>
            <div class="MusicSubtitle"><span class="CollectionTag">实体CD收藏</span></div>
            <div class="MusicSubtitle" lang="ja">Zwei!! OST</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/素敵だね.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://music.163.com/#/song?id=640372" target="_blank">素敵だね</a></div>
            <div class="MusicArtist" lang="ja">Rikki</div>
            <div class="MusicSubtitle"><span class="CollectionTag">实体CD收藏</span></div>
            <div class="MusicSubtitle" lang="ja">素敵だね</div>
            <div class="MusicSubtitle">游戏 FINAL FANTASY X 主题歌</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/Time-after-time.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle" lang="ja"><a href="https://y.qq.com/n/yqq/song/000Ia3aP0cjrN8.html" target="_blank">Time after time ～花舞う街で～</a></div>
            <div class="MusicArtist" lang="ja">倉木麻衣</div>
            <div class="MusicSubtitle" lang="ja">Time after time ～花舞う街で～</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/如果有来生.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="https://music.163.com/#/song?id=293948" target="_blank">如果有来生</a></div>
            <div class="MusicArtist">谭维维</div>
            <div class="MusicSubtitle">谭某某</div>
            <div class="MusicSubtitle">不才翻唱</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/欧若拉.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="https://y.qq.com/n/yqq/song/001t1qJd0DaKOs.html" target="_blank">欧若拉</a></div>
            <div class="MusicArtist">张韶涵</div>
            <div class="MusicSubtitle">欧若拉</div>
        </div>

        <div class="MusicBox">
            <div class="MusicIntro">
                <img src="./image/B/cover/music/菊花台.jpg" class="MusicCover">
            </div>
            <div class="MusicTitle"><a href="https://y.qq.com/n/yqq/song/004RUiXu49ufy1.html" target="_blank">菊花台</a></div>
            <div class="MusicArtist">周杰伦</div>
            <div class="MusicSubtitle">依然范特西</div>
        </div>

    </div>

    <div>一等</div>

    <table>
        <tr>
            <th>标题</th>
            <th>艺术家</th>
            <th>专辑/出处</th>
            <th>时间</th>
        </tr>
        <tr>
            <td>1</td>
            <td>2</td>
            <td>3</td>
            <td>2023-04</td>
        </tr>
    <table>

</div>
