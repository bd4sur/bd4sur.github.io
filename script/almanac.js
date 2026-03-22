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

    // ==================== 吉神凶神查找表 ====================

    /**
     * 获取吉神凶神及宜忌事项
     * 移植自 cal.py 的 get_AngelDemon 方法
     */
    function getAngelDemon(lunarDate) {
        const yearGan = lunarDate.year_ganzhi[0];
        const yearZhi = lunarDate.year_ganzhi[1];
        const monthGan = lunarDate.month_ganzhi[0];
        const monthZhi = lunarDate.month_ganzhi[1];
        const dayGan = lunarDate.day_ganzhi[0];
        const dayZhi = lunarDate.day_ganzhi[1];
        const ganzhi = dayGan + dayZhi;
        
        const yhn = getGanIndex(yearGan);
        const yen = getZhiIndex(yearZhi);
        const men = getZhiIndex(monthZhi);
        const dhn = getGanIndex(dayGan);
        const den = getZhiIndex(dayZhi);
        const dhen = getGanzhiIndex(ganzhi);
        
        // 季节数 (0=春, 1=夏, 2=秋, 3=冬)
        const sn = (men - 2 + 12) % 12 / 3 | 0;
        
        let goodGodName = [];
        let badGodName = [];
        let goodThing = [];
        let badThing = [];

        // ===== 吉神判断 =====
        
        // 岁德：甲庚丙壬戊（年干）
        if ("甲庚丙壬戊"[yhn] === dayGan) {
            goodGodName.push("岁德");
            goodThing.push("修造");
        }
        
        // 岁德合：己乙辛丁癸（年干）
        if ("己乙辛丁癸"[yhn] === dayGan) {
            goodGodName.push("岁德合");
            goodThing.push("修造");
        }
        
        // 月德：壬庚丙甲壬庚丙甲壬庚丙甲（月支）
        if ("壬庚丙甲壬庚丙甲壬庚丙甲"[men] === dayGan) {
            goodGodName.push("月德");
            goodThing.push("祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", 
                "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行", "安抚边境", "选将", "出师", "上官", 
                "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭", 
                "修造", "竖柱上梁", "修仓库", "栽种", "牧养", "纳畜", "安葬");
            badThing.push("畋猎", "取鱼");
        }
        
        // 月德合：丁乙辛己丁乙辛己丁乙辛己（月支）
        if ("丁乙辛己丁乙辛己丁乙辛己"[men] === dayGan) {
            goodGodName.push("月德合");
            goodThing.push("祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", 
                "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行", "安抚边境", "选将", "出师", "上官", 
                "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭", 
                "修造", "竖柱上梁", "修仓库", "栽种", "牧养", "纳畜", "安葬");
            badThing.push("畋猎", "取鱼");
        }
        
        // 天赦：甲子(0) 戊寅(14) 甲午(30) 戊申(44) 对应特定月份
        const tiansheList = ["甲子", "甲子", "戊寅", "戊寅", "戊寅", "甲午", "甲午", "甲午", "戊申", "戊申", "戊申", "甲子"];
        if (tiansheList[men] === ganzhi) {
            goodGodName.push("天赦");
            goodThing.push("祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直",
                "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行", "安抚边境", "选将", "出师", "上官",
                "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭",
                "修造", "竖柱上梁", "修仓库", "栽种", "牧养", "纳畜", "安葬");
            badThing.push("畋猎", "取鱼");
        }
        
        // 天愿：特定干支对应月份
        const tianyuanList = ["甲子", "癸未", "甲午", "甲戌", "乙酉", "丙子", "丁丑", "戊午", "甲寅", "丙辰", "辛卯", "戊辰"];
        if (tianyuanList[men] === ganzhi) {
            goodGodName.push("天愿");
            goodThing.push("祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直",
                "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行", "安抚边境", "选将", "上官", "临政",
                "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "裁制", "营建", "缮城郭", "修造", "竖柱上梁",
                "修仓库", "经络", "酝酿", "开市", "立券交易", "纳财", "栽种", "牧养", "纳畜", "安葬");
        }
        
        // 天恩：特定干支日
        if ([0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 33, 34, 37, 40, 44, 45, 46, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59].includes(dhen % 60)) {
            goodGodName.push("天恩");
            goodThing.push("覃恩", "恤孤茕", "布政事", "雪冤", "庆赐", "宴会");
        }
        
        // 月恩：甲辛丙丁庚己戊辛壬癸庚乙（月支）
        if ("甲辛丙丁庚己戊辛壬癸庚乙"[men] === dayGan) {
            goodGodName.push("月恩");
            goodThing.push("祭祀", "祈福", "求嗣", "施恩", "举正直", "庆赐", "宴会", "出行", "上官", "临政",
                "结婚姻", "纳采", "搬移", "解除", "求医疗病", "裁制", "修宫室", "缮城郭", "修造", "竖柱上梁",
                "纳财", "开仓", "栽种", "牧养");
        }
        
        // 四相
        if ("丙丁戊己壬癸甲乙"[sn * 2 + (dhn >= 2 && dhn <= 3 ? 0 : dhn >= 4 && dhn <= 5 ? 1 : dhn >= 6 && dhn <= 7 ? 2 : dhn >= 8 && dhn <= 9 ? 3 : 0)] === dayGan) {
            if ((sn === 0 && "丙丁".includes(dayGan)) || 
                (sn === 1 && "戊己".includes(dayGan)) ||
                (sn === 2 && "壬癸".includes(dayGan)) ||
                (sn === 3 && "甲乙".includes(dayGan))) {
                goodGodName.push("四相");
                goodThing.push("祭祀", "祈福", "求嗣", "施恩", "举正直", "庆赐", "宴会", "出行", "上官", "临政",
                    "结婚姻", "纳采", "搬移", "解除", "求医疗病", "裁制", "修宫室", "缮城郭", "修造", "竖柱上梁",
                    "纳财", "开仓", "栽种", "牧养");
            }
        }
        
        // 时德：午辰子寅（季节）
        if ("午辰子寅"[sn] === dayZhi) {
            goodGodName.push("时德");
            goodThing.push("祭祀", "祈福", "求嗣", "施恩", "举正直", "庆赐", "宴会", "出行", "上官", "临政",
                "结婚姻", "纳采", "搬移", "解除", "求医疗病", "裁制", "修宫室", "缮城郭", "修造", "竖柱上梁",
                "纳财", "开仓", "栽种", "牧养");
        }
        
        // 王日、官日、守日、相日、民日（依季节）
        const wangZhi = ["寅", "巳", "申", "亥"][sn];
        const guanZhi = ["卯", "午", "酉", "子"][sn];
        const shouZhi = ["酉", "子", "卯", "午"][sn];
        const xiangZhi = ["巳", "申", "亥", "寅"][sn];
        const minZhi = ["午", "酉", "子", "卯"][sn];
        
        if (dayZhi === wangZhi) {
            goodGodName.push("王日");
            goodThing.push("颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会",
                "出行", "安抚边境", "选将", "上官", "临政", "裁制");
        }
        if (dayZhi === guanZhi) {
            goodGodName.push("官日");
            goodThing.push("上官", "临政");
        }
        if (dayZhi === shouZhi) {
            goodGodName.push("守日");
            goodThing.push("安抚边境", "上官", "临政");
        }
        if (dayZhi === xiangZhi) {
            goodGodName.push("相日");
            goodThing.push("上官", "临政");
        }
        if (dayZhi === minZhi) {
            goodGodName.push("民日");
            goodThing.push("宴会", "结婚姻", "纳采", "进人口", "搬移", "开市", "立券交易", "纳财", "栽种", "牧养", "纳畜");
        }
        
        // 三合
        if ((den - men + 12) % 4 === 0) {
            goodGodName.push("三合");
            goodThing.push("庆赐", "宴会", "结婚姻", "纳采", "嫁娶", "进人口", "裁制", "修宫室", "缮城郭", "修造",
                "竖柱上梁", "修仓库", "经络", "酝酿", "立券交易", "纳财", "安碓硙", "纳畜");
        }
        
        // 六合
        if ("丑子亥戌酉申未午巳辰卯寅"[men] === dayZhi) {
            goodGodName.push("六合");
            goodThing.push("宴会", "结婚姻", "嫁娶", "进人口", "经络", "酝酿", "立券交易", "纳财", "纳畜", "安葬");
        }
        
        // 不将（简化判断）
        const bujiangList = [
            "甲乙", "丙丁", "戊己", "庚辛", "壬癸", "甲乙", "丙丁", "戊己", "庚辛", "壬癸", "甲乙", "丙丁"
        ];
        if (bujiangList[men].includes(dayGan)) {
            goodGodName.push("不将");
            goodThing.push("嫁娶");
        }
        
        // ===== 凶神判断 =====
        
        // 月建、月破
        if (DI_ZHI[men] === dayZhi) {
            badGodName.push("月建");
            badThing.push("祈福", "求嗣", "上册", "上表章", "结婚姻", "纳采", "嫁娶", "解除", "整容", "剃头",
                "整手足甲", "求医疗病", "营建", "修宫室", "缮城郭", "修造", "竖柱上梁", "修仓库", "开仓",
                "修置产室", "破屋坏垣", "伐木", "栽种", "破土", "安葬", "启攒");
        }
        if (DI_ZHI[(men + 6) % 12] === dayZhi) {
            badGodName.push("月破");
            badThing.push("祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制",
                "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿",
                "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
                "修饰垣墙", "平治道涂", "破屋坏垣", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒");
            goodThing.push("破屋坏垣");
        }
        
        // 月刑
        const yuexingZhi = ["卯", "戌", "巳", "子", "辰", "申", "午", "丑", "寅", "酉", "未", "亥"][men];
        if (dayZhi === yuexingZhi) {
            badGodName.push("月刑");
            badThing.push("祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制",
                "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿",
                "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
                "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒");
        }
        
        // 月害
        const yuehaiZhi = ["未", "午", "巳", "辰", "卯", "寅", "丑", "子", "亥", "戌", "酉", "申"][men];
        if (dayZhi === yuehaiZhi) {
            badGodName.push("月害");
            badThing.push("祈福", "求嗣", "上册", "上表章", "庆赐", "宴会", "安抚边境", "选将", "出师", "上官",
                "纳采", "嫁娶", "进人口", "求医疗病", "修仓库", "经络", "酝酿", "开市", "立券交易", "纳财",
                "开仓", "修置产室", "牧养", "纳畜", "破土", "安葬", "启攒");
        }
        
        // 月厌
        const yueyanZhi = ["子", "亥", "戌", "酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑"][men];
        if (dayZhi === yueyanZhi) {
            badGodName.push("月厌");
            badThing.push("祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "远回", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病",
                "裁制", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络",
                "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴",
                "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "伐木", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒");
        }
        
        // 月煞、月虚
        const yueshaZhi = ["未", "辰", "丑", "戌", "未", "辰", "丑", "戌", "未", "辰", "丑", "戌"][men];
        if (dayZhi === yueshaZhi) {
            badGodName.push("月煞");
            badThing.push("祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制",
                "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿",
                "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
                "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "安葬");
        }
        if (dayZhi === yueshaZhi) {
            badGodName.push("月虚");
            badThing.push("修仓库", "纳财", "开仓");
        }
        
        // 灾煞、劫煞
        const zhaishaZhi = ["午", "卯", "子", "酉", "午", "卯", "子", "酉", "午", "卯", "子", "酉"][men];
        const jieshaZhi = ["巳", "寅", "亥", "申", "巳", "寅", "亥", "申", "巳", "寅", "亥", "申"][men];
        if (dayZhi === zhaishaZhi) {
            badGodName.push("灾煞");
            badThing.push("祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制",
                "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿",
                "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
                "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒");
        }
        if (dayZhi === jieshaZhi) {
            badGodName.push("劫煞");
            badThing.push("祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事",
                "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采",
                "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制",
                "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿",
                "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
                "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒");
        }
        
        // 四击
        const sijiZhi = ["未", "未", "戌", "戌", "戌", "丑", "丑", "丑", "辰", "辰", "辰", "未"][men];
        if (dayZhi === sijiZhi) {
            badGodName.push("四击");
            badThing.push("安抚边境", "选将", "出师");
        }
        
        // 大时、咸池、大败
        const dashiZhi = ["酉", "午", "卯", "子", "酉", "午", "卯", "子", "酉", "午", "卯", "子"][men];
        if (dayZhi === dashiZhi) {
            badGodName.push("大时");
            badThing.push("祈福", "求嗣", "上册", "上表章", "施恩", "招贤", "举正直", "冠带", "出行", "安抚边境",
                "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除",
                "求医疗病", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "开市", "立券交易",
                "纳财", "开仓", "修置产室", "栽种", "牧养", "纳畜");
            badGodName.push("咸池");
            badThing.push("嫁娶", "取鱼", "乘船渡水");
            badGodName.push("大败");
        }
        
        // 游祸
        const youhuoZhi = ["亥", "申", "巳", "寅", "亥", "申", "巳", "寅", "亥", "申", "巳", "寅"][men];
        if (dayZhi === youhuoZhi) {
            badGodName.push("游祸");
            badThing.push("祈福", "求嗣", "解除", "求医疗病");
        }
        
        // 归忌
        const guijiZhi = ["寅", "子", "丑", "寅", "子", "丑", "寅", "子", "丑", "寅", "子", "丑"][men];
        if (dayZhi === guijiZhi) {
            badGodName.push("归忌");
            badThing.push("搬移", "远回");
        }
        
        // 往亡
        const wangwangZhi = ["戌", "丑", "寅", "巳", "申", "亥", "卯", "午", "酉", "子", "辰", "未"][men];
        if (dayZhi === wangwangZhi) {
            badGodName.push("往亡");
            badThing.push("上册", "上表章", "颁诏", "招贤", "宣政事", "出行", "安抚边境", "选将", "出师", "上官",
                "临政", "嫁娶", "进人口", "搬移", "求医疗病", "捕捉", "畋猎", "取鱼");
        }
        
        // 天贼
        const tianczeZhi = ["卯", "寅", "丑", "子", "亥", "戌", "酉", "申", "未", "午", "巳", "辰"][men];
        if (dayZhi === tianczeZhi) {
            badGodName.push("天贼");
            badThing.push("出行", "修仓库", "开仓");
        }
        
        // 天罡、河魁
        if ("卯戌巳子未寅"[men % 6] === dayZhi) {
            badGodName.push("天罡");
            badThing.push("安葬");
        }
        if ("酉辰亥午丑申"[men % 6] === dayZhi) {
            badGodName.push("河魁");
            badThing.push("安葬");
        }
        
        // 杨公忌（13忌日）
        const yanggongJiList = [
            [1, 13], [2, 11], [3, 9], [4, 7], [5, 5], [6, 3], [7, 1], [7, 29],
            [8, 27], [9, 25], [10, 23], [11, 21], [12, 19]
        ];
        for (let item of yanggongJiList) {
            if (lunarDate.month === item[0] && lunarDate.day === item[1]) {
                badGodName.push("杨公忌");
                badThing.push("开张", "修造", "嫁娶", "立券");
                break;
            }
        }
        
        // 月忌（初五、十四、二十三）
        if ([5, 14, 23].includes(lunarDate.day)) {
            badGodName.push("月忌");
            badThing.push("出行", "乘船渡水");
        }
        
        // 去重
        goodGodName = [...new Set(goodGodName)];
        badGodName = [...new Set(badGodName)];
        goodThing = [...new Set(goodThing)];
        badThing = [...new Set(badThing)];
        
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
                    if (item[0].includes(DI_ZHI[men])) {
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
     */
    function processYiJiByLevel(goodThing, badThing, thingLevel, goodGodName, jianchu) {
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
        
        // 开日特殊处理
        if (jianchu === "开") {
            yi = yi.filter(item => !["破土", "安葬", "启攒"].includes(item));
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
     * @param {number} solarYear - 公历年（用于二十八宿计算）
     * @param {number} solarMonth - 公历月
     * @param {number} solarDay - 公历日
     */
    function calculate(lunarDate, solarYear, solarMonth, solarDay) {
        if (!lunarDate) return null;
        
        // 如果没有提供公历日期，使用农历日期中的年月日（不推荐）
        if (solarYear === undefined) solarYear = lunarDate.year;
        if (solarMonth === undefined) solarMonth = lunarDate.month;
        if (solarDay === undefined) solarDay = lunarDate.day;
        
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
        
        // 获取吉神凶神及宜忌
        const angelDemon = getAngelDemon(lunarDate);
        
        // 合并十二建除的宜忌
        let goodThing = [...angelDemon.goodThing, ...OFFICER_THINGS[jianchu][0]];
        let badThing = [...angelDemon.badThing, ...OFFICER_THINGS[jianchu][1]];
        
        // 去重
        goodThing = [...new Set(goodThing)];
        badThing = [...new Set(badThing)];
        
        // 计算宜忌等第
        const levelInfo = getTodayThingLevel(jianchu, monthZhi, angelDemon.goodGodName, angelDemon.badGodName);
        
        // 根据等第处理宜忌
        const yiji = processYiJiByLevel(goodThing, badThing, levelInfo.thingLevel, angelDemon.goodGodName, jianchu);
        
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
        calculate: calculate
    };

})();
