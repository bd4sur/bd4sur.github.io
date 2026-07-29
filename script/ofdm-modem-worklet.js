// ============================================================================
// OFDM Modem Core (AudioWorklet) / BD4SUR 2026-07
// 独立的调制解调器核：发射（文本→OFDM波形）与接收（波形→文本）。
// 设计目标：与嵌入式 C 实现同构（流式状态机 + 环形缓冲），可直接对照移植。
// ============================================================================

// ---------------- 系统参数 ----------------
const SAMPLE_RATE    = 48000;
const BASE_FREQ      = 40;    // 子载波间隔(Hz)
const CARRIER_NUMBER = 64;    // 正交子载波数
const CARRIER_FREQ   = 2000; // 通带载波频率(Hz)：复基带经 IQ 调制搬移到 fc，频谱以 fc 为中心
const BANDWIDTH = BASE_FREQ * CARRIER_NUMBER;
const SYMBOL_LENGTH = Math.round(SAMPLE_RATE / BASE_FREQ); // 符号长度（采样点）
const CP_LENGTH = Math.floor(0.5 * SYMBOL_LENGTH);         // 循环前缀长度
const GROSS_SYMBOL_LENGTH = SYMBOL_LENGTH + CP_LENGTH;     // 槽长（符号+CP）
const TRAINING_SYMBOL_INTERVAL = 5; // 每几个数据符号插入一个训练符号
const TRAINING_PERIOD = TRAINING_SYMBOL_INTERVAL + 1;
const IQ_AMP = 0.02;

const AUDIO_BUFFER_LENGTH = TRAINING_PERIOD * 2 * GROSS_SYMBOL_LENGTH; // 接收缓冲区长度

