// ============================================================================
// OFDM Modem Core (AudioWorklet) / BD4SUR 2026-07
// 独立的调制解调器核：发射（文本→OFDM波形）与接收（波形→文本）。
// 设计目标：与嵌入式 C 实现同构（流式状态机 + 环形缓冲），可直接对照移植。
//
// 物理层：定长中等帧广播（类DRM）。
//   每个数据packet独立封装为一个物理帧，帧结构固定为22槽（≈825ms）：
//     [SC粗同步前导][训练A][训练B][5×数据][训练][5×数据][训练][5×数据][训练][1×数据]
//   - 每帧都有完整粗同步头 + 周期性块状训练符号（细同步/信道估计），
//     接收机每帧重新执行粗细同步，可随时开机切入（冷启动）；
//   - 数据符号内嵌时频二维散布导频（频域间隔8、时域步进3），
//     用于逐符号相位跟踪与信道跟踪；
//   - 利用帧头两个相同训练符号的相位差按载波频率拟合相位速率，
//     显式估计并补偿载波频偏(CFO)与采样率偏差(SFO)。
//   调制/解调采用基带复FFT制式（可配置载波频率/子载波数/基波频率）：
//   发射=基带复IFFT → ×DECIM多相内插 → IQ混频上变频；
//   接收=IQ混频下变频 → 多相抽取 → 基带复FFT读 bin。
//   混频本振为相位累加器DDS（正弦LUT），载波频率可任意配置，无栅格约束。
// ============================================================================

// ---------------- 系统参数 ----------------
const SAMPLE_RATE    = 48000;
const BASE_FREQ      = 46.875;    // 子载波间隔(Hz)
const CARRIER_NUMBER = 64;    // 正交子载波数
const CARRIER_FREQ   = 4000; // 通带中心频率(Hz)：DDS混频，可任意配置（仅需满足物理边界）
const BANDWIDTH = BASE_FREQ * CARRIER_NUMBER;
// ---- FFT 制式推导：IQ混频 + ×DECIM 抽取/内插 + 基带复IFFT/FFT ----
// 可配置项：SAMPLE_RATE / BASE_FREQ / CARRIER_NUMBER / CARRIER_FREQ，约束：
//   1) SYMBOL_LENGTH = SAMPLE_RATE/BASE_FREQ 为 2 的幂（全速率符号长度）
//   2) BB_FFT_LEN = 2^ceil(log2(2×CARRIER_NUMBER)) 整除 SYMBOL_LENGTH
//   3) CARRIER_FREQ 任意（混频器为相位累加器DDS，无栅格约束），仅需满足物理边界：
//      0 < fc−B/2 且 fc+B/2 < Fs/2；且镜像带 2·f_mix±B/2 应落在抽取滤波器阻带
//      （经验法则：2·(fc+Δf/2)−B/2 ≳ Fs/DECIM−B/2），否则镜像会折叠进数据区
const SYMBOL_LENGTH = Math.round(SAMPLE_RATE / BASE_FREQ); // 全速率符号长度（采样点）= 1024
const BB_FFT_LEN    = next_pow2(2 * CARRIER_NUMBER);       // 基带复FFT点数 = 128
const DECIM         = SYMBOL_LENGTH / BB_FFT_LEN;          // 抽取/内插因子 = 8（基带 6kHz）
const CP_BB         = Math.ceil(0.4 * BB_FFT_LEN / 2) * 2; // 基带CP（取偶，使基带槽长为偶） = 52
const CP_LENGTH     = CP_BB * DECIM;                       // 循环前缀长度 = 416
const GROSS_SYMBOL_LENGTH = SYMBOL_LENGTH + CP_LENGTH;     // 槽长（符号+CP）= 1440
const SLOT_BB       = BB_FFT_LEN + CP_BB;                  // 基带槽长 = 180
const MIX_FREQ      = CARRIER_FREQ + BASE_FREQ / 2;        // 混频频率：基带载波对齐整数 bin
const TRAINING_SYMBOL_INTERVAL = 5; // 帧内每几个数据符号插入一个块状训练符号
const IQ_AMP = 0.02;
const T_SLOT = GROSS_SYMBOL_LENGTH / SAMPLE_RATE;          // 槽长（秒）
if ((SYMBOL_LENGTH & (SYMBOL_LENGTH - 1)) !== 0 || (BB_FFT_LEN & (BB_FFT_LEN - 1)) !== 0 ||
    SYMBOL_LENGTH % BB_FFT_LEN !== 0)
    throw new Error("FFT 制式约束：SAMPLE_RATE/BASE_FREQ 与 2^ceil(log2(2×子载波数)) 须为 2 的幂且前者为后者整数倍");
if (CARRIER_FREQ - BANDWIDTH / 2 <= 0 || CARRIER_FREQ + BANDWIDTH / 2 >= SAMPLE_RATE / 2)
    throw new Error("CARRIER_FREQ±BANDWIDTH/2 须位于 (0, Fs/2) 内");

// ---------------- 物理帧结构 ----------------
const FRAME_DATA_SYMBOLS = 16;  // 每帧数据符号数
// 帧内槽调度（SC前导之后）：2个帧头训练 + 数据/中间训练
const FRAME_SCHEDULE = (function () {
    let s = ["T", "T"];
    for (let i = 0; i < FRAME_DATA_SYMBOLS; i++) {
        s.push("D");
        if ((i + 1) % TRAINING_SYMBOL_INTERVAL === 0 && i + 1 < FRAME_DATA_SYMBOLS) s.push("T");
    }
    return s; // 长度21：T,T, D×5,T, D×5,T, D×5,T, D
})();
const FRAME_SLOTS = 1 + FRAME_SCHEDULE.length;             // 22槽（含SC前导）
const FRAME_LENGTH = FRAME_SLOTS * GROSS_SYMBOL_LENGTH;    // 帧长（采样点）

// ---------------- 散布导频（类DRM时频二维散布） ----------------
const PILOT_SPACING = 8;  // 频域间隔：每8个子载波1个导频点
const PILOT_SHIFT   = 3;  // 时域步进：导频位置随数据符号索引滑动（与8互素，8符号遍历全部余数）
const PILOT_NUMBER  = CARRIER_NUMBER / PILOT_SPACING;      // 8个导频点/符号
const DATA_CARRIERS = CARRIER_NUMBER - PILOT_NUMBER;       // 56个数据子载波/符号
const BYTES_PER_SYMBOL = DATA_CARRIERS * 2 / 8;            // QAM4 → 14字节/符号
function pilot_offset(s) { return (PILOT_SHIFT * s) % PILOT_SPACING; }

// ---------------- 环形缓冲（定容、O(1)写入/丢弃、稳态零堆分配） ----------------
// 同构于嵌入式C的静态环形缓冲：float buf[CAP] + start/len 索引，2的幂次容量用位掩码回卷
function next_pow2(n) { let p = 1; while (p < n) p <<= 1; return p; }
const DET_RING_CAP = next_pow2(4 * GROSS_SYMBOL_LENGTH + 4096);   // SC检测历史缓冲容量
const BUF_RING_CAP = next_pow2(FRAME_LENGTH + GROSS_SYMBOL_LENGTH); // 帧接收缓冲容量
class RingBuffer {
    constructor(cap) {
        this.cap = cap; this.mask = cap - 1;
        this.buf = new Float32Array(cap);
        this.start = 0; this.len = 0;
    }
    clear() { this.start = 0; this.len = 0; }
    write(x) { // x: 任意 array-like（Array 或 Float32Array）；满时覆盖最旧采样
        for (let i = 0; i < x.length; i++) {
            if (this.len < this.cap) { this.buf[(this.start + this.len) & this.mask] = x[i]; this.len++; }
            else { this.buf[this.start] = x[i]; this.start = (this.start + 1) & this.mask; }
        }
    }
    drop(n) { n = Math.min(n, this.len); this.start = (this.start + n) & this.mask; this.len -= n; }
    read_to(out, off, n) { let j = this.start + off; for (let i = 0; i < n; i++) out[i] = this.buf[(j + i) & this.mask]; }
}

