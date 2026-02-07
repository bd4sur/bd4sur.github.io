/*
 * 星历计算
 *   计算太阳、月球的黄道和赤道坐标及其地平坐标、月相、日出日落时间，并根据这些数据推算农历日期。
 *   基于 J. Meeus 的 Astronomical Algorithms (Second Edition) 所述算法，以及自行推导算法实现
 *   (c) BD4SUR 2011-08 2011-09 2026-01
 *
 */


// ===============================================================================
// 用于计算月球位置的参数 (AA Ch. 47)
// ===============================================================================

const A_multiple_of_D = [
    0, 2, 2, 0, 0, 0, 2, 2, 2, 2, 0, 1, 0, 2, 0, 0, 4, 0, 4, 2, 2, 1, 1, 2, 2, 4, 2, 0, 2, 2,
    1, 2, 0, 0, 2, 2, 2, 4, 0, 3, 2, 4, 0, 2, 2, 2, 4, 0, 4, 1, 2, 0, 1, 3, 4, 2, 0, 1, 2, 2
];

const A_multiple_of_M = [
    0, 0, 0, 0, 1, 0, 0, -1, 0, -1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, -1, 0, 0, 0, 1, 0, -1,
    0, -2, 1, 2, -2, 0, 0, -1, 0, 0, 1, -1, 2, 2, 1, -1, 0, 0, -1, 0, 1, 0, 1, 0, 0, -1, 2, 1, 0, 0
];

const A_multiple_of_M2 = [
    1, -1, 0, 2, 0, 0, -2, -1, 1, 0, -1, 0, 1, 0, 1, 1, -1, 3, -2, -1, 0, -1, 0, 1, 2, 0, -3, -2, -1, -2,
    1, 0, 2, 0, -1, 1, 0, -1, 2, -1, 1, -2, -1, -1, -2, 0, 1, 4, 0, -2, 0, 2, 1, -2, -3, 2, 1, -1, 3, -1
];

const A_multiple_of_F = [
    0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, -2, 2, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0,
    0, 0, 0, 0, 0, -2, 2, 0, 2, 0, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, -2, -2, 0, 0, 0, 0, 0, 0, 0, -2
];

const A_coeff_sine = [
    6288774, 1274027, 658314, 213618, -185116, -114332, 58793, 57066, 53322, 45758, -40923, -34720,
    -30383, 15327, -12528, 10980, 10675, 10034, 8548, -7888, -6766, -5163, 4987, 4036, 3994, 3861,
    3665, -2689, -2602, 2390, -2348, 2236, -2120, -2069, 2048, -1773, -1595, 1215, -1110, -892, -810,
    759, -713, -700, 691, 596, 549, 537, 520, -487, -399, -381, 351, -340, 330, 327, -323, 299, 294, 0
];

const A_coeff_cosine = [
    -20905355, -3699111, -2955968, -569925, 48888, -3149, 246158, -152138, -170733, -204586, -129620,
    108743, 104755, 10321, 0, 79661, -34782, -23210, -21636, 24208, 30824, -8379, -16675, -12831, -10445,
    -11650, 14403, -7003, 0, 10056, 6322, -9884, 5751, 0, -4950, 4130, 0, -3958, 0, 3258, 2616, -1897,
    -2117, 2354, 0, 0, -1423, -1117, -1571, -1739, 0, -4421, 0, 0, 0, 0, 1165, 0, 0, 8752
];


const B_multiple_of_D = [
    0, 0, 0, 2, 2, 2, 2, 0, 2, 0, 2, 2, 2, 2, 2, 2, 2, 0, 4, 0, 0, 0, 1, 0, 0, 0, 1, 0, 4, 4,
    0, 4, 2, 2, 2, 2, 0, 2, 2, 2, 2, 4, 2, 2, 0, 2, 1, 1, 0, 2, 1, 2, 0, 4, 4, 1, 4, 1, 4, 2
];

