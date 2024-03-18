// BD4SUR.com
// 数学运算库

////////////////////////////////////////////////
// Utils
////////////////////////////////////////////////

function assert(test, msg) {
    if(!test) throw msg;
}

////////////////////////////////////////////////
// Tensor 2024-03
////////////////////////////////////////////////

function Tensor(shape) {
    this.shape = shape || [];
    this.ndim = this.shape.length;
    this.array =[];
    let arr_len = this.shape.reduce((pv, cv) => (pv * cv) , 1);
    for(let i = 0; i < arr_len; i++) {
        this.array.push(Math.random());
    }
}

Tensor.prototype = {
    init: function(nested_list) {
        let arr = [];
        let nesting_stack = [];
        let shape_count = [];

        //递归检查输入列表的同质性，即输入列表必须构成绝对平衡树
        function check_type(lst) {
            if(typeof(lst) === "number") {
                nesting_stack.push(true);
                let prev_length = shape_count[nesting_stack.length-1];
                if(prev_length !== undefined && prev_length !== -1)
                    return ["inhomo", NaN];
                else {
                    shape_count[nesting_stack.length-1] = -1;
                    nesting_stack.pop();
                    arr.push(lst); // 将列表元素（叶节点）以深度优先遍历顺序塞进线性表
                    return ["scalar", -1]; // 标量的长度设为-1表示比列表还短
                }
            }
            else if(lst instanceof Array) {
                nesting_stack.push(true);
                if(lst.length > 0) {
                    let prev_type = check_type(lst[0]);
                    if(prev_type[0] === "inhomo")
                        return ["inhomo", NaN];
                    for(let i = 1; i < lst.length; i++) { //从1开始
                        let ctype = check_type(lst[i]);
                        if(ctype[0] === "inhomo")
                            return ["inhomo", NaN];
                        else if(ctype[0] !== prev_type[0] || ctype[1] !== prev_type[1])
                            return ["inhomo", NaN];
                        else
                            prev_type = ctype;
                    }
                }
                let prev_length = shape_count[nesting_stack.length-1];
                if(prev_length !== undefined && prev_length !== lst.length)
                    return ["inhomo", NaN];
                else {
                    shape_count[nesting_stack.length-1] = lst.length;
                    nesting_stack.pop();
                    return ["tensor", lst.length];
                }
            }
            else return ["inhomo", NaN];
        }

        let t = check_type(nested_list);
        if(t[0] === "tensor" || t[0] === "scalar") {
            if(shape_count[shape_count.length-1] < 0)
                shape_count.pop(); //去掉叶子节点的shape（-1）
            this.shape = shape_count;
            this.ndim = this.shape.length;
            this.array = arr;
        }
        else throw "In-homo list not allowed.";
    },

    build_tree: function() {
        let arr_count = 0;
        function _build_tree_(shape, arr) {
            if(shape.length === 1) {
                let leaf = [];
                for(let i = 0; i < shape[0]; i++) {
                    leaf.push(arr[arr_count]);
                    arr_count++;
                }
                return leaf;
            }
            else {
                let tree = [];
                for(let i = 0; i < shape[0]; i++) {
                    tree.push(_build_tree_(shape.slice(1), arr));
                }
                return tree;
            }
        }
        let tree = _build_tree_(this.shape, this.array);
        return tree;
    },

    get_cell_index: function(pos) {
        assert(pos.length === this.ndim);
        let s = this.shape;
        let index = 0;
        for(let d = 0; d < this.ndim; d++) {
            pi = pos[d];
            for(let i = d + 1; i < this.ndim; i++) {
                pi = pi * s[i];
            }
            index += pi;
        }
        return index;
    },

    get_cell: function(pos) {
        assert(pos.length === this.ndim);
        let index = this.get_cell_index(pos);
        return this.array[index];
    },

    set_cell: function(pos, value) {
        assert(pos.length === this.ndim);
        let index = this.get_cell_index(pos);
        this.array[index] = value;
    },

    // 举例：假设张量a.shape=(2,3,4)，则a.get_slice(1, 1)等同于numpy的a[:,1,:]，得到一个矩阵
    get_slice: function(axis, index) {
        assert(axis >= 0 && axis < this.ndim);
        let pos = [];
        let slice_shape = [];
        for(let d = 0; d < this.ndim; d++) {
            pos[d] = 0;
            if(d !== axis) slice_shape.push(this.shape[d]);
        }
        let sliced = new Tensor(slice_shape);
        pos[axis] = index;
        for(let d = 0; d < this.ndim; d++) {
            if(d === axis) continue;
            for(let i = 0; i < this.shape[d]; i++) {
                pos[d] = i;
                let slice_pos = pos.toSpliced(axis, 1); // NOTE 兼容性：toSpliced仅ChromeV110+完整支持
                let v = this.get_cell(pos);
                sliced.set_cell(slice_pos, v);
            }
        }
        return sliced;
    },

    dot: function(b) {
        let a = this;
        // 内积
        if(a.ndim === 1 && b.ndim === 1) {
            assert(a.shape[0] === b.shape[0], "点乘的两个向量长度不同");
            let len = a.shape[0];
            let s = 0;
            for(let i= 0; i < len; i++) {
                s += a.get_cell([i]) * b.get_cell([i]);
            }
            return s;
        }
        // 矩阵乘
        else if(a.ndim === 2 && b.ndim === 2) {
            assert(a.shape[1] === b.shape[0], "相乘的两个矩阵尺寸不匹配 (n,k) @ (k,m) → (n,m)");
            let res = new Tensor([a.shape[0], b.shape[1]]);
            for(let n = 0; n < a.shape[0]; n++) {
                for(let m = 0; m < b.shape[1]; m++) {
                    let value_nm = 0;
                    for(let k = 0; k < a.shape[1]; k++) {
                        value_nm += a.get_cell([n, k]) * b.get_cell([k, m]);
                    }
                    res.set_cell([n, m], value_nm);
                }
            }
            return res;
        }
        else {
            throw "Not implemented.";
        }
    },

    unary_pointwise: function(unary_op) {
        let res = new Tensor(this.shape);
        for(let i = 0; i < res.array.length; i++) {
            res.array[i] = unary_op(this.array[i]);
        }
        return res;
    },

    binary_pointwise: function(b, binary_op) {
        let a = this;
        assert(a.ndim === b.ndim, "逐点运算两个tensor的形状不匹配");
        assert(a.shape.reduce(
            (pv, cv, ci) => (pv && (cv === b.shape[ci])), true),
            "逐点运算两个tensor的形状不匹配");
        let res = new Tensor(a.shape);
        for(let i = 0; i < res.array.length; i++) {
            res.array[i] = binary_op(a.array[i], b.array[i]);
        }
        return res;
    },

    T: function() { //转置
        assert(this.ndim === 2, "只支持矩阵（2维张量）的转置");
        let res = new Tensor([this.shape[1], this.shape[0]]);
        for(let m = 0; m < this.shape[0]; m++) {
            for(let n = 0; n < this.shape[1]; n++) {
                let v = this.get_cell([m, n]);
                res.set_cell([n, m], v);
            }
        }
        return res;
    },

    softmax: function() {
        assert(this.ndim === 1, "softmax只支持向量");
        let maxv = Math.max.apply(null, this.array);
        let res = new Tensor(this.shape);
        let buf = [];
        let sum = 0;
        for(let i = 0; i < this.shape[0]; i++) {
            let v = Math.exp(this.get_cell([i]) - maxv); // NOTE 防止上溢出
            buf[i] = v;
            sum += v;
        }
        for(let i = 0; i < this.shape[0]; i++) {
            res.set_cell([i], buf[i] / sum);
        }
        return res;
    },

    vector_sum: function() {
        assert(this.ndim === 1, "vector_sum只支持向量");
        let sum = 0;
        for(let i = 0; i < this.shape[0]; i++) {
            sum += this.get_cell([i]);
        }
        return sum;
    },

    sum_axis: function(axis, keepdim) {
        assert(this.ndim === 2, "只支持矩阵");
        assert(axis < this.ndim, "轴序号超限");
        let res = null;
        if(axis === 0)
            res = (keepdim === true) ? new Tensor([1, this.shape[1]]) : new Tensor([this.shape[1]]);
        else
            res = (keepdim === true) ? new Tensor([this.shape[0], 1]) : new Tensor([this.shape[0]]);
        for(j = 0; j < this.shape[1-axis]; j++) {
            let sum = 0;
            for(let i = 0; i < this.shape[axis]; i++) {
                let v = (axis === 0) ? this.get_cell([i, j]) : this.get_cell([j, i]);
                sum += v;
            }
            let pos = (keepdim === true) ? ((axis === 0) ? [0, j] : [j, 0]) : [j];
            res.set_cell(pos, sum);
        }
        return res;
    },

    sum_all: function() { //把矩阵的所有元素加起来，返回一个数值
        assert(this.ndim === 2, "只支持矩阵");
        return this.sum_axis(0, true).sum_axis(1, true).get_cell([0, 0]);
    },

    add_vector: function(vec, axis) { //将向量加到矩阵的每一行或者列上，广播的
        assert(this.ndim === 2 && vec.ndim === 1 && axis < this.ndim);
        assert((axis === 0 && vec.shape[0] === this.shape[1]) || (axis === 1 && vec.shape[0] === this.shape[0]));
        let res = new Tensor(this.shape);
        for(let i = 0; i < this.shape[0]; i++) {
            for(let j = 0; j < this.shape[1]; j++) {
                let v1 = this.get_cell([i, j]);
                let v2 = (axis === 0) ? vec.get_cell([j]) : vec.get_cell([i]);
                res.set_cell([i, j], v1 + v2);
            }
        }
        return res;
    },


    show: function() {
        let tree = this.build_tree();
        console.log(JSON.stringify(tree, null, 0));
    }

};