// ---------------- 码表：IQ 混频器 DDS（相位累加器 + 正弦 LUT，支持任意混频频率） ----------------
// 相位量化误差 ≤ 2π/(2×1024) rad（约 −54dB），对 QAM4 无感；嵌入式C同构
const DDS_LUT_LEN = 1024;
const DDS_COS = new Float32Array(DDS_LUT_LEN), DDS_SIN = new Float32Array(DDS_LUT_LEN);
for (let n = 0; n < DDS_LUT_LEN; n++) {
    DDS_COS[n] = Math.cos(2 * Math.PI * n / DDS_LUT_LEN);
    DDS_SIN[n] = Math.sin(2 * Math.PI * n / DDS_LUT_LEN);
}
const TWO_PI = 2 * Math.PI;
const MIX_STEP = TWO_PI * MIX_FREQ / SAMPLE_RATE; // 混频相位步进(rad/采样)
const PHASE_TO_IDX = DDS_LUT_LEN / TWO_PI;

// ---------------- 码表：抽取/内插抗混叠低通（窗函数法FIR，多相结构） ----------------
// 过渡带中心取信号带宽边缘与基带奈奎斯特的中点；群延迟 LPF_GD 须为 DECIM 整数倍
const LPF_TAPS = 97;
const LPF_GD = (LPF_TAPS - 1) / 2; // 48 = 6×DECIM
const LPF = (function () {
    let fc = (BANDWIDTH / 2 + (SAMPLE_RATE / DECIM) / 2) / 2 / SAMPLE_RATE; // 归一化截止频率
    let h = new Float32Array(LPF_TAPS), sum = 0;
    for (let n = 0; n < LPF_TAPS; n++) {
        let x = n - LPF_GD;
        let s = (x === 0) ? 2 * fc : Math.sin(2 * Math.PI * fc * x) / (Math.PI * x);
        let w = 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (LPF_TAPS - 1)); // Hamming
        h[n] = s * w; sum += h[n];
    }
    for (let n = 0; n < LPF_TAPS; n++) h[n] /= sum; // 直流增益归一化
    return h;
})();
if (LPF_GD % DECIM !== 0) throw new Error("LPF 群延迟须为 DECIM 的整数倍");

const CARRIER_FREQS = []; // 各子载波频率(Hz)，CFO/SFO 拟合用
for (let c = 0; c < CARRIER_NUMBER; c++)
    CARRIER_FREQS[c] = CARRIER_FREQ + (c - (CARRIER_NUMBER - 1) / 2) * BASE_FREQ;

// 基2复数 FFT（原地；正变换 e^{-j2πkn/N}，逆变换 e^{+j} 并乘 1/N）
// 蝶形旋转因子用递推生成，便于对照移植嵌入式C（亦可换预存旋转因子表）
function fft_radix2(re, im, inverse) {
    let n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
        let ang = 2 * Math.PI / len * (inverse ? 1 : -1);
        let wr = Math.cos(ang), wi = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
            let cwr = 1, cwi = 0;
            for (let j = 0; j < len / 2; j++) {
                let ur = re[i + j], ui = im[i + j];
                let vr = re[i + j + len / 2] * cwr - im[i + j + len / 2] * cwi;
                let vi = re[i + j + len / 2] * cwi + im[i + j + len / 2] * cwr;
                re[i + j] = ur + vr; im[i + j] = ui + vi;
                re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
                let nwr = cwr * wr - cwi * wi; cwi = cwr * wi + cwi * wr; cwr = nwr;
            }
        }
    }
    if (inverse) { for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; } }
}

