/*
 * 择吉计算 - 基于《钦定协纪辨方书》的吉凶宜忌算法
 * 
 * 核心算法参考 https://github.com/OPN48/cnlunar
 * 包含：宜忌等第表、吉神凶神查找表、十二建除、二十八宿、黄黑道十二神等
 * 
 * (c) BD4SUR 2026
 */

const Almanac = (function() {

    // ==================== 常量定义 ====================

    // 天干
    const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    
    // 地支
    const DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

    // 六十甲子
    const SIXTY_JIAZI = [
        "甲子", "乙丑", "丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉",
        "甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未",
        "甲申", "乙酉", "丙戌", "丁亥", "戊子", "己丑", "庚寅", "辛卯", "壬辰", "癸巳",
        "甲午", "乙未", "丙申", "丁酉", "戊戌", "己亥", "庚子", "辛丑", "壬寅", "癸卯",
        "甲辰", "乙巳", "丙午", "丁未", "戊申", "己酉", "庚戌", "辛亥", "壬子", "癸丑",
        "甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥"
    ];

    // 十二建除
    const TWELVE_JIANCHU = ["建", "除", "满", "平", "定", "执", "破", "危", "成", "收", "开", "闭"];

    // 十二建除与月份地支的对应宜忌（来自《钦定协纪辨方书》卷十一）
    // officerThings[建除名] = [宜事数组, 忌事数组]
    const OFFICER_THINGS = {
        "建": [
            ["施恩", "招贤", "举正直", "上官", "临政", "出行", "训 horses", "教牛马"],
            ["开仓", "出货财"]
        ],
        "除": [
            ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", 
             "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "解除", "沐浴", "整容", 
             "剃头", "整手足甲", "求医疗病", "裁制", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", 
             "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣", "修饰垣墙", 
             "平治道涂", "破屋坏垣", "伐木", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"],
            ["畋猎", "取鱼"]
        ],
        "满": [
            ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会"],
            ["赴任", "上官", "结婚姻", "纳采", "嫁娶", "进人口", "求医疗病", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", 
             "修仓库", "开市", "立券交易", "纳财", "开仓", "经络", "酝酿", "破屋坏垣", "伐木", "栽种", "牧养", "纳畜", "安葬", "启攒", 
             "移徙"]
        ],
        "平": [
            ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", 
             "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "解除", "求医疗病", "裁制", 
             "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", 
             "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "伐木", "栽种", "牧养", "纳畜", "破土", 
             "安葬", "启攒"],
            ["畋猎", "取鱼"]
        ],
        "定": [
            ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", 
             "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "解除", "沐浴", "整容", 
             "剃头", "整手足甲", "裁制", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", 
             "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "伐木", 
             "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"],
            ["畋猎", "取鱼", "词讼"]
        ],
        "执": [
            ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", 
             "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "解除", "沐浴", "整容", "剃头", "整手足甲", 
             "求医疗病", "裁制", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "立券交易", 
             "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "伐木", "栽种", 
             "牧养", "纳畜", "破土", "安葬", "启攒"],
            ["畋猎", "取鱼", "出行", "搬移"]
        ],
        "破": [
            ["破屋坏垣", "沐浴", "整容", "剃头", "整手足甲", "求医疗病"],
            ["祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "宣政事", "布政事", "庆赐", "宴会", "冠带", "出行", 
             "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除", "求医疗病", "裁制", 
             "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", 
             "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣", "修饰垣墙", "平治道涂", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]
        ],
        "危": [
            ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", 
             "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "解除", "沐浴", "整容", "剃头", 
             "整手足甲", "求医疗病", "裁制", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", 
             "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "伐木", 
             "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"],
            ["畋猎", "取鱼", "出行"]
        ],
        "成": [
            ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", 
             "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除", "沐浴", "整容", 
             "剃头", "整手足甲", "求医疗病", "裁制", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", 
             "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "伐木", 
             "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"],
            ["词讼"]
        ],
        "收": [
            ["祭祀", "祈福", "求嗣", "上册", "上表章", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "安抚边境", 
             "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "解除", "沐浴", "整容", "剃头", "整手足甲", "求医疗病", "裁制", "修仓库", 
             "经络", "酝酿", "纳财", "开仓", "塞穴", "补垣", "修饰垣墙", "牧养", "纳畜", "安葬", "启攒"],
            ["出行", "冠带", "安床", "修置产室", "开渠", "穿井", "安碓硙", "破屋坏垣", "伐木", "栽种", "破土"]
        ],
        "开": [
            ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", 
             "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "解除", "沐浴", "整容", "剃头", 
             "整手足甲", "求医疗病", "裁制", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", 
             "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "伐木", 
             "栽种", "牧养", "纳畜", "启攒"],
            ["破土", "安葬", "捕捉", "畋猎", "取鱼"]
        ],
        "闭": [
            ["祭祀", "祈福", "求嗣", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "庆赐", "宴会", "筑堤防", "塞穴", "补垣", "修饰垣墙", "平治道涂"],
            ["上册", "上表章", "颁诏", "宣政事", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", 
             "搬移", "解除", "求医疗病", "营建", "修宫室", "缮城郭", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", 
             "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "破屋坏垣", "伐木", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]
        ]
    };

    // 二十八宿
    const TWENTY_EIGHT_XIU = [
        "角", "亢", "氐", "房", "心", "尾", "箕",           // 东方青龙
        "斗", "牛", "女", "虚", "危", "室", "壁",           // 北方玄武
        "奎", "娄", "胃", "昴", "毕", "觜", "参",           // 西方白虎
        "井", "鬼", "柳", "星", "张", "翼", "轸"            // 南方朱雀
    ];

    // 十二神（黄黑道十二神）
    const TWELVE_SHEN = ["青龙", "明堂", "天刑", "朱雀", "金匮", "天德", "白虎", "玉堂", "天牢", "玄武", "司命", "勾陈"];

    // 季节
    const SEASONS = ["春", "夏", "秋", "冬"];
    
    // 孟仲季月类型
    const MONTH_TYPE = ["孟", "仲", "季"];  // 0=孟月, 1=仲月, 2=季月

    // ==================== 辅助函数 ====================

    function getGanIndex(gan) {
        return TIAN_GAN.indexOf(gan);
    }

    function getZhiIndex(zhi) {
        return DI_ZHI.indexOf(zhi);
    }

    function getGanzhiIndex(ganzhi) {
        return SIXTY_JIAZI.indexOf(ganzhi);
    }

    // 计算日期差（天数）
    function getDaysDiff(year1, month1, day1, year2, month2, day2) {
        const d1 = new Date(year1, month1 - 1, day1);
        const d2 = new Date(year2, month2 - 1, day2);
        return Math.floor((d2 - d1) / (24 * 60 * 60 * 1000));
    }

    // 数组去重
    function uniqueArray(arr) {
        return [...new Set(arr)];
    }

    // 数组添加元素（去重）
    function addToArray(arr, items) {
        return uniqueArray([...arr, ...items]);
    }

    // 数组移除元素
    function removeFromArray(arr, items) {
        return arr.filter(item => !items.includes(item));
    }

    // 检查字符串是否包含子串
    function containsAny(str, substrings) {
        return substrings.some(sub => str.includes(sub));
    }

    // ==================== 核心计算函数 ====================

    /**
     * 计算十二建除
     * 正月建寅，二月建卯，以此类推
     */
    function calculateJianchu(monthZhi, dayZhi) {
        const monthIdx = getZhiIndex(monthZhi);
        const dayIdx = getZhiIndex(dayZhi);
        let offset = dayIdx - monthIdx;
        if (offset < 0) offset += 12;
        return TWELVE_JIANCHU[offset];
    }

    /**
     * 计算二十八宿
     * 移植自 cal.py: the28StarsList[apart.days % 28]
     * 
     * 注：二十八宿的值日计算存在多种流派，cal.py使用2019-01-17为基准日
     * 如果计算结果与实际农历查询不符，可能需要调整基准日或列表顺序
     */
    function calculateXiu(year, month, day) {
        // 使用与 cal.py 相同的基准日：2019-01-17
        const baseDate = new Date(2019, 0, 17);
        const currentDate = new Date(year, month - 1, day);
        const diffDays = Math.floor((currentDate - baseDate) / (24 * 60 * 60 * 1000));
        
        // 确保正数取模
        const idx = ((diffDays % 28) + 28) % 28;
        
        return TWENTY_EIGHT_XIU[idx];
    }

    /**
     * 计算十二神（黄黑道十二神）
     * 青龙定位口诀：子午寻申位，丑未戌上亲；寅申居子中，卯酉起于寅；辰戌龙位上，巳亥午中寻
     */
    function calculateRiShen(monthZhi, dayZhi) {
        const monthIdx = getZhiIndex(monthZhi);
        const dayIdx = getZhiIndex(dayZhi);
        // 青龙起始位置对应表：[子丑寅卯辰巳午未申酉戌亥] -> [申戌子寅辰午申戌子寅辰午]
        const startPositions = [8, 10, 0, 2, 4, 6, 8, 10, 0, 2, 4, 6];
        const startIdx = startPositions[monthIdx];
        let offset = dayIdx - startIdx;
        if (offset < 0) offset += 12;
        return TWELVE_SHEN[offset];
    }

    /**
     * 获取月份类型（孟、仲、季）
     * 根据月支判断：寅巳申亥为孟月，卯午酉子为仲月，辰未戌丑为季月
     */
    function getMonthType(monthZhi) {
        const monthIdx = getZhiIndex(monthZhi);
        // 孟月：寅(2)、巳(5)、申(8)、亥(11)
        // 仲月：卯(3)、午(6)、酉(9)、子(0)
        // 季月：辰(4)、未(7)、戌(10)、丑(1)
        const types = [1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0];  // 子丑寅卯辰巳午未申酉戌亥
        return types[monthIdx];
    }

    /**
     * 获取季节（0=春, 1=夏, 2=秋, 3=冬）
     * 正月建寅为春，四月建巳为夏，七月建申为秋，十月建亥为冬
     */
    function getSeason(monthZhi) {
        const monthIdx = getZhiIndex(monthZhi);
        // 春：寅(2)、卯(3)、辰(4)
        // 夏：巳(5)、午(6)、未(7)
        // 秋：申(8)、酉(9)、戌(10)
        // 冬：亥(11)、子(0)、丑(1)
        const seasons = [3, 3, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3];  // 子丑寅卯辰巳午未申酉戌亥
        return seasons[monthIdx];
    }

    // ==================== 吉神凶神查找表 ====================

    /**
     * 获取吉神凶神及宜忌事项
     * 完整移植自 cal.py 的 get_AngelDemon 方法
     */
    function getAngelDemon(lunarDate, solarYear, solarMonth, solarDay, nextSolarNum, phaseOfMoon) {
        const yearGan = lunarDate.year_ganzhi[0];
        const yearZhi = lunarDate.year_ganzhi[1];
        const monthGan = lunarDate.month_ganzhi[0];
        const monthZhi = lunarDate.month_ganzhi[1];
        const dayGan = lunarDate.day_ganzhi[0];
        const dayZhi = lunarDate.day_ganzhi[1];
        const ganzhi = dayGan + dayZhi;
        
        const yhn = getGanIndex(yearGan);  // 年干序号
        const yen = getZhiIndex(yearZhi);  // 年支序号
        const mhn = getGanIndex(monthGan);  // 月干序号
        const men = getZhiIndex(monthZhi);  // 月支序号（核心参数）
        const dhn = getGanIndex(dayGan);    // 日干序号
        const den = getZhiIndex(dayZhi);    // 日支序号
        const dhen = getGanzhiIndex(ganzhi); // 日干支序号
        
        // 季节数 (0=春, 1=夏, 2=秋, 3=冬)
        const sn = getSeason(monthZhi);
        
        // 孟仲季月类型
        const monthType = getMonthType(monthZhi);
        
        // 农历月日
        const lmn = lunarDate.month;
        const ldn = lunarDate.day;
        
        let goodGodName = [];
        let badGodName = [];
        let goodThing = [];
        let badThing = [];

        // ===== 基础十二建除宜忌 =====
        const jianchu = calculateJianchu(monthZhi, dayZhi);
        goodThing = [...OFFICER_THINGS[jianchu][0]];
        badThing = [...OFFICER_THINGS[jianchu][1]];

        // ===== 日干支特定宜忌 =====
        // 日干支特定宜忌（来自《钦定协纪辨方书》卷十一拆解）
        const day8CharThing = {
            "甲": [["宴集"], ["开仓"]],
            "乙": [[], ["栽种"]],
            "丙": [["修造"], []],
            "丁": [[], []],
            "戊": [["修造"], []],
            "己": [["修造"], []],
            "庚": [[], []],
            "辛": [["修造"], []],
            "壬": [["修造"], ["开渠"]],
            "癸": [[], []],
            "子": [["宴集"], []],
            "丑": [["修造"], []],
            "寅": [["宴集", "祈祷"], []],
            "卯": [[], ["穿井", "栽种"]],
            "辰": [["宴集"], []],
            "巳": [[], ["出行"]],
            "午": [["宴集"], []],
            "未": [["修造"], []],
            "申": [[], []],
            "酉": [[], ["宴集", "栽种"]],
            "戌": [["宴集"], []],
            "亥": [[], ["嫁娶"]]
        };
        
        // 应用日干支特定宜忌
        if (day8CharThing[dayGan]) {
            goodThing = addToArray(goodThing, day8CharThing[dayGan][0]);
            badThing = addToArray(badThing, day8CharThing[dayGan][1]);
        }
        if (day8CharThing[dayZhi]) {
            goodThing = addToArray(goodThing, day8CharThing[dayZhi][0]);
            badThing = addToArray(badThing, day8CharThing[dayZhi][1]);
        }

        // ===== 卷十一拆解规则 =====
        // 雨水后立夏前执日、危日、收日 宜 取鱼
        if (nextSolarNum >= 4 && nextSolarNum < 9 && ["执", "危", "收"].includes(jianchu)) {
            goodThing = addToArray(goodThing, ["取鱼"]);
        }
        // 霜降后立春前执日、危日、收日 宜 畋猎
        if ((nextSolarNum >= 20 && nextSolarNum < 24) || (nextSolarNum >= 0 && nextSolarNum < 3)) {
            if (["执", "危", "收"].includes(jianchu)) {
                goodThing = addToArray(goodThing, ["畋猎"]);
            }
        }
        // 立冬后立春前危日 午日 申日 宜 伐木
        if (((nextSolarNum >= 21 && nextSolarNum < 24) || (nextSolarNum >= 0 && nextSolarNum < 3)) && 
            (jianchu === "危" || ["午", "申"].includes(dayZhi))) {
            goodThing = addToArray(goodThing, ["伐木"]);
        }
        // 每月一日 六日 十五 十九日 二十一日 二十三日 忌 整手足甲
        if ([1, 6, 15, 19, 21, 23].includes(ldn)) {
            badThing = addToArray(badThing, ["整手足甲"]);
        }
        // 每月十二日 十五日 忌 整容剃头
        if ([12, 15].includes(ldn)) {
            badThing = addToArray(badThing, ["整容", "剃头"]);
        }
        // 每月十五日 朔弦望月 忌 求医疗病
        if (ldn === 15 || phaseOfMoon !== "") {
            badThing = addToArray(badThing, ["求医疗病"]);
        }

        // ===== 吉神判断（完整移植自 cal.py） =====
        
        // 岁德：甲庚丙壬戊（年干）
        if ("甲庚丙壬戊甲庚丙壬戊"[yhn] === dayGan) {
            goodGodName.push("岁德");
            goodThing = addToArray(goodThing, ["修造"]);
        }
        
        // 岁德合：己乙辛丁癸（年干）
        if ("己乙辛丁癸己乙辛丁癸"[yhn] === dayGan) {
            goodGodName.push("岁德合");
            goodThing = addToArray(goodThing, ["修造"]);
        }
        
        // 月德：壬庚丙甲壬庚丙甲壬庚丙甲（月支）
        if ("壬庚丙甲壬庚丙甲壬庚丙甲"[men] === dayGan) {
            goodGodName.push("月德");
            goodThing = addToArray(goodThing, ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", 
                "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行", "安抚边境", "选将", "出师", "上官", 
                "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭", 
                "修造", "竖柱上梁", "修仓库", "栽种", "牧养", "纳畜", "安葬"]);
            badThing = addToArray(badThing, ["畋猎", "取鱼"]);
        }
        
        // 月德合：丁乙辛己丁乙辛己丁乙辛己（月支）
        if ("丁乙辛己丁乙辛己丁乙辛己"[men] === dayGan) {
            goodGodName.push("月德合");
            goodThing = addToArray(goodThing, ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", 
                "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行", "安抚边境", "选将", "出师", "上官", 
                "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭", 
                "修造", "竖柱上梁", "修仓库", "栽种", "牧养", "纳畜", "安葬"]);
            badThing = addToArray(badThing, ["畋猎", "取鱼"]);
        }
        
        // 天德、天德合（复杂判断，需考虑孟仲季月）
        // 正丁三壬四辛同，五亥六甲七癸逢；八寅九丙十居乙，子巳丑庚卯申中
        const tianDeTable = ["巳", "庚", "丁", "申", "壬", "辛", "亥", "甲", "癸", "寅", "丙", "乙"];
        const tianDeHeTable = ["", "乙", "壬", "", "丁", "丙", "", "己", "戊", "", "辛", "庚"];
        
        // 仲月（1）：天德看日干，天德合看日干
        // 孟月季月（0,2）：天德看日支，天德合看日支
        const tianDeDay = monthType === 1 ? dayGan : dayZhi;
        if (tianDeTable[men] === tianDeDay) {
            goodGodName.push("天德");
            goodThing = addToArray(goodThing, ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直",
                "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行", "安抚边境", "选将", "出师", "上官",
                "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭",
                "修造", "竖柱上梁", "修仓库", "栽种", "牧养", "纳畜", "安葬"]);
            badThing = addToArray(badThing, ["畋猎", "取鱼"]);
        }
        if (tianDeHeTable[men] && tianDeHeTable[men] === dayGan) {
            goodGodName.push("天德合");
            goodThing = addToArray(goodThing, ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直",
                "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行", "安抚边境", "选将", "出师", "上官",
                "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭",
                "修造", "竖柱上梁", "修仓库", "栽种", "牧养", "纳畜", "安葬"]);
            badThing = addToArray(badThing, ["畋猎", "取鱼"]);
        }
        
        // 凤凰日、麒麟日（根据季节和二十八宿）
        const xiu = calculateXiu(solarYear, solarMonth, solarDay);
        const phoenixXiu = ["危", "昴", "胃", "毕"];  // 春夏秋冬
        const kylinXiu = ["井", "尾", "牛", "壁"];   // 春夏秋冬
        if (phoenixXiu[sn] === xiu) {
            goodGodName.push("凤凰日");
            goodThing = addToArray(goodThing, ["嫁娶"]);
        }
        if (kylinXiu[sn] === xiu) {
            goodGodName.push("麒麟日");
            goodThing = addToArray(goodThing, ["嫁娶"]);
        }
        
        // 天赦：甲子(0) 戊寅(14) 甲午(30) 戊申(44) 对应特定月份
        const tiansheList = ["甲子", "甲子", "戊寅", "戊寅", "戊寅", "甲午", "甲午", "甲午", "戊申", "戊申", "戊申", "甲子"];
        if (tiansheList[men] === ganzhi) {
            goodGodName.push("天赦");
            goodThing = addToArray(goodThing, ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直",
                "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行", "安抚边境", "选将", "出师", "上官",
                "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭",
                "修造", "竖柱上梁", "修仓库", "栽种", "牧养", "纳畜", "安葬"]);
            badThing = addToArray(badThing, ["畋猎", "取鱼"]);
        }
        
        // 天愿：特定干支对应月份
        const tianyuanList = ["甲子", "癸未", "甲午", "甲戌", "乙酉", "丙子", "丁丑", "戊午", "甲寅", "丙辰", "辛卯", "戊辰"];
        if (tianyuanList[men] === ganzhi) {
            goodGodName.push("天愿");
            goodThing = addToArray(goodThing, ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直",
                "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行", "安抚边境", "选将", "上官", "临政",
                "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "裁制", "营建", "缮城郭", "修造", "竖柱上梁",
                "修仓库", "经络", "酝酿", "开市", "立券交易", "纳财", "栽种", "牧养", "纳畜", "安葬"]);
        }
        
        // 天恩：特定干支日（甲子乙丑丙寅...）
        const tianEnList = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 33, 34, 37, 40, 44, 45, 46, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59];
        if (tianEnList.includes(dhen % 60)) {
            goodGodName.push("天恩");
            goodThing = addToArray(goodThing, ["覃恩", "恤孤茕", "布政事", "雪冤", "庆赐", "宴会"]);
        }
        
        // 月恩：甲辛丙丁庚己戊辛壬癸庚乙（月支）
        if ("甲辛丙丁庚己戊辛壬癸庚乙"[men] === dayGan) {
            goodGodName.push("月恩");
            goodThing = addToArray(goodThing, ["祭祀", "祈福", "求嗣", "施恩", "举正直", "庆赐", "宴会", "出行", "上官", "临政",
                "结婚姻", "纳采", "搬移", "解除", "求医疗病", "裁制", "修宫室", "缮城郭", "修造", "竖柱上梁",
                "纳财", "开仓", "栽种", "牧养"]);
        }
        
        // 四相：春丙丁、夏戊己、秋壬癸、冬甲乙
        const sixiangGan = ["丙丁", "戊己", "壬癸", "甲乙"];
        if (sixiangGan[sn].includes(dayGan)) {
            goodGodName.push("四相");
            goodThing = addToArray(goodThing, ["祭祀", "祈福", "求嗣", "施恩", "举正直", "庆赐", "宴会", "出行", "上官", "临政",
                "结婚姻", "纳采", "搬移", "解除", "求医疗病", "裁制", "修宫室", "缮城郭", "修造", "竖柱上梁",
                "纳财", "开仓", "栽种", "牧养"]);
        }
        
        // 时德：春午、夏辰、秋子、冬寅
        if ("午辰子寅"[sn] === dayZhi) {
            goodGodName.push("时德");
            goodThing = addToArray(goodThing, ["祭祀", "祈福", "求嗣", "施恩", "举正直", "庆赐", "宴会", "出行", "上官", "临政",
                "结婚姻", "纳采", "搬移", "解除", "求医疗病", "裁制", "修宫室", "缮城郭", "修造", "竖柱上梁",
                "纳财", "开仓", "栽种", "牧养"]);
        }
        
        // 王日、官日、守日、相日、民日（依季节）
        const wangZhi = ["寅", "巳", "申", "亥"][sn];
        const guanZhi = ["卯", "午", "酉", "子"][sn];
        const shouZhi = ["酉", "子", "卯", "午"][sn];
        const xiangZhi = ["巳", "申", "亥", "寅"][sn];
        const minZhi = ["午", "酉", "子", "卯"][sn];
        
        if (dayZhi === wangZhi) {
            goodGodName.push("王日");
            goodThing = addToArray(goodThing, ["颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会",
                "出行", "安抚边境", "选将", "上官", "临政", "裁制"]);
        }
        if (dayZhi === guanZhi) {
            goodGodName.push("官日");
            goodThing = addToArray(goodThing, ["上官", "临政"]);
        }
        if (dayZhi === shouZhi) {
            goodGodName.push("守日");
            goodThing = addToArray(goodThing, ["安抚边境", "上官", "临政"]);
        }
        if (dayZhi === xiangZhi) {
            goodGodName.push("相日");
            goodThing = addToArray(goodThing, ["上官", "临政"]);
        }
        if (dayZhi === minZhi) {
            goodGodName.push("民日");
            goodThing = addToArray(goodThing, ["宴会", "结婚姻", "纳采", "进人口", "搬移", "开市", "立券交易", "纳财", "栽种", "牧养", "纳畜"]);
        }
        
        // 三合
        if ((den - men + 12) % 4 === 0) {
            goodGodName.push("三合");
            goodThing = addToArray(goodThing, ["庆赐", "宴会", "结婚姻", "纳采", "嫁娶", "进人口", "裁制", "修宫室", "缮城郭", "修造",
                "竖柱上梁", "修仓库", "经络", "酝酿", "立券交易", "纳财", "安碓硙", "纳畜"]);
        }
        
        // 五合：寅卯
        if ("寅卯".includes(dayZhi)) {
            goodGodName.push("五合");
            goodThing = addToArray(goodThing, ["宴会", "结婚姻", "立券交易"]);
        }
        
        // 五富：巳申亥寅循环
        const wufuTable = "巳申亥寅巳申亥寅巳申亥寅";
        if (wufuTable[men] === dayGan) {
            goodGodName.push("五富");
            goodThing = addToArray(goodThing, ["经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "栽种", "牧养", "纳畜"]);
        }
        
        // 六合
        const liuheTable = "丑子亥戌酉申未午巳辰卯寅";
        if (liuheTable[men] === dayZhi) {
            goodGodName.push("六合");
            goodThing = addToArray(goodThing, ["宴会", "结婚姻", "嫁娶", "进人口", "经络", "酝酿", "立券交易", "纳财", "纳畜", "安葬"]);
        }
        
        // 六仪
        const liuyiTable = "午巳辰卯寅丑子亥戌酉申未";
        if (liuyiTable[men] === dayZhi) {
            goodGodName.push("六仪");
            goodThing = addToArray(goodThing, ["临政"]);
        }
        
        // 不将（嫁娶吉日）
        const bujiangTable = [
            "甲乙", "丙丁", "戊己", "庚辛", "壬癸", "甲乙", "丙丁", "戊己", "庚辛", "壬癸", "甲乙", "丙丁"
        ];
        if (bujiangTable[men].includes(dayGan)) {
            goodGodName.push("不将");
            goodThing = addToArray(goodThing, ["嫁娶"]);
        }
        
        // 临日
        const linriTable = "辰酉午亥申丑戌卯子巳寅未";
        if (linriTable[men] === dayGan) {
            goodGodName.push("临日");
            goodThing = addToArray(goodThing, ["上册", "上表章", "上官", "临政"]);
        }
        
        // 天喜
        const tianxiTable = "申酉戌亥子丑寅卯辰巳午未";
        if (tianxiTable[men] === dayZhi) {
            goodGodName.push("天喜");
            goodThing = addToArray(goodThing, ["施恩", "举正直", "庆赐", "宴会", "出行", "上官", "临政", "结婚姻", "纳采", "嫁娶"]);
        }
        
        // 天富
        const tianfuTable = "寅卯辰巳午未申酉戌亥子丑";
        if (tianfuTable[men] === dayZhi) {
            goodGodName.push("天富");
            goodThing = addToArray(goodThing, ["安葬", "修仓库"]);
        }
        
        // 天贵
        const tianguiTable = ["甲乙", "丙丁", "庚辛", "壬癸"];
        if (tianguiTable[sn].includes(dayGan)) {
            goodGodName.push("天贵");
        }
        
        // 天成
        const tianchengTable = "卯巳未酉亥丑卯巳未酉亥丑";
        if (tianchengTable[men] === dayZhi) {
            goodGodName.push("天成");
        }
        
        // 天官
        const tianguanTable = "午申戌子寅辰午申戌子寅辰";
        if (tianguanTable[men] === dayZhi) {
            goodGodName.push("天官");
        }
        
        // 天医
        const tianyiTable = "亥子丑寅卯辰巳午未申酉戌";
        if (tianyiTable[men] === dayZhi) {
            goodGodName.push("天医");
            goodThing = addToArray(goodThing, ["求医疗病"]);
        }
        
        // 天马
        const tianmaTable = "寅辰午申戌子寅辰午申戌子";
        if (tianmaTable[men] === dayZhi) {
            goodGodName.push("天马");
            goodThing = addToArray(goodThing, ["出行", "搬移"]);
        }
        
        // 驿马
        const yimaTable = "寅亥申巳寅亥申巳寅亥申巳";
        if (yimaTable[men] === dayZhi) {
            goodGodName.push("驿马");
            goodThing = addToArray(goodThing, ["出行", "搬移"]);
        }
        
        // 天财
        const tiancaiTable = "子寅辰午申戌子寅辰午申戌";
        if (tiancaiTable[men] === dayZhi) {
            goodGodName.push("天财");
        }
        
        // 福生
        const fushengTable = "寅申酉卯戌辰亥巳子午丑未";
        if (fushengTable[men] === dayZhi) {
            goodGodName.push("福生");
            goodThing = addToArray(goodThing, ["祭祀", "祈福"]);
        }
        
        // 福厚
        const fuhouTable = ["寅", "巳", "申", "亥"];
        if (dayZhi === fuhouTable[sn]) {
            goodGodName.push("福厚");
        }
        
        // 福德
        const fudeTable = "寅卯辰巳午未申酉戌亥子丑";
        if (fudeTable[men] === dayZhi) {
            goodGodName.push("福德");
            goodThing = addToArray(goodThing, ["上册", "上表章", "庆赐", "宴会", "修宫室", "缮城郭"]);
        }
        
        // 天巫
        const tianwuTable = "寅卯辰巳午未申酉戌亥子丑";
        if (tianwuTable[men] === dayZhi) {
            goodGodName.push("天巫");
            goodThing = addToArray(goodThing, ["求医疗病"]);
        }
        
        // 地财
        const dicaiTable = "丑卯巳未酉亥丑卯巳未酉亥";
        if (dicaiTable[men] === dayZhi) {
            goodGodName.push("地财");
        }
        
        // 月财
        const yuecaiTable = "酉亥午巳巳未酉亥午巳巳未";
        if (yuecaiTable[men] === dayZhi) {
            goodGodName.push("月财");
        }
        
        // 月空
        const yuekongTable = "丙甲壬庚丙甲壬庚丙甲壬庚";
        if (yuekongTable[men] === dayGan) {
            goodGodName.push("月空");
            goodThing = addToArray(goodThing, ["上表章"]);
        }
        
        // 母仓（按季节）
        const mucangTable = ["亥子", "寅卯", "辰丑戌未", "申酉"];
        if (mucangTable[sn].includes(dayZhi)) {
            goodGodName.push("母仓");
            goodThing = addToArray(goodThing, ["纳财", "栽种", "牧养", "纳畜"]);
        }
        
        // 明星
        const mingxingTable = "辰午甲戌子寅辰午甲戌子寅";
        if (mingxingTable[men] === dayZhi) {
            goodGodName.push("明星");
            goodThing = addToArray(goodThing, ["赴任", "诉讼", "安葬"]);
        }
        
        // 圣心
        const shengxinTable = "辰戌亥巳子午丑未寅申卯酉";
        if (shengxinTable[men] === dayZhi) {
            goodGodName.push("圣心");
            goodThing = addToArray(goodThing, ["祭祀", "祈福"]);
        }
        
        // 禄库
        const lukuTable = "寅卯辰巳午未申酉戌亥子丑";
        if (lukuTable[men] === dayZhi) {
            goodGodName.push("禄库");
            goodThing = addToArray(goodThing, ["纳财"]);
        }
        
        // 吉庆
        const jiqingTable = "未子酉寅亥辰丑午卯申巳戌";
        if (jiqingTable[men] === dayZhi) {
            goodGodName.push("吉庆");
        }
        
        // 阴德
        const yindeTable = "丑亥酉未巳卯丑亥酉未巳卯";
        if (yindeTable[men] === dayZhi) {
            goodGodName.push("阴德");
            goodThing = addToArray(goodThing, ["恤孤茕", "雪冤"]);
        }
        
        // 活曜
        const huoyaoTable = "卯申巳戌未子酉寅亥辰丑午";
        if (huoyaoTable[men] === dayZhi) {
            goodGodName.push("活曜");
        }
        
        // 除神（申酉日）
        if ("申酉".includes(dayZhi)) {
            goodGodName.push("除神");
            goodThing = addToArray(goodThing, ["解除", "沐浴", "整容", "剃头", "整手足甲", "求医疗病", "扫舍宇"]);
        }
        
        // 解神
        const jieshenTable = "午午申申戌戌子子寅寅辰辰";
        if (jieshenTable[men] === dayZhi) {
            goodGodName.push("解神");
            goodThing = addToArray(goodThing, ["上表章", "解除", "沐浴", "整容", "剃头", "整手足甲", "求医疗病"]);
        }
        
        // 生气
        const shengqiTable = "戌亥子丑寅卯辰巳午未申酉";
        if (shengqiTable[men] === dayZhi) {
            goodGodName.push("生气");
            badThing = addToArray(badThing, ["伐木", "畋猎", "取鱼"]);
        }
        
        // 普护
        const puhuTable = "丑卯申寅酉卯戌辰亥巳子午";
        if (puhuTable[men] === dayZhi) {
            goodGodName.push("普护");
            goodThing = addToArray(goodThing, ["祭祀", "祈福"]);
        }
        
        // 益后
        const yihouTable = "巳亥子午丑未寅申卯酉辰戌";
        if (yihouTable[men] === dayZhi) {
            goodGodName.push("益后");
            goodThing = addToArray(goodThing, ["祭祀", "祈福", "求嗣"]);
        }
        
        // 续世
        const xushiTable = "午子丑未寅申卯酉辰戌巳亥";
        if (xushiTable[men] === dayZhi) {
            goodGodName.push("续世");
            goodThing = addToArray(goodThing, ["祭祀", "祈福", "求嗣"]);
        }
        
        // 要安
        const yaoanTable = "未丑寅申卯酉辰戌巳亥午子";
        if (yaoanTable[men] === dayZhi) {
            goodGodName.push("要安");
        }
        
        // 天后
        const tianhouTable = "寅亥申巳寅亥申巳寅亥申巳";
        if (tianhouTable[men] === dayZhi) {
            goodGodName.push("天后");
            goodThing = addToArray(goodThing, ["求医疗病"]);
        }
        
        // 天仓
        const tiancangTable = "辰卯寅丑子亥戌酉申未午巳";
        if (tiancangTable[men] === dayZhi) {
            goodGodName.push("天仓");
            goodThing = addToArray(goodThing, ["进人口", "纳财", "纳畜"]);
        }
        
        // 敬安
        const jinganTable = "子午未丑申寅酉卯戌辰亥巳";
        if (jinganTable[men] === dayZhi) {
            goodGodName.push("敬安");
        }
        
        // 玉宇
        const yuyuTable = "申寅卯酉辰戌巳亥午子未丑";
        if (yuyuTable[men] === dayZhi) {
            goodGodName.push("玉宇");
        }
        
        // 金堂
        const jintangTable = "酉卯辰戌巳亥午子未丑申寅";
        if (jintangTable[men] === dayZhi) {
            goodGodName.push("金堂");
        }
        
        // 吉期
        const jiqiTable = "丑寅卯辰巳午未申酉戌亥子";
        if (jiqiTable[men] === dayZhi) {
            goodGodName.push("吉期");
            goodThing = addToArray(goodThing, ["施恩", "举正直", "出行", "上官", "临政"]);
        }
        
        // 大葬日
        const dazang = "壬申癸酉壬午甲申乙酉丙申丁酉壬寅丙午己酉庚申辛酉";
        if (dazang.includes(ganzhi)) {
            goodGodName.push("大葬");
            goodThing = addToArray(goodThing, ["安葬"]);
        }
        
        // 鸣吠日
        const mingfei = "庚午壬申癸酉壬午甲申乙酉己酉丙申丁酉壬寅丙午庚寅庚申辛酉";
        if (mingfei.includes(ganzhi)) {
            goodGodName.push("鸣吠");
            goodThing = addToArray(goodThing, ["破土", "安葬"]);
        }
        
        // 小葬日
        const xiaozang = "庚午壬辰甲辰乙巳甲寅丙辰庚寅";
        if (xiaozang.includes(ganzhi)) {
            goodGodName.push("小葬");
            goodThing = addToArray(goodThing, ["安葬"]);
        }
        
        // 鸣吠对日
        const mingfeidui = "丙寅丁卯丙子辛卯甲午庚子癸卯壬子甲寅乙卯";
        if (mingfeidui.includes(ganzhi)) {
            goodGodName.push("鸣吠对");
            goodThing = addToArray(goodThing, ["破土", "启攒"]);
        }
        
        // 不守塚日
        const bushouzhong = "庚午辛未壬申癸酉戊寅己卯壬午癸未甲申乙酉丁未甲午乙未丙申丁酉壬寅癸卯丙午戊申己酉庚申辛酉";
        if (bushouzhong.includes(ganzhi)) {
            goodGodName.push("不守塚");
            goodThing = addToArray(goodThing, ["破土"]);
        }

        // ===== 凶神判断（完整移植自 cal.py） =====
        
        // 岁破（与年支相冲）
        if (den === (yen + 6) % 12) {
            badGodName.push("岁破");
            badThing = addToArray(badThing, ["修造", "搬移", "嫁娶", "出行"]);
        }
        
        // 月建、月破
        if (men === den) {
            badGodName.push("月建");
            badThing = addToArray(badThing, ["祈福", "求嗣", "上册", "上表章", "结婚姻", "纳采", "嫁娶", "解除", "整容", "剃头",
                "整手足甲", "求医疗病", "营建", "修宫室", "缮城郭", "修造", "竖柱上梁", "修仓库", "开仓",
                "修置产室", "破屋坏垣", "伐木", "栽种", "破土", "安葬", "启攒"]);
        }
        if ((men + 6) % 12 === den) {
            badGodName.push("月破");
            badThing = addToArray(badThing, ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制",
                "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿",
                "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
                "修饰垣墙", "平治道涂", "破屋坏垣", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]);
            goodThing = addToArray(goodThing, ["破屋坏垣"]);
        }
        
        // 月刑
        const yuexingTable = ["卯", "戌", "巳", "子", "辰", "申", "午", "丑", "寅", "酉", "未", "亥"];
        if (dayZhi === yuexingTable[men]) {
            badGodName.push("月刑");
            badThing = addToArray(badThing, ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制",
                "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿",
                "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
                "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]);
        }
        
        // 月害
        const yuehaiTable = ["未", "午", "巳", "辰", "卯", "寅", "丑", "子", "亥", "戌", "酉", "申"];
        if (dayZhi === yuehaiTable[men]) {
            badGodName.push("月害");
            badThing = addToArray(badThing, ["祈福", "求嗣", "上册", "上表章", "庆赐", "宴会", "安抚边境", "选将", "出师", "上官",
                "纳采", "嫁娶", "进人口", "求医疗病", "修仓库", "经络", "酝酿", "开市", "立券交易", "纳财",
                "开仓", "修置产室", "牧养", "纳畜", "破土", "安葬", "启攒"]);
        }
        
        // 月厌
        const yueyanTable = ["子", "亥", "戌", "酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑"];
        if (dayZhi === yueyanTable[men]) {
            badGodName.push("月厌");
            badThing = addToArray(badThing, ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "远回", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病",
                "裁制", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络",
                "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴",
                "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "伐木", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]);
        }
        
        // 月煞、月虚
        const yueshaTable = "未辰丑戌未辰丑戌未辰丑戌";
        if (dayZhi === yueshaTable[men]) {
            badGodName.push("月煞");
            badThing = addToArray(badThing, ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制",
                "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿",
                "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
                "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "安葬"]);
            badGodName.push("月虚");
            badThing = addToArray(badThing, ["修仓库", "纳财", "开仓"]);
        }
        
        // 灾煞
        const zaishaTable = "午卯子酉午卯子酉午卯子酉";
        if (dayZhi === zaishaTable[men]) {
            badGodName.push("灾煞");
            badThing = addToArray(badThing, ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制",
                "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿",
                "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
                "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]);
        }
        
        // 劫煞
        const jieshaTable = "巳寅亥申巳寅亥申巳寅亥申";
        if (dayZhi === jieshaTable[men]) {
            badGodName.push("劫煞");
            badThing = addToArray(badThing, ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制",
                "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿",
                "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
                "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]);
        }
        
        // 四击
        const sijiTable = "未未戌戌戌丑丑丑辰辰辰未";
        if (dayZhi === sijiTable[men]) {
            badGodName.push("四击");
            badThing = addToArray(badThing, ["安抚边境", "选将", "出师"]);
        }
        
        // 大时、咸池、大败
        const dashiTable = "酉午卯子酉午卯子酉午卯子";
        if (dayZhi === dashiTable[men]) {
            badGodName.push("大时");
            badThing = addToArray(badThing, ["祈福", "求嗣", "上册", "上表章", "施恩", "招贤", "举正直", "冠带", "出行", "安抚边境",
                "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除",
                "求医疗病", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "开市", "立券交易",
                "纳财", "开仓", "修置产室", "栽种", "牧养", "纳畜"]);
            badGodName.push("咸池");
            badThing = addToArray(badThing, ["嫁娶", "取鱼", "乘船渡水"]);
            badGodName.push("大败");
        }
        
        // 游祸
        const youhuoTable = "亥申巳寅亥申巳寅亥申巳寅";
        if (dayZhi === youhuoTable[men]) {
            badGodName.push("游祸");
            badThing = addToArray(badThing, ["祈福", "求嗣", "解除", "求医疗病"]);
        }
        
        // 归忌
        const guijiTable = "寅子丑寅子丑寅子丑寅子丑";
        if (dayZhi === guijiTable[men]) {
            badGodName.push("归忌");
            badThing = addToArray(badThing, ["搬移", "远回"]);
        }
        
        // 往亡
        const wangwangTable = "戌丑寅巳申亥卯午酉子辰未";
        if (dayZhi === wangwangTable[men]) {
            badGodName.push("往亡");
            badThing = addToArray(badThing, ["上册", "上表章", "颁诏", "招贤", "宣政事", "出行", "安抚边境", "选将", "出师", "上官",
                "临政", "嫁娶", "进人口", "搬移", "求医疗病", "捕捉", "畋猎", "取鱼"]);
        }
        
        // 天贼
        const tianzeiTable = "卯寅丑子亥戌酉申未午巳辰";
        if (dayZhi === tianzeiTable[men]) {
            badGodName.push("天贼");
            badThing = addToArray(badThing, ["出行", "修仓库", "开仓"]);
        }
        
        // 天罡
        const tiangangTable = "卯戌巳子未寅";
        if (dayZhi === tiangangTable[men % 6]) {
            badGodName.push("天罡");
            badThing = addToArray(badThing, ["安葬"]);
        }
        
        // 河魁
        const hekuiTable = "酉辰亥午丑申";
        if (dayZhi === hekuiTable[men % 6]) {
            badGodName.push("河魁");
            badThing = addToArray(badThing, ["安葬"]);
        }
        
        // 死神
        const sishenTable = "卯辰巳午未申酉戌亥子丑寅";
        if (dayZhi === sishenTable[men]) {
            badGodName.push("死神");
            badThing = addToArray(badThing, ["安抚边境", "选将", "出师", "进人口", "解除", "求医疗病", "修置产室", "栽种", "牧养", "纳畜"]);
        }
        
        // 死气
        const siqiTable = "辰巳午未申酉戌亥子丑寅卯";
        if (dayZhi === siqiTable[men]) {
            badGodName.push("死气");
            badThing = addToArray(badThing, ["安抚边境", "选将", "出师", "解除", "求医疗病", "修置产室", "栽种"]);
        }
        
        // 伏兵（根据年支）
        const fubingTable = "丙甲壬庚";
        if (dayGan === fubingTable[yen % 4]) {
            badGodName.push("伏兵");
            badThing = addToArray(badThing, ["修仓库", "修造", "出师"]);
        }
        
        // 官符
        const guanfuTable = "辰巳午未申酉戌亥子丑寅卯";
        if (dayZhi === guanfuTable[men]) {
            badGodName.push("官符");
            badThing = addToArray(badThing, ["上表章", "上册"]);
        }
        
        // 厌对、招摇
        const yanduiTable = "午巳辰卯寅丑子亥戌酉申未";
        if (dayZhi === yanduiTable[men]) {
            badGodName.push("厌对");
            badThing = addToArray(badThing, ["嫁娶"]);
            badGodName.push("招摇");
            badThing = addToArray(badThing, ["取鱼", "乘船渡水"]);
        }
        
        // 小红砂
        const xiaohongshaTable = "酉丑巳酉丑巳酉丑巳酉丑巳";
        if (dayZhi === xiaohongshaTable[men]) {
            badGodName.push("小红砂");
            badThing = addToArray(badThing, ["嫁娶"]);
        }
        
        // 重丧
        const zhongsangTable = "癸己甲乙己丙丁己庚辛己壬";
        if (dayGan === zhongsangTable[men]) {
            badGodName.push("重丧");
            badThing = addToArray(badThing, ["嫁娶", "安葬"]);
        }
        
        // 重复
        const chongfuTable = "癸己庚辛己壬癸戊甲乙己壬";
        if (dayGan === chongfuTable[men]) {
            badGodName.push("重复");
            badThing = addToArray(badThing, ["嫁娶", "安葬"]);
        }
        
        // 杨公忌（13忌日）
        const yanggongJiList = [
            [1, 13], [2, 11], [3, 9], [4, 7], [5, 5], [6, 2], [7, 1], [7, 29],
            [8, 27], [9, 25], [10, 23], [11, 21], [12, 19]
        ];
        for (let item of yanggongJiList) {
            if (lmn === item[0] && ldn === item[1]) {
                badGodName.push("杨公忌");
                badThing = addToArray(badThing, ["开张", "修造", "嫁娶", "立券"]);
                break;
            }
        }
        
        // 月忌（初五、十四、二十三）
        if ([5, 14, 23].includes(ldn)) {
            badGodName.push("月忌");
            badThing = addToArray(badThing, ["出行", "乘船渡水"]);
        }
        
        // 三娘煞（3, 7, 13, 18, 22, 27日）
        if ([3, 7, 13, 18, 22, 27].includes(ldn)) {
            badGodName.push("三娘煞");
            badThing = addToArray(badThing, ["嫁娶", "结婚姻"]);
        }
        
        // 大耗
        const dahaoTable = "卯辰巳午未申酉戌亥子丑寅";
        if (dayZhi === dahaoTable[men]) {
            badGodName.push("大耗");
            badThing = addToArray(badThing, ["修仓库", "开市", "立券交易", "纳财", "开仓"]);
        }
        
        // 小耗
        const xiaohaoTable = "卯辰巳午未申酉戌亥子丑寅";
        if (dayZhi === xiaohaoTable[men]) {
            badGodName.push("小耗");
            badThing = addToArray(badThing, ["修仓库", "开市", "立券交易", "纳财", "开仓"]);
        }
        
        // 天吏
        const tianliTable = "卯子酉午卯子酉午卯子酉午";
        if (dayZhi === tianliTable[men]) {
            badGodName.push("天吏");
            badThing = addToArray(badThing, ["祈福", "求嗣", "上册", "上表章", "施恩", "招贤", "举正直", "冠带", "出行", "安抚边境",
                "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除",
                "求医疗病", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "开市", "立券交易",
                "纳财", "开仓", "修置产室", "栽种", "牧养", "纳畜"]);
        }
        
        // 天瘟
        const tianwenTable = "丑卯未戌辰寅午子酉申巳亥";
        if (dayZhi === tianwenTable[men]) {
            badGodName.push("天瘟");
            badThing = addToArray(badThing, ["修造", "求医疗病", "纳畜"]);
        }
        
        // 天狱、天火
        const tianyuTable = "午酉子卯午酉子卯午酉子卯";
        if (dayZhi === tianyuTable[men]) {
            badGodName.push("天狱");
            badGodName.push("天火");
            badThing = addToArray(badThing, ["苫盖"]);
        }
        
        // 天棒
        const tianbangTable = "寅辰午申戌子寅辰午申戌子";
        if (dayZhi === tianbangTable[men]) {
            badGodName.push("天棒");
        }
        
        // 天狗
        const tiangouTable = "寅卯辰巳午未申酉戌亥子丑";
        if (dayZhi === tiangouTable[men]) {
            badGodName.push("天狗");
            badThing = addToArray(badThing, ["祭祀"]);
        }
        
        // 天狗下食
        const tiangouxiaTable = "戌亥子丑寅卯辰巳午未申酉";
        if (dayZhi === tiangouxiaTable[men]) {
            badGodName.push("天狗下食");
            badThing = addToArray(badThing, ["祭祀"]);
        }
        
        // 地火
        const dihuoTable = "子亥戌酉申未午巳辰卯寅丑";
        if (dayZhi === dihuoTable[men]) {
            badGodName.push("地火");
            badThing = addToArray(badThing, ["栽种"]);
        }
        
        // 独火
        const duhuoTable = "未午巳辰卯寅丑子亥戌酉申";
        if (dayZhi === duhuoTable[men]) {
            badGodName.push("独火");
            badThing = addToArray(badThing, ["修造"]);
        }
        
        // 受死
        const shousiTable = "卯酉戌辰亥巳子午丑未寅申";
        if (dayZhi === shousiTable[men]) {
            badGodName.push("受死");
            badThing = addToArray(badThing, ["畋猎"]);
        }
        
        // 黄沙
        const huangshaTable = "寅子午寅子午寅子午寅子午";
        if (dayZhi === huangshaTable[men]) {
            badGodName.push("黄沙");
            badThing = addToArray(badThing, ["出行"]);
        }
        
        // 六不成
        const liubuchengTable = "卯未寅午戌巳酉丑申子辰亥";
        if (dayZhi === liubuchengTable[men]) {
            badGodName.push("六不成");
            badThing = addToArray(badThing, ["修造"]);
        }
        
        // 神隔
        const shengeTable = "酉未巳卯丑亥酉未巳卯丑亥";
        if (dayZhi === shengeTable[men]) {
            badGodName.push("神隔");
            badThing = addToArray(badThing, ["祭祀", "祈福"]);
        }
        
        // 朱雀
        const zhuqueTable = "亥丑卯巳未酉亥丑卯巳未酉";
        if (dayZhi === zhuqueTable[men]) {
            badGodName.push("朱雀");
            badThing = addToArray(badThing, ["嫁娶"]);
        }
        
        // 白虎
        const baihuTable = "寅辰午申戌子寅辰午申戌子";
        if (dayZhi === baihuTable[men]) {
            badGodName.push("白虎");
            badThing = addToArray(badThing, ["安葬"]);
        }
        
        // 玄武
        const xuanwuTable = "巳未酉亥丑卯巳未酉亥丑卯";
        if (dayZhi === xuanwuTable[men]) {
            badGodName.push("玄武");
            badThing = addToArray(badThing, ["安葬"]);
        }
        
        // 勾陈
        const gouchanTable = "未酉亥丑卯巳未酉亥丑卯巳";
        if (dayZhi === gouchanTable[men]) {
            badGodName.push("勾陈");
        }
        
        // 大祸
        const dahuoTable = "丁乙癸辛";
        if (dayGan === dahuoTable[yen % 4]) {
            badGodName.push("大祸");
            badThing = addToArray(badThing, ["修仓库", "修造", "出师"]);
        }
        
        // 神号
        const shenhaoTable = "申酉戌亥子丑寅卯辰巳午未";
        if (dayZhi === shenhaoTable[men]) {
            badGodName.push("神号");
        }
        
        // 妨择
        const fangzeTable = "辰辰午午申申戌戌子子寅寅";
        if (dayZhi === fangzeTable[men]) {
            badGodName.push("妨择");
        }
        
        // 披麻
        const pimaTable = "午卯子酉午卯子酉午卯子酉";
        if (dayZhi === pimaTable[men]) {
            badGodName.push("披麻");
            badThing = addToArray(badThing, ["嫁娶", "入宅"]);
        }
        
        // 九坎、九焦、九空、枯鱼（相同规律）
        const jiukanTable = "申巳辰丑戌未卯子酉午寅亥";
        if (dayZhi === jiukanTable[men]) {
            badGodName.push("九坎");
            badThing = addToArray(badThing, ["塞穴", "补垣", "取鱼", "乘船渡水"]);
            badGodName.push("九焦");
            badThing = addToArray(badThing, ["鼓铸", "栽种"]);
            badGodName.push("九空");
            badThing = addToArray(badThing, ["进人口", "修仓库", "开市", "立券交易", "纳财", "开仓"]);
            badGodName.push("枯鱼");
            badThing = addToArray(badThing, ["栽种"]);
        }
        
        // 八座
        const bazuoTable = "酉戌亥子丑寅卯辰巳午未申";
        if (dayZhi === bazuoTable[men]) {
            badGodName.push("八座");
        }
        
        // 血忌、血支
        const xuejiTable = "午子丑未寅申卯酉辰戌巳亥";
        if (dayZhi === xuejiTable[men]) {
            badGodName.push("血忌");
            badThing = addToArray(badThing, ["针刺"]);
        }
        const xuezhiTable = "亥子丑寅卯辰巳午未申酉戌";
        if (dayZhi === xuezhiTable[men]) {
            badGodName.push("血支");
            badThing = addToArray(badThing, ["针刺"]);
        }
        
        // 土符
        const tufuTable = "申子丑巳酉寅午戌卯未亥辰";
        if (dayZhi === tufuTable[men]) {
            badGodName.push("土符");
            badThing = addToArray(badThing, ["营建", "修宫室", "缮城郭", "筑堤防", "修造", "修仓库", "修置产室", "开渠", "穿井", "安碓硙", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "栽种", "破土"]);
        }
        
        // 土府
        const tufuTable2 = "子丑寅卯辰巳午未申酉戌亥";
        if (dayZhi === tufuTable2[men]) {
            badGodName.push("土府");
            badThing = addToArray(badThing, ["营建", "修宫室", "缮城郭", "筑堤防", "修造", "修仓库", "修置产室", "开渠", "穿井", "安碓硙", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "栽种", "破土"]);
        }
        
        // 四忌、四穷
        const sijiRi = ["甲子", "丙子", "庚子", "壬子"];
        const siqiongRi = ["乙亥", "丁亥", "辛亥", "癸亥"];
        if (ganzhi === sijiRi[sn]) {
            badGodName.push("四忌");
            badThing = addToArray(badThing, ["安抚边境", "选将", "出师", "结婚姻", "纳采", "嫁娶", "安葬"]);
        }
        if (ganzhi === siqiongRi[sn]) {
            badGodName.push("四穷");
            badThing = addToArray(badThing, ["安抚边境", "选将", "出师", "结婚姻", "纳采", "嫁娶", "进人口", "修仓库", "开市", "立券交易", "纳财", "开仓", "安葬"]);
        }
        
        // 四废
        const sifeiRi = ["庚申", "辛酉", "壬子", "癸亥", "甲寅", "乙卯", "丁巳", "丙午"];
        const sifeiIdx = [0, 1, 2, 3, 4, 5, 6, 7];
        const sifeiSeason = [0, 0, 1, 1, 2, 2, 3, 3];
        for (let i = 0; i < sifeiRi.length; i++) {
            if (ganzhi === sifeiRi[i] && sn === sifeiSeason[i]) {
                badGodName.push("四废");
                badThing = addToArray(badThing, ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                    "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                    "嫁娶", "进人口", "搬移", "安床", "解除", "求医疗病", "裁制", "营建", "修宫室", "缮城郭", "筑堤防",
                    "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
                    "修饰垣墙", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]);
                break;
            }
        }
        
        // 四耗
        const sihaoRi = ["壬子", "乙卯", "戊午", "辛酉"];
        if (ganzhi === sihaoRi[sn]) {
            badGodName.push("四耗");
            badThing = addToArray(badThing, ["安抚边境", "选将", "出师", "修仓库", "开市", "立券交易", "纳财", "开仓"]);
        }
        
        // 五墓
        const wumuTable = ["壬辰", "戊辰", "乙未", "乙未", "戊辰", "丙戌", "丙戌", "戊辰", "辛丑", "辛丑", "戊辰", "壬辰"];
        if (ganzhi === wumuTable[men]) {
            badGodName.push("五墓");
            badThing = addToArray(badThing, ["冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除", "求医疗病", "营建",
                "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "开市", "立券交易", "修置产室", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]);
        }
        
        // 五虚
        const wuxuTable = ["巳酉丑", "申子辰", "亥卯未", "寅午戌"];
        if (wuxuTable[sn].includes(dayZhi)) {
            badGodName.push("五虚");
            badThing = addToArray(badThing, ["修仓库", "开仓"]);
        }
        
        // 五离（申酉日）
        if ("申酉".includes(dayZhi)) {
            badGodName.push("五离");
            badThing = addToArray(badThing, ["庆赐", "宴会", "结婚姻", "纳采", "立券交易"]);
        }
        
        // 五鬼
        const wuguiTable = "未戌午寅辰酉卯申丑巳子亥";
        if (dayZhi === wuguiTable[men]) {
            badGodName.push("五鬼");
            badThing = addToArray(badThing, ["出行"]);
        }
        
        // 八专
        const bazhuanRi = ["丁未", "己未", "庚申", "甲寅", "癸丑"];
        if (bazhuanRi.includes(ganzhi)) {
            badGodName.push("八专");
            badThing = addToArray(badThing, ["安抚边境", "选将", "出师", "结婚姻", "纳采", "嫁娶"]);
        }
        
        // 天转、地转
        const tianzhuanRi = ["乙卯", "丙午", "辛酉", "壬子"];
        const dizhuanRi = ["辛卯", "戊午", "癸酉", "丙子"];
        if (ganzhi === tianzhuanRi[sn]) {
            badGodName.push("天转");
            badThing = addToArray(badThing, ["修造", "搬移", "嫁娶"]);
        }
        if (ganzhi === dizhuanRi[sn]) {
            badGodName.push("地转");
            badThing = addToArray(badThing, ["修造", "搬移", "嫁娶"]);
        }
        
        // 月建转杀
        const yuejianzhuanshaTable = ["卯", "午", "酉", "子"];
        if (dayZhi === yuejianzhuanshaTable[sn]) {
            badGodName.push("月建转杀");
            badThing = addToArray(badThing, ["修造"]);
        }
        
        // 荒芜
        const huangwuTable = ["巳酉丑", "申子辰", "亥卯未", "寅午戌"];
        if (huangwuTable[sn].includes(dayZhi)) {
            badGodName.push("荒芜");
        }
        
        // 蚩尤
        const chiyouTable = "戌子寅辰午申";
        if (dayZhi === chiyouTable[men % 6]) {
            badGodName.push("蚩尤");
        }
        
        // 飞廉、大煞（相同规律）
        const feilianTable = "申酉戌巳午未寅卯辰亥子丑";
        if (dayZhi === feilianTable[yen]) {
            badGodName.push("飞廉");
            badThing = addToArray(badThing, ["纳畜", "修造", "搬移", "嫁娶"]);
            badGodName.push("大煞");
            badThing = addToArray(badThing, ["安抚边境", "选将", "出师"]);
        }
        
        // 木马
        const mumaTable = "辰午巳未酉申戌子亥丑卯寅";
        if (dayZhi === mumaTable[men]) {
            badGodName.push("木马");
        }
        
        // 破败
        const pobaiTable = "辰午申戌子寅辰午申戌子寅";
        if (dayZhi === pobaiTable[men]) {
            badGodName.push("破败");
        }
        
        // 殃败
        const yangbaiTable = "巳辰卯寅丑子亥戌酉申未午";
        if (dayZhi === yangbaiTable[men]) {
            badGodName.push("殃败");
        }
        
        // 雷公
        const leigongTable = "巳申寅亥巳申寅亥巳申寅亥";
        if (dayZhi === leigongTable[men]) {
            badGodName.push("雷公");
        }
        
        // 咸池（与大时相同）
        const xianchiTable = "酉午卯子酉午卯子酉午卯子";
        if (dayZhi === xianchiTable[men]) {
            badGodName.push("咸池");
            badThing = addToArray(badThing, ["嫁娶", "取鱼", "乘船渡水"]);
        }

        // 去重
        goodGodName = uniqueArray(goodGodName);
        badGodName = uniqueArray(badGodName);
        goodThing = uniqueArray(goodThing);
        badThing = uniqueArray(badThing);
        
        return {
            goodGodName,
            badGodName,
            goodThing,
            badThing
        };
    }

    // ==================== 宜忌等第计算 ====================

    /**
     * 计算今日宜忌等第
     * 移植自 cal.py 的 getTodayThingLevel 方法
     * 返回：0=从宜不从忌, 1=从宜亦从忌, 2=从忌不从宜, 3=诸事皆忌
     */
    function getTodayThingLevel(jianchu, monthZhi, goodGodName, badGodName) {
        const men = getZhiIndex(monthZhi);
        const diZhiChar = DI_ZHI[men];
        
        // 凶煞等级表
        const badGodDic = {
            "平日": [
                ["亥", ["相日", "时德", "六合"], 0],
                ["巳", ["相日", "六合", "月刑"], 1],
                ["申", ["相日", "月害"], 2],
                ["寅", ["相日", "月害", "月刑"], 3],
                ["卯午酉", ["天吏"], 3],
                ["辰戌丑未", ["月煞"], 4],
                ["子", ["天吏", "月刑"], 4]
            ],
            "收日": [
                ["寅申", ["长生", "六合", "劫煞"], 0],
                ["巳亥", ["长生", "劫煞"], 2],
                ["辰未", ["月害"], 2],
                ["子午酉", ["大时"], 3],
                ["丑戌", ["月刑"], 3],
                ["卯", ["大时"], 4]
            ],
            "闭日": [
                ["子午卯酉", ["王日"], 3],
                ["辰戌丑未", ["官日", "天吏"], 3],
                ["寅申巳亥", ["月煞"], 4]
            ],
            "劫煞": [
                ["寅申", ["长生", "六合"], 0],
                ["辰戌丑未", ["除日", "相日"], 1],
                ["巳亥", ["长生", "月害"], 2],
                ["子午卯酉", ["执日"], 3]
            ],
            "灾煞": [
                ["寅申巳亥", ["开日"], 1],
                ["辰戌丑未", ["满日", "民日"], 2],
                ["子午", ["月破"], 4],
                ["卯酉", ["月破", "月厌"], 5]
            ],
            "月煞": [
                ["卯酉", ["六合", "危日"], 1],
                ["子午", ["月害", "危日"], 3]
            ],
            "月刑": [
                ["巳", ["平日", "六合", "相日"], 1],
                ["寅", ["相日", "月害", "平日"], 3],
                ["辰酉亥", ["建日"], 3],
                ["子", ["平日", "天吏"], 4],
                ["卯", ["收日", "大时", "天破"], 4],
                ["未申", ["月破"], 4],
                ["午", ["月建", "月厌", "德大会"], 4]
            ],
            "月害": [
                ["卯酉", ["守日", "除日"], 2],
                ["丑未", ["执日", "大时"], 2],
                ["巳亥", ["长生", "劫煞"], 2],
                ["申", ["相日", "平日"], 2],
                ["子午", ["月煞"], 3],
                ["辰戌", ["官日", "闭日", "天吏"], 3],
                ["寅", ["相日", "平日", "月刑"], 3]
            ],
            "月厌": [
                ["寅申", ["成日"], 2],
                ["丑未", ["开日"], 2],
                ["辰戌", ["定日"], 3],
                ["巳亥", ["满日"], 3],
                ["子", ["月建", "德大会"], 4],
                ["午", ["月建", "月刑", "德大会"], 4],
                ["卯酉", ["月破", "灾煞"], 5]
            ],
            "大时": [
                ["寅申巳亥", ["除日", "官日"], 0],
                ["辰戌", ["执日", "六合"], 0],
                ["丑未", ["执日", "月害"], 2],
                ["子午酉", ["收日"], 3],
                ["卯", ["收日", "月刑"], 4]
            ],
            "天吏": [
                ["寅申巳亥", ["危日"], 2],
                ["辰戌丑未", ["闭日"], 3],
                ["卯午酉", ["平日"], 3],
                ["子", ["平日", "月刑"], 4]
            ]
        };
        
        // 计算当前等级
        let todayAllGodName = [...goodGodName, ...badGodName, jianchu + "日"];
        let l = -1;
        
        for (let gnoItem of todayAllGodName) {
            if (gnoItem in badGodDic) {
                for (let item of badGodDic[gnoItem]) {
                    if (item[0].includes(diZhiChar)) {
                        for (let godname of item[1]) {
                            if (todayAllGodName.includes(godname) && item[2] > l) {
                                l = item[2];
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        // 判断是否遇德
        let isDe = false;
        for (let i of goodGodName) {
            if (["岁德", "岁德合", "月德", "月德合", "天德", "天德合"].includes(i)) {
                isDe = true;
                break;
            }
        }
        
        // 根据等级和是否遇德计算 thingLevel
        let thingLevel;
        if (l === 5) {
            thingLevel = 3; // 下下：凶叠大凶，遇德亦诸事皆忌
        } else if (l === 4) {
            thingLevel = isDe ? 2 : 3; // 下：遇德从忌不从宜，不遇诸事皆忌
        } else if (l === 3) {
            thingLevel = isDe ? 1 : 2; // 中次：遇德从宜亦从忌，不遇从忌不从宜
        } else if (l === 2) {
            thingLevel = isDe ? 0 : 2; // 中：遇德从宜不从忌，不遇从忌不从宜
        } else if (l === 1) {
            thingLevel = isDe ? 0 : 1; // 上次：遇德从宜不从忌，不遇从宜亦从忌
        } else if (l === 0) {
            thingLevel = 0; // 上：从宜不从忌
        } else {
            thingLevel = 0; // 无，从宜不从忌
        }
        
        return {
            level: l,
            thingLevel: thingLevel,
            isDe: isDe
        };
    }

    // ==================== 宜忌处理函数 ====================

    /**
     * 根据宜忌等第处理宜忌事项
     * 移植自 cal.py 的宜忌处理逻辑
     */
    function processYiJiByLevel(goodThing, badThing, thingLevel, goodGodName, badGodName, jianchu, lunarDate) {
        // 深拷贝
        let yi = [...goodThing];
        let ji = [...badThing];
        
        // 从忌亦从宜：移除冲突
        function badDrewGood(y, j) {
            let conflict = y.filter(item => j.includes(item));
            return [
                y.filter(item => !conflict.includes(item)),
                j.filter(item => !conflict.includes(item))
            ];
        }
        
        // 从忌不从宜：保留忌，移除宜中的冲突
        function badOppressGood(y, j) {
            let conflict = y.filter(item => j.includes(item));
            return [y.filter(item => !conflict.includes(item)), j];
        }
        
        // 从宜不从忌：保留宜，移除忌中的冲突
        function goodOppressBad(y, j) {
            let conflict = y.filter(item => j.includes(item));
            return [y, j.filter(item => !conflict.includes(item))];
        }
        
        // 诸事不宜
        function nothingGood() {
            return [["诸事不宜"], ["诸事不宜"]];
        }
        
        // 根据 thingLevel 处理
        if (thingLevel === 3) {
            [yi, ji] = nothingGood();
        } else if (thingLevel === 2) {
            [yi, ji] = badOppressGood(yi, ji);
        } else if (thingLevel === 1) {
            [yi, ji] = badDrewGood(yi, ji);
        } else {
            [yi, ji] = goodOppressBad(yi, ji);
        }
        
        // ===== 遇德犹忌处理 =====
        // 遇德犹忌事项
        const deIsBadThingDic = {
            "月德": ["畋猎", "取鱼"],
            "月德合": ["畋猎", "取鱼"],
            "天德": ["畋猎", "取鱼"],
            "天德合": ["畋猎", "取鱼"],
            "天赦": ["畋猎", "取鱼"],
            "岁德": [],
            "岁德合": []
        };
        
        let deIsBadThing = [];
        for (let god of goodGodName) {
            if (deIsBadThingDic[god]) {
                deIsBadThing = addToArray(deIsBadThing, deIsBadThingDic[god]);
            }
        }
        
        // 判断是否遇德合、赦、愿、月恩、四相、时德
        let isDeSheEnSixiang = false;
        const maxPowerGodList = ["月德合", "天德合", "天赦", "天愿", "月恩", "四相", "时德"];
        for (let god of goodGodName) {
            if (maxPowerGodList.includes(god)) {
                isDeSheEnSixiang = true;
                break;
            }
        }
        
        // 遇德犹忌处理
        if (thingLevel !== 3) {
            // 凡德合、赦、愿、月恩、四相、时德等日，不注忌某些事项（非从忌不从宜日）
            if (isDeSheEnSixiang && thingLevel !== 2) {
                ji = removeFromArray(ji, ["进人口", "安床", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓库", "出货财"]);
                ji = addToArray(ji, deIsBadThing);
            }
            
            // 吉足胜凶或吉凶相抵，遇德犹忌之事仍注忌
            // 简化处理：直接在宜中保留遇德犹忌的事项
            
            // 凡天狗寅日忌祭祀
            if (badGodName.includes("天狗") || lunarDate.day_ganzhi.includes("寅")) {
                ji = addToArray(ji, ["祭祀"]);
                yi = removeFromArray(yi, ["祭祀", "求福", "祈嗣"]);
            }
            
            // 凡卯日忌穿井，不注宜开渠。壬日忌开渠，不注宜穿井
            if (lunarDate.day_ganzhi.includes("卯")) {
                ji = addToArray(ji, ["穿井"]);
                yi = removeFromArray(yi, ["穿井", "开渠"]);
            }
            if (lunarDate.day_ganzhi.includes("壬")) {
                ji = addToArray(ji, ["开渠"]);
                yi = removeFromArray(yi, ["开渠", "穿井"]);
            }
            
            // 凡巳日忌出行
            if (lunarDate.day_ganzhi.includes("巳")) {
                ji = addToArray(ji, ["出行"]);
                yi = removeFromArray(yi, ["出行", "出师", "遣使"]);
            }
            
            // 凡酉日忌宴会
            if (lunarDate.day_ganzhi.includes("酉")) {
                ji = addToArray(ji, ["宴会"]);
                yi = removeFromArray(yi, ["宴会", "庆赐", "赏贺"]);
            }
            
            // 凡丁日忌剃头
            if (lunarDate.day_ganzhi.includes("丁")) {
                ji = addToArray(ji, ["剃头"]);
                yi = removeFromArray(yi, ["剃头", "整容"]);
            }
            
            // 凡月厌忌行幸、上官，遇宜宣政事则改宣为布
            if (badGodName.includes("月厌")) {
                yi = removeFromArray(yi, ["颁诏", "施恩", "招贤", "举正直", "宣政事"]);
                yi = addToArray(yi, ["布政事"]);
            }
            
            // 凡开日，不注宜破土、安葬、启攒
            if (jianchu === "开") {
                yi = removeFromArray(yi, ["破土", "安葬", "启攒"]);
            }
            
            // 凡四忌、四穷只忌安葬
            if (badGodName.includes("四忌") || badGodName.includes("四穷")) {
                ji = addToArray(ji, ["安葬"]);
                yi = removeFromArray(yi, ["破土", "启攒"]);
            }
            
            // 遇鸣吠、鸣吠对亦不注宜破土、启攒
            if (goodGodName.includes("鸣吠") || goodGodName.includes("鸣吠对")) {
                yi = removeFromArray(yi, ["破土", "启攒"]);
            }
        }
        
        // 最终去重和清理
        yi = uniqueArray(yi);
        ji = uniqueArray(ji);
        
        // 移除宜忌中的冲突（宜中有忌中有的事项，从忌中移除）
        let rmThing = ji.filter(thing => yi.includes(thing));
        if (!(rmThing.length === 1 && rmThing[0].includes("诸事"))) {
            ji = removeFromArray(ji, rmThing);
        }
        
        // 为空处理
        if (ji.length === 0) ji = ["诸事不忌"];
        if (yi.length === 0) yi = ["诸事不宜"];
        
        return { yi, ji };
    }

    // ==================== 主计算函数 ====================

    /**
     * 计算指定日期的择吉信息
     * @param {object} lunarDate - 农历日期对象（来自 lunar_calendar.js）
     * @param {number} year - 公历年（向后兼容）
     * @param {number} month - 公历月（向后兼容）
     * @param {number} day - 公历日（向后兼容）
     * @param {object} solarInfo - 可选的额外公历信息对象，包含 nextSolarNum, phaseOfMoon
     */
    function calculate(lunarDate, year, month, day, solarInfo) {
        if (!lunarDate) return null;
        
        // 支持两种调用方式：
        // 1. Almanac.calculate(nongli, year, month, day) - 向后兼容
        // 2. Almanac.calculate(nongli, year, month, day, {nextSolarNum, phaseOfMoon}) - 完整功能
        solarInfo = solarInfo || {};
        const solarYear = year || lunarDate.year;
        const solarMonth = month || lunarDate.month;
        const solarDay = day || lunarDate.day;
        const nextSolarNum = solarInfo.nextSolarNum || 0;
        const phaseOfMoon = solarInfo.phaseOfMoon || "";
        
        const yearGan = lunarDate.year_ganzhi[0];
        const yearZhi = lunarDate.year_ganzhi[1];
        const monthGan = lunarDate.month_ganzhi[0];
        const monthZhi = lunarDate.month_ganzhi[1];
        const dayGan = lunarDate.day_ganzhi[0];
        const dayZhi = lunarDate.day_ganzhi[1];
        
        // 计算十二建除
        const jianchu = calculateJianchu(monthZhi, dayZhi);
        
        // 计算二十八宿（使用公历日期）
        const xiu = calculateXiu(solarYear, solarMonth, solarDay);
        
        // 计算十二神
        const shen = calculateRiShen(monthZhi, dayZhi);
        
        // 获取吉神凶神及宜忌（完整版）
        const angelDemon = getAngelDemon(lunarDate, solarYear, solarMonth, solarDay, nextSolarNum, phaseOfMoon);
        
        // 计算宜忌等第
        const levelInfo = getTodayThingLevel(jianchu, monthZhi, angelDemon.goodGodName, angelDemon.badGodName);
        
        // 根据等第处理宜忌
        const yiji = processYiJiByLevel(
            angelDemon.goodThing, 
            angelDemon.badThing, 
            levelInfo.thingLevel, 
            angelDemon.goodGodName, 
            angelDemon.badGodName,
            jianchu,
            lunarDate
        );
        
        // 计算吉凶评分
        let score = 0;
        const jianchuLucky = {"建": 0, "除": 1, "满": 0, "平": 0, "定": 1, "执": 1, "破": 0, "危": 1, "成": 1, "收": 0, "开": 1, "闭": 0};
        const shenLucky = {"青龙": 1, "明堂": 1, "天刑": 0, "朱雀": 0, "金匮": 1, "天德": 1, "白虎": 0, "玉堂": 1, "天牢": 0, "玄武": 0, "司命": 1, "勾陈": 0};
        
        score += jianchuLucky[jianchu] ? 1 : -1;
        score += shenLucky[shen] ? 1 : -1;
        score += levelInfo.thingLevel <= 1 ? 1 : -1;
        
        let overall;
        if (score >= 2) overall = "大吉";
        else if (score >= 0) overall = "吉";
        else if (score >= -1) overall = "平";
        else overall = "凶";
        
        return {
            year: lunarDate.year,
            month: lunarDate.month,
            day: lunarDate.day,
            isLeap: lunarDate.is_leap,
            yearGanzhi: lunarDate.year_ganzhi,
            monthGanzhi: lunarDate.month_ganzhi,
            dayGanzhi: lunarDate.day_ganzhi,
            zodiac: lunarDate.zodiac,
            jianchu: jianchu,
            xiu: xiu,
            shen: shen,
            goodGodName: angelDemon.goodGodName,
            badGodName: angelDemon.badGodName,
            luck: {
                score: score,
                overall: overall
            },
            yi: yiji.yi,
            ji: yiji.ji,
            levelInfo: levelInfo,
            display: `${lunarDate.year_ganzhi}${lunarDate.zodiac}年 ${lunarDate.month_name}${lunarDate.day_name} ${jianchu}日${xiu}宿值${shen}`
        };
    }

    // ==================== 公共接口 ====================
    
    return {
        calculate: calculate,
        // 暴露内部函数供测试使用
        _calculateJianchu: calculateJianchu,
        _calculateXiu: calculateXiu,
        _calculateRiShen: calculateRiShen,
        _getAngelDemon: getAngelDemon,
        _getTodayThingLevel: getTodayThingLevel
    };

})();
