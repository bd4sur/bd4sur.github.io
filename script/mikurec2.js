var console_output = '';

// 返回token序列
function mr_tokenize(code) {
    // 预处理：转义恢复
    code = code.replace(/\&lt\;/gi, '<');
    code = code.replace(/\&gt\;/gi, '>');
    // 预处理：去除前面的空白字符，并且在末尾加一个换行
    code = code.replace(/^\s(?=\S)/, "");
    code = [code, '\n'].join('');

    var tokens = [];
    var token_temp = [];
    var inspace = false; // 是否在多个空格中

    for(var i = 0; i < code.length; i++) {
        if(code[i] === '(' || code[i] === ')' || code[i] === '\'' || code[i] === '"') {
            if(token_temp.length > 0) {
                var new_token = token_temp.join('');
                tokens.push(new_token);
                token_temp = [];
            }
            if(code[i] === '"') {
                var string_lit = code.substring(i).match(/\"[^\"]*?\"/gi);
                if(string_lit != null) {
                    string_lit = string_lit[0];
                    tokens.push(string_lit);
                    i = i + string_lit.length - 1;
                    continue;
                }
                else {
                    console.error('词法分析错误：字符串字面值未找到');
                    return;
                }
            }
            else {
                tokens.push(code[i]);
            }
        }
        else {
            // 如果是空格，则将
            if(code[i] === ' ' || code[i] === '\t' || code[i] === '\n' || code[i] === '\r') {
                if(inspace == true) {
                    continue;
                }
                else {
                    inspace = false;
                    if(token_temp.length > 0) {
                        var new_token = token_temp.join('');
                        tokens.push(new_token);
                        token_temp = [];
                    }
                }
            }
            else {
                token_temp.push(code[i]);
            }
        }
    }
    console.log("Tokens:");
    console.log(tokens);
    return tokens;
}

function mr_parse(tokens) {
    var ast_stack = [];
    var current_ast = {};
    current_ast['type'] = 'application';
    current_ast['list'] = ['begin'];
    for(var i = 0; i < tokens.length; i++) {
        if(tokens[i] === '(') {
            ast_stack.push(current_ast);

            current_ast = {};
            if(tokens[i+1] === 'lambda') {
                current_ast['type'] = 'lambda';
            }
            else if(tokens[i+1] === 'define') {
                current_ast['type'] = 'define';
            }
            else if(tokens[i-1] === 'lambda') {
                current_ast['type'] = 'params';
            }
            else if(tokens[i-1] === '\'') {
                current_ast['type'] = 'quoted';
            }
            else {
                current_ast['type'] = 'application';
            }
            current_ast['list'] = [];
        }
        else if(tokens[i] === ')'){
            var parent_ast = ast_stack.pop();
            parent_ast['list'].push(current_ast);
            current_ast = parent_ast;
        }
        else {
            if(tokens[i] === '\'') {
                continue;
            }
            // current_ast['type'] = 'symbol';
            current_ast['list'].push(tokens[i]);
        }
    }

    console.log("AST:");
    console.log(JSON.stringify(current_ast));

    return current_ast;
}

// 一些内置函数
function _MR_car(list) {
    return list[0];
}
function _MR_cdr(list) {
    return list.slice(1);
}
function _MR_cons(elem, list) {
    return [elem].concat(list);
}
function _MR_and(bools) {
    for(var i = 0; i < arguments.length; i++) {
        if(arguments[i] === '#f' || arguments[i] === false) { return '#f'; } // 只要遇到#f，就返回#f
    }
    return '#t';
}
function _MR_or(bools) {
    for(var i = 0; i < arguments.length; i++) {
        if(arguments[i] !== '#f' && arguments[i] !== false) { return '#t'; } // 只要遇到非#f，就返回#t
    }
    return '#f';
}
function _MR_not(bool) {
    if(bool !== '#f' && bool !== false) { return '#f'; }
    else { return '#t'; }
}
function _MR_display(str) {
    if(str === true) {
        str = '#t';
    }
    else if(str === false) {
        str = '#f';
    }
    console_output += str.toString();
    // console.log(str);
    return str;
}
function _MR_newline() {
    console_output += '\n';
    // console.log('');
    return '\n';
}
function _MR_is_empty(arg) {
    if(Array.isArray(arg) == true) {
        if(arg.length == 0) {
            return '#t';
        }
    }
    return '#f';
}
function _MR_strcat(args) {
    var res = '';
    for(var i = 0; i < arguments.length; i++) {
        res += arguments[i];
    }
    return res;
}
function _MR_strlen(arg) {
    return arg.length;
}
function _MR_charat(strlit, index) {
    return strlit[parseInt(index)];
}
function _MR_ascii_to_char(charcode) {
    return String.fromCharCode(charcode);
}
function _MR_char_to_ascii(strlit) {
    return strlit.charCodeAt(0);
}
function _MR_listcat(list1, list2) {
    return list1.concat(list2);
}
function _MR_left_sublist(index, lst) {
    return lst.slice(0, parseInt(index));
}
function _MR_right_sublist(index, lst) {
    return lst.slice(parseInt(index) + 1);
}
function _MR_listset(lst, index, val) {
    var newlist = lst;
    newlist[parseInt(index)] = val;
    return newlist;
}

function is_in_array(arr, elem) {
    if(Array.isArray(arr) == false) {
        return false;
    }
    for(var i = 0; i < arr.length; i++) {
        if(arr[i] === elem) {
            return true;
        }
    }
    return false;
}

function _MR_plus_$(args) {
    var res = (typeof(arguments[0]) === 'string') ? '' : 0;
    for(var i = 0; i < arguments.length; i++) { res += arguments[i]; }
    return res;
}
function _MR_minus_$(args) {
    var res = arguments[0];
    for(var i = 1; i < arguments.length; i++) { res -= arguments[i]; }
    return res;
}
function _MR_multiply_$(args) {
    var res = 1;
    for(var i = 0; i < arguments.length; i++) { res *= arguments[i]; }
    return res;
}
function _MR_divide_$(args) {
    var res = arguments[0];
    for(var i = 1; i < arguments.length; i++) { res = res / arguments[i]; }
    return res;
}
function _MR_mod_$(args) {
    var res = arguments[0];
    for(var i = 1; i < arguments.length; i++) { res = res % arguments[i]; }
    return res;
}
function _MR_gt_$(a, b) {
    return ((a > b) ? '#t' : '#f');
}
function _MR_lt_$(a, b) {
    return ((a < b) ? '#t' : '#f');
}
function _MR_ge_$(a, b) {
    return ((a >= b) ? '#t' : '#f');
}
function _MR_le_$(a, b) {
    return ((a <= b) ? '#t' : '#f');
}
function _MR_equal_$(a, b) {
    return ((a === b) ? '#t' : '#f');
}
function _MR_nequal_$(a, b) {
    return ((a !== b) ? '#t' : '#f');
}

const builtin_func = {
    '+':'_MR_plus_$',
    '-':'_MR_minus_$',
    '*':'_MR_multiply_$',
    '/':'_MR_divide_$',
    '%':'_MR_mod_$',
    '>':'_MR_gt_$',
    '<':'_MR_lt_$',
    '>=':'_MR_ge_$',
    '<=':'_MR_le_$',
    '=':'_MR_equal_$',
    '!=':'_MR_nequal_$',
    'car':'_MR_car',
    'cdr':'_MR_cdr',
    'cons':'_MR_cons',
    'display':'_MR_display',
    'newline':'_MR_newline',
    'and':'_MR_and',
    'or':'_MR_or',
    'not':'_MR_not',
    'is_empty':'_MR_is_empty',
    'strcat':'_MR_strcat',
    'strlen':'_MR_strlen',
    'charat':'_MR_charat',
    'ascii_to_char':'_MR_ascii_to_char',
    'char_to_ascii':'_MR_char_to_ascii',
    'listcat':'_MR_listcat',
    'listset':'_MR_listset',
    'left_sublist':'_MR_left_sublist',
    'right_sublist':'_MR_right_sublist'
};

function mr_to_js(ast) {
    var jscode = '';
    // 当前AST为基本的符号
    // 并且负责处理Scheme的特殊语法，例如将#[tf]加上引号 || ast === 'else'
    if(typeof(ast) !== 'object') {
        if(ast === '#t') {
            return ('"' + ast + '"');
        }
        else if(ast === '#f') {
            return ('"' + ast + '"');
        }
        // 内部函数名替换
        else if(ast in builtin_func) {
            return builtin_func[ast];
        }
        return ast;
    }
    else if(ast.type === 'application') {
        // 处理函数名
        var func = mr_to_js((ast.list)[0]);

        // begin特殊形式
        if(func === 'begin') {
            jscode += '(function(){';
            for(var i = 1; i < ast.list.length - 1; i++) {
                jscode += (mr_to_js((ast.list)[i]) + ';');
            }
            // 最后一项需要返回！
            jscode += ('return(' + mr_to_js((ast.list)[ast.list.length - 1]) + ');');
            jscode += '})()';
            return jscode;
        }

        // if特殊形式
        else if(func === 'if') {
            var p = mr_to_js((ast.list)[1]);
            var c1 = mr_to_js((ast.list)[2]);
            var c2 = mr_to_js((ast.list)[3]);
            jscode += ('(function(){if(' + p + '!=="#f"&&' + p + '!=false){return(' + c1 + ');}else{return(' + c2 + ');}})()');
            return jscode;
        }

        // cond特殊形式
        else if(func === 'cond') {
            jscode += '(function(){';
            var clist = ast.list;
            var else_flag = false;
            for(var i = 1; i < clist.length; i++) {
                var item = clist[i];
                var p = mr_to_js((item.list)[0]);
                var clause = mr_to_js((item.list)[1]);
                if(p === 'else') {
                    else_flag = true;
                    jscode += ('{return(' + clause + ');}');
                    break;
                }
                else {
                    jscode += ('if(' + p + '!=="#f"&&' + p + '!=false){return(' + clause + ');} else ');
                }
            }
            if(else_flag == false) {
                jscode += '{return "#f";}';
            }
            jscode += '})()';
            return jscode;
        }

        else {
            jscode += ('(' + mr_to_js((ast.list)[0]) + ')(');
        }

        // 处理实参列表
        var has_arg = false;
        for(var i = 1; i < ast.list.length; i++) {
            has_arg = true;
            jscode += (mr_to_js((ast.list)[i]) + ',');
        }
        if(has_arg == true) {
            jscode = (jscode.substring(0, jscode.length - 1) + ')');
        }
        else {
            jscode += ')';
        }
    }
    else if(ast.type === 'lambda') {
        jscode += 'function('
        // 处理参数列表
        var has_param = false;
        for(var i = 0; i < ((ast.list)[1]).list.length; i++) {
            has_param = true;
            jscode += (mr_to_js((((ast.list)[1]).list)[i]) + ',');
        }
        if(has_param == true) {
            jscode = (jscode.substring(0, jscode.length - 1) + ')');
        }
        else {
            jscode += ')';
        }
        // 处理函数体
        jscode += '{return(';
        jscode += mr_to_js((ast.list)[2]);
        jscode += ');}';
    }
    else if(ast.type === 'define') {
        jscode += 'var ';
        jscode += (ast.list)[1];
        jscode += ' = ';
        jscode += mr_to_js((ast.list)[2]);
        // jscode += ';';
    }
    else if(ast.type === 'quoted') {
        jscode += '[';
        var has_elem = false;
        for(var i = 0; i < ast.list.length; i++) {
            has_elem = true;
            jscode += (mr_to_js((ast.list)[i]) + ',');
        }
        if(has_elem == true) {
            jscode = (jscode.substring(0, jscode.length - 1) + ']');
        }
        else {
            jscode += ']';
        }
    }
    return jscode;
}

function mrRun(schemeCode) {
    console_output = 'MikuRec v2.0 Alpha\n\n';
    let code = schemeCode;
    code = code.replace(/\;[^\n]*(?=\n)/gi, "");
    console.log(">>MRCode:\n" + code);
    let tokens = mr_tokenize(code);
    let ast = mr_parse(tokens);
    let jscode = mr_to_js(ast);
    console.log(">>JSCode:\n" + jscode);
    eval(jscode);
    return console_output;
}




// 全局括号层数计数器，用于支持跨段落括号匹配计数
var blevel = 0;
function MRCodeHighlighter(code) {
    // 首先分析文档结构
    //console.log("Before HL\n"+code);
    var code_html = code.replace(/\<\/span\>/gi, "");
    code_html = code_html.replace(/\<span .+?\"\>/gi, "");
    code_html = code_html.replace(/\<\/font\>/gi, "");
    code_html = code_html.replace(/\<font color\=\".+?\"\>/gi, "");
    code_html = code_html.replace(/\<\/pre\>/gi, "");
    code_html = code_html.replace(/\<pre[\s\S]+?\"\>/gi, "");
    code_html = code_html.replace(/\<div\>/gi, '`').replace(/\<\/div\>/gi, '`').replace(/\<br\>/gi, 'N');
    //console.log("After HL\n"+code_html);
    var code_slice = code_html.split(/\`+/gi);
    // console.log(code_slice);
    code = '';
    for(var i = 0; i < code_slice.length; i++) {
        var s = code_slice[i];
        if(s === '') {continue;}
        if(s[s.length-1] === 'N') { s = (s.substring(0, s.length-1) + '\n'); }
        else { s = s + '\n'; }
        code += s;
    }
    //console.log(code);


    // 辅助函数：寻找某位置开始的匹配右括号位置
    var findPairedBraket = function(str, leftIndex) {
        var level = 0;
        var braketFlag = false;
        for(var i = leftIndex; i < str.length; i++) {
// console.log('[codeHighlighter]查看字符 ' + str[i]);
            if(str[i] === '(') {level++; braketFlag = true;}
            else if(str[i] === ')') {level--;}
            if(braketFlag == true && level == 0) {
                return i;
            }
        }
        return str.length;
    };

    var html = '';
    var state = '';

    // var blevel = 0;
    var bcolor = ['#aaaaaa','#FF0000', '#FF8C00', '#32CD32', '#20B2AA', '#6A5ACD', '#BA55D3'];

    // HTML尖括号应特别处理（主要用于Lisp这种没有中置运算符的语言）
    var regexTagBracket = new RegExp(/(\&lt\;)|(\&gt\;)/g);

    // 空格正则（词法分割单元之一）
    var regexSpace = new RegExp(/\s/g);
    // 字符串正则
    var regexString = new RegExp(/\".*?\"/g);
    // 直接数正则
    var regexNumber = new RegExp(/((0x[0-9A-Fa-f]+)|([0-9]*\.[0-9]+[Ff]?)|([0-9]+[Ll]?))\b/g);
    // 预处理正则
    var regexPrecompile = new RegExp(/\#([^(t\b)(f\b)\\]).+(?=(\n|$))/g);

    // Lisp标识符正则
    var regexIdentifierLisp = new RegExp(/[A-Za-z\/\_\-\+\=\.\,\:\!\@\#\$\^\*\&\?][0-9A-Za-z\/\_\-\+\=\.\,\:\!\@\#\$\^\*\&\;\?]*(?=( |\)|\n|$))/g);
    // Lisp关键字正则
    var regexKeywordLisp = new RegExp(/((lambda)|(define)|(if)|(else)|(cond)|(car)|(cdr)|(cons)|(strcat)|(mod)|(empty\?)|(eq\?)|(display)|(newline)|(and)|(or)|(not)|(begin)|(inc)|(dec)|(atom\?)|(strcat)|(strlen)|(charat)|(ascii\-to\-char)|(listcat)|(left\-sublist)|(right\-sublist)|(listset))(?=( |\)|\n|$))/g);
    // Lisp布尔量正则
    var regexBooleanLisp = new RegExp(/^\#([tf]|(\\[^ \)\n]+))(?=( |\)|\n|$))/g);
    // Lisp注释正则
    var regexCommentLisp = new RegExp(/\;.*(?=(\n|$))/g);

    // 从左到右扫描源代码，进行词法分析
    for(var i = 0; i < code.length; i++) {
        var current = code[i]; // 当前字符
        var suffix = code.substring(i); // 当前字符往后的字符串

        // // 尖括号必须首先处理，以免被当成注释
        // if(suffix.search(regexTagBracket) == 0) {
        //  html += suffix.match(regexTagBracket)[0];
        //  i = i + 3; // &lt;的长度-1
        // }
        // 当前字符是空白字符：一般而言只有一个空白字符，所以直接向前跳
        if(suffix.search(regexSpace) == 0) {
            html += current;
            continue;
        }
        // 直接数
        else if(suffix.search(regexNumber) == 0) {
            var number = suffix.match(regexNumber)[0];
            html += ('<span class="code-number">' + number + '</span>');
            i = i + number.length - 1;
        }
        // 字符串
        else if(suffix.search(regexString) == 0) {
            var str = suffix.match(regexString)[0];
            html += ('<span class="code-string">' + str + '</span>');
            i = i + str.length - 1;
        }
        // 预处理
        else if(suffix.search(regexPrecompile) == 0) {
            var precompile = suffix.match(regexPrecompile)[0];
            html += ('<span class="code-precompile">' + precompile + '</span>');
            i = i + precompile.length - 1;
        }
        // 关键字
        else if(suffix.search(regexKeywordLisp) == 0) {
            var keyword = suffix.match(regexKeywordLisp)[0];
            html += ('<span class="code-keyword">' + keyword + '</span>');
            i = i + keyword.length - 1;
        }
        // 布尔
        else if(suffix.search(regexBooleanLisp) == 0) {
            var bool = suffix.match(regexBooleanLisp)[0];
            html += ('<span class="code-boolean">' + bool + '</span>');
            i = i + bool.length - 1;
        }
        // 标识符
        else if(suffix.search(regexIdentifierLisp) == 0) {
            var idt = suffix.match(regexIdentifierLisp)[0];
            html += ('<span class="code-identifier">' + idt + '</span>');
            i = i + idt.length - 1;
        }
        // 注释
        else if(suffix.search(regexCommentLisp) == 0) {
            var comment = suffix.match(regexCommentLisp)[0];
            html += ('<span class="code-comment">' + comment + '</span>');
            i = i + comment.length - 1;
        }
        // 左括号
        else if(current === '(') {
            html += ('<span style="color:' + bcolor[blevel % 7] + ';">' + current + '</span>');
            blevel++;
        }
        // 右括号
        else if(current === ')') {
            blevel--;
            html += ('<span style="color:' + bcolor[blevel % 7] + ';">' + current + '</span>');
        }
        // quote
        else if(current === '\'') {
            // quoteFlag = true;
            // 判断其后是symbol还是list
            if(code[i+1] === '(') {
                var rightIndex = findPairedBraket(code, i);
                var quoted = code.substring(i, rightIndex + 1);
                html += ('<span class="code-quote">' + quoted + '</span>');
                i = rightIndex;
            }
            else {
                var quoted = code.substring(i + 1).match(regexIdentifierLisp)[0];
                if(quoted != null) {
                    html += ('<span class="code-quote">\'' + quoted + '</span>');
                }
                i = i + quoted.length;
            }
        }

        else {
            html += current;
        }
    }
    return html;
}