const B_multiple_of_M = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 1, -1, -1, -1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 1, 0, -1, -2, 0, 1, 1, 1, 1, 1, 0, -1, 1, 0, -1, 0, 0, 0, -1, -2
];

const B_multiple_of_M2 = [
    0, 1, 1, 0, -1, -1, 0, 2, 1, 2, 0, -2, 1, 0, -1, 0, -1, -1, -1, 0, 0, -1, 0, 1, 1, 0, 0, 3, 0, -1,
    1, -2, 0, 2, 1, -2, 3, 2, -3, -1, 0, 0, 1, 0, 1, 1, 0, 0, -2, -1, 1, -2, 2, -2, -1, 1, 1, -1, 0, 0
];

const B_multiple_of_F = [
    1, 1, -1, -1, 1, -1, 1, 1, -1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 3, 1, 1, 1, -1, -1, -1, 1, -1, 1,
    -3, 1, -3, -1, -1, 1, -1, 1, -1, 1, 1, 1, 1, -1, 3, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1
];

const B_coeff_sine = [
    5128122, 280602, 277693, 173237, 55413, 46271, 32573, 17198, 9266, 8822, 8216, 4324, 4200, -3359, 2463, 2211,
    2065, -1870, 1828, -1794, -1749, -1565, -1492, -1475, -1410, -1344, -1335, 1107, 1021, 833, 777, 671, 607, 596,
    491, -451, 439, 422, 421, -366, -351, 331, 315, 302, -283, -229, 223, 223, -220, -220, -185, 181, -177, 176, 166,
    -164, 132, -119, 115, 107
];








function to_deg(rad) {
    return rad * (180.0 / Math.PI);
}

function to_rad(deg) {
    return deg * (Math.PI / 180.0);
}

// 辅助函数：归一化角度到 [0, 360)
// function normalize_angle(n) {
//     return 360.0 * (n / 360.0 - trunc(n / 360.0));
// }
function fmod(x, y) {
    if (y === 0) return NaN;
    return x % y;
}

function normalize_angle(angle) {
    angle = fmod(angle, 360.0);
    if (angle < 0) angle += 360.0;
    return angle;
}

// 判断格里历年份是否为闰年（仅适用于1583年及以后）
function is_leap(year) {
    return (year % 4 == 0) && (year % 100 != 0 || year % 400 == 0);
}

// 计算儒略日（地方标准时间）
function julian_day(year, month, day, hour, minute, second, timezone_offset) {
    let local_hours = hour + minute / 60.0 + second / 3600.0;
    let utc_hours = local_hours - timezone_offset;
    let utc_day = day;
    let utc_month = month;
    let utc_year = year;

    // 处理跨日/月/年
    const days_in_month = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    while (utc_hours < 0) {
        utc_hours += 24.0;
        utc_day--;
        // 处理跨月和跨年
        if (utc_day < 1) {
            utc_month--;
            if (utc_month < 1) {
                utc_month = 12;
                utc_year--;
            }
            // 计算前一月的最后一天
            utc_day = days_in_month[utc_month];
            utc_day += (utc_month == 2 && is_leap(utc_year)) ? 1 : 0;
        }
    }
    while (utc_hours >= 24.0) {
        utc_hours -= 24.0;
        utc_day++;
        let last_day = days_in_month[utc_month];
        last_day += (utc_month == 2 && is_leap(utc_year)) ? 1 : 0;
        if (utc_day > last_day) {
            utc_day = 1;
            utc_month++;
            if (utc_month > 12) {
                utc_month = 1;
                utc_year++;
            }
        }
    }

    if (utc_month <= 2) {
        utc_year -= 1;
        utc_month += 12;
    }
    let A = Math.floor(utc_year / 100);
    let B = 2 - A + Math.floor(A / 4);
    let jd = Math.trunc(365.25 * (utc_year + 4716)) + Math.trunc(30.6001 * (utc_month + 1)) + utc_day + B - 1524.5;
    jd += utc_hours / 24.0;
    return jd;
}