// ---------------- 码表：训练符号频域图案（伪随机 QPSK，LCG） ----------------
const A1 = 2 * IQ_AMP;
const TRAINING_I = [], TRAINING_Q = [];
{
    let tseed = 54321;
    let trnd = () => (tseed = (tseed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let c = 0; c < CARRIER_NUMBER; c++) {
        TRAINING_I[c] = (trnd() < 0.5) ? -A1 : A1;
        TRAINING_Q[c] = (trnd() < 0.5) ? -A1 : A1;
    }
}

// ---------------- 码表：散布导频取值（伪随机 QPSK，逐载波固定、收发已知） ----------------
const PILOT_I = [], PILOT_Q = [];
{
    let pseed = 24680;
    let prnd = () => (pseed = (pseed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let c = 0; c < CARRIER_NUMBER; c++) {
        PILOT_I[c] = (prnd() < 0.5) ? -A1 : A1;
        PILOT_Q[c] = (prnd() < 0.5) ? -A1 : A1;
    }
}

// ---------------- 信号处理基础 ----------------
function raised_cosine_window(wave, rolloff) {
    let A = Math.round(wave.length * rolloff);
    let B = Math.round(wave.length * (1 - rolloff));
    for (let i = 0; i < A; i++) wave[i] *= (0.5 - 0.5 * Math.cos(Math.PI * i / A));
    for (let i = B; i < wave.length; i++) wave[i] *= (0.5 + 0.5 * Math.cos(Math.PI * (i - B) / A));
    return wave;
}

// 子载波 c → 基带 bin（整数栅格：c − N_c/2，DC 不使用）
function bb_bin(c) { return (c - (CARRIER_NUMBER >> 1) + BB_FFT_LEN) & (BB_FFT_LEN - 1); }
// 一个基带复符号：载波 IQ 填入基带频域 → 复 IFFT → [re[BB_FFT_LEN], im[BB_FFT_LEN]]
function baseband_symbol(si, sq) {
    let re = new Float32Array(BB_FFT_LEN), im = new Float32Array(BB_FFT_LEN);
    for (let c = 0; c < CARRIER_NUMBER; c++) { let k = bb_bin(c); re[k] = si[c]; im[k] = sq[c]; }
    fft_radix2(re, im, true);
    return [re, im];
}
// 基带槽流（复） → 通带实信号：×DECIM 多相内插 → IQ混频取实部 → 逐槽升余弦窗
// 混频相位逐槽复位（与旧直相关制式一致：各槽载波相位对齐槽起点，训练模板才能逐槽复用）
function passband_from_bb(bb_re, bb_im) {
    let n_bb = bb_re.length;
    let n_out = n_bb * DECIM;
    // 多相内插：y[t] = DECIM × Σ_k h[r + k·DECIM]·bb[(t−r)/DECIM − k]（边界零填充）
    let tmp_re = new Float32Array(n_out + LPF_GD), tmp_im = new Float32Array(n_out + LPF_GD);
    for (let t = 0; t < tmp_re.length; t++) {
        let r = t % DECIM, n0 = (t - r) / DECIM;
        let ar = 0, ai = 0;
        for (let k = 0; k * DECIM + r < LPF_TAPS; k++) {
            let idx = n0 - k;
            if (idx >= 0 && idx < n_bb) { let w = LPF[r + k * DECIM]; ar += w * bb_re[idx]; ai += w * bb_im[idx]; }
        }
        tmp_re[t] = ar * DECIM; tmp_im[t] = ai * DECIM;
    }
    // 裁掉群延迟，混频取实部（DDS 相位累加，逐槽复位），逐槽加窗
    let wave = new Array(n_out);
    for (let s0 = 0; s0 < n_out; s0 += GROSS_SYMBOL_LENGTH) {
        let seg = new Array(GROSS_SYMBOL_LENGTH);
        let phase = 0; // 槽内局部相位（与旧直相关制式一致：各槽载波相位对齐槽起点）
        for (let t = 0; t < GROSS_SYMBOL_LENGTH; t++) {
            let k = (phase * PHASE_TO_IDX) | 0;
            seg[t] = tmp_re[s0 + t + LPF_GD] * DDS_COS[k] - tmp_im[s0 + t + LPF_GD] * DDS_SIN[k];
            phase += MIX_STEP; if (phase >= TWO_PI) phase -= TWO_PI;
        }
        raised_cosine_window(seg, 0.01);
        for (let t = 0; t < GROSS_SYMBOL_LENGTH; t++) wave[s0 + t] = seg[t];
    }
    return wave;
}

// 训练符号：基带符号 + 时域模板（经完整发射链生成，取连续两槽中的第二槽以避开内插边缘瞬态）
const TRAINING_BB = baseband_symbol(TRAINING_I, TRAINING_Q);
const TRAINING_SYMBOL_TIME = (function () {
    let bb_re = [], bb_im = [];
    for (let rep = 0; rep < 2; rep++) {
        for (let i = BB_FFT_LEN - CP_BB; i < BB_FFT_LEN; i++) { bb_re.push(TRAINING_BB[0][i]); bb_im.push(TRAINING_BB[1][i]); }
        for (let i = 0; i < BB_FFT_LEN; i++) { bb_re.push(TRAINING_BB[0][i]); bb_im.push(TRAINING_BB[1][i]); }
    }
    let pb = passband_from_bb(bb_re, bb_im);
    return pb.slice(GROSS_SYMBOL_LENGTH, 2 * GROSS_SYMBOL_LENGTH);
})();
const TRAINING_TPL_ENERGY = TRAINING_SYMBOL_TIME.reduce((p, c) => p + c * c, 0);

// Schmidl-Cox 前导：[A, A] 两段相同 720 采样宽带波形（独立伪随机图案）
// 基带 [B, B·e^{jδ}]：δ 补偿混频器在半槽处的相位步进，保证通带两段严格相同
const SC_HALF_LEN = GROSS_SYMBOL_LENGTH / 2; // 720
const SC_HALF_BB = SLOT_BB / 2;              // 90
const SC_BB = (function () {
    let seed = 12345;
    let rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    let sc_i = [], sc_q = [];
    for (let c = 0; c < CARRIER_NUMBER; c++) {
        sc_i[c] = (rnd() < 0.5 ? -1 : 1) * 2 * IQ_AMP;
        sc_q[c] = (rnd() < 0.5 ? -1 : 1) * 2 * IQ_AMP;
    }
    let sym = baseband_symbol(sc_i, sc_q);
    let dphi = -MIX_STEP * SC_HALF_LEN; // 混频器在半槽处的相位步进
    let cr = Math.cos(dphi), ci = Math.sin(dphi);
    let re = new Array(SLOT_BB), im = new Array(SLOT_BB);
    for (let m = 0; m < SC_HALF_BB; m++) {
        re[m] = sym[0][m]; im[m] = sym[1][m];
        re[SC_HALF_BB + m] = sym[0][m] * cr - sym[1][m] * ci; // e^{jδ} 旋转
        im[SC_HALF_BB + m] = sym[0][m] * ci + sym[1][m] * cr;
    }
    return [re, im];
})();
// SC 前导通带模板：单独经发射链生成并峰值归一化
const SC_PREAMBLE = (function () {
    let pb = passband_from_bb(SC_BB[0], SC_BB[1]);
    let peak = 0;
    for (let v of pb) { let a = Math.abs(v); if (a > peak) peak = a; }
    return pb.map(v => v * (0.9 / peak));
})();
const SC_ENERGY = SC_PREAMBLE.reduce((p, c) => p + c * c, 0);
const SC_DETECT_THRESHOLD = 0.2;
const SC_VALIDATE_THRESHOLD = 0.35;
const FINE_SEARCH_LEN = 16;

// ---------------- QAM4 映射/解映射 ----------------
function qam4_points(byte_stream, amp) {
    let a = 2 * amp;
    const M = [[a, a], [a, -a], [-a, a], [-a, -a]];
    let iq = [];
    for (let byte of byte_stream)
        iq.push(M[(byte & 192) >> 6], M[(byte & 48) >> 4], M[(byte & 12) >> 2], M[byte & 3]);
    return iq;
}
function qam4_decoding(input_i, input_q) {
    const L = [[3, 2], [1, 0]];
    let out = [], cur = 0;
    for (let t = 0; t < input_i.length; t++) {
        let s = L[(input_i[t] >= 0) ? 1 : 0][(input_q[t] >= 0) ? 1 : 0];
        cur |= s << ((3 - (t % 4)) * 2);
        if (t % 4 === 3) { out.push(cur); cur = 0; }
    }
    return out;
}

// ---------------- OFDM 调制/解调 ----------------
// 数据符号的基带复符号：56个数据子载波承载QAM4数据，8个散布导频点承载已知导频
function build_data_symbol_bb(points, s) {
    let si = new Array(CARRIER_NUMBER), sq = new Array(CARRIER_NUMBER);
    let po = pilot_offset(s), di = 0;
    for (let c = 0; c < CARRIER_NUMBER; c++) {
        if (c % PILOT_SPACING === po) { si[c] = PILOT_I[c]; sq[c] = PILOT_Q[c]; }
        else { si[c] = points[di][0]; sq[c] = points[di][1]; di++; }
    }
    return baseband_symbol(si, sq);
}
// ---------------- OFDM 解调：IQ混频 → 多相抽取 → 复FFT ----------------
// blk: 全速率实采样块（符号有用部分起点位于块内 LPF_GD 处，左右各 GD 余量供滤波器瞬态）
// 混频相位与发射端同为“槽内局部相位”（符号起点 = LUT 索引 CP_LENGTH），
// 使所有同类槽的载波相位一致，避免逐槽相位步进被误判为 CFO。输出与旧直相关制式同标度。
const SYM_BLK_LEN = SYMBOL_LENGTH + 2 * LPF_GD; // 1120
const RX_MIX_RE = new Float32Array(SYM_BLK_LEN), RX_MIX_IM = new Float32Array(SYM_BLK_LEN);
const RX_BB_RE = new Float32Array(BB_FFT_LEN), RX_BB_IM = new Float32Array(BB_FFT_LEN);
function demodulate_ofdm_symbol(blk) {
    // 1) IQ 混频到零中频（×e^{-jωn}）：DDS 初相对齐符号起点（= 槽内第 CP_LENGTH 采样）
    let phase = (MIX_STEP * (CP_LENGTH - LPF_GD)) % TWO_PI;
    for (let n = 0; n < SYM_BLK_LEN; n++) {
        let k = (phase * PHASE_TO_IDX) | 0;
        RX_MIX_RE[n] = blk[n] * DDS_COS[k];
        RX_MIX_IM[n] = -blk[n] * DDS_SIN[k];
        phase += MIX_STEP; if (phase >= TWO_PI) phase -= TWO_PI;
    }
    // 2) 多相抽取 ×DECIM（含群延迟对齐：bb[m] 对应块内时刻 LPF_GD + m·DECIM）
    for (let m = 0; m < BB_FFT_LEN; m++) {
        let c0 = 2 * LPF_GD + m * DECIM;
        let ar = 0, ai = 0;
        for (let j = 0; j < LPF_TAPS; j++) {
            let x = c0 - j;
            ar += LPF[j] * RX_MIX_RE[x]; ai += LPF[j] * RX_MIX_IM[x];
        }
        RX_BB_RE[m] = ar; RX_BB_IM[m] = ai;
    }
    // 3) 复 FFT，读载波 bin（×2 补偿实混频的半幅度）
    fft_radix2(RX_BB_RE, RX_BB_IM, false);
    let oi = new Array(CARRIER_NUMBER), oq = new Array(CARRIER_NUMBER);
    for (let c = 0; c < CARRIER_NUMBER; c++) {
        let k = bb_bin(c);
        oi[c] = 2 * RX_BB_RE[k]; oq[c] = 2 * RX_BB_IM[k];
    }
    return [oi, oq];
}

// ---------------- GF(2^8) 与 RS(32,16) ----------------
const GF_EXP = new Array(512), GF_LOG = new Array(256);
(function init_gf() {
    let x = 1;
    for (let i = 0; i < 255; i++) { GF_EXP[i] = x; GF_LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
    for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();
function gf_mul(a, b) { return (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]; }
function gf_div(a, b) { return GF_EXP[(GF_LOG[a] - GF_LOG[b] + 255) % 255]; }
function gf_pow(a, n) { return n === 0 ? 1 : GF_EXP[(GF_LOG[a] * n) % 255]; }
const RS_NROOTS = 16, RS_K = 16, RS_N = 32, RS_FCR = 1;
const RS_GEN = (function () {
    let g = [1];
    for (let i = 0; i < RS_NROOTS; i++) {
        let root = GF_EXP[RS_FCR + i];
        let ng = new Array(g.length + 1).fill(0);
        for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= gf_mul(g[j], root); }
        g = ng;
    }
    return g;
})();
function rs_encode(msg) {
    let res = msg.concat(new Array(RS_NROOTS).fill(0));
    for (let i = 0; i < msg.length; i++) {
        let coef = res[i];
        if (coef !== 0) for (let j = 0; j < RS_GEN.length; j++) res[i + j] ^= gf_mul(RS_GEN[j], coef);
    }
    return msg.concat(res.slice(msg.length));
}
function rs_syndromes(cw) {
    let syn = [];
    for (let i = 0; i < RS_NROOTS; i++) {
        let a = GF_EXP[RS_FCR + i], s = 0;
        for (let j = 0; j < cw.length; j++) s = gf_mul(s, a) ^ cw[j];
        syn[i] = s;
    }
    return syn;
}
function rs_berlekamp_massey(syn) {
    let C = [1], B = [1], L = 0, m = 1, b = 1;
    for (let n = 0; n < syn.length; n++) {
        let d = syn[n];
        for (let i = 1; i <= L; i++) d ^= gf_mul(C[i], syn[n - i]);
        if (d === 0) { m++; }
        else if (2 * L <= n) {
            let T = C.slice(), coef = gf_div(d, b);
            let nC = new Array(Math.max(C.length, B.length + m)).fill(0);
            for (let i = 0; i < C.length; i++) nC[i] = C[i];
            for (let i = 0; i < B.length; i++) nC[i + m] ^= gf_mul(coef, B[i]);
            C = nC; L = n + 1 - L; B = T; b = d; m = 1;
        } else {
            let coef = gf_div(d, b), nC = C.slice();
            while (nC.length < B.length + m) nC.push(0);
            for (let i = 0; i < B.length; i++) nC[i + m] ^= gf_mul(coef, B[i]);
            C = nC; m++;
        }
    }
    return C;
}
function rs_decode(cw) {
    let syn = rs_syndromes(cw);
    if (syn.every(s => s === 0)) return { bytes: cw.slice(0, RS_K), corrected: 0, fail: false };
    let lambda = rs_berlekamp_massey(syn);
    let positions = [];
    for (let i = 0; i < cw.length; i++) {
        let X = GF_EXP[(255 - i) % 255], y = 0;
        for (let j = 0; j < lambda.length; j++) y ^= gf_mul(lambda[j], gf_pow(X, j));
        if (y === 0) positions.push(cw.length - 1 - i);
    }
    if (positions.length !== lambda.length - 1) return { bytes: cw.slice(0, RS_K), corrected: 0, fail: true };
    let omega = new Array(RS_NROOTS).fill(0);
    for (let i = 0; i < RS_NROOTS; i++)
        for (let j = 0; j <= i && j < lambda.length; j++) omega[i] ^= gf_mul(lambda[j], syn[i - j]);
    let out = cw.slice();
    for (let p of positions) {
        let X = GF_EXP[(255 - (cw.length - 1 - p)) % 255];
        let num = 0, den = 0;
        for (let j = 0; j < omega.length; j++) num ^= gf_mul(omega[j], gf_pow(X, j));
        for (let j = 1; j < lambda.length; j += 2) den ^= gf_mul(lambda[j], gf_pow(X, j - 1));
        out[p] ^= gf_div(num, den);
    }
    let ok = rs_syndromes(out).every(s => s === 0);
    return { bytes: out.slice(0, RS_K), corrected: positions.length, fail: !ok };
}

// ---------------- 交织/解交织、加扰 ----------------
function interleave(data, rows) {
    let cols = data.length / rows, out = new Array(data.length);
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) out[c * rows + r] = data[r * cols + c];
    return out;
}
function deinterleave(data, rows) {
    let cols = data.length / rows, out = new Array(data.length);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[r * cols + c] = data[c * rows + r];
    return out;
}
function scramble_stream(data) {
    let lfsr = 0xACE1, out = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
        let b = 0;
        for (let k = 0; k < 8; k++) {
            let bit = lfsr & 1;
            lfsr = (lfsr >> 1) ^ (bit ? 0xB400 : 0);
            b = (b >> 1) | (bit << 7);
        }
        out[i] = data[i] ^ b;
    }
    return out;
}

// ---------------- 帧结构（packet = 一个物理帧的净荷） ----------------
const PKT_MAGIC = [0x42, 0x44, 0x34, 0x53, 0x55, 0x52]; // "BD4SUR"
const PKT_HEADER_LEN = 8;
const PKT_SYMBOLS = FRAME_DATA_SYMBOLS;                  // 交织行数 = 每帧数据符号数
const PKT_WIRE_LEN = FRAME_DATA_SYMBOLS * BYTES_PER_SYMBOL; // 224线字节/帧
const PKT_RS_BLOCKS = PKT_WIRE_LEN / RS_N;               // 7个RS(32,16)块
const PKT_UNCODED_LEN = PKT_RS_BLOCKS * RS_K;            // 112字节（编码前）
const PKT_PAYLOAD_MAX = PKT_UNCODED_LEN - PKT_HEADER_LEN;   // 104字节净荷/帧

// UTF-8 编码（AudioWorkletGlobalScope 不提供 TextEncoder，自实现）
function utf8_encode(text) {
    let out = [];
    for (let i = 0; i < text.length; i++) {
        let c = text.charCodeAt(i);
        if (c < 0x80) out.push(c);
        else if (c < 0x800) { out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F)); }
        else { out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); }
    }
    return out;
}

