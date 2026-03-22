/*
 * 农历推算 - 基于天体位置计算的"第一原理"实现
 * 
 * 依据 GB/T 33661-2017《农历的编算和表示》国家标准：
 * 1. 定朔：以朔日（日月黄经相等时刻）为月首
 * 2. 中气定月：以二十四节气中的中气确定月份
 * 3. 置闰：无中气之月为闰月
 * 
 * 本实现不使用任何查找表，完全基于星历计算（朔日、中气时刻）
 * 直接调用 eph.js 中的天文计算函数
 * 
 * (c) BD4SUR 2026
 */

// ============================================
// 农历计算核心 - 基于星历的朔日和中气计算
// ============================================

const LunarCalendar = (function() {
    
    // ---------------- 缓存机制 ----------------
    let cache = {
        year: null,
        new_moons: null,
        major_terms: null,
        last_lunar_date: null,
        last_check_day: null
    };

    // ---------------- 辅助函数 ----------------
    
    function julian_day_utc(year, month, day, hour) {
        return julian_day(year, month, day, Math.floor(hour), 0, 0, 0);
    }
    
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

    // [修复 Bug 2] 北京时间（CST, UTC+8）民用日编号
    // 同一北京时间自然日内返回相同整数，子夜（00:00 CST = 前一日 16:00 UTC）翻转
    // 公式：floor(JD_UT + 8/24 + 0.5)，即先转 CST，再按儒略日正午规则取整
    function cst_day_number(jd) {
        return Math.floor(jd + 8 / 24 + 0.5);
    }
    
    // ---------------- 星历函数（调用 eph.js）----------------
    
    function solar_longitude(jd) {
        let coords = calculate_solar_ecliptic_coordinates(jd);
        return normalize_angle(coords[0]);
    }
    
    function lunar_longitude(jd) {
        let coords = calculate_lunar_ecliptic_coordinates(jd);
        return normalize_angle(coords[0]);
    }
    
    function moon_sun_longitude_diff(jd) {
        let sun_lon = solar_longitude(jd);
        let moon_lon = lunar_longitude(jd);
        return normalize_angle(moon_lon - sun_lon);
    }
    
    // ---------------- 迭代求解 ----------------
    
    function find_new_moon(jd_guess) {
        let jd = jd_guess;
        const max_iter = 20;
        const epsilon = 1e-6;
        
        for (let i = 0; i < max_iter; i++) {
            let f = moon_sun_longitude_diff(jd);
            if (f > 180) f -= 360;
            
            let delta = 0.001;
            let f2 = moon_sun_longitude_diff(jd + delta / 24);
            if (f2 > 180) f2 -= 360;
            let fp = (f2 - f) / (delta / 24);
            
            if (Math.abs(fp) < 1e-10) break;
            
            let delta_jd = -f / fp;
            jd += delta_jd;
            if (Math.abs(delta_jd) < epsilon) break;
        }
        
        return jd;
    }
    
    function find_major_term(jd_guess, target_longitude) {
        let jd = jd_guess;
        const max_iter = 20;
        const epsilon = 1e-6;
        
        for (let i = 0; i < max_iter; i++) {
            let f = normalize_angle(solar_longitude(jd) - target_longitude);
            if (f > 180) f -= 360;
            
            const fp = 0.9856; // 太阳黄经变化率 °/天
            let delta_jd = -f / fp;
            jd += delta_jd;
            if (Math.abs(delta_jd) < epsilon) break;
        }
        
        const PERIOD = 365.25;
        while (jd - jd_guess > PERIOD / 2) jd -= PERIOD;
        while (jd - jd_guess < -PERIOD / 2) jd += PERIOD;
        
        return jd;
    }
    
    // ---------------- 农历推算 ----------------
    
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
    
    function find_new_moons_of_year(year) {
        let new_moons = [];
        const SYNODIC_MONTH = 29.5306;
        
        let jd_start = julian_day_utc(year, 1, 1, 0);
        let jd_end   = julian_day_utc(year + 1, 1, 1, 0);
        
        let jd = jd_start - SYNODIC_MONTH;
        let first_new_moon = find_new_moon(jd);
        
        let current_jd = first_new_moon;
        while (current_jd < jd_end + SYNODIC_MONTH) {
            if (current_jd >= jd_start - 1 && current_jd <= jd_end + 1) {
                new_moons.push(current_jd);
            }
            current_jd = find_new_moon(current_jd + SYNODIC_MONTH * 0.8);
        }
        
        return new_moons.sort((a, b) => a - b);
    }
    
    // [修复 Bug 1] 使用年初太阳黄经推算各中气的初始猜测时刻
    // 原代码用等间距偏移，导致大寒（index=11，约在年初1月）的猜测落在年末12月，
    // 牛顿迭代收敛到下一年1月的大寒，造成当年大寒丢失、腊月被误判为闰月。
    function find_major_terms_of_year(year) {
        let terms = [];
        
        let jd_start = julian_day_utc(year, 1, 1, 0);
        let jd_end   = julian_day_utc(year + 1, 1, 1, 0);
        
        // 计算年初（1月1日）时的太阳黄经，作为各中气初始猜测的基准
        let sun_lon_at_start = solar_longitude(jd_start);
        
        for (let i = 0; i < 12; i++) {
            let target_lon = MAJOR_TERM_LONGITUDES[i];
            
            // 从年初太阳黄经向前走多少度到达目标黄经（结果在 [0°, 360°)）
            let diff = normalize_angle(target_lon - sun_lon_at_start);
            // 换算为天数（太阳约 0.9856°/天），得到更准确的初始猜测
            let days_to_target = diff / 0.9856;
            let jd_guess = jd_start + days_to_target;
            
            let jd_term = find_major_term(jd_guess, target_lon);
            
            if (jd_term >= jd_start - 30 && jd_term <= jd_end + 30) {
                terms.push({
                    jd: jd_term,
                    longitude: target_lon,
                    name: TERM_NAMES[i],
                    month_index: i   // 0=正月(雨水), 1=二月(春分), …, 11=腊月(大寒)
                });
            }
        }
        
        terms.sort((a, b) => a.jd - b.jd);
        return terms;
    }
    
    function calculate_lunar_date(year, month, day, hour, minute, second, timezone_offset) {
        // 检查缓存
        let current_day_key = `${year}-${month}-${day}`;
        if (cache.last_check_day === current_day_key && cache.last_lunar_date) {
            return cache.last_lunar_date;
        }
        cache.last_check_day = current_day_key;
        
        // 转换为 UT 儒略日
        let jd_now = julian_day_utc(year, month, day,
            hour + (minute + second / 60) / 60 - timezone_offset);
        
        // [修复 Bug 2] 使用北京时间民用日编号，避免时刻精度带来的日期偏差
        // 农历月首（朔日）以北京时间所在的自然日为准，必须用 CST 日期比较，
        // 而非直接比较含时刻的儒略日数值。
        let today_cst = cst_day_number(jd_now);
        
        // 农历年大约从公历年初或前一年开始
        let lunar_year_start = year;
        if (month < 2) lunar_year_start = year - 1;
        
        // 取缓存或重新计算朔日和中气
        let new_moons, major_terms;
        if (cache.year === lunar_year_start && cache.new_moons && cache.major_terms) {
            new_moons = cache.new_moons;
            major_terms = cache.major_terms;
        } else {
            new_moons = find_new_moons_of_year(lunar_year_start);
            major_terms = find_major_terms_of_year(lunar_year_start);
            
            // 合并下一公历年的数据（覆盖农历年跨年的月份）
            let next_new_moons  = find_new_moons_of_year(lunar_year_start + 1);
            let next_major_terms = find_major_terms_of_year(lunar_year_start + 1);
            
            new_moons   = new_moons.concat(next_new_moons).sort((a, b) => a - b);
            major_terms = major_terms.concat(next_major_terms).sort((a, b) => a.jd - b.jd);
            
            cache.year        = lunar_year_start;
            cache.new_moons   = new_moons;
            cache.major_terms = major_terms;
        }
        
        // [修复 Bug 2] 用 CST 日编号查找所在朔望月，消除时刻偏差
        let current_month_index = -1;
        let month_start_jd = 0;
        let next_month_start_jd = 0;
        
        for (let i = 0; i < new_moons.length - 1; i++) {
            let nm_cst      = cst_day_number(new_moons[i]);
            let next_nm_cst = cst_day_number(new_moons[i + 1]);
            if (today_cst >= nm_cst && today_cst < next_nm_cst) {
                current_month_index  = i;
                month_start_jd       = new_moons[i];
                next_month_start_jd  = new_moons[i + 1];
                break;
            }
        }
        
        if (current_month_index < 0) return null;
        
        // [修复 Bug 2] 农历日用 CST 日编号差值计算（初一=1）
        let lunar_day = today_cst - cst_day_number(month_start_jd) + 1;
        
        // [修复 Bug 2] 查找本朔望月内的中气，同样用 CST 日编号比较
        let month_start_cst      = cst_day_number(month_start_jd);
        let next_month_start_cst = cst_day_number(next_month_start_jd);
        
        let terms_in_month = major_terms.filter(t => {
            let t_cst = cst_day_number(t.jd);
            return t_cst >= month_start_cst && t_cst < next_month_start_cst;
        });
        
        // 判断是否为闰月
        let is_leap_month = (terms_in_month.length === 0);
        let lunar_month_num  = 0;
        let leap_month_marker = "";
        
        if (is_leap_month) {
            // [修复 Bug 3] 闰月序号与其前面那个普通月相同（原代码多加了 1）
            // 例：大暑（六月）之后的无中气月 → 闰六月，而非闰七月
            let prev_terms = major_terms.filter(t => cst_day_number(t.jd) < month_start_cst);
            if (prev_terms.length > 0) {
                let prev_term = prev_terms[prev_terms.length - 1];
                lunar_month_num = prev_term.month_index; // 修正：不再 +1
            }
            leap_month_marker = "闰";
        } else {
            lunar_month_num = terms_in_month[0].month_index;
        }
        
        let lunar_month_name = leap_month_marker + MONTH_NAMES[lunar_month_num] + "月";
        
        const lunar_day_names = [
            "初一","初二","初三","初四","初五","初六","初七","初八","初九","初十",
            "十一","十二","十三","十四","十五","十六","十七","十八","十九","二十",
            "廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十"
        ];
        let lunar_day_name = lunar_day_names[Math.min(lunar_day - 1, 29)];
        
        // [修复 Bug 5] 农历年判断：找出本公历年（lunar_year_start）的正月初一（含雨水的朔望月）
        // 原代码以冬至为年界，导致十月等月份在冬至前被误算为上一年。
        let zhengyu_cst = null;
        for (let i = 0; i < new_moons.length - 1; i++) {
            let nm_cst      = cst_day_number(new_moons[i]);
            let next_nm_cst = cst_day_number(new_moons[i + 1]);
            let month_terms = major_terms.filter(t => {
                let tc = cst_day_number(t.jd);
                return tc >= nm_cst && tc < next_nm_cst;
            });
            // 含雨水（month_index===0）即为正月
            if (month_terms.length > 0 && month_terms[0].month_index === 0) {
                // 确认该正月初一落在公历 lunar_year_start 年（北京时间）
                let nm_dt = jd_to_datetime(new_moons[i] + 8 / 24);
                if (nm_dt.year === lunar_year_start) {
                    zhengyu_cst = nm_cst;
                    break;
                }
            }
        }
        
        let lunar_year = lunar_year_start;
        if (zhengyu_cst !== null && today_cst < zhengyu_cst) {
            // 当前日期在本公历年正月初一之前，属于上一农历年
            lunar_year = lunar_year_start - 1;
        }
        
        // 干支纪年（1984年为甲子年）
        let year_gan  = ((lunar_year - 1984) % 10 + 10) % 10;
        let year_zhi  = ((lunar_year - 1984) % 12 + 12) % 12;
        let year_ganzhi = CELESTIAL_STEMS[year_gan] + TERRESTRIAL_BRANCHES[year_zhi];
        let zodiac = ZODIAC_ANIMALS[year_zhi];
        
        // [修复 Bug 4] 干支纪月 - 五虎遁年起月法，修正正月天干起始值
        // 甲/己年→丙(2)寅，乙/庚年→戊(4)寅，丙/辛年→庚(6)寅，
        // 丁/壬年→壬(8)寅，戊/癸年→甲(0)寅
        // 原代码为 [0,2,4,6,8,0,2,4,6,8]，差了两位，已修正如下：
        const MONTH_GAN_START = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
        let month_gan = (MONTH_GAN_START[year_gan] + lunar_month_num) % 10;
        let month_zhi = (lunar_month_num + 2) % 12; // 正月=寅(2)
        let month_ganzhi = CELESTIAL_STEMS[month_gan] + TERRESTRIAL_BRANCHES[month_zhi];
        
        // 干支纪日（以1900年1月31日甲辰日为基准）
        // [修复 Bug 2] 同样使用 CST 日编号，与日期判断保持一致
        let base_jd  = julian_day_utc(1900, 1, 31, 0);
        let base_cst = cst_day_number(base_jd);
        let day_offset = today_cst - base_cst;
        let day_gan  = ((day_offset % 10) + 10) % 10;         // 甲=0
        let day_zhi  = ((day_offset + 4) % 12 + 12) % 12;    // 辰=4
        let day_ganzhi = CELESTIAL_STEMS[day_gan] + TERRESTRIAL_BRANCHES[day_zhi];
        
        let result = {
            year:        lunar_year,
            month:       lunar_month_num + 1,  // 1–12
            day:         lunar_day,
            is_leap:     is_leap_month,
            year_ganzhi,
            month_ganzhi,
            day_ganzhi,
            zodiac,
            month_name:  lunar_month_name,
            day_name:    lunar_day_name,
            full_display: `${year_ganzhi}${zodiac}年 ${lunar_month_name}${lunar_day_name}`
        };
        
        cache.last_lunar_date = result;
        return result;
    }
    
    return {
        calculate: calculate_lunar_date,
    };
    
})();