// 计算格林尼治恒星时（GMST，单位：度）
function greenwich_sidereal_time(jd) {
    let jd0 = Math.floor(jd - 0.5) + 0.5; // 当日 0h UT 的 JD
    let T = (jd0 - 2451545.0) / 36525.0; // 儒略世纪
    let theta0 = 100.46061837 +
                    36000.770053608 * T +
                    0.000387933 * T * T -
                    T * T * T / 38710000.0;
    theta0 = normalize_angle(theta0); // GMST at 0h UT, in degrees

    let ut_hours = (jd - jd0) * 24.0;
    let gmst = theta0 + 360.98564724 * ut_hours / 24.0;
    return normalize_angle(gmst); // in degrees
}


// 计算月球黄道坐标（黄经lambda, 黄纬beta, 地心月心距离delta）
function calculate_lunar_ecliptic_coordinates(jd) {
    let H0 = jd - 2451545.0; // 自 J2000.0 起算的儒略日数
    let H = H0 / 36525.0; // 自 J2000.0 起算的儒略世纪数

    let H2 = H*H;
    let H3 = H2*H;
    let H4 = H3*H;

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
    // 月球经度参数（月球到其升交点的平均角距离）
    let F = normalize_angle(
        93.2720950 + 483202.0175233 * H - 0.0036539 * H2 - H3 / 3526000.0 + H4 / 863310000.0);
    // 三个修正系数
    let A1 = normalize_angle(119.75 + 131.849 * H);
    let A2 = normalize_angle(53.09 + 479264.290 * H);
    let A3 = normalize_angle(313.45 + 481266.484 * H);
    // 与地球公转轨道离心率相关的修正项
    let E = 1 - 0.002516 * H - 0.0000074 * H2;
    let E2 = E*E;

    // 计算修正项Σl、Σr、Σb
    let S_l = 0.0;
    let S_r = 0.0;
    let S_b = 0.0;
    for (let i = 0; i < 60; i++) {
        let sc = A_coeff_sine[i];
        let cc = A_coeff_cosine[i];
        let m_D  = A_multiple_of_D[i];
        let m_M  = A_multiple_of_M[i];
        let m_M2 = A_multiple_of_M2[i];
        let m_F  = A_multiple_of_F[i];
        let e = (m_M == 2 || m_M == -2) ? E2 : ((m_M == 1 || m_M == -1) ? E : 1);
        S_l += sc * e * Math.sin(m_D * to_rad(D) + m_M * to_rad(M) + m_M2 * to_rad(M2) + m_F * to_rad(F));
        S_r += cc * e * Math.sin(m_D * to_rad(D) + m_M * to_rad(M) + m_M2 * to_rad(M2) + m_F * to_rad(F));
    }
    for (let i = 0; i < 60; i++) {
        let sc = B_coeff_sine[i];
        let m_D  = B_multiple_of_D[i];
        let m_M  = B_multiple_of_M[i];
        let m_M2 = B_multiple_of_M2[i];
        let m_F  = B_multiple_of_F[i];
        let e = (m_M == 2 || m_M == -2) ? E2 : ((m_M == 1 || m_M == -1) ? E : 1);
        S_b += sc * e * Math.sin(m_D * to_rad(D) + m_M * to_rad(M) + m_M2 * to_rad(M2) + m_F * to_rad(F));
    }
    S_l += (3958.0 * Math.sin(to_rad(A1)) + 1962.0 * Math.sin(to_rad(LL - F)) + 318.0 * Math.sin(to_rad(A2)));
    S_b += (-2235.0 * Math.sin(to_rad(LL)) + 382.0 * Math.sin(to_rad(A3)) + 175.0 * Math.sin(to_rad(A1 - F)) + 
            175.0 * Math.sin(to_rad(A1 + F)) + 127.0 * Math.sin(to_rad(LL - M2)) - 115.0 * Math.sin(to_rad(LL + M2)));

    return [
        LL + S_l / 1000000.0,
        S_b / 1000000.0,
        385000.56 + S_r / 1000.0
    ];

}