// 发射：文本 → 定长packet序列 → 基带槽流（每packet一帧：[SC][训练A][训练B][数据…]）
// → 一次性多相内插 + IQ混频 → 逐帧归一化
function modem_tx(text) {
    let payload = utf8_encode(text);
    let coded = [];
    let bb_re = [], bb_im = [];
    const append_slot = (sym) => { // 附加一基带槽（CP + 符号）
        for (let i = BB_FFT_LEN - CP_BB; i < BB_FFT_LEN; i++) { bb_re.push(sym[0][i]); bb_im.push(sym[1][i]); }
        for (let i = 0; i < BB_FFT_LEN; i++) { bb_re.push(sym[0][i]); bb_im.push(sym[1][i]); }
    };
    let n_packets = Math.max(1, Math.ceil(payload.length / PKT_PAYLOAD_MAX));
    for (let i = 0; i < n_packets; i++) {
        let chunk = payload.slice(i * PKT_PAYLOAD_MAX, (i + 1) * PKT_PAYLOAD_MAX);
        let block = PKT_MAGIC.concat([chunk.length, i % 256], chunk);
        while (block.length < PKT_UNCODED_LEN) block.push(0);
        let pkt_coded = [];
        for (let b = 0; b < PKT_RS_BLOCKS; b++)
            pkt_coded = pkt_coded.concat(rs_encode(block.slice(b * RS_K, (b + 1) * RS_K)));
        coded = coded.concat(pkt_coded);
        let tx_bytes = scramble_stream(interleave(pkt_coded, PKT_SYMBOLS));
        let pts = qam4_points(tx_bytes, IQ_AMP);
        while (pts.length < FRAME_DATA_SYMBOLS * DATA_CARRIERS) pts.push([2 * IQ_AMP, -2 * IQ_AMP]);
        for (let t = 0; t < SLOT_BB; t++) { bb_re.push(SC_BB[0][t]); bb_im.push(SC_BB[1][t]); } // SC 粗同步前导
        append_slot(TRAINING_BB); // 训练A
        append_slot(TRAINING_BB); // 训练B（与A相同，用于CFO/SFO估计）
        for (let s = 0; s < FRAME_DATA_SYMBOLS; s++) {
            append_slot(build_data_symbol_bb(pts.slice(s * DATA_CARRIERS, (s + 1) * DATA_CARRIERS), s));
            if ((s + 1) % TRAINING_SYMBOL_INTERVAL === 0 && s + 1 < FRAME_DATA_SYMBOLS)
                append_slot(TRAINING_BB);
        }
    }
    let wave = passband_from_bb(bb_re, bb_im);
    // 逐帧峰值归一化：SC 槽与帧体分别归一到 0.9
    for (let f = 0; f < n_packets; f++) {
        let base = f * FRAME_LENGTH;
        for (let region of [[base, base + GROSS_SYMBOL_LENGTH], [base + GROSS_SYMBOL_LENGTH, base + FRAME_LENGTH]]) {
            let peak = 0;
            for (let n = region[0]; n < region[1]; n++) { let a = Math.abs(wave[n]); if (a > peak) peak = a; }
            if (peak > 0) { let sc = 0.9 / peak; for (let n = region[0]; n < region[1]; n++) wave[n] *= sc; }
        }
    }
    return { wave: wave, coded: coded, payload: payload };
}

