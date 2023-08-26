#!title:    Animac设计备忘录
#!date:     2019-01-25

#!content

版本记录：

- 2019-01-25：2018~2019年的众多零散笔记集成本文草稿，后持续补充。
- 2023-08-26：更名为《Animac设计备忘录》，彻底重构目录。

# 语言特性概览

# 语法分析




## MikuRec形式语法

```
         <Term> ::= <SList> | <Lambda> | <Quote> | <Quasiquote> | <Symbol>
        <SList> ::= ( <SListSeq> )
       <Lambda> ::= ( lambda <ArgList> <Body> )
     <SListSeq> ::= <Term> <SListSeq> | ε
   <ArgListSeq> ::= <ArgSymbol> <ArgListSeq> | ε
      <ArgList> ::= ( <ArgListSeq> )
         <Body> ::= <SList> | <Lambda> | <Quote> | <BodySymbol>
        <Quote> ::= ' <Term>
   <Quasiquote> ::= [ <SListSeq> ] | ε
       <Symbol> ::= IDENTIFIER
   <BodySymbol> ::= IDENTIFIER
    <ArgSymbol> ::= IDENTIFIER
```

其中IDENTIFIER是上文所述的标识符。

非终结符的FIRST集合：

|非终结符|FIRST|
|---|
|`<Term>`|`(` `[` `'` `SYMBOL`|
|`<SList>`|`(`|
|`<Lambda>`|`(`|
|`<SListSeq>`|`ε` `(` `[` `'` `SYMBOL`|
|`<ArgListSeq>`|`ε` `SYMBOL`|
|`<ArgList'>`|`(`|
|`<Body>`|`(` `[` `'` `SYMBOL`|
|`<Quote>`|`'`|
|`<Quasiquote>`|`[`|
|`<Symbol>`|`SYMBOL`|
|`<BodySymbol>`|`SYMBOL`|
|`<ArgSymbol>`|`SYMBOL`|

为简单起见，使用递归下降分析。因为已经消除了左递归，所以理论上是不会出现无限循环的。此外，最多只需要向前看两个符号，就可以决定产生式。


## 新BNF/20190331

计划重构Parser以支持quasiquote。

```
※ 星号代表解析动作发生位置
          <Term> ::= <SList> | <Lambda> | <Quote> | <Unquote> | <Quasiquote> | <Symbol>
         <SList> ::= ( ※ <SListSeq> )
      <SListSeq> ::= <Term> ※ <SListSeq> | ε
        <Lambda> ::= ( ※ lambda <ArgList> <Body> )
       <ArgList> ::= ( ※1 <ArgListSeq> ※2)
    <ArgListSeq> ::= <ArgSymbol> ※ <ArgListSeq> | ε
     <ArgSymbol> ::= <Symbol>
          <Body> ::= <BodyTerm> ※ <Body_>
         <Body_> ::= <BodyTerm> ※ <Body_> | ε
      <BodyTerm> ::= <Term>
         <Quote> ::= ' ※1 <QuoteTerm> ※2
       <Unquote> ::= , ※1 <UnquoteTerm> ※2
    <Quasiquote> ::= ` ※1 <QuasiquoteTerm> ※2
     <QuoteTerm> ::= <Term>
   <UnquoteTerm> ::= <Term>
<QuasiquoteTerm> ::= <Term>
        <Symbol> ::= ※ SYMBOL

解析时数据结构：
节点栈、状态栈

解析动作：
      <SList>  pushSList(quoteType) 向节点栈内压入一个新的SList，其中quoteType从状态栈栈顶取得。
   <SListSeq>  从节点栈顶弹出节点，追加到新栈顶节点的children中。
     <Lambda>  pushLambda() 向节点栈内压入一个新的Lambda，忽略状态。
   <ArgList>1  {Parameter}压状态栈。
   <ArgList>2  退状态栈。
 <ArgListSeq>  从节点栈顶弹出节点（必须是符号），追加到新栈顶Lambda节点的parameters中。
       <Body>  从节点栈顶弹出节点，追加到新栈顶Lambda节点的body中。
      <Body_>  从节点栈顶弹出节点，追加到新栈顶Lambda节点的body中。
    <*Quote>1  {*QUOTE}压状态栈。
    <*Quote>2  退状态栈。
     <Symbol>  pushSymbol(s, quoteType) 符号压栈：QUOTE和QUASIQUOTE压栈为's，UNQUOTE压栈为新节点(unquote s)

