
// const { DCT_2D } = require("./fourier.js");

function JPEG_Codec() {
    this.dct_2d = new DCT_2D(8);
}

JPEG_Codec.BLOCK_SIZE = 8;

JPEG_Codec.luminance_quant_table = [
    16, 11, 10, 16, 24, 40, 51, 61,
    12, 12, 14, 19, 26, 58, 60, 55,
    14, 13, 16, 24, 40, 57, 69, 56,
    14, 17, 22, 29, 51, 87, 80, 62,
    18, 22, 37, 56, 68, 109, 103, 77,
    24, 35, 55, 64, 81, 104, 113, 92,
    49, 64, 78, 87, 103, 121, 120, 101,
    72, 92, 95, 98, 112, 100, 103, 99
];

// 色度量化表
JPEG_Codec.chrominance_quant_table = [
    17, 18, 24, 47, 99, 99, 99, 99,
    18, 21, 26, 66, 99, 99, 99, 99,
    24, 26, 56, 99, 99, 99, 99, 99,
    47, 66, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99,
    99, 99, 99, 99, 99, 99, 99, 99
];

// ZigZag编码的下标映射
JPEG_Codec.zigzag_index_table = [
    0,  1,  8,  16,  9,  2,  3, 10,
    17, 24, 32, 25, 18, 11,  4,  5,
    12, 19, 26, 33, 40, 48, 41, 34,
    27, 20, 13,  6,  7, 14, 21, 28,
    35, 42, 49, 56, 57, 50, 43, 36,
    29, 22, 15, 23, 30, 37, 44, 51,
    58, 59, 52, 45, 38, 31, 39, 46,
    53, 60, 61, 54, 47, 55, 62, 63
];