// ============================================================================
// 接收机（流式状态机："sync" 搜索SC前导 ⇄ "frame" 帧内逐槽接收）
// ============================================================================
class Receiver {
    constructor(post) {
        this.post = post; // 事件上报回调
        this.config = { vizRate: 5 };
        this.det_ring = new RingBuffer(DET_RING_CAP);   // SC检测历史
        this.buf_ring = new RingBuffer(BUF_RING_CAP);   // 帧接收缓冲
        this.sym_blk = new Float32Array(SYM_BLK_LEN); // 符号块暂存（含滤波器余量，避免逐符号堆分配）
        this.reset();
    }
    reset() {
        this.state = "sync"; // "sync"=搜索SC前导 / "frame"=帧内逐槽接收
        this.det_ring.clear(); this.buf_ring.clear();
        this.stall_count = 0;
        this.signal_power = 1;
        this.wave_len = 0;
        this.is_soft_loop = false;
        this.fec_info = null;
        // SC 检测器
        this.feed_abs = 0; this.searched_upto = 0;
        this.best_metric = -1; this.best_offset = 0;
        // 帧内状态
        this.frame_slot = 0;      // 已消费到的槽号（0=SC前导，1..=FRAME_SCHEDULE）
        this.frame_data_idx = 0;  // 帧内数据符号索引（决定散布导频位置）
        this.pkt_buf = [];
        this.last_seq = -1;
        this.round_stat = null;
        // 信道估计与频偏补偿
        this.chan_hi = null; this.chan_hq = null;
        this.trA_iq = null;              // 训练A的原始IQ（与B求相位差以估计CFO/SFO）
        this.cfo_a = 0; this.sfo_b = 0;  // 相位速率 φ(槽) = a + b·f（b 为门控后的启用值）
        this.sfo_b_ema = 0;              // SFO 斜率的跨帧 EMA 平滑值
        this.sfo_enable_streak = 0;      // SFO 超门限连续帧数（迟滞确认）
        this.cfo_ref_slot = 2;           // CFO/SFO补偿参考面所在槽号（逐训练槽推进）
        this.tau_ref = 0;                // 信道估计的定时参考（最近训练槽细同步位置）
        this.trainA_fbd = 0;             // 训练A的细同步位置（拟合扣除定时差用）
        this.train_miss = 0;             // 训练符号连续失锁计数（容忍1次）
        this.lastVizTime = 0;
        this.lastBuflenTime = 0;
    }
    log(msg) { this.post({ cmd: "log", msg: msg }); }
    viz(wave, iq) {
        if (this.config.vizRate <= 0) return;
        let now = Date.now();
        if (now - this.lastVizTime < 1000 / this.config.vizRate) return;
        this.lastVizTime = now;
        this.post({ cmd: "viz", wave: wave.slice(), iq: [iq[0].slice(), iq[1].slice()] });
    }
    update_stat() {
        if (!this.round_stat) return;
        this.post({
            cmd: "stat",
            pre_err: this.round_stat.pre_err, pre_total: this.round_stat.pre_total,
            post_err: this.round_stat.post_err, post_total: this.round_stat.post_total,
            corrected: this.round_stat.corrected, fail_blocks: this.round_stat.fail_blocks,
            bad_frames: this.round_stat.bad_frames
        });
    }
    compute_ber(received, expected) {
        let errors = 0, n = Math.min(received.length, expected.length);
        for (let i = 0; i < n; i++) { let x = received[i] ^ expected[i]; while (x) { errors += x & 1; x >>= 1; } }
        errors += Math.abs(received.length - expected.length) * 8;
        let total = Math.max(received.length, expected.length) * 8;
        return { errors: errors, total: total };
    }
    try_decode_packet(pkt_raw) {
        let pkt = scramble_stream(pkt_raw);
        let rx_coded = deinterleave(pkt, PKT_SYMBOLS);
        let block = [], corrected = 0, fail_blocks = 0;
        for (let b = 0; b < PKT_RS_BLOCKS; b++) {
            let dec = rs_decode(rx_coded.slice(b * RS_N, (b + 1) * RS_N));
            corrected += dec.corrected;
            if (dec.fail) fail_blocks++;
            block = block.concat(dec.bytes);
        }
        if (!PKT_MAGIC.every((m, i) => block[i] === m))
            return { ok: false, block: block, fail_blocks: fail_blocks };
        let len = Math.min(block[6], PKT_PAYLOAD_MAX);
        return { ok: true, seq: block[7], payload: block.slice(PKT_HEADER_LEN, PKT_HEADER_LEN + len), rx_coded: rx_coded, corrected: corrected, fail_blocks: fail_blocks };
    }
    // 帧尾解包：一个物理帧 = 一个packet
    decode_frame(pkt_raw) {
        let r = this.try_decode_packet(pkt_raw);
        let rx_coded = r.ok ? r.rx_coded : deinterleave(scramble_stream(pkt_raw), PKT_SYMBOLS);
        let index = r.ok ? r.seq : (this.last_seq + 1) % 256;
        // 软环路新一轮：收到0号帧 → 清空显示与统计
        if (this.is_soft_loop && r.ok && r.seq === 0) {
            this.post({ cmd: "text", bytes: new Uint8Array(0), roundReset: true });
            this.round_stat = { pre_err: 0, pre_total: 0, post_err: 0, post_total: 0, corrected: 0, fail_blocks: 0, bad_frames: 0 };
        }
        if (!this.round_stat) this.round_stat = { pre_err: 0, pre_total: 0, post_err: 0, post_total: 0, corrected: 0, fail_blocks: 0, bad_frames: 0 };
        if (this.fec_info && (index + 1) * PKT_WIRE_LEN <= this.fec_info.coded.length) {
            let s = this.compute_ber(rx_coded, this.fec_info.coded.slice(index * PKT_WIRE_LEN, (index + 1) * PKT_WIRE_LEN));
            this.round_stat.pre_err += s.errors; this.round_stat.pre_total += s.total;
        }
        if (!r.ok) {
            this.round_stat.fail_blocks += PKT_RS_BLOCKS;
            this.round_stat.bad_frames++;
            let hex = r.block ? r.block.slice(0, 10).map(b => b.toString(16).padStart(2, "0")).join(" ") : "-";
            this.log("坏帧（magic 不符，丢弃）头部=[" + hex + "] RS失败块=" + r.fail_blocks);
        } else {
            this.round_stat.corrected += r.corrected;
            this.round_stat.fail_blocks += r.fail_blocks;
            if (this.last_seq >= 0 && r.seq !== 0 && r.seq !== (this.last_seq + 1) % 256) {
                this.log("帧序号不连续：" + this.last_seq + " → " + r.seq + "（丢帧）");
            }
            this.last_seq = r.seq;
            if (this.fec_info) {
                let s = this.compute_ber(r.payload, this.fec_info.payload.slice(index * PKT_PAYLOAD_MAX, index * PKT_PAYLOAD_MAX + r.payload.length));
                this.round_stat.post_err += s.errors; this.round_stat.post_total += s.total;
            }
            this.post({ cmd: "text", bytes: Uint8Array.from(r.payload), roundReset: false });
        }
        this.update_stat();
    }

