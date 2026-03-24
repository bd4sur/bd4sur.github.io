/*
 * 择吉计算 - 基于《钦定协纪辨方书》的吉凶宜忌算法
 * 
 * 核心算法基于 https://github.com/OPN48/cnlunar
 * 包含：宜忌等第表、吉神凶神查找表、十二建除、二十八宿、黄黑道十二神、八字、星座等
 * 
 */

const Almanac = (function() {

    // ==================== 常量定义（严格照搬 lunar.py）====================

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

    // 天干五行
    const HEAVENLY_STEMS_5ELEMENTS = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
    
    // 地支五行
    const EARTHLY_BRANCHES_5ELEMENTS = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];

    // 纳音五行（30个，对应六十甲子每对）
    const NAYIN_5ELEMENTS = [
        '海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
        '井泉水', '屋上土', '霹雳火', '松柏木', '长流水', '砂中金', '山下火', '平地木', '壁上土', '金箔金',
        '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木', '大溪水', '砂中土', '天上火', '石榴木', '大海水'
    ];


    // 十二建除
    const TWELVE_JIANCHU = ["建", "除", "满", "平", "定", "执", "破", "危", "成", "收", "开", "闭"];

    // 二十四节气名称
    const SOLAR_TERMS_NAME_LIST = [
        "小寒", "大寒",
        "立春", "雨水", "惊蛰", "春分", "清明", "谷雨",
        "立夏", "小满", "芒种", "夏至", "小暑", "大暑",
        "立秋", "处暑", "白露", "秋分", "寒露", "霜降",
        "立冬", "小雪", "大雪", "冬至"
    ];
    
    // 节气与黄经度数对应（从冬至开始，每15度一个节气）
    // 冬至=270度，小寒=285度，大寒=300度，立春=315度...
    const SOLAR_TERMS_LONGITUDE = [285, 300, 315, 330, 345, 0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270];



    // 二十八宿（带五行属性）
    const TWENTY_EIGHT_XIU = [
        '角木蛟', '亢金龙', '氐土貉', '房日兔', '心月狐', '尾火虎', '箕水豹',
        '斗木獬', '牛金牛', '女土蝠', '虚日鼠', '危月燕', '室火猪', '壁水貐',
        '奎木狼', '娄金狗', '胃土雉', '昴日鸡', '毕月乌', '觜火猴', '参水猿',
        '井木犴', '鬼金羊', '柳土獐', '星日马', '张月鹿', '翼火蛇', '轸水蚓'
    ];

    // 十二神（黄黑道十二神）
    const TWELVE_SHEN = ["青龙", "明堂", "天刑", "朱雀", "金匮", "天德", "白虎", "玉堂", "天牢", "玄武", "司命", "勾陈"];

    // 十二时辰
    const TWELVE_HOURS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

    // 方向列表
    const DIRECTION_LIST = ['正北', '东北', '正东', '东南', '正南', '西南', '正西', '西北'];
    
    // 八卦
    const CHINESE_8_TRIGRAMS = '坎艮震巽离坤兑乾';

    // 日天干推算每日吉神方位（照搬 lunar.py）
    const LUCKY_GOD_DIRECTION = '艮乾坤离巽艮乾坤离巽';
    const WEALTH_GOD_DIRECTION = '艮艮坤坤坎坎震震离离';
    const MASCOT_GOD_DIRECTION = '坎坤乾巽艮坎坤乾巽艮';
    const SUN_NOBLE_DIRECTION = '坤坤兑乾艮坎离艮震巽';
    const MOON_NOBLE_DIRECTION = '艮坎乾兑坤坤艮离巽震';

    // 每日胎神（60个，对应六十甲子）
    const FETAL_GOD_LIST = [
        '碓磨门外东南', '碓磨厕外东南', '厨灶炉外正南', '仓库门外正南', '房床厕外正南', '占门床外正南', 
        '占碓磨外正南', '厨灶厕外西南', '仓库炉外西南', '房床门外西南', '门碓栖外西南', '碓磨床外西南',
        '厨灶碓外西南', '仓库厕外西南', '房床厕外正南', '房床炉外正西', '碓磨栖外正西', '厨灶床外正西', 
        '仓库碓外西北', '房床厕外西北', '占门炉外西北', '碓磨门外西北', '厨灶栖外西北', '仓库床外西北',
        '房床碓外正北', '占门厕外正北', '碓磨炉外正北', '厨灶门外正北', '仓库栖外正北', '占房床房内北', 
        '占门碓房内北', '碓磨门房内北', '厨灶炉房内北', '仓库门房内北', '房床栖房内中', '占门床房内中',
        '占碓磨房内南', '厨灶厕房内南', '仓库炉房内南', '房床门房内南', '门鸡栖房内东', '碓磨床房内东', 
        '厨灶碓房内东', '仓库厕房内东', '房床炉房内东', '占大门外东北', '碓磨栖外东北', '厨灶床外东北',
        '仓库碓外东北', '房床厕外东北', '占门炉外东北', '碓磨门外正东', '厨灶栖外正东', '仓库床外正东', 
        '房床碓外正东', '占门厕外正东', '碓磨炉外东南', '仓库栖外东南', '占房床外东南', '占门碓外东南'
    ];

    // 时辰吉凶表（60个十六进制数，对应六十甲子日）
    const TWO_HOUR_LUCKY_TIME_LIST = [
        0x2d3, 0xcb4, 0x32d, 0x4cb, 0xd32, 0xb4c, 0x2d3, 0xcb4, 0x32d, 0x4cb, 0xd22, 0xb5c,
        0x2d3, 0xcb4, 0x32d, 0x4cb, 0xd3a, 0xb4d, 0x2d3, 0xcb4, 0x32d, 0x4cb, 0xd32, 0xb4c,
        0x2d3, 0xcb5, 0x32d, 0x4cb, 0xd32, 0xb4c, 0x2d3, 0xcb4, 0x32d, 0x4cb, 0xd32, 0xb4c,
        0x2d3, 0xcb4, 0x32d, 0x4db, 0xd32, 0xb5c, 0x2d7, 0xcb4, 0x32d, 0x4cb, 0xd32, 0xb5c,
        0x2d3, 0xcb4, 0x32d, 0x4cb, 0xd32, 0xb4c, 0x2d3, 0xcb4, 0x30d, 0x4cb, 0xd32, 0xb4c
    ];

    // 星座名称
    const STAR_ZODIAC_NAME = ['摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', 
                              '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座'];
    
    // 星座日期分界（月, 日）
    const STAR_ZODIAC_DATE = [[1, 20], [2, 19], [3, 21], [4, 21], [5, 21], [6, 22], 
                              [7, 23], [8, 23], [9, 23], [10, 23], [11, 23], [12, 23]];

    // 彭祖百忌
    const PENG_TABOO_LIST = [
        '甲不开仓 财物耗散', '乙不栽植 千株不长', '丙不修灶 必见灾殃', '丁不剃头 头必生疮',
        '戊不受田 田主不祥', '己不破券 二比并亡', '庚不经络 织机虚张', '辛不合酱 主人不尝',
        '壬不泱水 更难提防', '癸不词讼 理弱敌强', '子不问卜 自惹祸殃', '丑不冠带 主不还乡',
        '寅不祭祀 神鬼不尝', '卯不穿井 水泉不香', '辰不哭泣 必主重丧', '巳不远行 财物伏藏',
        '午不苫盖 屋主更张', '未不服药 毒气入肠', '申不安床 鬼祟入房', '酉不会客 醉坐颠狂',
        '戌不吃犬 作怪上床', '亥不嫁娶 不利新郎'
    ];

    // 季节
    const SEASONS = ["春", "夏", "秋", "冬"];
    
    // 孟仲季月类型
    const MONTH_TYPE = ["孟", "仲", "季"];

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

    function uniqueArray(arr) {
        return [...new Set(arr)];
    }

    function addToArray(arr, items) {
        return uniqueArray([...arr, ...items]);
    }

    function removeFromArray(arr, items) {
        return arr.filter(item => !items.includes(item));
    }

    // ==================== 节气计算 ====================
    // 注：以下函数依赖 eph.js 中提供的函数
    // - julian_day(year, month, day, hour, minute, second, timezone_offset)
    // - calculate_solar_ecliptic_coordinates(jd) 返回 [黄经, 黄纬, 距离]
    
    /**
     * 使用牛顿迭代法精确计算节气时刻
     * 调用 eph.js 中的 calculate_solar_ecliptic_coordinates 函数
     * @param {number} year - 年份
     * @param {number} termIndex - 节气序号（0-23）
     * @returns {Date} 节气日期时间（北京时间）
     */
    function calcSolarTerm(year, termIndex) {
        const targetLon = SOLAR_TERMS_LONGITUDE[termIndex];
        
        // 计算该节气的大致日期（基于平均间隔15.2184天）
        // 小寒通常在1月5-7日，以此为基准
        const approxDayOfYear = termIndex * 15.2184 + 5;
        const approxMonth = Math.floor(approxDayOfYear / 30.44) + 1;
        const approxDay = Math.floor(approxDayOfYear % 30.44) + 1;
        
        // 使用 eph.js 的 julian_day 计算儒略日（UTC+8时区）
        let jd = julian_day(year, approxMonth, approxDay, 12, 0, 0, 8);
        
        // 牛顿迭代法精确求解
        for (let i = 0; i < 10; i++) {
            const sunLon = calculate_solar_ecliptic_coordinates(jd)[0];
            const diff = ((sunLon - targetLon + 180) % 360 + 360) % 360 - 180;
            if (Math.abs(diff) < 0.0001) break;
            // 太阳每天移动约0.9856度
            jd -= diff / 0.9856;
        }
        
        // 将儒略日转换回日期
        // Julian Day to Gregorian Date
        const jd_plus = jd + 0.5;
        const Z = Math.floor(jd_plus);
        const F = jd_plus - Z;
        const A = Z < 2299161 ? Z : Math.floor((Z - 1867216.25) / 36524.25) + 1;
        const B = Z + A - Math.floor(A / 4) + 1525;
        const C = Math.floor((B - 122.1) / 365.25);
        const D = Math.floor(365.25 * C);
        const E = Math.floor((B - D) / 30.6001);
        
        const day = B - D - Math.floor(30.6001 * E);
        const month = E < 14 ? E - 1 : E - 13;
        const y = month > 2 ? C - 4716 : C - 4715;
        
        // 计算时分秒（UTC+8）
        const hour = Math.floor(F * 24 + 8) % 24;
        
        return new Date(y, month - 1, day, hour);
    }
    
    /**
     * 获取指定年份的所有节气日期列表
     * 移植自 lunar.py 的 getSolarTermsDateList 方法
     * @param {number} year - 年份
     * @returns {Array} 节气日期列表，格式为 [[月,日], [月,日], ...]
     */
    function getSolarTermsDateList(year) {
        const solarTermsDateList = [];
        for (let i = 0; i < 24; i++) {
            const date = calcSolarTerm(year, i);
            solarTermsDateList.push([date.getMonth() + 1, date.getDate()]);
        }
        return solarTermsDateList;
    }
    
    /**
     * 计算 nextSolarNum（下一节气的序号）
     * 移植自 lunar.py 的 getNextNum 方法
     * @param {Array} findDate - [月, 日]
     * @param {Array} solarTermsDateList - 节气日期列表
     * @returns {number} 下一节气序号（0-23）
     */
    function getNextSolarNum(findDate, solarTermsDateList) {
        let count = 0;
        for (let i = 0; i < solarTermsDateList.length; i++) {
            const term = solarTermsDateList[i];
            if (term[0] < findDate[0] || (term[0] === findDate[0] && term[1] <= findDate[1])) {
                count++;
            } else {
                break;
            }
        }
        return count % 24;
    }
    
    /**
     * 获取当天的节气信息
     * 移植自 lunar.py 的 get_todaySolarTerms 方法
     * @param {number} year - 年份
     * @param {number} month - 月份
     * @param {number} day - 日
     * @returns {Object} 节气信息对象
     */
    function getTodaySolarTerms(year, month, day) {
        const solarTermsDateList = getSolarTermsDateList(year);
        const findDate = [month, day];
        const nextSolarNum = getNextSolarNum(findDate, solarTermsDateList);
        
        // 检查当天是否是节气
        let todaySolarTerm = "无";
        let todaySolarTermIndex = -1;
        for (let i = 0; i < solarTermsDateList.length; i++) {
            if (solarTermsDateList[i][0] === month && solarTermsDateList[i][1] === day) {
                todaySolarTerm = SOLAR_TERMS_NAME_LIST[i];
                todaySolarTermIndex = i;
                break;
            }
        }
        
        // 次年节气（如果当前日期在当年最后一个节气之后）
        let nextYear = year;
        let nextYearTerms = solarTermsDateList;
        const lastTerm = solarTermsDateList[solarTermsDateList.length - 1];
        if (month > lastTerm[0] || (month === lastTerm[0] && day >= lastTerm[1])) {
            nextYear = year + 1;
            nextYearTerms = getSolarTermsDateList(nextYear);
        }
        
        const nextSolarTerm = SOLAR_TERMS_NAME_LIST[nextSolarNum];
        const nextSolarTermDate = nextYearTerms[nextSolarNum];
        
        return {
            todaySolarTerm: todaySolarTerm,
            todaySolarTermIndex: todaySolarTermIndex,
            nextSolarTerm: nextSolarTerm,
            nextSolarTermDate: nextSolarTermDate,
            nextSolarTermYear: nextYear,
            nextSolarNum: nextSolarNum,
            thisYearSolarTermsDateList: solarTermsDateList
        };
    }

    // ==================== 八字计算 ====================

    function calculate8Char(year, month, day, hour, lunarDate) {
        const yearGan = lunarDate.year_ganzhi[0];
        const yearZhi = lunarDate.year_ganzhi[1];
        const monthGan = lunarDate.month_ganzhi[0];
        const monthZhi = lunarDate.month_ganzhi[1];
        const dayGan = lunarDate.day_ganzhi[0];
        const dayZhi = lunarDate.day_ganzhi[1];
        
        let hourZhiIndex;
        if (hour >= 23 || hour < 1) hourZhiIndex = 0;
        else if (hour < 3) hourZhiIndex = 1;
        else if (hour < 5) hourZhiIndex = 2;
        else if (hour < 7) hourZhiIndex = 3;
        else if (hour < 9) hourZhiIndex = 4;
        else if (hour < 11) hourZhiIndex = 5;
        else if (hour < 13) hourZhiIndex = 6;
        else if (hour < 15) hourZhiIndex = 7;
        else if (hour < 17) hourZhiIndex = 8;
        else if (hour < 19) hourZhiIndex = 9;
        else if (hour < 21) hourZhiIndex = 10;
        else hourZhiIndex = 11;
        
        const hourZhi = DI_ZHI[hourZhiIndex];
        
        const dayGanIndex = getGanIndex(dayGan);
        let hourGanStart;
        if (dayGanIndex === 0 || dayGanIndex === 5) hourGanStart = 0;
        else if (dayGanIndex === 1 || dayGanIndex === 6) hourGanStart = 2;
        else if (dayGanIndex === 2 || dayGanIndex === 7) hourGanStart = 4;
        else if (dayGanIndex === 3 || dayGanIndex === 8) hourGanStart = 6;
        else hourGanStart = 8;
        
        const hourGan = TIAN_GAN[(hourGanStart + hourZhiIndex) % 10];
        const hourGanzhi = hourGan + hourZhi;
        
        return {
            year: { gan: yearGan, zhi: yearZhi, ganzhi: yearGan + yearZhi },
            month: { gan: monthGan, zhi: monthZhi, ganzhi: monthGan + monthZhi },
            day: { gan: dayGan, zhi: dayZhi, ganzhi: dayGan + dayZhi },
            hour: { gan: hourGan, zhi: hourZhi, ganzhi: hourGanzhi },
            display: `${yearGan}${yearZhi} ${monthGan}${monthZhi} ${dayGan}${dayZhi} ${hourGan}${hourZhi}`,
            shortDisplay: `${yearGan}${yearZhi}年 ${monthGan}${monthZhi}月 ${dayGan}${dayZhi}日 ${hourGan}${hourZhi}时`
        };
    }

    function getTwoHour8CharList(dayGanzhi) {
        const dayIndex = getGanzhiIndex(dayGanzhi);
        const begin = (dayIndex * 12) % 60;
        const result = [];
        for (let i = 0; i < 13; i++) {
            result.push(SIXTY_JIAZI[(begin + i) % 60]);
        }
        return result;
    }

    // ==================== 星座计算 ====================

    function calculateStarZodiac(month, day) {
        let count = 0;
        for (let i = 0; i < STAR_ZODIAC_DATE.length; i++) {
            const [m, d] = STAR_ZODIAC_DATE[i];
            if (month < m || (month === m && day < d)) {
                break;
            }
            count++;
        }
        return STAR_ZODIAC_NAME[count % 12];
    }

    // ==================== 十二建除 ====================

    function calculateJianchu(monthZhi, dayZhi) {
        const monthIdx = getZhiIndex(monthZhi);
        const dayIdx = getZhiIndex(dayZhi);
        let offset = dayIdx - monthIdx;
        if (offset < 0) offset += 12;
        return TWELVE_JIANCHU[offset];
    }

    // ==================== 二十八宿 ====================
    // 注意：输入是公历年月日
    function calculateXiu(year, month, day) {
        const baseDate = new Date(2019, 0, 17);
        const currentDate = new Date(year, month - 1, day);
        const diffDays = Math.floor((currentDate - baseDate) / (24 * 60 * 60 * 1000));
        const idx = ((diffDays % 28) + 28) % 28;
        return TWENTY_EIGHT_XIU[idx];
    }

    // ==================== 十二神 ====================

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

    // ==================== 九宫飞星 ====================

    function calculate9FlyStar(year, month, day) {
        const baseDate = new Date(2019, 0, 17);
        const currentDate = new Date(year, month - 1, day);
        const apartNum = Math.floor((currentDate - baseDate) / (24 * 60 * 60 * 1000));
        const startNumList = [7, 3, 5, 6, 8, 1, 2, 4, 9];
        const flyStarList = startNumList.map(i => String((i - 1 - apartNum) % 9 + 1));
        return flyStarList.join('');
    }

    // ==================== 吉神方位 ====================

    function calculateLuckyGodsDirection(dayGan) {
        const todayNum = getGanIndex(dayGan);
        return [
            '喜神' + DIRECTION_LIST[CHINESE_8_TRIGRAMS.indexOf(LUCKY_GOD_DIRECTION[todayNum])],
            '财神' + DIRECTION_LIST[CHINESE_8_TRIGRAMS.indexOf(WEALTH_GOD_DIRECTION[todayNum])],
            '福神' + DIRECTION_LIST[CHINESE_8_TRIGRAMS.indexOf(MASCOT_GOD_DIRECTION[todayNum])],
            '阳贵' + DIRECTION_LIST[CHINESE_8_TRIGRAMS.indexOf(SUN_NOBLE_DIRECTION[todayNum])],
            '阴贵' + DIRECTION_LIST[CHINESE_8_TRIGRAMS.indexOf(MOON_NOBLE_DIRECTION[todayNum])]
        ];
    }

    // ==================== 胎神 ====================

    function calculateFetalGod(dayGanzhi) {
        return FETAL_GOD_LIST[getGanzhiIndex(dayGanzhi)];
    }

    // ==================== 时辰吉凶 ====================

    function calculateTwoHourLuckyList(dayGanzhi) {
        function tmp2List(tmp) {
            return Array.from({length: 12}, (_, i) => {
                return (tmp & (2 ** (11 - i))) > 0 ? '凶' : '吉';
            });
        }
        
        const todayNum = getGanzhiIndex(dayGanzhi);
        const tomorrowNum = (todayNum + 1) % 60;
        const outputList = [...tmp2List(TWO_HOUR_LUCKY_TIME_LIST[todayNum]), 
                           ...tmp2List(TWO_HOUR_LUCKY_TIME_LIST[tomorrowNum])];
        return outputList.slice(0, 13);
    }

    // ==================== 当日五行 ====================

    function calculateToday5Elements(dayGanzhi, today28Star, today12DayOfficer) {
        const nayinIndex = Math.floor(getGanzhiIndex(dayGanzhi) / 2);
        const nayin = NAYIN_5ELEMENTS[nayinIndex];
        const dayGan = dayGanzhi[0];
        const dayZhi = dayGanzhi[1];
        const dayHeavenNum = getGanIndex(dayGan);
        const dayEarthNum = getZhiIndex(dayZhi);
        
        return {
            tiangan: { name: dayGan, element: HEAVENLY_STEMS_5ELEMENTS[dayHeavenNum] },
            dizhi: { name: dayZhi, element: EARTHLY_BRANCHES_5ELEMENTS[dayEarthNum] },
            nayin: { name: nayin, element: nayin.slice(-1) },
            xiu: today28Star,
            jianchu: today12DayOfficer,
            display: [
                '天干', dayGan, '属' + HEAVENLY_STEMS_5ELEMENTS[dayHeavenNum],
                '地支', dayZhi, '属' + EARTHLY_BRANCHES_5ELEMENTS[dayEarthNum],
                '纳音', nayin, '属' + nayin.slice(-1),
                '廿八宿', today28Star[0], '宿',
                '十二神', today12DayOfficer, '日'
            ]
        };
    }

    // ==================== 彭祖百忌 ====================

    function calculatePengTaboo(dayGanzhi) {
        const dayGan = dayGanzhi[0];
        const dayZhi = dayGanzhi[1];
        const dayHeavenNum = getGanIndex(dayGan);
        const dayEarthNum = getZhiIndex(dayZhi);
        return {
            gan: PENG_TABOO_LIST[dayHeavenNum],
            zhi: PENG_TABOO_LIST[dayEarthNum + 10],
            display: PENG_TABOO_LIST[dayHeavenNum] + '，' + PENG_TABOO_LIST[dayEarthNum + 10]
        };
    }

    // ==================== 季节和月类型 ====================

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

    // ==================== 宜忌等第计算 ====================

    /**
     * 计算今日宜忌等第
     * 移植自 lunar.py 的 getTodayThingLevel 方法
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
            thingLevel = 1; // 无，从宜不从忌
        }
        
        return {
            level: l,
            thingLevel: thingLevel,
            isDe: isDe
        };
    }

    // ==================== 吉神凶神查找表 ====================

    // 十二建除宜忌表（来自 lunar.py 的 officerThings）
    const OFFICER_THINGS_LUNAR = {
        "建": [
            ["施恩", "招贤", "举正直", "出行", "上官", "临政"],
            ["开仓"]
        ],
        "除": [
            ["解除", "沐浴", "整容", "剃头", "整手足甲", "求医疗病", "扫舍宇"],
            ["畋猎", "取鱼"]
        ],
        "满": [
            ["进人口", "裁制", "竖柱上梁", "经络", "开市", "立券交易", "纳财", "开仓", "塞穴", "补垣"],
            ["施恩", "招贤", "举正直", "上官", "临政", "结婚姻", "纳采", "求医疗病"]
        ],
        "平": [
            ["修饰垣墙", "平治道涂"],
            ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事", "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将",
             "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除", "求医疗病", "裁制", "营建", "修宫室", "缮城郭",
             "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "栽种",
             "牧养", "纳畜", "破土", "安葬", "启攒"]
        ],
        "定": [
            ["冠带"],
            []
        ],
        "执": [
            ["捕捉"],
            []
        ],
        "破": [
            ["求医疗病"],
            []
        ],
        "危": [
            ["安抚边境", "选将", "安床"],
            []
        ],
        "成": [
            ["入学", "安抚边境", "搬移", "筑堤防", "开市"],
            []
        ],
        "收": [
            ["进人口", "纳财", "捕捉", "纳畜"],
            ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事", "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将",
             "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "搬移", "安床", "解除", "求医疗病", "裁制", "营建", "修宫室", "缮城郭", "筑堤防", "修造",
             "竖柱上梁", "鼓铸", "经络", "酝酿", "开市", "立券交易", "开仓", "修置产室", "开渠", "穿井", "破土", "安葬", "启攒"]
        ],
        "开": [
            ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "入学",
             "出行", "上官", "临政", "搬移", "解除", "求医疗病", "裁制", "修宫室", "缮城郭", "修造", "修仓库", "开市", "修置产室", "开渠", "穿井", "安碓硙", "栽种",
             "牧养"],
            ["破土", "安葬", "捕捉", "畋猎", "取鱼"]
        ],
        "闭": [
            ["筑堤防", "塞穴", "补垣"],
            ["上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事", "庆赐", "宴会", "出行", "出师", "上官", "临政", "结婚姻", "纳采",
             "嫁娶", "进人口", "搬移", "安床", "求医疗病", "疗目", "营建", "修宫室", "修造", "竖柱上梁", "开市", "开仓", "修置产室", "开渠", "穿井"]
        ]
    };

    // 日干支特定宜忌（来自 lunar.py 的 day8CharThing）
    const DAY_8CHAR_THING = {
        "甲": [[], ["开仓"]],
        "乙": [[], ["栽种"]],
        "丁": [[], ["整容", "剃头"]],
        "庚": [[], ["经络"]],
        "辛": [[], ["酝酿"]],
        "壬": [[], ["开渠", "穿井"]],
        "子": [["沐浴"], []],
        "丑": [[], ["冠带"]],
        "寅": [[], ["祭祀"]],
        "卯": [[], ["穿井"]],
        "酉": [[], ["宴会"]],
        "巳": [[], ["出行"]],
        "午": [[], ["苫盖"]],
        "未": [[], ["求医疗病"]],
        "申": [[], ["安床"]],
        "亥": [["沐浴"], ["嫁娶"]]
    };

    // 不将日表（来自 lunar.py 的 bujiang）
    const BU_JIANG_TABLE = [
        "壬寅壬辰辛丑辛卯辛巳庚寅庚辰丁丑丁卯丁巳戊寅戊辰",
        "辛丑辛卯庚子庚寅庚辰丁丑丁卯丙子丙寅丙辰戊子戊寅戊辰",
        "辛亥辛丑辛卯庚子庚寅丁亥丁丑丁卯丙子丙寅戊子戊寅",
        "庚戌庚子庚寅丁亥丁丑丙戌丙子丙寅乙亥乙丑戊戌戊子戊寅",
        "丁酉丁亥丁丑丙戌丙子乙酉乙亥乙丑甲戌甲子戊戌戊子",
        "丁酉丁亥丙申丙戌丙子乙酉乙亥甲申甲戌甲子戊申戊戌戊子",
        "丙申丙戌乙未乙酉乙亥甲申甲戌癸未癸酉癸亥戊申戊戌",
        "乙未乙酉甲午甲申甲戌癸未癸酉壬午壬申壬戌戊午戊申戊戌",
        "乙巳乙未乙酉甲午甲申癸巳癸未癸酉壬午壬申戊午戊申",
        "甲辰甲午甲申癸巳癸未壬辰壬午壬申辛巳辛未戊辰戊午戊申",
        "癸卯癸巳癸未壬辰壬午辛卯辛巳辛未庚辰庚午戊辰戊午",
        "癸卯癸巳壬寅壬辰壬午辛卯辛巳庚寅庚辰庚午戊寅戊辰戊午"
    ];

    // 宜忌排序表（来自 lunar.py 的 thingsSort）
    const THINGS_SORT = [
        "祭祀", "出行", "移徙", "结婚姻", "宴会", "嫁娶", "安床", "沐浴", "剃头", "修造", "求医疗病", "上表章", "上官", "入学", "冠带", "进人口",
        "裁衣", "竖柱上梁", "经络", "开市", "立券", "交易", "纳财", "修置产室", "开渠", "穿井", "安碓硙", "扫舍宇", "平治道涂", "破屋坏垣", "伐木", "捕捉",
        "畋猎", "栽种", "牧养", "破土", "安葬", "启攒"
    ];

    // 排序函数
    function sortCollation(x) {
        const idx = THINGS_SORT.indexOf(x);
        return idx !== -1 ? idx : THINGS_SORT.length + 1;
    }

    function getAngelDemon(lunarDate, solarYear, solarMonth, solarDay, nextSolarNum, phaseOfMoon) {
        const yearGan = lunarDate.year_ganzhi[0];
        const yearZhi = lunarDate.year_ganzhi[1];
        const monthGan = lunarDate.month_ganzhi[0];
        const monthZhi = lunarDate.month_ganzhi[1];
        const dayGan = lunarDate.day_ganzhi[0];
        const dayZhi = lunarDate.day_ganzhi[1];
        const ganzhi = dayGan + dayZhi;
        const d = ganzhi;
        
        const yhn = getGanIndex(yearGan);
        const yen = getZhiIndex(yearZhi);
        const men = getZhiIndex(monthZhi);
        const dhen = getGanzhiIndex(ganzhi);
        const den = getZhiIndex(dayZhi);
        
        const sn = getSeason(monthZhi);
        const monthType = getMonthType(monthZhi);
        
        const lmn = lunarDate.month;
        const ldn = lunarDate.day;
        
        // 计算二十八宿
        const xiu = calculateXiu(solarYear, solarMonth, solarDay);
        
        // 计算十二建除
        const jianchu = calculateJianchu(monthZhi, dayZhi);
        
        // 初始化宜忌字典
        let gbDic = {
            goodName: [],
            badName: [],
            goodThing: [...OFFICER_THINGS_LUNAR[jianchu][0]],
            badThing: [...OFFICER_THINGS_LUNAR[jianchu][1]]
        };

        // ===== 日干支特定宜忌 =====
        for (let key in DAY_8CHAR_THING) {
            if (d.includes(key)) {
                gbDic.goodThing = addToArray(gbDic.goodThing, DAY_8CHAR_THING[key][0]);
                gbDic.badThing = addToArray(gbDic.badThing, DAY_8CHAR_THING[key][1]);
            }
        }

        // ===== 卷十一拆解规则 =====
        // 雨水后立夏前执日、危日、收日 宜 取鱼
        if (nextSolarNum >= 4 && nextSolarNum < 9 && ["执", "危", "收"].includes(jianchu)) {
            gbDic.goodThing = addToArray(gbDic.goodThing, ["取鱼"]);
        }
        // 霜降后立春前执日、危日、收日 宜 畋猎
        if ((nextSolarNum >= 20 || nextSolarNum < 3) && ["执", "危", "收"].includes(jianchu)) {
            gbDic.goodThing = addToArray(gbDic.goodThing, ["畋猎"]);
        }
        // 立冬后立春前危日 午日 申日 宜 伐木
        if ((nextSolarNum >= 21 || nextSolarNum < 3) && (["危"].includes(jianchu) || ["午", "申"].includes(d))) {
            gbDic.goodThing = addToArray(gbDic.goodThing, ["伐木"]);
        }
        // 每月一日 六日 十五 十九日 二十一日 二十三日 忌 整手足甲
        if ([1, 6, 15, 19, 21, 23].includes(ldn)) {
            gbDic.badThing = addToArray(gbDic.badThing, ["整手足甲"]);
        }
        // 每月十二日 十五日 忌 整容剃头
        if ([12, 15].includes(ldn)) {
            gbDic.badThing = addToArray(gbDic.badThing, ["整容", "剃头"]);
        }
        // 每月十五日 朔弦望月 忌 求医疗病
        if (ldn === 15 || phaseOfMoon !== "") {
            gbDic.badThing = addToArray(gbDic.badThing, ["求医疗病"]);
        }

        // ===== 吉神查找表（angel）=====
        const angel = [
            // 岁德
            ["岁德", "甲庚丙壬戊甲庚丙壬戊"[yhn], d, ["修造"], []],
            // 岁德合
            ["岁德合", "己乙辛丁癸己乙辛丁癸"[yhn], d, ["修造"], []],
            // 月德
            ["月德", "壬庚丙甲壬庚丙甲壬庚丙甲"[men], dayGan, 
             ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行",
              "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭", "修造", "竖柱上梁",
              "修仓库", "栽种", "牧养", "纳畜", "安葬"], ["畋猎", "取鱼"]],
            // 月德合
            ["月德合", "丁乙辛己丁乙辛己丁乙辛己"[men], dayGan,
             ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行",
              "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭", "修造", "竖柱上梁",
              "修仓库", "栽种", "牧养", "纳畜", "安葬"], ["畋猎", "取鱼"]],
            // 天德
            ["天德", monthType === 1 ? dayGan : dayZhi, ["巳", "庚", "丁", "申", "壬", "辛", "亥", "甲", "癸", "寅", "丙", "乙"][men],
             ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行",
              "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭", "修造", "竖柱上梁",
              "修仓库", "栽种", "牧养", "纳畜", "安葬"], ["畋猎", "取鱼"]],
            // 天德合
            ["天德合", "空乙壬空丁丙空己戊空辛庚"[men], d,
             ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行",
              "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭", "修造", "竖柱上梁",
              "修仓库", "栽种", "牧养", "纳畜", "安葬"], ["畋猎", "取鱼"]],
            // 凤凰日
            ["凤凰日", xiu[0], "危昴胃毕"[sn], ["嫁娶"], []],
            // 麒麟日
            ["麒麟日", xiu[0], "井尾牛壁"[sn], ["嫁娶"], []],
            // 三合
            ["三合", (den - men + 12) % 4 === 0, [true],
             ["庆赐", "宴会", "结婚姻", "纳采", "嫁娶", "进人口", "裁制", "修宫室", "缮城郭", "修造", "竖柱上梁", "修仓库", "经络", "酝酿", "立券交易", "纳财",
              "安碓硙", "纳畜"], []],
            // 四相
            ["四相", dayGan, ["丙丁", "戊己", "壬癸", "甲乙"][sn],
             ["祭祀", "祈福", "求嗣", "施恩", "举正直", "庆赐", "宴会", "出行", "上官", "临政", "结婚姻", "纳采", "搬移", "解除", "求医疗病", "裁制", "修宫室",
              "缮城郭", "修造", "竖柱上梁", "纳财", "开仓", "栽种", "牧养"], []],
            // 五合
            ["五合", dayZhi, "寅卯", ["宴会", "结婚姻", "立券交易"], []],
            // 五富
            ["五富", "巳申亥寅巳申亥寅巳申亥寅"[men], d, ["经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "栽种", "牧养", "纳畜"], []],
            // 六合
            ["六合", "丑子亥戌酉申未午巳辰卯寅"[men], dayZhi, ["宴会", "结婚姻", "嫁娶", "进人口", "经络", "酝酿", "立券交易", "纳财", "纳畜", "安葬"], []],
            // 六仪
            ["六仪", "午巳辰卯寅丑子亥戌酉申未"[men], dayZhi, ["临政"], []],
            // 不将
            ["不将", d, BU_JIANG_TABLE[men], ["嫁娶"], []],
            // 时德
            ["时德", "午辰子寅"[sn], dayZhi,
             ["祭祀", "祈福", "求嗣", "施恩", "举正直", "庆赐", "宴会", "出行", "上官", "临政", "结婚姻", "纳采", "搬移", "解除", "求医疗病", "裁制", "修宫室",
              "缮城郭", "修造", "竖柱上梁", "纳财", "开仓", "栽种", "牧养"], []],
            // 大葬
            ["大葬", d, "壬申癸酉壬午甲申乙酉丙申丁酉壬寅丙午己酉庚申辛酉", ["安葬"], []],
            // 鸣吠
            ["鸣吠", d, "庚午壬申癸酉壬午甲申乙酉己酉丙申丁酉壬寅丙午庚寅庚申辛酉", ["破土", "安葬"], []],
            // 小葬
            ["小葬", d, "庚午壬辰甲辰乙巳甲寅丙辰庚寅", ["安葬"], []],
            // 鸣吠对
            ["鸣吠对", d, "丙寅丁卯丙子辛卯甲午庚子癸卯壬子甲寅乙卯", ["破土", "启攒"], []],
            // 不守塚
            ["不守塚", d, "庚午辛未壬申癸酉戊寅己卯壬午癸未甲申乙酉丁未甲午乙未丙申丁酉壬寅癸卯丙午戊申己酉庚申辛酉", ["破土"], []],
            // 王日
            ["王日", "寅巳申亥"[sn], dayZhi,
             ["颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行", "安抚边境", "选将", "上官", "临政", "裁制"], []],
            // 官日
            ["官日", "卯午酉子"[sn], dayZhi, ["上官", "临政"], []],
            // 守日
            ["守日", "酉子卯午"[sn], dayZhi, ["安抚边境", "上官", "临政"], []],
            // 相日
            ["相日", "巳申亥寅"[sn], dayZhi, ["上官", "临政"], []],
            // 民日
            ["民日", "午酉子卯"[sn], dayZhi, ["宴会", "结婚姻", "纳采", "进人口", "搬移", "开市", "立券交易", "纳财", "栽种", "牧养", "纳畜"], []],
            // 临日
            ["临日", "辰酉午亥申丑戌卯子巳寅未"[men], d, ["上册", "上表章", "上官", "临政"], []],
            // 天贵
            ["天贵", dayGan, ["甲乙", "丙丁", "庚辛", "壬癸"][sn], [], []],
            // 天喜
            ["天喜", "申酉戌亥子丑寅卯辰巳午未"[men], dayZhi, ["施恩", "举正直", "庆赐", "宴会", "出行", "上官", "临政", "结婚姻", "纳采", "嫁娶"], []],
            // 天富
            ["天富", "寅卯辰巳午未申酉戌亥子丑"[men], d, ["安葬", "修仓库"], []],
            // 天恩
            ["天恩", dhen % 15 < 5 && Math.floor(dhen / 15) !== 2, [true], ["覃恩", "恤孤茕", "布政事", "雪冤", "庆赐", "宴会"], []],
            // 月恩
            ["月恩", "甲辛丙丁庚己戊辛壬癸庚乙"[men], d,
             ["祭祀", "祈福", "求嗣", "施恩", "举正直", "庆赐", "宴会", "出行", "上官", "临政", "结婚姻", "纳采", "搬移", "解除", "求医疗病", "裁制", "修宫室",
              "缮城郭", "修造", "竖柱上梁", "纳财", "开仓", "栽种", "牧养"], []],
            // 天赦
            ["天赦", ["甲子", "甲子", "戊寅", "戊寅", "戊寅", "甲午", "甲午", "甲午", "戊申", "戊申", "戊申", "甲子"][men], d,
             ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行",
              "安抚边境", "选将", "上官", "临政", "结婚姻", "纳采", "嫁娶", "搬移", "解除", "求医疗病", "裁制", "营建", "缮城郭", "修造", "竖柱上梁", "修仓库",
              "栽种", "牧养", "纳畜", "安葬"], ["畋猎", "取鱼"]],
            // 天愿
            ["天愿", ["甲子", "癸未", "甲午", "甲戌", "乙酉", "丙子", "丁丑", "戊午", "甲寅", "丙辰", "辛卯", "戊辰"][men], d,
             ["祭祀", "祈福", "求嗣", "上册", "上表章", "颁诏", "覃恩", "施恩", "招贤", "举正直", "恤孤茕", "宣政事", "雪冤", "庆赐", "宴会", "出行",
              "安抚边境", "选将", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "裁制", "营建", "缮城郭", "修造", "竖柱上梁", "修仓库", "经络",
              "酝酿", "开市", "立券交易", "纳财", "栽种", "牧养", "纳畜", "安葬"], []],
            // 天成
            ["天成", "卯巳未酉亥丑卯巳未酉亥丑"[men], d, [], []],
            // 天官
            ["天官", "午申戌子寅辰午申戌子寅辰"[men], d, [], []],
            // 天医
            ["天医", "亥子丑寅卯辰巳午未申酉戌"[men], dayZhi, ["求医疗病"], []],
            // 天马
            ["天马", "寅辰午申戌子寅辰午申戌子"[men], dayZhi, ["出行", "搬移"], []],
            // 驿马
            ["驿马", "寅亥申巳寅亥申巳寅亥申巳"[men], dayZhi, ["出行", "搬移"], []],
            // 天财
            ["天财", "子寅辰午申戌子寅辰午申戌"[men], dayZhi, [], []],
            // 福生
            ["福生", "寅申酉卯戌辰亥巳子午丑未"[men], dayZhi, ["祭祀", "祈福"], []],
            // 福厚
            ["福厚", "寅巳申亥"[sn], d, [], []],
            // 福德
            ["福德", "寅卯辰巳午未申酉戌亥子丑"[men], dayZhi, ["上册", "上表章", "庆赐", "宴会", "修宫室", "缮城郭"], []],
            // 天巫
            ["天巫", "寅卯辰巳午未申酉戌亥子丑"[men], dayZhi, ["求医疗病"], []],
            // 地财
            ["地财", "丑卯巳未酉亥丑卯巳未酉亥"[men], dayZhi, [], []],
            // 月财
            ["月财", "酉亥午巳巳未酉亥午巳巳未"[men], dayZhi, [], []],
            // 月空
            ["月空", "丙甲壬庚丙甲壬庚丙甲壬庚"[men], dayGan, ["上表章"], []],
            // 母仓
            ["母仓", dayZhi, ["亥子", "寅卯", "辰丑戌未", "申酉"][sn], ["纳财", "栽种", "牧养", "纳畜"], []],
            // 明星
            ["明星", "辰午甲戌子寅辰午甲戌子寅"[men], dayZhi, ["赴任", "诉讼", "安葬"], []],
            // 圣心
            ["圣心", "辰戌亥巳子午丑未寅申卯酉"[men], dayZhi, ["祭祀", "祈福"], []],
            // 禄库
            ["禄库", "寅卯辰巳午未申酉戌亥子丑"[men], dayZhi, ["纳财"], []],
            // 吉庆
            ["吉庆", "未子酉寅亥辰丑午卯申巳戌"[men], dayZhi, [], []],
            // 阴德
            ["阴德", "丑亥酉未巳卯丑亥酉未巳卯"[men], dayZhi, ["恤孤茕", "雪冤"], []],
            // 活曜
            ["活曜", "卯申巳戌未子酉寅亥辰丑午"[men], dayZhi, [], []],
            // 除神
            ["除神", dayZhi, "申酉", ["解除", "沐浴", "整容", "剃头", "整手足甲", "求医疗病", "扫舍宇"], []],
            // 解神
            ["解神", "午午申申戌戌子子寅寅辰辰"[men], dayZhi, ["上表章", "解除", "沐浴", "整容", "剃头", "整手足甲", "求医疗病"], []],
            // 生气
            ["生气", "戌亥子丑寅卯辰巳午未申酉"[men], dayZhi, [], ["伐木", "畋猎", "取鱼"]],
            // 普护
            ["普护", "丑卯申寅酉卯戌辰亥巳子午"[men], dayZhi, ["祭祀", "祈福"], []],
            // 益后
            ["益后", "巳亥子午丑未寅申卯酉辰戌"[men], dayZhi, ["祭祀", "祈福", "求嗣"], []],
            // 续世
            ["续世", "午子丑未寅申卯酉辰戌巳亥"[men], dayZhi, ["祭祀", "祈福", "求嗣"], []],
            // 要安
            ["要安", "未丑寅申卯酉辰戌巳亥午子"[men], dayZhi, [], []],
            // 天后
            ["天后", "寅亥申巳寅亥申巳寅亥申巳"[men], dayZhi, ["求医疗病"], []],
            // 天仓
            ["天仓", "辰卯寅丑子亥戌酉申未午巳"[men], dayZhi, ["进人口", "纳财", "纳畜"], []],
            // 敬安
            ["敬安", "子午未丑申寅酉卯戌辰亥巳"[men], dayZhi, [], []],
            // 玉宇
            ["玉宇", "申寅卯酉辰戌巳亥午子未丑"[men], dayZhi, [], []],
            // 金堂
            ["金堂", "酉卯辰戌巳亥午子未丑申寅"[men], dayZhi, [], []],
            // 吉期
            ["吉期", "丑寅卯辰巳午未申酉戌亥子"[men], dayZhi, ["施恩", "举正直", "出行", "上官", "临政"], []],
            // 小时、兵福、兵宝
            ["小时", "子丑寅卯辰巳午未申酉戌亥"[men], dayZhi, [], []],
            ["兵福", "子丑寅卯辰巳午未申酉戌亥"[men], dayZhi, ["安抚边境", "选将", "出师"], []],
            ["兵宝", "丑寅卯辰巳午未申酉戌亥子"[men], dayZhi, ["安抚边境", "选将", "出师"], []],
            // 兵吉
            ["兵吉", dayZhi,
             ["寅卯辰巳", "丑寅卯辰", "子丑寅卯", "亥子丑寅", "戌亥子丑", "酉戌亥子", "申酉戌亥", "未申酉戌", "午未申酉", "巳午未申", "辰巳午未", "卯辰巳午"][men],
             ["安抚边境", "选将", "出师"], []]
        ];

        // ===== 凶神查找表（demon）=====
        const demon = [
            // 岁破
            ["岁破", den === (yen + 6) % 12, [true], [], ["修造", "搬移", "嫁娶", "出行"]],
            // 天罡
            ["天罡", "卯戌巳子未寅"[men % 6], dayZhi, [], ["安葬"]],
            // 河魁
            ["河魁", "酉辰亥午丑申"[men % 6], dayZhi, [], ["安葬"]],
            // 死神
            ["死神", "卯辰巳午未申酉戌亥子丑寅"[men], dayZhi, [], ["安抚边境", "选将", "出师", "进人口", "解除", "求医疗病", "修置产室", "栽种", "牧养", "纳畜"]],
            // 死气
            ["死气", "辰巳午未申酉戌亥子丑寅卯"[men], dayZhi, [], ["安抚边境", "选将", "出师", "解除", "求医疗病", "修置产室", "栽种"]],
            // 伏兵
            ["伏兵", "丙甲壬庚"[yen % 4], dayGan, [], ["修仓库", "修造", "出师"]],
            // 官符
            ["官符", "辰巳午未申酉戌亥子丑寅卯"[men], dayZhi, [], ["上表章", "上册"]],
            // 月建
            ["月建", "子丑寅卯辰巳午未申酉戌亥"[men], dayZhi, [],
             ["祈福", "求嗣", "上册", "上表章", "结婚姻", "纳采", "解除", "整容", "剃头", "整手足甲", "求医疗病", "营建", "修宫室", "缮城郭", "修造", "竖柱上梁",
              "修仓库", "开仓", "修置产室", "破屋坏垣", "伐木", "栽种", "破土", "安葬", "启攒"]],
            // 月破
            ["月破", "午未申酉戌亥子丑寅卯辰巳"[men], dayZhi, ["破屋坏垣"],
             ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事", "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将",
              "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "整容", "剃头", "整手足甲", "裁制", "营建", "修宫室", "缮城郭",
              "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴",
              "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "伐木", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]],
            // 月煞
            ["月煞", "未辰丑戌未辰丑戌未辰丑戌"[men], dayZhi, [],
             ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事", "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将",
              "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制", "营建",
              "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井",
              "安碓硙", "塞穴", "补垣", "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "安葬"]],
            // 月害
            ["月害", "未午巳辰卯寅丑子亥戌酉申"[men], dayZhi, [],
             ["祈福", "求嗣", "上册", "上表章", "庆赐", "宴会", "安抚边境", "选将", "出师", "上官", "纳采", "嫁娶", "进人口", "求医疗病", "修仓库", "经络",
              "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "牧养", "纳畜", "破土", "安葬", "启攒"]],
            // 月刑
            ["月刑", "卯戌巳子辰申午丑寅酉未亥"[men], dayZhi, [],
             ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事", "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将",
              "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制", "营建",
              "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井",
              "安碓硙", "塞穴", "补垣", "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]],
            // 月厌
            ["月厌", "子亥戌酉申未午巳辰卯寅丑"[men], dayZhi, [],
             ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事", "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将",
              "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "远回", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制",
              "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠",
              "穿井", "安碓硙", "塞穴", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "伐木", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]],
            // 月忌
            ["月忌", ldn, [5, 14, 23], [], ["出行", "乘船渡水"]],
            // 月虚
            ["月虚", "未辰丑戌未辰丑戌未辰丑戌"[men], dayZhi, [], ["修仓库", "纳财", "开仓"]],
            // 灾煞
            ["灾煞", "午卯子酉午卯子酉午卯子酉"[men], dayZhi, [],
             ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事", "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将",
              "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制", "营建",
              "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井",
              "安碓硙", "塞穴", "补垣", "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]],
            // 劫煞
            ["劫煞", "巳寅亥申巳寅亥申巳寅亥申"[men], dayZhi, [],
             ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事", "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将",
              "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除", "整容", "剃头", "整手足甲", "求医疗病", "裁制", "营建",
              "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井",
              "安碓硙", "塞穴", "补垣", "修饰垣墙", "破屋坏垣", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]],
            // 厌对、招摇
            ["厌对", "午巳辰卯寅丑子亥戌酉申未"[men], dayZhi, [], ["嫁娶"]],
            ["招摇", "午巳辰卯寅丑子亥戌酉申未"[men], dayZhi, [], ["取鱼", "乘船渡水"]],
            // 小红砂
            ["小红砂", "酉丑巳酉丑巳酉丑巳酉丑巳"[men], dayZhi, [], ["嫁娶"]],
            // 往亡
            ["往亡", "戌丑寅巳申亥卯午酉子辰未"[men], dayZhi, [],
             ["上册", "上表章", "颁诏", "招贤", "宣政事", "出行", "安抚边境", "选将", "出师", "上官", "临政", "嫁娶", "进人口", "搬移", "求医疗病", "捕捉",
              "畋猎", "取鱼"]],
            // 重丧、重复
            ["重丧", "癸己甲乙己丙丁己庚辛己壬"[men], dayGan, [], ["嫁娶", "安葬"]],
            ["重复", "癸己庚辛己壬癸戊甲乙己壬"[men], dayGan, [], ["嫁娶", "安葬"]],
            // 杨公忌
            ["杨公忌", [lmn, ldn], [[1, 13], [2, 11], [3, 9], [4, 7], [5, 5], [6, 2], [7, 1], [7, 29], [8, 27], [9, 25], [10, 23], [11, 21], [12, 19]], [], ["开张", "修造", "嫁娶", "立券"]],
            // 神号、妨择
            ["神号", "申酉戌亥子丑寅卯辰巳午未"[men], dayZhi, [], []],
            ["妨择", "辰辰午午申申戌戌子子寅寅"[men], dayZhi, [], []],
            // 披麻
            ["披麻", "午卯子酉午卯子酉午卯子酉"[men], dayZhi, [], ["嫁娶", "入宅"]],
            // 大耗
            ["大耗", "辰巳午未申酉戌亥子丑寅卯"[men], dayZhi, [], ["修仓库", "开市", "立券交易", "纳财", "开仓"]],
            // 大祸
            ["大祸", "丁乙癸辛"[yen % 4], dayGan, [], ["修仓库", "修造", "出师"]],
            // 天吏
            ["天吏", "卯子酉午卯子酉午卯子酉午"[men], dayZhi, [],
             ["祈福", "求嗣", "上册", "上表章", "施恩", "招贤", "举正直", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶",
              "进人口", "搬移", "安床", "解除", "求医疗病", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "开市", "立券交易", "纳财", "开仓",
              "修置产室", "栽种", "牧养", "纳畜"]],
            // 天瘟
            ["天瘟", "丑卯未戌辰寅午子酉申巳亥"[men], dayZhi, [], ["修造", "求医疗病", "纳畜"]],
            // 天狱、天火
            ["天狱", "午酉子卯午酉子卯午酉子卯"[men], dayZhi, [], []],
            ["天火", "午酉子卯午酉子卯午酉子卯"[men], dayZhi, [], ["苫盖"]],
            // 天棒
            ["天棒", "寅辰午申戌子寅辰午申戌子"[men], dayZhi, [], []],
            // 天狗
            ["天狗", "寅卯辰巳午未申酉戌亥子丑"[men], dayZhi, [], ["祭祀"]],
            // 天狗下食
            ["天狗下食", "戌亥子丑寅卯辰巳午未申酉"[men], dayZhi, [], ["祭祀"]],
            // 天贼
            ["天贼", "卯寅丑子亥戌酉申未午巳辰"[men], dayZhi, [], ["出行", "修仓库", "开仓"]],
            // 地囊
            ["地囊", d,
             ["辛未辛酉", "乙酉乙未", "庚子庚午", "癸未癸丑", "甲子甲寅", "己卯己丑", "戊辰戊午", "癸未癸巳", "丙寅丙申", "丁卯丁巳", "戊辰戊子", "庚戌庚子"][men],
             [], ["营建", "修宫室", "缮城郭", "筑堤防", "修造", "修仓库", "修置产室", "开渠", "穿井", "安碓硙", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "栽种", "破土"]],
            // 地火
            ["地火", "子亥戌酉申未午巳辰卯寅丑"[men], dayZhi, [], ["栽种"]],
            // 独火
            ["独火", "未午巳辰卯寅丑子亥戌酉申"[men], dayZhi, [], ["修造"]],
            // 受死
            ["受死", "卯酉戌辰亥巳子午丑未寅申"[men], dayZhi, [], ["畋猎"]],
            // 黄沙
            ["黄沙", "寅子午寅子午寅子午寅子午"[men], dayZhi, [], ["出行"]],
            // 六不成
            ["六不成", "卯未寅午戌巳酉丑申子辰亥"[men], dayZhi, [], ["修造"]],
            // 小耗
            ["小耗", "卯辰巳午未申酉戌亥子丑寅"[men], dayZhi, [], ["修仓库", "开市", "立券交易", "纳财", "开仓"]],
            // 神隔
            ["神隔", "酉未巳卯丑亥酉未巳卯丑亥"[men], dayZhi, [], ["祭祀", "祈福"]],
            // 朱雀
            ["朱雀", "亥丑卯巳未酉亥丑卯巳未酉"[men], dayZhi, [], ["嫁娶"]],
            // 白虎
            ["白虎", "寅辰午申戌子寅辰午申戌子"[men], dayZhi, [], ["安葬"]],
            // 玄武
            ["玄武", "巳未酉亥丑卯巳未酉亥丑卯"[men], dayZhi, [], ["安葬"]],
            // 勾陈
            ["勾陈", "未酉亥丑卯巳未酉亥丑卯巳"[men], dayZhi, [], []],
            // 木马
            ["木马", "辰午巳未酉申戌子亥丑卯寅"[men], dayZhi, [], []],
            // 破败
            ["破败", "辰午申戌子寅辰午申戌子寅"[men], dayZhi, [], []],
            // 殃败
            ["殃败", "巳辰卯寅丑子亥戌酉申未午"[men], dayZhi, [], []],
            // 雷公
            ["雷公", "巳申寅亥巳申寅亥巳申寅亥"[men], dayZhi, [], []],
            // 飞廉、大煞
            ["飞廉", "申酉戌巳午未寅卯辰亥子丑"[yen], dayZhi, [], ["纳畜", "修造", "搬移", "嫁娶"]],
            ["大煞", "申酉戌巳午未寅卯辰亥子丑"[yen], dayZhi, [], ["安抚边境", "选将", "出师"]],
            // 枯鱼、九空、九坎、九焦、八座
            ["枯鱼", "申巳辰丑戌未卯子酉午寅亥"[men], dayZhi, [], ["栽种"]],
            ["九空", "申巳辰丑戌未卯子酉午寅亥"[men], dayZhi, [], ["进人口", "修仓库", "开市", "立券交易", "纳财", "开仓"]],
            ["九坎", "申巳辰丑戌未卯子酉午寅亥"[men], dayZhi, [], ["塞穴", "补垣", "取鱼", "乘船渡水"]],
            ["九焦", "申巳辰丑戌未卯子酉午寅亥"[men], dayZhi, [], ["鼓铸", "栽种"]],
            ["八座", "酉戌亥子丑寅卯辰巳午未申"[men], dayZhi, [], []],
            // 血忌、血支
            ["血忌", "午子丑未寅申卯酉辰戌巳亥"[men], dayZhi, [], ["针刺"]],
            ["血支", "亥子丑寅卯辰巳午未申酉戌"[men], dayZhi, [], ["针刺"]],
            // 土符
            ["土符", "申子丑巳酉寅午戌卯未亥辰"[men], dayZhi, [],
             ["营建", "修宫室", "缮城郭", "筑堤防", "修造", "修仓库", "修置产室", "开渠", "穿井", "安碓硙", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "栽种", "破土"]],
            // 土府
            ["土府", "子丑寅卯辰巳午未申酉戌亥"[men], dayZhi, [],
             ["营建", "修宫室", "缮城郭", "筑堤防", "修造", "修仓库", "修置产室", "开渠", "穿井", "安碓硙", "补垣", "修饰垣墙", "平治道涂", "破屋坏垣", "栽种", "破土"]],
            // 四忌
            ["四忌", d, ["甲子", "丙子", "庚子", "壬子"][sn], [], ["安抚边境", "选将", "出师", "结婚姻", "纳采", "嫁娶", "安葬"]],
            // 四穷
            ["四穷", d, ["乙亥", "丁亥", "辛亥", "癸亥"][sn], [], 
             ["安抚边境", "选将", "出师", "结婚姻", "纳采", "嫁娶", "进人口", "修仓库", "开市", "立券交易", "纳财", "开仓", "安葬"]],
            // 四废
            ["四废", d, ["庚申辛酉", "壬子癸亥", "甲寅乙卯", "丁巳丙午"][sn], [],
             ["祈福", "求嗣", "上册", "上表章", "颁诏", "施恩", "招贤", "举正直", "宣政事", "布政事", "庆赐", "宴会", "冠带", "出行", "安抚边境", "选将",
              "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除", "求医疗病", "裁制", "营建", "修宫室", "缮城郭", "筑堤防",
              "修造", "竖柱上梁", "修仓库", "鼓铸", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓", "修置产室", "开渠", "穿井", "安碓硙", "塞穴", "补垣",
              "修饰垣墙", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]],
            // 五墓
            ["五墓", ["壬辰", "戊辰", "乙未", "乙未", "戊辰", "丙戌", "丙戌", "戊辰", "辛丑", "辛丑", "戊辰", "壬辰"][men], d, [],
             ["冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶", "进人口", "搬移", "安床", "解除", "求医疗病", "营建",
              "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "开市", "立券交易", "修置产室", "栽种", "牧养", "纳畜", "破土", "安葬", "启攒"]],
            // 五虚
            ["五虚", dayZhi, ["巳酉丑", "申子辰", "亥卯未", "寅午戌"][sn], [], ["修仓库", "开仓"]],
            // 五离
            ["五离", dayZhi, "申酉", ["沐浴"], ["庆赐", "宴会", "结婚姻", "纳采", "立券交易"]],
            // 五鬼
            ["五鬼", "未戌午寅辰酉卯申丑巳子亥"[men], dayZhi, [], ["出行"]],
            // 八专
            ["八专", d, ["丁未", "己未", "庚申", "甲寅", "癸丑"], [], ["安抚边境", "选将", "出师", "结婚姻", "纳采", "嫁娶"]],
            // 天转
            ["天转", d, ["乙卯", "丙午", "辛酉", "壬子"][sn], [], ["修造", "搬移", "嫁娶"]],
            // 地转
            ["地转", d, ["辛卯", "戊午", "癸酉", "丙子"][sn], [], ["修造", "搬移", "嫁娶"]],
            // 月建转杀
            ["月建转杀", "卯午酉子"[sn], dayZhi, [], ["修造"]],
            // 荒芜
            ["荒芜", dayZhi, ["巳酉丑", "申子辰", "亥卯未", "寅午戌"][sn], [], []],
            // 蚩尤
            ["蚩尤", "戌子寅辰午申"[men % 6], dayZhi, [], []],
            // 大时、大败、咸池（相同规律）
            ["大时", "酉午卯子酉午卯子酉午卯子"[men], dayZhi, [],
             ["祈福", "求嗣", "上册", "上表章", "施恩", "招贤", "举正直", "冠带", "出行", "安抚边境", "选将", "出师", "上官", "临政", "结婚姻", "纳采", "嫁娶",
              "进人口", "搬移", "安床", "解除", "求医疗病", "营建", "修宫室", "缮城郭", "筑堤防", "修造", "竖柱上梁", "修仓库", "开市", "立券交易", "纳财", "开仓",
              "修置产室", "栽种", "牧养", "纳畜"]],
            ["大败", "酉午卯子酉午卯子酉午卯子"[men], dayZhi, [], []],
            ["咸池", "酉午卯子酉午卯子酉午卯子"[men], dayZhi, [], ["嫁娶", "取鱼", "乘船渡水"]],
            // 四击
            ["四击", "未未戌戌戌丑丑丑辰辰辰未"[men], dayZhi, [], ["安抚边境", "选将", "出师"]],
            // 四耗
            ["四耗", d, ["壬子", "乙卯", "戊午", "辛酉"][sn], [], ["安抚边境", "选将", "出师", "修仓库", "开市", "立券交易", "纳财", "开仓"]],
            // 游祸
            ["游祸", "亥申巳寅亥申巳寅亥申巳寅"[men], dayZhi, [], ["祈福", "求嗣", "解除", "求医疗病"]],
            // 归忌
            ["归忌", "寅子丑寅子丑寅子丑寅子丑"[men], dayZhi, [], ["搬移", "远回"]],
            // 三娘煞
            ["三娘煞", ldn, [3, 7, 13, 18, 22, 27], [], ["嫁娶", "结婚姻"]]
        ];

        // ===== getTodayGoodBadThing 函数：配合angel、demon的数据结构的吉神凶神筛选 =====
        function getTodayGoodBadThing(dic) {
            // 处理吉神
            for (let godItem of angel) {
                // godItem: [name, 当日判断结果, 判断规则, 宜事, 忌事]
                const name = godItem[0];
                const judgeResult = godItem[1];
                const judgeRule = godItem[2];
                const goodThings = godItem[3];
                const badThings = godItem[4];
                
                let match = false;
                
                // 判断逻辑
                if (typeof judgeRule === "boolean") {
                    match = judgeRule;
                } else if (typeof judgeRule === "string") {
                    if (judgeRule.length === 1) {
                        match = judgeResult === judgeRule;
                    } else {
                        match = judgeRule.includes(judgeResult);
                    }
                } else if (Array.isArray(judgeRule)) {
                    if (Array.isArray(judgeResult)) {
                        // 比较 [lmn, ldn] 是否在 judgeRule 列表中
                        for (let item of judgeRule) {
                            if (Array.isArray(item) && item[0] === judgeResult[0] && item[1] === judgeResult[1]) {
                                match = true;
                                break;
                            }
                        }
                    } else if (typeof judgeResult === "number") {
                        match = judgeRule.includes(judgeResult);
                    } else {
                        match = false;
                    }
                }
                
                if (match) {
                    dic.goodName.push(name);
                    dic.goodThing = addToArray(dic.goodThing, goodThings);
                    dic.badThing = addToArray(dic.badThing, badThings);
                }
            }
            
            // 处理凶神
            for (let godItem of demon) {
                const name = godItem[0];
                const judgeResult = godItem[1];
                const judgeRule = godItem[2];
                const goodThings = godItem[3];
                const badThings = godItem[4];
                
                let match = false;
                
                // 判断逻辑（同吉神）
                if (typeof judgeRule === "boolean") {
                    match = judgeRule;
                } else if (typeof judgeRule === "string") {
                    if (judgeRule.length === 1) {
                        match = judgeResult === judgeRule;
                    } else {
                        match = judgeRule.includes(judgeResult);
                    }
                } else if (Array.isArray(judgeRule)) {
                    if (Array.isArray(judgeResult)) {
                        for (let item of judgeRule) {
                            if (Array.isArray(item) && item[0] === judgeResult[0] && item[1] === judgeResult[1]) {
                                match = true;
                                break;
                            }
                        }
                    } else if (typeof judgeResult === "number") {
                        match = judgeRule.includes(judgeResult);
                    } else {
                        match = false;
                    }
                }
                
                if (match) {
                    dic.badName.push(name);
                    dic.goodThing = addToArray(dic.goodThing, goodThings);
                    dic.badThing = addToArray(dic.badThing, badThings);
                }
            }
            
            // 宜列、忌列分别去重
            dic.goodThing = uniqueArray(dic.goodThing);
            dic.badThing = uniqueArray(dic.badThing);
            
            return dic;
        }

        // 执行筛选
        gbDic = getTodayGoodBadThing(gbDic);

        let goodGodName = gbDic.goodName;
        let badGodName = gbDic.badName;
        let goodThing = gbDic.goodThing;
        let badThing = gbDic.badThing;

        // ===== 宜忌等第表后续处理 =====
        // 首先获取宜忌等第
        const levelInfo = getTodayThingLevel(jianchu, monthZhi, goodGodName, badGodName);
        const thingLevel = levelInfo.thingLevel;
        const isDe = levelInfo.isDe;
        const todayLevel = levelInfo.level;

        // 从忌亦从宜：移除冲突
        function badDrewGood(dic) {
            const conflict = dic.goodThing.filter(item => dic.badThing.includes(item));
            dic.goodThing = dic.goodThing.filter(item => !conflict.includes(item));
            dic.badThing = dic.badThing.filter(item => !conflict.includes(item));
            return dic;
        }
        
        // 从忌不从宜
        function badOppressGood(dic) {
            const conflict = dic.goodThing.filter(item => dic.badThing.includes(item));
            dic.goodThing = dic.goodThing.filter(item => !conflict.includes(item));
            return dic;
        }
        
        // 从宜不从忌
        function goodOppressBad(dic) {
            const conflict = dic.goodThing.filter(item => dic.badThing.includes(item));
            dic.badThing = dic.badThing.filter(item => !conflict.includes(item));
            return dic;
        }
        
        // 诸事不宜
        function nothingGood(dic) {
            dic.goodThing = ["诸事不宜"];
            dic.badThing = ["诸事不宜"];
            return dic;
        }
        
        // 0:'从宜不从忌',1:'从宜亦从忌',2:'从忌不从宜',3:'诸事皆忌'
        if (thingLevel === 3) {
            gbDic = nothingGood(gbDic);
        } else if (thingLevel === 2) {
            gbDic = badOppressGood(gbDic);
        } else if (thingLevel === 1) {
            gbDic = badDrewGood(gbDic);
        } else {
            gbDic = goodOppressBad(gbDic);
        }
        
        goodThing = gbDic.goodThing;
        badThing = gbDic.badThing;

        // 遇德犹忌之事字典
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

        if (thingLevel !== 3) {
            // 凡德合、赦愿、月恩、四相、时德等日，不注忌某些事项（非从忌不从宜日）
            let isDeSheEnSixiang = false;
            const maxPowerGodList = ["月德合", "天德合", "天赦", "天愿", "月恩", "四相", "时德"];
            for (let god of goodGodName) {
                if (maxPowerGodList.includes(god)) {
                    isDeSheEnSixiang = true;
                    break;
                }
            }
            
            if (isDeSheEnSixiang && thingLevel !== 2) {
                badThing = removeFromArray(badThing, ["进人口", "安床", "经络", "酝酿", "开市", "立券交易", "纳财", "开仓库", "出货财"]);
                badThing = addToArray(badThing, deIsBadThing);
            }
            
            // 凡吉足胜凶，从宜不从忌者，如遇德犹忌之事，则仍注忌
            if (todayLevel === 0 && thingLevel === 0) {
                badThing = addToArray(badThing, deIsBadThing);
            }
            
            // 凡吉凶相抵，不注宜亦不注忌者，如遇德犹忌之事，则仍注忌
            if (todayLevel === 1) {
                badThing = addToArray(badThing, deIsBadThing);
                // 凡吉凶相抵，不注忌祈福，亦不注忌求嗣
                if (!badThing.includes("祈福")) {
                    badThing = removeFromArray(badThing, ["求嗣"]);
                }
                // 凡吉凶相抵，不注忌结婚姻，亦不注忌冠带、纳采问名、嫁娶、进人口，如遇德犹忌之日则仍注忌
                if (!badThing.includes("结婚姻") && !isDe) {
                    badThing = removeFromArray(badThing, ["冠带", "纳采问名", "嫁娶", "进人口"]);
                }
                // 凡吉凶相抵，不注忌嫁娶，亦不注忌冠带、结婚姻、纳采问名、进人口、搬移、安床，如遇德犹忌之日，则仍注忌
                if (!badThing.includes("嫁娶") && !isDe) {
                    if (!goodGodName.includes("不将")) {
                        badThing = removeFromArray(badThing, ["冠带", "纳采问名", "结婚姻", "进人口", "搬移", "安床"]);
                    }
                }
                // 凡吉凶相抵，不注忌搬移，亦不注忌安床
                if (!badThing.includes("搬移") && !isDe) {
                    badThing = removeFromArray(badThing, ["安床"]);
                }
                if (!badThing.includes("安床") && !isDe) {
                    badThing = removeFromArray(badThing, ["搬移"]);
                }
                // 凡吉凶相抵，不注忌解除，亦不注忌整容、剃头、整手足甲
                if (!badThing.includes("解除") && !isDe) {
                    badThing = removeFromArray(badThing, ["整容", "剃头", "整手足甲"]);
                }
                // 凡吉凶相抵，不注忌修造动土、竖柱上梁，亦不注忌修宫室、缮城郭、筑提防、修仓库、鼓铸、苫盖、修置产室、开渠穿井、安碓硙、补垣塞穴、修饰垣墙、平治道涂、破屋坏垣
                if ((!badThing.includes("修造") || !badThing.includes("竖柱上梁")) && !isDe) {
                    badThing = removeFromArray(badThing, ["修宫室", "缮城郭", "整手足甲", "筑提", "修仓库", "鼓铸", "苫盖", "修置产室", "开渠穿井",
                         "安碓硙", "补垣塞穴", "修饰垣墙", "平治道涂", "破屋坏垣"]);
                }
                // 凡吉凶相抵，不注忌开市，亦不注忌立券交易、纳财
                if (!badThing.includes("开市") && !isDe) {
                    badThing = removeFromArray(badThing, ["立券交易", "纳财", "开仓库", "出货财"]);
                }
                if (!badThing.includes("纳财") && !isDe) {
                    badThing = removeFromArray(badThing, ["立券交易", "开市"]);
                }
                if (!badThing.includes("立券交易") && !isDe) {
                    badThing = removeFromArray(badThing, ["纳财", "开市", "开仓库", "出货财"]);
                }
                // 凡吉凶相抵，不注忌牧养，亦不注忌纳畜
                if (!badThing.includes("牧养") && !isDe) {
                    badThing = removeFromArray(badThing, ["纳畜"]);
                }
                if (!badThing.includes("纳畜") && !isDe) {
                    badThing = removeFromArray(badThing, ["牧养"]);
                }
                // 凡吉凶相抵，有宜安葬不注忌启攒，有宜启攒不注忌安葬
                if (goodThing.includes("安葬") && !isDe) {
                    badThing = removeFromArray(badThing, ["启攒"]);
                }
                if (goodThing.includes("启攒") && !isDe) {
                    badThing = removeFromArray(badThing, ["安葬"]);
                }
            }
            
            // 凡忌诏命公卿、招贤，不注宜施恩、封拜、举正直、袭爵受封
            if (badThing.includes("诏命公卿") || badThing.includes("招贤")) {
                goodThing = removeFromArray(goodThing, ["施恩", "举正直"]);
            }
            // 凡忌施恩、封拜、举正直、袭爵受封，亦不注宜诏命公卿、招贤
            if (badThing.includes("施恩") || badThing.includes("举正直")) {
                goodThing = removeFromArray(goodThing, ["诏命公卿", "招贤"]);
            }
            
            // 遇亥日、厌对、八专、四忌、四穷而仍注忌嫁娶者
            if (d.includes("亥") || badGodName.includes("厌对") || badGodName.includes("八专") || badGodName.includes("四忌") || badGodName.includes("四穷")) {
                badThing = addToArray(badThing, ["嫁娶"]);
            }
            
            // 凡天狗寅日忌祭祀，不注宜求福、祈嗣
            if (badGodName.includes("天狗") || d.includes("寅")) {
                badThing = addToArray(badThing, ["祭祀"]);
                goodThing = removeFromArray(goodThing, ["祭祀", "求福", "祈嗣"]);
            }
            
            // 凡卯日忌穿井，不注宜开渠。壬日忌开渠，不注宜穿井
            if (d.includes("卯")) {
                badThing = addToArray(badThing, ["穿井"]);
                goodThing = removeFromArray(goodThing, ["穿井", "开渠"]);
            }
            if (d.includes("壬")) {
                badThing = addToArray(badThing, ["开渠"]);
                goodThing = removeFromArray(goodThing, ["开渠", "穿井"]);
            }
            
            // 凡巳日忌出行，不注宜出师、遣使
            if (d.includes("巳")) {
                badThing = addToArray(badThing, ["出行"]);
                goodThing = removeFromArray(goodThing, ["出行", "出师", "遣使"]);
            }
            
            // 凡酉日忌宴会，亦不注宜庆赐、赏贺
            if (d.includes("酉")) {
                badThing = addToArray(badThing, ["宴会"]);
                goodThing = removeFromArray(goodThing, ["宴会", "庆赐", "赏贺"]);
            }
            
            // 凡丁日忌剃头，亦不注宜整容
            if (d.includes("丁")) {
                badThing = addToArray(badThing, ["剃头"]);
                goodThing = removeFromArray(goodThing, ["剃头", "整容"]);
            }
            
            // 凡宜宣政事之日遇往亡则改宣为布
            if (goodThing.includes("宣政事") && badGodName.includes("往亡")) {
                goodThing = removeFromArray(goodThing, ["宣政事"]);
                goodThing = addToArray(goodThing, ["布政事"]);
            }
            
            // 凡月厌忌行幸、上官，不注宜颁诏、施恩封拜、诏命公卿、招贤、举正直
            if (badGodName.includes("月厌")) {
                goodThing = removeFromArray(goodThing, ["颁诏", "施恩", "招贤", "举正直", "宣政事"]);
                goodThing = addToArray(goodThing, ["布政事"]);
                badThing = addToArray(badThing, ["补垣"]);
                if (badGodName.includes("土府") || badGodName.includes("土符") || badGodName.includes("地囊")) {
                    goodThing = removeFromArray(goodThing, ["塞穴"]);
                }
            }
            
            // 凡开日，不注宜破土、安葬、启攒，亦不注忌。遇忌则注
            if (jianchu === "开") {
                goodThing = removeFromArray(goodThing, ["破土", "安葬", "启攒"]);
            }
            
            // 凡四忌、四穷只忌安葬。如遇鸣吠、鸣吠对亦不注宜破土、启攒
            if (badGodName.includes("四忌") || badGodName.includes("四穷")) {
                badThing = addToArray(badThing, ["安葬"]);
                goodThing = removeFromArray(goodThing, ["破土", "启攒"]);
            }
            if (goodGodName.includes("鸣吠") || goodGodName.includes("鸣吠对")) {
                goodThing = removeFromArray(goodThing, ["破土", "启攒"]);
            }
            
            // 二月甲戌、四月丙申、六月甲子、七月戊申、八月庚辰、九月辛卯、十月甲子、十二月甲子，德和与赦、愿所汇之辰，诸事不忌
            if (["空", "甲戌", "空", "丙申", "空", "甲子", "戊申", "庚辰", "辛卯", "甲子", "空", "甲子"][lmn - 1] === d) {
                badThing = ["诸事不忌"];
            }
            
            // 岁德合、月德合、天德合与天赦、天愿同时出现，诸事不忌
            const deHeList = ["岁德合", "月德合", "天德合"];
            const sheYuanList = ["天赦", "天愿"];
            const hasDeHe = goodGodName.some(g => deHeList.includes(g));
            const hasSheYuan = goodGodName.some(g => sheYuanList.includes(g));
            if (hasDeHe && hasSheYuan) {
                badThing = ["诸事不忌"];
            }
        }
        
        // 最终清理
        let rmThing = badThing.filter(thing => goodThing.includes(thing));
        if (!(rmThing.length === 1 && rmThing[0].includes("诸事"))) {
            goodThing = removeFromArray(goodThing, rmThing);
        }
        
        // 为空清理
        if (badThing.length === 0) {
            badThing = ["诸事不忌"];
        }
        if (goodThing.length === 0) {
            goodThing = ["诸事不宜"];
        }
        
        // 输出排序调整
        badThing.sort((a, b) => sortCollation(a) - sortCollation(b));
        goodThing.sort((a, b) => sortCollation(a) - sortCollation(b));
        
        return { goodGodName, badGodName, goodThing, badThing };
    }

    // ==================== 主计算函数 ====================

    /**
     * 计算指定日期的择吉信息（完整版）
     * @param {object} lunarDate - 农历日期对象（来自 lunar_calendar.js）
     * @param {number} year - 公历年
     * @param {number} month - 公历月
     * @param {number} day - 公历日
     * @param {number} hour - 小时（0-23，可选，默认12）
     * @param {object} solarInfo - 可选的额外公历信息对象，包含 nextSolarNum, phaseOfMoon
     */
    function calculate(lunarDate, year, month, day, hour, solarInfo) {
        if (!lunarDate) return null;
        
        solarInfo = solarInfo || {};
        hour = hour || 12;
        const phaseOfMoon = solarInfo.phaseOfMoon || "";
        
        const yearGan = lunarDate.year_ganzhi[0];
        const yearZhi = lunarDate.year_ganzhi[1];
        const monthGan = lunarDate.month_ganzhi[0];
        const monthZhi = lunarDate.month_ganzhi[1];
        const dayGan = lunarDate.day_ganzhi[0];
        const dayZhi = lunarDate.day_ganzhi[1];
        
        // 计算节气信息（新增）
        const solarTermsInfo = getTodaySolarTerms(year, month, day);
        const nextSolarNum = solarTermsInfo.nextSolarNum;
        
        // 计算八字（包含时柱）
        const baZi = calculate8Char(year, month, day, hour, lunarDate);
        
        // 计算星座
        const starZodiac = calculateStarZodiac(month, day);
        
        // 计算十二建除
        const jianchu = calculateJianchu(monthZhi, dayZhi);
        
        // 计算二十八宿（使用公历日期）
        const xiu = calculateXiu(year, month, day);
        
        // 计算十二神
        const shen = calculateRiShen(monthZhi, dayZhi);
        
        // 计算九宫飞星
        const flyStar9 = calculate9FlyStar(year, month, day);
        
        // 计算吉神方位
        const luckyDirections = calculateLuckyGodsDirection(dayGan);
        
        // 计算胎神
        const fetalGod = calculateFetalGod(dayGan + dayZhi);
        
        // 计算时辰吉凶
        const twoHourLucky = calculateTwoHourLuckyList(dayGan + dayZhi);
        
        // 计算当日五行
        const today5Elements = calculateToday5Elements(dayGan + dayZhi, xiu, jianchu);
        
        // 计算彭祖百忌
        const pengTaboo = calculatePengTaboo(dayGan + dayZhi);
        
        // 获取吉神凶神及宜忌（已包含完整的宜忌筛选逻辑，传入节气信息）
        const angelDemon = getAngelDemon(lunarDate, year, month, day, nextSolarNum, phaseOfMoon);
        
        // 宜忌等第信息已在 getAngelDemon 中处理
        const yiji = {
            yi: angelDemon.goodThing,
            ji: angelDemon.badThing
        };
        
        // 计算宜忌等第（用于评分）
        const levelInfo = getTodayThingLevel(jianchu, monthZhi, angelDemon.goodGodName, angelDemon.badGodName);
        
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
            // 基本信息
            year: lunarDate.year,
            month: lunarDate.month,
            day: lunarDate.day,
            isLeap: lunarDate.is_leap,
            hour: hour,
            
            // 八字
            baZi: baZi,
            
            // 星座
            starZodiac: starZodiac,
            
            // 干支
            yearGanzhi: lunarDate.year_ganzhi,
            monthGanzhi: lunarDate.month_ganzhi,
            dayGanzhi: lunarDate.day_ganzhi,
            zodiac: lunarDate.zodiac,
            
            // 择吉要素
            jianchu: jianchu,
            xiu: xiu,
            shen: shen,
            flyStar9: flyStar9,
            luckyDirections: luckyDirections,
            fetalGod: fetalGod,
            twoHourLucky: twoHourLucky,
            today5Elements: today5Elements,
            pengTaboo: pengTaboo,
            
            // 节气信息（新增）
            solarTerms: {
                today: solarTermsInfo.todaySolarTerm,
                todayIndex: solarTermsInfo.todaySolarTermIndex,
                next: solarTermsInfo.nextSolarTerm,
                nextDate: solarTermsInfo.nextSolarTermDate,
                nextYear: solarTermsInfo.nextSolarTermYear,
                nextNum: solarTermsInfo.nextSolarNum,
                list: solarTermsInfo.thisYearSolarTermsDateList
            },
            
            // 神煞
            goodGodName: angelDemon.goodGodName,
            badGodName: angelDemon.badGodName,
            
            // 吉凶
            luck: { score: score, overall: overall },
            
            // 宜忌
            yi: yiji.yi,
            ji: yiji.ji,
            levelInfo: levelInfo,
            
            // 显示字符串
            display: `${lunarDate.year_ganzhi}${lunarDate.zodiac}年 ${lunarDate.month_name}${lunarDate.day_name} ${jianchu}日${xiu[0]}宿值${shen}`,
            
            // 时辰干支列表
            twoHour8Char: getTwoHour8CharList(dayGan + dayZhi)
        };
    }

    // ==================== 公共接口 ====================
    
    return {
        // 主计算函数
        calculate: calculate,
        
        // 八字计算
        calculate8Char: calculate8Char,
        getTwoHour8CharList: getTwoHour8CharList,
        
        // 星座计算
        calculateStarZodiac: calculateStarZodiac,
        
        // 十二建除
        calculateJianchu: calculateJianchu,
        
        // 二十八宿
        calculateXiu: calculateXiu,
        
        // 十二神
        calculateRiShen: calculateRiShen,
        
        // 九宫飞星
        calculate9FlyStar: calculate9FlyStar,
        
        // 吉神方位
        calculateLuckyGodsDirection: calculateLuckyGodsDirection,
        
        // 胎神
        calculateFetalGod: calculateFetalGod,
        
        // 时辰吉凶
        calculateTwoHourLuckyList: calculateTwoHourLuckyList,
        
        // 当日五行
        calculateToday5Elements: calculateToday5Elements,
        
        // 彭祖百忌
        calculatePengTaboo: calculatePengTaboo,
        
        // 宜忌等第
        getTodayThingLevel: getTodayThingLevel,
        
        // 吉凶神煞
        getAngelDemon: getAngelDemon,
        
        // 节气计算（新增）
        getSolarTermsDateList: getSolarTermsDateList,
        getTodaySolarTerms: getTodaySolarTerms,
        calcSolarTerm: calcSolarTerm,

        // 辅助函数
        getGanIndex: getGanIndex,
        getZhiIndex: getZhiIndex,
        getGanzhiIndex: getGanzhiIndex,
        uniqueArray: uniqueArray,
        addToArray: addToArray,
        removeFromArray: removeFromArray
    };

})();
