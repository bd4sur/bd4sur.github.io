// MikuRec V3
// 2018.8.16

/********************************************
 *
 *                  重构准备
 *
 ********************************************/

function MikuRec() {

    // 运行环境
    function Environment() {
        this.AST = new Array();
        this.CLOSURES = new Object();
    }

    // 词法语法分析模块
    //   该模块将代码解析为AST，返回包含AST的Environment供Evaluator使用
    // String -> Environment
    function Parser(code) {
        return new Environment();
    }

    // 求值模块
    //   该模块对Environment进行处理
    // Environment -> Port -> UNDEFINED
    function Evaluator(env, ports) {

    }

    // 编译模块
    //   该模块将Environment编译为IR或其他语言。
    // Environment -> Port -> String
    function Compiler(env, ports) {

    }

    // 虚拟机
    //   该模块用于执行Compiler生成的代码
    function VM(targetCode) {

    }

    // 解释器模块
    //   解释器是Parser和Evaluator的级联。需要注意的是，求值器内部会创建新的解释器，以支持eval过程。
    function Interpreter(code, ports) {

    }

};

/********************************************
 *
 *               IO和控制台模拟
 *
 ********************************************/

// 输出缓冲区
let STDOUT = new Array();
let STDERR = new Array();

function flushIO() {
    STDOUT = new Array();
    STDERR = new Array();
}

function readIO(buf) {
    return buf.join('');
}

/********************************************
 *
 *            内存管理和垃圾清理
 *
 ********************************************/

// 分配一个新的AST节点地址
function allocateNodeAddr() {
    let ret = NODE_MEMORY_POINTER;
    NODE_MEMORY_POINTER++;
    return ret;
}

// 分配一个新的闭包地址
function allocateClosureAddr() {
    let ret = CLOSURE_MEMORY_POINTER;
    CLOSURE_MEMORY_POINTER++;
    return ret;
}


/********************************************
 *
 *               全局环境和定义
 *
 ********************************************/

// 尾递归优化开关
var TCO_FLAG = true;

// 分析时环境
var NODE_MEMORY = new Array();
var NODE_MEMORY_POINTER = 0;
var NODE_STACK = new Array();
Array.prototype.top = function() { return this[this.length - 1]; }

// 运行时环境
var CLOSURE_MEMORY = new Array();
var CLOSURE_MEMORY_POINTER = 0;

// AST节点定义（构造器）
function SList(isQuote, addr, parentAddr) {
    this.addr = addr;
    this.parent = parentAddr;
    this.children = new Array();
    this.isQuote = isQuote;
}
function Lambda(isQuote, addr, parentAddr) {
    this.addr = addr;
    this.parent = parentAddr;
    this.parameters = new Array();
    this.body = -1; // 未来改成数组，以支持隐式(begin ...)
    this.lexicalEnv = new Object();
    this.isQuote = isQuote;
}

// 压入新SList节点
function pushSList() {
    // console.warn('pushSList()');
    let parentAddr = NODE_STACK.top();
    // 首先申请新节点
    let currentAddr = allocateNodeAddr();//NODE_MEMORY_POINTER;
    let slist = new SList(false, currentAddr, parentAddr);
    NODE_MEMORY[currentAddr] = slist;
    // NODE_MEMORY_POINTER++;
    // 将新节点的地址压入分析栈
    NODE_STACK.push(currentAddr);
}
// 压入新Lambda节点
function pushLambda() {
    // console.warn('pushLambda()');
    let parentAddr = NODE_STACK.top();
    // 首先申请新节点
    let currentAddr = allocateNodeAddr();//NODE_MEMORY_POINTER;
    let lambda = new Lambda(false, currentAddr, parentAddr);
    NODE_MEMORY[currentAddr] = lambda;
    // NODE_MEMORY_POINTER++;
    // 将新节点的地址压入分析栈
    NODE_STACK.push(currentAddr);
}

// 压入新QuotedSList节点
function pushQuotedSList() {
    // console.warn('pushQuotedSList()');
    let parentAddr = NODE_STACK.top();
    // 首先申请新节点
    let currentAddr = allocateNodeAddr();//NODE_MEMORY_POINTER;
    let qlist = new SList(true, currentAddr, parentAddr);
    NODE_MEMORY[currentAddr] = qlist;
    // NODE_MEMORY_POINTER++;
    // 将新节点的地址压入分析栈
    NODE_STACK.push(currentAddr);
}

// 作为列表项结束
function popItem() {
    // console.warn('popItem()');
    let a = NODE_STACK.pop();
    if(NODE_MEMORY[NODE_STACK.top()] !== undefined) {
        NODE_MEMORY[NODE_STACK.top()].children.push(a);
    }
}
// 作为函数体结束
function popBody() {
    // console.warn('popBody()');
    let a = NODE_STACK.pop();
    NODE_MEMORY[NODE_STACK.top()].body = a;
}

// 添加新Symbol（列表项）
function addItemSymbol(s) {
    // console.warn('addItemSymbol()');
    NODE_MEMORY[NODE_STACK.top()].children.push(s);
}
// 添加新Symbol（参数列表）
function addParameterSymbol(s) {
    // console.warn('addParameterSymbol()');
    NODE_MEMORY[NODE_STACK.top()].parameters.push(s);
}
// 添加新Symbol（函数体）
function addBodySymbol(s) {
    // console.warn('addBodySymbol()');
    NODE_MEMORY[NODE_STACK.top()].body = s;
}

// Node转字符串
function nodeToString(nodeAddr) {
    if(typeof nodeAddr === 'number') {
        let node = NODE_MEMORY[nodeAddr];
        let str = '';
        if(node instanceof SList) {
            if(node.isQuote === true) { str += '\''; }
            str += '(';
            if(node.children.length <= 0) {
                str += ')';
                return str;
            }
            for(let i = 0; i < node.children.length-1; i++) {
                str += (nodeToString((node.children)[i]) + ' ');
            }
            str += (nodeToString((node.children)[node.children.length-1]) + ')');
            return str;
        }
        else if(node instanceof Lambda) {
            if(node.isQuote === true) { str += '\''; }
            str += '(lambda (';
            if(node.parameters.length <= 0) {
                str += ')';
            }
            else {
                for(let i = 0; i < node.parameters.length-1; i++) {
                    str += (nodeToString((node.parameters)[i]) + ' ');
                }
                str += (nodeToString((node.parameters)[node.parameters.length-1]) + ') ');
            }
            str += (nodeToString(node.body) + ')');
            return str;
        }
        else {
            return '#ERROR';
        }
    }
    else if(typeof nodeAddr === 'string') {
        return nodeAddr;
    }
    else {
        return `#BAD_NODE_ADDR:${nodeAddr}`;
    }
}

// 运行时闭包定义
function Closure(lambdaNodeAddr, parentClosureAddr) {
    this.parent = parseInt(parentClosureAddr);
    this.lambdaAddr = parseInt(lambdaNodeAddr);
    this.BoundEnv = new Object();
    this.FreeEnv = new Object();
}

// 申请新闭包
function newClosure(lambdaNodeAddr, parentClosureAddr) {
    let currentClosureAddr = allocateClosureAddr();//CLOSURE_MEMORY_POINTER;
    let closure = new Closure(lambdaNodeAddr, parentClosureAddr);
    CLOSURE_MEMORY[currentClosureAddr] = closure;
    // CLOSURE_MEMORY_POINTER++;
    return currentClosureAddr;
}


// 获取类型
function TypeOf(x) {
    if(typeof x === 'number') {
        let node = NODE_MEMORY[x];
        if(node !== undefined) {
            if(node instanceof SList) {
                return (node.isQuote === false) ? 'SLIST' : 'QUOTED_SLIST';
            }
            else if(node instanceof Lambda) {
                return (node.isQuote === false) ? 'LAMBDA' : 'QUOTED_LAMBDA';
            }
            else {
                return 'UNDEFINED_NODE';
            }
        }
        else {
            return 'UNDEFINED_NODE';
        }
    }
    else if(typeof x === 'string') {
        if(/\#C\d+/gi.test(x)) {
            return 'CLOSURE';
        }
        else if(/\#K\d+/gi.test(x)) {
            return 'CONTINUATION';
        }

        if(x[0] === '\'') {
            return 'QUOTED_SYMBOL';
        }
        else if(x === '#t' || x === '#f') {
            return 'BOOLEAN';
        }
        else if(/^\-?\d+(\.\d+)?$/gi.test(x)) {
            return 'NUMBER';
        }
        else if(x[0] === '"' && x[x.length-1] === '"') {
            return 'STRING';
        }
        else {
            return 'VARIABLE';
        }
    }
}

/********************************************
 *
 *               词法/语法分析
 *
 ********************************************/