// ---------------- 码表：子载波本振（fc±20,±60,…,±1260Hz，半间隔偏置避开 DC） ----------------
const CARRIER_I = [];
const CARRIER_Q = [];
for (let c = 0; c < CARRIER_NUMBER; c++) {
    let f = CARRIER_FREQ + (c - (CARRIER_NUMBER - 1) / 2) * BASE_FREQ;
    let ci = [], cq = [];
    for (let t = 0; t < SYMBOL_LENGTH; t++) {
        ci[t] = Math.cos(2 * Math.PI * f * t / SAMPLE_RATE);
        cq[t] = Math.sin(2 * Math.PI * f * t / SAMPLE_RATE);
    }
    CARRIER_I[c] = ci;
    CARRIER_Q[c] = cq;
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
function generate_symbol_wave(symbol_iq, has_cp) {
    let [si, sq] = symbol_iq;
    let w = new Array(SYMBOL_LENGTH).fill(0);
    for (let c = 0; c < CARRIER_NUMBER; c++)
        for (let t = 0; t < SYMBOL_LENGTH; t++)
            w[t] += si[c] * CARRIER_I[c][t] - sq[c] * CARRIER_Q[c][t];
    let norm = 2 / SYMBOL_LENGTH;
    for (let t = 0; t < SYMBOL_LENGTH; t++) w[t] *= norm;
    let out = has_cp ? add_cyclic_prefix(w, CP_LENGTH) : w.slice();
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
function qam4_mapping(byte_stream, amp) {
    let a = 2 * amp;
    const M = [[a, a], [a, -a], [-a, a], [-a, -a]];
    let iq = [];
    for (let byte of byte_stream)
        iq.push(M[(byte & 192) >> 6], M[(byte & 48) >> 4], M[(byte & 12) >> 2], M[byte & 3]);
    while (iq.length % CARRIER_NUMBER !== 0) iq.push([a, -a]);
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
function OFDM_Modulate(byte_stream, amp) {
    let iq = qam4_mapping(byte_stream, amp);
    let wave = [];
    for (let i = 0; i < iq.length / CARRIER_NUMBER; i++) {
        let si = iq.slice(i * CARRIER_NUMBER, (i + 1) * CARRIER_NUMBER).map(p => p[0]);
        let sq = iq.slice(i * CARRIER_NUMBER, (i + 1) * CARRIER_NUMBER).map(p => p[1]);
        for (let v of generate_symbol_wave([si, sq], true)) wave.push(v);
        if ((i + 1) % TRAINING_SYMBOL_INTERVAL === 0)
            for (let v of TRAINING_SYMBOL_TIME) wave.push(v);
    }
    let peak = 0;
    for (let v of wave) { let x = Math.abs(v); if (x > peak) peak = x; }
    if (peak > 0) { let scale = 0.9 / peak; for (let t = 0; t < wave.length; t++) wave[t] *= scale; }
    return wave;
}
function demodulate_ofdm_symbol(symbol_wave) {
    let oi = [], oq = [];
    for (let c = 0; c < CARRIER_NUMBER; c++) {
        let si = 0, sq = 0;
        for (let t = 0; t < SYMBOL_LENGTH; t++) {
            si += symbol_wave[t] * CARRIER_I[c][t];
            sq -= symbol_wave[t] * CARRIER_Q[c][t];
        }
        oi[c] = si; oq[c] = sq;
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

// ---------------- 帧结构 ----------------
const PKT_MAGIC = [0x42, 0x44, 0x34, 0x53, 0x55, 0x52]; // "BD4SUR"
const PKT_HEADER_LEN = 8, PKT_PAYLOAD_MAX = 24, PKT_WIRE_LEN = 64, PKT_SYMBOLS = 4;

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

// 发射：文本 → 完整一轮 OFDM 波形 [SC前导][训练符号][分帧数据符号…]
function modem_tx(text) {
    let payload = utf8_encode(text);
    let tx_bytes = [], coded = [];
    let n_packets = Math.ceil(payload.length / PKT_PAYLOAD_MAX);
    for (let i = 0; i < n_packets; i++) {
        let chunk = payload.slice(i * PKT_PAYLOAD_MAX, (i + 1) * PKT_PAYLOAD_MAX);
        let block = PKT_MAGIC.concat([chunk.length, i % 256], chunk);
        while (block.length < RS_N) block.push(0);
        let pkt_coded = rs_encode(block.slice(0, RS_K)).concat(rs_encode(block.slice(RS_K, RS_N)));
        coded = coded.concat(pkt_coded);
        tx_bytes = tx_bytes.concat(scramble_stream(interleave(pkt_coded, PKT_SYMBOLS)));
    }
    let tp = 0;
    for (let v of TRAINING_SYMBOL_TIME) { let a = Math.abs(v); if (a > tp) tp = a; }
    let training_leveled = TRAINING_SYMBOL_TIME.map(v => v * (0.9 / tp));
    let preamble = SC_PREAMBLE.concat(training_leveled);
    let wave = preamble.concat(OFDM_Modulate(tx_bytes, IQ_AMP));
    return { wave: wave, coded: coded, payload: payload };
}

// ============================================================================
// 接收机（流式状态机）
// ============================================================================
class Receiver {
    constructor(post) {
        this.post = post; // 事件上报回调
        this.config = { vizRate: 5 };
        this.reset();
    }
    reset() {
        this.is_need_sync = true;
        this.sync_countdown = 10000;
        this.AUDIO_BUFFER = [];
        this.symbol_count = 0;
        this.symbols_until_resync = 1e9;
        this.train_miss = 0;
        this.signal_power = 1;
        this.wave_len = 0;
        this.is_soft_loop = false;
        this.ofdm_wave = null;
        this.fec_info = null;
        // SC 检测器
        this.det_hist = []; this.feed_abs = 0; this.searched_upto = 0;
        this.best_metric = -1; this.best_offset = 0;
        // 分帧接收状态
        this.pkt_buf = []; this.pkt_index = 0; this.last_seq = -1;
        this.round_stat = null;
        // 快捕状态
        this.acq_state = 0; this.acq_stream = []; this.acq_slots = 0; this.acq_try_countdown = 0;
        // 信道估计
        this.chan_hi = null; this.chan_hq = null;
        this.lastVizTime = 0;
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
        for (let b = 0; b < PKT_WIRE_LEN / RS_N; b++) {
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
    decode_packet(pkt_raw, index) {
        let r = this.try_decode_packet(pkt_raw);
        let rx_coded = r.ok ? r.rx_coded : deinterleave(scramble_stream(pkt_raw), PKT_SYMBOLS);
        if (this.fec_info && (index + 1) * PKT_WIRE_LEN <= this.fec_info.coded.length) {
            let s = this.compute_ber(rx_coded, this.fec_info.coded.slice(index * PKT_WIRE_LEN, (index + 1) * PKT_WIRE_LEN));
            this.round_stat.pre_err += s.errors; this.round_stat.pre_total += s.total;
        }
        if (!r.ok) {
            this.round_stat.fail_blocks += 2;
            this.round_stat.bad_frames++;
            let hex = r.block ? r.block.slice(0, 10).map(b => b.toString(16).padStart(2, "0")).join(" ") : "-";
            this.log("坏帧 #" + index + "（magic 不符，丢弃）头部=[" + hex + "] RS失败块=" + r.fail_blocks);
        } else {
            this.round_stat.corrected += r.corrected;
            this.round_stat.fail_blocks += r.fail_blocks;
            let seq = r.seq;
            if (this.last_seq >= 0 && seq !== (this.last_seq + 1) % 256) {
                this.log("帧序号不连续：" + this.last_seq + " → " + seq + "（丢帧）");
            }
            this.last_seq = seq;
            if (this.fec_info) {
                let s = this.compute_ber(r.payload, this.fec_info.payload.slice(index * PKT_PAYLOAD_MAX, index * PKT_PAYLOAD_MAX + r.payload.length));
                this.round_stat.post_err += s.errors; this.round_stat.post_total += s.total;
            }
            this.post({ cmd: "text", bytes: Uint8Array.from(r.payload), roundReset: false });
        }
        this.update_stat();
    }

    // 主喂入入口：一帧采样（软环路帧或麦克风音频块；信道损伤由上游完成）
    feed(frame) {
        this.feed_abs += frame.length;
        this.det_hist = this.det_hist.concat(frame);
        if (!this.is_need_sync && this.det_hist.length > 2 * GROSS_SYMBOL_LENGTH) {
            let kf = Math.max(this.searched_upto, this.feed_abs - 2 * GROSS_SYMBOL_LENGTH);
            if (this.best_metric >= 0 && this.best_offset - 360 < kf) kf = Math.max(0, this.best_offset - 360);
            this.det_hist.splice(0, Math.max(0, kf - (this.feed_abs - this.det_hist.length)));
        }
        for (let i = 0; i < frame.length; i++) {
            this.AUDIO_BUFFER.push(frame[i]);
            if (this.AUDIO_BUFFER.length > AUDIO_BUFFER_LENGTH * 4) this.AUDIO_BUFFER.shift();
        }
        this.post({ cmd: "buflen", n: this.AUDIO_BUFFER.length });

        // ---- 流式粗同步 + 快速捕获 ----
        if (this.is_soft_loop ? (this.is_need_sync || this.acq_state === 1 || (this.sync_countdown <= 0)) : true) {
            let base = this.feed_abs - this.det_hist.length;
            let d_begin = Math.max(this.searched_upto, base);
            let d_max = this.feed_abs - 2 * SC_HALF_LEN;
            if (d_max >= d_begin) {
                let i0 = d_begin - base, P = 0, R = 0, E1 = 0;
                for (let n = 0; n < SC_HALF_LEN; n++) {
                    P += this.det_hist[i0 + n] * this.det_hist[i0 + n + SC_HALF_LEN];
                    R += this.det_hist[i0 + n + SC_HALF_LEN] * this.det_hist[i0 + n + SC_HALF_LEN];
                    E1 += this.det_hist[i0 + n] * this.det_hist[i0 + n];
                }
                for (let d = d_begin; d <= d_max; d += 4) {
                    let i = d - base;
                    let metric = (P * P) / (E1 * R + 1e-12);
                    if (metric > this.best_metric) { this.best_metric = metric; this.best_offset = d; }
                    let steps = Math.min(4, d_max - d);
                    for (let s = 0; s < steps; s++) {
                        let j = i + s;
                        P += -this.det_hist[j] * this.det_hist[j + SC_HALF_LEN] + this.det_hist[j + SC_HALF_LEN] * this.det_hist[j + 2 * SC_HALF_LEN];
                        R += -this.det_hist[j + SC_HALF_LEN] * this.det_hist[j + SC_HALF_LEN] + this.det_hist[j + 2 * SC_HALF_LEN] * this.det_hist[j + 2 * SC_HALF_LEN];
                        E1 += -this.det_hist[j] * this.det_hist[j] + this.det_hist[j + SC_HALF_LEN] * this.det_hist[j + SC_HALF_LEN];
                    }
                }
                this.searched_upto = d_max + 1;
            }
            if (this.best_metric >= SC_DETECT_THRESHOLD && this.searched_upto > this.best_offset + SC_HALF_LEN) {
                let t_offset = this.best_offset, validate_metric = -1;
                let base2 = this.feed_abs - this.det_hist.length;
                let d0 = Math.max(this.best_offset - 360, base2);
                let d1 = Math.min(this.best_offset + 360, this.feed_abs - 2 * SC_HALF_LEN);
                for (let d = d0; d <= d1; d++) {
                    let i = d - base2, corr = 0, e = 0;
                    for (let t = 0; t < 2 * SC_HALF_LEN; t++) {
                        corr += this.det_hist[i + t] * SC_PREAMBLE[t];
                        e += this.det_hist[i + t] * this.det_hist[i + t];
                    }
                    let m = (corr * corr) / (e * SC_ENERGY + 1e-12);
                    if (m > validate_metric) { validate_metric = m; t_offset = d; }
                }
                if (validate_metric < SC_VALIDATE_THRESHOLD) {
                    this.best_metric = -1;
                } else {
                    let drop = t_offset + GROSS_SYMBOL_LENGTH - FINE_SEARCH_LEN - (this.feed_abs - this.AUDIO_BUFFER.length);
                    if (drop > 0) this.AUDIO_BUFFER.splice(0, Math.min(drop, this.AUDIO_BUFFER.length));
                    this.post({ cmd: "offset", v: t_offset });
                    this.sync_countdown = 10000;
                    this.symbol_count = 0;
                    this.is_need_sync = false;
                    this.symbols_until_resync = this.wave_len > 0 ? Math.round(this.wave_len / GROSS_SYMBOL_LENGTH) - 1 : 1e9;
                    this.log("SC 粗同步 @" + t_offset + "（精化度量 " + validate_metric.toFixed(3) + "）");
                    this.best_metric = -1;
                    if (!this.is_soft_loop) this.post({ cmd: "text", bytes: new Uint8Array(0), roundReset: true });
                    this.pkt_buf = []; this.pkt_index = 0; this.last_seq = -1;
                    this.round_stat = { pre_err: 0, pre_total: 0, post_err: 0, post_total: 0, corrected: 0, fail_blocks: 0, bad_frames: 0 };
                    this.acq_state = 0; this.acq_stream = []; this.acq_slots = 0;
                }
            }
            // 快速捕获：训练符号模板搜索
            if (this.is_need_sync) {
                this.acq_try_countdown--;
                if (this.acq_try_countdown <= 0 && this.AUDIO_BUFFER.length >= 2 * GROSS_SYMBOL_LENGTH) {
                    this.acq_try_countdown = 2;
                    let d_end = this.AUDIO_BUFFER.length - GROSS_SYMBOL_LENGTH;
                    let d_begin = Math.max(0, d_end - (GROSS_SYMBOL_LENGTH + 800));
                    let acq_best_m = -1, acq_best_d = -1;
                    for (let d = d_begin; d <= d_end; d += 4) {
                        let corr = 0, e = 0;
                        for (let t = 0; t < GROSS_SYMBOL_LENGTH; t++) {
                            let s = this.AUDIO_BUFFER[d + t];
                            corr += s * TRAINING_SYMBOL_TIME[t];
                            e += s * s;
                        }
                        let m = (corr * corr) / (e * TRAINING_TPL_ENERGY + 1e-12);
                        if (m > acq_best_m) { acq_best_m = m; acq_best_d = d; }
                    }
                    for (let d = Math.max(d_begin, acq_best_d - 4); d <= Math.min(d_end, acq_best_d + 4); d++) {
                        let corr = 0, e = 0;
                        for (let t = 0; t < GROSS_SYMBOL_LENGTH; t++) {
                            let s = this.AUDIO_BUFFER[d + t];
                            corr += s * TRAINING_SYMBOL_TIME[t];
                            e += s * s;
                        }
                        let m = (corr * corr) / (e * TRAINING_TPL_ENERGY + 1e-12);
                        if (m > acq_best_m) { acq_best_m = m; acq_best_d = d; }
                    }
                    if (acq_best_m >= 0.3) {
                        this.AUDIO_BUFFER.splice(0, Math.min(acq_best_d + GROSS_SYMBOL_LENGTH - FINE_SEARCH_LEN, this.AUDIO_BUFFER.length));
                        this.symbol_count = 1;
                        this.symbols_until_resync = 1e9;
                        this.is_need_sync = false;
                        this.acq_state = 1;
                        this.acq_stream = []; this.acq_slots = 0;
                        if (!this.round_stat) this.round_stat = { pre_err: 0, pre_total: 0, post_err: 0, post_total: 0, corrected: 0, fail_blocks: 0, bad_frames: 0 };
                        this.log("快速捕获：锁定训练网格（相关度 " + acq_best_m.toFixed(3) + "）");
                    }
                }
            }
            let keep_from = this.searched_upto;
            if (this.best_metric >= 0 && this.best_offset - 360 < keep_from) keep_from = Math.max(0, this.best_offset - 360);
            let skip = keep_from - (this.feed_abs - this.det_hist.length);
            if (skip > 0) this.det_hist.splice(0, skip);
        }

        // ---- 未锁定：仅检测 ----
        if (this.is_need_sync) return;
        // ---- 等待符号 ----
        if ((this.sync_countdown > 0) && (this.AUDIO_BUFFER.length < GROSS_SYMBOL_LENGTH + 2 * FINE_SEARCH_LEN)) {
            this.sync_countdown--;
            return;
        }
        // ---- 消费符号 ----
        while ((this.sync_countdown > 0) && (this.AUDIO_BUFFER.length >= GROSS_SYMBOL_LENGTH + 2 * FINE_SEARCH_LEN)) {
            if (this.is_soft_loop && this.symbols_until_resync <= 0) {
                this.post({ cmd: "text", bytes: new Uint8Array(0), roundReset: true });
                this.is_need_sync = true;
                this.acq_state = 0; this.acq_stream = [];
                break;
            }
            let symbol_wave = null, frame_iq = null;
            if (this.symbol_count % TRAINING_PERIOD === 0) {
                // 训练槽：细同步 + 信道估计
                let fbm = -1, fbd = FINE_SEARCH_LEN;
                for (let d = 0; d <= 2 * FINE_SEARCH_LEN; d++) {
                    let corr = 0, energy = 0;
                    for (let t = 0; t < GROSS_SYMBOL_LENGTH; t++) {
                        let s = this.AUDIO_BUFFER[d + t];
                        corr += s * TRAINING_SYMBOL_TIME[t];
                        energy += s * s;
                    }
                    let m = (corr * corr) / (energy * TRAINING_TPL_ENERGY + 1e-12);
                    if (m > fbm) { fbm = m; fbd = d; }
                }
                if (fbm < 0.5) {
                    this.train_miss++;
                    fbd = FINE_SEARCH_LEN;
                    if (this.train_miss >= 2) {
                        this.log("训练网格连续失锁（相关度 " + fbm.toFixed(3) + "），触发重新捕获");
                        this.is_need_sync = true;
                        this.acq_state = 0; this.acq_stream = [];
                        this.train_miss = 0;
                        break;
                    }
                } else {
                    this.train_miss = 0;
                }
                symbol_wave = this.AUDIO_BUFFER.slice(fbd + CP_LENGTH, fbd + CP_LENGTH + SYMBOL_LENGTH);
                this.AUDIO_BUFFER.splice(0, fbd + GROSS_SYMBOL_LENGTH - FINE_SEARCH_LEN);
                let tr_iq = demodulate_ofdm_symbol(symbol_wave);
                if (this.chan_hi === null) { this.chan_hi = []; this.chan_hq = []; }
                for (let c = 0; c < CARRIER_NUMBER; c++) {
                    let ti = TRAINING_I[c], tq = TRAINING_Q[c];
                    let denom = ti * ti + tq * tq;
                    let hi = (tr_iq[0][c] * ti + tr_iq[1][c] * tq) / denom;
                    let hq = (tr_iq[1][c] * ti - tr_iq[0][c] * tq) / denom;
                    if (this.chan_hi[c] === undefined) { this.chan_hi[c] = hi; this.chan_hq[c] = hq; }
                    else {
                        this.chan_hi[c] = 0.5 * this.chan_hi[c] + 0.5 * hi;
                        this.chan_hq[c] = 0.5 * this.chan_hq[c] + 0.5 * hq;
                    }
                }
                this.symbol_count++;
                this.symbols_until_resync--;
                continue;
            }
            // 数据槽
            symbol_wave = this.AUDIO_BUFFER.slice(FINE_SEARCH_LEN + CP_LENGTH, FINE_SEARCH_LEN + CP_LENGTH + SYMBOL_LENGTH);
            this.AUDIO_BUFFER.splice(0, GROSS_SYMBOL_LENGTH);
            frame_iq = demodulate_ofdm_symbol(symbol_wave);
            if (this.chan_hi !== null) {
                for (let c = 0; c < CARRIER_NUMBER; c++) {
                    let hi = this.chan_hi[c], hq = this.chan_hq[c];
                    let denom = hi * hi + hq * hq;
                    if (denom < 1e-6) denom = 1e-6;
                    let ii = frame_iq[0][c], qq = frame_iq[1][c];
                    frame_iq[0][c] = (ii * hi + qq * hq) / denom;
                    frame_iq[1][c] = (qq * hi - ii * hq) / denom;
                }
            }
            this.viz(symbol_wave, frame_iq);
            let frame_bytes = qam4_decoding(frame_iq[0], frame_iq[1]);
            if (this.acq_state === 1) {
                for (let n = 0; n < frame_bytes.length; n++) this.acq_stream.push(frame_bytes[n]);
                this.acq_slots++;
                while (this.acq_stream.length >= PKT_WIRE_LEN && this.acq_state === 1) {
                    let locked = false;
                    for (let off = 0; off <= 3 * 16 && off + PKT_WIRE_LEN <= this.acq_stream.length; off += 16) {
                        let r = this.try_decode_packet(this.acq_stream.slice(off, off + PKT_WIRE_LEN));
                        if (r.ok) {
                            this.acq_state = 2;
                            let validated = this.acq_stream.slice(off, off + PKT_WIRE_LEN);
                            this.pkt_buf = this.acq_stream.slice(off + PKT_WIRE_LEN);
                            this.acq_stream = [];
                            this.pkt_index = r.seq;
                            this.decode_packet(validated, this.pkt_index);
                            this.pkt_index++;
                            let n_next = 4 * r.seq + 4 + this.pkt_buf.length / 16;
                            let s_next = 1 + Math.floor(n_next / TRAINING_SYMBOL_INTERVAL) * TRAINING_PERIOD + (n_next % TRAINING_SYMBOL_INTERVAL);
                            this.symbol_count = s_next - 1;
                            this.symbols_until_resync = this.wave_len > 0 ? Math.round(this.wave_len / GROSS_SYMBOL_LENGTH) - 1 - s_next + 1 : 1e9;
                            this.log("快速捕获：帧锁定 #" + r.seq + "，接管稳态");
                            locked = true;
                            break;
                        }
                    }
                    if (!locked) {
                        if (this.acq_stream.length > PKT_WIRE_LEN + 3 * 16) this.acq_stream.splice(0, 16);
                        break;
                    }
                }
                if (this.acq_state === 1 && this.acq_slots > (this.wave_len > 0 ? 2 * this.wave_len / GROSS_SYMBOL_LENGTH : 500)) {
                    this.is_need_sync = true;
                    this.acq_state = 0; this.acq_stream = [];
                    this.log("快速捕获：超时，回退等待前导");
                }
            } else {
                for (let n = 0; n < frame_bytes.length; n++) {
                    this.pkt_buf.push(frame_bytes[n]);
                    if (this.pkt_buf.length === PKT_WIRE_LEN) {
                        this.decode_packet(this.pkt_buf, this.pkt_index);
                        this.pkt_buf = []; this.pkt_index++;
                    }
                }
            }
            this.symbol_count++;
            if (this.symbols_until_resync < 1e9) this.symbols_until_resync--;
        }
        this.sync_countdown--;
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
                this.receiver.feed(Array.from(d.samples));
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
            this.receiver.feed(Array.from(input[0]));
        }
        return true;
    }
}
registerProcessor("ofdm-modem", OFDMModemProcessor);
