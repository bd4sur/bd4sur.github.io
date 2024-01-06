function LoadCollections() {

    const music_collection_list = [
        {
            "title": "星の在り処|ja",
            "link": "https://music.163.com/#/song?id=559262",
            "tags": ["实体CD收藏"],
            "date": "2012-09",
            "artist": "う〜み|ja",
            "album": "",
            "info": "游戏「空之轨迹FC」主题歌"
        },
        {
            "title": "星の在り処 Guitar Ver.|ja",
            "link": "https://music.163.com/#/song?id=730600",
            "tags": ["实体CD收藏"],
            "date": "2012-09",
            "artist": "Falcom Sound Team jdk",
            "album": "空の軌跡FC&SC スーパーアレンジバージョン|ja",
            "info": ""
        },
        {
            "title": "纺歌",
            "link": "https://www.bilibili.com/video/BV15z4y1a7CS",
            "tags": [],
            "date": "2023-05 / 2015",
            "artist": "言和/猫村いろは 木变石 DATEKEN",
            "album": "",
            "info": ""
        },
        {
            "title": "絶対カラフル宣言|ja",
            "link": "https://music.163.com/#/song?id=573115357",
            "tags": [],
            "date": "2022-05",
            "artist": "佐藤利奈 等|ja",
            "album": "",
            "info": "动画『みなみけ おかえり』片尾歌"
        },
        {
            "title": "琉璃",
            "link": "https://music.163.com/#/song?id=1465162316",
            "tags": [],
            "date": "2021-08",
            "artist": "银临",
            "album": "琉璃",
            "info": ""
        },
        {
            "title": "ヴィヴァーチェ！|ja",
            "link": "https://i.y.qq.com/v8/playsong.html?songid=109072317",
            "tags": ["实体CD收藏"],
            "date": "2019",
            "artist": "黒沢ともよ 等|ja",
            "album": "ヴィヴァーチェ！|ja",
            "info": "动画「吹响！悠风号2」片尾歌"
        },
        {
            "title": "虹のカメリア|ja",
            "link": "https://music.163.com/#/song?id=836339",
            "tags": [],
            "date": "2019",
            "artist": "Sensitive Heart",
            "album": "Scarlet Destiny",
            "info": `<a target="_blank" href="https://thwiki.cc/%E4%B8%8A%E6%B5%B7%E7%BA%A2%E8%8C%B6%E9%A6%86_%EF%BD%9E_Chinese_Tea">上海紅茶館</a>同人作`
        },
        {
            "title": "桜花繚乱|ja",
            "link": "https://music.163.com/#/song?id=482636948",
            "tags": [],
            "date": "2019",
            "artist": "はちみつれもん|ja",
            "album": "花天月地|ja",
            "info": `<a target="_blank" href="https://thwiki.cc/%E6%A8%B1%E8%8A%B1%E4%B9%8B%E6%81%8B%E5%A1%9A_%EF%BD%9E_Flower_of_Japan">桜花之恋塚</a>同人作`
        },
        {
            "title": "東方萃夢想|ja",
            "link": "https://music.163.com/#/song?id=412785229",
            "tags": [],
            "date": "2019",
            "artist": "交響アクティブNEETs|ja",
            "album": "東方フィルハーモニー交響楽団 4 永&amp;萃|ja",
            "info": `<a target="_blank" href="https://thwiki.cc/%E4%B8%9C%E6%96%B9%E8%90%83%E6%A2%A6%E6%83%B3%EF%BC%88%E6%9B%B2%E7%9B%AE%EF%BC%89">東方萃夢想</a>同人作`
        },
        {
            "title": "君をのせて|ja",
            "link": "https://music.163.com/#/song?id=22824728",
            "tags": [],
            "date": "2019",
            "artist": "久木田 薫|ja",
            "album": "Ghibli The Classics",
            "info": ""
        },
        {
            "title": "remember",
            "link": "https://music.163.com/#/song?id=1311347592",
            "tags": [],
            "date": "2019",
            "artist": "Uru",
            "album": "Remember",
            "info": "剧场版动画「夏目友人帐：缘结空蝉」主题歌"
        },
        {
            "title": "春来发几枝",
            "link": "https://music.163.com/#/song?id=33682876",
            "tags": [],
            "date": "",
            "artist": "泠鸢yousa / Days幻梦年华乐团",
            "album": "三月雨",
            "info": ""
        },
        {
            "title": "春のかたみ|ja",
            "link": "https://music.163.com/#/song?id=574370",
            "tags": [],
            "date": "2019",
            "artist": "元ちとせ|ja",
            "album": "春のかたみ|ja",
            "info": "动画「怪~ayakashi~」主题歌"
        },
        {
            "title": "クラウドライダー|ja",
            "link": "https://music.163.com/#/song?id=26125980",
            "tags": ["实体CD收藏"],
            "date": "2016",
            "artist": "IA/田中隼人|ja",
            "album": "IA/02 -COLOR-",
            "info": ""
        },
        {
            "title": "京都の朝|ja",
            "link": "https://music.163.com/#/song?id=26201942",
            "tags": [],
            "date": "2017-03",
            "artist": "百石元|ja",
            "album": "K-ON! OST",
            "info": ""
        },
        {
            "title": "茜さす|ja",
            "link": "https://music.163.com/#/song?id=441116287",
            "tags": [],
            "date": "2016-11",
            "artist": "Aimer",
            "album": "茜さす/everlasting snow|ja",
            "info": "动画「夏目友人帳·伍」主题歌"
        },
        {
            "title": "黒翼は～と|ja",
            "link": "https://music.163.com/#/song?id=4934355",
            "tags": [],
            "date": "2016",
            "artist": "？",
            "album": "Tiny Dungeon - BLACK and WHITE OST",
            "info": ""
        },
        {
            "title": "ハナノイロ|ja",
            "link": "https://music.163.com/#/song?id=26386031",
            "tags": [],
            "date": "2016-05",
            "artist": "nano.RIPE",
            "album": "动画《花开伊吕波》OP1",
            "info": ""
        },
        {
            "title": "あさき、ゆめみし|ja",
            "link": "https://music.163.com/#/song?id=4956875",
            "tags": [],
            "date": "2015",
            "artist": "瀧沢一留|ja",
            "album": "ゲーム「あさき、ゆめみし」OST",
            "info": ""
        },
        {
            "title": "裁梦为魂",
            "link": "https://music.163.com/#/song?id=489092574",
            "tags": ["实体CD收藏"],
            "date": "2015",
            "artist": "银临",
            "album": "蚍蜉渡海",
            "info": ""
        },
        {
            "title": "棠梨煎雪",
            "link": "https://music.163.com/#/song?id=28188427",
            "tags": [],
            "date": "2015",
            "artist": "银临",
            "album": "腐草为萤",
            "info": ""
        },
        {
            "title": "God knows...",
            "link": "https://music.163.com/#/song?id=22826401",
            "tags": ["实体CD收藏"],
            "date": "2015",
            "artist": "平野綾|ja",
            "album": "Imaginary ENOZ featuring HARUHI|ja",
            "info": ""
        },
        {
            "title": "冒険でしょでしょ？|ja",
            "link": "",
            "tags": ["实体CD收藏"],
            "date": "2015",
            "artist": "平野綾|ja",
            "album": "冒険でしょでしょ？|ja",
            "info": ""
        },
        {
            "title": "YELL",
            "link": "https://music.163.com/#/song?id=718563",
            "tags": [],
            "date": "2015",
            "artist": "いきものがかり|ja",
            "album": "YELL/じょいふる|ja",
            "info": ""
        },
        {
            "title": "LIFE",
            "link": "",
            "tags": ["实体CD收藏"],
            "date": "2015",
            "artist": "YUI",
            "album": "LIFE",
            "info": ""
        },
        {
            "title": "七色シンフォニー|ja",
            "link": "https://music.163.com/#/song?id=30394711",
            "tags": [],
            "date": "2014",
            "artist": "コアラモード.|ja",
            "album": "七色シンフォニー|ja",
            "info": "动画「四月は君の嘘」主题歌"
        },
        {
            "title": "LEVEL5 -judgelight-",
            "link": "https://music.163.com/#/song?id=725619",
            "tags": [],
            "date": "2014",
            "artist": "fripSide",
            "album": "LEVEL5-judgelight-",
            "info": "动画「とある科学の超電磁砲」主题歌"
        },
        {
            "title": "太阳",
            "link": "https://music.163.com/#/song?id=209112",
            "tags": ["实体CD收藏"],
            "date": "2014-10",
            "artist": "陈绮贞",
            "album": "太阳",
            "info": ""
        },
        {
            "title": "幻の大地 セルペンティナ|ja",
            "link": "https://music.163.com/#/song?id=731799",
            "tags": ["实体CD收藏"],
            "date": "2014-06",
            "artist": "Falcom Sound Team jdk",
            "album": "Zwei!! OST",
            "info": ""
        },
        {
            "title": "素敵だね|ja",
            "link": "https://music.163.com/#/song?id=640372",
            "tags": ["实体CD收藏"],
            "date": "2013-05",
            "artist": "Rikki",
            "album": "素敵だね|ja",
            "info": ""
        },
        {
            "title": "夕顔|ja",
            "link": "https://music.163.com/#/song?id=624670",
            "tags": [],
            "date": "2012",
            "artist": "能登麻美子|ja",
            "album": "スクールランブル：塚本八雲|ja",
            "info": ""
        },
        {
            "title": "Time after time ～花舞う街で～|ja",
            "link": "",
            "tags": [],
            "date": "2012",
            "artist": "倉木麻衣|ja",
            "album": "Time after time ～花舞う街で～|ja",
            "info": ""
        },
        {
            "title": "如果有来生",
            "link": "https://music.163.com/#/song?id=293948",
            "tags": [],
            "date": "2010-04",
            "artist": "谭维维",
            "album": "谭某某",
            "info": "不才翻唱"
        },
        {
            "title": "欧若拉",
            "link": "",
            "tags": [],
            "date": "2010",
            "artist": "张韶涵",
            "album": "欧若拉",
            "info": ""
        },
        {
            "title": "菊花台",
            "link": "",
            "tags": [],
            "date": "2007",
            "artist": "周杰伦",
            "album": "依然范特西",
            "info": ""
        }
    ];

    let html = [];
    for(let i = 0; i < music_collection_list.length; i++) {
        let item = music_collection_list[i];
        let title = item.title.split("|");
        let titleHTML = `<div class="MusicTitle" lang="${title[1]}"><a href="${item.link}" target="_blank">${title[0]}</a></div>`;
        let tags = item.tags;
        let tagsHTML = tags.reduce((p, c, i) => {
            return p + `<span class="CollectionTag">${c}</span>`;
        }, "");
        let artist = item.artist.split("|");
        let artistHTML = `<div class="MusicArtist" lang="${artist[1]}">${artist[0]}</div>`;
        let album = item.album.split("|");
        let albumHTML = `<div class="MusicAlbum" lang="${album[1]}">${album[0]}</div>`;
        html.push(`
        <div class="MusicItem">
            <div class="MusicItemLine">
                ${titleHTML} <span class="MusicItemSlash"> / </span> ${artistHTML}
                <div class="MusicSubtitle">${tagsHTML}</div>
            </div>
            <div class="MusicItemLine">
                <div class="MusicDate">${item.date}</div>
                ${albumHTML}
                <div class="MusicInfo">${item.info}</div>
            </div>
        </div>`);
    }

    $("#collections_music_main").html(html.join(""));

}