// 计算月球赤道坐标（RA, Dec）
function calculate_lunar_equatorial_coordinates(jd) {

    // 计算黄道坐标
    let ec = calculate_lunar_ecliptic_coordinates(jd);

    let lambda_moon = ec[0];
    let beta_moon = ec[1];
    let R_moon = ec[2];

    // 计算赤道坐标
    let eps = 23.0 + (26.0 / 60.0); // 黄赤交角
    beta_moon = to_rad(beta_moon); eps = to_rad(eps); lambda_moon = to_rad(lambda_moon);
    let X = -R_moon * Math.cos(beta_moon) * Math.cos(eps) * Math.sin(lambda_moon) + R_moon * Math.sin(beta_moon) * Math.sin(eps);
    let Y = -R_moon * Math.cos(beta_moon) * Math.cos(lambda_moon);
    let Z =  R_moon * Math.cos(beta_moon) * Math.sin(eps) * Math.sin(lambda_moon) + R_moon * Math.sin(beta_moon) * Math.cos(eps);

    let RA = 0;
    let Dec = 0;

    // 月球RA
    let ra_deg = to_deg(Math.atan2(Y, X));
    if (ra_deg > -90.0 && ra_deg <= 180.0) {
        RA = 270.0 - ra_deg;
    }
    else if (ra_deg <= -90.0 && ra_deg >= -180.0) {
        RA = -90.0 - ra_deg;
    }

    // 月球Dec
    Dec = to_deg(Math.atan2(Z, Math.sqrt(X * X + Y * Y)));

    return [RA, Dec];
}


// 计算太阳黄道坐标（黄经lambda, 黄纬beta, 地心月心距离delta）
function calculate_solar_ecliptic_coordinates(jd) {
    let H0 = jd - 2451545.0; // 自 J2000.0 起算的儒略日数
    let H = H0 / 36525.0; // 自 J2000.0 起算的儒略世纪数

    // 太阳平黄经
    let U1 = normalize_angle(280.46646 + 36000.76983 * H + 0.0003032 * H * H);
    // 平近点角 Mm（转为弧度）
    let Mm_deg = normalize_angle(357.52911 + 35999.05029 * H - 0.0001537 * H * H);
    let Mm = to_rad(Mm_deg);
    // 中心差C（度）
    let C = (1.914602 - 0.004817 * H - 0.000014 * H * H) * Math.sin(Mm)
             + (0.019993 - 0.000101 * H) * Math.sin(2 * Mm)
             + 0.000289 * Math.sin(3 * Mm);
    // 真黄经（无其余修正）
    let U = normalize_angle(U1 + C);

    return [U, 0.0, 1.0];
}

// 计算太阳赤道坐标（RA, Dec）
//   输入时间是儒略日，因天体在天球上的位置与观察者位置无关
function calculate_solar_equatorial_coordinates(jd) {


    // 计算黄道坐标（仅用到黄经）
    let ec = calculate_solar_ecliptic_coordinates(jd);

    let lambda_sun = ec[0];

    // 太阳的赤道坐标
    let eps = 23.0 + (26.0 / 60.0); // 黄赤交角
    let M = -Math.cos(to_rad(eps)) * Math.sin(to_rad(lambda_sun));
    let N = -Math.cos(to_rad(lambda_sun));
    let O = Math.sin(to_rad(eps)) * Math.sin(to_rad(lambda_sun));

    let RA = 0;
    let Dec = 0;

    // 太阳的赤经和赤纬
    if (lambda_sun >= 0.0 && lambda_sun < 180.0) {
        RA = 90.0 - to_deg(Math.asin(-N / Math.sqrt(M*M + N*N)));
    }
    else {
        RA = 270.0 + to_deg(Math.asin(-N / Math.sqrt(M*M + N*N)));
    }
    Dec = to_deg(Math.atan2(O, Math.sqrt(M*M + N*N)));

    return [RA, Dec];
}