function Lexer(code) {
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
        if(code[i] === '(' || code[i] === ')' || code[i] === '[' || code[i] === ']' || code[i] === '{' || code[i] === '}' || code[i] === '\'' || code[i] === '"') {
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


/* 递归下降分析 */

function isSYMBOL(t) {
    if(t === '(' || t === ')' || t === '[' || t === ']' || t === '{' || t === '}' || t === undefined) { return false; }
    else { return true; }
}

function ParserLog(m) {
    // console.log(m);
    // STDOUT.push(m.replace(/\</gi,'&lt;').replace(/\>/gi,'&gt;'));
    // STDOUT.push('<br>');
}
function ParserError(m) {
    console.error(m);
    // STDOUT.push(`<span style="color:red;">${m.replace(/\</gi,'&lt;').replace(/\>/gi,'&gt;')}</span>`);
    // STDOUT.push('<br>');
    throw 'ParseError';
}

// 用于记录quote状态
var quoteFlag = false;
// 用于记录body节点的退出
var lambdaBodyFlag = new Array();
// 用于记录body是否是单独的symbol
var symbolBodyFlag = false;

// 入口函数：无返回值，副作用是把AST安置在全局环境NODE_MEMORY，根节点是第0个元素
function Parser(tokens) {
    NT_Term(tokens, 0);
    return 0;
}

// 起始非终结符（NT）
function NT_Term(tokens, index) {
    let next = index + 1;
    if(tokens[index] === '(') {
        // <Lambda>
        if(quoteFlag !== true && tokens[index+1] === 'lambda') {
            ParserLog(`<Term> → <Lambda> @ ${tokens[index]}`);
            next = NT_Lambda(tokens, index);
            return next;
        }
        // <SList>
        else {
            ParserLog(`<Term> → <SList> @ ${tokens[index]}`);
            next = NT_SList(tokens, index);
            return next;
        }
    }
    // <Quote>
    else if(tokens[index] === '\'') {
        ParserLog(`<Term> → <Quote> @ ${tokens[index]}`);
        next = NT_Quote(tokens, index);
        return next;
    }
    // <Quasiquote>
    else if(tokens[index] === '[') {
        ParserLog(`<Term> → <Quasiquote> @ ${tokens[index]}`);
        next = NT_Quasiquote(tokens, index);
        return next;
    }
    // <Symbol>
    else if(isSYMBOL(tokens[index])) {
        ParserLog(`<Term> → <Symbol> @ ${tokens[index]}`);
        next = NT_Symbol(tokens, index);
        return next;
    }
    else {
        ParserError(`<Term> 意外前缀 @ ${next}`);
        return;
    }
}


// <SList> ::= ( <SListSeq> )
function NT_SList(tokens, index) {
    let next = index + 1;
    if(tokens[index] === '(') {
        ParserLog(`<SList> → ( <SListSeq> ) @ ${tokens[index]}`);
        // lambdaBodyFlag.push(false);
        // 判断是不是quote后面的
        if(quoteFlag === true) {
            pushQuotedSList();
        }
        else {
            pushSList();
        }
        next = NT_SListSeq(tokens, next);
        if(tokens[next] === ')') {
            let isBody = lambdaBodyFlag.pop();
            if(isBody === true) {
                popBody();
            }
            else {
                popItem();
            }
            return (next+1);
        }
        else {
            ParserError(`<SList> 缺少右括号 @ ${next}`);
            return;
        }
    }
    else {
        ParserError(`<SList> 意外前缀 @ ${next}`);
        return;
    }
}

// <Lambda> ::= ( lambda <ArgList> <Term> )
function NT_Lambda(tokens, index) {
    let next = index + 1;
    if(tokens[index] === '(' && tokens[index+1] === 'lambda') {
        ParserLog(`<Lambda> → ( lambda <ArgList> <Term> ) @ ${tokens[index]}`);
        // lambdaBodyFlag.push(false);
        pushLambda();
        next = NT_ArgList(tokens, index+2);
        // lambdaBodyFlag.push(true);
        next = NT_Body(tokens, next);
        if(tokens[next] === ')') {
            let isBody = lambdaBodyFlag.pop();
            if(isBody === true) {
                popBody();
            }
            else {
                popItem();
            }
            return (next+1);
        }
        else {
            ParserError(`<Lambda> 缺少右括号 @ ${next}`);
            return next;
        }
    }
    else {
        ParserError(`<Lambda> 意外前缀 @ ${next}`);
        return next;
    }
}

// <Body> ::= <Term>
function NT_Body(tokens, index) {
    let next = index + 1;
    // <Term>
    if(tokens[index] === '(' || tokens[index] === '[' || tokens[index] === '\'') {
        ParserLog(`<Body> → <Term> @ ${tokens[index]}`);
        lambdaBodyFlag.push(true);
        next = NT_Term(tokens, index);
        return next;
    }
    // <Symbol>
    else if(isSYMBOL(tokens[index])) {
        ParserLog(`<Body> → <BodySymbol> @ ${tokens[index]}`);
        symbolBodyFlag = true;
        next = NT_BodySymbol(tokens, index);
        return next;
    }
    else {
        ParserError(`<Body> 意外前缀 @ ${next}`);
        return;
    }
}

// <SListSeq> ::= <Term> <SListSeq> | ε
function NT_SListSeq(tokens, index) {
    let next = index + 1;
    if(tokens[index] === '(' || tokens[index] === '[' || tokens[index] === '\'' || isSYMBOL(tokens[index])) {
        ParserLog(`<SListSeq> → <Term> <SListSeq> @ ${tokens[index]}`);
        lambdaBodyFlag.push(false);
        next = NT_Term(tokens, index);
        next = NT_SListSeq(tokens, next);
        return next;
    }
    ParserLog(`<SListSeq> → ε @ ${tokens[index]}`);
    return index; // epsilon不吃token
}

// <ArgListSeq> ::= <ArgSymbol> <ArgListSeq> | ε
function NT_ArgListSeq(tokens, index) {
    let next = index + 1;
    if(isSYMBOL(tokens[index])) {
        ParserLog(`<ArgListSeq> → <ArgSymbol> <ArgListSeq> @ ${tokens[index]}`);
        next = NT_ArgSymbol(tokens, index);
        next = NT_ArgListSeq(tokens, next);
        return next;
    }
    ParserLog(`<ArgListSeq> → ε @ ${tokens[index]}`);
    return index; // epsilon不吃token
}

// <ArgList> ::= ( <ArgListSeq> )
function NT_ArgList(tokens, index) {
    let next = index + 1;
    if(tokens[index] === '(') {
        ParserLog(`<ArgList> → ( <ArgListSeq> ) @ ${tokens[index]}`);
        next = NT_ArgListSeq(tokens, index+1);
        if(tokens[next] === ')') {
            return (next+1);
        }
        else {
            ParserError(`<ArgList> 缺少右括号 @ ${next}`);
            return next;
        }
    }
    else {
        ParserError(`<ArgList> 意外前缀 @ ${next}`);
        return next;
    }
}

// <Quote> ::= ' <SList> | ' <Symbol>
function NT_Quote(tokens, index) {
    let next = index + 1;
    if(tokens[index] === '\'') {
        if(tokens[index+1] === '(') {
            ParserLog(`<Quote> → ' <SList> @ ${tokens[index]}`);
            quoteFlag = true;
            // lambdaBodyFlag.push(false);
            next = NT_SList(tokens, next);
            quoteFlag = false;
            return next;
        }
        // <Quasiquote>
        else if(tokens[index+1] === '[') {
            ParserLog(`<Quote> → <Quasiquote> @ ${tokens[index]}`);
            // quoteFlag = true;
            next = NT_Quasiquote(tokens, next);
            // quoteFlag = false;
            return next;
        }
        else if(isSYMBOL(tokens[index+1]) === true || tokens[index+1] === 'lambda') {
            ParserLog(`<Quote> → ' <Symbol> @ ${tokens[index]}`);
            quoteFlag = true;
            // lambdaBodyFlag.push(false);
            next = NT_Symbol(tokens, next);
            quoteFlag = false;
            return next;
        }
        else {
            ParserError(`<Quote> 意外前缀 @ ${next}`);
            return next;
        }
    }
    else {
        ParserError(`<Quote> 意外前缀 @ ${next}`);
        return next;
    }
}

// <Quasiquote> ::= [ <SListSeq> ]
function NT_Quasiquote(tokens, index) {
    let next = index + 1;
    if(tokens[index] === '[') {
        ParserLog(`<SList> → [ <SListSeq> ] @ ${tokens[index]}`);
        pushQuotedSList(); //quasiquote目前以quote看待
        next = NT_SListSeq(tokens, next);
        if(tokens[next] === ']') {
            let isBody = lambdaBodyFlag.pop();
            if(isBody === true) {
                popBody();
            }
            else {
                popItem();
            }
            return (next+1);
        }
        else {
            ParserError(`<Quasiquote> 缺少右括号 @ ${next}`);
            return;
        }
    }
    else {
        ParserError(`<Quasiquote> 意外前缀 @ ${next}`);
        return;
    }
}

// <Symbol> ::= SYMBOL
function NT_Symbol(tokens, index) {
    let next = index + 1;
    if(isSYMBOL(tokens[index])) {
        ParserLog(`<Symbol> → SYMBOL @ ${tokens[index]}`);
        let isBody = lambdaBodyFlag.pop();
        if(isBody === true && symbolBodyFlag == true) {
            addBodySymbol(tokens[index]);
            symbolBodyFlag = false;
        }
        else { // quote也走这个分支，只不过要保留'号
            if(quoteFlag) {
                // 注意：不对基本类型加引号
                let termtype = TypeOf(tokens[index]);
                if(termtype === 'BOOLEAN' || termtype === 'NUMBER' || termtype === 'STRING' || termtype === 'QUOTED_SYMBOL') {
                    addItemSymbol(tokens[index]);
                }
                else {
                    addItemSymbol('\''+tokens[index]);
                }
            }
            else {
                addItemSymbol(tokens[index]);
            }
        }
        return next;
    }
    else {
        ParserError(`<Symbol> 意外前缀 @ ${next}`);
        return next;
    }
}

// <BodySymbol> ::= SYMBOL
function NT_BodySymbol(tokens, index) {
    let next = index + 1;
    if(isSYMBOL(tokens[index])) {
        ParserLog(`<BodySymbol> → SYMBOL @ ${tokens[index]}`);
        addBodySymbol(tokens[index]);
        return next;
    }
    else {
        ParserError(`<BodySymbol> 意外前缀 @ ${next}`);
        return next;
    }
}

// <ArgSymbol> ::= SYMBOL
function NT_ArgSymbol(tokens, index) {
    let next = index + 1;
    if(isSYMBOL(tokens[index])) {
        ParserLog(`<ArgSymbol> → SYMBOL @ ${tokens[index]}`);
        addParameterSymbol(tokens[index]);
        return next;
    }
    else {
        ParserError(`<ArgSymbol> 意外前缀 @ ${next}`);
        return next;
    }
}

/********************************************
 *
 *           针对(quote .)的预处理
 *
 ********************************************/

function dealQuote() {
    for(let i = 0; i < NODE_MEMORY.length; i++) {
        let node = NODE_MEMORY[i];
        if(node instanceof SList && node.children[0] === 'quote') {
            // 取出被引用的元素，并将其父元素设置为(quote .)的父元素
            let quoted = node.children[1];
            let type = TypeOf(quoted);
            if(type === 'SLIST') {
                NODE_MEMORY[quoted].isQuote = true;
                NODE_MEMORY[quoted].parent = node.parent;
            }
            else if(type === 'VARIABLE') {
                quoted = "'" + quoted;
            }
            // 将quoted的父节点的所有相应的儿子都改成quoted
            for(let j = 0; j < NODE_MEMORY[node.parent].children.length; j++) {
                if(NODE_MEMORY[node.parent].children[j] === i) {
                    NODE_MEMORY[node.parent].children[j] = quoted;
                }
            }
            // 删除(quote .)元素
            delete NODE_MEMORY[i];
        }
    }
}

/********************************************
 *
 *            内置函数和特殊构造
 *
 ********************************************/

const SPECIAL_FORM = {
    'if': function(children, parentClosure, contextAddr) {
        let condition = evaluate(parentClosure, children[1], contextAddr);
        if(condition !== '#f') {
            return evaluate(parentClosure, children[2], contextAddr);
        }
        else {
            return evaluate(parentClosure, children[3], contextAddr);
        }
    },
    'cond': function(children, parentClosure, contextAddr) {
        // 按顺序遍历每个分支(p c)，只要遇到p不为#f，就求值c并返回
        for(let i = 1; i < children.length; i++) {
            if(TypeOf(children[i]) === 'SLIST') {
                let branchNode = NODE_MEMORY[children[i]];
                let predicate = branchNode.children[0];
                let clause = branchNode.children[1];
                let pValue = evaluate(parentClosure, predicate, contextAddr);
                if(pValue !== '#f') { // 含else
                    return evaluate(parentClosure, clause, contextAddr);
                }
            }
            else {
                throw `错误：cond的各个分支必须是SLIST`;
            }
        }
    },
    'while': function(children, parentClosure, contextAddr) {
        let predicate = evaluate(parentClosure, children[1], contextAddr);
        let res = '#f';
        while(predicate !== '#f') {
            res = evaluate(parentClosure, children[2], contextAddr);
            predicate = evaluate(parentClosure, children[1], contextAddr);
        }
        return res;
    },
    'define': function(children, parentClosure, contextAddr) {
        // let parentClosureAddr = parentClosure.match(/\-?\d+$/gi)[0];
        // 注意：每一项都不可eval，保持原形
        let symbol = children[1];
        let target = children[2];
        let lambdaAddr = nearestLambdaAddr(contextAddr);
        if(NODE_MEMORY[lambdaAddr].lexicalEnv === undefined) {
            NODE_MEMORY[lambdaAddr].lexicalEnv = new Object();
        }
        NODE_MEMORY[lambdaAddr].lexicalEnv[symbol] = target;
        return `#DEFINE:'${symbol}' as ${(typeof target === 'number') ? ('NODE' + target) : target}`;
    },
    'set!': function(children, parentClosure, contextAddr) {
        let parentClosureAddr = parentClosure.match(/\-?\d+$/gi)[0];
        let symbol = children[1];
        let value = null;

        // 沿闭包链逐级向上查找并修改
        let successFlag = false;
        let currentClosureAddr = parentClosureAddr;
        while(currentClosureAddr >= 0) {
            let bound = CLOSURE_MEMORY[currentClosureAddr].BoundEnv;
            if(symbol in bound) {
                value = evaluate('#C' + currentClosureAddr, children[2], contextAddr);
                CLOSURE_MEMORY[currentClosureAddr].BoundEnv[symbol] = value;
                // 修改继承的自由变量
                CLOSURE_MEMORY[parentClosureAddr].FreeEnv[symbol] = value;
                successFlag = true;
                break;
            }
            currentClosureAddr = CLOSURE_MEMORY[currentClosureAddr].parent;
        }
        if(!successFlag) {
            let lexEnvNodeAddr = searchContextAddr(symbol, contextAddr);
            if(lexEnvNodeAddr !== null) {
                value = evaluate(parentClosure, children[2], contextAddr);
                NODE_MEMORY[lexEnvNodeAddr].lexicalEnv[symbol] = value;
            }
            else{
                throw `未定义变量'${symbol}'`;
            }
        }

        return `#SET! ${symbol} to ${value}`;
    },
    'and': function(children, parentClosure, contextAddr) {
        // and短路求值
        for(let i = 1; i < children.length; i++) {
            if(evaluate(parentClosure, children[i], contextAddr) === '#f') {
                return '#f';
            }
        }
        return '#t';
    },
    'or': function(children, parentClosure, contextAddr) {
        // or短路求值
        for(let i = 1; i < children.length; i++) {
            if(evaluate(parentClosure, children[i], contextAddr) !== '#f') {
                return '#t';
            }
        }
        return '#f';
    },
    /*
    'not': function(children, parentClosure, contextAddr) {
        if(evaluate(parentClosure, children[1], contextAddr) === '#f') {
            return '#t';
        }
        else {
            return '#f';
        }
    },
    */
    'atom?': function(children, parentClosure, contextAddr) {
        let val = evaluate(parentClosure, children[1], contextAddr);
        let nodetype = TypeOf(val);
        if(nodetype === 'QUOTED_SYMBOL' || nodetype === 'BOOLEAN' || nodetype === 'STRING' || nodetype === 'NUMBER' || nodetype === 'VARIABLE') {
            return '#t';
        }
        else {
            return '#f';
        }

    },
    'type-of': function(children, parentClosure, contextAddr) {
        return `"${TypeOf(children[1])}"`;
    },
    'type-of-value': function(children, parentClosure, contextAddr) {
        let val = evaluate(parentClosure, children[1], contextAddr);
        return `"${TypeOf(val)}"`;
    },
    'match': function(children, parentClosure, contextAddr) {
        // 宏转换器的“命名空间”：用于实现卫生宏（暂未实现）
        let macroTransformerEnv = new Object();
        function addNewBound(macroVariable, nodeAddr, mtEnv) {
            // 重复匹配的重命名
            let renameCount = 0;
            macroVariable = macroVariable.replace(/\[\d+\]/gi, '');
            macroVariable = macroVariable + `[${renameCount}]`;
            while(macroVariable in mtEnv === true) {
                macroVariable = macroVariable.replace(/\[\d+\]/gi, '');
                macroVariable = macroVariable + `[${renameCount}]`;
                renameCount++;
            }
            // 插入绑定
            mtEnv[macroVariable] = nodeAddr;
        }

        // 模式匹配
        function matchPattern(pattern, test) {
            let typePattern = TypeOf(pattern);
            let typeTest = TypeOf(test);
            // 模式变量：将对应的test项提取出来，加入MT的命名空间
            if(typePattern === 'VARIABLE') {
                addNewBound(pattern, test, macroTransformerEnv);
                console.log(`宏模式变量 ${pattern} 匹配到：${nodeToString(test)}`);
                return true;
            }
            else if(typePattern === 'SLIST' && typeTest === 'SLIST' || typePattern === 'QUOTED_SLIST' && typeTest === 'QUOTED_SLIST') {
                let nodePattern = NODE_MEMORY[pattern];
                let nodeTest = NODE_MEMORY[test];

                let lastSubpattern = null;
                let patternCount = 0;
                for(let i = 0; i < nodeTest.children.length; i++) {
                    let currentSubpattern = nodePattern.children[patternCount];
                    if(currentSubpattern === '...') {
                        currentSubpattern = lastSubpattern;
                    }
                    else {
                        lastSubpattern = currentSubpattern;
                        patternCount++;
                    }

                    if(false === matchPattern(currentSubpattern, nodeTest.children[i])) {
                        return false;
                    }

                    // 不完全匹配也是匹配失败
                    if(i === nodeTest.children.length-1) {
                        if(nodePattern.children[patternCount] !== '...' && nodePattern.children[patternCount] !== undefined) {
                            console.warn(`不匹配：没有完全匹配`);
                            return false;
                        }
                    }
                }
                return true;
            }
            else if(typePattern === 'QUOTED_SYMBOL') {
                if(pattern !== test) {
                    console.warn(`不匹配：关键字不匹配`);
                    return false;
                }
                else {
                    return true;
                }
            }
            else {
                console.warn(`不匹配：其他情况`);
                return false;
            }
        }

        let res = matchPattern(children[1], children[2]);

        if(res) {
            console.log(macroTransformerEnv);
            STDOUT.push('---------------------------------\n');
            STDOUT.push('模式匹配结果：\n');
            for(let pvar in macroTransformerEnv) {
                let line = `  ${pvar}\t${nodeToString(macroTransformerEnv[pvar])}\n`;
                STDOUT.push(line);
            }
            STDOUT.push('---------------------------------\n\n');
            return '#t';
        }
        else {
            macroTransformerEnv = new Object();
            STDOUT.push('---------------------------------\n');
            STDOUT.push('模式匹配结果：\n');
            STDOUT.push('  匹配失败\n');
            STDOUT.push('---------------------------------\n');
            return '#f';
        }
    },
    'eval': function(children, parentClosure, contextAddr) {
        return '#NOT_IMPLEMENTED';
    },

    // 用于调试的
    'current-closure': function(children, parentClosure, contextAddr) {
        return parentClosure;
    },
};


const PRIMITIVE_FUNCTION = {
    // 基本算术运算
    '+':function(argv) {
        return argv.reduce((prev,current,i,a)=> { return prev + parseInt(current);}, 0).toString();
    },
    '*':function(argv) { // TODO 负数!!!侬脑子瓦特了吧
        // return argv.reduce((prev,current,i,a)=> { return bigIntMultiply(prev.toString(), current.toString());}, '1');
        return argv.reduce((prev,current,i,a)=> { return prev * parseInt(current);}, 1).toString();
    },
    '-':function(argv) {
        return argv.slice(1).reduce((prev,current,i,a)=> { return prev - parseInt(current);}, argv[0]).toString();
    },
    '/':function(argv) {
        return argv.slice(1).reduce((prev,current,i,a)=> { return prev / parseInt(current);}, argv[0]).toString();
    },
    '%':function(argv) {
        if(TypeOf(argv[0]) === 'NUMBER' && TypeOf(argv[1]) === 'NUMBER') {
            return (parseInt(argv[0]) % parseInt(argv[1])).toString();
        }
        else {
            throw `类型错误：应为 NUMBER * NUMBER → NUMBER`;
        }
    },

    // 算术谓词
    '=':function(argv) {
        return (parseInt(argv[0]) === parseInt(argv[1])) ? '#t' : '#f';
    },
    '>':function(argv) {
        return (parseInt(argv[0]) > parseInt(argv[1])) ? '#t' : '#f';
    },
    '<':function(argv) {
        return (parseInt(argv[0]) < parseInt(argv[1])) ? '#t' : '#f';
    },
    '>=':function(argv) {
        return (parseInt(argv[0]) >= parseInt(argv[1])) ? '#t' : '#f';
    },
    '<=':function(argv) {
        return (parseInt(argv[0]) <= parseInt(argv[1])) ? '#t' : '#f';
    },

    // 逻辑谓词（仅not，and和or是具有短路求值的特殊结构。其他逻辑运算暂不实现。）
    'not':function(argv) {
        return (argv[0] === '#f') ? '#t' : '#f';
    },

    // 符号谓词
    'eq?':function(argv) {
        return (argv[0] === argv[1]) ? '#t' : '#f';
    },
    'null?':function(argv) {
        let qlist = NODE_MEMORY[argv[0]];
        if(qlist instanceof SList) {
            return (qlist.children.length === 0) ? '#t' : '#f';
        }
        else {
            return '#f';
        }
    },
    'number?':function(argv) {
        return (TypeOf(argv[0]) === 'NUMBER') ? '#t' : '#f';
    },

    // 列表操作
    'car':function(argv) {
        let qlist = NODE_MEMORY[argv[0]];
        return qlist.children[0];
    },
    'cdr':function(argv) {
        let qlist = NODE_MEMORY[argv[0]];
        // 新增AST节点，作为结果列表。其父节点为操作数列表（意味着结果node是op node的子列表），但是父节点的children列表中没有它。
        let currentAddr = allocateNodeAddr();//NODE_MEMORY_POINTER;
        let slist = new SList(true, currentAddr, argv[0]);
        NODE_MEMORY[currentAddr] = slist;
        // NODE_MEMORY_POINTER++;
        slist.children = qlist.children.slice(1);
        return parseInt(currentAddr);

    },
    'cons':function(argv) {
        let elem = argv[0];
        let qlist = NODE_MEMORY[argv[1]];
        // 新增AST节点，作为结果列表。其父节点为操作数列表，表示新列表是由旧列表cons而来的。
        let currentAddr = allocateNodeAddr();//NODE_MEMORY_POINTER;
        let slist = new SList(true, currentAddr, argv[1]);
        NODE_MEMORY[currentAddr] = slist;
        // NODE_MEMORY_POINTER++;
        slist.children = qlist.children.slice(0);
        slist.children.unshift(elem);
        return parseInt(currentAddr);
    },

    // 字符串操作
    // STRING → NUMBER
    'strlen': function(argv) {
        if(TypeOf(argv[0]) === 'STRING') {
            return (argv[0].length - 2).toString();
        }
        else {
            throw `类型错误：应为 STRING → NUMBER`;
        }
    },
    // STRING * NUMBER → STRING（单个字符）
    'charat': function(argv) {
        if(TypeOf(argv[0]) === 'STRING' && TypeOf(argv[1]) === 'NUMBER') {
            return (argv[0].substring(1, argv[0].length-1))[argv[1]].toString();
        }
        else {
            throw `类型错误：应为 STRING * NUMBER → STRING（单个字符）`;
        }
    },
    // STRING * STRING → STRING
    'strcat': function(argv) {
        if(TypeOf(argv[0]) === 'STRING' && TypeOf(argv[1]) === 'STRING') {
            let str1 = argv[0].substring(1, argv[0].length-1);
            let str2 = argv[1].substring(1, argv[1].length-1);
            return ('"' + str1.toString() + str2.toString() + '"');
        }
        else {
            throw `类型错误：应为 STRING * STRING → STRING`;
        }
    },
    // NUMBER → STRING
    'ascii-to-char': function(argv) {
        if(TypeOf(argv[0]) === 'NUMBER') {
            let charcode = parseInt(argv[0]);
            return String.fromCharCode(charcode);
        }
        else {
            throw `类型错误：应为 NUMBER → STRING`;
        }
    },
    // STRING(第一个字符) → NUMBER
    'char-to-ascii': function(argv) {
        if(TypeOf(argv[0]) === 'STRING') {
            return (argv[0].charCodeAt(0)).toString();
        }
        else {
            throw `类型错误：应为 STRING(第一个字符) → NUMBER`;
        }
    },

    // I/O
    'display':function(argv) {
        let output = nodeToString(argv[0]);
        if(TypeOf(output) === 'STRING') {
            output = output.substring(1, output.length-1);
        }
        STDOUT.push(output);
        return `#display:${output}`;
    },
    'newline':function(argv) {
        STDOUT.push('\n');
        return `#newline`;
    },

    // begin
    'begin':function(argv) {
        return argv[argv.length - 1];
    },
};







/********************************************
 *
 *          执行核心（Eval/Apply循环）
 *
 ********************************************/


// 20190112 试图将Eval-Apply循环化递归为循环
// 测试用例：只含有乘法和加法的、没有最外层闭包的简单前缀数学表达式。例如(+ (* 3 3) (* 4 4))
// 【框架】
// 1、从栈顶取一个节点，判断它的类型。
// 2、如果是SLIST，首先看它有没有为自己的子节点分配过地址。
//      如果没有分配过地址，那么就给子节点分配地址，保存在自己的栈帧中，随后构造子节点栈帧，倒着压栈。
//      如果有分配地址，这意味着子节点已经求值完成，此时需要做apply，然后把结果写回自己的返回地址。
// 20190113 加入对闭包（另起炉灶）和字面lambda的支持；简单的call/cc
// 20190114 完善词法作用域，实现define、if两个特殊结构，可实现递归
// 20190115 完善词法作用域，实现set!、and、or特殊结构
// 20190117 基本上纠正了词法作用域的错误实现，实现cond特殊结构
// 20190118 完善闭包寻址和地址表示机制；修复符号对SLIST引用的问题；修复set!在CPS阶乘闭包内调用的问题
// 20190122 修正栈帧压栈顺序的错误；完善call/cc实现，阴阳谜题用例通过

function MainLoop(config) {
    var config = config || {
        entryNodeAddr: 0,
        firstStackAddr: 0,
        firstClosureAddr: "#C-1",
        firstContinuationAddr: "#K-1",
        DEBUG: true,
        MAX_TICK_NUM: 10000000,
        MAX_CONTINUATION_NUM: 500,
        MAX_STACKFRAME_NUM: 10000,
    };

    console.log(`自定义解释器参数：`);
    console.log(config);

    const entryNodeAddr = config.entryNodeAddr || 0;
    const firstStackAddr = config.firstStackAddr || 0;
    const firstClosureAddr = config.firstClosureAddr || "#C-1";
    const firstContinuationAddr = config.firstContinuationAddr || "#K-1";
    const DEBUG = config.DEBUG || true;
    const MAX_TICK_NUM = config.MAX_TICK_NUM || 10000000;
    const MAX_CONTINUATION_NUM = config.MAX_CONTINUATION_NUM || 500;
    const MAX_STACKFRAME_NUM = config.MAX_STACKFRAME_NUM || 10000;

    ///////////////////
    // 调试输出
    ///////////////////
    function debug(x) {
        if(!DEBUG) {return;}
        else if(typeof x === 'object') { console.table(x); }
        else { console.log(x);}
    }

    ///////////////////
    // 机器全局状态
    ///////////////////
    var STACK = new Array();

    var stackAddr = firstStackAddr; // 用来模拟栈空间的地址
    var RESULTS = new Array(); // 栈空间地址-求得的值

    var CLOSURES = new Array();
    var CLOSURE_ADDR = firstClosureAddr;

    var CONTINUATIONS = new Array();
    var CONTINUATION_ADDR = firstContinuationAddr;

    var WDTCounter = 0; // 看门狗

    ///////////////////
    // 运行时栈管理
    ///////////////////
    
    // 分配一个栈空间地址，每次分配都会递增，保证每次分配的都不一样
    function newStackAddr() {
        return (stackAddr++);
    }
    // 顶级栈帧
    STACK.push({
        addr: entryNodeAddr,
        childrenRetAddr: null,
        retAddr: firstStackAddr,
        closure: firstClosureAddr,
        visited: false,
    });

    // 子节点压栈（只需要currentStackFrame一个参数）
    // 返回各个子节点的返回地址
    function pushAllChildren(currentStackFrame, children) {
        // 每个子节点分配一个栈空间地址，得到结果后，就存在各自栈空间地址对应的位置上，模拟函数返回
        let childra = new Array();
        for(let i = 0; i < children.length; i++) {
            childra[i] = newStackAddr();
        }
        currentStackFrame.childrenRetAddr = childra;
        // 子节点压栈，倒着压栈
        for(let i = children.length - 1; i >= 0; i--) {
            let child = children[i];
            let childRetAddr = (currentStackFrame.childrenRetAddr)[i];
            let nodeType = TypeOf(child);
            // 字面值不压栈，直接返回
            if( child in PRIMITIVE_FUNCTION ||
                nodeType === 'BOOLEAN' || nodeType === 'NUMBER' || nodeType === 'STRING' || nodeType === 'QUOTED_SYMBOL') {
                RESULTS[childRetAddr] = child;
            }
            else {
                STACK.push({
                    addr: child,
                    contextAddr: currentStackFrame.addr,
                    retAddr: childRetAddr,
                    childrenRetAddr: null,
                    closure: currentStackFrame.closure,
                });
            }
        }
        return childra;
    }

    ///////////////////
    // 闭包管理
    ///////////////////
    // 20190115 在Lambda节点上登记闭包，这样每个Lambda节点都知道自己和自己统辖的作用域内产生了哪些闭包（供set!使用）
    function registerClosureOnLambda(closureAddr, lambdaAddr) {
        if(!('closures' in NODE_MEMORY[lambdaAddr])) { // TODO 检查节点类型
            NODE_MEMORY[lambdaAddr]['closures'] = new Array();
        }
        NODE_MEMORY[lambdaAddr]['closures'].push(closureAddr);
    }
    // 新建一个闭包，并返回其地址
    function newClosure(_lambda, _parentClosure, _parameters, lexicalUpvalues) {
        let newAddrNumber = parseInt(CLOSURE_ADDR.substring(2)) + 1;
        CLOSURE_ADDR = `#C${newAddrNumber}`;
        registerClosureOnLambda(CLOSURE_ADDR, _lambda);
        CLOSURES[newAddrNumber] = {
            lambda: _lambda,
            body: NODE_MEMORY[_lambda].body,
            parentClosure: _parentClosure,
            parameters: _parameters,
            upvalues: lexicalUpvalues,
        };
        return CLOSURE_ADDR;
    }
    // 从内存中获取闭包
    function getClosure(closureAddr) {
        let addr = parseInt(closureAddr.substring(2));
        return CLOSURES[addr];
    }
    // 从闭包地址获取闭包下标
    function getClosureIndex(closureAddr) {
        return parseInt(closureAddr.substring(2));
    }


    ///////////////////
    // Continuation管理
    ///////////////////
    // 新建一个Continuation，并返回其地址
    function captureCurrentContinuation(_holeAddr) {
        let newContAddrNumber = parseInt(CONTINUATION_ADDR.substring(2)) + 1;
        CONTINUATION_ADDR = `#K${newContAddrNumber}`;
        CONTINUATIONS[newContAddrNumber] = {
            stack: JSON.stringify(STACK), // 保存当前的栈（这里可能需要深复制，暂且用JSON代替）
            stackaddr: stackAddr,
            results: JSON.stringify(RESULTS),
            closureaddr: CLOSURE_ADDR,
            closures: JSON.stringify(CLOSURES),

            holeAddr: _holeAddr, // 执行这个Continuation时，应从哪个地址取值
        };
        return CONTINUATION_ADDR;
    }
    // 从Continuation地址获取下标
    function getContinuationIndex(contAddr) {
        return parseInt(contAddr.substring(2));
    }
    // 从内存中获取Continuation
    function getContinuation(contAddr) {
        let addr = parseInt(contAddr.substring(2));
        return CONTINUATIONS[addr];
    }
    function loadContinuation(contAddr) {
        let cont = CONTINUATIONS[getContinuationIndex(contAddr)];
        STACK = JSON.parse(cont.stack);
        // stackAddr = cont.stackaddr;
        RESULTS = JSON.parse(cont.results);
        // CLOSURE_ADDR = cont.closureaddr;
        // CLOSURES = JSON.parse(cont.closures);
    }







    while(STACK.length > 0) {
        // 爆栈退出
        if(CONTINUATIONS.length >= MAX_CONTINUATION_NUM) {
            throw `[ERROR] Continuation过多，终止`;
        }

        // 爆栈退出
        if(STACK.length >= MAX_STACKFRAME_NUM) {
            throw `[ERROR] 执行栈溢出，终止`;
        }

        if(DEBUG) {
            WDTCounter++;
            if(WDTCounter >= MAX_TICK_NUM) {
                throw `[ERROR] 计算超时，终止`;
            }
        }

        // 取栈顶节点
        let currentStackFrame = STACK.top();

        // debug(`[MainLoop] 当前栈帧：${JSON.stringify(currentStackFrame)}`);

        // 判断类型并求值
        let type = TypeOf(currentStackFrame.addr);
        let node = null;
        if(type === 'SLIST') {
            node = NODE_MEMORY[currentStackFrame.addr];
            let children = node.children;

            // Lambda函数调用归来
            if(currentStackFrame.waitingFor !== undefined && currentStackFrame.waitingFor !== null) {
                RESULTS[currentStackFrame.retAddr] = RESULTS[currentStackFrame.waitingFor];
                STACK.pop();
            }
            // 处理set!节点children[2]求值归来，开始执行set!逻辑
            else if(currentStackFrame.waitingSET === true) {
                let symbol = children[1];
                let value = RESULTS[currentStackFrame.retAddr];






                // 沿闭包链向上（含自身），但是只修改闭包链上的词法上级节点。
                // 20190118 修正：父闭包（除变量定义所在的闭包）的兄弟节点也需要修改。
                // TODO 这块太低效了，可以考虑优化
                // 修改到upvalue不要停，因为它只是自由变量。只有修改到约束变量，才意味着修改到了根源，可以停止。
                let setFlag = false; // 用于标记set动作是否执行过。如果最终为false，意味着symbol未定义。
                let currentClosureAddr = currentStackFrame.closure;
                let lambdaAddr = getClosure(currentClosureAddr).lambda;
                while(getClosureIndex(currentClosureAddr) >= getClosureIndex(firstClosureAddr) && getClosureIndex(currentClosureAddr) in CLOSURES) {
                    let closure = getClosure(currentClosureAddr);
                    let closureLambdaAddr = closure.lambda;
                    if(isInherit(lambdaAddr, closureLambdaAddr) === true) {
                        if(symbol in closure.parameters) {
                            (closure.parameters)[symbol] = value;
                            setFlag = true;
                            break;
                        }
                        if(symbol in closure.upvalues) {
                            (closure.upvalues)[symbol] = value;
                        }
                        // 修改兄弟闭包
                        for(let i = 0; i < CLOSURES.length; i++) {
                            let c = CLOSURES[i];
                            if(c.parentClosure === closure.parentClosure && isInherit(lambdaAddr, c.lambda)) {
                                if(symbol in c.upvalues) {
                                    (c.upvalues)[symbol] = value;
                                }
                            }
                        }
                    }
                    currentClosureAddr = closure.parentClosure;
                }






                if(!setFlag) {
                    console.warn(`[WARN] SET! 变量'${symbol}'未定义，因此没有执行赋值操作。`);
                }

                // 返回值
                let result = `#SET!:${symbol}=${value}`;

                RESULTS[currentStackFrame.retAddr] = result;
                STACK.pop();

            }
            // 处理IF节点条件求值归来
            else if(currentStackFrame.waitingTestIF === true) {
                let test = RESULTS[currentStackFrame.retAddr];
                let child = children[2];
                if(test !== '#f') {
                    child = children[2];
                }
                else {
                    child = children[3];
                }

                // 避免对字面值压栈
                let childType = TypeOf(child);
                if( child in PRIMITIVE_FUNCTION ||
                    childType === 'BOOLEAN' || childType === 'NUMBER' || childType === 'STRING' || childType === 'QUOTED_SYMBOL') {
                    RESULTS[currentStackFrame.retAddr] = child;
                    STACK.pop(); // 先把自己pop掉，防止死循环。因为结果的返回地址就是if表达式的地址。下pop同。
                }
                else {
                    STACK.pop();
                    STACK.push({
                        addr: child,
                        contextAddr: currentStackFrame.addr,
                        retAddr: currentStackFrame.retAddr,
                        childrenRetAddr: null,
                        closure: currentStackFrame.closure,
                    });
                }
            }

            // 处理COND节点条件求值归来
            else if(currentStackFrame.waitingTestCOND === true) {
                let test = RESULTS[currentStackFrame.retAddr];
                let branchIndex = currentStackFrame.CONDbranch; // 第几个分支
                // 当前分支测试通过（含else），则将此分支压栈，结束cond求值
                if(test !== '#f') {
                    let child = (NODE_MEMORY[children[branchIndex]].children)[1];
                    // 避免对字面值压栈
                    let childType = TypeOf(child);
                    if( child in PRIMITIVE_FUNCTION ||
                        childType === 'BOOLEAN' || childType === 'NUMBER' || childType === 'STRING' || childType === 'QUOTED_SYMBOL') {
                        RESULTS[currentStackFrame.retAddr] = child;
                        STACK.pop(); // 先把自己pop掉，防止死循环。因为结果的返回地址就是if表达式的地址。下pop同。
                    }
                    else {
                        STACK.pop();
                        STACK.push({
                            addr: child,
                            contextAddr: currentStackFrame.addr,
                            retAddr: currentStackFrame.retAddr,
                            childrenRetAddr: null,
                            closure: currentStackFrame.closure,
                        });
                    }
                }
                // 当前分支测试不通过，则下一个条件压栈，自己不退栈，修改自己的分支数，继续测试
                else {
                    currentStackFrame.CONDbranch = branchIndex+1;

                    // 第(branchIndex+1)个条件压栈
                    let retAddr = currentStackFrame.retAddr;
                    if(children[branchIndex+1] === undefined) { // 没有能够满足条件的分支，则返回#f
                        RESULTS[currentStackFrame.retAddr] = '#f';
                        STACK.pop();
                    }
                    else {
                        let test = (NODE_MEMORY[children[branchIndex+1]].children)[0];
                        // 避免对字面值压栈
                        let testType = TypeOf(test);
                        if(testType === 'BOOLEAN' || testType === 'NUMBER' || testType === 'STRING' || testType === 'QUOTED_SYMBOL') {
                            RESULTS[retAddr] = test;
                        }
                        else {
                            STACK.push({
                                addr: test,
                                contextAddr: currentStackFrame.addr,
                                retAddr: currentStackFrame.retAddr,
                                childrenRetAddr: null,
                                closure: currentStackFrame.closure,
                            });
                        }
                    }
                }
            } // cond结束

            // 处理WHILE循环
            else if(currentStackFrame.waitingWHILE === true) {
                let test = RESULTS[currentStackFrame.whileTestRetAddr]; // 取出循环条件的值

                // 循环测试不通过，循环终止
                // 循环体的求值结果已经指向自身的retAddr了，因此这里无需处理，仅退栈即可。
                if(test === '#f') {
                    STACK.pop();
                }
                // 循环测试通过，则先压栈条件，再压栈循环体，自己不退栈
                else {
                    // 条件压栈
                    let testRetAddr = currentStackFrame.whileTestRetAddr; // 循环体求值结果指向自己
                    let test = children[1];
                    // 避免对字面值压栈
                    let testType = TypeOf(test);
                    if(testType === 'BOOLEAN' || testType === 'NUMBER' || testType === 'STRING' || testType === 'QUOTED_SYMBOL') {
                        RESULTS[testRetAddr] = test;
                    }
                    else {
                        STACK.push({
                            addr: test,
                            contextAddr: currentStackFrame.addr,
                            retAddr: testRetAddr,
                            childrenRetAddr: null,
                            closure: currentStackFrame.closure,
                        });
                    }

                    // 循环体压栈
                    let iterBodyRetAddr = currentStackFrame.retAddr; // 循环体求值结果指向自己
                    let iterbody = children[2];
                    // 避免对字面值压栈
                    let iterbodyType = TypeOf(iterbody);
                    if(iterbodyType === 'BOOLEAN' || iterbodyType === 'NUMBER' || iterbodyType === 'STRING' || iterbodyType === 'QUOTED_SYMBOL') {
                        RESULTS[iterBodyRetAddr] = iterbody;
                    }
                    else {
                        STACK.push({
                            addr: iterbody,
                            contextAddr: currentStackFrame.addr,
                            retAddr: iterBodyRetAddr,
                            childrenRetAddr: null,
                            closure: currentStackFrame.closure,
                        });
                    }
                }
            } // while结束


            // 处理and和or两个短路求值的内置过程
            else if(currentStackFrame.waitingAND === true) {
                let first = RESULTS[currentStackFrame.retAddr];
                if(first === '#f') { // 如果第1个参数为假，那么就不需要求值第2个参数了，直接返回#f
                    let result = `#f`;
                    RESULTS[currentStackFrame.retAddr] = result;
                    STACK.pop();
                }
                // 否则，将第二个参数压栈，以其结果为值
                else {
                    let child = children[2];
                    // 避免对字面值压栈
                    let childType = TypeOf(child);
                    if( child in PRIMITIVE_FUNCTION ||
                        childType === 'BOOLEAN' || childType === 'NUMBER' || childType === 'STRING' || childType === 'QUOTED_SYMBOL') {
                        RESULTS[currentStackFrame.retAddr] = child;
                        STACK.pop(); // 先把自己pop掉，防止死循环。因为结果的返回地址就是and表达式的地址。下pop同。
                    }
                    else {
                        STACK.pop();
                        STACK.push({
                            addr: child,
                            contextAddr: currentStackFrame.addr,
                            retAddr: currentStackFrame.retAddr,
                            childrenRetAddr: null,
                            closure: currentStackFrame.closure,
                        });
                    }
                }
            }
            else if(currentStackFrame.waitingOR === true) {
                let first = RESULTS[currentStackFrame.retAddr];
                if(first !== '#f') { // 如果第1个参数不为假，那么就不需要求值第2个参数了，直接返回第一个参数
                    let result = first;
                    RESULTS[currentStackFrame.retAddr] = result;
                    STACK.pop();
                }
                // 否则，将第二个参数压栈，以其结果为值
                else {
                    let child = children[2];
                    // 避免对字面值压栈
                    let childType = TypeOf(child);
                    if( child in PRIMITIVE_FUNCTION ||
                        childType === 'BOOLEAN' || childType === 'NUMBER' || childType === 'STRING' || childType === 'QUOTED_SYMBOL') {
                        RESULTS[currentStackFrame.retAddr] = child;
                        STACK.pop(); // 先把自己pop掉，防止死循环。因为结果的返回地址就是or表达式的地址。下pop同。
                    }
                    else {
                        STACK.pop();
                        STACK.push({
                            addr: child,
                            contextAddr: currentStackFrame.addr,
                            retAddr: currentStackFrame.retAddr,
                            childrenRetAddr: null,
                            closure: currentStackFrame.closure,
                        });
                    }
                }
            }

            // 处理call/cc的call环节
            else if(currentStackFrame.waitingCALLCC === true) {
                let continuationAddr = currentStackFrame.continuationAddr;

                let closureAddr = RESULTS[currentStackFrame.callccArgClosureAddr];
                let closure = getClosure(closureAddr);
                // beta代换
                let currentVar = (NODE_MEMORY[closure.lambda].parameters)[0];
                (closure.parameters)[currentVar] = continuationAddr;

                // 将Body入栈
                // 考虑Body为简单值的情况：直接返回，不要入栈
                let bodyType = TypeOf(closure.body);
                if(closure.body in PRIMITIVE_FUNCTION || bodyType === 'BOOLEAN' || bodyType === 'NUMBER' || bodyType === 'STRING' || bodyType === 'QUOTED_SYMBOL') {
                    RESULTS[currentStackFrame.retAddr] = closure.body;
                    STACK.pop();
                }
                else {
                    let bodyRetAddr = newStackAddr(); // Body求得的值放在这里
                    STACK.push({
                        addr: closure.body,
                        contextAddr: currentStackFrame.addr,
                        retAddr: bodyRetAddr,
                        childrenRetAddr: null,
                        closure: closureAddr, // 所在闭包
                    });
                    // SLIST的栈帧加上“waitingFor”属性
                    currentStackFrame.waitingFor = bodyRetAddr;
                }

            }

            // 子节点尚未被求值，则子节点入栈
            else if(currentStackFrame.childrenRetAddr === null) {
                //////////////////
                // 处理特殊形式
                //////////////////

                // 变量定义
                if(children[0] === 'define') {
                    // 注意：每一项都不可eval，保持原形
                    let symbol = children[1];
                    let target = children[2];

                    // 修改当前所在闭包的相应绑定
                    let closure = getClosure(currentStackFrame.closure);
                    // 修改约束变量（局部变量）
                    // 这里的行为与JS的let是非常相似的（而不是var，并没有变量提升）
                    (closure.parameters)[symbol] = target;

                    // 201900118 为当前lambda节点增加参数
                    NODE_MEMORY[closure.lambda].parameters.push(symbol);

                    // 直接返回值
                    let result = `#DEFINE:${symbol}=${target}`;
                    RESULTS[currentStackFrame.retAddr] = result;
                    STACK.pop();
                }

                // 20190115 set!行为
                else if(children[0] === 'set!') {
                    currentStackFrame.waitingSET = true;

                    // 这里仅将第3个子节点压栈求值，求出值后，副作用在上面的waitingSET===true分支中处理
                    let retAddr = currentStackFrame.retAddr;
                    let test = children[2];
                    // 避免对字面值压栈
                    let testType = TypeOf(test);
                    if(testType === 'BOOLEAN' || testType === 'NUMBER' || testType === 'STRING' || testType === 'QUOTED_SYMBOL') {
                        RESULTS[retAddr] = test;
                    }
                    else {
                        STACK.push({
                            addr: test,
                            contextAddr: currentStackFrame.addr,
                            retAddr: currentStackFrame.retAddr,
                            childrenRetAddr: null,
                            closure: currentStackFrame.closure,
                        });
                    }
                }

                // IF分支
                // 首先让条件入栈、计算，并标记自身为“waitingTestIF”，带着结果回来的时候，再根据返回值选择一个子节点入栈
                else if(children[0] === 'if') {
                    currentStackFrame.waitingTestIF = true;

                    // 子节点压栈
                    let retAddr = currentStackFrame.retAddr;
                    let test = children[1];
                    // 避免对字面值压栈
                    let testType = TypeOf(test);
                    if(testType === 'BOOLEAN' || testType === 'NUMBER' || testType === 'STRING' || testType === 'QUOTED_SYMBOL') {
                        RESULTS[retAddr] = test;
                    }
                    else {
                        STACK.push({
                            addr: test,
                            contextAddr: currentStackFrame.addr,
                            retAddr: currentStackFrame.retAddr,
                            childrenRetAddr: null,
                            closure: currentStackFrame.closure,
                        });
                    }
                }

                // COND语法糖
                // 这里只压栈第一个条件，后续步骤在上面处理
                else if(children[0] === 'cond') {
                    currentStackFrame.waitingTestCOND = true;
                    currentStackFrame.CONDbranch = 1; // 用来标记当前看到的是第几个分支（从1开始，因为第一个分支恰好是下标为1的子节点）

                    // 第一个条件压栈
                    let retAddr = currentStackFrame.retAddr;
                    let test = (NODE_MEMORY[children[1]].children)[0];
                    // 避免对字面值压栈
                    let testType = TypeOf(test);
                    if(testType === 'BOOLEAN' || testType === 'NUMBER' || testType === 'STRING' || testType === 'QUOTED_SYMBOL') {
                        RESULTS[retAddr] = test;
                    }
                    else {
                        STACK.push({
                            addr: test,
                            contextAddr: currentStackFrame.addr,
                            retAddr: currentStackFrame.retAddr,
                            childrenRetAddr: null,
                            closure: currentStackFrame.closure,
                        });
                    }
                }

                // WHILE语法糖（解释器改用栈实现之后，while就是语法糖了）
                // 这里只压栈test，后续步骤在上面处理
                else if(children[0] === 'while') {
                    currentStackFrame.waitingWHILE = true;
                    currentStackFrame.whileTestRetAddr = newStackAddr(); // 测试值返回于此
                    // 循环条件压栈
                    let retAddr = currentStackFrame.retAddr;
                    let test = children[1];
                    // 避免对字面值压栈
                    let testType = TypeOf(test);
                    if(testType === 'BOOLEAN' || testType === 'NUMBER' || testType === 'STRING' || testType === 'QUOTED_SYMBOL') {
                        RESULTS[retAddr] = test;
                    }
                    else {
                        STACK.push({
                            addr: test,
                            contextAddr: currentStackFrame.addr,
                            retAddr: currentStackFrame.whileTestRetAddr, // 测试值返回于此
                            childrenRetAddr: null,
                            closure: currentStackFrame.closure,
                        });
                    }
                    // 设置循环结构的初始返回值（#f），对应落地成盒的情况。如果至少有一次循环，则此值将被修改。
                    RESULTS[currentStackFrame.retAddr] = '#f';
                }

                // AND短路求值
                // 只入栈第一个参数，并标记自身为“waitingAND”
                else if(children[0] === 'and') {
                    currentStackFrame.waitingAND = true;

                    // 子节点压栈
                    let retAddr = currentStackFrame.retAddr;
                    let test = children[1];
                    // 最激进的短路计算：第一个参数直接就是#f
                    if(test === '#f') {
                        let result = `#f`;
                        RESULTS[currentStackFrame.retAddr] = result;
                        STACK.pop();
                    }
                    else {
                        // 避免对字面值压栈
                        let testType = TypeOf(test);
                        if(testType === 'BOOLEAN' || testType === 'NUMBER' || testType === 'STRING' || testType === 'QUOTED_SYMBOL') {
                            RESULTS[retAddr] = test;
                        }
                        else {
                            STACK.push({
                                addr: test,
                                contextAddr: currentStackFrame.addr,
                                retAddr: currentStackFrame.retAddr,
                                childrenRetAddr: null,
                                closure: currentStackFrame.closure,
                            });
                        }
                    }
                }

                // OR短路求值
                // 只入栈第一个参数，并标记自身为“waitingOR”
                else if(children[0] === 'or') {
                    currentStackFrame.waitingOR = true;

                    // 子节点压栈
                    let retAddr = currentStackFrame.retAddr;
                    let test = children[1];
                    // 避免对字面值压栈
                    let testType = TypeOf(test);
                    if(testType === 'BOOLEAN' || testType === 'NUMBER' || testType === 'STRING' || testType === 'QUOTED_SYMBOL') {
                        RESULTS[retAddr] = test;
                    }
                    else {
                        STACK.push({
                            addr: test,
                            contextAddr: currentStackFrame.addr,
                            retAddr: currentStackFrame.retAddr,
                            childrenRetAddr: null,
                            closure: currentStackFrame.closure,
                        });
                    }
                }

                // 尝试实现call/cc
                // 形式(call/cc (...含有固定符号RETURN的表达式...))，例如(+ 1 (call/cc (* 2 (RETURN 3))))应等于(+ 1 3)等于4
                // 效果上应等同于Scheme的(call/cc (lambda (RETURN) (RETURN value)))
                else if(children[0] === 'call/cc') { // 保存（序列化）当前Continuation

                    /////////////////////////////////////////////////////////////////////
                    // 捕获Continuation
                    currentStackFrame.waitingCALLCC = true;
                    let continuationAddr = captureCurrentContinuation(currentStackFrame.retAddr); // 这显然是一个跳转
                    currentStackFrame.continuationAddr = continuationAddr;
                    // 然后将参数Lambda压栈
                    //////////////////////////////////////////////////////////////////////

                    // 作为call/cc参数的单参Lambda
                    let callccArgNodeAddr = children[1];
                    // 保存call/cc参数的那个闭包
                    let callccArgRetAddr = newStackAddr();
                    currentStackFrame.callccArgClosureAddr = callccArgRetAddr;
                    if(TypeOf(callccArgNodeAddr) === 'LAMBDA') {
                        STACK.push({
                            addr: callccArgNodeAddr,
                            contextAddr: currentStackFrame.addr,
                            retAddr: callccArgRetAddr,
                            closure: currentStackFrame.closure,
                        });
                    }
                    else {
                        throw `[ERROR] call/cc的参数不是单参数函数。`;
                    }

                }
                else if(children[0] === 'RETURN') {
                    pushAllChildren(currentStackFrame, children);
                }

                // 非特殊形式
                else {
                    pushAllChildren(currentStackFrame, children);
                }
            }
            // 子节点已经被求值，也就是说，目前的栈帧该apply并pop了
            else {
                //////////////////
                // 处理特殊形式，这块非常灵活，需要更多考虑
                //////////////////

                // 取出RESULTS中已经求值的子节点的值
                let func = RESULTS[(currentStackFrame.childrenRetAddr)[0]];
                let args = new Array();
                for(let i = 1; i < (currentStackFrame.childrenRetAddr).length; i++) {
                    args.push(RESULTS[(currentStackFrame.childrenRetAddr)[i]]);
                }

                // Primitive
                if(func in PRIMITIVE_FUNCTION) {
                    let result = PRIMITIVE_FUNCTION[func](args);
                    RESULTS[currentStackFrame.retAddr] = result;
                    STACK.pop();
                }
                // 一等Continuation
                else if(TypeOf(func) === 'CONTINUATION') {
                    let contAddr = func;
                    debug(`[INFO] 载入Continuation`);
                    loadContinuation(contAddr);
                    RESULTS[getContinuation(contAddr).holeAddr] = args[0];
                    STACK.pop(); // 将call/cc栈帧pop掉
                }
                // 闭包（Lambda函数）
                else if(TypeOf(func) === 'CLOSURE') { // 实际上是（作为返回值的）闭包的地址
                    let closureAddr = func;
                    let closure = getClosure(closureAddr);
                    // beta代换
                    // 注意：同时代换闭包的parameter（bound）和AST上的词法绑定
                    for(let i = 0; i < args.length; i++) {
                        let currentVar = NODE_MEMORY[closure.lambda].parameters[i];
                        (closure.parameters)[currentVar] = args[i];
                        // (NODE_MEMORY[closure.lambda].lexicalEnv)[currentVar] = args[i];
                    }

                    // 将Body入栈
                    // 考虑Body为简单值的情况：直接返回，不要入栈
                    let bodyType = TypeOf(closure.body);
                    if(closure.body in PRIMITIVE_FUNCTION || bodyType === 'BOOLEAN' || bodyType === 'NUMBER' || bodyType === 'STRING' || bodyType === 'QUOTED_SYMBOL') {
                        RESULTS[currentStackFrame.retAddr] = closure.body;
                        STACK.pop();
                    }
                    else {
                        let bodyRetAddr = newStackAddr(); // Body求得的值放在这里
                        STACK.push({
                            addr: closure.body,
                            contextAddr: currentStackFrame.addr,
                            retAddr: bodyRetAddr,
                            childrenRetAddr: null,
                            closure: closureAddr, // 所在闭包
                        });
                        // SLIST的栈帧加上“waitingFor”属性
                        currentStackFrame.waitingFor = bodyRetAddr;
                    }
                }
            }
        }
        // Lambda节点与立即值一样，立刻创建新闭包（出现在define的Lambda除外，因为根本走不到这一步）
        else if(type === 'LAMBDA') {
            node = NODE_MEMORY[currentStackFrame.addr];
            let parameters = new Object();
            for(let v of node.parameters) {
                parameters[v] = null;
            }

            // 构建新闭包
            // 20190117
            // 创建新闭包时，继承upvalue绑定的来源是：①前序闭包链上最近的；②对应Lambda节点是待创建的新闭包的Lambda节点的词法上级节点。
            // 条件②保证词法作用域特性，条件①保证词法上级节点的绑定是最新、最近的。
            // 由于根闭包是一切闭包的终极父闭包和一切词法节点的终极父节点，所以本过程可以保证新闭包至少继承到根闭包的环境，而不会什么都没有继承。
            // 也就是说，以往的实现其实是（部分）正确的，只是当时没有想清楚其所以然。
            let upvalues = new Object();
            let currentClosureAddr = currentStackFrame.closure;
            while(getClosureIndex(currentClosureAddr) >= getClosureIndex(firstClosureAddr) && getClosureIndex(currentClosureAddr) in CLOSURES) {
                let closure = getClosure(currentClosureAddr);
                let closureLambdaAddr = closure.lambda;
                if(isInherit(currentStackFrame.addr, closureLambdaAddr) === true) {
                    // 继承此词法上级闭包内的约束变量（优先级高）和自由变量
                    for(let v in closure.upvalues) {
                        upvalues[v] = (closure.upvalues)[v];
                    }
                    for(let v in closure.parameters) {
                        upvalues[v] = (closure.parameters)[v];
                    }
                    break;
                }
                currentClosureAddr = closure.parentClosure;
            }

            // 创建新闭包（已保存了upvalue的）
            let closureAddr = newClosure(currentStackFrame.addr, currentStackFrame.closure, parameters, upvalues);
            RESULTS[currentStackFrame.retAddr] = closureAddr;
            STACK.pop();
        }
        // 字面值
        // 尽管大多数情况下，字面值是直接返回不入栈的，但是对于Lambda.body是单个符号或者数字的情况，还是要处理一下
        else if(type === 'BOOLEAN' || type === 'NUMBER' || type === 'STRING' || type === 'QUOTED_SYMBOL') {
            RESULTS[currentStackFrame.retAddr] = currentStackFrame.addr;
            STACK.pop();
        }

        // 变量（含基本运算符）解引用
        else if(type === 'VARIABLE') {
            let variable = currentStackFrame.addr;
            // 处理特殊符号和运算符
            if(variable === 'call/cc' || variable === 'else' || variable in PRIMITIVE_FUNCTION) {
                RESULTS[currentStackFrame.retAddr] = variable;
                STACK.pop();
                continue;
            }

            let value = '#UNDEFINED';
            let closure = getClosure(currentStackFrame.closure);
            // 先解析闭包内部的约束变量（局部变量）
            if(variable in closure.parameters) {
                value = (closure.parameters)[variable];
            }
            // 再解析闭包内部的upvalue（自由变量）
            else if(variable in closure.upvalues) {
                value = (closure.upvalues)[variable];
            }
            // TODO 要不要解析语法树节点上的环境？不要。
            // 什么都没找到，抛出错误
            else {
                throw `[ERROR] 变量‘${variable}’未定义。`;
            }

            RESULTS[currentStackFrame.retAddr] = value;
            STACK.pop();
            // 如果解引用的值是Lambda，则将其压栈，待下一轮循环，创建闭包
            if(TypeOf(value) === 'LAMBDA') {
                STACK.push({
                    addr: value,
                    contextAddr: currentStackFrame.addr,
                    retAddr: currentStackFrame.retAddr,
                    closure: currentStackFrame.closure,
                });
            }
            // 如果解引用的是一个application（即(define SUM (+ 1 2))这种/注意与(func (application))相区分，后者是应用序求值的，而前者是不求值的，因此需要处理这种情况），将其压栈求值
            else if(TypeOf(value) === 'SLIST') {
                STACK.push({
                    addr: value,
                    contextAddr: currentStackFrame.addr,
                    retAddr: currentStackFrame.retAddr,
                    childrenRetAddr: null,
                    closure: currentStackFrame.closure,
                });
            }
        }
        // quote
        else if(type === 'QUOTED_SLIST' || type === 'QUOTED_LAMBDA') {
            RESULTS[currentStackFrame.retAddr] = currentStackFrame.addr;
            STACK.pop();
        }
    }

    return RESULTS[firstStackAddr];
}




// 查找某个node上面最近的lambda节点的地址
function nearestLambdaAddr(addr) {
    let caddr = addr;
    while(caddr >= 0 && caddr !== undefined) {
        if(NODE_MEMORY[caddr] instanceof Lambda) {
            return caddr;
        }
        caddr = NODE_MEMORY[caddr].parent;
    }
    return null;
}

// 从某个节点开始，向上查找某个变量定义所在的词法节点
function searchContextAddr(symbol, fromNodeAddr) {
    let currentNodeAddr = fromNodeAddr;
    let currentLexicalEnv = null;
    while(currentNodeAddr >= 0 && currentNodeAddr !== undefined) {
        currentLexicalEnv = NODE_MEMORY[currentNodeAddr].lexicalEnv;
        if(currentLexicalEnv instanceof Object && symbol in currentLexicalEnv) {
            return currentNodeAddr;
        }
        currentNodeAddr = NODE_MEMORY[currentNodeAddr].parent;
    }
    return null; // 变量未定义
}

// 检查某两个Lambda节点是否存在词法作用域的包含关系（即AST上是不是有上下位关系）
function isInherit(hypon, hyper) {
    if(TypeOf(hypon) !== 'LAMBDA' || TypeOf(hyper) !== 'LAMBDA') {
        return false;
    }
    let caddr = hypon;
    while(caddr >= 0 && caddr !== undefined) {
        if(caddr === hyper) {
            return true;
        }
        caddr = NODE_MEMORY[caddr].parent;
    }
    return false;
}

function applyClosure(closureAddr, argv) {
    let closureAddrNumber = closureAddr.match(/\-?\d+$/gi)[0];
    let closure = CLOSURE_MEMORY[closureAddrNumber];
    let lambdaNode = NODE_MEMORY[closure.lambdaAddr];
    let parameters = lambdaNode.parameters;
    // 参数代换
    for(let i = 0; i < parameters.length; i++) {
        closure.BoundEnv[parameters[i]] = argv[i];
        // NODE_MEMORY[closure.lambdaAddr].lexicalEnv[parameters[i]] = argv[i];
    }
    // 求值函数体
    let bodyNodeAddr = lambdaNode.body;

    // 尾递归优化
    let res = evaluate(closureAddr, bodyNodeAddr, closure.lambdaAddr);
    if(TCO_FLAG === true) {
        while(res === '#TCO_RETURN') {
            res = evaluate(closureAddr, bodyNodeAddr, closure.lambdaAddr);
        }
    }
    return res;
}


function evaluate(parentClosure, x, contextAddr) {
    let parentClosureAddr = parentClosure.match(/\-?\d+$/gi)[0];
    let node = null;
    let type = TypeOf(x);
    // 变量：尝试解引用
    if(type === 'VARIABLE') {
        if(CLOSURE_MEMORY[parentClosureAddr] !== undefined) {
            let BoundEnv = CLOSURE_MEMORY[parentClosureAddr].BoundEnv;
            let FreeEnv = CLOSURE_MEMORY[parentClosureAddr].FreeEnv;

            // 搜索词法环境
            let lexEnvNodeAddr = searchContextAddr(x, contextAddr);
            if(x in BoundEnv) {
                return evaluate(parentClosure, BoundEnv[x], contextAddr);
            }
            
            // 向上【逐级】查找上级闭包的BoundEnv
            else if(lexEnvNodeAddr !== null) {
                return evaluate(parentClosure, NODE_MEMORY[lexEnvNodeAddr].lexicalEnv[x], contextAddr);
            }
            else {
                let currentClosureAddr = parentClosureAddr;
                while(currentClosureAddr >= 0) {
                    let bound = CLOSURE_MEMORY[currentClosureAddr].BoundEnv;
                    if(x in bound) {
                        // 词法域检查
                        if(currentClosureAddr >= 0) {
                            let actualLambdaAddr = CLOSURE_MEMORY[currentClosureAddr].lambdaAddr;
                            if(isInherit(CLOSURE_MEMORY[parentClosureAddr].lambdaAddr, actualLambdaAddr) === true) {
                                if(x in FreeEnv) {
                                    return evaluate(parentClosure, FreeEnv[x], contextAddr);
                                }
                                else {
                                    return evaluate('#C' + CLOSURE_MEMORY[currentClosureAddr].parent, bound[x], contextAddr);
                                }
                            }
                            else {
                                break;
                            }
                        }
                    }
                    currentClosureAddr = CLOSURE_MEMORY[currentClosureAddr].parent;
                }
            }
            return x;
        }
        else { return x; }
    }
    // 闭包地址
    else if(type === 'CLOSURE') {
        return x;
    }
    // 字面值
    else if(type === 'BOOLEAN' || type === 'NUMBER' || type === 'STRING' || type === 'QUOTED_SYMBOL') {
        return nodeToString(x);
    }
    // quote
    else if(type === 'QUOTED_SLIST' || type === 'QUOTED_LAMBDA') {
        return x;
    }
    // 函数定义
    else if(type === 'LAMBDA') {
        node = NODE_MEMORY[x];
        let closureAddr = newClosure(x, parentClosureAddr);
        if(parseInt(parentClosureAddr) === -1) {
            return ('#C' + closureAddr.toString());
        }
        // 继承上级闭包的环境，其中BoundEnv优先级高
        let newFreeEnv = new Object();
        for(symbol in CLOSURE_MEMORY[parentClosureAddr].FreeEnv) {
            newFreeEnv[symbol] = CLOSURE_MEMORY[parentClosureAddr].FreeEnv[symbol];
        }
        // 用parent的BoundEnv里面的变量，覆盖FreeEnv里面的同名变量
        for(arg in CLOSURE_MEMORY[parentClosureAddr].BoundEnv) {
            newFreeEnv[arg] = CLOSURE_MEMORY[parentClosureAddr].BoundEnv[arg];
        }
        CLOSURE_MEMORY[closureAddr].FreeEnv = newFreeEnv;

        return ('#C' + closureAddr.toString()); // 仅lambda的求值结果是JS的number，其语义为closure的地址
    }
    // 列表
    else if(type === 'SLIST') {
        node = NODE_MEMORY[x];
        let children = node.children;
        let value = new Array();

        // 尾递归优化
        if(TCO_FLAG === true) {
            if(node.tailRecursionID !== undefined) {
                let lambdaID = node.tailRecursionID;
                let parameters = NODE_MEMORY[lambdaID].parameters;
                // 对参数求值
                let tcoValue = new Array();
                for(let i = 1; i < children.length; i++) {
                    tcoValue[i] = evaluate(parentClosure, children[i], x);
                }
                // 直接替换当前上级闭包的约束变量
                for(let i = 0; i < parameters.length; i++) {
                    CLOSURE_MEMORY[parentClosureAddr].BoundEnv[parameters[i]] = tcoValue[i+1];
                }
                // 直接返回特殊值，提示apply做循环而非递归地求值
                return '#TCO_RETURN';
            }
        }

        // 处理特殊构造(求值顺序比较特殊)
        if(children[0] in SPECIAL_FORM) {
            return SPECIAL_FORM[children[0]](children, parentClosure, contextAddr);
        }

        // 应用序逐个eval
        for(let i = 0; i < children.length; i++) {
            value[i] = evaluate(parentClosure, children[i], x);
        }

        // apply
        let first = value[0];
        let argv = value.slice(1);
        if(TypeOf(first) === 'CLOSURE') {
            return applyClosure(first, argv);
        }
        else if(first in PRIMITIVE_FUNCTION) {
            return PRIMITIVE_FUNCTION[first](argv);
        }
        else {
            let errorMsg = `警告：未知函数（${first}），无法调用。`;
            throw errorMsg;
        }
    }
    else {
        let errorMsg = `警告：暂不支持此语法（${type}）`;
        throw errorMsg;
    }
}


function Run() {
    // 求值顶级闭包
    return evaluate('#C-1', 0, 0)
}

 /********************************************
 *
 *             进阶特性：尾调用优化
 *
 ********************************************/

// 尾位置标记（参照R5RS的归纳定义；未完成）
function markTailCall(nodeAddr, isTail) {
    let type = TypeOf(nodeAddr);
    if(type === 'SLIST') {
        let node = NODE_MEMORY[nodeAddr];
        // if 特殊构造
        if(node.children[0] === 'if') {
            markTailCall(node.children[1], false);
            markTailCall(node.children[2], true);
            markTailCall(node.children[3], true);
        }
        // cond 特殊构造
        else if(node.children[0] === 'cond') {
            for(let i = 1; i < node.children.length; i++) {
                markTailCall(NODE_MEMORY[node.children[i]].children[0], false);
                markTailCall(NODE_MEMORY[node.children[i]].children[1], true);
            }
        }
        // 其他构造，含begin、and、or，这些形式的尾位置是一样的
        else {
            for(let i = 0; i < node.children.length; i++) {
                let istail = false;
                if(i === node.children.length-1) {
                    if(node.children[0] === 'begin' || node.children[0] === 'and' || node.children[0] === 'or') {
                        istail = true;
                    }
                }
                markTailCall(node.children[i], istail);
            }
            if(isTail) {
                NODE_MEMORY[nodeAddr].isTail = true; // 标记为尾（调用）位置
            }
        }
    }
    else if(type === 'LAMBDA') {
        let node = NODE_MEMORY[nodeAddr];
        markTailCall(node.body, true);
    }
    else {
        return;
    }
}

// 在尾调用标记的基础上，进行尾递归标记
function markTailRecursion() {
    // 查找某节点直属上级Lambda的ID
    function nearestLambdaAddr(addr) {
        let caddr = addr;
        while(caddr >= 0 && caddr !== undefined) {
            if(NODE_MEMORY[caddr] instanceof Lambda) {
                return caddr;
            }
            caddr = NODE_MEMORY[caddr].parent;
        }
        return null;
    }

    // 词法绑定分析（即由define进行的静态绑定）
    let lexicalBinding = new Array();
    for(let i = 0; i < NODE_MEMORY.length; i++) {
        let node = NODE_MEMORY[i];
        if(node instanceof SList && node.children[0] === 'define') {
            // 计算此绑定所在的直属上级Lambda
            let lambdaID = nearestLambdaAddr(i);
            // 在对应的lambdaID位置上记录绑定
            if(!(lexicalBinding[lambdaID] instanceof Object)) {
                lexicalBinding[lambdaID] = new Object();
            }
            lexicalBinding[lambdaID][node.children[1]] = node.children[2];
        }
    }

    // 遍历所有已经尾调用标记的AST节点，检测尾递归
    for(let i = 0; i < NODE_MEMORY.length; i++) {
        let node = NODE_MEMORY[i];
        if(node instanceof SList && node.isQuote !== true) {
            if(node.isTail === true) {
                // 解析过程变量对应的lambdaID
                let firstID = 0;
                let hyperLambdaID = nearestLambdaAddr(i);
                let currentLambdaID = hyperLambdaID;
                while(currentLambdaID >= 0 && currentLambdaID !== null && currentLambdaID !== undefined) {
                    if(lexicalBinding[currentLambdaID] !== undefined && node.children[0] in lexicalBinding[currentLambdaID]) {
                        firstID = lexicalBinding[currentLambdaID][node.children[0]];
                        break;
                    }
                    currentLambdaID = nearestLambdaAddr(NODE_MEMORY[currentLambdaID].parent);
                }
                // 取尾调用的直属上级LambdaID，与变量对应的lambdaID进行比较
                if(firstID === hyperLambdaID) {
                    NODE_MEMORY[i].tailRecursionID = hyperLambdaID;
                }
            }
        }
    }
}

function TailRecursionAnalysis() {
    markTailCall(0, false);
    markTailRecursion();
}

 /********************************************
 *
 *              进阶特性：垃圾回收
 *
 ********************************************/

 /********************************************
 *
 *            进阶特性：中间代码生成
 *
 ********************************************/

// 变量名称唯一化，为汇编做准备。针对NODE_MEMORY进行操作。
// 2019.01.23
function variableRename() {
    // 从某个节点开始，向上查找某个变量归属的Lambda节点
    function searchVarLambdaAddr(symbol, fromNodeAddr, variableMapping) {
        let currentNodeAddr = fromNodeAddr;
        let currentMap = null;
        while(currentNodeAddr >= 0 && currentNodeAddr !== undefined) {
            if(TypeOf(currentNodeAddr) === 'LAMBDA') {
                currentMap = variableMapping[currentNodeAddr].map;
                if(symbol in currentMap) {
                    return currentNodeAddr;
                }
            }
            currentNodeAddr = NODE_MEMORY[currentNodeAddr].parent;
        }
        return null; // 变量未定义
    }
    // 替换模式
    let varPattern = function(lambdaAddr, index) { return `L${lambdaAddr}:${index}`; };
    // 变量判断
    let isVar = function(s) {
        return (TypeOf(s) === 'VARIABLE' && !(s in PRIMITIVE_FUNCTION) && !(s in SPECIAL_FORM) && s !== 'call/cc' && s !== 'lambda' && s !== 'else');
    };
    // 用于记录每个Lambda拥有哪些直属变量，以及它们的编号（含参数列表和define的）
    let variableMapping = new Array();

    // 需要扫描AST两遍。第一遍进行词法域定位，第二遍替换。
    // 第一遍扫描：确定所有的参数和defined变量所在的Lambda节点和编号
    for(let addr = 0; addr < NODE_MEMORY.length; addr++) {
        let node = NODE_MEMORY[addr];
        if(node instanceof Lambda) {
            // 首先注册变量，替换变量表
            let parameters = node.parameters;
            let varMap = new Object();
            varMap.map = new Object();
            for(let i = 0; i < parameters.length; i++) {
                (varMap.map)[parameters[i]] = i;
            }
            varMap.count = parameters.length;
            variableMapping[addr] = varMap;
        }
        else if(node instanceof SList) {
            let children = node.children;
            for(let i = 0; i < children.length; i++) {
                let s = children[i];
                if(isVar(s)) {
                    // 变量被defined，无论上级是否有定义过，都要使用本级Lambda
                    if(children[0] === 'define' && i === 1) {
                        let currentLambdaAddr = nearestLambdaAddr(addr);
                        let varNum = variableMapping[currentLambdaAddr].count;
                        (variableMapping[currentLambdaAddr].map)[s] = varNum;
                        variableMapping[currentLambdaAddr].count = varNum + 1;
                    }
                }
            }
        }
    }

    // 第二遍扫描：开始替换
    for(let addr = 0; addr < NODE_MEMORY.length; addr++) {
        let node = NODE_MEMORY[addr];
        if(node instanceof Lambda) {
            // 首先注册变量，替换变量表
            let parameters = node.parameters;
            let varMap = variableMapping[addr].map;
            for(let i = 0; i < parameters.length; i++) {
                (node.parameters)[i] = varPattern(addr, varMap[parameters[i]]);
            }

            // 然后替换body中的变量
            if(isVar(node.body)) {
                // 计算此变量所在的词法节点
                let lambdaAddr = searchVarLambdaAddr(node.body, addr, variableMapping);
                // 在map中查找此变量的编号
                let map = variableMapping[lambdaAddr];
                // 处理define特殊情况
                if(node.body in map.map) {
                    node.body = varPattern(lambdaAddr, (map.map)[node.body]);
                }
                else {
                    throw `[预处理] 变量${node.body}未定义`;
                }
            }
        }
        else if(node instanceof SList) {
            let children = node.children;
            for(let i = 0; i < children.length; i++) {
                let s = children[i];
                if(isVar(s)) {
                    // 计算此变量所在的词法节点
                    let lambdaAddr = searchVarLambdaAddr(s, addr, variableMapping);
                    if(lambdaAddr === null) {
                        throw `[预处理] 变量${s}未定义`;
                    }
                    // 在map中查找此变量的编号
                    let map = variableMapping[lambdaAddr];
                    if(s in map.map) {
                        (node.children)[i] = varPattern(lambdaAddr, (map.map)[s]);
                    }
                    else {
                        throw `[预处理] 变量${s}未定义`;
                    }
                }
            }
        }
    }
}
