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
//   调制/解调采用 FFT 制式：载波梳对齐 1024 点基2 FFT 的整数 bin，
//   调制=共轭对称填 bin + IFFT（直接得通带实信号），解调=实 FFT + 读 bin。
// ============================================================================

// ---------------- 系统参数 ----------------
const SAMPLE_RATE    = 48000;
const BASE_FREQ      = 46.875;    // 子载波间隔(Hz)
const CARRIER_NUMBER = 64;    // 正交子载波数
const CARRIER_FREQ   = 1992.1875; // 通带中心频率(Hz)：= 46.875×42.5，使载波梳对齐 FFT 整数 bin（bin 11~74）
const BANDWIDTH = BASE_FREQ * CARRIER_NUMBER;
const SYMBOL_LENGTH = Math.round(SAMPLE_RATE / BASE_FREQ); // 符号长度（采样点）
const CP_LENGTH = Math.floor(0.4 * SYMBOL_LENGTH);         // 循环前缀长度
const GROSS_SYMBOL_LENGTH = SYMBOL_LENGTH + CP_LENGTH;     // 槽长（符号+CP）
const TRAINING_SYMBOL_INTERVAL = 5; // 帧内每几个数据符号插入一个块状训练符号
const IQ_AMP = 0.02;
const T_SLOT = GROSS_SYMBOL_LENGTH / SAMPLE_RATE;          // 槽长（秒）

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

// ---------------- FFT 制式：载波梳与 bin 栅格对齐 ----------------
// 符号长度必须为 2 的幂（基2 FFT）；各子载波频率必须为 BASE_FREQ 的整数倍，
// 即恰好落在 FFT 的整数 bin 上（bin = CARRIER_BIN_BASE + c），调制=IFFT、解调=FFT。
const FFT_LEN = SYMBOL_LENGTH; // 1024 = 2^10
const CARRIER_BIN_BASE = CARRIER_FREQ / BASE_FREQ - (CARRIER_NUMBER - 1) / 2;
if ((FFT_LEN & (FFT_LEN - 1)) !== 0 || Math.abs(CARRIER_BIN_BASE - Math.round(CARRIER_BIN_BASE)) > 1e-9)
    throw new Error("FFT 制式要求：符号长度为 2 的幂且载波梳对齐整数 bin");
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
function add_cyclic_prefix(wave, cp_length) {
    let out = new Array(wave.length + cp_length);
    for (let i = 0; i < cp_length; i++) out[i] = wave[wave.length - cp_length + i];
    for (let i = 0; i < wave.length; i++) out[cp_length + i] = wave[i];
    return out;
}
// 生成一个OFDM符号：64个子载波IQ填入共轭对称bin，IFFT直接得到通带实信号
// 标度与旧直相关制式一致：x[n] = (2/N)Σ_c [si·cos(2πf_c·n/Fs) − sq·sin(2πf_c·n/Fs)]
function generate_symbol_wave(symbol_iq, has_cp) {
    let [si, sq] = symbol_iq;
    let re = new Float32Array(FFT_LEN), im = new Float32Array(FFT_LEN);
    for (let c = 0; c < CARRIER_NUMBER; c++) {
        let k = Math.round(CARRIER_BIN_BASE) + c;
        re[k] = si[c]; im[k] = sq[c];          // X[k] = si + j·sq
        re[FFT_LEN - k] = si[c]; im[FFT_LEN - k] = -sq[c]; // 共轭对称 → 实时域
    }
    fft_radix2(re, im, true);
    let w = Array.from(re);
    let out = has_cp ? add_cyclic_prefix(w, CP_LENGTH) : w;
    return raised_cosine_window(out, 0.01);
}

const TRAINING_SYMBOL_TIME = generate_symbol_wave([TRAINING_I, TRAINING_Q], true);
const TRAINING_TPL_ENERGY = TRAINING_SYMBOL_TIME.reduce((p, c) => p + c * c, 0);