    // ---- 信道估计与频偏补偿 ----
    // 由训练符号IQ估计各子载波信道响应 H = rx/tx
    channel_from_training(tr_iq) {
        let hi = new Array(CARRIER_NUMBER), hq = new Array(CARRIER_NUMBER);
        for (let c = 0; c < CARRIER_NUMBER; c++) {
            let ti = TRAINING_I[c], tq = TRAINING_Q[c];
            let denom = ti * ti + tq * tq;
            hi[c] = (tr_iq[0][c] * ti + tr_iq[1][c] * tq) / denom;
            hq[c] = (tr_iq[1][c] * ti - tr_iq[0][c] * tq) / denom;
        }
        return [hi, hq];
    }
    // 训练A/B逐载波相位差 → 拟合相位速率 φ(槽) = a + b·f（a≈CFO，b≈SFO）
    // 关键：相位差中含两段训练细同步的整数定时差 Δfbd 引起的线性斜坡 2πf·Δfbd/Fs，
    // 与 SFO 不可区分，必须先扣除（dtau 参数），否则定时抖动(±1采样≈±1111ppm)被误判为SFO。
    // 斜率项 b 跨帧 EMA 平滑（定时抖动零均值、真实SFO恒定相干积累），
    // 并按影响门限启用：|b| 在最大外推跨度(6槽)带边上的相位影响 < ~0.1rad 时弃用，
    // 避免低 SNR 下含噪斜率经多槽外推注入逐载波差异相位误差（导频只能校正公共相位）。
    fit_cfo(h1, h2, dtau) {
        let sw = 0, swf = 0, swp = 0, swff = 0, swfp = 0;
        for (let c = 0; c < CARRIER_NUMBER; c++) {
            let dpr = h2[0][c] * h1[0][c] + h2[1][c] * h1[1][c]; // H2·conj(H1)
            let dpi = h2[1][c] * h1[0][c] - h2[0][c] * h1[1][c];
            let phi = Math.atan2(dpi, dpr) + 2 * Math.PI * CARRIER_FREQS[c] * dtau / SAMPLE_RATE; // 扣除定时斜坡
            let w = Math.sqrt(dpr * dpr + dpi * dpi); // |H1||H2| 加权，深衰落载波降权
            let f = CARRIER_FREQS[c];
            sw += w; swf += w * f; swp += w * phi; swff += w * f * f; swfp += w * f * phi;
        }
        if (sw < 1e-12) return;
        let det = sw * swff - swf * swf;
        let a, b;
        if (Math.abs(det) < 1e-12) { a = swp / sw; b = 0; }
        else {
            a = (swp * swff - swf * swfp) / det;
            b = (sw * swfp - swf * swp) / det;
        }
        this.cfo_a = a;
        // SFO 斜率项：跨帧 EMA 平滑（定时抖动零均值，真实 SFO 相干积累），
        // 高门限（500ppm）+连续2帧确认的迟滞启用——实测表明 ≤300ppm 时被动跟踪
        // （细同步步进+每6槽信道重估+散布导频）已足够稳健，含噪斜率经多槽外推
        // 反而注入误差；门限仅作为病态大频偏的安全阀。
        this.sfo_b_ema = 0.75 * this.sfo_b_ema + 0.25 * b;
        let ppm = this.sfo_b_ema / (2 * Math.PI * T_SLOT) * 1e6;
        // 高门限(500ppm) + 连续2帧确认的迟滞，仅病态大频偏才启用显式斜率补偿
        if (Math.abs(ppm) >= 500) this.sfo_enable_streak = Math.min(this.sfo_enable_streak + 1, 3);
        else this.sfo_enable_streak = 0;
        let ppm_used = (this.sfo_enable_streak >= 2) ? Math.max(-600, Math.min(600, ppm)) : 0;
        this.sfo_b = ppm_used * (2 * Math.PI * T_SLOT) / 1e6;
        this.log("CFO/SFO 估计：CFO=" + (a / (2 * Math.PI * T_SLOT)).toFixed(3) +
                 "Hz，SFO=" + (b / (2 * Math.PI * T_SLOT) * 1e6).toFixed(1) +
                 "ppm（平滑后 " + ppm.toFixed(1) + (ppm_used === 0 ? "，被动跟踪" : "，启用补偿") + "）");
    }
    // 对IQ施加显式CFO/SFO补偿：各子载波乘以 e^{-j(a+b·f)·slots}
    derotate_iq(iq, slots) {
        if (slots === 0 || (this.cfo_a === 0 && this.sfo_b === 0)) return;
        for (let c = 0; c < CARRIER_NUMBER; c++) {
            let ph = (this.cfo_a + this.sfo_b * CARRIER_FREQS[c]) * slots;
            let cr = Math.cos(ph), ci = Math.sin(ph);
            let ii = iq[0][c], qq = iq[1][c];
            iq[0][c] = ii * cr + qq * ci;
            iq[1][c] = qq * cr - ii * ci;
        }
    }
    // 散布导频：估计本符号残余公共相位并去旋转，同时在导频点跟踪更新信道
    pilot_track(iq, s) {
        let po = pilot_offset(s);
        let zr = 0, zi = 0;
        for (let c = 0; c < CARRIER_NUMBER; c++) {
            if (c % PILOT_SPACING !== po) continue;
            // 期望接收值 = H·P
            let er = this.chan_hi[c] * PILOT_I[c] - this.chan_hq[c] * PILOT_Q[c];
            let ei = this.chan_hi[c] * PILOT_Q[c] + this.chan_hq[c] * PILOT_I[c];
            zr += iq[0][c] * er + iq[1][c] * ei; // Σ rx·conj(期望)
            zi += iq[1][c] * er - iq[0][c] * ei;
        }
        let theta = Math.atan2(zi, zr);
        if (Math.abs(theta) > 1e-9) {
            let cr = Math.cos(theta), ci = Math.sin(theta);
            for (let c = 0; c < CARRIER_NUMBER; c++) {
                let ii = iq[0][c], qq = iq[1][c];
                iq[0][c] = ii * cr + qq * ci;
                iq[1][c] = qq * cr - ii * ci;
            }
        }
        // 导频点信道跟踪（相位已对齐，α=0.25 指数融合）
        const ALPHA = 0.25;
        for (let c = 0; c < CARRIER_NUMBER; c++) {
            if (c % PILOT_SPACING !== po) continue;
            let pr = PILOT_I[c], pq = PILOT_Q[c], denom = pr * pr + pq * pq;
            let hr = (iq[0][c] * pr + iq[1][c] * pq) / denom;
            let hq = (iq[1][c] * pr - iq[0][c] * pq) / denom;
            this.chan_hi[c] = (1 - ALPHA) * this.chan_hi[c] + ALPHA * hr;
            this.chan_hq[c] = (1 - ALPHA) * this.chan_hq[c] + ALPHA * hq;
        }
    }
    // 单抽头频域均衡
    equalize(iq) {
        for (let c = 0; c < CARRIER_NUMBER; c++) {
            let hi = this.chan_hi[c], hq = this.chan_hq[c];
            let denom = hi * hi + hq * hq;
            if (denom < 1e-6) denom = 1e-6;
            let ii = iq[0][c], qq = iq[1][c];
            iq[0][c] = (ii * hi + qq * hq) / denom;
            iq[1][c] = (qq * hi - ii * hq) / denom;
        }
    }

