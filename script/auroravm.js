// AuroraVM 原型
// 2018.01.23 v0.0
// 2018.02.01 v0.1
// 2019.03.08 冻结
;
var AuroraVM = function(bytecode) {
    this.bytecode = bytecode;

    // 共享运行时环境（仅堆）
    this.SHARED_HEAP = new Array();

    // 线程队列
    this.QUEUE = new Array();
    this.TID = 0;

    // 调试界面渲染器
    this.DEBUGGER_RENDERER = ()=>{};
    // 输入输出回调
    this.OUTPUT = ()=>{};

    return this;
};

Array.prototype.top = function() { return this[this.length-1];};

AuroraVM.prototype = {
    // 绑定调试界面渲染器
    AddDebuggerRenderer: function(renderer) {
        this.DEBUGGER_RENDERER = renderer;
    },
    // 绑定输出回调
    AddOutput: function(f) {
        this.OUTPUT = f;
    },

    // 判断符号类型
    TypeOf: function(arg) {
        if(!arg || arg.length <= 0) {
            return "UNDEFINED";
        }
        if(!isNaN(arg) || arg === '#t' || arg === '#f') {
            return "IMME";
        }
        switch(arg[0]) {
            case "&": return "VARIABLE";
            case "@": return "LABEL";
            case "^": return "CLOSURE";
            case "*": return "STRING";
            case "!": return "SYMBOL";
            case "$": return "SLIST";
            case "~": return "CONTINUATION";
            default:  return "UNDEFINED";
        }
    },

    // 上溯闭包，获取变量绑定的值
    getBoundValue: function(variable, currentClosureIndex, env) {
        let ca = parseInt(currentClosureIndex.substring(1));
        while(ca >= env.firstClosureAddr && ca in env.CLOSURES) {
            if(variable in env.CLOSURES[ca].env) {
                return (env.CLOSURES[ca].env)[variable];
            }
            ca = parseInt(env.CLOSURES[ca].parentClosure.substring(1));
        }
        throw `[虚拟机错误] 变量'${variable}' at Closure${currentClosureIndex}未定义`;
    },

    // 指令解析
    parseInstruction: function(instline) {
        let instObj = new Object();
        let fields = instline.split(/\s+/i);
        let mnemonic = fields[0].toLowerCase();
        let argType = this.TypeOf(fields.slice(1).join(' '));
        let argIndex = (fields.slice(1).join(' ')) ? fields.slice(1).join(' ').substring(1) : ''; // 暂时允许字符串

        instObj.mnemonic = mnemonic;
        instObj.arg = fields.slice(1).join(' ');
        instObj.argType = argType;
        instObj.argIndex = argIndex;

        return instObj;
    },



    // 新建栈帧
    pushStackFrame: function(closure, returnTo, env) {
        let frame = new Object();
        frame.closure = closure;
        frame.returnTo = returnTo; 
        (env.FSTACK).push(frame);
    },

    // 新建闭包
    newClosure: function(instructionAddr, parentClosure, env) {
        let closure = new Object();
        closure.instructionAddr = instructionAddr;
        closure.parentClosure = parentClosure;
        closure.env = new Object();
        (env.CLOSURES)[env.CLOSURE_ADDR] = closure;
        let newAddr = env.CLOSURE_ADDR;
        (env.CLOSURE_ADDR)++;
        return `^${newAddr}`;
    },

    // 新建Continuation
    newContinuation: function(env, retTarget) {
        let continuation = new Object();
        let partialEnv = new Object();
        partialEnv.currentClosureIndex = env.currentClosureIndex;      // 当前闭包
        partialEnv.OPSTACK = env.OPSTACK;      // 操作数栈
        partialEnv.FSTACK = env.FSTACK;       // 调用栈（活动记录栈）
        // partialEnv.CLOSURES = env.CLOSURES;     // 闭包区
        partialEnv.firstClosureAddr = env.firstClosureAddr;       // 闭包起始地址
        partialEnv.CLOSURE_ADDR = env.CLOSURE_ADDR;           // 闭包最大地址（用于闭包地址分配）

        continuation.json = JSON.stringify(partialEnv);
        continuation.retTarget = retTarget;
        (env.CONTINUATIONS)[env.CONTINUATION_ADDR] = continuation;
        let newAddr = env.CONTINUATION_ADDR;
        (env.CONTINUATION_ADDR)++;
        return `~${newAddr}`;
    },

    // 20190226
    loadContinuation: function(contRef, thread) {
        let cont = thread.env.CONTINUATIONS[parseInt(contRef.substring(1))];
        let newEnv = JSON.parse(cont.json);

        thread.env.currentClosureIndex = newEnv.currentClosureIndex;      // 当前闭包
        thread.env.OPSTACK = newEnv.OPSTACK;      // 操作数栈
        thread.env.FSTACK = newEnv.FSTACK;       // 调用栈（活动记录栈）
        // thread.env.CLOSURES = newEnv.CLOSURES;     // 闭包区

        thread.env.firstClosureAddr = newEnv.firstClosureAddr;       // 闭包起始地址
        thread.env.CLOSURE_ADDR = newEnv.CLOSURE_ADDR;           // 闭包最大地址（用于闭包地址分配）

        return cont.retTarget;
    },

    // 进程状态
    StatusCode: {
        'DEFAULT'     : -1, // 默认
        'RUNNING'     : 1,  // 运行
        'SLEEPING'    : 2,  // 睡眠（可中断）
        'DEEPSLEEPING': 3,  // 深度睡眠（不可中断）
        'SUSPENDED'   : 4,  // 挂起
        'DEAD'        : 5,  // 销毁
    },

    // 20190214
    // 静态资源池设置（用于测试）
    // 除env外的各参数皆为数组，slists数组元素为slist对象
    InitPool: function(env, resources) {
        let poolCounter = 0;
        // 添加变量
        for(let v of resources.variables) {
            (env.POOL)[poolCounter] = {
                type: "VARIABLE",
                object: v,
            };
            let newref = `&${(env.REF_INDEX)['&']}`;
            (env.REFMAP)[newref] = poolCounter;
            (env.REF_INDEX)['&']++;
            poolCounter++;
        }
        // 添加符号
        for(let s of resources.symbols) {
            (env.POOL)[poolCounter] = {
                type: "SYMBOL",
                object: s,
            };
            let newref = `!${(env.REF_INDEX)["'"]}`;
            (env.REFMAP)[newref] = poolCounter;
            (env.REF_INDEX)["!"]++;
            poolCounter++;
        }
        // 添加字符串
        for(let s of resources.strings) {
            (env.POOL)[poolCounter] = {
                type: "STRING",
                object: s,
            };
            let newref = `*${(env.REF_INDEX)["*"]}`;
            (env.REFMAP)[newref] = poolCounter;
            (env.REF_INDEX)["*"]++;
            poolCounter++;
        }
        // 添加常数
        for(let c of resources.constants) {
            (env.POOL)[poolCounter] = {
                type: "CONSTANT",
                object: c,
            };
            let newref = `#${(env.REF_INDEX)["#"]}`;
            (env.REFMAP)[newref] = poolCounter;
            (env.REF_INDEX)["#"]++;
            poolCounter++;
        }
        // 添加SList
        for(let s of resources.slists) {
            (env.POOL)[poolCounter] = s;
            let newref = `$${(env.REF_INDEX)["$"]}`;
            (env.REFMAP)[newref] = poolCounter;
            (env.REF_INDEX)["$"]++;
            poolCounter++;
        }

        // 【重要】将堆地址起始值设置到最大池地址之后，保证二者空间不重叠
        (env.HEAP_ADDR) = poolCounter;
    },

    // 20190214 从池/堆中取出对象
    GetObject: function(reference, env) {
        if(!isNaN(reference) || reference === '#f' || reference === '#t') {
            return {
                type: "CONSTANT",
                object: reference
            };
        }
        // 将引用转换到物理地址
        let addr = env.REFMAP[reference];
        // 先查找池空间
        if(addr in env.POOL) {
            return (env.POOL)[addr];
        }
        else if(addr in env.HEAP) {
            return (env.HEAP)[addr];
        }
        else {
            throw `[警告] 空引用`;
        }
    },

    // 20190214 在堆中分配空间，存储对象，并返回其引用
    NewObject: function(type, obj, env) {
        // 依据type，分配新Ref
        let ref = '';
        if(type === 'STRING') {
            ref = `*${(env.REF_INDEX)["*"]}`;
            (env.REF_INDEX)["*"]++;
        }
        else if(type === 'SLIST') {
            ref = `$${(env.REF_INDEX)["$"]}`;
            (env.REF_INDEX)["$"]++;
        }
        else {
            throw `[错误] 只允许在堆上新建*字符串*和*列表*。`;
        }

        // 20190228 分配新的堆地址（小地址端第一个空位，概念上每个空位都可以放下一个对象，无大小限制。TODO：此处可优化）
        let newHeapAddr = 10000; // TODO:最大堆空间作为参数可设置
        for(let i = env.POOL.length; i < 10000; i++) {
            if(!env.HEAP[i]) {
                newHeapAddr = i;
                break;
            }
        }
        // 引用-物理地址映射
        (env.REFMAP)[ref] = newHeapAddr;
        // 存储对象
        (env.HEAP)[newHeapAddr] = obj;

        return ref;
    },


    // 将对象转换为相应的字符串
    ObjectToString: function(ref, env) {
        let obj = this.GetObject(ref, env);
        let type = obj.type;
        if(type === "CONSTANT" || type === "VARIABLE") {
            return obj.object;
        }
        else if(type === "SYMBOL") {
            return `'${obj.object}`;
        }
        else if(type === "STRING") {
            let str = obj.object;
            if(str[0] === '"' && str[str.length-1] === '"') {
                str = str.substring(1, str.length-1);
            }
            return `${str}`;
        }
        else if(type === "SLIST") {
            let str = (obj.isQuoted) ? "'(" : "(";
            for(let i = 0; i < obj.children.length-1; i++) {
                str += this.ObjectToString.call(this, obj.children[i], env);
                str += " ";
            }
            str += this.ObjectToString.call(this, obj.children[obj.children.length-1], env);
            str += ')';
            return str;
        }
    },





    // 20190214 **堆空间**垃圾回收
    // 说明：采取标记-清除算法。以GC时刻进程全部闭包的全部绑定、以及操作数栈中的所有引用为起点，进行堆对象引用可达性分析。
    // 注意：不会GC池空间（池空间是静态区，且池空间内部的对象引用是封闭于池空间内部的）。
    //   对于SLIST引用，会沿着子节点对其他对象的引用，标记仍然“存活”的对象。而对于符号、字符串、立即数等原子对象引用，则只标记目标对象的“存活”状态。
    //   随后，清理掉没有被标记为“存活”的对象。
    //   [进阶特性]为防止堆空间碎片化，可将所有存活对象迁移到低地址侧连续存放（但不要挤占池空间地址），同时重置堆地址计数器，以便再分配新的堆空间时，可以保持连续。
    //   由于REFMAP将物理地址与实际使用的对象引用（逻辑地址）隔离，因此碎片整理过程不会修改引用，对用户代码而言是透明的。
    GC: function(env) {
        console.info(`[GC] 垃圾回收开始`);
        // 获取闭包空间的全部绑定、以及操作数栈内的引用（称为**活动引用**），作为可达性分析的起点（即gcroot）
        let gcroots = new Object();
        for(let c of env.CLOSURES) {
            let env = c.env;
            for(let v in env) {
                let value = env[v];
                gcroots[value] = true;
            }
        }
        for(let r of env.OPSTACK) {
            gcroots[r] = true;
        }

        // 遍历所有活动引用，进行可达性分析
        // 说明：堆对象之间的引用，目前只有列表元素之间的引用，即临时表的嵌套。鉴于表嵌套是一种树状的关系，因此不可能出现循环引用的情况。
        let aliveObjects = new Object();
        function GCMark(rootref) {
            let reftype = this.TypeOf(rootref);
            if(reftype === 'VARIABLE' || reftype === 'STRING' || reftype === 'SYMBOL' || reftype === 'IMME') {
                let addr = (env.REFMAP)[rootref];
                aliveObjects[addr] = true;
            }
            else if(reftype === 'SLIST') {
                let addr = (env.REFMAP)[rootref];
                aliveObjects[addr] = true;
                let children = this.GetObject(rootref, env).children;
                for(let r of children) {
                    GCMark.call(this, r);
                }
            }
        }
        for(let r in gcroots) {
            GCMark.call(this, r);
        }

        // 遍历全部堆对象，删除没有被标记为“存活”的对象
        for(let addr = 0; addr < env.HEAP.length; addr++) {
            if(!(addr in aliveObjects)) {
                console.info(`[GC] 堆空间@${addr} 已回收`);
                delete (env.HEAP)[addr];
            }
        }
    },

    // 向VM添加线程。默认从第1条指令开始执行。
    // 实际上这应该是模块加载器完成的工作
    newThread: function(scmModule) {
        const startFrom = 0;
        const WDTinit = 100000;

        // 线程独占环境
        let ENV = new Object();
        ENV.ASMLINES = scmModule.ASM;
        ENV.LABEL_DICT = scmModule.labelDict;

        ENV.METADATA = new Array();     // 模块元数据

        ENV.POOL = new Array();         // 模块的静态资源池（模块加载时被加载到内存）
        ENV.HEAP = new Array();         // 线程私有堆

        ENV.HEAP_ADDR = 0;              // 堆地址计数器（用于地址分配，具体数值根据池的大小做调整，使得池和堆的地址不重叠）
        ENV.REF_INDEX = {
            '*': 0,
            '$': 0,
            "'": 0,
            '&': 0,
            '#': 0,
            '^': 0,
            '~': 0,
        };                              // 引用序号计数器（用于引用分配）

        ENV.REFMAP = new Object();      // 引用——池/堆地址映射（用于引用到池/堆地址的转换）

        ENV.OPSTACK = new Array();      // 操作数栈
        ENV.FSTACK = new Array();       // 调用栈（活动记录栈）
        ENV.CLOSURES = new Array();     // 闭包区
        ENV.firstClosureAddr = 0;       // 闭包起始地址
        ENV.CLOSURE_ADDR = 0;           // 闭包最大地址（用于闭包索引分配）

        ENV.CONTINUATIONS = new Array();// Continuation区
        ENV.CONTINUATION_ADDR = 0;      // Cont计数，用于索引分配

        // 程序计数器
        ENV.PC = startFrom;
        ENV.currentClosureIndex = null;
        ENV.WDT = WDTinit;

        // 资源初始化
        this.InitPool(ENV, scmModule.AST),

        // 环境初始化
        this.pushStackFrame(ENV.firstClosureAddr, startFrom, ENV);
        ENV.currentClosureIndex = this.newClosure(startFrom, "^-1", ENV);

        // 修改线程ID
        let newThreadId = this.TID;
        this.TID++;

        // 新线程进入队列【TODO：需要考虑线程调度】
        (this.QUEUE).push({
            tid: newThreadId,
            env: ENV,
        });

        return newThreadId;
    },


    Scheduler: function*(isDebug) {
        const SLOT_DURATION = 500; // 每个时间片需要多少个tick
        while(1) {
            let ticks = 0;
            // 取出队头线程（环境）
            let thread = (this.QUEUE).shift();
            // 执行一步
            let status = this.StatusCode.DEFAULT;
            while(ticks < SLOT_DURATION) {
                let ENV = thread.env;
                ENV.WDT--;
                if(ENV.WDT <= 0) { throw `[虚拟机异常] 程序跑飞`; }
                status = this.Execute(thread);
                // 进程在时间片结束前就执行完成
                if(status === this.StatusCode.DEAD) {
                    break;
                }
                if(isDebug) {
                    this.DEBUGGER_RENDERER(thread);
                    yield;
                }
                ticks++;
            }
            // 线程调度【TODO：仅为简单时间片轮转，可优化】
            if(status !== this.StatusCode.DEAD) {
                (this.QUEUE).push(thread); // 没有执行完，回到队列继续等待下一轮执行
            }
            // 所有线程执行完毕则VM停机
            if((this.QUEUE).length <= 0) {
                console.warn(`[虚拟机通知] 所有线程执行完毕。进程最终状态：`);
                this.GC(thread.env);
                console.log(thread);
                break;
            }
        }
    },

    // 指令译码+执行
    // 返回值：进程状态码
    Execute: function(thread) {
        let status = this.StatusCode.RUNNING;

        let ENV = thread.env;
        let tid = thread.tid;
        // 取出指令行，并解析之
        let instruction = (ENV.ASMLINES)[ENV.PC];
        let instObj = this.parseInstruction(instruction);
        let mnemonic = instObj.mnemonic;
        let arg = instObj.arg;
        let argType = instObj.argType;
        let argIndex = instObj.argIndex;

        // 指令译码
        if(/^\s*\;[\s\S]*$/.test(instruction)) {
            ENV.PC++;
        }
        else if(this.TypeOf(mnemonic) === 'LABEL') {
            ENV.PC++;
        }
        else if(mnemonic === 'nop') {
            ENV.PC++;
        }
        else if(mnemonic === 'halt') {
            console.info(`[虚拟机通知] 线程[${tid}]执行完毕。`);
            status = this.StatusCode.DEAD;
        }
        else if(mnemonic === 'display') {
            let arg = ENV.OPSTACK.pop();
            let str = this.ObjectToString(arg, ENV);
            console.warn(`[虚拟机通知] 输出：${str}`);
            this.OUTPUT(str.toString());
            ENV.PC++;
        }
        else if(mnemonic === 'newline') {
            // 这里操作共享堆内存
            this.OUTPUT('<br>');
            ENV.PC++;
        }
        else if(mnemonic === 'call') {
            // 新的栈帧入栈
            this.pushStackFrame(ENV.currentClosureIndex, ENV.PC + 1, ENV);
            // 判断参数类型
            if(argType === 'LABEL') {
                let instAddr = (ENV.LABEL_DICT)[arg];
                ENV.currentClosureIndex = this.newClosure(instAddr, ENV.currentClosureIndex, ENV);
                ENV.PC = instAddr;
            }
            else if(argType === 'VARIABLE') {
                let value = this.getBoundValue(argIndex, ENV.currentClosureIndex, ENV);
                if(this.TypeOf(value) === 'LABEL') {
                    let instAddr = (ENV.LABEL_DICT)[value];
                    ENV.currentClosureIndex = this.newClosure(instAddr, ENV.currentClosureIndex, ENV);
                    ENV.PC = instAddr;
                }
                else if(this.TypeOf(value) === 'CLOSURE') {
                    let closureIndex = value.substring(1);
                    let targetClosure = (ENV.CLOSURES)[closureIndex];
                    ENV.currentClosureIndex = value;
                    ENV.PC = targetClosure.instructionAddr;
                }
                else if(this.TypeOf(value) === 'CONTINUATION') {
                    let top = (ENV.OPSTACK).pop(); // 调用continuation必须带一个参数，TODO 这个检查在编译时完成
                    let retTargetTag = this.loadContinuation(value, thread);
                    ENV = thread.env;
                    ENV.OPSTACK.push(top);
                    console.log(`Continuation已恢复，返回标签：${retTargetTag}`);
                    ENV.PC = ENV.LABEL_DICT[retTargetTag];
                }
                else {
                    throw `[虚拟机错误] 调用对象必须是代码、闭包或continuation`;
                }
            }
        }
        else if(mnemonic === 'tailcall') {
            // 判断参数类型
            if(argType === 'LABEL') {
                ENV.PC = (ENV.LABEL_DICT)[arg];
            }
            else if(argType === 'VARIABLE') {
                let value = this.getBoundValue(argIndex, ENV.currentClosureIndex, ENV);
                if(this.TypeOf(value) === 'LABEL') {
                    let instAddr = (ENV.LABEL_DICT)[value];
                    ENV.PC = instAddr;
                }
                else if(this.TypeOf(value) === 'CLOSURE') {
                    let closureIndex = value.substring(1);
                    let targetClosure = (ENV.CLOSURES)[closureIndex];
                    ENV.currentClosureIndex = value;
                    ENV.PC = targetClosure.instructionAddr;
                }
                else if(this.TypeOf(value) === 'CONTINUATION') {
                    let top = (ENV.OPSTACK).pop(); // 调用continuation必须带一个参数，TODO 这个检查在编译时完成
                    let retTargetTag = this.loadContinuation(value, thread);
                    ENV = thread.env;
                    ENV.OPSTACK.push(top);
                    console.log(`Continuation已恢复，返回标签：${retTargetTag}`);
                    ENV.PC = ENV.LABEL_DICT[retTargetTag];
                }
                else {
                    throw `[虚拟机错误] 调用对象必须是代码或者闭包`;
                }
            }
        }
        else if(mnemonic === 'return') {
            let stackframe = (ENV.FSTACK).pop(); // 栈帧退栈
            ENV.currentClosureIndex = stackframe.closure; // 修改当前闭包
            ENV.PC = stackframe.returnTo; // 跳转到返回地址
            stackframe = null; // 销毁当前栈帧
        }
        else if(mnemonic === 'store') {
            if(argType !== 'VARIABLE') {
                throw `[虚拟机错误] store指令参数类型不是变量`;
            }
            let variable = argIndex;
            let value = (ENV.OPSTACK).pop();
            ((ENV.CLOSURES)[ENV.currentClosureIndex.substring(1)].env)[variable] = value;
            ENV.PC++;
        }
        else if(mnemonic === 'load') {
            if(argType === 'LABEL') {
                let instAddr = (ENV.LABEL_DICT)[arg];
                let closureAddr = this.newClosure(instAddr, ENV.currentClosureIndex, ENV);
                (ENV.OPSTACK).push(closureAddr);
            }
            else if(argType === 'VARIABLE') {
                let variable = argIndex;
                let value = this.getBoundValue(variable, ENV.currentClosureIndex, ENV);
                if(this.TypeOf(value) === 'LABEL') { // 指令地址，需要新建闭包
                    let instAddr = (ENV.LABEL_DICT)[value];
                    let closureAddr = this.newClosure(instAddr, ENV.currentClosureIndex, ENV);
                    (ENV.OPSTACK).push(closureAddr);
                }
                else {
                    (ENV.OPSTACK).push(value);
                }
            }
            else {
                (ENV.OPSTACK).push(arg);
            }
            ENV.PC++;
        }
        else if(mnemonic === 'set!') {
            let symbol = argIndex;
            let value = (ENV.OPSTACK).pop();
            // 沿闭包链修改，直到找到约束变量绑定，修改之
            let closureAddr = parseInt(ENV.currentClosureIndex.substring(1));
            while(closureAddr >= ENV.firstClosureAddr && closureAddr in ENV.CLOSURES) {
                if(symbol in ((ENV.CLOSURES)[closureAddr]).env) {
                    (((ENV.CLOSURES)[closureAddr]).env)[symbol] = value;
                    break;
                }
                closureAddr = parseInt((ENV.CLOSURES)[closureAddr].parentClosure.substring(1));
            }
            ENV.PC++;
        }
        else if(mnemonic === 'push') {
            (ENV.OPSTACK).push(arg);  // 只允许立即值和标签（原形）
            ENV.PC++;
        }
        else if(mnemonic === 'pop') {
            (ENV.OPSTACK).pop();
            ENV.PC++;
        }
        else if(mnemonic === 'swap') {
            let top1 = (ENV.OPSTACK).pop();
            let top2 = (ENV.OPSTACK).pop();
            (ENV.OPSTACK).push(top1);
            (ENV.OPSTACK).push(top2);
            ENV.PC++;
        }

        else if(mnemonic === 'iftrue') {
            if(argType !== 'LABEL') {
                throw `[虚拟机错误] 分支跳转指令的参数必须是标签`;
            }
            let value = (ENV.OPSTACK).pop();
            if(value !== '#f') {
                ENV.PC = (ENV.LABEL_DICT)[arg];
            }
            else {
                ENV.PC++;
            }
        }

        else if(mnemonic === 'goto') {
            if(argType !== 'LABEL') {
                throw `[虚拟机错误] 分支跳转指令的参数必须是标签`;
            }
            ENV.PC = (ENV.LABEL_DICT)[arg];
        }

        else if(mnemonic === '+') {
            let top1 = (ENV.OPSTACK).pop();
            let top2 = (ENV.OPSTACK).pop();
            // TODO 类型检查与转换
            let operand1 = (isNaN(parseFloat(top1))) ? this.GetObject(top1, ENV).object : top1;
            let operand2 = (isNaN(parseFloat(top2))) ? this.GetObject(top2, ENV).object : top2;
            (ENV.OPSTACK).push((parseFloat(operand2) + parseFloat(operand1)).toString());
            ENV.PC++;
        }
        else if(mnemonic === '-') {
            let top1 = (ENV.OPSTACK).pop();
            let top2 = (ENV.OPSTACK).pop();
            // TODO 类型检查与转换
            let operand1 = (isNaN(parseFloat(top1))) ? this.GetObject(top1, ENV).object : top1;
            let operand2 = (isNaN(parseFloat(top2))) ? this.GetObject(top2, ENV).object : top2;
            (ENV.OPSTACK).push((parseFloat(operand2) - parseFloat(operand1)).toString());
            ENV.PC++;
        }
        else if(mnemonic === '*') {
            let top1 = (ENV.OPSTACK).pop();
            let top2 = (ENV.OPSTACK).pop();
            // TODO 类型检查与转换
            let operand1 = (isNaN(parseFloat(top1))) ? this.GetObject(top1, ENV).object : top1;
            let operand2 = (isNaN(parseFloat(top2))) ? this.GetObject(top2, ENV).object : top2;
            (ENV.OPSTACK).push((parseFloat(operand2) * parseFloat(operand1)).toString());
            ENV.PC++;
        }
        else if(mnemonic === '/') {
            let top1 = (ENV.OPSTACK).pop();
            let top2 = (ENV.OPSTACK).pop();
            // TODO 类型检查与转换
            let operand1 = (isNaN(parseFloat(top1))) ? this.GetObject(top1, ENV).object : top1;
            let operand2 = (isNaN(parseFloat(top2))) ? this.GetObject(top2, ENV).object : top2;
            (ENV.OPSTACK).push((parseFloat(operand2) / parseFloat(operand1)).toString());
            ENV.PC++;
        }
        else if(mnemonic === '=') {
            let top1 = (ENV.OPSTACK).pop();
            let top2 = (ENV.OPSTACK).pop();
            // TODO 类型检查与转换
            let operand1 = (isNaN(parseFloat(top1))) ? this.GetObject(top1, ENV).object : top1;
            let operand2 = (isNaN(parseFloat(top2))) ? this.GetObject(top2, ENV).object : top2;
            (ENV.OPSTACK).push((parseInt(operand2) === parseInt(operand1)) ? "#t" : "#f");
            ENV.PC++;
        }
        else if(mnemonic === '<=') {
            let top1 = (ENV.OPSTACK).pop();
            let top2 = (ENV.OPSTACK).pop();
            // TODO 类型检查与转换
            let operand1 = (isNaN(parseFloat(top1))) ? this.GetObject(top1, ENV).object : top1;
            let operand2 = (isNaN(parseFloat(top2))) ? this.GetObject(top2, ENV).object : top2;
            (ENV.OPSTACK).push((parseInt(operand2) <= parseInt(operand1)) ? "#t" : "#f");
            ENV.PC++;
        }
        else if(mnemonic === '>=') {
            let top1 = (ENV.OPSTACK).pop();
            let top2 = (ENV.OPSTACK).pop();
            // TODO 类型检查与转换
            let operand1 = (isNaN(parseFloat(top1))) ? this.GetObject(top1, ENV).object : top1;
            let operand2 = (isNaN(parseFloat(top2))) ? this.GetObject(top2, ENV).object : top2;
            (ENV.OPSTACK).push((parseInt(operand2) >= parseInt(operand1)) ? "#t" : "#f");
            ENV.PC++;
        }
        else if(mnemonic === '<') {
            let top1 = (ENV.OPSTACK).pop();
            let top2 = (ENV.OPSTACK).pop();
            // TODO 类型检查与转换
            let operand1 = (isNaN(parseFloat(top1))) ? this.GetObject(top1, ENV).object : top1;
            let operand2 = (isNaN(parseFloat(top2))) ? this.GetObject(top2, ENV).object : top2;
            (ENV.OPSTACK).push((parseInt(operand2) < parseInt(operand1)) ? "#t" : "#f");
            ENV.PC++;
        }
        else if(mnemonic === '>') {
            let top1 = (ENV.OPSTACK).pop();
            let top2 = (ENV.OPSTACK).pop();
            // TODO 类型检查与转换
            let operand1 = (isNaN(parseFloat(top1))) ? this.GetObject(top1, ENV).object : top1;
            let operand2 = (isNaN(parseFloat(top2))) ? this.GetObject(top2, ENV).object : top2;
            (ENV.OPSTACK).push((parseInt(operand2) > parseInt(operand1)) ? "#t" : "#f");
            ENV.PC++;
        }

        else if(mnemonic === 'not') {
            let arg = (ENV.OPSTACK).pop();
            let operand = (isNaN(parseFloat(arg))) ? this.GetObject(arg, ENV).object : arg;
            if(operand !== '#f') {
                (ENV.OPSTACK).push('#t');
            }
            else {
                (ENV.OPSTACK).push('#f');
            }
            ENV.PC++;
        }

        // 20190214 新增
        else if(mnemonic === 'atom?') {
            let arg = (ENV.OPSTACK).pop();
            let argtype = this.TypeOf(arg);
            if(argtype === 'VARIABLE' || argtype === 'STRING' || argtype === 'SYMBOL' || argtype === 'IMME') {
                (ENV.OPSTACK).push('#t');
            }
            else {
                (ENV.OPSTACK).push('#f');
            }
            ENV.PC++;
        }

        // 20190214 新增
        else if(mnemonic === 'list?') {
            let arg = (ENV.OPSTACK).pop();
            let argtype = this.TypeOf(arg);
            if(argtype === 'SLIST') {
                (ENV.OPSTACK).push('#t');
            }
            else {
                (ENV.OPSTACK).push('#f');
            }
            ENV.PC++;
        }

        // 20190214 新增
        else if(mnemonic === 'null?') {
            let slistRef = (ENV.OPSTACK).pop();
            if(this.TypeOf(slistRef) === 'SLIST') {
                let slist = this.GetObject(slistRef, ENV);
                if(slist.children.length <= 0) {
                    (ENV.OPSTACK).push('#t');
                }
                else {
                    (ENV.OPSTACK).push('#f');
                }
            }
            else {
                (ENV.OPSTACK).push('#f');
            }
            ENV.PC++;
        }

        // 20190214 新增
        else if(mnemonic === 'car') {
            let slistRef = (ENV.OPSTACK).pop();
            // 类型检查
            if(this.TypeOf(slistRef) === 'SLIST') {
                let slist = this.GetObject(slistRef, ENV);
                if(slist.children.length <= 0) {
                    throw `[错误] car参数是空表`;
                }
                else {
                    let first = (slist.children)[0];
                    (ENV.OPSTACK).push(first);
                }
            }
            else { throw `[错误] car参数类型错误`; }
            ENV.PC++;
        }

        // 20190214 新增
        else if(mnemonic === 'cdr') {
            let slistRef = (ENV.OPSTACK).pop();
            // 类型检查
            if(this.TypeOf(slistRef) === 'SLIST') {
                let slist = this.GetObject(slistRef, ENV);
                if(slist.children.length <= 0) {
                    throw `[错误] cdr参数是空表`;
                }
                else if(slist.type === 'lambda') {
                    throw `[错误] cdr参数是lambda`;
                }
                else {
                    let newlist = {
                        "type": slist.type,
                        "index": null, // 待定
                        "parentIndex": slist.index,
                        "children": slist.children.slice(1),
                        "isQuoted": slist.isQuoted,
                        "parameters": [],
                        "body": slist.body,
                    };

                    let newref = this.NewObject('SLIST', newlist, ENV);
                    newlist.index = parseInt(newref.substring(1));
                    (ENV.OPSTACK).push(newref);
                }
            }
            else { throw `[错误] car参数类型错误`; }
            ENV.PC++;
        }

        // 20190214 新增
        else if(mnemonic === 'cons') {
            let slistRef = (ENV.OPSTACK).pop();
            let first = (ENV.OPSTACK).pop();
            // 类型检查
            if(this.TypeOf(slistRef) === 'SLIST') {
                let slist = this.GetObject(slistRef, ENV);
                if(slist.type === 'lambda') {
                    throw `[错误] 不能在lambda列表上执行cons`;
                }
                else {
                    let newlist = {
                        "type": slist.type,
                        "index": null, // 待定
                        "parentIndex": slist.index,
                        "children": [first].concat(slist.children),
                        "isQuoted": slist.isQuoted,
                        "parameters": [],
                        "body": slist.body,
                    };
                    let newref = this.NewObject('SLIST', newlist, ENV);
                    newlist.index = parseInt(newref.substring(1));
                    (ENV.OPSTACK).push(newref);
                }
            }
            else { throw `[错误] cons参数类型错误`; }
            ENV.PC++;
        }

        else if(mnemonic === 'capturecc') {
            if(argType !== 'VARIABLE') {
                throw `[虚拟机错误] capturecc指令参数类型不是变量`;
            }
            let variable = argIndex;
            let retTargetTag = `@${arg}`; // @+cont的变量引用=cont返回点的标签名称
            let contRef = this.newContinuation(ENV, retTargetTag);
            console.log(`Continuation ${variable} 已捕获，对应的返回标签 ${retTargetTag}`);
            ((ENV.CLOSURES)[ENV.currentClosureIndex.substring(1)].env)[variable] = contRef;
            ENV.PC++;
        }

        else if(mnemonic === 'gc') { // TODO 仅调试用
            this.GC(thread.env);
            thread.env.PC++;
        }

        else if(mnemonic === 'begin') { // TODO 暂且迁就编译器
            thread.env.PC++;
        }

        return status;
    },
};