// 月球亮面方向角
// NOTE 根据 AA p.346 表述，“Position Angle of the Moon's bright limb”的定义是：
//      从月面视圆盘的 North Point（天球北方向）起算，向东（即沿天球方位角增加方向）测量到明亮月面边缘中点的角度。
//      这个角度是相对于天球赤道坐标系的子午线的扭转角度。与观测者位置无关。
function moon_phase(year, month, day, hour, minute, second, timezone_offset) {
    let jd = julian_day(year, month, day, hour, minute, second, timezone_offset);
    let ec_moon = calculate_lunar_equatorial_coordinates(jd);
    let ec_sun = calculate_solar_equatorial_coordinates(jd);

    let a0 = to_rad(ec_sun[0]);
    let d0 = to_rad(ec_sun[1]);
    let a  = to_rad(ec_moon[0]);
    let d  = to_rad(ec_moon[1]);

    let cosp = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(a0-a);
    let phase_angle_deg = normalize_angle(to_deg(Math.acos(-cosp)));
    return phase_angle_deg;
}


// 月球亮面方向角
// NOTE 根据 AA p.346 表述，“Position Angle of the Moon's bright limb”的定义是：
//      从月面视圆盘的 North Point（天球北方向）起算，向东（即沿天球方位角增加方向）测量到明亮月面边缘中点的角度。
//      这个角度是相对于天球赤道坐标系的子午线的扭转角度。与观测者位置无关。
function moon_bright_limb_pos_angle(year, month, day, hour, minute, second, timezone_offset) {
    let jd = julian_day(year, month, day, hour, minute, second, timezone_offset);
    let ec_moon = calculate_lunar_equatorial_coordinates(jd);
    let ec_sun = calculate_solar_equatorial_coordinates(jd);

    let a0 = to_rad(ec_sun[0]);
    let d0 = to_rad(ec_sun[1]);
    let a  = to_rad(ec_moon[0]);
    let d  = to_rad(ec_moon[1]);

    let y = Math.cos(d0) * Math.sin(a0 - a);
    let x = Math.sin(d0) * Math.cos(d) - Math.cos(d0) * Math.sin(d) * Math.cos(a0 - a);

    return to_deg(Math.atan2(y, x));
}


// 地心黄道坐标 → 赤道坐标（简单转换，不考虑任何岁差、章动等因素）
function ecliptic_to_equatorial(lmd, beta) {
    let R = 1.0;

    let eps = 23.0 + (26.0 / 60.0); // 黄赤交角
    beta = to_rad(beta); eps = to_rad(eps); lmd = to_rad(lmd);
    let X = -R * Math.cos(beta) * Math.cos(eps) * Math.sin(lmd) + R * Math.sin(beta) * Math.sin(eps);
    let Y = -R * Math.cos(beta) * Math.cos(lmd);
    let Z =  R * Math.cos(beta) * Math.sin(eps) * Math.sin(lmd) + R * Math.sin(beta) * Math.cos(eps);

    let RA = 0;
    let Dec = 0;

    // 赤经RA
    let ra_deg = to_deg(Math.atan2(Y, X));
    if (ra_deg > -90.0 && ra_deg <= 180.0) {
        RA = 270.0 - ra_deg;
    }
    else if (ra_deg <= -90.0 && ra_deg >= -180.0) {
        RA = -90.0 - ra_deg;
    }

    // 赤纬Dec
    Dec = to_deg(Math.atan2(Z, Math.sqrt(X * X + Y * Y)));

    return [RA, Dec];
}