// Schmidl-Cox 前导：[A, A] 两段相同 720 采样宽带波形（独立伪随机图案）
const SC_HALF_LEN = Math.floor(GROSS_SYMBOL_LENGTH / 2);
const SC_PREAMBLE = (function () {
    let seed = 12345;
    let rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    let sc_i = [], sc_q = [];
    for (let c = 0; c < CARRIER_NUMBER; c++) {
        sc_i[c] = (rnd() < 0.5 ? -1 : 1) * 2 * IQ_AMP;
        sc_q[c] = (rnd() < 0.5 ? -1 : 1) * 2 * IQ_AMP;
    }
    let full = generate_symbol_wave([sc_i, sc_q], false);
    let half = full.slice(0, SC_HALF_LEN);
    let pre = half.concat(half);
    raised_cosine_window(pre, 0.01);
    let peak = 0;
    for (let v of pre) { let a = Math.abs(v); if (a > peak) peak = a; }
    return pre.map(v => v * (0.9 / peak));
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
// 数据符号：56个数据子载波承载QAM4数据，8个散布导频点承载已知导频
function build_data_symbol_wave(points, s) {
    let si = new Array(CARRIER_NUMBER), sq = new Array(CARRIER_NUMBER);
    let po = pilot_offset(s), di = 0;
    for (let c = 0; c < CARRIER_NUMBER; c++) {
        if (c % PILOT_SPACING === po) { si[c] = PILOT_I[c]; sq[c] = PILOT_Q[c]; }
        else { si[c] = points[di][0]; sq[c] = points[di][1]; di++; }
    }
    return generate_symbol_wave([si, sq], true);
}
// 单个物理帧波形：[SC前导][训练A][训练B][数据符号（每5个后插训练）]
function modulate_frame(tx_bytes) {
    let pts = qam4_points(tx_bytes, IQ_AMP);
    while (pts.length < FRAME_DATA_SYMBOLS * DATA_CARRIERS) pts.push([2 * IQ_AMP, -2 * IQ_AMP]);
    let body = [];
    for (let v of TRAINING_SYMBOL_TIME) body.push(v); // 训练A
    for (let v of TRAINING_SYMBOL_TIME) body.push(v); // 训练B（与A相同，用于CFO/SFO估计）
    for (let s = 0; s < FRAME_DATA_SYMBOLS; s++) {
        for (let v of build_data_symbol_wave(pts.slice(s * DATA_CARRIERS, (s + 1) * DATA_CARRIERS), s)) body.push(v);
        if ((s + 1) % TRAINING_SYMBOL_INTERVAL === 0 && s + 1 < FRAME_DATA_SYMBOLS)
            for (let v of TRAINING_SYMBOL_TIME) body.push(v);
    }
    // 帧体峰值归一化（与前导幅度齐平）
    let peak = 0;
    for (let v of body) { let x = Math.abs(v); if (x > peak) peak = x; }
    if (peak > 0) { let scale = 0.9 / peak; for (let t = 0; t < body.length; t++) body[t] *= scale; }
    return SC_PREAMBLE.concat(body);
}
// 解调一个OFDM符号：FFT 后直读载波 bin，bin 复值即 (si + j·sq)（与旧直相关输出完全一致）
// RX_FFT_RE/IM 为模块级暂存，稳态零堆分配
const RX_FFT_RE = new Float32Array(FFT_LEN), RX_FFT_IM = new Float32Array(FFT_LEN);
function demodulate_ofdm_symbol(symbol_wave) {
    RX_FFT_RE.set(symbol_wave); RX_FFT_IM.fill(0);
    fft_radix2(RX_FFT_RE, RX_FFT_IM, false);
    let oi = new Array(CARRIER_NUMBER), oq = new Array(CARRIER_NUMBER);
    let kb = Math.round(CARRIER_BIN_BASE);
    for (let c = 0; c < CARRIER_NUMBER; c++) {
        oi[c] = RX_FFT_RE[kb + c]; oq[c] = RX_FFT_IM[kb + c];
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

// 发射：文本 → 定长packet序列 → 每packet独立封装为一个物理帧，逐帧拼接
function modem_tx(text) {
    let payload = utf8_encode(text);
    let coded = [], wave = [];
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
        wave = wave.concat(modulate_frame(tx_bytes));
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
        this.sym_scratch = new Float32Array(SYMBOL_LENGTH); // 符号波形暂存（避免逐符号堆分配）
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
        this.cfo_a = 0; this.sfo_b = 0;  // 相位速率 φ(槽) = a + b·f
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
    // 训练A/B逐载波相位差 → 按载波频率加权最小二乘拟合 φ(槽) = a + b·f
    // a 对应公共载波频偏(CFO)，b 对应采样率偏差(SFO)
    fit_cfo(h1, h2) {
        let sw = 0, swf = 0, swp = 0, swff = 0, swfp = 0;
        for (let c = 0; c < CARRIER_NUMBER; c++) {
            let dpr = h2[0][c] * h1[0][c] + h2[1][c] * h1[1][c]; // H2·conj(H1)
            let dpi = h2[1][c] * h1[0][c] - h2[0][c] * h1[1][c];
            let phi = Math.atan2(dpi, dpr);
            let w = Math.sqrt(dpr * dpr + dpi * dpi); // |H1||H2| 加权，深衰落载波降权
            let f = CARRIER_FREQS[c];
            sw += w; swf += w * f; swp += w * phi; swff += w * f * f; swfp += w * f * phi;
        }
        if (sw < 1e-12) return;
        let det = sw * swff - swf * swf;
        if (Math.abs(det) < 1e-12) { this.cfo_a = swp / sw; this.sfo_b = 0; }
        else {
            this.cfo_a = (swp * swff - swf * swfp) / det;
            this.sfo_b = (sw * swfp - swf * swp) / det;
        }
        this.log("CFO/SFO 估计：CFO=" + (this.cfo_a / (2 * Math.PI * T_SLOT)).toFixed(3) +
                 "Hz，SFO=" + (this.sfo_b / (2 * Math.PI * T_SLOT) * 1e6).toFixed(1) + "ppm");
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
                    this.cfo_a = 0; this.sfo_b = 0;
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
        while (this.state === "frame" && this.buf_ring.len >= GROSS_SYMBOL_LENGTH + 2 * FINE_SEARCH_LEN) {
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
                    this.log("训练符号失锁（相关度 " + fbm.toFixed(3) + "），中止本帧，重新搜索前导");
                    this.state = "sync";
                    break;
                }
                this.buf_ring.read_to(this.sym_scratch, fbd + CP_LENGTH, SYMBOL_LENGTH);
                this.buf_ring.drop(fbd + GROSS_SYMBOL_LENGTH - FINE_SEARCH_LEN);
                let tr_iq = demodulate_ofdm_symbol(this.sym_scratch);
                if (this.frame_slot === 1) {
                    this.trA_iq = tr_iq; // 暂存训练A，等待B配对
                } else if (this.frame_slot === 2) {
                    let h1 = this.channel_from_training(this.trA_iq);
                    let h2 = this.channel_from_training(tr_iq);
                    this.fit_cfo(h1, h2);          // 显式CFO/SFO估计
                    this.chan_hi = h2[0]; this.chan_hq = h2[1]; // 信道参考面：槽2
                    this.trA_iq = null;
                } else {
                    // 帧中训练：相位对齐到参考面（槽2）后融合更新
                    let h = this.channel_from_training(tr_iq);
                    let slots = this.frame_slot - 2;
                    for (let c = 0; c < CARRIER_NUMBER; c++) {
                        let ph = (this.cfo_a + this.sfo_b * CARRIER_FREQS[c]) * slots;
                        let cr = Math.cos(ph), ci = Math.sin(ph);
                        let hr = h[0][c] * cr + h[1][c] * ci;
                        let hi2 = h[1][c] * cr - h[0][c] * ci;
                        this.chan_hi[c] = 0.5 * this.chan_hi[c] + 0.5 * hr;
                        this.chan_hq[c] = 0.5 * this.chan_hq[c] + 0.5 * hi2;
                    }
                }
            } else {
                // 数据槽：显式CFO/SFO补偿 → 散布导频相位/信道跟踪 → 均衡 → 解映射
                this.buf_ring.read_to(this.sym_scratch, FINE_SEARCH_LEN + CP_LENGTH, SYMBOL_LENGTH);
                this.buf_ring.drop(GROSS_SYMBOL_LENGTH);
                let frame_iq = demodulate_ofdm_symbol(this.sym_scratch);
                this.derotate_iq(frame_iq, this.frame_slot - 2);
                if (this.chan_hi !== null) {
                    this.pilot_track(frame_iq, this.frame_data_idx);
                    this.equalize(frame_iq);
                }
                this.viz(this.sym_scratch, frame_iq);
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