JPEG_Codec.prototype = {

    // 输入YUV420格式的三个通道，将其编码成三个字节码流
    encode: function(matrix_Y, matrix_U, matrix_V, width, height, quality) {
        let bytestream_Y = this.matrix_encode(matrix_Y, width, height, "Y", quality);
        let bytestream_U = this.matrix_encode(matrix_U, Math.ceil(width/2), Math.ceil(height/2), "U", quality);
        let bytestream_V = this.matrix_encode(matrix_V, Math.ceil(width/2), Math.ceil(height/2), "V", quality);
        return [bytestream_Y, bytestream_U, bytestream_V];
    },

    // 输入三个通道的字节码流，输出YUV三个通道的图像矩阵
    decode: function(bytestream_Y, bytestream_U, bytestream_V, quality) {
        let matrix_Y = this.bytestream_decode(bytestream_Y, "Y", quality);
        let matrix_U = this.bytestream_decode(bytestream_U, "U", quality);
        let matrix_V = this.bytestream_decode(bytestream_V, "V", quality);
        return [matrix_Y, matrix_U, matrix_V];
    },

    // 将一帧图像封装成一帧字节流
    encode_frame: function(matrix_Y, matrix_U, matrix_V, width, height, quality, fps, frame_index) {
        let bytestreams = this.encode(matrix_Y, matrix_U, matrix_V, width, height, quality);
        let y_length = (bytestreams[0].length) ^ 0;
        let u_length = (bytestreams[1].length) ^ 0;
        let v_length = (bytestreams[2].length) ^ 0;
        let frame_length = (y_length + u_length + v_length + 36) ^ 0;

        let frame = [66, 68, 52, 83, 85, 82, 0, 86]; // [0,7]magic_number = "BD4SUR_V"
        frame.push((fps ^ 0) & 255); // [8]fps
        frame.push((quality ^ 0) & 255); // [9]quality

        frame.push((frame_length >> 24) & 255); // [10]frame_length
        frame.push((frame_length >> 16) & 255); // [11]frame_length
        frame.push((frame_length >> 8)  & 255); // [12]frame_length
        frame.push(frame_length & 255);         // [13]frame_length

        frame.push(((frame_index ^ 0) >> 24) & 255); // [14]frame_index
        frame.push(((frame_index ^ 0) >> 16) & 255); // [15]frame_index
        frame.push(((frame_index ^ 0) >> 8)  & 255); // [16]frame_index
        frame.push((frame_index ^ 0) & 255);         // [17]frame_index

        frame.push(((width ^ 0) >> 8)  & 255);  // [18]width
        frame.push((width ^ 0) & 255);          // [19]width

        frame.push(((height ^ 0) >> 8)  & 255); // [20]frame_index
        frame.push((height ^ 0) & 255);         // [21]frame_index

        frame.push(0); // [22]reserved
        frame.push(0); // [23]reserved

        frame.push((y_length >> 24) & 255); // [24]y_length
        frame.push((y_length >> 16) & 255); // [25]y_length
        frame.push((y_length >> 8)  & 255); // [26]y_length
        frame.push(y_length & 255);         // [27]y_length

        frame.push((u_length >> 24) & 255); // [28]u_length
        frame.push((u_length >> 16) & 255); // [29]u_length
        frame.push((u_length >> 8)  & 255); // [30]u_length
        frame.push(u_length & 255);         // [31]u_length

        frame.push((v_length >> 24) & 255); // [32]v_length
        frame.push((v_length >> 16) & 255); // [33]v_length
        frame.push((v_length >> 8)  & 255); // [34]v_length
        frame.push(v_length & 255);         // [35]v_length

        for(let i = 0; i < y_length; i++) { frame.push(bytestreams[0][i]); }
        for(let i = 0; i < u_length; i++) { frame.push(bytestreams[1][i]); }
        for(let i = 0; i < v_length; i++) { frame.push(bytestreams[2][i]); }

        return frame;
    },

    // 解析帧结构
    parse_frame: function(frame_bytes) {
        let magic_number_7 = frame_bytes[0];
        let magic_number_6 = frame_bytes[1];
        let magic_number_5 = frame_bytes[2];
        let magic_number_4 = frame_bytes[3];
        let magic_number_3 = frame_bytes[4];
        let magic_number_2 = frame_bytes[5];
        let magic_number_1 = frame_bytes[6];
        let magic_number_0 = frame_bytes[7];
        let magic_number = [
            magic_number_7, magic_number_6, magic_number_5, magic_number_4, magic_number_3, magic_number_2, magic_number_1, magic_number_0
        ].map((x)=>String.fromCharCode(x)).join("");
        if(magic_number.indexOf("BD4SUR\u0000V") < 0) return;

        let fps = frame_bytes[8];

        let quality_factor = frame_bytes[9];

        let frame_length_3 = frame_bytes[10];
        let frame_length_2 = frame_bytes[11];
        let frame_length_1 = frame_bytes[12];
        let frame_length_0 = frame_bytes[13];
        let frame_length = (frame_length_3 << 24) + (frame_length_2 << 16) + (frame_length_1 << 8) + (frame_length_0 & 255);

        let frame_index_3 = frame_bytes[14];
        let frame_index_2 = frame_bytes[15];
        let frame_index_1 = frame_bytes[16];
        let frame_index_0 = frame_bytes[17];
        let frame_index = (frame_index_3 << 24) + (frame_index_2 << 16) + (frame_index_1 << 8) + (frame_index_0 & 255);

        let width_1 = frame_bytes[18];
        let width_0 = frame_bytes[19];
        let width = (width_1 << 8) + (width_0 & 255);

        let height_1 = frame_bytes[20];
        let height_0 = frame_bytes[21];
        let height = (height_1 << 8) + (height_0 & 255);

        let reserved_1 = frame_bytes[22];
        let reserved_0 = frame_bytes[23];
        let reserved = (reserved_1 << 8) + (reserved_0 & 255);

        let y_length_3 = frame_bytes[24];
        let y_length_2 = frame_bytes[25];
        let y_length_1 = frame_bytes[26];
        let y_length_0 = frame_bytes[27];
        let y_length = (y_length_3 << 24) + (y_length_2 << 16) + (y_length_1 << 8) + (y_length_0 & 255);

        let u_length_3 = frame_bytes[28];
        let u_length_2 = frame_bytes[29];
        let u_length_1 = frame_bytes[30];
        let u_length_0 = frame_bytes[31];
        let u_length = (u_length_3 << 24) + (u_length_2 << 16) + (u_length_1 << 8) + (u_length_0 & 255);

        let v_length_3 = frame_bytes[32];
        let v_length_2 = frame_bytes[33];
        let v_length_1 = frame_bytes[34];
        let v_length_0 = frame_bytes[35];
        let v_length = (v_length_3 << 24) + (v_length_2 << 16) + (v_length_1 << 8) + (v_length_0 & 255);

        let y_bytestrem = frame_bytes.slice(36, 36 + y_length);
        let u_bytestrem = frame_bytes.slice(36 + y_length, 36 + y_length + u_length);
        let v_bytestrem = frame_bytes.slice(36 + y_length + u_length, 36 + y_length + u_length + v_length);

        return [
            magic_number,     // 0
            fps,              // 1
            quality_factor,   // 2
            frame_length,     // 3
            frame_index,      // 4
            width,            // 5
            height,           // 6
            reserved,         // 7
            y_length,         // 8
            u_length,         // 9
            v_length,         // 10
            y_bytestrem,      // 11
            u_bytestrem,      // 12
            v_bytestrem,      // 13
        ];
    },

    // 将一帧字节流解码成YUV三个通道的图像矩阵
    decode_frame: function(frame_bytes) {
        let frame = this.parse_frame(frame_bytes);
        return this.decode(frame[11], frame[12], frame[13], frame[2]);
    },

    // 对矩阵进行分块DCT变换，从左到右从上到下输出每个8×8块的DCT系数矩阵
    partitional_transform: function(matrix, width, height) {
        let block_size = JPEG_Codec.BLOCK_SIZE;
        let dct_2d = this.dct_2d;

        // 根据块大小对原图作扩展
        let expanded_width = Math.ceil(width / block_size) * block_size;
        let expanded_height = Math.ceil(height / block_size) * block_size;

        // 将原图外的边缘置0
        for(let y = height; y < expanded_height; y++) {
            let zero_row = new Array(expanded_width);
            zero_row.fill(0);
            matrix[y] = zero_row;
        }
        for(let y = 0; y < height; y++) {
            for(let x = width; x < expanded_width; x++) {
                matrix[y][x] = 0;
            }
        }

        // 输出的各个8×8块的DCT系数（从左到右、从上到下排列）
        let dct_coeff_blocks = new Array();

        // 分块DCT
        let block_index = 0;
        for(let y = 0; y < expanded_height; y += block_size) {
            for(let x = 0; x < expanded_width; x += block_size) {
                // 从扩展矩阵中取出一个块
                let block = new Array();
                for(let row = 0; row < block_size; row++) {
                    let block_row = new Array();
                    for(let col = 0; col < block_size; col++) {
                        block_row[col] = matrix[y + row][x + col];
                    }
                    block[row] = block_row; // matrix[y + row].slice(x, x + block_size);
                }
                // 对单个块执行DCT
                let dct_block = dct_2d.dct(block);
                // 将其转为一维数组（从左到右从上到下排列）
                let dct_coeffs = new Array();
                for(let row = 0; row < block_size; row++) {
                    for(let col = 0; col < block_size; col++) {
                        dct_coeffs.push(dct_block[row][col]);
                    }
                }
                // 将系数矩阵（实际上是64个元素的一维数组）保存起来
                dct_coeff_blocks[block_index] = dct_coeffs;
                block_index++;
            }
        }

        return dct_coeff_blocks;
    },

    // 对单个块进行Zig-zag扫描和游程编码
    block_encode: function(qblock) {
        let block_size = JPEG_Codec.BLOCK_SIZE;
        let zigzag_index = JPEG_Codec.zigzag_index_table;

        // 第1步：ZigZag编码
        let zigzag = new Array();
        for(let i = 0; i < block_size * block_size; i++) {
            zigzag[i] = qblock[zigzag_index[i]];
        }

        // 第2步：游程编码
        let zero_runlength = 0;
        let RLE = new Array();
        for(let i = 0; i < zigzag.length; i++) {
            if(zigzag[i] === 0 && i < zigzag.length - 1) {
                zero_runlength++;
            }
            else if(zigzag[i] === 0 && i === zigzag.length - 1) {
                RLE.push("EOB");
                zero_runlength = 0;
            }
            else {
                RLE.push([zero_runlength, zigzag[i]]);
                zero_runlength = 0;
            }
        }
        // 将连续0的长度限制为16以内
        let RLE2 = new Array();
        for(let i = 0; i < RLE.length; i++) {
            let segment = RLE[i];
            if(segment === "EOB") {
                RLE2.push("EOB");
            }
            else if(segment[0] <= 15) {
                RLE2.push(segment);
            }
            else {
                let count = segment[0];
                while(count > 16) {
                    RLE2.push([15, 0]);
                    count -= 16;
                }
                RLE2.push([count, segment[1]]);
            }
        }

        // 第3步：Huffman编码（暂未实现）

        // 第4步：输出一块的字节序列，格式暂且自定义为[块长度（不含此字节，值必是偶数）, (0游程, 值)+, (255, 255)代表EOB]
        let byteseq = new Array(RLE2.length * 2 + 1);
        byteseq[0] = RLE2.length * 2;
        let byteCount = 1;
        for(let i = 0; i < RLE2.length; i++) {
            if(RLE2[i] === "EOB") {
                byteseq[byteCount] = 255; byteCount++;
                byteseq[byteCount] = 255; byteCount++;
            }
            else {
                // NOTE 注意！！！由于DCT值可能是负数（范围[-128,127]），所以需要将其向上平移128，以转换为uint8
                byteseq[byteCount] = RLE2[i][0]; byteCount++;
                byteseq[byteCount] = RLE2[i][1] + 128; byteCount++;
            }
        }
        return byteseq;
    },

    // 对单个块的字节序列进行解码
    block_decode: function(byteseq) {
        let zigzag_index = JPEG_Codec.zigzag_index_table;

        // 第一步：解析RLE
        let len = byteseq[0];
        let zigzag = new Array();
        for(let i = 1; i < len + 1; i+=2) {
            // NOTE 注意！！！由于DCT值在编码阶段已经被向上平移128，此处需要向下平移128
            let runlen = byteseq[i];
            let value  = byteseq[i+1] - 128;
            if(runlen !== 255) {
                for(let j = 0; j < runlen; j++) {
                    zigzag.push(0);
                }
                zigzag.push(value);
            }
            else {
                for(let j = zigzag.length; j < JPEG_Codec.BLOCK_SIZE * JPEG_Codec.BLOCK_SIZE; j++) {
                    zigzag.push(0);
                }
            }
        }
        // 第二步：ZigZag反变换
        let qblock = new Array();
        for(let i = 0; i < zigzag.length; i++) {
            qblock[zigzag_index[i]] = zigzag[i];
        }
        return qblock;
    },

    // 编码单个通道的整个矩阵为字节流
    matrix_encode: function(matrix, width, height, type, quality) {
        let block_size = JPEG_Codec.BLOCK_SIZE;
        // 从质量因子(0,100]导出量化表的缩放因子
        let scale_factor = (quality < 50) ? (50 / quality) : (2 - quality / 50);

        // 选择灰度/色度量化表
        let qtable = (type === "Y") ? JPEG_Codec.luminance_quant_table :
                     (type === "U" || type === "V") ? JPEG_Codec.chrominance_quant_table : null;

        // 像素值偏移-128
        let shifted_matrix = new Array();
        for(let y = 0; y < height; y++) {
            let shifted_row = new Array();
            for(let x = 0; x < width; x++) {
                shifted_row[x] = matrix[y][x] - 128;
            }
            shifted_matrix[y] = shifted_row;
        }

        // 分块DCT
        let dct_blocks = this.partitional_transform(shifted_matrix, width, height);

        // 对每个块执行量化和熵编码
        let bytestream = new Array();
        bytestream.push((width^0) >> 8);
        bytestream.push((width^0) & 255);
        bytestream.push((height^0) >> 8);
        bytestream.push((height^0) & 255);
        for(let i = 0; i < dct_blocks.length; i++) {
            let dct_block = dct_blocks[i];
            // 量化
            let qblock = new Array();
            if(quality >= 100) { // 质量因子为100，不量化（量化步长为1，仅取整）
                for(let i = 0; i < block_size * block_size; i++) {
                    qblock[i] = Math.round(dct_block[i]);
                }
            }
            else{
                for(let i = 0; i < block_size * block_size; i++) {
                    qblock[i] = Math.round(dct_block[i] / (qtable[i] * scale_factor));
                }
            }
            // 熵编码
            let block_byteseq = this.block_encode(qblock);

            for(let c = 0; c < block_byteseq.length; c++) {
                bytestream.push(block_byteseq[c]);
            }
        }

        return bytestream;
    },

    // 将单个通道的字节流解码为矩阵
    bytestream_decode: function(bytestream, type, quality) {
        let block_size = JPEG_Codec.BLOCK_SIZE;
        let dct_2d = this.dct_2d;
        // 从质量因子(0,100]导出量化表的缩放因子
        let scale_factor = (quality < 50) ? (50 / quality) : (2 - quality / 50);

        // 选择灰度/色度量化表
        let qtable = (type === "Y") ? JPEG_Codec.luminance_quant_table :
                     (type === "U" || type === "V") ? JPEG_Codec.chrominance_quant_table : null;

        // 原图的尺寸
        let width  = (bytestream[0] << 8) + (bytestream[1] & 255);
        let height = (bytestream[2] << 8) + (bytestream[3] & 255);

        // 将原图的宽高补足为8的倍数
        let expanded_width = Math.ceil(width / block_size) * block_size;
        let expanded_height = Math.ceil(height / block_size) * block_size;;

        // 输出矩阵（由每一行构成的列向量）
        let buffer = new Array();
        for(let y = 0; y < expanded_height; y++) {
            let row = new Array();
            row.fill(0, 0, expanded_width);
            buffer[y] = row;
        }

        // 解码
        let current_position = 4;
        let block_count = 0;
        do {
            let blockX = block_size * (block_count % (expanded_width / block_size));
            let blockY = block_size * (Math.floor(block_count / (expanded_width / block_size)));

            let block_seq_length = bytestream[current_position];
            let block_seq = bytestream.slice(current_position, current_position + block_seq_length + 1);

            // 解码单个块的字节序列
            let qblock = this.block_decode(block_seq);

            // 反量化
            let dct_block = new Array();
            if(quality >= 100) { // 质量因子为100，不量化
                dct_block = qblock;
            }
            else {
                for(let i = 0; i < block_size * block_size; i++) {
                    dct_block[i] = qblock[i] * (qtable[i] * scale_factor);
                }
            }

            // 对块作IDCT
            let dct_block_vector = new Array();
            for(let y = 0; y < block_size; y++) {
                let row = new Array();
                for(let x = 0; x < block_size; x++) {
                    row[x] = dct_block[x + block_size * y];
                }
                dct_block_vector[y] = row;
            }
            let block = dct_2d.idct(dct_block_vector);

            // 嵌入到原图图像中
            for(let y = blockY; y < blockY + block_size; y++) {
                for(let x = blockX; x < blockX + block_size; x++) {
                    buffer[y][x] = block[y - blockY][x - blockX];
                }
            }

            current_position += (block_seq_length + 1);
            block_count++;
        } while(current_position < bytestream.length);

        // 裁剪到原图尺寸
        let output = new Array();
        for(let y = 0; y < height; y++) {
            output[y] = buffer[y].slice(0, width);
        }

        // 移位+128
        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                output[y][x] = output[y][x] + 128;
            }
        }

        return output;
    }
};

module.exports = JPEG_Codec;