// 赤道坐标 → 地平坐标
function equatorial_to_horizontal(
    ra_deg,          // 赤经 (0~360°)
    dec_deg,         // 赤纬 (-90~+90°)
    year, month, day, hour, minute, second,
    timezone_offset, // 时区偏移（小时），如北京时间 +8.0
    longitude,       // 观测者经度 (东正)
    latitude         // 观测者纬度 (北正)
) {
    // 计算儒略日（JD）
    let jd = julian_day(year, month, day, hour, minute, second, timezone_offset);
    // 格林尼治恒星时（GMST，度）
    let gmst = greenwich_sidereal_time(jd);

    // 计算地平坐标
    let L = gmst + longitude; // 本地恒星时（春分点本地时角）
    let I = normalize_angle(L - ra_deg);
    let T = (I >= 0 && I < 180.0) ? (I + 90.0) : (I - 270.0); // 月球本地时角

    let R = 1.0;
    dec_deg = to_rad(dec_deg); T = to_rad(T); latitude = to_rad(latitude);
    let X =  R * Math.cos(dec_deg) * Math.sin(latitude) * Math.sin(T) - R * Math.sin(dec_deg) * Math.cos(latitude);
    let Y = -R * Math.cos(dec_deg) * Math.cos(T);
    let Z =  R * Math.cos(dec_deg) * Math.cos(latitude) * Math.sin(T) + R * Math.sin(dec_deg) * Math.sin(latitude);

    // Elevation (Altitude)
    let altitude = to_deg(Math.atan2(Z, Math.sqrt(X * X + Y * Y)));
    // Azimuth
    let az_deg = to_deg(Math.atan2(Y, X));
    let azimuth = 180.0 + az_deg;

    return [altitude, azimuth];
}

// 给定时间地点，计算太阳地平坐标
function where_is_the_sun(
    year, month, day, hour, minute, second,
    timezone_offset, // 时区偏移（小时），如北京时间 +8.0
    longitude,       // 观测者经度 (东正)
    latitude         // 观测者纬度 (北正)
) {
    let jd = julian_day(year, month, day, hour, minute, second, timezone_offset);
    let ec = calculate_solar_equatorial_coordinates(jd);
    return equatorial_to_horizontal(
        ec[0], ec[1], year, month, day, hour, minute, second, timezone_offset,
        longitude, latitude
    );
}

// 给定时间地点，计算月球地平坐标
function where_is_the_moon(
    year, month, day, hour, minute, second,
    timezone_offset, // 时区偏移（小时），如北京时间 +8.0
    longitude,       // 观测者经度 (东正)
    latitude         // 观测者纬度 (北正)
) {
    let jd = julian_day(year, month, day, hour, minute, second, timezone_offset);
    let ec = calculate_lunar_equatorial_coordinates(jd);
    return equatorial_to_horizontal(
        ec[0], ec[1], year, month, day, hour, minute, second, timezone_offset,
        longitude, latitude
    );
}


// 辅助函数：计算某分钟时刻的太阳高度角（单位：分钟从00:00起）
function get_solar_altitude(year, month, day, total_minutes, timezone, longitude, latitude) {
    let h = Math.floor(total_minutes / 60);
    let m = total_minutes % 60;
    let hc = where_is_the_sun(year, month, day, h, m, 0, timezone, longitude, latitude);
    return hc[0];
}

// 二分查找日出时间（升交点）：在 [start, end) 区间内找第一个 alt >= 0 的点，
// 且前一时刻 alt < 0。假设函数在此区间单调递增。
function find_sunrise(year, month, day, timezone, longitude, latitude) {
    let low = 0;               // 00:00
    let high = 12 * 60;        // 12:00（不含）

    // 先检查边界：如果全天都在地平线下，无日出
    if (get_solar_altitude(year, month, day, high - 1, timezone, longitude, latitude) < 0.0) {
        return -1; // 无日出
    }
    if (get_solar_altitude(year, month, day, low, timezone, longitude, latitude) >= 0.0) {
        return low; // 极昼情况，日出在00:00或之前
    }

    while (low < high) {
        let mid = Math.floor((low + high) / 2);
        let alt_mid = get_solar_altitude(year, month, day, mid, timezone, longitude, latitude);
        let alt_prev = get_solar_altitude(year, month, day, mid - 1, timezone, longitude, latitude);
        if (alt_prev < 0.0 && alt_mid >= 0.0) {
            return mid; // 找到升交点
        }
        else if (alt_mid < 0.0) {
            low = mid + 1;
        }
        else {
            high = mid;
        }
    }
    return -1; // 理论上不应到达这里
}