function isSymbol(token) {
    if(/[\s\(\)\[\]\{\}]/gi.test(token)) { return false; } // 不允许包含的字符
    if(/^[0-9\'\`\,]/gi.test(token)) { return false; } // 不允许开头的字符
    return true; // 其余的都是词法意义上的Symbol
}
```

## 准引用列表的处理/20190331

+ 只允许单层qq和uq，不允许嵌套多层
+ (quote ..)和(quosiquote ..(unquote ..)...)的处理，移到AST后处理中进行

```:Scheme
(define y 100)
(define qq `((x ,y) ,(+ 1 y) z))

;; 简写的qq经预处理（在parse之前）：
(quasiquote '((x (unquote y)) (unquote (+ 1 y)) z))

;; 上面这句应该被编译成立即执行的thunk，以保证qq的词法作用域特性：
((lambda ()
  (cons (cons 'x (cons y '()))
    (cons (+ 1 y)
      (cons 'z
        '())))))

((lambda (x y z)
  (display qq)) 777 888 999)

;; 应该输出'((x 100) 101 z)而不是'((x 888) 889 z)
```

## 模板字符串（分析时预处理，执行时使用native字符串库）/20190331

```:Scheme

;`XXX${var}YYY`
;预处理后被转换为：
(native String)
(String.concat (cons "XXX" (cons var (cons "YYY" '()))))
;; 如果实现了qq，则
(String.concat `("XXX" ,var "YYY"))
;; 等效于
(String.concat (quasiquote '("XXX" (unquote var) "YYY")))
```


## 字典（通过native机制实现）/20190331

```:Scheme
(native Dict)

Dict.new       kvQq
Dict.keySet    dict
Dict.get       dict  key
Dict.set       dict  key  value
Dict.iterate   dict  callback
Dict.toJson    dict
Dict.parseJson string

;; 需要实现qq
(define test
  (Dict.new `(
      (key1  ,value1)
      (key2  ,value2)
      (key3  ,value3))))

;; 需要实现完整的ANI（JS调Scheme）
(Dict.iterate test
  (lambda (key value dict)
    (display value)))

(Dict.keySet test)       ;'(key1 key2 key3)
(Dict.get test key1)     ;value1
(Dict.set test key2 xxx) ;#SET-VALUE

```



# 语义分析


## 关于静态作用域实现/20190331

在使用丘奇编码用例进行测试的时候，发现在执行以下代码时，会出现无限循环的错误：

```:Scheme
(define SHOWNUM
  (lambda (n)
    (n (lambda (x) (+ x 1)) 0)))

(define <0> (lambda (f a) a))
(define <1> (lambda (f a) (f a)))
(define <2> (lambda (f2 a2) (f2 (f2 a2)))) ; 闭包2
(define <3> (lambda (f a) (f (f (f a))))) ; 闭包3

(define INC
  (lambda (n) ; 闭包A
    (lambda (f a) ; 闭包B
      (f (n f a)))))

;; 求值此表达式会出现无限循环
(SHOWNUM (<2> INC <3>)) ;实际上就是(ADD <2> <3>)
```

在a56ccd4提交之前，静态作用域采用简单策略实现，即：创建新闭包时不继承自由变量，使用时上溯闭包链查找自由变量。这样做的好处是速度快、且可以满足`set!`的需要，因`set!`对变量的改动，是要传染到所有派生闭包的。如果每个闭包都不保存自由变量，那么在执行`set!`的时候，也就无需“传染”这个过程了。

但这是不对的，错误就在上面这段代码中暴露出来。

执行`(<2> INC <3>)`时，由`INC`生成的`闭包A`，以及由`<3>`生成的`闭包3`，被传入`<2>`，分别被保存到`闭包2`的`f2`和`a2`变量中。

在执行`<2>`的`(f2 a2)`时，生成`闭包B`且被返回。在以往的实现中，其自由变量`n`=`闭包3`，是被保存在`闭包A`的。

继续执行外层的`(f2=闭包A 闭包B)`，则`闭包A`的变量`n`被修改为`闭包B`，**这就导致`闭包B`的自由变量`n`失去了它原本应该自己保存的`闭包3`，导致执行`闭包B`内部的`(n f a)`的时候，使自己陷入无限递归。**

因此自由变量绑定是必须保存在闭包内部的。

新实现借鉴Lua的命名“upvalue”，将自由变量绑定保存在闭包的upvalue字段中。由于每个闭包都保存了从上位闭包继承的绑定，这会给`set!`的实现带来麻烦。因此，新实现中，采用以下方法实现：

- 凡是被`set!`改动过的约束变量，会在值的最后加上脏标记“!”；
- 变量解析时，并不立即返回upvalue中的绑定，而是继续上溯闭包链，如果发现上位闭包中的值带有脏标记，说明此变量被`set!`修改过，就应当采用上位闭包中的值。

为什么上溯闭包这个行为也是静态作用域的实现？因为编译阶段已经消除了所有可能导致作用域覆盖的变量命名，保证每个变量的名称都是全局唯一的，因此只要是能够在闭包中找到的绑定，必然是词法作用域的。沿着闭包链查找，则在满足词法作用域的前提之下，满足运行时的时间-因果顺序，换句话说，能够保证“现在”所需的值是最新的（而不是在别的无关闭包中被修改）。这样就满足了绑定的时空两方面的唯一性。



## 尾位置分析和尾调用优化

发生在尾位置的递归调用，称为**尾递归**。R5RS中给出了尾位置的归纳定义。MikuRec在解释执行前，会对AST进行扫描，检测出尾递归并加以标记，在执行时进行尾递归优化。

此外，可以利用 MikuRec 提供的`while`循环，使用一种称为“[蹦床](https://en.wikipedia.org/wiki/Trampoline_\(computing\))”的方法，实现手工的尾递归优化。








# 中间代码生成


## 实例分析

实例1：阶乘

```:scheme
(define fac
  (lambda (n)
    (if (= n 0)
        1
        (* n (fac (- n 1))))))
(fac 3)
```

语法分析后得到的AST：

```
L0: [], [A0, A1]
A0: define, fac, L1
L1: [n], [A2]
A2: if, A3, 1, A4
A3: =, n, 0
A4: *, n, A5
A5: fac, A6
A6: -, n, 1
A1: fac, 3
```

对AST作语义分析、变量换名等工作：

```
L0: [], [A0, A1]
A0: define, L0.fac, L1
L1: [L1.0], [A2]
A2: if, A3, 1, A4
A3: =, L1.0, 0
A4: *, L1.0, A5
A5: L0.fac, A6
A6: -, L1.0, 1
A1: L0.fac, 3 (tailcall)
```

将处理后的AST编译为AIL指令序列：

```
@MAIN ;; 程序入口
tailcall @L0

@L0
push     @L1
store    L0.fac
push     3
tailcall L0.fac

@L1
store    L1.0
load     L1.0
push     0
eq
iftrue   @IFTRUE_0
load     L1.0
load     L1.0
push     1
sub
call     L0.fac
mul
goto     @ENDIF_0
@IFTRUE_0
push     1
@ENDIF_0
```










# 虚拟机架构



## 栈式机器模型介绍

栈式机器模型是一种使用操作数栈而非寄存器来传递操作数的机器模型。

栈式机器的指令不需要或者只需要很少的操作数，因此平均指令长度较短，但另一方面，指令的条数比较多。由于操作数栈实际上是部署于内存的，因此栈式机器的性能要稍逊于寄存器机器。尽管牺牲了硬件寄存器带来的高性能，却换来了通用性。作为虚拟机，它将物理机器的架构隐藏起来，通过栈式机器这一层抽象，提供机器无关的虚机指令集，实现应用代码的可移植性，这就是Java自称的“一次编码，到处执行”的理论基础。

相比于寄存器机器，栈式机器的编译器不需要考虑寄存器分配、指令相关之类的复杂问题，所以编译器的实现比较简单。JVM是最具有代表性的栈式机器，这次设计的VM，很大程度上参考了JVM的设计。本次设计的VM，具有操作数栈、调用栈两个运行时栈，所有数据操作，均直接针对操作数栈进行，再通过转移指令，实现栈与内存的数据交互。

除操作数栈外，VM可以访问的内存区域还有：**函数调用栈**、**闭包区**、**堆区**、**静态资源池**、**资源映射表**，以及其他内存区域。

- **函数调用栈**保存函数调用的活动记录，与不支持一等函数的虚拟机相比，本VM的栈帧并不存储局部变量，只会引用函数调用时所处的闭包。
- **闭包区**可以理解为JS的栈区，但本质不同。闭包区保存运行时生成的所有闭包，闭包之间相互链接，形成树状的作用域嵌套关系。闭包作为一种运行时产生的值，可以被引用、保存、调用，同时闭包的内部保存了所有变量的绑定。
- **静态资源池**保存了程序中所有出现的列表、Scheme源代码（代码就是列表）、符号、值等静态资源，在模块加载时被加载到内存。
- **堆区**保存运行时生成的列表、字符串等大对象，在列表中，需要使用“引用”去引用已经存在于静态资源池和堆区的资源。堆区和静态资源池应当是统一编址的。
- **资源映射表**维护引用和静态资源池/堆区实际地址的映射关系。随着运行时临时表的建立，此表也将随之更新。列表被GC清理掉的时候，此表也相应地更新。

当提到“变量”这个词的时候，指的是存储于当前闭包或者上位闭包中的变量-值绑定。如果值是基本数据类型，例如数值和布尔值，则直接存储在闭包的绑定中；如果值是引用、闭包编号，则被引用的资源分别存储在静态资源池、堆区、闭包区中，引用编号和堆区地址的映射关系，由资源映射表维护。

本VM的设计目标是为Scheme这类函数式语言提供运行时环境，因此VM从一开始就支持一等函数和闭包。具体而言，与普通的机器不同，本VM将函数所在的指令地址当做值传递，类似于C语言的函数指针。但不同的是，VM内部会适可跟踪程序的运行时环境，并且为函数创建闭包示例。函数调用的本质，并非简单的栈帧入栈退栈，还涉及闭包的生成和作用域环境的切换。

递归是编程语言的核心能力。函数式语言一般使用递归实现循环，一旦循环次数较多，将耗尽调用栈。但是，发生在尾位置的递归调用，可以被优化成不需要耗费调用栈空间的尾调用过程，这称为尾调用优化。尾调用优化是R5RS标准中要求实现的特性，因此本VM提供了单独的尾调用指令。

函数式语言往往是动态语言，即值的类型是由值自身决定，并非由变量限定。因此，与JVM指令集不同，本VM并没有明确针对数据类型的指令，所有指令内部会进行最终的类型检查/隐式转换。如果要实现强类型语言，则类型检查和推导工作应当在编译期完成。

函数式语言在运行时会产生大量的垃圾对象，如果不及时清理，很容易发生内存泄露。但是，函数式语言抽象层次较高，难以提供也没有必要提供对内存的操控手段，因此必须由虚拟机在运行时自动扫描垃圾对象，并加以清除、回收。垃圾回收的具体细节还没有开始考虑。


## AVM指令集

|助记符|参数|:说明|
|------------------|
|store|VAR|将opstack栈顶的值保存到当前闭包的约束变量中|
|load|VAR|解引用变量：若值为LABEL，则构建新闭包，并将闭包的把柄压栈；否则将值压栈|
|set|VAR|以opstack栈顶的值改写某变量|
|push|LIT/HDL/LBL|压栈|
|pop|-|退栈并抛弃|
|swap|-|交换栈顶两个元素的顺序|
|newclosure|LBL|构建新闭包，并将其把柄压栈|
|call|VAR/HDL/LBL|调用函数、闭包或者续延|
|tailcall|VAR/HDL/LBL|尾调用|
|native|VAR|调用本地函数|
|return|-|函数返回|
|newcc|VAR|捕获当前续延，并将其把柄保存在变量中|
|iftrue|LBL|栈顶为真则跳转|
|iffalse|LBL|栈顶为假则跳转|
|goto|LBL|无条件跳转|
|newlist|-|创建新列表，并将其把柄压栈|
|getli|-|取列表项|
|setli|-|设置列表项|
|newmap|-|创建新哈希表|
|getmi|-|取哈希表项|
|setmi|-|设置哈希表项|
|add...|-|算术逻辑运算|
|fork|?|新进程|
|read|LIT|读端口|
|write|LIT|写端口|
|nop|-|空指令|
|halt|-|停止进程|


## 指令的工作层次

在AuroraScheme中，**执行机**（Executor）是一个特殊的模块。执行机吃进去一个进程，根据进程内部的状态去修改进程的内容，然后再给它吐出来。过程中可能会与运行时环境发生交互，例如读写共享内存，执行网络收发等等。

执行机就像流水线上的工人，它只能修改进程内部的程序执行路径，无法控制自己吃什么进程。

执行机吃什么进程，这是由**调度机**（Scheduler）决定的——调度机凌驾于所有进程之上，根据众进程的状态、优先级等信息，按照一定的调度策略，按照一定的工作节奏，每个节拍选择一个进程，喂给执行机。执行机按照运行时系统确定的工作节律，每拍吃一个进程，并且在**有限**的时间内完成一拍工作。

执行机每拍会解释执行一条或者多条指令。指令是Scheme可以看到的虚拟机的最基本的功能单位。虚拟机的指令集，与Scheme的能力是处于同一层次的。虚拟机指令是Scheme语义的原子化实现。执行机每执行一条指令，完成的工作可能不止一条指令。按照指令的粒度、原子性和可访问资源的多寡，指令分为三类：

- 普通虚机指令。普通指令本质上是**虚拟机接口**（VMI）的封装，对于Scheme这个层次而言是原子化的操作。每个普通指令必定会在一个执行机节拍内执行完毕，不可分割，不可中断。
- 宏指令。功能上，宏指令是多条指令的组合，但是在指令集层次上，表现为一个宏指令调用。尽管宏指令完成多条指令的功能，但也必须在一个执行节拍内执行完毕，是原子的。设置宏指令这个抽象层次，是为了方便虚拟机的功能扩展。
- 本地库函数。本地库函数在指令集中体现为`callnative`指令，但是它的执行并不是原子的，可能需要多个不连续的执行机节拍才会执行完成。因为有的操作涉及外部资源的使用，往往需要等待，导致进程阻塞或睡眠；也有的操作需要调用回调函数，在内部跳转到别的地方，然后再跳转回自身，甚至多次跳出跳回。这就是说，某些操作本质上就不是原子的，需要分成若干个时间上不连续的阶段去执行，但又不能简单地使用指令或者宏指令去实现，因为其内部可能涉及与调度机和运行时环境的通信，而这是指令和宏指令无法做到的，必须使用VMI层次的接口去实现。

本地函数机制，可以对比Java的JNI机制。

那么从实现的角度看，不论是普通虚机指令，还是本地函数，都需要对虚机环境，也就是进程和运行时（调度机）进行操作，例如文件系统，例如网络I/O，例如内存分配，例如压栈退栈，等等。这些操作以虚拟机接口（VMI）的形式予以提供，可以对虚拟机进行完全的控制。

按照功能，AuroraScheme将VMI分别实现为两个类的原型函数，即进程类Process和运行时类Runtime。这个划分体现了虚机指令和本地函数的区别，即虚机指令只调用Process提供的VMI，处理进程内部的执行逻辑，而本地函数还需要调用Runtime提供的VMI，一方面处理抽象外设访问，另一方面需要干预调度机的行为。

下面举例说明各类指令的实现思想。以下代码调用了本地函数，打开一个文件并将其打印出来：

```:scheme
(File.open
    "data.txt"
    (lambda (content)
      (display content)))
```

编译为指令序列为：

```
@Test.main
push *1
load @Test.Anonymous.1
callnative File.open
halt

@Test.Anonymous.1
store &100
load &100
display
return
```

执行机一方面在调度机的控制下，以每拍一个或多个指令的节奏执行上述代码；另一方面在代码本身的逻辑控制下，决定程序的执行路径，乃至进程的状态。

以指令`load @Test.Anonymous.1`为例，此指令调用了多个虚拟机接口，完成了一系列动作，伪代码如下：

```:javascript
// 取指令参数（@Test.Anonymous.1）
let arg = GetInstArg(currentInst);
// 判断指令参数类型（程序标签）
if(TypeOfArg(arg) is "LABEL")
// 解析标签为代码地址（5）
let instAddr = PROCESS.ParseLabel(arg);
// 构造新闭包并取得把柄（例如^8）
let hdClosure = PROCESS.NewClosure(instAddr..);
// 将闭包把柄压入操作数栈
PROCESS.PushOperand(hdClosure);
// 程序流程控制（PC加一）
PROCESS.Step();
```

以上流程可以在一个执行机周期内完成，是原子的。但是，诸如网络I/O、临界资源访问等操作，往往需要等待，且等待的时间不可预期。因此需要调用VMI去干预调度机的行为，以实现本地函数对自身执行阶段的控制。

在AuroraScheme的运行时环境中，有一个目录用来保存所有的本地库，每个本地库都由一个js模块实现，每个模块里面实现若干个本地函数。`callnative`指令是所有本地库函数的统一入口和分派器，它可以动态地载入本地库的JS模块并执行。`callnative`的执行逻辑是：

```:javascript
// 根据操作数栈中的arity，提取相应数量的参数
// 根据本地库名，动态引入本地库对应的js模块
// 执行本地库函数
// 结束
```

在上面的例子中，`File.open`可以同步地（或者异步地）打开一个文件，并使用文件内容调用回调函数。这个例子可以演示本地库函数可以做到的，但是普通指令所无法做到的三方面工作：

- 文件系统访问
- 同步或异步操作的调度逻辑
- 回调函数，包括两个子问题：一是在原进程执行完毕后也能保证回调在异步操作完成时被执行，二是回调的入口和出口是在单个指令内部的，也就是亚指令粒度的函数调用机制。（需要综合考虑call/cc的实现）

本地函数与虚拟机指令的实现，都需要调用VMI。只不过，虚拟机指令的实现是作为运行时的一部分，被写死在虚拟机中，而本地函数的实现，是插件化的，可以由第三方开发者开发，从而扩展AuroraScheme的功能。

在说明`File.open`的实现之前，我们先理清它的运行逻辑，重点抓住上面的三个问题。此函数由于涉及I/O操作，因此设计上可以分成同步和异步两类。同步会阻塞当前进程，而异步不会阻塞进程。无论是同步还是异步，都需要在操作尚未完成时释放执行机，然后在操作完成时另行触发后续的动作，例如调用回调函数等等。具体的执行逻辑如下：

- 进程获得时间片，执行机开始执行`callnative File.open`指令。
- 按照前文所述的逻辑，调用本地库模块File.js中定义的`open`函数。
- 函数`open`首先检查当前进程状态：
-- 如果是睡眠状态，则直接返回，释放执行机，不修改PC。
-- 如果是运行状态，则访问文件系统端口，并注册JS回调函数。
- 进程状态设置为“睡眠”状态，释放执行机，不修改PC。

经过一段时间后，文件访问完成，JS回调函数被执行：

- 检查当前进程的状态：
-- 如果当前进程已经执行完毕：
--- 文件内容入栈。
--- 执行虚拟机指令`call callback`和`halt`，其中`callback`是回调函数。这里用于执行虚拟机指令的过程，是被封装好的虚拟机指令实现，或者是被封装好的“在线指令解释器”（如`Process.execute(inst)`等等）所执行。调用`halt`的目的是在回调执行完毕后结束进程，因为当前进程早已执行完毕了。
--- 将当前进程加入调度器的就绪队列中。
--- 重新启动调度器时钟。
-- 如果当前进程仍在执行：
--- 文件内容入栈。
--- 执行虚拟机指令`call callback`，其中`callback`是回调函数。
--- 将当前进程加入调度器的就绪队列中。
--- 重新启动调度器时钟。

从上面的流程来看，这实际上就是某种形式的中断的实现。

## load和store

`load`指令将变量的值压入操作数栈，`store`指令将操作数栈中的值存入变量。这两个指令在变量与操作数栈之间移动数据，是最常用的指令。这两个指令都带一个参数，参数必须是变量引用。

`store`与`set!`是截然不同的。`store`仅针对当前闭包进行操作，并且能够创建新的绑定，这意味着，`store`指令基本上只会用在两种场景：①define特殊形式；②函数调用时将实参从栈转移到闭包中。

`load`指令的执行流程是：

+ 从当前闭包开始，沿闭包链上溯至变量绑定所在的最近闭包，从这个闭包获取变量绑定的值。
++ 如果直到根节点也没有找到绑定，则抛出虚拟机错误。
++ 如果值是指令地址，则基于当前环境生成新闭包，得到新闭包的编号，将闭包编号压入操作数栈。
++ 如果值是列表引用、字符串引用、符号引用、常量引用和整型立即数，则直接将值压入操作数栈。
+ PC++

`store`指令的执行流程是：

+ 弹出操作数栈栈顶的值。
+ 在当前闭包中，修改或者建立变量-新值的绑定。
+ PC++

## push、pop和swap

这三个指令是直接操作操作数栈的指令。`push`指令可以将值压入栈，`pop`弹出栈顶的值并丢弃，`swap`可以交换栈顶的两个元素。

`pop`和`swap`无参数，`push`指令带一个参数，参数的类型可以是以下几种：

+ 指令标签（如`@label`）
+ 列表引用（如`$666`）
+ 字符串引用（如`*666`）
+ 符号引用（如`'666`）
+ 常量引用（如`#666`）
+ 32bit立即数（如`123.45`）

在字节码中，这些参数都会被转换成4字节的定长格式，即32位无符号整型数，其中指令标签会被转换成指令地址，格式见上文。

`push`指令的执行流程是：

- 如果参数是指令地址，则基于当前环境生成新闭包，得到新闭包的编号，将闭包编号压入操作数栈。
- 如果参数是资源引用或者立即数，则直接入栈。
- PC++

## call和return

这两个指令用于处理自定义函数调用和返回。`return`不带参数，`call`带一个参数，参数类型限定为：

+ 指令标签（如`@label`）
+ 变量引用（如`&666`）

`call`的执行流程：

- 新栈帧入函数调用栈，其主调闭包字段为当前字段，返回地址为当前指令地址的下一条（即PC+1）
- 如果参数是指令地址，则
-- 基于当前环境生成新闭包
-- 当前闭包设置为新闭包
-- PC设置为指令地址
- 如果参数是变量引用，则从当前闭包开始，沿闭包链上溯至变量绑定所在的最近闭包，从这个闭包获取变量绑定的值。
-- 如果值不是闭包编号，则抛出虚拟机错误。
-- 否则，将当前闭包设为此闭包，PC设置为此闭包指定的指令地址。

`return`的执行流程：

- 弹出函数调用栈栈顶的帧F
- 当前闭包设置为F保存的主调闭包地址
- PC设置为F保存的返回地址
- 析构F

## tailcall

此指令专门用于尾递归调用。相比于`call`指令，`tailcall`不会压入新栈帧，也不会创建新闭包，本质上是一个跳转指令。手写汇编时，要注意不要与`call`指令混淆。

`tailcall`带一个参数，要求与`call`相同。`tailcall`的执行流程是：

- 如果参数是指令地址，则
-- PC设置为指令地址
- 如果参数是变量引用，则从当前闭包开始，沿闭包链上溯至变量绑定所在的最近闭包，从这个闭包获取变量绑定的值。
-- 如果值不是（闭包编号或者指令地址），则抛出虚拟机错误。
-- 否则，将PC设置为指令地址或者闭包指定的指令地址。

[[#0000ff:TODO：这里可能有错，需要进一步检查。#]]

## set!

`set!`用于修改**已有的**变量绑定。与`store`仅针对当前闭包进行操作不同，它会沿着闭包链上溯到变量绑定所在的闭包，用新值替换掉旧值。对于函数的递归调用来说，这种情况下同一变量在闭包链上会出现多次，那么`set!`只会修改最近的闭包内的绑定。`set!`带一个参数，参数必须是变量引用。其执行流程如下：

- 从当前闭包开始，沿闭包链上溯至变量绑定所在的最近闭包。
-- 如果直到根节点也没有找到绑定，则抛出虚拟机错误。
-- 从操作数栈弹出栈顶的值，使用此值修改闭包内原有的绑定。
- PC++

## 虚拟机控制指令

- `halt`指令会立即终止虚拟机的运作，返回宿主环境。从语义上来讲，`halt`代表正常退出。
- `enablewd imme`指令用于启用看门狗，并设置定时器周期。
- `disablewd`指令用于禁用看门狗，VM默认禁用看门狗。
- `feedwd`指令用于喂看门狗。






# 模块管理



## 模块机制

- 所有名称区分大小写。
- 每个Scheme源码文件都是一个模块（module）。
- 每个模块都有名称。模块分为**全限定名**和**非全限定名**（径称“**模块名**”）两种。
- 项目源码目录名称必须是`source`。
- 从`source`目录开始的子目录称为**包**。
- 模块全限定名的格式是`包名.包名.….模块名`。例如`aurora.lib.web.http`。
- 模块名在源码文件第一个有效代码行指定，格式为`(module <模块名>)`。
- 源码文件名必须与模块名保持一致。

- 模块可以引用其他模块。
- 引用方法有两种：
-- 直接引用：在**顶级作用域**需要的位置写`(import <模块名或全限定名>)`；调用模块时，必须使用与import语句中使用的名称相一致的名称作为模块名，即import中如果用全限定名，则代码中也要使用全限定名。
-- 别名引用：在**顶级作用域**需要的位置写`(import-as <模块名或全限定名> <模块别名>)`；调用模块时，可以直接使用自定义的模块别名。模块别名被视为主引模块的全局符号。
- 若被引模块与主引模块位于同一包内，使用模块名或全限定名均可引入被引模块。如果不在同一包内，则必须使用全限定名引入。特别地，如果引用了多个模块名相同的外部模块，则在代码中引用这些模块时，必须使用全限定名或者别名。
- 模块间不应出现循环依赖，否则编译器会拒绝编译。

实现思路：根据模块间的依赖关系，划定命名空间及其包含关系，通过符号重命名的方式，统一命名空间。

从命名空间嵌套的角度看，项目中的每一个模块作用域符号都有唯一的全限定名称，例如定义在`aurora.lib.web.http`中的函数`get`，它的唯一全限定名称就是`aurora.lib.web.http.get`。由于全限定名是不冲突的，且模块作用域符号也是不冲突的，所以这个名字是唯一的。为了保证这种点分隔的名称①不被用户覆盖掉，从而使得全限定符号在任何作用域均可使用，②扰乱点分隔形式的全限定名的包层次语义，规定：**不得定义带有点号的符号**。

但实践中，使用全限定名访问其他模块的符号是很不方便的。因此，提供了模块别名机制，由编译器将模块别名替换为被引用模块的全限定名，并保证命名空间一致。注意，别名不是符号，不可以被其他模块使用，别名只是用于编译时代码替换的宏机制。

+ 首先分别检查每一个模块内部的引用别名之间是否有冲突。
+ 建立依赖关系图（有向图）。
+ 检查依赖关系图中是否存在环路，如果有环路，则拒绝编译。否则继续。
+ 针对每个模块：
++ 将模块内所有模块级符号及其出现，全部替换为全限定名形式。
++ 根据`import`语句，将模块内所有出现的对外部模块的引用，替换为全限定名形式。
++ 根据`import-as`语句，将模块内所有出现的以别名对外部模块的引用，替换为全限定名形式。

以下是一个例子：

```:scheme
;; 标准库模块：提供了display的定义
(module aurora.lib.io)
;...
(define display
  (lambda (arg) [native-code] ))
;...

;; 模块：中华全国人工智障联合会开发的聊天机器人
(module org.caia.chatbot)
(import aurora.lib.io)
(define ask
  (lambda (question)
    (io.display "你问的问题是${question}")
    "哦。"))

;; 模块：为了证明人类的本质是复读机
(module me.miku.crawler)
(import aurora.lib.io)
(import org.caia.chatbot CBOT)
(define repeater
  (lambda ()
    (display (CBOT.ask "你是谁？"))
    (repeater)))
(repeater)
```

现在开始对整个项目进行链接。链接生成的代码为：

```:scheme
(define aurora.lib.io.display
  (lambda (arg) [native-code] ))

(define org.caia.chatbot.ask
  (lambda (question)
    (aurora.lib.io.display "你问的问题是${question}")
    "哦。"))

(define me.miku.crawler.repeater
  (lambda ()
    (aurora.lib.io.display (org.caia.chatbot.ask "你是谁？"))
    (me.miku.crawler.repeater)))
(me.miku.crawler.repeater)
```

然后就可以拿去编译了。


## 模块文件(字节码)布局

- 统一采用大端模式。
- 每一个字节码文件，都表示一个模块，使用独立的命名空间。
- 模拟JVM类文件，各个区段之间无分隔符，分为以下区段：
-- 模块元数据区
-- 静态资源池
-- 资源映射表
-- 代码区（经编译的字节码）

**模块元数据区**

|地址(Hex)|内容或示例|说明|
|-----------------------|
|00-07(8B)|AURORAVM|幻数|
|08-0B(4B)|0301|运行时版本（最长12B）|
|0C-0F(4B)|0100|模块版本|
|10-1F(16B)|201901290800+800|编译时间|
|20-21(2B)|0x0012(18d)|模块全名长度(nB)|
|22-(nB)|Aurora/Lang/String|模块全名|

**静态资源池**

静态资源，是源代码中出现的所有字符串、符号常量、变量或者过程/函数名称、常量、以及列表和源代码本身。这些数据并不会以原形出现在汇编代码和字节码模块文件中，而是统一存储在静态资源池区域。在汇编代码和列表中，每一个静态资源的实例，都可以通过**引用**去获得它们的原形/值。在字节码中，静态资源池会被装载到内存，所有的“引用”都会被翻译为静态资源池中的偏移地址。静态资源池偏移地址与引用的映射关系，保存在模块文件的**资源映射表区域**（下节详细说明）中。

例如，源代码中有字符串“Hello”，经过编译后，“Hello”被编入静态资源池中相对于资源池起始位置偏移123字节的位置，并且被分配引用`*666`。那么，在汇编代码中，所有需要“Hello”的地方，实际上都是`*666`。而汇编代码被翻译为字节码之后，所有`*666`都会被定长（3B）的静态资源池偏移地址“123”替换。为了建立引用`*666`和偏移量“123”的关系，模块文件需要保存每一个静态资源引用与其在资源池中实际存储位置的偏移量的映射关系，这就是**资源映射表**。这个变换可以表示为：

: **“Hello”** ←存储在→ **偏移量123** ←对应→ **引用`*666`**

静态资源在资源池中顺序存储，同一类型的不需要聚集在一起。资源池最前面4个字节用于指明资源池长度，用于区域定界。模块文件加载时，资源池会被整体加载到内存中，通过静态资源映射表提供的偏移量信息，定位具体的资源所在的位置。每种资源的长度，由其类型和内容所确定。

|地址(Hex)|内容或示例|说明|
|-----------------------|
|00-03(4B)|-|静态资源池长度(nB)|
|04-(nB)|-|静态资源池|

静态资源有五类，在汇编代码和经过编译的列表中，采用“引用”表示。引用分为前缀和编号两部分，前缀是用来区分类型的符号，后面紧跟十进制数字的编号，表示对应类型的第n个实例。具体格式如下：

|类型|简记|引用格式|存储格式|
|----------------|
|字符串|S|`*n`|UTF-8编码，无结束符和分隔符|
|符号|M|`'n`|同字符串|
|变量|V|`&n`|同字符串|
|常量|C|`#n`/`#t`/`#f`|数值以字符串存储|
|列表|L|`$n`|见下|

列表是Scheme的核心数据结构，也是VM唯一原生支持的复合数据结构。静态资源池中的列表不仅是数据，也是程序源代码本身。

列表分为三种：

- S列表（S-List），类型编码0
- 函数定义（Lambda），类型编码1
- Q列表（引用列表，Quoted），类型编码2

列表拥有0个或多个元素，每个元素都可能是下列四种类型之一：

- 字符串（的引用）
- 符号（的引用）
- 常量（的引用）
- 其他列表（的引用）

列表并不直接存储元素的字面值，所有元素都是以引用形式存储。[[#0000ff:（TODO：这种设计尽管通用性好一点，但性能是很低下的。对于24bit以内的数值和布尔值，其实完全可以内联。）#]]

注意：列表的元素中暂时没有变量类型，因目前实现的Scheme暂时不支持准引用和模式匹配。

每个元素（引用）在列表中存储时，都占据4B空间。其中第一个Byte存储引用的前缀符号，用于区分类型；其余3个Byte用来存储编号，使用二进制存储，编号范围0~0xFFFFFF。字段格式如下：

|字段长度|说明|
|--------|
|4B|列表标识和类别编码<br>FFFFFF(00/01/02)|
|4B|列表编号|
|4B|上级列表编号|
|4B|Length<br>（Lambda和空表此项为0）|
|4B|Arity<br>（仅Lambda）|
|4B|Body<br>（仅Lambda，其余填ffffffff）|
|4B|保留字段1（填0）|
|4B|保留字段2（填0）|
|nB|元素序列，每4B为一个元素引用<br>（Lambda没有此项）|

**资源映射表**

资源映射表，用于建立资源引用与资源在资源池中的偏移之间的关联。这张表在编译（从汇编到字节码模块文件）时建立，模块加载时被整体载入内存。在字节码指令中，静态资源直接通过出现在参数上的静态资源区偏移访问，但是涉及表的子表的操作，就需要在运行时访问并更新这张表。

**代码区**

- 指令分为两类：不带参数的指令和带一个参数的指令。
- 所有指令都使用一个字节编码。
- 参数使用4个字节进行编码。参数只能填入**引用**、**指令标签（地址）**或者**32bit的立即值（含数值、布尔和VM预定义的枚举）**。引用参数的第一个字节是一个ASCII字符，用于注明引用类型；其余3个字节是引用的编号。
- 指令地址与引用类似，在汇编程序中是以形如`@label`的标签存在，经汇编器汇编后，作为字节码指令的参数，变成4字节的指令地址，形如"@ xx xx xx"，其中xx是24位的指令绝对地址。














# 数据模型和内存管理

数据模型：指称涵义模型

20200722 推文：
关于Animac的一些笔记。
数据的生命周期问题。
阶段：源码→编译时→AIL→运行时
各类数据盘点：
Literal在全生命周期是保持不变的，是原子的。其语义在运行时层面才被解释。
与Literal相对的是Handle。
List、String有两类，一类是出现在源码中的，另一类是动态生成的。二者同等对待，并无静态动态之分。
待续
Label经AST被编译为AIL指令后产生，本质上是AIL指令地址。出现在AIL指令中，由call/tailcall解释为闭包或续延。Label、Closure/Cont和Lambda之间有对应关系。
Closure、Cont仅在运行时出现。
Variable是AST中出现的所有变量经词法作用域分析后得到的全局唯一标识，本质上是 de Bruijn 表示。
语言实现还是相当复杂的。
如果把之前所有的考虑都落实到文字上，可能就是一本《深入理解Java虚拟机》那么厚的专著了。

## 数据类型和数据结构

- 在Scheme的层次上看，有数值、布尔、枚举、符号、字符串和列表六种数据类型。其中列表是符合数据类型，其元素可以是六种类型中的任何一种。
- 在汇编的层次上看，有资源引用、指令标签和立即值三种数据类型。其中，资源引用又分为字符串引用、符号引用、变量引用、常量和枚举引用、列表引用五种。运行时的变量和符号的地位是不同的，因此汇编层面上需要加以区分。立即值分为数值和布尔值两种。在汇编层次上，包括立即值的所有值都是基于字符串的。
- 在字节码和运行时的层次上看，有资源引用、指令地址、闭包编号和立即值四种数据类型。资源引用是汇编资源引用的int32版本，运行时会通过资源映射表，在堆或者静态资源池中找到对应的原始值。指令地址是将汇编代码中的指令标签换算成指令地址的int32版本。闭包编号仅出现在运行时，对程序员是不可见的，格式为int32。立即值仅作为数值，使用32bit IEEE754格式存储。数值0解释为布尔值`#f`，非0值解释为布尔值`#t`。

## 数据的分类

总的来说分成4大类：**Object对象**、**Literal字面值**、**Handle把柄**和**Variable变量**。

**Object**（对象）存储在Heap中，包括：

- List（编译时静态分配把柄）
-- Lambda 匿名函数声明。
-- Application 一般的表，语义上是函数调用或特殊结构（如cond等）。
-- Quote
-- Quasiquote
-- Unquote
- String（编译时静态分配把柄）
- Closure (Lambda的运行时实例)
- Continuation (由call/cc在运行时建立)

**Literal**（字面值）出现在Scheme源码、AST节点、AIL指令码、OpStack、闭包变量绑定中，包括：

- Symbol 符号
- Number 数值
- Boolean 布尔值
- Port 端口

**Handle**（把柄）就其性质而言也是一种字面值，只不过它对语言用户不可见。Handle用于建立Object与堆地址之间的映射。

**Variable**（变量）用于在闭包中建立变量-值的绑定关系。代码中的变量，经语法分析前存在词法作用域的特性，但是经过分析后，将不存在任何同名变量覆盖的问题，因此每个变量都是全局唯一的。此处的“变量”即指经过分析后得到的全局唯一的变量标识符。

例如，以下代码

```
(lambda (x y)
  (lambda (x) (x y z)))
```

将被解析为：

```
(lambda (&1 &2)
  (lambda (&3) (&3 &2 &4)))
```

这里的`&1`、`&2`、`&3`、`&4`是变量，`x`、`y`、`z`不是。

每一个变量标识符的出现都全局唯一地对应一个变量。但是闭包内部必须区分变量标识符的约束出现和自由出现，因为涉及set!所引入的副作用问题。

## 数据的时空特性

数据的时空特性，指的是数据的生命周期，以及存储位置。

各数据类型的生命周期总结如下：

|            |源码|编译时|AIL|运行时|
|----------------------------------|
|        List|x|o|o|o|
|      String|x|o|o|o|
|     Closure|x|x|x|o|
|Continuation|x|x|x|o|
|     Literal|o|o|o|o|
|      Handle|x|o|o|o|
|    Variable|x|o|o|o|

List、String：在语法分析阶段，包括源代码在内的所有嵌套列表将被解析为List对象、以及这些List对象之间用于建立树状结构的Handle，并保存在AST中。此时得到的List对象相当于“static”对象，但Animac并不区分静态和非静态。编译时，AST中的List对象将被加载到Heap中，同时迁移Handle和Heap地址的映射关系。程序运行时，可能会产生临时的List或者String对象，这些临时的对象也存储在Heap中，并通过动态分配的Handle相关联。如下图。

![ ](./image/G2/Animac/列表和字符串对象.png)

Closure：闭包是运行时的函数对象，因此仅出现在运行时。


## 闭包与栈帧

### 闭包是函数的“值”

闭包是一个很特殊的存在。它是VM支持一等函数的核心，却显得不够primitive。如果不采用闭包，那么如果想让VM支持一等函数的话，就不可避免地要在编译环节或者VM环节上多下不少工夫。[Matt Might 的博客](http://matt.might.net/)针对这个问题有不少富有营养的讨论。目前来看，保留闭包这个结构，尽管性能上会有损失，但是对于更清晰地理解从编译器到VM的整个思路，是有好处的。因此，暂时不对闭包做更多优化。

那么如何理解VM中的闭包呢？

闭包的本质是封装了执行环境的代码。一等函数可以作为值来使用，那么它的定义（代码）和它的运行时实例（闭包）的关系，就如同一个变量的名称和它内部存储的实际的值的关系。在不同的执行环境中，同一个（词法上相同的）变量，它装有的值会发生变化。那么作为值的一等函数，尽管代码不会变化，但是函数的“值”在不同的执行环境中，也不相同。这个“不同”体现在哪方面呢？普通的“值”，例如数值、布尔、字符串、乃至一张表，它们是原子的、不可变的。而作为值的函数是一个开放的系统，它不仅有输入、有输出，它的内部还有对其他变量的引用，甚至会修改外部变量的值（副作用）。因此，一等函数在被构建的时刻，必须保存其内部所引用的其他变量的值，供未来被调用的时候，能够为自己所用。这样，在不同的执行上下文中，同一个函数会生成不同的实例。同一个函数，在不同的执行环境中生成的实例，就是不同的闭包，闭包就是函数这种数据类型的“值”，一如“对象”是某个类型的实例。

将代码和它所依赖的数据环境打包形成一个数据结构，就是所谓的“闭包”。有一句话（记得是云风大佬……的博客评论里面提到的一个学者所说）总结得非常精辟：

> 对象是带有行为的数据，闭包是带有数据的行为。

需要注意的是，在同一作用域中，如果自由变量和约束变量同名，则约束变量会覆盖掉自由变量的值，这也是Lambda演算的规定。但是，如果代码经过编译器预处理后，消除了这种混淆的可能性，那么实际上就不需要这种优先级了。

### 闭包是栈帧的一般化

一等函数的求值结果是闭包，闭包是函数的值。作为值的闭包，可以被调用，输出某个结果，也可能会有副作用。副作用对于程序的执行顺序是敏感的，但是，闭包的调用时机，是程序逻辑所确定的，是运行时才能得知的。例如CPS阶乘用例，乃至一切采用回调嵌套/CPS风格写成的程序，运行时的每一轮递归，都会生成一个新的续延闭包，并被保存下来，但是并不会立即被调用。只有到了递归出口的时候，这些续延闭包才会被调用，按照闭包内部嵌套引用的顺序，执行闭包内部的代码，也就是我们所期望的续延/回调业务逻辑。

但是许多情况下，我们不会刻意使用CPS风格编写程序，也不会用到所谓的“高阶函数”特性。这种情况下，当我们调用一个函数的时候，就是为了让它立即执行，而不是把它当成一个值保存起来。也就是说，从闭包的生成到被调用，是一个连续的过程。可以体会下面这两段代码：

```:scheme
;; 作为过程的函数，闭包生成即被调用
((lambda (x) (>= x 60)) 94)

;; 作为值的函数，稍后会在filter内部被调用
(filter array (lambda (x) (>= x 60)))
```

对于不支持一等函数的传统语言，例如C和Java，函数作为过程，拥有自己的作用域和局部变量，但是这些局部变量的生存周期，和函数调用的生存周期是保持一致的。这样的话，就可以把局部变量保存到栈帧当中，随着函数的调用而产生，随着函数的返回而退栈、消失。这其实就是上面的第一种情况，即局部环境生成后即被使用的情况。而对于支持一等函数的语言，例如Scheme和JavaScript，函数的出现，并不意味着被调用，但是仍然需要保存它所在的环境，因此需要额外的空间，暂且把新生成的闭包保存起来，直到它在未来的某个时刻被调用，才会形成一条调用栈帧入栈。而调用闭包的环境，和先前生成闭包的环境，并不是同一个环境，因此调用栈帧保存的并不是调用处的环境，而是闭包的环境。因此，在VM的栈帧中，提供了一个字段，用于指向栈帧生成时所在的闭包，并且VM会跟踪每一个时点所处的闭包。这个机制实际上就是C系语言的栈空间，只不过在支持一等函数的语言中，“栈空间”的意义更为广泛——它不仅是调用时环境，更可以指向先前暂存起来的环境。

另外，这种调用时机上的不同，意味着副作用也就是`set!`的实现要考虑更多。

考虑下面的用例：

```:scheme
(define free 0)
(define rec-cps
  (lambda (n cont)
    (if (<= n 0)
        (cont)
        (rec-cps (- n 1)
                 (lambda () (begin
                   (set! free (+ free 1)) ; ①
                   (cont)                 ; ②
                 ))))))
(rec-cps 10 (lambda () #f))
(display free)
```

预期结果是：不论①和②两个调用的顺序如何，结果都是`free`等于10。

如何理解这一现象？程序的运行可以分为两个阶段：第一阶段，`rec-cps`递归展开，过程中生成11个闭包（含最开始的那个闭包）。除第一个闭包外，这10个闭包通过②链式地互相引用，形成了显式的续延。第二阶段，从`rec-cps`中`(cont)`开始，调用第十个闭包，先调用`set!`修改`free`变量，再调用已保存的第九个闭包，然后进入第九个闭包，继续这个过程，最终调用第一个闭包，程序终止。在这个过程中，`set!`被调用了10次，因此最终`free`的值是10。

如果①②调换过来呢？与上一种情况不同，这种情况并非尾调用，因此在十个闭包依次被调用的时候，十个栈帧进入执行栈，直到第一个闭包被执行之后，栈帧连续退栈，同时`set!`被调用10次。结束后，`free`的值变为10。

### 闭包的结构

|偏移|说明|
|--------|
|00-03(4B)|闭包编号|
|04-07(4B)|上级闭包编号|
|08-0B(4B)|代码地址|
|0C-0F(4B)|保留|
|10-13(4B)|变量编号1|
|14-17(4B)|对应的值1|
|18-1B(4B)|变量编号2|
|1C-1F(4B)|对应的值2|
|…|…|

### 栈帧的结构

|偏移|说明|
|--------|
|00-03(4B)|栈帧编号|
|04-07(4B)|主调闭包编号|
|08-0B(4B)|返回地址|

### 哈基米和闭包 2023-08-16

对于“哈基米上长了个小豆豆”这句话来说，由于无法确定“哈基米”的含义，因而这整句话也是令人费解的。

我们说一句话，这句话里涉及很多指称。要想理解这句话，首先要知道各个指称的含义是什么。因此，我们理解一句话，一般都是在一个确切的“环境”中去理解，这个“环境”就是指称和含义之间的映射。因此，一句话如果想要不被误解地传达给它的听众，首先应该建立起有关“环境”的共识。

而全人类跨文化交流所需的基本公共“环境”是什么，似乎是个开放问题。语言学中有个概念叫斯瓦迪士核心词，大概有助于理解这个问题。

理论上，将不含自由指称的句子称为“封闭”的，相反，将含有自由指称的句子称为“开放”的。所谓“自由指称”，指的是语言环境中尚未建立起指称含义映射的指称，例如“哈基米上长了个小豆豆”中的“哈基米”，进而，这句话就是个“开放的”句子。

为了将开放句转变为封闭句，就要给自由指称赋予含义。而这个过程，在编程语言中即体现为作用域策略。例如，如果采取词法作用域策略，那么“哈基米”这个指称的含义，就应当与其词法语境保持一致，即日语原始语境中“蜂蜜”的含义。而如果采取动态作用域策略，则直接在这句话所在的语境（上下文）中灵活地确定“哈基米”的含义。自由指称“哈基米”一旦有了具体含义，整句话就变成了含义较为明确的封闭句，进而可以对其做出解释。

在编程语言的实现中，为了将开放语句变成封闭的，就一定要事先获取自由变量的具体取值，并且将绑定关系连同语句本身“封闭”在一个统一的结构中，这就是所谓的“闭包”。简而言之，闭包就是开放语句（如函数）在具体语境和环境下的实例。

这启发我们，在人际沟通中，为了提升沟通的效率和信噪比，一定要提前建立足够的共识，包括术语概念和指称含义的约定、沟通程序和机制、沟通的情感基调等等。因此我们说，对于社畜来说，开会是个核心技能，因为开会，尤其是组织和主持会议，基本上是对上面原则和方法的全面实践，是取得世俗成功的一个必要的元技能。

------

编程语言设计中，符号的作用域问题是个基本问题。它关系到一个符号、一个指称如何解释为实际的含义。

对于Scheme语言来说，典型的作用域策略有：词法作用域和动态作用域。很多人觉得“哈基米”在不同的语境（上下文）中应当被解释为不同的含义，这是一种动态作用域式的观点。但还有很多人觉得，“哈基米”就是蜂蜜，应该遵照日语的原来意思去解释，除此之外都是错误的，这是一种词法作用域式的观点。

在Scheme历史上的多种不同的实现中，两种作用域策略都有实践过。最后，R5RS标准选择了词法作用域作为标准。词法作用域策略还贯穿了Scheme的一个重要特性“卫生宏”，使得Scheme的宏体系比起传统的诸如C语言的宏体系而言更为精确而强大，深刻影响了诸如Rust一类的现代语言。


## 把柄设计/2019-04-22

考虑下面的一段Scheme代码：

```:scheme
(define Lst '(2 3))    ; (1)
(cons 1 Lst)           ; (2)
(cons 1 (cons 2 '(3))) ; (3)
```

第一行，列表`'(2 3)`被绑定至`Lst`这个局部变量上，于是对于Scheme程序员来说，`Lst`指代的就是列表`'(2 3)`的一个实例。

第二行，执行了函数`cons`，这是一个纯函数，没有任何副作用，也就是说，传入`cons`的`'(2 3)`不会被修改，函数会返回一个全新的列表`'(1 2 3)`作为结果。

第三行也是执行了`cons`，其参数`'(1 2 3)`是作为内层`(cons 2 '(3))`的执行结果被传入的，同样是一个全新的列表`'(2 3)`。

上面的行为，都是站在Scheme的层次上，以纯函数的思维去思考代码的行为。

但是如果下降一个层次，站在解释器实现的角度上，则变量的值必须看成实例化的对象的把柄。这也就是说，我们需要开始区分符号表示同实际存储的对象之间的对应关系了。

第一行，列表`'(2 3)`被绑定至`Lst`这个局部变量上，实则是一个`SList`类型的Scheme对象的**把柄**（handle）被绑定到`Lst`上，比如说`$1`。

第二行，`cons`的参数是`Lst`，其内部的实现是：在进程堆空间中生成一份对象`$1`的副本，其把柄为`$3`，然后在其头部插入`1`，函数返回新`SList`的把柄`$3`。

第三行，`cons`的参数是`(cons 2 '(3))`的执行结果**的把柄`$4`**，其实现与第二行相同。

唯一不同的是，执行结束时，`$4`会被GC掉，而第二行的参数`$1`不会，因为`$1`有局部变量`Lst`给它背书。

### 把柄的作用

**把柄**（handle）是Scheme对象的**逻辑地址**。Scheme程序员在函数式层次上编程，看不到到把柄的存在。而在执行机层次上，解释器需要利用变量所绑定的把柄，去间接地访问对应的Scheme对象。

那么有人会问，为什么要加上“把柄”这么一层抽象呢？变量直接绑定对象在堆/池中的物理地址不行吗？

当然是可以的，但是我们考虑GC的场景：在某些GC策略下，清除掉垃圾对象之后，会对存活对象进行移动。像我们上面举的例子那样，如果我们使用了把柄，那么在把柄`$4`被GC掉的时候，不会影响仍然存活的任何一个把柄，解释器不必关心把柄的再分配问题。反之，如果变量直接记录物理地址，则所有的物理地址在GC后都将被打乱，整个栈也就乱成了一锅粥。**把柄将Scheme对象的逻辑地址与物理地址解耦，使内存管理对解释器实现透明，使解释器（包括GC）的实现处于类似于C的层次上，可以大大提高系统的可扩展性，尤其是本地库接口的易用性。**

总而言之，把柄是执行机层次的东西，它提供了Scheme对象的逻辑地址抽象，并且带有类型信息。把柄将对象的“内容”和“存储”解离开来，解释器关心对象的内容，运行时关心对象的存储，二者通过把柄这一层抽象，将内容操作和地址分配解耦，让上帝的归上帝，凯撒的归凯撒，层次分明，权责明晰。

### 把柄的格式

解释器看到的把柄，是一个带有前缀JavaScript字符串。前缀用于指代对象的类型（而不是由对象自己携带类型信息），剩余部分是把柄的逻辑地址，一般是递增的数字。把柄前缀的定义如下：

|前缀|类型|本地库类型名|
|------|
|*|字符串|String|
|'|符号|Symbol|
|#|常量|Constant|
|$|列表|SList|
|&|变量名|Variable|
|^|闭包|Closure|
|~|续延|Continuation|
|@|标签|Lable|
|:|端口|Port|

尽管把柄有9种，但是它们出现的时机和抽象层次是不同的。下表归纳了各种把柄的出现时机：

|类型|AST<br>或者池空间|解释器<br>VM指令实现|本地库<br>宏指令实现|Scheme|
|------|
|*|o|o|o|x|
|'|o|o|o|x|
|#|o|o|o|x|
|$|o|o|o|x|
|&|o|o|x|x|
|^|x|o|x|x|
|~|x|o|x|x|
|@|x|o|x|x|
|:|o|o|o|o|

### Handle翻译考

Handle原本是编译原理术语，首先被翻译成“句柄”。Windows编程同样有Handle的概念，但是被国内的译者直接套用“句柄”的翻译，令人迷惑。从意义上看，Handle指的是“把手”“把柄”，握住把柄，就可以提起整个对象，很是形象。起初，将AuroraScheme的把柄称作“引用”，但是这个词还具有动词的词性，使用时比较容易迷惑，因此全面改称“handle”，中文称“把柄”。







# 线程调度和同步


## 异步与CPS 2023-08-26

至今积累的PL经验告诉我，在PL领域，存在着“代码”和“数据”的基本对立。我之前更关注两者的关联，例如所谓的“同像性”，即“代码即数据”，而**忽略了寻找两者在编译运行前后不同时相上的区别和联系**。

- 例如，一个过程，作为代码，是一个Lambda项，它存储为S-List。而在运行时，它会被**实例化**为闭包。
- 再例如，一个模块，作为代码，是一个Scheme代码文件。而在运行时，它会被**实例化**为一个拥有独立的逻辑存储空间的线程。
- 再例如，一个字符串，作为代码，是代码中的一个token。而在运行时（实际上是编译时），它会被**实例化**为一个字符串对象。

可见，同一个概念对象，在非运行时和运行时，可能表现为不同的形式。运行一个程序，就会让一个**字面的**语言概念变成内存中存在的一个数据对象（物件）的**实例**。为了方便下面的讨论，将语言概念的字面形式实例化为运行时的数据对象的过程，称为**解释**。因而可以说，λ-term可以解释成闭包，代码模块可以解释为线程，字符串token可以解释成字符串对象，等等。

有了这个概念准备，首先回答第一个问题：什么是“同步”？什么是“异步”？

同步，究竟是谁与谁同步？在我看来，就是以某种形式语言写成的代码中，**语句的字面顺序和它们的解释顺序之间的对应关系**。所谓顺序，指的是时间或者空间上的“发生在先”关系。例如：对于C语言等常用工程语言来说，最基本的程序结构就是所谓的顺序结构，即语句的执行顺序与它们在代码中字面出现的顺序一致。因此可以说C语言是一种“同步”的语言。

而程序语言的“异步”，就是指代码中**语句的字面顺序和它们的解释顺序之间并不保持确定的对应关系**。例如，对于Verilog这样的“描述”语言来说，语句的特定排列顺序并不意味着解释它们的时间上存在某种特定的先后顺序。再例如，JavaScript按照某种顺序“声明”的若干个事件处理函数，显然不是按照代码中字面上的顺序去执行的——它们的执行顺序、甚至是执行与否，完全是随机的。因此可以说此类语言是一种异步的语言——语句的排列顺序与解释它们的时间顺序之间并无关联。

异步是一般化的同步，同步是特殊化的异步。我们完全可以把“同步”视为语言本身的一种内在约定，而这个约定，在λ演算的语境和理论中，并不是必要的。R5RS规定（如§4.1.3），过程调用的各项的求值顺序是未定义的，尽管它们在字面上拥有确定的排列顺序。为了实现确定的、同步的解释顺序，可以将代码改写成续体传递风格CPS。因而，无论是具体的Scheme语言，还是抽象的λ演算，尽管求值顺序对于它们而言都是未定义的，即“异步”的，但是都可以通过CPS变换这个形式上的方式，而无需在语言实现上动手脚（加入形式语言之外的约定，即语用层面的约定），去明确地表达特定的解释时间顺序，也就是实现了字面形式与语义解释上的“同步”。

语言是为了表达现实世界，而现实世界中，异步才是最普遍、最具有一般性的。例如分布式并行计算、并发任务调度、通信和控制等等，本质上就是异步的。因此，像C这样的加了“同步约定”的语言，在描述异步问题上就比较困难，需要用到诸如函数指针一类的奇技淫巧，并且要事先构建厚重的抽象层（如node底层的libuv），以弥补语言本身异步表达能力的欠缺。而像JS、Scheme这样的描述性的、异步的语言，既可以通过CPS（表观上呈现为回调地狱、Promise语法糖等）去自然地表达异步过程，还能够兼容传统C系语言固有的同步式表达风格（如Scheme的`begin`结构），甚至还可以通过对语言实现进行适当的扩展（通过自动CPST或者第一等续体去实现单纯在λ演算体系内无法实现的`call/cc`），使之支持诸如生成器、协程一类的更为复杂的控制流。所以我说JavaScript是世界上最好的语言。

那么，把这种认识落实到Animac上，为了实现异步事件回调机制，2023-08-26意识到，应当增加一个VM内部接口，这个接口在原有的`AIL_CALL`接口的基础上实现，只不过新增了一个参数：过程返回地址。下面从一个典型案例出发，详细阐述这个机制。

对于以下异步事件回调：

```scheme
(File.read "/path/to/file" cb)
(define cb (lambda (x) (display x)))
```

将被编译成以下中间语言代码：

```
10 @main: push       "/path/to/file"
20        push       @cb
30        callnative File.read
......
a0 @cb:   store      x
b0        load       x  ;; 上面这两句显然可以优化掉
c0        display
d0        return
```

VM执行到30行`callnative`这个指令时，调用VM内部的`CallNative`接口，启动一个异步任务（读文件）后，立即执行后续指令。这个异步任务在VM和用户线程看来是一个“承诺”。经过一段不可预测的时间后，文件读取完毕，承诺兑现，触发回调中断（通过事件循环等机制）。回调中断被触发后，当前线程立刻进入VM的“内核态”，执行中断处理程序：

- 获取异步任务的执行结果，这里是读取到的文件内容。异步任务执行结果可能没有结果，也可能有多个结果。
- 判定当前线程的状态：
-- 如果当前线程正在运行，则获取当前线程的当前指令地址（PC），然后在当前线程上调用VM接口`CallAsync`，将返回地址设置为上一步获取的PC。这个是异步回调实现的关键，因为回调完成后要回到这里。
-- 如果当前线程已经执行完毕，处于停止状态，则在当前线程上调用VM接口`CallAsync`，将返回地址设置为1，即整个线程的出口（出口`halt`指令）。然后重启该线程。

当异步任务的承诺兑现，通过内核态的中断处理程序调用了`CallAsync`，进而PC跳转到用户定义的回调函数入口a0行，开始执行回调函数。当回调函数执行完毕，来到d0行的`return`指令，根据栈帧中记录的返回地址，即触发回调事件时程序所处的那个不可预知的地址，返回回调触发时的执行位置，继续执行正常的程序流程。

拍脑袋、启发式地设计一些机制，然后回过头来用现有的理论去解释它，用正确理论为我的拍脑袋设计做背书，这对我来说就足够了。所谓的“设计”，很少是从一般原理出发而演绎出来的。理论的指导作用非常有限，更多地是起到马后炮式的增强人们对于系统的信心的作用。




## 线程的数据结构

在AVM中，线程是具备独立内存空间的、可以与其他线程一起并发执行的任务单元，类似于操作系统层面的进程。

线程作为一个数据结构实体，被保存在AVM线程池中，供调度器调度执行。保存线程运行时数据对象，称为线程对象。线程对象的结构如下：

- 线程状态
-- TID：线程ID，是用于从线程池中访问线程对象的句柄。
-- parentTID：父线程ID，记录创建本线程的线程ID。对于AVM直接执行的线程，此字段为-1。
-- STATE：线程状态。具体在“调度器”部分详细说明。
- 代码（汇编预分析后得到，运行时只读）
-- ASMCODE：汇编指令数组，数组下标即为行号。
-- LABEL_INDEX：标签-行号映射，用于运行时定位标签所指向的行。
- 存储
-- HEAP：堆内存，是一块连续的内存空间
-- POOL：池内存，存储静态对象，连续内存空间，其下标与堆内存不相交
-- REF_INDEX：引用计数器：注意这个名字跟垃圾回收没有关系，此字段记录引用分配状态，用于产生新引用
-- REF_MAP：引用-堆/池地址映射
- 运行时状态
-- PC：程序计数器，即即将执行的指令行号
-- currentClosureIndex：当前所在闭包index
-- CLOSURES：线性的闭包存储
-- OPSTACK：操作数栈
-- FSTACK：函数调用栈



## 潜在的多核支持

在硬件中，执行机的数量可能不止一个。但是由于我们实现的虚拟机系统基于Node.js，这是一个异步单线程的平台，所以暂时规定，我们实现的AuroraScheme虚拟机只有一个执行机。






# 虚拟机宿主互操作






# 调试和异常处理







# 性能优化







# 专题讨论

## 卫生宏和元语言机制

20200724 推文：
方向调整：不打算实现卫生宏了。模式匹配还是有必要做的，不过优先级放低。
语法采用ECMAScript的，跟Scheme核心特性匹配上。强化对于JSON、字典（哈希表）和数组的支持。
Continuation和call/cc保留，用于实现异常处理。
总的思路就是向生产力工具靠拢，而不是实现一个理论上优雅的东西。

------

宏（macro）是一种元编程手段。简单地说，宏的用途是匹配代码中出现的某种模式，将其替换为事先定义好的其他结构。

宏是Scheme最强大的语言设施之一，许多语法糖（派生结构）实际上就是利用宏机制，在少数基本结构的基础上构造而成的。进一步，Continuation也可以利用宏对原始代码作CPS变换而实现。

C语言也提供了宏，但C语言的宏仅仅是字符串的简单替换，稍不注意，就会掉进坑里。例如，考虑下列代码：

```:c
#define SQUARE(x) (x*x)

SQUARE(a+1) //=>(a+1*a+1)
SQUARE(a++) //=>(a++*a++)
```

第一种情况是简单字符串替换造成的错误，但第二种情况很难说清楚，因为`++`运算符是有副作用的，这里并不知道程序员的真实意图。

简单宏替换会污染宏调用的上下文，因此是“不卫生”的。

Scheme创新性地引入了**卫生宏**的概念。所谓的卫生宏，指的是可以通过重命名等机制，保证宏替换过程不会污染宏调用所在的上下文。具体来说，是满足这样几点性质：

+ 宏定义中出现的自由变量，仍然是词法作用域的。即，在宏定义中出现的自由变量，其绑定以**定义**所在的上下文为准，而**不会**被宏调用所在上下文所覆盖。
+ 宏定义中引入的变量绑定，若宏调用所在上下文出现了同名绑定，则宏定义引入的变量会被改名，以避免污染宏调用上下文。

第一点保证了宏定义内部自由变量的词法作用域特性；第二点保证了宏展开过程不会污染宏调用上下文已有的绑定。但是，如果传入宏调用的参数是有副作用的（例如`set!`），则会出现上面C语言例子中的第二种情况，必须特别注意。

下面是一个例子：

```:scheme
(define var 100)
;; 宏定义
(macro test
  ((_ f a)
   (lambda (x) (f a x var))))
;; 宏调用
(define foo
  (lambda (x var)
    (test (lambda (x y z) (+ x y z)) x)))

#lang racket
(define var 10)
(define-syntax test
  (syntax-rules ()
    ((_ a)
     (+ a a))))
(test (begin (set! var (+ 1 var)) var))
```

每个宏都有宏关键字，用于唯一标识已定义的宏。宏和宏关键字必须在程序顶层定义，不可嵌套定义。局部变量绑定会覆盖宏关键字，而宏关键字会覆盖同级以及上级的变量绑定。

## 代码形式变换

利用形式变换实现单步调试等、自动CPS变换等

## 第一等续体和通用控制流

如`call/cc`、`dynamic-wind`等，并且从ANF和虚拟机、CPST两个角度去解释`call/cc`。

### 延续传递风格（CPS）

在C等命令式语言中，可通过跳转指令实现控制流转向。在基于表达式的 Scheme 中，每个表达式都有一个对应的“上下文”。此上下文保存了表达式可见的变量绑定、函数调用栈和语法上下文等信息。在 Scheme 中，上下文用 Continuation（延续）来表示，并作为一等对象暴露给程序员。利用 continuation，程序员可以手动控制程序的控制流，实现非局部跳出、异常处理、协程、生成器等高级的控制结构。

可以使用MikuRec提供的宏机制，实现代码到代码的自动CPST。以下用S*指代S-term的CPS形式。

```:lisp
; 符号 S* =
(lambda (cont) (cont S))

; 函数 (lambda (x) M)* =
(lambda (cont)
  (cont (lambda (x)
          (lambda (k)
            (M* (lambda (m) (k m)))))))

; 调用 (M N)* =
(lambda (cont)
  (M* (lambda (m-res)
        (N* (lambda (n-res)
              ((m-res n-res)
               (lambda (a) (cont a))))))))

; 未经柯里化的多参数调用 (M0 M1 M2 M3 ...)* =
(lambda (cont)
  ; 以下仅仅是对每个AST节点进行简单的遍历CPST/重命名，并未体现求值顺序，可以理解成并行的
  (M0* (lambda (node0) ; 每个nodex的类型都是cont->...
  (M1* (lambda (node1)
  (M2* (lambda (node2)
  (M3* (lambda (node3)
  ; 从这里开始体现求值顺序，几乎等于是 A-Normal Form
  ((node0 node1 node2 node3) (lambda (res)
  ; 最后执行总的continuation
  ( cont res))))))))))))

; (if P T F)* =
(lambda (cont)
  (P*
   (lambda (p-res)
     (if p-res
         (T* cont)
         (F* cont)))))
```

案例：将普通的阶乘递归函数彻底展开为CPS形式：

```lisp
#|
(define fac
  (lambda (n)
    (if (= n 0)
        1
        (* n (fac (- n 1))))))


;; Lambda* =
(lambda (cont)
  (cont (lambda (x)
          (lambda (k)
            (BODY*
             (lambda (m) (k m)))))))

;; BODY* =
(lambda (cont)
  (P*
   (lambda (p-res)
     (if p-res
         (T* cont)
         (F* cont)))))


;; P* =
(lambda (cont)
  ((lambda (cont) (lambda (x y) (lambda (k) (k (= x y))))) ; 内置相等判断
   (lambda (cont0)
     ((cont 0 n)
      (lambda (res) (cont res))))))

;; T* =
(lambda (cont) (cont 1))

;; F* =
(lambda (cont)
  ; 以下仅仅是对每个AST节点进行简单的遍历CPST/重命名，并未体现求值顺序
  ((lambda (cont) (lambda (x y) (lambda (k) (k (* x y))))) (lambda (node0) ; 内置乘法
  ( fac-cps                                                (lambda (node1) ; 递归调用（重命名后的）
  ((lambda (cont) (lambda (x y) (lambda (k) (k (- x y))))) (lambda (node2) ; 内置减法
  ; 从这里开始体现求值顺序，几乎等于是 A-Normal Form
  ((node2 n 1)    (lambda (res2)
  ((node1 res2)   (lambda (res1)
  ((node0 n res1) (lambda (res)
  ; 最后执行总的continuation
  ( cont res))))))))))))))
|#

;; Lambda* =
(begin
(define fac-cps
(lambda (cont)
  (cont (lambda (n)
          (lambda (k)
            ((lambda (cont)
               ((lambda (cont)
                  ((lambda (cont) (cont (lambda (x y) (lambda (k) (k (= x y)))))) ; 内置相等判断
                   (lambda (node0)
                     ((node0 0 n)
                      (lambda (res) (cont res))))))
                (lambda (p-res)
                  (if p-res
                      ((lambda (cont) (cont 1))
                       cont)
                      ((lambda (cont)
                         ; 以下仅仅是对每个AST节点进行简单的遍历CPST/重命名,并未体现求值顺序
                         ( fac-cps                                                (lambda (node1) ; 递归调用(重命名后的)
                         ((lambda (cont) (cont (lambda (x y) (lambda (k) (k (- x y)))))) (lambda (node2) ; 内置减法
                         ((lambda (cont) (cont (lambda (x y) (lambda (k) (k (* x y)))))) (lambda (node0) ; 内置乘法
                         
                         
                         ; 从这里开始体现求值顺序,几乎等于是 A-Normal Form
                         ((node2 n 1)    (lambda (res2)
                         ((node1 res2)   (lambda (res1)
                         ((node0 n res1) (lambda (res)
                         ; 最后执行总的continuation
                         ( cont res))))))))))))))
                       cont)))))
             (lambda (m) (k m))))))))

(((fac-cps (lambda (x) x)) 10) (lambda (x) (display x)))
)

```


# 参考资料

## Programming Language Checklist

以下全文引自[这里](https://www.mcmillen.dev/language_checklist.html)：

```
by Colin McMillen, Jason Reed, and Elly Fong-Jones, 2011-10-10.
You appear to be advocating a new:
[ ] functional  [ ] imperative  [ ] object-oriented  [ ] procedural [ ] stack-based
[ ] "multi-paradigm"  [ ] lazy  [ ] eager  [ ] statically-typed  [ ] dynamically-typed
[ ] pure  [ ] impure  [ ] non-hygienic  [ ] visual  [ ] beginner-friendly
[ ] non-programmer-friendly  [ ] completely incomprehensible
programming language.  Your language will not work.  Here is why it will not work.

You appear to believe that:
[ ] Syntax is what makes programming difficult
[ ] Garbage collection is free                [ ] Computers have infinite memory
[ ] Nobody really needs:
    [ ] concurrency  [ ] a REPL  [ ] debugger support  [ ] IDE support  [ ] I/O
    [ ] to interact with code not written in your language
[ ] The entire world speaks 7-bit ASCII
[ ] Scaling up to large software projects will be easy
[ ] Convincing programmers to adopt a new language will be easy
[ ] Convincing programmers to adopt a language-specific IDE will be easy
[ ] Programmers love writing lots of boilerplate
[ ] Specifying behaviors as "undefined" means that programmers won't rely on them
[ ] "Spooky action at a distance" makes programming more fun

Unfortunately, your language (has/lacks):
[ ] comprehensible syntax  [ ] semicolons  [ ] significant whitespace  [ ] macros
[ ] implicit type conversion  [ ] explicit casting  [ ] type inference
[ ] goto  [ ] exceptions  [ ] closures  [ ] tail recursion  [ ] coroutines
[ ] reflection  [ ] subtyping  [ ] multiple inheritance  [ ] operator overloading
[ ] algebraic datatypes  [ ] recursive types  [ ] polymorphic types
[ ] covariant array typing  [ ] monads  [ ] dependent types
[ ] infix operators  [ ] nested comments  [ ] multi-line strings  [ ] regexes
[ ] call-by-value  [ ] call-by-name  [ ] call-by-reference  [ ] call-cc

The following philosophical objections apply:
[ ] Programmers should not need to understand category theory to write "Hello, World!"
[ ] Programmers should not develop RSI from writing "Hello, World!"
[ ] The most significant program written in your language is its own compiler
[ ] The most significant program written in your language isn't even its own compiler
[ ] No language spec
[ ] "The implementation is the spec"
   [ ] The implementation is closed-source  [ ] covered by patents  [ ] not owned by you
[ ] Your type system is unsound  [ ] Your language cannot be unambiguously parsed
   [ ] a proof of same is attached
   [ ] invoking this proof crashes the compiler
[ ] The name of your language makes it impossible to find on Google
[ ] Interpreted languages will never be as fast as C
[ ] Compiled languages will never be "extensible"
[ ] Writing a compiler that understands English is AI-complete
[ ] Your language relies on an optimization which has never been shown possible
[ ] There are less than 100 programmers on Earth smart enough to use your language
[ ] ____________________________ takes exponential time
[ ] ____________________________ is known to be undecidable

Your implementation has the following flaws:
[ ] CPUs do not work that way
[ ] RAM does not work that way
[ ] VMs do not work that way
[ ] Compilers do not work that way
[ ] Compilers cannot work that way
[ ] Shift-reduce conflicts in parsing seem to be resolved using rand()
[ ] You require the compiler to be present at runtime
[ ] You require the language runtime to be present at compile-time
[ ] Your compiler errors are completely inscrutable
[ ] Dangerous behavior is only a warning
[ ] The compiler crashes if you look at it funny
[ ] The VM crashes if you look at it funny
[ ] You don't seem to understand basic optimization techniques
[ ] You don't seem to understand basic systems programming
[ ] You don't seem to understand pointers
[ ] You don't seem to understand functions

Additionally, your marketing has the following problems:
[ ] Unsupported claims of increased productivity
[ ] Unsupported claims of greater "ease of use"
[ ] Obviously rigged benchmarks
   [ ] Graphics, simulation, or crypto benchmarks where your code just calls
       handwritten assembly through your FFI
   [ ] String-processing benchmarks where you just call PCRE
   [ ] Matrix-math benchmarks where you just call BLAS
[ ] Noone really believes that your language is faster than:
    [ ] assembly  [ ] C  [ ] FORTRAN  [ ] Java  [ ] Ruby  [ ] Prolog
[ ] Rejection of orthodox programming-language theory without justification
[ ] Rejection of orthodox systems programming without justification
[ ] Rejection of orthodox algorithmic theory without justification
[ ] Rejection of basic computer science without justification

Taking the wider ecosystem into account, I would like to note that:
[ ] Your complex sample code would be one line in: _______________________
[ ] We already have an unsafe imperative language
[ ] We already have a safe imperative OO language
[ ] We already have a safe statically-typed eager functional language
[ ] You have reinvented Lisp but worse
[ ] You have reinvented Javascript but worse
[ ] You have reinvented Java but worse
[ ] You have reinvented C++ but worse
[ ] You have reinvented PHP but worse
[ ] You have reinvented PHP better, but that's still no justification
[ ] You have reinvented Brainfuck but non-ironically

In conclusion, this is what I think of you:
[ ] You have some interesting ideas, but this won't fly.
[ ] This is a bad language, and you should feel bad for inventing it.
[ ] Programming in this language is an adequate punishment for inventing it.
```

## 2018年10月18日的自我评价

> 你搞的这个解释器啊，naive！

> 首先你没有卫生宏，没有卫生宏的Scheme和咸鱼有什么区别？？？

> 其次你的词法作用域真的sound吗？不要以为你用各种说不清道不明的workaround搞定了阴阳谜题和Knuth的那个用例，就真的觉得万事大吉了。实际上你这个设计从根本上来讲就是不恰当的。你的闭包链本质上仍然是动态作用域那一套。

> 进一步说，你的这个解释器实际上是应该做形式化验证的。但是你既不懂coq也不懂haskell，所以验证不了，对不对？

> 你读得少、做得也不多。你花了两个月搞出这么一个trivial的小东西，真的很simple。

> 你的用例少得可怜，所以你没办法通过高覆盖的测试去验证你拍脑袋想出的各种小trick对不对？

> 你的代码架构脏得可以，毫无封装意识，毕竟你也没有正经学过JavaScript对不对？毕竟你连TSPL/SICP/EOPL/甚至HTDP都没读过嘛。你只是一个刚刚从The Little Schemer开始入门的FP新手菜鸟而已啊。

> 好了，不挖苦你了。王垠说解释器这东西既简单又复杂，简单就简单在它一是一、二是二，核心思想是简洁且有规律有逻辑可循的；但复杂就复杂在，作为一种虚拟机器，它的输入空间是千变万化的，你很难通过测试去彻底地验证它，同时也有工程上的复杂性。

> 本次开发的一个有益的经验是：从一开始就采取测试驱动的开发，以及相对比较好的版本控制。尽管你也没设计多少有一定复杂性的用例，但是这件事情是对的。值得鼓励。

> 接下来，你还有卫生宏和continuation两座大山需要翻越。搞定了这两个advanced的特性，即便MikuRec不能投入生产，即便MikuRec有种种缺陷，那也算是一件值得写入简历的作品了。

> 行了，就说到这里。10月18日的版本拉个基线出来，后续开发基于这个基线。祝你成功~

## 其他参考资料

+ 王垠. [怎样写一个解释器](http://www.yinwang.org/blog-cn/2012/08/01/interpreter/).
+ [CPS变换与CPS变换编译](https://zhuanlan.zhihu.com/p/22721931).
+ [Matt Might 的博客](http://matt.might.net/)