    // 主喂入入口：一帧采样（软环路帧或麦克风音频块；信道损伤由上游完成）
    // frame 可为 Array 或 Float32Array；全程环形缓冲 O(1) 写入/丢弃，稳态零堆分配
    feed(frame) {
        this.feed_abs += frame.length;
        this.det_ring.write(frame);
        this.buf_ring.write(frame);
        let now = Date.now();
        if (now - this.lastBuflenTime >= 100) { // 遥测降频，避免小块音频时刷屏主线程
            this.lastBuflenTime = now;
            this.post({ cmd: "buflen", n: this.buf_ring.len });
        }

        // ---- 流式粗同步：SC前导检测（增量滑动自相关，每采样仅约12次乘加） ----
        if (this.state === "sync") {
            let rb = this.det_ring.buf, rm = this.det_ring.mask, rs = this.det_ring.start;
            let base = this.feed_abs - this.det_ring.len;
            let d_begin = Math.max(this.searched_upto, base);
            let d_max = this.feed_abs - 2 * SC_HALF_LEN;
            if (d_max >= d_begin) {
                let i0 = rs + (d_begin - base), P = 0, R = 0, E1 = 0;
                for (let n = 0; n < SC_HALF_LEN; n++) {
                    let x1 = rb[(i0 + n) & rm], x2 = rb[(i0 + n + SC_HALF_LEN) & rm];
                    P += x1 * x2; R += x2 * x2; E1 += x1 * x1;
                }
                for (let d = d_begin; d <= d_max; d += 4) {
                    let metric = (P * P) / (E1 * R + 1e-12);
                    if (metric > this.best_metric) { this.best_metric = metric; this.best_offset = d; }
                    let steps = Math.min(4, d_max - d);
                    let j0 = rs + (d - base);
                    for (let s = 0; s < steps; s++) {
                        let j = j0 + s;
                        let x0 = rb[j & rm], x1 = rb[(j + SC_HALF_LEN) & rm], x2 = rb[(j + 2 * SC_HALF_LEN) & rm];
                        P += -x0 * x1 + x1 * x2;
                        R += -x1 * x1 + x2 * x2;
                        E1 += -x0 * x0 + x1 * x1;
                    }
                }
                this.searched_upto = d_max + 1;
            }
            if (this.best_metric >= SC_DETECT_THRESHOLD && this.searched_upto > this.best_offset + SC_HALF_LEN) {
                let t_offset = this.best_offset, validate_metric = -1;
                let d0 = Math.max(this.best_offset - 360, base);
                let d1 = Math.min(this.best_offset + 360, this.feed_abs - 2 * SC_HALF_LEN);
                for (let d = d0; d <= d1; d++) {
                    let j0 = rs + (d - base), corr = 0, e = 0;
                    for (let t = 0; t < 2 * SC_HALF_LEN; t++) {
                        let x = rb[(j0 + t) & rm];
                        corr += x * SC_PREAMBLE[t]; e += x * x;
                    }
                    let m = (corr * corr) / (e * SC_ENERGY + 1e-12);
                    if (m > validate_metric) { validate_metric = m; t_offset = d; }
                }
                if (validate_metric < SC_VALIDATE_THRESHOLD) {
                    this.best_metric = -1;
                } else {
                    let drop = t_offset + GROSS_SYMBOL_LENGTH - FINE_SEARCH_LEN - (this.feed_abs - this.buf_ring.len);
                    if (drop > 0) this.buf_ring.drop(drop);
                    this.post({ cmd: "offset", v: t_offset });
                    this.state = "frame";
                    this.frame_slot = 1; this.frame_data_idx = 0; this.pkt_buf = [];
                    this.chan_hi = null; this.trA_iq = null;
                    this.cfo_a = 0; this.sfo_b = 0; this.cfo_ref_slot = 2;
                    this.train_miss = 0;
                    this.stall_count = 0;
                    if (!this.round_stat) this.round_stat = { pre_err: 0, pre_total: 0, post_err: 0, post_total: 0, corrected: 0, fail_blocks: 0, bad_frames: 0 };
                    this.log("SC 粗同步 @" + t_offset + "（精化度量 " + validate_metric.toFixed(3) + "）");
                    this.best_metric = -1;
                }
            }
            // 注：环形缓冲定容后自动覆盖最旧采样，无需手动裁剪
        }

        // ---- 帧内逐槽消费 ----
        if (this.state !== "frame") return;
        let ab = this.buf_ring.buf, am = this.buf_ring.mask;
        while (this.state === "frame" && this.buf_ring.len >= GROSS_SYMBOL_LENGTH + 2 * FINE_SEARCH_LEN + LPF_GD) {
            this.stall_count = 0;
            let as0 = this.buf_ring.start; // drop 会推进 start，每轮重取
            let type = FRAME_SCHEDULE[this.frame_slot - 1];
            if (type === "T") {
                // 训练槽：细同步 + 信道估计（帧头A/B另用于CFO/SFO估计）
                let fbm = -1, fbd = FINE_SEARCH_LEN;
                for (let d = 0; d <= 2 * FINE_SEARCH_LEN; d++) {
                    let j0 = as0 + d, corr = 0, energy = 0;
                    for (let t = 0; t < GROSS_SYMBOL_LENGTH; t++) {
                        let x = ab[(j0 + t) & am];
                        corr += x * TRAINING_SYMBOL_TIME[t];
                        energy += x * x;
                    }
                    let m = (corr * corr) / (energy * TRAINING_TPL_ENERGY + 1e-12);
                    if (m > fbm) { fbm = m; fbd = d; }
                }
                if (fbm < 0.5) {
                    // 失锁容忍：一次失锁按标称定时继续（定时偏差可由CP吸收），连续两次才中止本帧
                    this.train_miss++;
                    if (this.train_miss >= 2) {
                        this.log("训练网格连续失锁（相关度 " + fbm.toFixed(3) + "），中止本帧，重新搜索前导");
                        this.state = "sync";
                        this.train_miss = 0;
                        break;
                    }
                    this.log("训练符号相关度偏低（ " + fbm.toFixed(3) + "），按标称定时继续");
                    fbd = FINE_SEARCH_LEN;
                } else {
                    this.train_miss = 0;
                }
                // 取符号块（含滤波器余量）→ 混频+抽取+FFT；块绝对序号供混频相位
                this.buf_ring.read_to(this.sym_blk, fbd + CP_LENGTH - LPF_GD, SYM_BLK_LEN);
                this.buf_ring.drop(fbd + GROSS_SYMBOL_LENGTH - FINE_SEARCH_LEN);
                let tr_iq = demodulate_ofdm_symbol(this.sym_blk);
                if (this.frame_slot === 1) {
                    this.trA_iq = tr_iq; // 暂存训练A，等待B配对
                    this.trainA_fbd = fbd;
                } else if (this.frame_slot === 2) {
                    let h1 = this.channel_from_training(this.trA_iq);
                    let h2 = this.channel_from_training(tr_iq);
                    this.fit_cfo(h1, h2, fbd - this.trainA_fbd); // 显式CFO/SFO估计（扣除定时差）
                    this.chan_hi = h2[0]; this.chan_hq = h2[1]; // 信道参考面：槽2、定时 fbd
                    this.cfo_ref_slot = 2;
                    this.tau_ref = fbd;
                    this.trA_iq = null;
                } else {
                    // 帧中训练：先把信道参考面推进到本槽（漂移项 + 定时差旋转），再融合
                    let h = this.channel_from_training(tr_iq);
                    let dt = this.frame_slot - this.cfo_ref_slot;
                    for (let c = 0; c < CARRIER_NUMBER; c++) {
                        let ph = (this.cfo_a + this.sfo_b * CARRIER_FREQS[c]) * dt;
                        let tq = 2 * Math.PI * CARRIER_FREQS[c] * (fbd - this.tau_ref) / SAMPLE_RATE;
                        let cr = Math.cos(ph - tq), ci = Math.sin(ph - tq);
                        let hi = this.chan_hi[c], hq = this.chan_hq[c];
                        this.chan_hi[c] = hi * cr - hq * ci;
                        this.chan_hq[c] = hi * ci + hq * cr;
                        this.chan_hi[c] = 0.5 * this.chan_hi[c] + 0.5 * h[0][c];
                        this.chan_hq[c] = 0.5 * this.chan_hq[c] + 0.5 * h[1][c];
                    }
                    this.cfo_ref_slot = this.frame_slot;
                    this.tau_ref = fbd;
                }
            } else {
                // 数据槽：显式CFO/SFO补偿 → 散布导频相位/信道跟踪 → 均衡 → 解映射
                this.buf_ring.read_to(this.sym_blk, FINE_SEARCH_LEN + CP_LENGTH - LPF_GD, SYM_BLK_LEN);
                this.buf_ring.drop(GROSS_SYMBOL_LENGTH);
                let frame_iq = demodulate_ofdm_symbol(this.sym_blk);
                this.derotate_iq(frame_iq, this.frame_slot - this.cfo_ref_slot);
                if (this.chan_hi !== null) {
                    this.pilot_track(frame_iq, this.frame_data_idx);
                    this.equalize(frame_iq);
                }
                this.viz(this.sym_blk.subarray(LPF_GD, LPF_GD + SYMBOL_LENGTH), frame_iq);
                // 提取数据子载波（剔除本符号的散布导频点）
                let po = pilot_offset(this.frame_data_idx);
                let di = [], dq = [];
                for (let c = 0; c < CARRIER_NUMBER; c++) {
                    if (c % PILOT_SPACING !== po) { di.push(frame_iq[0][c]); dq.push(frame_iq[1][c]); }
                }
                let frame_bytes = qam4_decoding(di, dq);
                for (let n = 0; n < frame_bytes.length; n++) this.pkt_buf.push(frame_bytes[n]);
                this.frame_data_idx++;
            }
            this.frame_slot++;
            if (this.frame_slot > FRAME_SCHEDULE.length) {
                // 帧尾：解包，随后回到同步搜索，等待下一帧（定期重启同步/冷启动切入）
                if (this.pkt_buf.length === PKT_WIRE_LEN) this.decode_frame(this.pkt_buf);
                else this.log("帧长度异常（" + this.pkt_buf.length + "B），丢弃");
                this.pkt_buf = [];
                this.state = "sync";
            }
        }
        // 停滞看门狗：帧接收中途信号长时间中断则回同步搜索
        if (this.state === "frame") {
            this.stall_count++;
            if (this.stall_count > 500) {
                this.log("帧接收停滞，回到同步搜索");
                this.state = "sync";
                this.stall_count = 0;
            }
        }
    }
}