// 二分查找日落时间（降交点）：在 [start, end) 区间内找第一个 alt < 0 的点，
// 且前一时刻 alt >= 0。假设函数在此区间单调递减。
function find_sunset(year, month, day, timezone, longitude, latitude) {
    let low = 12 * 60 + 1;     // 12:01
    let high = 24 * 60;        // 23:59 + 1（即24:00，作为上界）

    // 边界检查：如果12:01时已低于地平线，则可能无日落（极夜）
    if (get_solar_altitude(year, month, day, low, timezone, longitude, latitude) < 0.0) {
        return -1;
    }
    // 如果23:59仍 >= 0，则极昼，无日落
    if (get_solar_altitude(year, month, day, high - 1, timezone, longitude, latitude) >= 0.0) {
        return -1;
    }

    while (low < high) {
        let mid = Math.floor((low + high) / 2);
        let alt_mid = get_solar_altitude(year, month, day, mid, timezone, longitude, latitude);
        let alt_prev = get_solar_altitude(year, month, day, mid - 1, timezone, longitude, latitude);
        if (alt_prev >= 0.0 && alt_mid < 0.0) {
            return mid; // 找到降交点
        }
        else if (alt_prev >= 0.0) {
            low = mid + 1;
        }
        else {
            high = mid;
        }
    }
    return -1;
}


// 基于VSOP87c计算大行星地平坐标（不做章动、光行差等精密修正）
function where_is_the_planet(
    year, month, day, hour, minute, second,
    timezone_offset, // 时区偏移（小时），如北京时间 +8.0
    longitude,       // 观测者经度 (东正)
    latitude,        // 观测者纬度 (北正)
    planet_index     // 计算哪个行星：1-水 2-金 3-地球（直接返回） 4-火 5-木 6-土 7-天王 8-海王 其他无定义
) {
    // 计算儒略千年数
    const jd = julian_day(year, month, day, hour, minute, second, timezone_offset);
    const t = (jd - 2451545.0) / 365250.0; // NOTE 注意：是千年数！

    // 计算地球的日心直角坐标
    const earth_xyz = vsop87c_milli.getEarth(t);

    // 计算行星的日心直角坐标
    let planet_xyz = null;
    switch (planet_index) {
        case 1: planet_xyz = vsop87c_milli.getMercury(t); break;
        case 2: planet_xyz = vsop87c_milli.getVenus(t); break;
        case 3: return null;
        case 4: planet_xyz = vsop87c_milli.getMars(t); break;
        case 5: planet_xyz = vsop87c_milli.getJupiter(t); break;
        case 6: planet_xyz = vsop87c_milli.getSaturn(t); break;
        case 7: planet_xyz = vsop87c_milli.getUranus(t); break;
        case 8: planet_xyz = vsop87c_milli.getNeptune(t); break;
        default: return null;
    }

    // 计算行星的地心直角坐标
    const x_geo = planet_xyz[0] - earth_xyz[0];
    const y_geo = planet_xyz[1] - earth_xyz[1];
    const z_geo = planet_xyz[2] - earth_xyz[2];

    // 计算行星赤道坐标
    const eps_rad = to_rad(23.0 + (26.0 / 60.0)); // 黄赤交角
    const x_eq = x_geo;
    const y_eq = y_geo * Math.cos(eps_rad) - z_geo * Math.sin(eps_rad);
    const z_eq = y_geo * Math.sin(eps_rad) + z_geo * Math.cos(eps_rad);

    const planet_ra  = to_deg(Math.atan2(y_eq, x_eq));
    const planet_dec = to_deg(Math.asin(z_eq / Math.sqrt(x_eq * x_eq + y_eq * y_eq + z_eq * z_eq)));

    // 计算地平坐标
    return equatorial_to_horizontal(planet_ra, planet_dec, year, month, day, hour, minute, second, timezone_offset, longitude, latitude);
}