////////////////////////////////////////////////
// Matrix 2019
////////////////////////////////////////////////

function Matrix(width, height) {
    if(width < 0 || height < 0) throw `Bad matrix size.`;
    this.width = width;
    this.height = height;
    this.data = new Array(width * height);
}

Matrix.prototype = {
    show: function() {
        let str_array = new Array();
        str_array.push('= Matrix ====================\n');
        for(let row = 0; row < this.height; row++) {
            for(let col = 0; col < this.width; col++) {
                str_array.push(parseFloat(this.get_element(col, row).toString()).toFixed(1).toString());
                str_array.push(', ');
            }
            str_array.push('\n');
        }
        str_array.push('=============================\n');
        console.log(str_array.join(''));
    },

    map: function(f/*: (v:any, i: any, a: any)=>T*/) {
        this.data = this.data.map(f);
    },

    set_element: function(x, y, value) {
        if(x < 0 || x > this.width || y < 0 || y > this.height) throw `Bad arguments.`;
        this.data[x + y * this.width] = value;
    },

    get_element: function(x, y) {
        if(x < 0 || x >= this.width || y < 0 || y >= this.height) return undefined;
        return this.data[x + y * this.width];
    },

    set_row: function(row_index, row_array) {
        let width = this.width;
        if(row_array.length !== width) throw `Width mismatch.`;
        for(let col_index = 0; col_index < width; col_index++) {
            // this.set_element(col_index, row_index, row_array[col_index]);
            this.data[col_index + row_index * width] = row_array[col_index];
        }
    },

    get_row: function(row_index) {
        let width = this.width;
        let row_array = new Array();
        for(let col_index = 0; col_index < width; col_index++) {
            // row_array[col_index] = this.getElement(col_index, row_index);
            row_array[col_index] = this.data[col_index + row_index * width];
        }
        return row_array;
    },

    set_col: function(col_index, col_array) {
        let width = this.width;
        let height = this.height;
        if(col_array.length !== height) throw `Height mismatch.`;
        for(let row_index = 0; row_index < height; row_index++) {
            // this.set_element(col_index, row_index, col_array[row_index]);
            this.data[col_index + row_index * width] = col_array[row_index];
        }
    },

    get_col: function(col_index) {
        let width = this.width;
        let height = this.height;
        let col_array = new Array();
        for(let row_index = 0; row_index < height; row_index++) {
            // col_array[row_index] = this.getElement(col_index, row_index);
            col_array[row_index] = this.data[col_index + row_index * width];
        }
        return col_array;
    },

    set_block: function(x, y, block) {
        let width = this.width;
        let height = this.height;
        if(x < 0 || y < 0 || x + block.width > width || y + block.height > height) {
            throw `Bad arguments.`;
        }
        for(let row = y; row < y + block.height; row++) {
            for(let col = x; col < x + block.width; col++) {
                // let val = block.getElement(col - x, row - y);
                // this.set_element(col, row, val);
                this.data[col + row * width] = block.data[(col - x) + (row - y) * block.width];
            }
        }
    },

    // 不作边界检查
    get_block: function(x, y, width, height) {
        // if(x < 0 || y < 0 || width < 0 || height < 0 || x + width > this.width || y + height > this.height) {
        //     throw `Bad arguments.`;
        // }
        let block = new Matrix(width, height);
        for(let row = 0; row < block.height; row++) {
            for(let col = 0; col < block.width; col++) {
                // let val = this.getElement(col + x, row + y);
                // block.set_element(col, row, val);
                block.data[col + row * block.width] = this.data[(col + x) + (row + y) * this.width];
            }
        }
        return block;
    },

    convolve: function(kernal) {
        let output = new Matrix(this.width, this.height);

        let sum = 0;
        for(let i = 0; i < kernal.width * kernal.height; i++) {
            sum += kernal.data[i];
        }
        sum = (sum === 0) ? 1 : sum;

        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                let window = this.get_block(x - (kernal.width >> 1), y - (kernal.height >> 1), kernal.width, kernal.height);
                let avr = 0;
                for(let i = 0; i < window.data.length; i++) {
                    avr += ((window.data[i] || 0) * kernal.data[i]);
                }
                // output.set_element(x, y, avr / sum);
                output.data[x + y * output.width] = (avr / sum);
            }
        }
        return output;
    },


};