// ============================================================================
// AudioWorklet 封装
// ============================================================================
class OFDMModemProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.receiver = new Receiver((m) => this.port.postMessage(m));
        this.port.onmessage = (e) => {
            let d = e.data;
            if (d.cmd === "tx") {
                // 无状态发射构建：不改变接收机状态
                let r = modem_tx(d.text);
                this.port.postMessage({ cmd: "txwave", wave: r.wave, coded: r.coded, payload: r.payload });
            } else if (d.cmd === "soft_start") {
                this.receiver.reset();
                this.receiver.is_soft_loop = true;
                this.receiver.wave_len = d.wave_len;
                this.receiver.signal_power = d.signal_power;
                this.receiver.fec_info = { coded: d.coded, payload: d.payload };
            } else if (d.cmd === "soft") {
                this.receiver.feed(d.samples);
            } else if (d.cmd === "mic_start") {
                this.receiver.is_soft_loop = false;
                this.receiver.wave_len = 0;
                this.receiver.fec_info = null;
                this.receiver.reset();
            } else if (d.cmd === "config") {
                Object.assign(this.receiver.config, d.config);
            } else if (d.cmd === "stop") {
                this.receiver.reset();
            }
        };
    }
    process(inputs) {
        let input = inputs[0];
        if (input && input[0] && input[0].length > 0) {
            this.receiver.feed(input[0]); // Float32Array 直传，零拷贝
        }
        return true;
    }
}
registerProcessor("ofdm-modem", OFDMModemProcessor);
