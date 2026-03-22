/*
 * 农历推算 - 基于天体位置计算的"第一原理"实现
 * 
 * 依据 GB/T 33661-2017《农历的编算和表示》国家标准：
 * 1. 定朔：以朔日（日月黄经相等时刻）为月首
 * 2. 中气定月：以二十四节气中的中气确定月份
 * 3. 置闰：无中气之月为闰月
 * 
 * 本实现不使用任何查找表，完全基于星历计算（朔日、中气时刻）
 * 
 * (c) BD4SUR 2026
 */

// ============================================
// 农历计算核心 - 基于星历的朔日和中气计算
// ============================================

const LunarCalendar = (function() {
    
    // ---------------- 缓存机制 ----------------
    // 缓存朔日和中气计算结果，避免每帧重复计算
    let cache = {
        year: null,
        new_moons: null,
        major_terms: null,
        last_lunar_date: null,
        last_check_day: null
    };

    // ---------------- 辅助函数 ----------------
    
    function to_deg(rad) { return rad * 180.0 / Math.PI; }
    function to_rad(deg) { return deg * Math.PI / 180.0; }
    
    function normalize_angle(angle) {
        angle = angle % 360.0;
        if (angle < 0) angle += 360.0;
        return angle;
    }
    
    // 儒略日计算（UT）
    function julian_day_utc(year, month, day, hour) {
        let y = year, m = month;
        if (m <= 2) {
            y -= 1;
            m += 12;
        }
        let A = Math.floor(y / 100);
        let B = 2 - A + Math.floor(A / 4);
        let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
        return jd + hour / 24.0;
    }
    
    // 从儒略日转换为年月日时分秒
    function jd_to_datetime(jd) {
        let jd1 = jd + 0.5;
        let Z = Math.floor(jd1);
        let F = jd1 - Z;
        
        let A, alpha;
        if (Z < 2299161) {
            A = Z;
        } else {
            alpha = Math.floor((Z - 1867216.25) / 36524.25);
            A = Z + 1 + alpha - Math.floor(alpha / 4);
        }
        
        let B = A + 1524;
        let C = Math.floor((B - 122.1) / 365.25);
        let D = Math.floor(365.25 * C);
        let E = Math.floor((B - D) / 30.6001);
        
        let day = B - D - Math.floor(30.6001 * E);
        let month = (E < 14) ? E - 1 : E - 13;
        let year = (month > 2) ? C - 4716 : C - 4715;
        
        let hour = Math.floor(F * 24);
        let minute = Math.floor((F * 24 - hour) * 60);
        let second = Math.round(((F * 24 - hour) * 60 - minute) * 60);
        
        return { year, month, day, hour, minute, second };
    }
    
    // ---------------- 星历函数 ----------------
    
    // 计算太阳黄经（简化版，使用 eph.js 中的算法）
    function solar_longitude(jd) {
        let H0 = jd - 2451545.0;
        let H = H0 / 36525.0;
        
        // 太阳平黄经
        let U1 = normalize_angle(280.46646 + 36000.76983 * H + 0.0003032 * H * H);
        // 平近点角
        let Mm_deg = normalize_angle(357.52911 + 35999.05029 * H - 0.0001537 * H * H);
        let Mm = to_rad(Mm_deg);
        // 中心差
        let C = (1.914602 - 0.004817 * H - 0.000014 * H * H) * Math.sin(Mm)
              + (0.019993 - 0.000101 * H) * Math.sin(2 * Mm)
              + 0.000289 * Math.sin(3 * Mm);
        
        return normalize_angle(U1 + C);
    }
    
    // 计算月球黄经（简化版）
    function lunar_longitude(jd) {
        let H0 = jd - 2451545.0;
        let H = H0 / 36525.0;
        let H2 = H * H;
        let H3 = H2 * H;
        let H4 = H3 * H;
        
        // 月球平黄经
        let LL = normalize_angle(
            218.3164477 + 481267.88123421 * H - 0.0015786 * H2 + H3 / 538841.0 - H4 / 65194000.0);
        // 月日平均距角
        let D = normalize_angle(
            297.8501921 + 445267.1114034 * H - 0.0018819 * H2 + H3 / 545868.0 - H4 / 113065000.0);
        // 太阳平近点角
        let M = normalize_angle(
            357.5291092 + 35999.0502909 * H - 0.0001536 * H2 + H3 / 24490000.0);
        // 月球平近点角
        let M2 = normalize_angle(
            134.9633964 + 477198.8675055 * H + 0.0087414 * H2 + H3 / 69699.0 - H4 / 14712000.0);
        // 月球经度参数
        let F = normalize_angle(
            93.2720950 + 483202.0175233 * H - 0.0036539 * H2 - H3 / 3526000.0 + H4 / 863310000.0);
        
        let E = 1 - 0.002516 * H - 0.0000074 * H2;
        let E2 = E * E;
        
        // 主要周期项修正（只取最大的一些项）
        let delta = 0;
        delta += 6288774 * Math.sin(to_rad(D));
        delta += 1274027 * Math.sin(to_rad(2 * D));
        delta += 658314 * Math.sin(to_rad(2 * D - M2));
        delta += 213618 * Math.sin(to_rad(2 * D - M));
        delta += -185116 * Math.sin(to_rad(M2));
        delta += -114332 * Math.sin(to_rad(D));
        delta += 58793 * Math.sin(to_rad(2 * D + M2));
        delta += 57066 * Math.sin(to_rad(2 * D - 2 * M));
        delta += 53322 * Math.sin(to_rad(2 * D + M));
        delta += 45758 * Math.sin(to_rad(2 * D - 2 * M2));
        delta += -40923 * Math.sin(to_rad(2 * D - M2 - M));
        delta += -34720 * Math.sin(to_rad(D + M2));
        delta += -30383 * Math.sin(to_rad(M2 + M));
        delta += 15327 * Math.sin(to_rad(2 * D - M2 + M));
        delta += -12528 * Math.sin(to_rad(2 * M));
        delta += 10980 * Math.sin(to_rad(D + M2 - M));
        delta += 10675 * Math.sin(to_rad(2 * M2));
        delta += 10034 * Math.sin(to_rad(3 * D));
        delta += 8548 * Math.sin(to_rad(M2 - M));
        delta += -7888 * Math.sin(2 * to_rad(D + M2));
        delta += -6766 * Math.sin(to_rad(M2 + 2 * M));
        delta += -5163 * Math.sin(to_rad(D - M));
        delta += 4987 * Math.sin(to_rad(D + M));
        delta += 4036 * Math.sin(to_rad(2 * D - 3 * M2));
        delta += 3994 * Math.sin(to_rad(3 * D - M2));
        
        delta /= 1000000.0;
        
        return normalize_angle(LL + delta);
    }
    
    // 日月黄经差（从月球看太阳的黄经差，即月相角）
    function moon_sun_longitude_diff(jd) {
        let sun_lon = solar_longitude(jd);
        let moon_lon = lunar_longitude(jd);
        let diff = moon_lon - sun_lon;
        return normalize_angle(diff);
    }
    
    // ---------------- 迭代求解 ----------------
    
    // 牛顿迭代法求解朔日（日月黄经差 = 0°）
    // 输入：初始猜测的儒略日
    // 返回：精确的朔日儒略日
    function find_new_moon(jd_guess) {
        let jd = jd_guess;
        let max_iter = 20;
        let epsilon = 1e-6; // 约 0.01 秒精度
        
        for (let i = 0; i < max_iter; i++) {
            let f = moon_sun_longitude_diff(jd);
            // 处理 360° 边界情况
            if (f > 180) f -= 360;
            
            // 数值微分
            let delta = 0.001; // 1分钟
            let f2 = moon_sun_longitude_diff(jd + delta / 24);
            if (f2 > 180) f2 -= 360;
            let fp = (f2 - f) / (delta / 24);
            
            if (Math.abs(fp) < 1e-10) break; // 避免除零
            
            let delta_jd = -f / fp;
            jd += delta_jd;
            
            if (Math.abs(delta_jd) < epsilon) break;
        }
        
        return jd;
    }
    
    // 求解中气时刻（太阳黄经 = target_longitude）
    // 确保找到最接近 jd_guess 的那个解
    function find_major_term(jd_guess, target_longitude) {
        let jd = jd_guess;
        let max_iter = 20;
        let epsilon = 1e-6;
        
        for (let i = 0; i < max_iter; i++) {
            let f = normalize_angle(solar_longitude(jd) - target_longitude);
            if (f > 180) f -= 360;
            
            // 数值微分：太阳黄经变化率约 0.9856°/天
            let fp = 0.9856;
            
            let delta_jd = -f / fp;
            jd += delta_jd;
            
            if (Math.abs(delta_jd) < epsilon) break;
        }
        
        // 牛顿迭代可能收敛到任意一个周期解（每年一个）
        // 我们需要找到最接近 jd_guess 的那个解
        // 将 jd 调整到 jd_guess 附近的一个周期内（365.25天）
        const PERIOD = 365.25;
        while (jd - jd_guess > PERIOD / 2) {
            jd -= PERIOD;
        }
        while (jd - jd_guess < -PERIOD / 2) {
            jd += PERIOD;
        }
        
        return jd;
    }
    
    // ---------------- 农历推算 ----------------
    
    // 中气黄经值（从雨水开始，对应正月到腊月）
    // 雨水=330°, 春分=0°, 谷雨=30°, ..., 大寒=300°
    const MAJOR_TERM_LONGITUDES = [
        330,  // 雨水 - 正月
        0,    // 春分 - 二月
        30,   // 谷雨 - 三月
        60,   // 小满 - 四月
        90,   // 夏至 - 五月
        120,  // 大暑 - 六月
        150,  // 处暑 - 七月
        180,  // 秋分 - 八月
        210,  // 霜降 - 九月
        240,  // 小雪 - 十月
        270,  // 冬至 - 十一月
        300   // 大寒 - 腊月
    ];
    
    const TERM_NAMES = [
        "雨水", "春分", "谷雨", "小满", "夏至", "大暑",
        "处暑", "秋分", "霜降", "小雪", "冬至", "大寒"
    ];
    
    const MONTH_NAMES = [
        "正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"
    ];
    
    const CELESTIAL_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const TERRESTRIAL_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
    const ZODIAC_ANIMALS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
    
    // 计算某年（公历）的所有朔日
    // 返回该年所有朔日的儒略日数组
    function find_new_moons_of_year(year) {
        let new_moons = [];
        
        // 朔望月平均长度约 29.5306 天
        const SYNODIC_MONTH = 29.5306;
        
        // 从年初开始搜索
        let jd_start = julian_day_utc(year, 1, 1, 0);
        let jd_end = julian_day_utc(year + 1, 1, 1, 0);
        
        // 先找到第一个朔日之前的朔（作为起点）
        let jd = jd_start - SYNODIC_MONTH;
        let first_new_moon = find_new_moon(jd);
        
        // 逐步搜索所有朔日
        let current_jd = first_new_moon;
        while (current_jd < jd_end + SYNODIC_MONTH) {
            if (current_jd >= jd_start - 1 && current_jd <= jd_end + 1) {
                new_moons.push(current_jd);
            }
            current_jd = find_new_moon(current_jd + SYNODIC_MONTH * 0.8);
        }
        
        return new_moons.sort((a, b) => a - b);
    }
    
    // 计算某年的所有中气时刻
    function find_major_terms_of_year(year) {
        let terms = [];
        
        // 节气间隔约 30.44 天（365.25 / 12）
        const TERM_INTERVAL = 30.44;
        
        let jd_start = julian_day_utc(year, 1, 1, 0);
        let jd_end = julian_day_utc(year + 1, 1, 1, 0);
        
        // 从年初前一个月开始
        for (let i = 0; i < 12; i++) {
            let target_lon = MAJOR_TERM_LONGITUDES[i];
            // 估算中气时刻（粗略估计）
            let jd_guess = jd_start + i * TERM_INTERVAL;
            let jd_term = find_major_term(jd_guess, target_lon);
            
            if (jd_term >= jd_start - 30 && jd_term <= jd_end + 30) {
                terms.push({
                    jd: jd_term,
                    longitude: target_lon,
                    name: TERM_NAMES[i],
                    month_index: i  // 0=正月, 1=二月, ...
                });
            }
        }
        
        // 确保按时间排序
        terms.sort((a, b) => a.jd - b.jd);
        
        return terms;
    }
    
    // 根据给定时刻计算农历日期
    // 返回农历年月日信息
    function calculate_lunar_date(year, month, day, hour, minute, second, timezone_offset) {
        // 检查缓存：如果日期没有变化，直接返回缓存结果
        let current_day_key = `${year}-${month}-${day}`;
        if (cache.last_check_day === current_day_key && cache.last_lunar_date) {
            // 更新日内的时分秒变化，但保持农历日期不变
            return cache.last_lunar_date;
        }
        cache.last_check_day = current_day_key;
        
        // 转换为UT儒略日
        let jd_now = julian_day_utc(year, month, day, hour + (minute + second / 60) / 60 - timezone_offset);
        
        // 确定需要计算的农历年份范围
        // 农历春节通常在1月下旬到2月中旬之间
        let lunar_year_start = year;
        if (month < 2) lunar_year_start = year - 1;
        
        // 检查缓存的朔日和中气数据是否可用
        let new_moons, major_terms;
        if (cache.year === lunar_year_start && cache.new_moons && cache.major_terms) {
            // 使用缓存数据
            new_moons = cache.new_moons;
            major_terms = cache.major_terms;
        } else {
        
            // 计算该农历年的所有朔日和中气
            new_moons = find_new_moons_of_year(lunar_year_start);
            major_terms = find_major_terms_of_year(lunar_year_start);
            
            // 再获取下一年的朔日和中气（用于跨年的情况）
            let next_new_moons = find_new_moons_of_year(lunar_year_start + 1);
            let next_major_terms = find_major_terms_of_year(lunar_year_start + 1);
            
            // 合并朔日和中气
            new_moons = new_moons.concat(next_new_moons);
            major_terms = major_terms.concat(next_major_terms);
            
            // 按时间排序
            new_moons.sort((a, b) => a - b);
            major_terms.sort((a, b) => a.jd - b.jd);
            
            // 更新缓存
            cache.year = lunar_year_start;
            cache.new_moons = new_moons;
            cache.major_terms = major_terms;
        }
        
        // 找到当前时刻所在的朔望月
        let current_month_index = -1;
        let month_start_jd = 0;
        let next_month_start_jd = 0;
        
        for (let i = 0; i < new_moons.length - 1; i++) {
            if (jd_now >= new_moons[i] && jd_now < new_moons[i + 1]) {
                current_month_index = i;
                month_start_jd = new_moons[i];
                next_month_start_jd = new_moons[i + 1];
                break;
            }
        }
        
        if (current_month_index < 0) {
            // 超出计算范围，返回空
            return null;
        }
        
        // 计算日（从1开始）
        let lunar_day = Math.floor(jd_now - month_start_jd) + 1;
        
        // 确定该朔望月包含哪些中气
        let terms_in_month = major_terms.filter(t => t.jd >= month_start_jd && t.jd < next_month_start_jd);
        
        // 判断是否为闰月
        let is_leap_month = (terms_in_month.length === 0);
        
        // 确定月份（根据中气）
        let lunar_month_num = 0;
        let leap_month_marker = "";
        
        if (is_leap_month) {
            // 闰月：需要找到前一个月份的中气
            let prev_terms = major_terms.filter(t => t.jd < month_start_jd);
            if (prev_terms.length > 0) {
                let prev_term = prev_terms[prev_terms.length - 1];
                lunar_month_num = (prev_term.month_index + 1) % 12;
            }
            leap_month_marker = "闰";
        } else {
            // 正常月份：根据中气确定
            lunar_month_num = terms_in_month[0].month_index;
        }
        
        // 农历月份名称
        let lunar_month_name = leap_month_marker + MONTH_NAMES[lunar_month_num] + "月";
        
        // 农历日名称
        let lunar_day_names = [
            "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
            "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
            "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"
        ];
        let lunar_day_name = lunar_day_names[Math.min(lunar_day - 1, 29)];
        
        // 确定农历年（根据冬至所在的公历年）
        // 冬至是农历年的分界点
        let winter_solstice_jd = null;
        for (let t of major_terms) {
            if (t.name === "冬至") {
                winter_solstice_jd = t.jd;
                break;
            }
        }
        
        let lunar_year = lunar_year_start;
        // 如果当前时刻在冬至之前，且月份在11月或之后，属于前一年农历
        if (jd_now < winter_solstice_jd && lunar_month_num >= 9) {
            lunar_year = lunar_year_start - 1;
        }
        // 如果当前时刻在冬至之后，且月份在正月之后，属于下一年农历
        else if (jd_now > winter_solstice_jd && lunar_month_num < 2) {
            lunar_year = lunar_year_start + 1;
        }
        
        // 干支纪年
        // 1984年为甲子年
        let year_gan = (lunar_year - 1984 + 60) % 10;
        let year_zhi = (lunar_year - 1984 + 60) % 12;
        let year_ganzhi = CELESTIAL_STEMS[year_gan] + TERRESTRIAL_BRANCHES[year_zhi];
        
        // 生肖
        let zodiac = ZODIAC_ANIMALS[year_zhi];
        
        // 干支纪月
        // 正月（雨水后）为寅月，年干决定月干起始
        let month_gan_start = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]; // 年干对应的正月干索引
        let month_gan = (month_gan_start[year_gan] + lunar_month_num) % 10;
        let month_zhi = (lunar_month_num + 2) % 12; // 正月=寅(2)
        let month_ganzhi = CELESTIAL_STEMS[month_gan] + TERRESTRIAL_BRANCHES[month_zhi];
        
        // 干支纪日
        // 1900年1月31日为甲辰日
        let base_jd = julian_day_utc(1900, 1, 31, 0);
        let day_offset = Math.floor(jd_now - base_jd);
        let day_gan = (day_offset + 0) % 10; // 甲=0
        let day_zhi = (day_offset + 4) % 12; // 辰=4
        let day_ganzhi = CELESTIAL_STEMS[day_gan] + TERRESTRIAL_BRANCHES[day_zhi];
        
        let result = {
            year: lunar_year,
            month: lunar_month_num + 1,  // 1-12
            day: lunar_day,
            is_leap: is_leap_month,
            year_ganzhi: year_ganzhi,
            month_ganzhi: month_ganzhi,
            day_ganzhi: day_ganzhi,
            zodiac: zodiac,
            month_name: lunar_month_name,
            day_name: lunar_day_name,
            full_display: `${year_ganzhi}${zodiac}年 ${lunar_month_name}${lunar_day_name}`
        };
        
        // 更新缓存
        cache.last_lunar_date = result;
        
        return result;
    }
    
    // 公共接口
    return {
        calculate: calculate_lunar_date,
        // 暴露一些内部函数供调试
        _solar_longitude: solar_longitude,
        _lunar_longitude: lunar_longitude,
        _moon_sun_diff: moon_sun_longitude_diff,
        _find_new_moon: find_new_moon,
        _find_major_term: find_major_term
    };
    
})();

// 尝试绑定到全局对象（兼容浏览器和 Node.js）
try {
    if (typeof globalThis !== 'undefined') {
        globalThis.LunarCalendar = LunarCalendar;
    } else if (typeof global !== 'undefined') {
        global.LunarCalendar = LunarCalendar;
    } else if (typeof window !== 'undefined') {
        window.LunarCalendar = LunarCalendar;
    }
} catch (e) {
    // 忽略错误
}

// Node.js 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LunarCalendar;
}
