
#!title:    我想给你整个世界
#!date:     2017-09-30

#!content

**版本记录**

|版次|日期|:摘要|
|---------------------|
|V1|2016年9月5日|作为λ演算和Y组合子的学习笔记，完成《奇妙的Y组合子》第一版。|
|V2|2017年9月30日|开始起草《我想给你整个世界》。|
|V3|2018年9月18日|完成《奇妙的Y组合子》最终版。|
|V4|2021年3月|将《奇妙的Y组合子》合并到本文。|
|V5|2022年1月|将构造monus的方法（原为独立文章）合并到本文。|
|V6|2022年5月|将《一条永恒的金带》文中部分内容整合到本文。《金带》一文完成于2018年7月，此后没有做过大规模的补充。|
|V7|2022年9月|将《一条永恒的金带》文中剩余的关于数学基础和哥德尔不完备定理的全部内容迁移到本文第八章“超越无穷”，《金带》一文被完全吸收至本文，不复存在。|
|V8|2023年4月|将Continuation简介、阴阳问题分析、计算理论（递归论）笔记的全部内容迁移到本文第七章“无穷”；将Brainfuck解释器的全部内容迁移到本文第六章“解释”。|

摘要：本文从λ演算和丘奇编码出发，从无到有地构造出加减乘除、递归、乃至简单的解释器，展示了λ演算作为一种抽象计算模型的强大能力。

![截自《南家三姐妹》第4季第4话](./image/G2/kanousei.jpg)

# λ演算简介

在JavaScript、Java、Ruby等高级编程语言中，有一种被称为“匿名函数”或者是“lambda函数”的特性。这种特性可以使得函数作为值来使用和传递，并且不需要有名字就可以直接调用。这种把函数当作值来使用的特性，称为“一等函数”。

许多人入门编程，是从C这样的纯过程式语言开始的。在这类语言中，函数作为过程，不能被当作值来使用。然而，事实上，“一等函数”的思想比Fortran和C语言要早得多。因此，我们首先来了解一下“一等函数”思想的源头——1930年诞生的**λ演算**（λ-calculus）。

λ演算是阿隆佐·丘奇（Alonzo Church，1903\~1995）在研究一阶逻辑的判定性问题时，发明的一套符号推理系统。λ演算非常简洁，只有三种语法形式和三条推理规则。但正是这样一个简单的系统，却具有强大的计算能力。1936年，丘奇的学生**阿兰·图灵**（Alan M. Turing，1912\~1954），证明了λ演算与他设计的著名的**图灵机**在计算能力上是等价的。

**λ演算**是一个形式系统，它的基本元素称为“项”（term），分为三种：

- **符号**：任何有效的名字
- **函数**：(**lambda** (%%symbol%%...) %%term%%)
- **调用**：(%%term%%...)

这里采用的语法形式和“正统”的λ演算有所不同。我们使用的形式，实际上就是Scheme语言的语法形式。尽管语法细节不同，但核心的形式是一致的。也就是说，完全可以用JS或者其他语言去表达λ演算。

在本文中，我们采用Scheme的语法表示λ演算。以下几个表达式都是合法的λ表达式：

```:lisp
1 (a b)
2 (a (lambda (x) x)) ;函数作为参数
3 (lambda (x) x)     ;符号作为返回值
4 (lambda (x) (lambda (y) x) )    ;函数作为返回值
5 ((lambda (x) (lambda (y) x)) 2) ;调用
```

可见，在λ演算中，函数不仅可以被调用，还可以当作值传递。

在λ演算中，每个函数都定义了一个“**作用域**”。在函数的参数列表中出现的符号，可以在函数被调用时被其他项所替换，因而称为作用域中有效的“变量”。函数体中通过使用这些参数，来实现对外部输入的“使用”。由于函数体内还可以嵌套其他函数，因此在内层函数中定义的变量，会“覆盖”外层函数定义的同名变量。例如，表达式`(lambda (x) (lambda (x) x))`中，出现在函数体的`x`，实际上是内层的那个`x`，而不是外层的那个。

作用域问题，可以追溯到弗雷格的一阶谓词演算，有着深刻的数理逻辑背景。

根据定义所在的函数层级，变量分为两种：

- **自由变量**指在函数体中出现，但是没有在本级函数参数列表中出现的符号。
- **约束变量**指的是在函数体中出现，且在本级函数参数列表中出现的符号。

例如，对于表达式`(lambda (x) (lambda (y) (+ x y)))`的内层函数`(lambda (y) (+ x y))`而言，`x`就是它的**自由变量**；而对于整个外层函数来说，它又是**约束变量**。

约束变量可以视为形式参数，而自由变量可以视为“全局变量”。

λ演算的符号变换规则只有简单的三条：

- **α-变换**：在不覆盖到同一作用域内部的自由变量的前提下，约束变量的名字可以任意替换。

```:lisp
(lambda (阿猫) [阿猫]) = (lambda (阿狗) [阿狗])
```

- **β-归约**：可以用λ项去“调用”一个函数，方法是将函数体内出现的所有有效的（没有被内层函数覆盖的）参数约束变量都替换成λ项。

```:lisp
[(lambda (x) T) 喵] => T[x→喵]
```

箭头符号`=>`代表λ项在β-归约前后的变化。β-归约描述的这个符号变换过程，也可以称为“调用”（apply/call/invoke）。

- **η-变换**：可以对任何λ项作抽象，将其封装成一个新的λ函数。

```:lisp
f := (λ (x) (f x))
```

尽管λ项在η-变换后变成了形式上不同的另一个λ项，但是在行为上，二者是完全一致的，也就是说，给新的λ项和旧的λ项相同的输入，它们的输出也是相同的，这称为“外延等价”，即行为上的等价。因此，η-变换可以理解成是对旧λ项的封装。

α-变换揭示了一个普遍的现象——形式参数的名称是不重要的。在某些语言中（例如JavaScript），不需要显式地声明函数列表，而直接用arg[n]代表第n个形式参数；在Java中，也常见arg0、arg1这样的说法。其背后的原理，就是α-变换。

β-归约是核心规则，它描述了“函数调用”的本质——约束变量代换。从操作语义的角度来看，β-归约所描述的“替换”过程，有许多值得讨论的技术细节。针对变量替换的顺序问题，有这样几种归约（求值）策略：

- 应用序求值：优先求值参数，以参数的最终值进行β-归约。从语法树的角度来看，可以看成是结果从叶子节点逐步汇集到根节点的过程。例如：

```:Scheme
((lambda (x y) (+ x y)) (* 3 3) (* 4 4))
((lambda (x y) (+ x y)) 9 16)
(+ 9 16)
25
```

应用序求值是绝大多数编程语言所采用的求值策略。**本文采用应用序求值，这也是Scheme的默认求值顺序。**

- 正则序求值：优先进行β-归约，将所有参数保留原形代入函数，消除所有函数定义后统一求值。从语法树的角度来看，可以看成是根节点逐步下移，语法树逐渐缩小成一个值的过程。例如：

```:Scheme
((lambda (x y) (+ x y)) (* 3 3) (* 4 4))
(+ (* 3 3) (* 4 4))
(+ 9 16)
25
```

- 按需调用（延迟求值/懒惰求值）：这种策略可以说是前述两种策略的一个折中，在不同的具体语言中有不同的操作语义。最为典型的就是Scheme的`if`原语，此结构并不会积极地求值每个参数，更不会把所有参数都推迟到完全展开后再计算，而是根据条件的真值，“选择”一项进行求值。这个“选择”显得非常玄幻，看起来像是超脱于λ演算的某种东西，实际上并没有那么玄幻，这里就是η-变换的用武之地了。我们将在后文中使用纯粹的λ演算构造出`if`原语。

此外，关于我们在本文中使用的λ演算，有几点说明：

+ 为了方便起见，我们引入了一个给λ项命名的手段：`(define 符号 λ项)`。有了`define`，就可以使用名字代替被命名的λ项，非常方便。但是，`define`并不是λ演算的一部分，严格地讲，它应该是我们在研究λ演算时所使用的“元语言”的一部分。在后文中，我们将会说明，`define`这个命名机制，实际上可以在λ演算中实现。因此，请放心使用吧。
+ λ演算中，所有的函数都只有一个参数。仍然是为了方便，我们会使用支持多个参数的λ演算。通过一种叫做**柯里化**（currying）的方法，可以把多参数的λ函数变换成多层单参数λ函数的嵌套。嵌套携带有层次顺序的信息，因此在多参数的函数中，参数列表中各个形式参数是有顺序的。**参数的顺序，实际上是一种隐含的数据结构。**
+ λ演算采用[前缀表达式](https://en.wikipedia.org/wiki/Polish_notation)的写法。前缀表达式的好处在于：其一：可以不对运算符的“目数”加以限制，后面可以跟一个甚至多于两个操作数。其二：运算符在前缀式中更能凸显其“函数”本质。其三：前缀式实际上就是AST的线性表达，相比于中缀式，可以无歧义地表达出中缀式所隐含的东西（例如“运算符优先级”等约定）。
+ 作为可以实际执行的程序，而不仅仅是在纸面上抽象的符号推导，必须事先规定几个“基本（**primitive**）符号”或者“基本操作”。例如四则运算的实现，实际上并不属于λ演算本身，而是所谓的native的语言，即依赖于宿主机器自身的语言。
+ 进一步思考，四则运算等操作，能否使用λ演算的语言定义出来呢？之所以提这个问题，是因为在编程语言中，衡量一门语言的成熟程度，就看它的标准库能否用自己写出来。尽管从效率等实际的工程因素来考虑，一般是使用C甚至是汇编去写底层库，但这里我们关心的是：如此简练的λ演算，能否在自身内部定义一些基本的运算呢？这正是本文要说明的问题。

到这里，我们已经基本了解了λ演算的概貌。为了检验你对λ演算的掌握情况，这里有两个λ表达式，不妨尝试手工推导一下。

+ `(((lambda (x y) (lambda (z) y)) z x) y)`→x
+ `(((lambda (x) ((lambda (x) x) (lambda (y) x))) y) x)`→y

如此简洁的系统，怎么可能有强大如图灵机的能力？在过程式语言中，一般都会提供循环、跳转等特性，用来实现较为复杂的带有递归的过程。而λ演算甚至连名字都没有，怎么能实现递归呢？考虑到递归函数的定义里面需要调用自己，或者说需要用自己的表达式去替换自己，但这样一来，自己的表达式里面还是有一个需要替换自己的自己……这样来看，匿名函数递归，似乎是不可能的事情。

这篇文章的目的，就是从构造自然数和布尔逻辑出发，逐步实现匿名函数递归，进而构造出整个“计算世界”。

<details>
<summary>一篇有趣的小故事。</summary>

> 引用来源：[用数学知识写出的小说是怎样的？ - 戴为的回答](https://www.zhihu.com/question/39422784/answer/129979885)

> 起初，神创造逻辑。逻辑是空虚的。神的零运行在水面上，这是trivial的。神说，要有集合，于是就有了集合。神看集合是好的，就将其公理化。有集合，有运算，就是一个代数结构。

> 神照自己的样子造人。于是神创造了0。神在东方的伊甸建立了一个园子，称之为群。神将0安置在那里，让它作单位元。起初，伊甸园是平凡的。神说，园中所有果子你可以随便吃，只有后继树上果子，你不能吃。因为你吃的时候必死。

> 神说，那人独居不好。于是要为它造一个配偶。神让0沉睡，取它的后继数1。神把1带到伊甸园，让它和0配对，二人从此一起生活。神教给他们加法的运算，让他们可以互相交合。0依然是伊甸园的单位元。0的逆元是0，1的逆元是1，0和1彼此交合则又得到1。

> 神所造的，惟有皮亚诺比一切的活物更狡猾。皮亚诺对1说，神岂是真说不许你们吃园中所有树上的果子么。1对皮亚诺说，园中树上的果子我们可以吃，唯有后继树上的果子不可，免得我们死。皮亚诺说，你们不会死。神是怕你们吃了后继树上的果子能自己创造新的数。皮亚诺告诉1它自己是怎么来的。1对单调的只有0和1的加法已经厌烦。它看后继树上的果子可做食物，而且悦人眼目，是可喜爱的，就摘下果子来吃了。

> 于是1对自己取了后继数，是为2。1又摘下果子给2，2也吃了。于是2对自己取了后继数，是为3。很快，后继树下生成了所有正整数。

> 正整数们很快开始彼此进行加法，互相交合。因为是1最先吃了果子，因此正整数们公认1为生成元，并定义任何数与1做加法等价于取后继数。0从始至终没有参与这件事，因此正整数们认为0对他们没有任何影响。

> 当神发现这件事的时候，伊甸园里已经有无穷多个元素了。神命令希尔伯特将后继树生成的所有数一个个删去。但希尔伯特发现这件事做不到，因为无穷集删去一个元素后仍与原集合同构。神只得放任这些数存在，却发现新生成的那些数没有逆元了。为了保证伊甸园仍为一个群，神只得为这些数添加逆元，将负数加入伊甸园中。被迫引入的负数是不自然的，与自然数相对。神依然令0为单位元，并定义0的逆元为0，它既非正也非负。至此，伊甸园成为一个整数加群。

> 一些数在加法中日益放纵自己，开始滥加、杂加，甚至觉得单次交合无法满足自己，开始进行连加。一种新运算被引入来描述这样的行为，它们称之为乘法。伊甸园成为一个整环。1受其他数的喜爱，它们便推举1为乘法的单位元。乘法最初仅是为了方便引入的。但在寻找乘法的逆运算时，它们偶然发现了一种新体位——一个数趴在另一个数上面，它们称之为over，或称除法。不同的数相除，生产出之前从未见过的畸形后代，这些不详的产物被称为分数。有整数，有分数，这是有理数。有多少整数，就有多少有理数。

> 神认为分数是罪恶的。神说，伊甸园中不能容纳这样的数。神见数的罪很大，终日所思想的都是恶，便打发他们离开伊甸园，将它们降到地上。神对1说，这所有一切罪的根源都在于你。你既做了这事，就必受诅咒。我必多多增加你的苦楚。你将被千人踏，万人踩，所有数都可以将你压在身下。自此，任何数over1都得到那数本身。

> 分数是稠密的。它们很快铺满了大地，任何两个分数之间都必有第三个分数。有理数对乘法构成群。骄傲的0声称自己是神照着祂的样子造的，因此自己不能被over。其他数鄙夷它，因此不接纳0为乘法群的元素。有加法，有乘法，所有有理数构成域。大地上诞生了第一个数域。

</details>

# 第一章：数和逻辑

## 自然数

我们采用Church提出的方法，从零开始逐渐构造自然数，直至无穷。

首先，定义数0如下：

```:Scheme
(define @0 (lambda (f a) a))
```

可以这样理解这个定义：`@0`作为一个函数，它接收两个参数，第一个参数`f`是一个函数，而第二个参数`a`是提供给`f`的参数。在`@0`的函数体中，并没有使用`a`去调用`f`，而是原封不动地直接返回。因此，我们可以说，`@0`是使用`a`调用`f`**零次**的结果。

基于这种理解，我们可以定义**后继函数**如下：

```:Scheme
(define INC
  (lambda (n)
    (lambda (f a)
      (f (n f a)))))
```

请注意，后继函数返回的是数字，即接收两个参数的函数。在函数体内部，`INC`用原来数字的结果又调用了一次`f`，并构造新数字返回，这就实现了“加一”的目的。

有了`@0`和后继函数，就可以产生出所有的自然数。例如：

```:Scheme
(define @1 (lambda (f a) (f a)))
(define @2 (lambda (f a) (f (f a))))
(define @3 (lambda (f a) (f (f (f a)))))
……
```

数字是用函数表示的，因此可以这样理解：表示数字的函数的内部调用`f`几次，这个函数就代表几。

## 布尔代数

布尔代数只有对立的两个值。如果把布尔值看成是一个道岔，那么两个布尔值分别指向不同的方向。因此，可以把布尔值定义成接收两个参数的函数，使其返回两个参数之一，这就构造出了布尔值。

```:Scheme
(define @true  (lambda (x y) x))
(define @false (lambda (x y) y))
```

看到了吗，`@false`的形式和`@0`的形式是完全一致的诶。在C语言等许多语言中，都有类似的以0（或者某个特殊值）指代false，而以其他任何值指代true的特性。

返回布尔值的函数称为“谓词”。现在来构造最简单的谓词`IS_ZERO`，思路是这样的：

首先谓词也是一个函数，它接收一个数字`n`作为参数。其次，数字`n`接收两个参数`f`和`a`。注意到在所有的自然数中，只有`@0`会原样返回`a`，因此，在`IS_ZERO`的函数体中，可以将`@true`作为`a`去调用`n`。`n`的参数`f`是一个函数，为了使所有的非`@0`数字调用这个函数都得到`@false`，只需要使`f`恒返回`@false`。至此，`IS_ZERO`就被构造出来了。它的形式是这样的：

```:Scheme
(define IS_ZERO
  (lambda (n)
    (n (lambda (x) @false) @true)))
```

这个过程暗示着，为了满足语义上的正确性，貌似需要对变量的“类型”加以限定。只有在参数中代入类型合适的λ项，才能得出有意义的结果。

判断结构是几乎所有的编程语言都有的结构。现在，有了两个布尔值，还有一个谓词，就可以尝试构造一个判断结构了。

最基本的判断结构接受一个条件和两个分支，条件的真值不同，执行的分支也不同。而刚刚构造的两个布尔值，本身就具有分支选择的功能，因此，我们可以把布尔值封装起来，这就是`IF`判断结构：

```:Scheme
(define IF (lambda (p x y) (p x y)))
```

可见，`IF`就是对布尔值使用η-变换后形成的封装。因为`IF`很好用，看起来甜甜哒，所以称它为布尔值函数的“语法糖”。

喜欢吃糖，总有一天要吃苦头的。

## 有序对

有序对，就是两个元素按照固定的顺序排列，形成的结构。

可以按照这样的方式构造一个有序对`PAIR`：有序对是一个函数，它返回一个函数。具体形式是这样的：

```:Scheme
(define PAIR
  (lambda (x y)
    (lambda (f)
      (f x y))))
```

首先，为什么`PAIR`要返回一个函数呢？因为从语义（运行时）的角度来讲，函数不仅仅是简单的字符串，而是一个保存了运行时上下文的数据结构。可以发现，`PAIR`将两个元素传入一个函数`(lambda (f) (f x y))`，并返回这个函数。刚刚传入的两个元素`x`和`y`很明显是这个函数的自由变量，为了在其他的地方使用这个被返回的函数时，不丢失生成它的上下文的信息（也就是`x`和`y`），它自己必须保存`x`和`y`的具体值（可以是立即值，也可以是引用，这与语言实现有关）。像这种，保存了包括自由变量的值在内的上下文环境的“函数”，称为“**闭包**”（closure）。因此，严格地说，**`PAIR`返回的是一个闭包**，一个包含了有序对的元素、及其位置信息的闭包。这个闭包不仅保存了信息，它还有行为——接收另外一个函数，去处理保存在闭包内部的元素。

其次，之所以这样构造`PAIR`，是因为这样可以充分利用两个布尔值的选择器作用。有了`PAIR`，有了布尔值，很容易写出分别提取`PAIR`中左右元素的函数：

```:Scheme
(define LEFT  (lambda (pair) (pair @true)))
(define RIGHT (lambda (pair) (pair @false)))
```

另外，上文中我们有说过，参数的顺序是一种隐含的数据结构。`PAIR`把两个参数**按顺序**放置在参数列表中，经柯里化就可以得到嵌套的两层λ函数。层次信息结合闭包特性，就是`PAIR`这个数据结构的λ演算本质。说到这一点，可以看一下SICP的习题1.3。简单来说，这个题要求找出三个数中最大的那个。常规思路是使用多个`if`对每种情况做判断，而使用λ函数的特点，可以写出这样的算法：

```:scheme
(define max
  (lambda (x y z)
    (if (and (>= x y) (>= x z))
        x
        (max y z x))))
```

这个算法充分利用了参数列表的“列表”特性，在递归中实现了列表的位移操作，简洁而机智。

有了自然数、布尔值和有序对，就可以继续建构更复杂的结构，描述更复杂的运算了。

# 第二章：运算

## 逻辑运算

布尔代数中，有与或非三个基本运算，这三个运算是完备的，因此我们首先构造这三个基本运算。

取反运算`NOT`很简单，它是一个接收1个布尔值作为参数的函数。

```:Scheme
(define NOT
  (lambda (bool)
    (bool @false @true)))
```

若两个真值之中有一个为`@false`，则得到`@false`，否则得到`@true`。这是`AND`。

与运算`AND`的特点是，如果两个布尔值里面有一个是`@false`，那么结果就是`@false`，否则得到`@true`。我们可以充分利用之前得到的经验，即将函数作为参数传入另一个函数，实现某种效果。因为`AND`接收两个布尔值，而布尔值有选择器的效果，我们不妨只关注第一个参数，并把它用作选择器，而另一个参数当作值，就像数字那样。当第一个参数取`@false`的时候，`AND`应当返回`@false`也就是第一个参数自身；当第一个参数取`@true`的时候，结果取决于第二个参数的值。因此，可以这样构造`AND`：

```:Scheme
(define AND
  (lambda (boolx booly)
    (boolx booly boolx)))
```

类似地，可以构造`OR`运算：

```:Scheme
(define OR
  (lambda (boolx booly)
    (boolx boolx booly)))
```

当然，构造方式并不是唯一的，只要能够满足类型约定和语义，就是正确的。

## 算术运算

首先从加法开始。加法，例如m+n，它的意义非常简单，就是给m（n）反复加一，重复n（m）次。因为上一章构造出来的数字有这种“重复n次”的意义，因此可以这样构造：

```:Scheme
(define ADD
  (lambda (m n)
    (m INC n)))
```

为了后文方便，这里先对`ADD`做柯里化：

```:Scheme
(define ADD-c
  (lambda (m)
    (lambda (n)
      (m INC n))))
```

有了加法，就可以构造出乘法，乃至乘方。这里就可以看出柯里化的意义所在了：柯里化的`ADD-c`，在只传入一部分参数（例如“2”）的时候，返回的是闭包，意义是“加2”。有的地方把这种特性称作“[部分调用](https://en.wikipedia.org/wiki/Partial_application)”。

```:Scheme
(define MUL
  (lambda (m n)
    (n (ADD-c m) @0)))

(define MUL-c
  (lambda (m)
    (lambda (n)
      (n (ADD-c m) @0))))

(define POW
  (lambda (m n)
    (n (MUL-c m) @1)))
```

减法要更难一点。因为加法是“重复”，是某种意义上的向前看，而减法则需要“回顾”，需要某种方法去“记忆”。

使用纯λ演算构造减法的方法同样不止一种，下面的这种方法是最容易理解的一种。

为了理解构造减法的思路，可以想象一个无穷数列，这个数列以`@0`为界，左侧是无穷多个`@0`，右侧是从`@0`开始的按后继顺序排列的自然数列。有一个宽度为2的滑动窗口，可以在这个数列上滑动，通过窗口，只能看到两个相邻的数字。

首先将滑动窗口初始化在最右侧的两个`@0`上，然后向右滑动n次，此时，窗口右侧的数字是n，而左侧的数字是(n-1)。只需要把窗口左侧的数字取出来，就可以获得(n-1)了，也就是n的前驱数。有了前驱数，就可以构造出减法了。

现在已经有了窗口，也就是`PAIR`，于是问题归结到，如何描述这个“滑动”的过程呢？

仍然是构造一个函数`SLIDE`，它接收一个旧窗口，将旧窗口右边的数放到新窗口的左边，然后将旧窗口右边的值后面的那个数（也就是后继数）放到新窗口的右边，返回新窗口。这样就实现了窗口向右滑动的效果。

```:Scheme
(define SLIDE
  (lambda (pair)
    (PAIR (RIGHT pair) (INC (RIGHT pair)))))
```

也可以理解成，窗口不动，数列向左走一步后，窗口里看到的两个数。

这样，就可以构造出前驱函数`DEC`和减法`SUB`了。

```:Scheme
(define DEC
  (lambda (n)
    (LEFT (n SLIDE (PAIR @0 @0)))))

(define SUB
  (lambda (m n)
    (n DEC m)))
```

需要注意的是，刚刚实现的减法并不是普通减法。因为，如果减数`n`比被减数`m`大，则窗口会滑动到左侧的`@0`的区域中，结果是`@0`，而不是负数（毕竟我们现在还没有构造负数）。这种减法叫做“[monus](https://en.wikipedia.org/wiki/Monus)”，符号是减号上面加个点。

> 下文是另一种构造monus的方法，撰写于2018年11月13日。王垠在博文《[GTF - Great Teacher Friedman](http://www.yinwang.org/blog-cn/2012/07/04/dan-friedman)》里提到，他的同学花了一个星期的时间，构造出前驱函数的另一种表示方案，这个表示跟克林尼最初的设计是完全不同的。因λ演算是“无状态”的，构造前驱函数并不是很简单。前文所述方法（可能是克林尼最初构造的那个）是先构造有序对，通过有序对保存两个相邻的数，从而实现前驱函数。这种方法是较容易理解的，也是许多讲丘奇编码的书会讲的方法。而王垠的这位同学所想到的方法则比较难懂。大概的思路是：将丘奇数封装在一个特殊构造Value中，实现相对于丘奇数的移位，然后重新构造类型为(Value→Value)的后继函数。通过公理"某数的后继为自然数0对应的Value"，构造出"-1"的Value表示，从而成功构造出前驱函数。下面将对这一方法做一简要介绍，内容主要是参考了维基百科中对此方法的解释。

> 下文把前驱函数统一记作`PRED`，其接受一个丘奇数作为参数，返回参数的前驱丘奇数。注意`(PRED ZERO)`的值仍然是丘奇数0`ZERO`。`PRED`的框架是

> ```:scheme
(define PRED
  (lambda (number)
    (lambda (f x)
      ...)))
```

> 通过有序对构造前驱函数的方法不再赘述。首先回顾一下丘奇数的构造。丘奇数的构造思路是：用函数嵌套层数来表达自然数。按照这种思路，丘奇数接受两个参数：其一是供反复嵌套调用的函数`f`，其二是传递给这个函数的参数`x`。

> ```:scheme
(define ZERO
  (lambda (f x) x))
(define ONE
  (lambda (f x) (f x)))
(define TWO
  (lambda (f x) (f (f x))))
```

> 后继函数`SUCC`很容易构造出来，也就是在原有丘奇数的基础上，把`f`多嵌套一层，然后返回新的丘奇数即可。

> ```:scheme
(define SUCC
  (lambda (number)
    (lambda (f x)
      (f (number f x)))))
```

> 多嵌套一层很容易，但是去掉一层嵌套比较麻烦。

> 构造`PRED`的关键在于“重新定义”丘奇数和后继函数。通过封装的手段，可以构造一个丘奇数的容器，记作`VALUE`。它接受一个丘奇数（**的返回值，即嵌套调用部分`(f..(f x)..)`，为简洁起见，下同**），返回一个闭包，这个闭包将传入的丘奇数保存在参数的位置，其定义为

> ```:scheme
(define VALUE
  (lambda (number)
    (lambda (package)
      (package number))))
```

> 很容易看出，

> ```:scheme
((VALUE n) f) = (f n)  （性质(*)）
```

> 利用这个性质，可以构造辅助函数`EXTRACT`，用来从封装的VALUE中得到`number`：

> ```:scheme
(define EXTRACT
  (lambda (value)
    (value (lambda (x) x))))
```

> 上面这个性质与后继函数的行为非常接近。基于此性质，可以构造一个新的后继函数`INC`，与丘奇数后继函数不同的是，`INC`以封装的VALUE为输入，以后继的VALUE为输出。

> ```:scheme
;; VALUE -> VALUE
(define INC
  (lambda (value)
    (lambda (package)
      (package (value f)))))
```

> 因`(value f)`得到的是原有丘奇数的后继数（也是丘奇数），所以`INC`需要将它再次封装为VALUE。需要注意的是，`INC`引入了自由变量`f`，而这个`f`已经在`PRED`的框架中出现了（即丘奇数所需的那个`f`），因此实际上是约束的。

> 下面的步骤验证了`INC`的递推性质，并且构造了“-1”所对应的VALUE，将其设为迭代起点。

> 记`V0 = (VALUE x)`，则根据性质(*)和`INC`定义：

> ```:scheme
            V0 = (VALUE x)
      (INC V0) = (VALUE (f x)) = V1
(INC (INC V0)) = (VALUE (f (f x))) = V2
              ...
      (INC Vn) = V[n+1]
```

> 如果将`INC`在`V0`上反复调用`n`次（`n`是丘奇数），则

> ```:scheme
(n INC V0) = Vn
```

> 这里`Vn`可理解为自然数n所对应的VALUE。为了构造前驱函数，只需要再构造出一个“-1”，即`V[-1]`，从`V[-1]`而不是`V0`开始这个迭代过程，就可以实现前驱函数。

> 显然，`V[-1]`应具有性质

> ```:scheme
(INC V[-1]) = (VALUE x) = V0
```

> 展开得到

> ```:scheme
(lambda (package) (package (V[-1] f))) = (lambda (package) (package x))
```

> 由此可得（[合一](https://en.wikipedia.org/wiki/Unification_\(computer_science\))），

> ```:scheme
(V[-1] f) = x
```

> 应用η-变换可得

> ```:scheme
V[-1] = (lambda (u) x)
```

> 观察`V[-1]`和`V0`可以发现，`V[-1]`实际上对应的是丘奇数的0，而`V0`对应的是丘奇数的1。也就是说，**通过`VALUE`的封装，实现了将丘奇数“左移”一位的目的，使之从丘奇数的“-1”开始迭代，并以丘奇数返回结果，从而实现前驱的效果。**即：

> ```:scheme
(n INC V[-1]) = V[n-1]
```

> 使用`EXTRACT`将得到的VALUE对应的丘奇数嵌套形式抽取出来，就得到了`PRED`函数的函数体。需要说明的是，由于`(EXTRACT V[-1]) = x`，因此`(PRED ZERO) = ZERO`是满足的。

> 最后将前面构造的`VALUE`（辅助函数，实际不需要）、`EXTRACT`、`INC`组合起来，即可得`PRED`函数：

> ```:scheme
(define TEN
  (lambda (f x) (f (f (f (f (f (f (f (f (f (f x))))))))))))

(define PRED
  (lambda (number)
    (lambda (f x)
      (define EXTRACT
        (lambda (value)
          (value (lambda (x) x))))
      (define INC
        (lambda (value)
          (lambda (package)
            (package (value f)))))
      (define V-1
        (lambda (u) x))
      (EXTRACT (number INC V-1)))))

((PRED TEN)
 (lambda (x) (+ x 1))
 0)
```

> 化简为：

> ```:scheme
(define PRED
  (lambda (number)
    (lambda (f x)
      ((number
        (lambda (value)
          (lambda (package)
            (package (value f))))
        (lambda (u) x))
       (lambda (x) x)))))
```

> 这就是最终得到的前驱函数。

有了减法，就可以比较大小。两个数`num1`和`num2`相减，若得到`@0`，说明**`num1`不比`num2`大**，或者说，`num1`小于等于`num2`。而`@0`是可以通过`IS_ZERO`判断的，所以就可以构造出谓词`IS_LE`，即“小于等于”。同样地，利用已有的逻辑运算，还可以构造出“大于等于”`IS_GE`、“等于”`IS_EQUAL`、“不等于”`IS_NOT_EQUAL`、“大于”`IS_GT`和“小于”`IS_LT`。

```:Scheme
(define IS_LE
  (lambda (num1 num2)
    (IS_ZERO (SUB num1 num2))))

(define IS_GE
  (lambda (num1 num2)
    (IS_ZERO (SUB num2 num1))))

(define IS_EQUAL
  (lambda (num1 num2)
    (AND (IS_LE num1 num2) (IS_LE num2 num1))))

(define IS_NOT_EQUAL
  (lambda (num1 num2)
    (NOT (IS_EQUAL num1 num2))))

(define IS_GT
  (lambda (num1 num2)
    (NOT (IS_LE num1 num2))))

(define IS_LT
  (lambda (num1 num2)
    (NOT (IS_GE num1 num2))))
```

# 第三章：整数和对称

为了解决减法无法得到负数的问题，我们现在来构造负数，从而构造出所有整数。

为了充分利用已有的结构，并且使体系尽量保持简洁，不妨使用有序对`PAIR`来构造整数`INT`。

有序对可以存储两个自然数，因此可以用左右两侧数的相对大小来表示自然数。

左右两个数的差值就是整数的绝对值。如果左边比右边大，则为负；如果左边比右边小，则为正。若两边的自然数相等，则为整数0。很自然地，可以构造出检验整数0的谓词`IS*ZERO`。

```:Scheme
(define INT
  (lambda (neg pos)
    (PAIR neg pos)))

(define *ZERO (PAIR @0 @0))

(define IS*ZERO
  (lambda (int)
    (IS_EQUAL (LEFT int) (RIGHT int))))
```

这种构造有一个缺点，那就是对于同一个整数，有无穷多种表示形式，并不优雅。这就需要构造出一个将同一个整数的不同表示标准化成唯一一种形式的函数——标准化函数`*NORMALIZE`。

```:Scheme
;整数标准化，也就是简化成至少一边为0的形式，这样就可以实现绝对值函数和符号函数了
(define *NORMALIZE
  (lambda (int)
    (IF (IS_LE (LEFT int) (RIGHT int))
        (INT @0 (SUB (RIGHT int) (LEFT int)))
        (INT (SUB (LEFT int) (RIGHT int)) @0))))
```

顺便实现了绝对值和符号函数：

```:Scheme
(define *ABS
  (lambda (int)
    (IF (IS_ZERO (LEFT (*NORMALIZE int)))
        (RIGHT (*NORMALIZE int))
        (LEFT  (*NORMALIZE int)))))

;正数返回@true; 负数返回@false
(define *SGN
  (lambda (int)
    (IS_ZERO (LEFT (*NORMALIZE int)))))
```

有了整数，自然数不再孤单。因为每一个整数，都有唯一对应的一个相反数。

因此，整数的加法和减法，本质上都是加法。这也就是说，整数是关于加法封闭的。

```:Scheme
(define *ADD
  (lambda (i j)
    (INT (ADD (LEFT  i) (LEFT  j))
         (ADD (RIGHT i) (RIGHT j)))))
```

每一个整数加上它的相反数，最终都得到单位元0，这意味着整数集合是关于0对称的。整数和加法，构成**阿贝尔群**。

整数乘法相对复杂一点：

```:Scheme
(define *MUL
  (lambda (i j)
    (INT (ADD (MUL (LEFT i) (LEFT j)) (MUL (RIGHT i) (RIGHT j)))
         (ADD (MUL (LEFT i) (RIGHT j)) (MUL (RIGHT i) (LEFT j))))))
```

乘法破坏了整数集合的对称性。因为乘法逆运算——除法——的运算结果，并不在整数集合中。为了解决这个问题，就要创造一种新的数——有理数。为了突出主线，本文就不讲有理数的构造了，我们继续看更有趣的东西。

# 第四章：递归

在这一章中，我们将真正见识到λ演算的魔力。

## 自然数的除法和求余

对于自然数而言，反复做加法可以得到乘法运算；而反复做减法可以得到两种运算——除法和求余。

除法是将一个数反复从另一个数上面减去，直到减不了为止，得到的结果是做减法的次数，这个次数称为“商”。而求余运算得到的是除不尽的那部分余数。除法记作`DIV`，求余记作`MOD`。（Scheme的求余函数是`remainder`）

两个数做除法，反复减掉的那个数是“除数”，越减越小的那个数是“被除数”。如果被除数比除数小，那么就没办法从被除数上减，所以减的次数就是0，也即“商”为0。反之，每多做一次减法，商就增加1，最后减到不能再减的时候，之前做过的减法的次数，就是最后得到的商。

根据上面的描述，可以利用前三章构造的基本运算写出`DIV`的定义：

```:Scheme
(define DIV
  (lambda (m n)
    (IF (NOT (IS_LE n m)) ;n>m
        @0
        (INC (DIV (SUB m n) n)))))
```

上面这段代码很好地“描述”了除法的原理，但它现在还不能帮助我们计算除法。为什么呢？

首先，`IF`的后两个参数代表两个分支，逻辑上是必须执行且只能执行一个的。但是，由于我们已经在第一章约定采用应用序求值，因此不论条件为何，两个分支都会被求值，这显然不是我们希望的结果。

为了延迟两个分支的求值，我们可以利用η-转换，将两个分支封装成λ函数，也就是将`(f a)`转换成`(lambda (x) ((f a) x))`。由于λ函数作为参数值的求值结果仍然是原来的形式，因此被封装为λ函数的分支，在求值`IF`的各个参数时，会作为一个整体，通过β-归约被扔进`IF`的函数体。这样，就将条件分支的执行推迟到了`IF`做出决定之后。

η-转换前后的两个λ项，符号形式不同、语法意义不同、抽象层次不同，但拆包后的执行效果是相同的，因此是“[外延等价](https://en.wikipedia.org/wiki/Extensionality)”的。

还有一点需要注意的是，尽管我们讨论的是“无类型”λ演算，但其实已经暗中标好了类型。比如说，接受两个参数的函数和接受一个参数的函数，显然不是同一类函数；返回值的类型不一致的两个函数，也不是同一类函数。例如，数字1`@1:(lambda (f a) (f a))`和逻辑假值`@false:(lambda (x y) y)`就不是同一类函数，因为`@1`返回的是函数调用`(f a)`，而`@false`返回的是变量`y`（指代的值），在形式上是不一致的。这种形式上的不统一，意味着他们不是“[内涵等价](https://en.wikipedia.org/wiki/Intension)”的，也就是说，他们不属于同一“类”（当然可以写出诸如`(@0 (lambda (x) x) 1)`和`(@true 1 2)`的表达式，它们的返回值是同一类型（都是“`1`”），但这反映的是执行结果的等价即“外延等价”，而不是“内涵等价”）。

考虑到这一点之后，η-转换就有了更多需要考虑的细节。例如，对于先前定义的`DIV`函数，分支`(INC (DIV (SUB m n) n))`的返回值类型是一个接受两个参数的丘奇数，因此，在做η-转换的时候，就必须相应地给它传入两个形式参数，才能保证“类型”上的正确性：

```:Scheme
(lambda (x y) (
  (INC (DIV (SUB m n) n)) x
                          y))
```

这样就可以保证η-转换后与转换前的输出都是同一“类型”，也即`DIV`返回的类型——丘奇数。

改写后的`DIV`函数如下：

```:Scheme
(define DIV
  (lambda (m n)
    (IF (NOT (IS_LE n m)) ;n>m
        @0
        (lambda (x y) ((INC (DIV (SUB m n) n)) x y)))))
```

有了`DIV`的构造经验，`MOD`就不难了。依样画葫芦，很容易写出`MOD`函数如下：

```:Scheme
(define MOD
  (lambda (m n)
    (IF (OR (IS_ZERO m) (NOT (IS_LE n m))) ;m<=n
        m
        (lambda (x y) ((MOD (SUB m n) n) x y)))))
```

至此，在λ演算的基础上，我们实现了自然数的全部四则运算，并且它们都是封闭于自然数内部的。

## Y组合子

[皮亚诺算术](https://en.wikipedia.org/wiki/Peano_axioms)

上文中，我们从无到有地实现了自然数和自然数上面的运算，其中最核心的构造方式就是“后继”。从0开始，不断地取后继数，可以枚举出“所有”的自然数。之所以要给“所有”打引号，是因为我们总是可以给“所有”自然数里面最大的那个取后继，得到的仍然是“所有”自然数。这暗示着，自然数集合是一种“自我同构”的集合。通过自我指涉以致无穷，这就是递归。

在实现除法和求余运算的时候，我们已经用到了递归。事实上，加减乘除四则运算，无一不是在后继函数基础上的递归。例如：

$$
\begin{cases}
{ADD}(0,n) = n, \\\\
{ADD}(m,n) = \mathrm{INC}({ADD}(m-1,n))
\end{cases}
$$

递归是普遍的。除了四则运算之外，还有许多问题是可以用递归的方法解决的。例如，阶乘运算`FACT`是一个非常典型的递归函数，几乎所有讲递归的文章都会提到阶乘。

```:Scheme
(define FACT
  (lambda (n)
    (IF (IS_EQUAL n @0)
        @1
        (lambda (x y) ((MUL n (FACT (DEC n)))
                       x
                       y)))))
```

目前，我们已经实现了三个递归形式的函数，也即自我调用的函数。不知道你有没有注意到，在我们写的代码中，除了`lambda`和`define`，已经没有任何“保留字”了。然而，在第一章我们提到过，λ演算并没有`define`机制，所有的函数都是匿名函数。如果函数没有名字，就不能通过名字引用自己，也就无法实现递归了。果真如此吗？

我们看一个神奇的构造。下面的函数`Y`称为**Y不动点组合子**：

```:Scheme
(define Y
  (lambda (S)
    ( (lambda (x) (S (x x)))
      (lambda (x) (S (x x))))))
```

它的神奇之处在于，将任意一个函数`F`传入Y组合子，都有：

```:Scheme
(Y F) => ( (lambda (x) (F (x x)))
           (lambda (x) (F (x x))) )
      => (F ( (lambda (x) (S (x x)))
              (lambda (x) (S (x x))) ))
      即 (F (Y F))
```

可以发现，左边的`(Y F)`和右边的`(Y F)`是同一个`(Y F)`，`(Y F)`的结果是给它自己又调用了一次`F`。这意味着，`(Y F)`就是我们寻找的能够实现自调用的递归函数，也是`F`的**不动点**。

这里的F，是一个“**高阶函数**”。所谓高阶函数，就是将有名字的递归函数的自调用部分抽象成参数，得到的新函数。例如，将阶乘函数的自调用部分`FACT`抽象成参数`f`，就得到了它的高阶函数：

```:Scheme
(lambda (f)
  (lambda (n)
    (IF (IS_EQUAL n @0)
        @1
        (lambda (x y) ((MUL n (f (DEC n)))
                       x
                       y)))))
```

使用这个高阶函数去调用Y组合子，Y组合子就会不断地将参数代表的那个真正的递归函数应用到自身，从而实现了匿名函数的递归。

> 在计算器上随便输入一个数字，反复按“cos”键，得到的结果一定会收敛到某个确定的值（弧度制下是0.739...）。这个值就是$\mathrm{cos}(x)$的不动点，也就是$\mathrm{cos}(x) = x$的根。

> ![余弦函数的不动点](./image/G2/cos_fixed_point.jpg)

Y组合子的存在，意味着λ演算可以实现递归，也就意味着对于λ函数而言，名字的有无并不是一个重要的问题。因此，为了使用上的方便，各种编程语言都引入了类似`define`的语法。可见，`define`的本质是一块甜甜哒语法糖，既然如此，我们还是继续给函数起名字好了。

> Scheme提供了多种变量定义的机制，如`let`、`let*`和`letrec`。这些机制有非常微妙的区别，但是它们的本质都是将局部作用域的外面包裹了一层，形成了新的“高阶函数”。例如，下面的`let`形式建立了一个局部变量`C`：

> ```:lisp
(lambda (x)
  (let ((C 100))
       (+ x C)))
```

> 它跟下面这种普通的λ表达式的执行效果是相同的：

> ```:lisp
(lambda (x)
  ((lambda (C)
     (+ x C)) 100))
```

> JavaScript是一款Scheme血统非常明显的语言。在JavaScript中，可以用`var`关键字来声明变量。`var`有所谓“变量提升”的特性，也就是，在一个函数作用域中，只要出现了`var`声明，那么被声明的变量在整个作用域内部都是有效的。这种特性的原因显然是继承了Scheme的`let`的特性。

尽管Y组合子看起来很奇妙，但是我们发现，它实际上是不“收敛”的。由于`(x x)`的存在，在应用序求值中，代换的过程会无穷无尽地继续下去。为了解决这个问题，我们可以使用以往的经验，即将`(x x)`封装成`(lambda (y) ((x x) y)`，从而延迟对它的求值。注意到这种封装只适用于单参函数，这就是说，不论目标递归函数有几个参数，最好是经过柯里化，转换成单参函数。这在一定程度上牺牲了简洁性，却换来了通用性。这个经η-变换，将自调用部分`(x x)`封装起来的Y组合子，称为**Z组合子**，它是Y组合子在应用序求值策略下的实现。

> 在后文中，为了使用Z组合子，有些多参数函数会写成柯里化之后的形式。

有了Z组合子，我们就可以写出可执行的、纯粹的λ演算版本的阶乘函数了：

```:Scheme
((lambda (S)
    ( (lambda (x) (S (lambda (y) ((x x) y))))
      (lambda (x) (S (lambda (y) ((x x) y))))))
 (lambda (f)
     (lambda (n)
       (IF (IS_EQUAL n @0)
           @1
           (lambda (x y) ((MUL n (f (DEC n)))
                          x
                          y))))))
```

现在已经不需要任何（除了`lambda`的）保留字了。但是很复杂，对不对？所以`define`这块语法糖不吃白不吃。

刚才实现的这些递归函数，都只在内部调用自己一次，如果调用多次呢？这样的递归就是所谓的“树形递归”。最著名的树形递归就是斐波那契数列了：

```:Scheme
(define Fib
  (lambda (num)
    ((Z (lambda (f)
          (lambda (n)
            (IF (OR (IS_EQUAL n @0) (IS_EQUAL n @1))
                @1
                (lambda (x y) ((ADD (f (SUB n @1)) (f (SUB n @2))) x y))
            )))) num)))
```

这段代码是可以运行的。理论上，树形递归也是一种普通的递归，它与递归函数有相同的计算能力。（见[计算理论学习笔记](./computation-theory-note.html)）

至此，我们在纯粹λ演算的框架内，实现了递归。有了递归，终于可以看到地平线上慢慢浮现出来的“万能机器”的幻影。

> 列宁有一次发表演讲：“共产主义已经出现在地平线上。”台下有个工人问身边的教授：“什么是地平线？” 教授说：“地平线是一条假想的线，天和地在那里相接，但是当你走近它时，你就会发现它会离开你，然后又出现在远方。——苏联笑话

# 第五章：结构

### 线性列表

数学是一门关于“结构”的学问。而结构是一种抽象的东西，看不见摸不着，却又无处不在。数学的学习，以及数学本身的发展，就是一个逐渐从具体的事物中剥离掉表象，得到某种通用的东西的过程。抽掉了表象，就是“抽象”，也就不能靠直觉的描述去表达了。那么靠什么呢？答案是：靠它的**行为**。

[线性表](https://en.wikipedia.org/wiki/List_\(abstract_data_type\))是一种抽象的结构，它可以这样描述：

- “空表”是线性表；
- 单个的“元素”是一个线性表；
- 在线性表的**前面**增加**一个**元素，得到的结构也是线性表。

如果写成BNF，就是：

```
<List> ::= <NullList>
<List> ::= <Element>
<List> ::= <Element> <List>
```

可见，线性表是一种递归的数据结构。

线性表有一个初始结构和四种基本的操作：

- NULL_LIST：空表
- CONS：在表的开头增加一个元素
- CAR：取表的第一个元素
- CDR：取表的第一个元素之后的子表
- NULLLIST?：判断是否空表

只要构造出这些“行为”，就相当于构造出了线性表。关于CAR和CDR含义，可以参考[维基百科](https://en.wikipedia.org/wiki/CAR_and_CDR)。

首先，我们可以利用先前定义的有序对和`@true`，定义空表和其他操作。在下面的代码中，之所以使用`@true`定义空表，是因为这样比较方便定义谓词`NULLLIST?`。

```:Scheme
(define NULL_LIST
  (PAIR @true @true))

(define NULLLIST?
  (lambda (list)
    (LEFT list)))
```

以`PAIR`为基础构造，可以实现`CONS`、`CAR`和`CDR`三个基本操作。实现的思路是这样的：每一个`PAIR`，都是线性表中的一个枢纽，它的左侧是布尔值，如果为`@true`，意味着右侧的子表是空表；右侧是一个子`PAIR`，存储一个元素以及后面的表结构。图示如下：

![层层嵌套的二元组](./image/G2/church-list.png)

```:Scheme
(define CONS
  (lambda (e l)
    (PAIR @false (PAIR e l))))

(define CAR
  (lambda (list)
    (LEFT (RIGHT list))))

(define CDR
  (lambda (list)
    (RIGHT (RIGHT list))))
```

> 如果执行`(CAR @1)`或者`(CDR NULL_LIST)`会怎样呢？炸了。

> 因此引入类型是非常自然的。目前暂不考虑。

有了这三个基本操作，就可以构造出一些实用函数了。

```:scheme
;;数组元素计数
(define COUNT
  (lambda (l)
    ((Y (lambda (f)
          (lambda (list)
            (IF (NOT (NULLLIST? list))
                (lambda (x y) ((INC (f (CDR list)))
                               x
                               y))
                @0))))
     l)))

;; 闭区间，注意Currying
(define RANGE
  (lambda (m n)
    (((Y (lambda (f)
          (lambda (a)
            (lambda (b)
            (IF (IS_LE a b)
                (lambda (z) ((CONS a ((f (INC a)) b))
                               z ))
                NULL_LIST
            )))))m)n)))

;; 投影函数：用于取出列表的第index个元素（从@0开始）
(define PROJ
  (lambda (list index)
    ((((Y (lambda (f)
            (lambda (l)
              (lambda (i)
                (lambda (j)
                  (IF (IS_EQUAL i j)
                      (CAR l)
                      (lambda (x y) ((((f (CDR l)) i) (INC j)) x y))
                   ))))))list)index)@0)))
```

利用λ演算的一等函数特性，我们可以将列表遍历操作抽象成高阶函数，而将具体的业务逻辑作为一等函数传入高阶函数。这样，我们就不需要每次都写麻烦的迭代代码了。常见的高阶函数有`MAP`、`FOLD`（`REDUCE`）等。

```:scheme
;高阶函数Fold和Map
(define FOLD
  (lambda (list init func)
    ((((Y (lambda (f)
          (lambda (l)
            (lambda (i)
              (lambda (g)
                (IF (NULLLIST? l)
                    i
                    (lambda (x y) (
                      (g (CAR l) (((f (CDR l)) i) g))
                      x y))
                ))))))list)init)func)))

(define MAP
  (lambda (list func)
    (((Y (lambda (f)
           (lambda (l)
             (lambda (g)
               (IF (NULLLIST? l)
                   NULL_LIST
                   (lambda (x) ((CONS (g (CAR l)) ((f (CDR l)) g)) x))
                )))))list)func)))
```

### 二叉树

树状结构也是一种无处不在的重要结构。鉴于多叉树都可以使用二叉树表示，因此这里我们只构造二叉树。

二叉树也是一种可以递归定义的结构：

- 单个元素称为**节点**
- 不包含任何节点的**空树**是二叉树
- 每个节点都有至多两个子二叉树，分别称为左子树和右子树

与列表类似，我们需要构造下面这些基本操作：

- 空树：`NULL_TREE`
- 判断空树的谓词：`NULLTREE?`
- 取节点：`NODEOF`
- 取左子树：`LEFT_SUBTREE`
- 取右子树：`RIGHT_SUBTREE`
- 构造一棵树：`MAKE_TREE`

仍然以`PAIR`为基本单元，通过`PAIR`的嵌套和组合，就可以构造出来：

```:scheme
(define NULL_TREE
  (PAIR @true @true))

(define NULLLIST?
  (lambda (bt)
    (LEFT bt)))

(define NODEOF
  (lambda (bt)
    (LEFT (RIGHT bt))))

(define LEFT_SUBTREE
  (lambda (bt)
    (LEFT (RIGHT (RIGHT bt)))))

(define RIGHT_SUBTREE
  (lambda (bt)
    (RIGHT (RIGHT (RIGHT bt)))))

(define MAKE_TREE
  (lambda (e left right)
    (PAIR @false (PAIR e (PAIR left right)))))
```

这里可以发现，空树和空表的构造是一致的；整个树状结构的构造，跟线性表的构造也有很大的相似性。因此，完全可以说，线性表可以看成是一棵极度不平衡的二叉树。

事实上，我们完全可以采用另一种方式来实现上面几个基本操作，例如：

```:scheme
(define NULL_TREE ...)

(define NULLLIST? ...)

(define NODEOF ...)

(define LEFT_SUBTREE ...)

(define RIGHT_SUBTREE ...)

(define MAKE_TREE ...)
```

尽管实现方式不同，但是从效果上来说，两种实现是等效的。因此，我们可以说，上面定义的几种操作，构成了对二叉树这一通用结构的接口定义。我们通过约定接口的方式，将二叉树封装进一套功能明确的接口定义中。这样，即便接口的内部实现有变化，只要接口功能不发生变化，外面的用户就不会感觉到变化。将这种思想丰富起来，便产生了对象与类、原型链等花样百出的数据封装手段。

# 第六章：解释

## 符号和解释

## 一个简单的计算器/CAS

## Brainfuck解释器（2017-11-14）

> 2017年11月14日编写，2022年11月22日整理到博客。

Brainfuck的行为几乎完全模仿图灵机，是图灵完备的。这段代码本来是λ演算的学习笔记，后来为了演示λ演算的图灵完备性，干脆从丘奇编码出发，实现了一个Brainfuck解释器。实际上只需要实现μ-递归函数，就可以证明λ演算的图灵完备性。这一点，在《可计算性与计算复杂性导论》的笔记中，已经写过了。

最初的brainfuck.rkt使用了丘奇编码，因此运行时环境在执行步骤间的传递实际上是以闭包形式传递，运行效率极低；并且存在大量重复求值，很难处理具有副作用的指令（即.和,两个指令）。因此使用原生Racket重写了解释器部分（但Y组合子没有移除），运行效率提高。没有实现,指令，因为觉得用处不大，不能说明问题本质。

建议使用DrRacket运行。

<details>
<summary>Church Encoding</summary>

```
#lang racket

; A simple Brainfuck interpreter
; 简单的Brainfuck解释器
; 2017.11.14
; 说明：使用了丘奇编码(https://en.wikipedia.org/wiki/Church_encoding)，从无到有构造解释器。

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 布尔值
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define SHOWBOOL
  (lambda (b)
    (b #t #f)))

(define @true  (lambda (x y) x))
(define @false (lambda (x y) y))

(define NOT
  (lambda (bool)
    (bool @false @true)))

(define AND
  (lambda (boolx booly)
    (boolx booly boolx)))

(define OR
  (lambda (boolx booly)
    (boolx boolx booly)))

(define IS_ZERO
  (lambda (n)
    (n (lambda (x) @false) @true)))

(define IF
  (lambda (p x y)
    (p x y)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 自然数
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define SHOWNUM
  (lambda (n)
    (n (lambda (x) (+ x 1)) 0)))

(define NUM_TO_LAMBDA
  (lambda (number)
    (cond ((= number 0) @0)
          (else (INC (NUM_TO_LAMBDA (- number 1)))))))

(define @0 (lambda (f a) a))

(define @1 (lambda (f a) (f a)))

(define INC
  (lambda (n)
    (lambda (f a)
      (f (n f a)))))

(define ADD
  (lambda (m n)
    (m INC n)))

;Curried-ADD - for function MUL
(define ADD-c
  (lambda (m)
    (lambda (n)
      (m INC n))))

(define MUL
  (lambda (m n)
    (n (ADD-c m) @0)))

;Curried-MUL - for function POW
(define MUL-c
  (lambda (m)
    (lambda (n)
      (n (ADD-c m) @0))))

(define POW
  (lambda (m n)
    (n (MUL-c m) @1)))

;some paticular numbers
(define @2 (lambda (f a) (f (f a))))
(define @3 (lambda (f a) (f (f (f a)))))
(define @4 (lambda (f a) (f (f (f (f a))))))
(define @5 (lambda (f a) (f (f (f (f (f a)))))))
(define @6 (lambda (f a) (f (f (f (f (f (f a))))))))
(define @7 (lambda (f a) (f (f (f (f (f (f (f a)))))))))
(define @8 (lambda (f a) (f (f (f (f (f (f (f (f a))))))))))
(define @9 (lambda (f a) (f (f (f (f (f (f (f (f (f a)))))))))))
(define @10 (lambda (f a) (f (f (f (f (f (f (f (f (f (f a))))))))))))
(define @11 (lambda (f a) (f (f (f (f (f (f (f (f (f (f (f a)))))))))))))
(define @12 (lambda (f a) (f (f (f (f (f (f (f (f (f (f (f (f a))))))))))))))
(define @13 (lambda (f a) (f (f (f (f (f (f (f (f (f (f (f (f (f a)))))))))))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 有序对和减法
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define PAIR
  (lambda (x y)
    (lambda (f)
      (f x y))))

(define LEFT
  (lambda (pair)
    (pair @true)))

(define RIGHT
  (lambda (pair)
    (pair @false)))

;substraction
(define SLIDE
  (lambda (pair)
    (PAIR (RIGHT pair) (INC (RIGHT pair)))))

(define DEC
  (lambda (n)
    (LEFT (n SLIDE (PAIR @0 @0)))))

(define SUB
  (lambda (m n)
    (n DEC m)))

;comparation
(define IS_LE
  (lambda (num1 num2)
    (IS_ZERO (SUB num1 num2))))

(define IS_EQUAL
  (lambda (num1 num2)
    (AND (IS_LE num1 num2) (IS_LE num2 num1))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Z组合子（Y组合子的应用序求值版本）
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;Y-Combinator
;注意：目标函数应使用单参形式
(define Y
  (lambda (S)
    ( (lambda (x) (S (lambda (y) ((x x) y))))
      (lambda (x) (S (lambda (y) ((x x) y)))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 整数（暂时没有用）
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define INT
  (lambda (neg pos)
    (PAIR neg pos)))

(define *ZERO
  (PAIR @0 @0))

(define IS*ZERO
  (lambda (int)
    (AND (IS_ZERO (LEFT  int))
         (IS_ZERO (RIGHT int)))))

;整数标准化，也就是简化成至少一边为0的形式，这样就可以实现绝对值函数和符号函数了
(define *NORMALIZE
  (lambda (int)
    (IF (IS_LE (LEFT int) (RIGHT int))
        (INT @0 (SUB (RIGHT int) (LEFT int)))
        (INT (SUB (LEFT int) (RIGHT int)) @0))))

(define *ABS
  (lambda (int)
    (IF (IS_ZERO (LEFT (*NORMALIZE int)))
        (RIGHT (*NORMALIZE int))
        (LEFT  (*NORMALIZE int)))))

;@true +; @false -
(define *SGN
  (lambda (int)
    (IS_ZERO (LEFT (*NORMALIZE int)))))

(define SHOWINT
  (lambda (int)
    (cond ((SHOWBOOL (*SGN int)) (display "+") (SHOWNUM (*ABS int)))
          (else                  (display "-") (SHOWNUM (*ABS int))))))

(define *ADD
  (lambda (i j)
    (INT (ADD (LEFT  i) (LEFT  j))
         (ADD (RIGHT i) (RIGHT j)))))

(define *MUL
  (lambda (i j)
    (INT (ADD (MUL (LEFT i) (LEFT j)) (MUL (RIGHT i) (RIGHT j)))
         (ADD (MUL (LEFT i) (RIGHT j)) (MUL (RIGHT i) (LEFT j))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 阶乘函数（组合子测试）
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;(display "7!=")
;(SHOWNUM 
;((Y (lambda (f)
;     (lambda (n)
;       (IF (IS_EQUAL n @0)
;           @1
;           (lambda (x y) ((MUL n (f (DEC n)))
;                          x
;                          y))
;       ))))
; @7)
;)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 列表（二叉树）
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define NULL_LIST
  (PAIR @true @true))

(define IS_NULLLIST
  (lambda (list)
    (LEFT list)))

(define CONS
  (lambda (e l)
    (PAIR @false (PAIR e l))))

(define CAR
  (lambda (list)
    (LEFT (RIGHT list))))

(define CDR
  (lambda (list)
    (RIGHT (RIGHT list))))

(define COUNT
  (lambda (l)
    ((Y (lambda (f)
          (lambda (list)
            (IF (NOT (IS_NULLLIST list))
                (lambda (x y) ((INC (f (CDR list)))
                               x
                               y))
                @0))))
     l)))

;(display "Count(1,2,3,3,3)=")
;(SHOWNUM (COUNT (CONS @1 (CONS @2 (CONS @3 (CONS @3 (CONS @3 NULL_LIST)))))))

(define SHOWLIST
  (lambda (list)
    (cond ((SHOWBOOL (IS_NULLLIST list)) (display "N)"))
          (else (display (SHOWNUM (CAR list)))
                (display ",")
                (SHOWLIST (CDR list))))))

;(display "List=(")
;(SHOWLIST (CONS @1 (CONS @2 (CONS @3 (CONS @4 (CONS @5 NULL_LIST))))))
;(newline)

;闭区间
;注意Currying
(define RANGE
  (lambda (m n)
    (((Y (lambda (f)
          (lambda (a)
            (lambda (b)
            (IF (IS_LE a b)
                (lambda (z) ((CONS a ((f (INC a)) b))
                               z ))
                NULL_LIST
            )))))m)n)))

;(COUNT (RANGE @2 @4))
;(display "Range(2,7)=(")
;(SHOWLIST (RANGE @2 @7))
;(newline)


;高阶函数Fold和Map
(define FOLD
  (lambda (list init func)
    ((((Y (lambda (f)
          (lambda (l)
            (lambda (i)
              (lambda (g)
                (IF (IS_NULLLIST l)
                    i
                    (lambda (x y) (
                      (g (CAR l) (((f (CDR l)) i) g))
                      x y))
                ))))))list)init)func)))

(define MAP
  (lambda (list func)
    (((Y (lambda (f)
           (lambda (l)
             (lambda (g)
               (IF (IS_NULLLIST l)
                   NULL_LIST
                   (lambda (x) ((CONS (g (CAR l)) ((f (CDR l)) g)) x))
                )))))list)func)))

; 投影函数（常用）
(define PROJ
  (lambda (list index)
    ((((Y (lambda (f)
            (lambda (l)
              (lambda (i)
                (lambda (j)
                  (IF (IS_EQUAL i j)
                      (CAR l)
                      (lambda (x y) ((((f (CDR l)) i) (INC j)) x y))
                   ))))))list)index)@0)))

;(display "Fold(1:10,0,ADD)=")
;(SHOWNUM (FOLD (RANGE @1 @10) @0 ADD))

;(display "MAP(1:9,0,INC)=(")
;(SHOWLIST (MAP (RANGE @1 @9) INC))
;(newline)

;(display "Proj(2:10,5)=")
;(SHOWNUM (PROJ (MAP (RANGE @1 @9) INC) @5))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 字符和字符串
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;ASCII('A')=65dec

(define $A (MUL @13 @5))
(define Alphabet (RANGE $A (ADD (ADD (ADD $A @10) @10) @5)))
(define $B (PROJ Alphabet @1))
(define $C (PROJ Alphabet @2))
(define $D (PROJ Alphabet @3))
(define $P (PROJ Alphabet @3))
(define $V (PROJ Alphabet (INC (MUL @10 @2)))) ;Variable Flag


;ASCII('a')=97dec
(define $a (ADD (MUL @10 @9) @7))
(define $b (INC $a))

(define SHOWCHAR
  (lambda (num)
    (integer->char (SHOWNUM num))))

(define CHAR_TO_LAMBDA
  (lambda (char)
    (NUM_TO_LAMBDA (char->integer char))))

(define SHOWSTR
  (lambda (cstr)
    (cond ((SHOWBOOL (IS_NULLLIST cstr)) (newline))
          (else (display (SHOWCHAR (CAR cstr))) (SHOWSTR (CDR cstr))))))

(define STR_TO_LAMBDA_ITER
  (lambda (str)
    (lambda (i)
      (cond ((= (+ i 1) (string-length str)) (CONS (CHAR_TO_LAMBDA (string-ref str i)) NULL_LIST))
            (else (CONS (CHAR_TO_LAMBDA (string-ref str i)) ((STR_TO_LAMBDA_ITER str) (+ i 1))))))))

(define STR_TO_LAMBDA
  (lambda (str)
    ((STR_TO_LAMBDA_ITER str) 0)))

;(display "SCharToCNum('a')=")
;(SHOWNUM (CHAR_TO_LAMBDA #\a))

;(display "CNumToSChar($A+@10)=")
;(SHOWCHAR (ADD $A @10))

;(display "ShowString=")
;(SHOWSTR (CONS $A (CONS $B (CONS $C (CONS $D (CONS $D (CONS $D NULL_LIST)))))))

;(display "StringToLambda=")
;(SHOWSTR (STR_TO_LAMBDA "Hello, λ-Calculus!"))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; λ演算的语法结构
;  暂时没有用到
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define Variable
  (lambda (char)
    (PAIR $V char)))

(define Parameter
  (lambda (char)
    (PAIR $P char)))

(define Defination
  (lambda (parameter body)
    (PAIR $D (PAIR (Parameter parameter) (PAIR $B body)))))

(define Application
  (lambda (left right)
    (PAIR $A (PAIR left right))))

(define Type
  (lambda (x)
    (LEFT x)))

(define GetChar
  (lambda varpara
    (RIGHT varpara)))

(define GetVarInDef
  (lambda (defination)
    (LEFT (RIGHT defination))))

(define GetBodyInDef
  (lambda (defination)
    (RIGHT (RIGHT defination))))

(define GetLeft
  (lambda (app)
    (LEFT (RIGHT app))))

(define GetRight
  (lambda (app)
    (RIGHT (RIGHT app))))

;SAMPLE=λa.λb.ab
(define Sample
  (Defination (Variable $a) (Defination (Variable $b) (Application (Variable $a) (Variable $b)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 树形递归举例-斐波那契数
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define Fib
  (lambda (num)
    ((Y (lambda (f)
          (lambda (n)
            (IF (OR (IS_EQUAL n @0) (IS_EQUAL n @1))
                @1
                (lambda (x y) ((ADD (f (SUB n @1)) (f (SUB n @2))) x y))
            )))) num)))

;(SHOWNUM (Fib @6))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Brainfuck解释器
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define @48 (MUL @12 @4))

; Brainfuck运行时环境示例
; 以字符0初始化
; 0位是数据指针DP，1位是程序指针CP，2位（地址0）开始是数据段，52位（地址50）开始是代码段
; BF逻辑地址称为offset，列表物理位置称为index
(define BF_ENV
  (CONS @0 (CONS @48 (STR_TO_LAMBDA "00000000000000000000000"))))

; 调试输出
(define BF_DEBUG
  (lambda (env)
    (newline)
    (display "== BrainFUCK DEBUG ===================================================")(newline)
    (display " DP = ")(display (SHOWNUM (CAR env)))(newline)
    (display " CP = ")(display (SHOWNUM (CAR (CDR env))))(newline)
    (display " LA : 0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF")(newline)
    (display "MEM = ")
    (SHOWSTR (CDR (CDR env)))
    (display "======================================================================")(newline)
    (newline)
  ))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 工具函数
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; 左子列表 [0:index)
(define sub_L
  (lambda (index env)
    (((Y (lambda (f)
           (lambda (e)
             (lambda (iter)
               (IF (IS_EQUAL index iter)
                   NULL_LIST
                   (lambda (x) ((CONS (PROJ e iter) ((f e) (INC iter)))
                                x))
               ))))) env) @0)))

;(display "SUBL(")
;(SHOWLIST (sub_L @0 (STR_TO_LAMBDA "0123456789")))

; 右子列表 (index:N]
(define sub_R
  (lambda (index env)
    (((Y (lambda (f)
           (lambda (e)
             (lambda (iter)
               (IF (IS_ZERO iter)
                   e
                   (lambda (x) (((f (CDR e)) (DEC iter))
                                x))
                ))))) env) (INC index))))

;(display "SUBR(")
;(SHOWSTR (sub_R @0 (STR_TO_LAMBDA "0123456789")))

; 列表连接
(define list_catenate
  (lambda (_pre _post)
    (((Y (lambda (f)
           (lambda (pre)
             (lambda (post)
               (IF (IS_NULLLIST pre)
                   post
                   (lambda (x) ((CONS (CAR pre) ((f (CDR pre)) post))
                                x))
               ))))) _pre) _post)))

;(display "(")
;(SHOWSTR (list_catenate (STR_TO_LAMBDA "0123") (STR_TO_LAMBDA "456789")))


; 计算数据指针的物理地址index
(define data_index
  (lambda (env)
    (ADD @2 (CAR env))))

; 读取当前指针指向的cell值
(define read_data
  (lambda (env)
    (PROJ env (data_index env))))

;(display "read_data=")
;(SHOWNUM (read_data (CONS @1 (CONS @2 (STR_TO_LAMBDA "000000000")))))

; 修改当前指针指向的cell值
; 注意：传入单参函数
(define modify_data
  (lambda (func env)
    (list_catenate (sub_L (data_index env) env)
                   (CONS (func (read_data env))
                         (sub_R (data_index env) env)))))

;(display "modify_data=")
;(BF_DEBUG (modify_data (ADD-c @5) (CONS @5 (CONS @2 (STR_TO_LAMBDA "000000000")))))

; 计算程序指针的物理地址index
(define code_index
  (lambda (env)
    (ADD @2 (CAR (CDR env)))))

; 取CP指向的指令码
(define read_code
  (lambda (env)
    (PROJ env (code_index env))))

;(display "read_code=")
;(SHOWCHAR (read_code (CONS @1 (CONS @3 (STR_TO_LAMBDA "000C00000")))))

; 计算当前指令逻辑地址（offset）左侧的**匹配**的“[”指令的所在物理地址（index）
; 这里计算的是（当前所在内层）循环的入口地址
(define ret_index
  (lambda (env)
    ((((Y (lambda (f)
            (lambda (e)
              (lambda (cindex)
                (lambda (flag)
                  (IF (IS_EQUAL (PROJ env cindex) (CHAR_TO_LAMBDA #\]))
                      (lambda (x y) ((((f env) (DEC cindex)) (INC flag)) x y))
                      (lambda (x y) (
                         (IF (IS_EQUAL (PROJ env cindex) (CHAR_TO_LAMBDA #\[))
                             (lambda (x y) (
                                (IF (IS_ZERO flag)
                                    cindex
                                    (lambda (x y) ((((f env) (DEC cindex)) (DEC flag)) x y))
                                ) x y))
                             (lambda (x y) (
                                (((f env) (DEC cindex)) flag) x y))
                          ) x y))
                  )))))) env) (DEC (code_index env))) @0)))


;(display "ret[_index=")
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;0123456789ABCD(index)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;0123456789AB(offset)
;(SHOWNUM (ret_index (CONS @0 (CONS @7 (STR_TO_LAMBDA "[[[[[][]A]]]]1234")))))

; 计算当前指令逻辑地址（offset）右侧的**匹配**的“]”指令的所在物理地址（index）的后一位
; 这里计算的是（当前所在内层）循环的跳出地址
(define pass_index
  (lambda (env)
    ((((Y (lambda (f)
            (lambda (e)
              (lambda (cindex)
                (lambda (flag)
                  (IF (IS_EQUAL (PROJ env cindex) (CHAR_TO_LAMBDA #\[))
                      (lambda (x y) ((((f env) (INC cindex)) (INC flag)) x y))
                      (lambda (x y) (
                         (IF (IS_EQUAL (PROJ env cindex) (CHAR_TO_LAMBDA #\]))
                             (lambda (x y) (
                                (IF (IS_ZERO flag)
                                    (INC cindex)
                                    (lambda (x y) ((((f env) (INC cindex)) (DEC flag)) x y))
                                ) x y))
                             (lambda (x y) (
                                (((f env) (INC cindex)) flag) x y))
                          ) x y))
                  )))))) env) (INC (code_index env))) @0)))

;(display "pass]_index=")
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;0123456789ABCDEF(index)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;0123456789ABCDEF(offset)
;(SHOWNUM (pass_index (CONS @0 (CONS @3 (STR_TO_LAMBDA "0[A[A]A[A]A]]]]1234")))))

; 修改指令指针（下条指令逻辑地址）
(define modify_code_offset_0
  (lambda (coffset env)
    (list_catenate (sub_L @1 env)
                   (CONS coffset
                         (sub_R @1 env)))))

; 修改指令指针（简化版）
(define modify_code_offset
  (lambda (coffset env)
    (CONS (CAR env) (CONS coffset (sub_R @1 env)))))

;(display "modify_code_offset+2!!!=")
;(SHOWNUM (code_index (modify_code_offset @10 
;                                         (CONS @0 (CONS @7 (STR_TO_LAMBDA "[[[[[][]A]]]]1234")))
;                                         )))

; 获取下一条指令的逻辑地址
(define next
  (lambda (env)
    (INC (CAR (CDR env)))))

; CP加一
(define cp++
  (lambda (env)
    (modify_code_offset (INC (CAR (CDR env))) env)))

;(BF_DEBUG (cp++ (CONS @0 (CONS @5 (STR_TO_LAMBDA "12000[->+<]  ")))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 指令语义
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
             
; Note: Every lambda function representing a Brainfuck instruction
;       receives an OLD ENV and returns a NEW ENV.
(define >
  (lambda (env)
    (cp++ (CONS (INC (CAR env)) (CDR env)))))

(define <
  (lambda (env)
    (cp++ (CONS (DEC (CAR env)) (CDR env)))))

(define ++
  (lambda (env)
    (cp++ (modify_data INC env))))

(define --
  (lambda (env)
    (cp++ (modify_data DEC env))))

; .
(define o
  (lambda (env)
    (cp++ (SHOWCHAR (PROJ env (INC (CAR env)))))))

; ,暂不实现

;(BF_DEBUG (> (CONS @0 (CONS @5 (STR_TO_LAMBDA "12000[->+<]  ")))))

; [
(define loopl
  (lambda (env)
    (IF (IS_EQUAL (CHAR_TO_LAMBDA #\0) (read_data env))
        (lambda (x) ((modify_code_offset (SUB (pass_index env) @2) env) x)) ;直接跳出
        (lambda (x) ((cp++ env) x)) ;下条指令
    )))

;(display "loopl=")
;(SHOWLIST (loopl (CONS @0 (CONS @3 (STR_TO_LAMBDA "1[A[A]A[A]A]]]]1234")))))

; ]
(define loopr
  (lambda (env)
    (modify_code_offset (SUB (ret_index env) @2) env)))

;(display "loopr=")
;(SHOWLIST (loopr (CONS @0 (CONS @5 (STR_TO_LAMBDA "1[A[A]A[A]A]]]]1234")))))


; 单步执行：执行当前CP指向的指令
; 执行的结果当然是保存在新的env里面啦
(define step
  (lambda (env)
    (IF (IS_EQUAL (read_code env) (CHAR_TO_LAMBDA #\+))
        (lambda (x) ((++ env) x))
        (lambda (x) (
           (IF (IS_EQUAL (read_code env) (CHAR_TO_LAMBDA #\-))
               (lambda (x) ((-- env) x))
               (lambda (x) (
                  (IF (IS_EQUAL (read_code env) (CHAR_TO_LAMBDA #\>))
                      (lambda (x) ((> env) x))
                      (lambda (x) (
                         (IF (IS_EQUAL (read_code env) (CHAR_TO_LAMBDA #\<))
                             (lambda (x) ((< env) x))
                             (lambda (x) (
                                (IF (IS_EQUAL (read_code env) (CHAR_TO_LAMBDA #\o))
                                    (lambda (x) ((o env) x))
                                    (lambda (x) (
                                       (IF (IS_EQUAL (read_code env) (CHAR_TO_LAMBDA #\i))
                                           (lambda (x) ((o env) x)) ;暂未实现
                                           (lambda (x) (
                                              (IF (IS_EQUAL (read_code env) (CHAR_TO_LAMBDA #\[))
                                                  (lambda (x) ((loopl env) x))
                                                  (lambda (x) (
                                                     (IF (IS_EQUAL (read_code env) (CHAR_TO_LAMBDA #\]))
                                                         (lambda (x) ((loopr env) x))
                                                         env ; 未知指令，不执行任何动作
                                                     ) x))
                                              ) x))
                                       ) x))
                                ) x))
                         ) x))
                  ) x))
           ) x))
     )))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 执行加速
;   避免对过长的表达式求值
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define to_string
  (lambda (env)
    (cond ((SHOWBOOL (IS_NULLLIST env)) "")
          (else (string-append (make-string 1 (SHOWCHAR (CAR env))) (to_string (CDR env)))))))

(define STEPx
  (lambda (prev_env)
    (step (CONS (CAR prev_env) (CONS (CAR (CDR prev_env)) (STR_TO_LAMBDA (to_string (CDR (CDR prev_env)))))))))

(define ENVx
  (lambda (stepx)
    (CONS (CAR stepx) (CONS (CAR (CDR stepx)) (STR_TO_LAMBDA (to_string (CDR (CDR stepx))))))))

(define ITER
  (lambda (env)
    (ENVx (STEPx env))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 解释器主体
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; Brainfuck初始环境，含数据初值和代码
; 程序意义：计算逻辑地址0和1位置两个数字的和，并将结果保存在1位置。
;                 DP       CP                 MEMORY(TAPE)
(define env (CONS @0 (CONS @2 (STR_TO_LAMBDA "23[->+<]$"))))

; 解释器
;   读取到$字符时停止，并输出调试信息
(define bf_interpreter
  (lambda (env)
    (cond ((SHOWBOOL (IS_EQUAL (read_code env) (CHAR_TO_LAMBDA #\$))) (BF_DEBUG env))
          (else (bf_interpreter (ITER env))))))

; 开始解释执行
(bf_interpreter env)
```

</details>

<details>
<summary>Raw Racket</summary>

```
#lang racket

; A simple Brainfuck interpreter
; 简单的Brainfuck解释器
; 2017.11.14

; 应用序的Y不动点组合子（可以不需要）
(define Y
  (lambda (S)
    ( (lambda (x) (S (lambda (y) ((x x) y))))
      (lambda (x) (S (lambda (y) ((x x) y)))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Brainfuck运行时环境初始化
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; Brainfuck运行时环境说明
;   BF运行时环境为Scheme列表
;   列表首元素为0位，地址称为index，相当于物理地址
;   index为0、1的两个元素分别是数据指针（DP）和代码指针（CP）
;   index从2开始的部分是数据区和代码区，相对于index=2的元素的偏移量为offset，相当于逻辑地址
;   DP和CP保存的都是offset，即index-2
;   DP是BF的<>两个指令控制的指针，其初始值为0
;   数据区从offset=0开始
;   CP是待执行指令的指针，相当于程序计数器，其初始值由用户指定
;   代码区从offset=初始CP开始
;   数据区默认值为0，代码区存储指令的ASCII码
;   代码以空格结束，解释器通过空格判断程序结束
;
;   例如
;   [ index] 0123456789ABCDEF
;   [offset] --0123456789ABCD
;   [memory] 0223[->+<]_
;
;   上面这段程序将逻辑地址0上面的数字加到逻辑地址1上。下划线代表空格。

; 环境构建
(define env_constructer
  (lambda (dp_init cp_init code_str)
    (lambda (iter)
        (if (= iter 0)
            (cons dp_init ((env_constructer dp_init cp_init code_str) (+ iter 1)))
            (if (= iter 1)
                (cons cp_init ((env_constructer dp_init cp_init code_str) (+ iter 1)))
                (if (<= iter (+ 1 cp_init))
                    (cons 0 ((env_constructer dp_init cp_init code_str) (+ iter 1)))
                    (if (> iter (+ (+ cp_init (string-length code_str)) 1))
                        '()
                        (cons (char->integer (string-ref code_str (- iter (+ 2 cp_init))))
                              ((env_constructer dp_init cp_init code_str) (+ iter 1))))))))))

; 环境初始化
(define ENV_INIT (lambda (dp_init cp_init code_str) ((env_constructer dp_init cp_init code_str) 0)))

; 手动设置数据区
(define MEM_SET (lambda (env addr value) (list-set env (+ 2 addr) value)))

; 打印一行字符串
(define printstr
  (lambda (cstr)
    (cond ((null? cstr) (newline))
          (else (display (integer->char (car cstr))) (printstr (cdr cstr))))))

; 调试输出
(define BF_DEBUG
  (lambda (env)
    (display "== BrainFUCK DEBUG ===================================================")(newline)
    (display " DP = ")(display (car env))(newline)
    (display " CP = ")(display (car (cdr env)))(newline)
    (display " LA : 0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF")(newline)
    (display "MEM = ")
    (printstr (cdr (cdr env)))
    (display "======================================================================")(newline)
  ))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 列表工具函数
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; 左子列表 [0:index)
(define sub_L
  (lambda (index env)
    (((Y (lambda (f)
           (lambda (e)
             (lambda (iter)
               (if (= index iter)
                   '()
                   (cons (list-ref e iter) ((f e) (+ iter 1)))
               ))))) env) 0)))

; 右子列表 (index:N]
(define sub_R
  (lambda (index env)
    (((Y (lambda (f)
           (lambda (e)
             (lambda (iter)
               (if (= 0 iter)
                   e
                   ((f (cdr e)) (- iter 1))
                ))))) env) (+ index 1))))

; 列表连接
(define list_catenate
  (lambda (_pre _post)
    (((Y (lambda (f)
           (lambda (pre)
             (lambda (post)
               (if (null? pre)
                   post
                   (cons (car pre) ((f (cdr pre)) post))
               ))))) _pre) _post)))


; 列表置数
(define list-set
  (lambda (list index value)
    (list_catenate (sub_L index list)
                   (cons value
                         (sub_R index list)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 环境访问函数
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; 计算数据指针的物理地址index
(define data_index
  (lambda (env)
    (+ 2 (car env))))

; 读取当前指针指向的cell值
(define read_data
  (lambda (env)
    (list-ref env (data_index env))))

; 修改当前指针指向的cell值
; 注意：传入单参函数
(define modify_data
  (lambda (func env)
    (list_catenate (sub_L (data_index env) env)
                   (cons (func (read_data env))
                         (sub_R (data_index env) env)))))

; 计算程序指针的物理地址index
(define code_index
  (lambda (env)
    (+ 2 (car (cdr env)))))

; 取CP指向的指令码
(define read_code
  (lambda (env)
    (list-ref env (code_index env))))

; 计算当前指令逻辑地址（offset）左侧的**匹配**的“[”指令的所在物理地址（index）
; 这里计算的是（当前所在内层）循环的入口地址
(define ret_index
  (lambda (env)
    ((((Y (lambda (f)
            (lambda (e)
              (lambda (cindex)
                (lambda (flag)
                  (if (= (list-ref env cindex) 93)
                      (((f env) (- cindex 1)) (+ flag 1))
                      (if (= (list-ref env cindex) 91)
                          (if (= flag 0)
                              cindex
                              (((f env) (- cindex 1)) (- flag 1)))
                          (((f env) (- cindex 1)) flag)))
                  ))))) env) (- (code_index env) 1)) 0)))

; 计算当前指令逻辑地址（offset）右侧的**匹配**的“]”指令的所在物理地址（index）的后一位
; 这里计算的是（当前所在内层）循环的跳出地址
(define pass_index
  (lambda (env)
    ((((Y (lambda (f)
            (lambda (e)
              (lambda (cindex)
                (lambda (flag)
                  (if (= (list-ref env cindex) 91)
                      (((f env) (+ cindex 1)) (+ flag 1))
                      (if (= (list-ref env cindex) 93)
                          (if (= flag 0)
                              (+ cindex 1)
                              (((f env) (+ cindex 1)) (- flag 1)))
                          (((f env) (+ cindex 1)) flag)))
                 ))))) env) (+ (code_index env) 1)) 0)))

; 修改指令指针（下条指令逻辑地址）
(define modify_code_offset
  (lambda (coffset env)
    (cons (car env) (cons coffset (sub_R 1 env)))))

; 获取下一条指令的逻辑地址
(define next
  (lambda (env)
    (+ 1 (car (cdr env)))))

; CP加一
(define cp++
  (lambda (env)
    (modify_code_offset (+ 1 (car (cdr env))) env)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 指令语义
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define p>
  (lambda (env)
    (cp++ (cons (+ 1 (car env)) (cdr env)))))

(define p<
  (lambda (env)
    (cp++ (cons (- (car env) 1) (cdr env)))))

(define ++
  (lambda (env)
    (cp++ (modify_data (lambda (x) (+ x 1)) env))))

(define --
  (lambda (env)
    (cp++ (modify_data (lambda (x) (- x 1)) env))))

; .
(define o
  (lambda (env)
    (display (integer->char (read_data env)))
    (cp++ env)))

; ,暂不实现

; [
(define loopl
  (lambda (env)
    (if (= 0 (read_data env))
        (modify_code_offset (- (pass_index env) 2) env) ;直接跳出
        (cp++ env) ;下条指令
    )))

; ]
(define loopr
  (lambda (env)
    (modify_code_offset (- (ret_index env) 2) env)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 解释器主体
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; 单步执行：执行当前CP指向的指令
; 执行的结果当然是保存在新的env里面啦
(define step
  (lambda (env)
    (if (= (read_code env) 43) ;+
        (++ env)
        (if (= (read_code env) 45) ;-
            (-- env)
            (if (= (read_code env) 62) ;>
                (p> env)
                (if (= (read_code env) 60) ;<
                    (p< env)
                    (if (= (read_code env) 46) ;.
                        (o env)
                        (if (= (read_code env) 44) ;,
                            (p> env) ;暂未实现
                            (if (= (read_code env) 91) ;[
                                (loopl env)
                                (if (= (read_code env) 93) ;]
                                    (loopr env)
                                    env ; 未知指令，不执行任何动作
                                ))))))))))

; 主函数
;   读取到空白字符（32）时停止，并输出调试信息
(define bf_interpreter
  (lambda (env cnt)
    (cond ((= (read_code env) 32) (BF_DEBUG env)
                                  (display "iteration steps = ")(display cnt))
          (else (bf_interpreter (step env) (+ cnt 1))))))

; 设置环境
(define env
  (ENV_INIT 0 20 "++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++. "))

; 开始解释执行
(bf_interpreter env 0)
```

</details>

## 语言层次

![自动机层次](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Automata_theory.svg/320px-Automata_theory.svg.png)

- 正则语言/文法（3）-有限状态自动机
- 上下文无关语言/文法（2）-下推自动机
- 上下文有关语言/文法（1）-线性有界图灵机
- 递归可枚举语言/短语结构文法（0）-图灵机

# 第七章：无穷

## 计算续体（Continuation）简介（2017-11-22）

> 本节翻译自[https://www.scheme.com/tspl4/further.html#./further:h3]()

在S-表达式求值过程中，解释器需要持续关注两件事情：

+ 要求值什么
+ 对求得的值做何种处理

我们来思考一下，下列S-表达式中`(null? x)`的求值过程是怎样的：

```:Scheme
(if (null? x) (quote ()) (cdr x))
```

解释器先求值`(null? x)`，然后根据得到的值去求解接下来的`(quote ())`或者是`(cdr x)`。在这个例子中，“要求值的东西”当然是`(null? x)`，对求得的值做的“处理”就是决定求值两个分支中的哪一个，并且求值被选中的分支。我们把“对求得的值所做的后续处理”称为计算过程的“%%continuation%%”。

因此，在任意S-表达式求值过程的任何一个时刻，都有一个待完成的continuation。继续刚才的例子。我们不妨假设`x`的值是`(a b c)`，可以提取出上述表达式的6个continuation，这6个continuation分别需要：

- `(if (null? x) (quote ()) (cdr x))`的值；
- `(null? x)`的值；
- `null?`的值；
- `x`的值；
- `cdr`的值，以及；
- 再次需要`x`的值；

`(cdr x)`的continuation没有写在上面，因为它的continuation就是整个表达式的continuation。

> 因为这整个式子就（可能）是在计算`(cdr x)`

在Scheme中，我们可以使用`call/cc`过程来捕获任一S-表达式的continuation。`call/cc`接受一个单参的函数`p`作为参数，并构造当前continuation作为实际参数传递给`p`的唯一参数。Continuation本身一般以过程`k`表示，每当`k`作用于一个值时，即将该值传递给`call/cc`调用点的continuation，供其调用，并返回此调用的返回值。本质上讲，这个返回值就是`call/cc`调用的返回值。

如果`p`没有调用`k`即返回，那么过程返回的值就是`call/cc`调用返回的值。

考虑下面的几个简单例子：

```:Scheme
(call/cc
  (lambda (k)
    (* 5 4))) → 20 

(call/cc
  (lambda (k)
    (* 5 (k 4)))) → 4 

(+ 2
   (call/cc
     (lambda (k)
       (* 5 (k 4))))) → 6
```

第一个例子中，`call/cc`捕获continuation并将其绑定到`k`，但是`k`没有被调用，所以过程的返回值就是20。第二个例子中，continuation`k`在乘法过程之前被调用，因此整个过程的返回值就是传给`k`的值，也就是4。第三个例子中，continuation包括“+2”的操作，因此整个过程的返回值是`(+ 2 4)`的值，也即6。

下面的例子演示了递归过程的“非本地退出”，没有前面的例子那么简单了。

```:Scheme
(define product
  (lambda (ls)
    (call/cc
      (lambda (break)
        (let f ([ls ls])
          (cond
            [(null? ls) 1]
            [(= (car ls) 0) (break 0)]
            [else (* (car ls) (f (cdr ls)))]))))))

(product '(1 2 3 4 5)) → 120
(product '(7 3 8 0 1 9 5)) → 0
```

所谓的“非本地退出”可以使`product`遇到0时立即返回，不必完成尚未执行的后续步骤。上面的所有continuation调用都返回到各自的continuation位置，而控制流仍然留在被传入`call/cc`的过程`p`中。下面的例子将在过程`p`返回后再使用continuation。

```:Scheme
(let ([x (call/cc (lambda (k) k))])
  (x (lambda (ignore) "hi"))) → "hi"
```

该例中，由`call/cc`捕获的continuation可以这样描述：“将`call/cc`返回值绑定到`x`，然后将`x`的值作用于`(lambda (ignore) "hi")`的值上面”。由于`(lambda (k) k)`原样返回其参数，因此`x`被绑定到continuation上（`x`自己就是continuation）。随后，这段continuation又作用于`(lambda (ignore) "hi")`的值上，结果就是再次对`x`进行绑定，也就是将`(lambda (ignore) "hi")`的值绑定于`x`，并且将其作用于`(lambda (ignore) "hi")`自身。由于`ignore`参数如其名，因此最终返回的就是"hi"。

> 注：这段稍微有点绕，自己再解释一下。对于调用`call/cc`的时刻来说，其后续过程就是函数体中的`(x (lambda (ignore) "hi"))`这段application。然而在let块中，通过`(call/cc (lambda (x) x))`这个原样返回continuation的操作，恰恰将其绑定到continuation里面的`x`上面，这就导致在continuation里面有对自己这个continuation的引用，也即

> ```:Scheme
x := (x (lambda (ignore) "hi"))
```

> 所以执行函数体的时候，求值过程是这样的：

> ```:Scheme
(x (lambda (ignore) "hi"))
;; next
((lambda (□)
   (□ (lambda (ignore) "hi"))) ;这个就是x所代表的那个continuation，这里写成了CPS的形式方便理解。实际上这里是“一等continuation”，并不是单纯的函数。
 (lambda (ignore) "hi"))
;; next
((lambda (ignore) "hi")
 (lambda (ignore) "hi"))
;; next
"hi"
```

下面的这段代码是前一个例子的变形版本，相当难懂。可能很容易就看出来返回的是什么，但要想清楚为什么会返回"HEY!"，就需要好好琢磨琢磨了。

```:Scheme
(((call/cc (lambda (k) k))
  (lambda (x) x))
 "HEY!")
→ "HEY!"
```

在上面的代码中，`call/cc`的返回值是它自己的continuation，此返回值作用在后面的恒等函数上，因而`call/cc`再次返回同样的返回值（也即含有恒等函数的continuation）。随后，恒等函数作用于自身，得到的仍然是恒等函数。最终，恒等函数作用于"HEY!"，得到"HEY!"。

Continuations的使用并不都是这样难以理解。请看下面的`factorial`函数，此函数在返回出口值“1”之前捕获到后续的continuation，并将其赋值到顶层变量`retry`上。代码如下：

```:Scheme
(define retry #f) 

(define factorial
  (lambda (x)
    (if (= x 0)
        (call/cc (lambda (k) (set! retry k) 1))
        (* x (factorial (- x 1))))))
```

根据此定义，`factorial`可以正常计算阶乘，但同时有赋值`retry`的副作用。

```:Scheme
(factorial 4) → 24
(retry 1) → 24
(retry 2) → 48
```

可以这样描述绑定于`retry`的continuation：“将所需的值乘以1，然后继续对结果乘以2、3、4”（也就是`(lambda (res) (* 4 (* 3 (* 2 (* 1 res)))))`）。假如我们为这个continuation提供一个不同于1的值，这样就相当于改变了阶乘的递归出口值并导致不同的计算结果，比如：

```:Scheme
(retry 2) → 48
(retry 5) → 120
```

利用`call/cc`的这种机制，可以基于它实现一个断点工具包。每当遇到断点，都会保存断点处的continuation，这样即可实现从断点处恢复计算的功能。（如果需要的话，可以设置不止一个断点。）

利用continuation，还可以实现各种形式的多任务系统。下面的代码定义了一个简单的“轻量级进程”系统，该系统允许多个进程进入系统运行。由于系统是**非抢占式**的，因此每个进程必须时不时地自觉“暂停”自己，以允许其他进程运行。实现如下：

```:Scheme
(define lwp-list '())
;'
(define lwp
  (lambda (thunk)
    (set! lwp-list (append lwp-list (list thunk))))) 

(define start
  (lambda ()
    (let ([p (car lwp-list)])
      (set! lwp-list (cdr lwp-list))
      (p))))

(define pause
  (lambda ()
    (call/cc
      (lambda (k)
        (lwp (lambda () (k #f)))
        (start)))))
```

下面的几个轻量级进程按顺序执行、无限循环，打印出无限长度的"hey!\n"字符串。

```:Scheme
(lwp (lambda () (let f () (pause) (display "h") (f))))
(lwp (lambda () (let f () (pause) (display "e") (f))))
(lwp (lambda () (let f () (pause) (display "y") (f))))
(lwp (lambda () (let f () (pause) (display "!") (f))))
(lwp (lambda () (let f () (pause) (newline) (f))))
(start) → hey!
          hey!
          hey!
          hey!
          ...
```

> 关于thunk，参见[http://www.ruanyifeng.com/blog/2015/05/thunk.html]()

在[12.11](https://www.scheme.com/tspl4/examples.html#g208)节中，我们使用`call/cc`实现了一个支持抢占式调度的多任务系统“Engine”。

**习题3.3.1** ：请仅使用`call/cc`编写一个无限循环的程序，按顺序打印从0开始的所有自然数。不要使用递归和赋值。

**译者提供的参考实现**

```:Scheme
(define invoke-self
  (lambda (f)
    ((lambda (x)
       ((x f) 0))
     (call/cc (lambda (k) k)))
  ))

(invoke-self (lambda (f)
               (lambda (n)
                 (display n)(newline)
                 ((f f) (+ n 1)))))
```

译者注：这个函数受到前文中输出“hi”的那个函数的启发。另外，作为`invoke-self`函数参数的那个函数，实际上是构造Y组合子的一个“前体”。这里构造无限循环的思路，正是受到Y组合子的启发。

**习题3.3.2**：不使用`call/cc`，重写`product`函数，保留原有函数功能，即若参数表中有0，则不执行乘法。

**译者提供的参考实现**

```:Scheme
(define product
  (lambda (list)
    (display (car list))(newline)
    (if (null? list)
        1
        (if (= 0 (car list))
            0
            (* (car list) (product (cdr list)))))))
```

**习题3.3.3**：假设由`lwp`创建的轻量级进程运行完毕终止，也就是不调用`(pause)`即退出，会发生什么现象？请定义`quit`函数，使得进程在不影响lwp系统的情况下正常终止。注意处理系统中只有一个进程的情况。

**修改后的一个版本（3.3.5也有做）**

```:Scheme
#lang racket
(define lwp-list '())
;'
(define lwp
  (lambda (pid thunk)
    ;(printf "[New Process ~a Interleaved]\n" pid)
    (set! lwp-list (append lwp-list (list thunk)))))

(define start-next
  (lambda ()
    ;(printf "[Start next]\n")
    (let ([p (car lwp-list)])
      (set! lwp-list (cdr lwp-list))
      (p))))

(define wait-this-and-start-next
  (lambda (pid)
    ;(printf "[Process ~a Waiting]\n [Going to interleave Continuation of ~a]\n" pid pid)
    (call/cc
      (lambda (k)
        (lwp pid (lambda () (k #t)))
        (start-next)))))

(define quit
  (lambda (return v)
    (printf "\n[Process ~a Terminated]\n" (car v))
    (if (null? lwp-list)
        (return (car (cdr v)))
        (start-next))))

(printf "\nLWP:Returned to ENV with ~a"
(call/cc (lambda (return) (

(lwp 200
     (lambda ()
       (let this ((x 0) (pid 200))
            (wait-this-and-start-next pid)
            (printf "Process[~a] Running\n" pid)
            (printf "运行计数~a\n" x)
            (if (= x 20)
                (quit return (list pid x))
                #f)
            (this (+ x 1) pid))))

(lwp 300
     (lambda ()
       (let this ((x 0) (pid 300))
            (wait-this-and-start-next pid)
            (printf "Process[~a] Running\n" pid)
            (printf "运行计数~a\n" x)
            (cond ((= x 10) (printf "加入新进程404\n")
                            (lwp 404
                                 (lambda ()
                                   (let f ((y 0) (pid 404))
                                        (wait-this-and-start-next pid)
                                        (printf "Forked Process: ~a\n" y)
                                        (if (= y 2)
                                            (quit return (list 404 888))
                                            #f)
                                        (f (+ 1 y) pid))))
                            (quit return (list pid x)))
                  (else #f))
            (this (+ x 1) pid))))

(start-next)
))))
```

**习题3.3.4**：在lwp系统中，每次调用`lwp`创建新进程，都会复制一遍进程表`lwp-list`，因为在先前的实现中使用了`append`函数将新进程添加到进程表。请用[2.9](https://www.scheme.com/tspl4/start.html#g40)节实现的队列结构，修改原有的lwp代码，以避免这个问题。

**习题3.3.5**：lwp系统支持动态创建新进程。正文中没有给出例子，所以请你设计一个进程动态创建的实际应用，并且使用lwp系统将其实现出来。

## 阴阳问题分析（2018-02-11）

阴阳问题（Yin-yang Puzzle）是法国人David Madore设计的一段小程序，用来展示程序语言中“Continuation”的概念。这位大佬在自己设计的基于组合子的语言“Unlambda”的主页上写道：

> Your Functional Programming Language Nightmares Come True

emmm...阴阳问题的确比较令人费解，难倒了不少初学者，当然也包括我。查阅了一些资料，结合自己使用脑内虚拟机仔细模拟之后，终于稍稍理解了一点。因此写下这篇文章，用来记录自己对此问题的解析和理解。

**什么是阴阳问题**

阴阳问题是一段短小的、无限循环的程序。其Scheme代码如下：

```:Scheme
(let* ((yin
         ((lambda (cc) (display #\@) cc) (call/cc (lambda (c) c))))
       (yang
         ((lambda (cc) (display #\\*) cc) (call/cc (lambda (c) c)))))
    (yin yang))
```

运行此程序，理论上会输出无穷长的“@\*..”序列。实际输出的序列长度，与实现阴阳问题的语言和运行环境（例如栈空间）有关。

```
@*@**@***@****@*****@******@...
```

尽管阴阳问题的代码十分短小，但却使用了两次`call/cc`，这就使程序的执行面貌变得难以理解。`call/cc`是Scheme的特色，它可以显式地捕获程序在某一位置的上下文环境，即continuation，并保存为一等continuation，供程序员随时调用。有了对一等continuation的支持，Scheme就可以随心所欲地控制程序的执行顺序，实现多重循环跳出、协程、异常处理等普通的递归程序难以实现的功能。从面向问题的角度看。continuation和`call/cc`是很容易理解的，因为它将程序控制流封装起来，是高度抽象的。但是从面向执行的角度看，程序的执行面貌，就变得复杂了许多。

下文从理解`call/cc`开始，逐步解析阴阳问题的执行细节。

**理解call/cc**

call/cc，全称call-with-current-continuation，可以捕获程序运行到call/cc时候的continuation。在Racket或者Scheme中，`call/cc`接受一个单参函数作为它的参数，也就是`(call/cc (lambda (k) body))`的形式。之所以选用字母k，是因为`call/cc`会把取得的continuation传给`k`，然后在`body`中使用它。一旦`body`中**有调用**`k`，则整个call/cc返回的结果就是continuation的执行结果，而与`body`中的其他计算无关（因此这一特性可以用来打断点）；如果`body`中**没有调用**`k`，那么call/cc返回的结果就是`body`的值。

在[*Scheme and the art of programming*](http://www.doc88.com/p-7029536419237.html)一书中，以一整个章节讲了continuation和call/cc，据说是讲continuation讲得最透彻的一本书。此书将continuation的行为描述为一个“escaper”，相当贴切的一个词。根据各位逻辑学大佬的想法，在经典lambda演算中，是没有办法实现跳出动作的，所以说它很特殊。

我们可以利用call/cc和恒等函数，构造一个常用形式（如下），用来获取调用时刻的continuation：

```:Scheme
(call/cc (lambda (k) k))
```

有了这个常用形式之后，我们考虑下面这个例子，用来热身（[例子出处](https://www.scheme.com/tspl4/further.html)）：

```:Scheme
(((call/cc (lambda (x) x))
  (lambda (x) x)) "Hey")
```

其输出是“Hey”。这段代码中，用到了上面所说的特殊形式，于是整个程序的功能就是：用恒等函数去调整个程序的continuation，然后用结果去调“Hey”，其实也就是用整个程序的continuation去调“Hey”。当调用`call/cc`的时候，`call/cc`创造了一个新的环境，是这样的：

```:Scheme
((□
  (lambda (x) x)) "Hey")
```

把恒等函数塞进这个continuation挖的坑里面，就是

```:Scheme
(((lambda (x) x)
  (lambda (x) x)) "Hey")
```

到这里，就很容易知道结果是“Hey”了。后文中的分析，其实也是同样的方法，只是创造出来的平行世界多了一点而已。

维基百科还给了一个例子，我贴在这里：

```:Scheme
;; [LISTOF X] -> ( -> X u 'you-fell-off-the-end)
(define (generate-one-element-at-a-time lst)

  ;; Hand the next item from a-list to "return" or an end-of-list marker
  (define (control-state return)
    (for-each 
     (lambda (element)
               (set! return (call/cc
                              (lambda (resume-here)
                                ;; Grab the current continuation
                               (set! control-state resume-here)
                               (return element)))))
     lst)
    (return 'you-fell-off-the-end))
  
  ;; (-> X u 'you-fell-off-the-end)
  ;; This is the actual generator, producing one item from a-list at a time
  (define (generator)
    (call/cc control-state))

  ;; Return the generator 
  generator)

(define generate-digit
  (generate-one-element-at-a-time '(0 1 2)))

(generate-digit) ;; 0
(generate-digit) ;; 1
(generate-digit) ;; 2
(generate-digit) ;; you-fell-off-the-end
```

要理解这段程序的行为，首先要知道，顶级符号`generate-one-element-at-a-time`是一个闭包，里面维护着`lst`这个在作用域内有效的变量。还要知道，`for-each`函数可以遍历列表的每一个element，那么抽象地说，每次迭代的continuation都包含“尚未看到的”那部分列表。因此，可以使用call/cc获取每次遍历的continuation，动态地控制程序的流向。

当我们调用`generate-one-element-at-a-time`的时候，我们实际上是调用其内部的`generator`也就是`(call/cc control-state)`。我们知道，call/cc的返回值取决于`control-state`内部有没有调用它的参数`return`，我们发现，它确实调用了，并且返回的是当前看到的element。这个`return`的作用，就像命令式语言中的break或者continue（干脆就说return吧）。程序只要运行到`(return element)`，一下子就会跳出call/cc，所以会直接返回element。不考虑其他情况，如果遍历中遇到`(return element)`，那么遍历过程实际上并不能往前移动，因为第一次就会跳出循环。

在这个基础上，为了实现每次得到的值都不一样，既然每次都只能取得列表的第一个值，那么就可以在跳出遍历之前保存当前的continuation。这样，第二次调用`(call/cc control-state)`，实际上就是调用未来的、即将执行的、后续下一步的`control-state`。结合`generate-one-element-at-a-time`的闭包特性，就实现了每次调用都输出下一个值的功能。

---

还有一个例子。考虑比较容易理解的阶乘函数：

```:Scheme
(define retry #f)

(define factorial
  (lambda (x)
    (if (= x 0)
        (call/cc (lambda (k) (set! retry k) 1))
        (* x (factorial (- x 1))))))

(factorial 5) ;返回120，但是有副作用：将continuation保存在retry中
(retry 5)     ;返回600
```

程序运行的时候，从`(factorial 5)`开始，每一步递归都需要计算参数上的`(factorial n-1)`才能求值，于是调用栈上就有了一串`(factorial x)`。当程序运行到`(factorial 0)`的时候，call/cc被触发，当前的计算环境被保存在`retry`中。那么这个环境具体是怎样的呢？看下表

|Stack|Code waiting for<br>value of argument|
|----------|
|(factorial 0)|□|
|(factorial 1)|(* 1 ?)|
|(factorial 2)|(* 2 ?)|
|(factorial 3)|(* 3 ?)|
|(factorial 4)|(* 4 ?)|
|(factorial 5)|(* 5 ?)|

上表实际上就是执行到`(factorial 0)`（但尚未执行完）时由执行环境维护的调用栈，它在调call/cc的时候作为continuation的一部分被保存到`retry`了。表中的问号代表本步骤等待的值，□代表调call/cc时留下的传送门。如果没有call/cc，按照阶乘的算法，这里应该填入数字1；但是既然call/cc为我们留下了传送门，我们就可以自由地选择往这个坑里填什么东西。如果填5，意味着阶乘的初值就是5，执行此continuation也就是展开调用栈之后，得到的结果自然是600。

**解析运行过程**

原来的代码

```:Scheme
(let* ((yin  ((lambda (cc) (display #\@) cc) (call/cc (lambda (c) c))))
       (yang ((lambda (cc) (display #\\*) cc) (call/cc (lambda (c) c)))))
  (yin yang))
```

可以写成

```:Scheme
(let* ((yin  (identity@  (capture/cc1)))
       (yang (identity*  (capture/cc2))))
  (yin yang))
```

> 现在是我们熟悉的-1层世界

从第一对`let*`开始执行：

```:Scheme
;第0个CC：[C0]，是(capture/cc1)的返回值：
(let* ((yin  (identity@  □)) ; 挖掉call/cc后的剩余部分
       (yang (identity*  (capture/cc2))))
  (yin yang))

;(identity@  [C0])输出@，并得到[C0]
;此时的程序（0）
(let* ((yin  [C0])
       (yang (identity*  (capture/cc2))))
  (yin yang))

```

此时，yin已经被绑定为`[C0]`。

```:Scheme
;第1个CC：[C1]，是(capture/cc2)的返回值：
(let* ((yin  [C0])
       (yang (identity*  □))) ; 挖掉call/cc后的剩余部分
  (yin yang))
;注意，[C1]里面包含着[C0]

;(identity*  [C1])输出*，并得到[C1]
;此时的程序（1）
(let* ((yin  [C0])
       (yang [C1]))
  (yin yang))
```

接下来执行`(yin yang)`，也就是`([C0] [C1])`。

> 此时，我们通过`([C0] [C1])`传送门，来到了[C0]的世界

在[C0]的环境里，`yin`和`yang`还没有求值，需要重新求值。

```:Scheme
;[C0]如下，使用[C1]填补其中的坑
(let* ((yin  (identity@  [C1])) ; 填坑
       (yang (identity*  (capture/cc2))))
  (yin yang))

;执行(identity@  [C1])输出@，并得到[C1]
;此时的程序（2）
(let* ((yin  [C1])
       (yang (identity*  (capture/cc2))))
  (yin yang))
```

我们现在已经输出`@*@`了。

继续执行（2），会遇到[C0]里面的`(capture/cc2)`，它捕捉到另外一个新世界`[C2]`：

```:Scheme
;第2个CC：[C2]，是(capture/cc2)的返回值：
(let* ((yin  [C1])
       (yang (identity*  □))) ; 挖坑
  (yin yang))

;但我们仍然在[C0]的世界里，
;继续执行(identity*  [C2])，会输出一个*，并返回[C2]
;我们得到了程序（3）：
(let* ((yin  [C1])
       (yang [C2]))
  (yin yang))
```

我们现在已经输出`@*@*`了。

好了，现在`[C0]`的`yin`和`yang`都齐备了，分别是`[C1]`和`[C2]`。

因此接下来执行`(yin yang)`，也就是`([C1] [C2])`。

> 此时，我们通过`([C1] [C2])`传送门，来到了[C1]的世界

在[C1]的环境里，`yin`和`yang`还没有求值，需要重新求值。

```:Scheme
;[C1]如下，使用[C2]填补其中的坑
(let* ((yin  [C0])
       (yang (identity*  [C2]))) ; 填坑
  (yin yang))

;yin在原来的世界中生成[C1]的时候已经被绑定好了
;所以执行(identity*  [C2])输出*，并得到[C2]
;此时的程序（3）
(let* ((yin  [C0])
       (yang [C2]))
  (yin yang))
```

我们现在已经输出`@*@**`了。

现在，在`[C1]`中，`(yin yang)`就是`([C0] [C2])`。

按照同样的道理，接下来执行的是`([C2] [C3])`……至此，现象层面的道理已经解释清楚。

---

在Scheme语言中，`let\*`实际上是顺序执行的define的语法糖，它可以按顺序将多个变量（`yin`和`yang`）分别绑定到已经evaluated的值上面，或者反过来说。已经知道，对于application`(f x)`，应用序求值是先求`f`，再求`x`，从左向右求值，直到列表中所有表达式求值完毕，才进行application。因此，对于`(yin yang)`，也是先求值`yin`再求值`yang`，恰好和let\*的顺序一致。因此，可以将程序改写为更清楚（？）的形式：

```:Scheme
((identity@ (capture/cc1)) (identity* (capture/cc2)))

; 如果不考虑副作用，实际上就是
((capture/cc1) (capture/cc2))
```

思考一下调用的过程，大致可以画出这样的示意图：

```:Scheme
((CC1) (CC2))

[ CC1 | CC2 ]
  1|@   2|*
   |     |
[ C-0   C-1 ]
  □ X  C0 □
 3|@  \
  |   4\\*
[ C-1   C-2 ]
 C0 □  C1 □
  |   \
  |    5\\*
[ C-0   C-2 ]
  □ X  C1 □
  ...   ...
```

我的妈太抽象了……估计过不了几天连自己也看不懂了……

手写版：

![不要看左边的Cx……下图中，每一行代表一个configuration，左边是`yin`，右边是`yang`，Cx下面的两个东西代表Continuation里面的`yin`和`yang`两个变量的configuration，方框代表参数占位符（也就是在那个位置调用的`call/cc`），圈叉代表另一个`call/cc`。在阴阳问题中，只有C0带有`call/cc`，这个圈叉就是无限循环的万恶之源。](./image/G2/yin-yang-puzzle.png)

简单总结一下：在程序运行中出现过的无数个Cx中，**只有C0可以产生新continuation**，并输出一个@。其余的虽然都包含C0，但是在application的时候，都只是通过`yang`转手，并且输出一颗星星。

例如，执行第一步`(C0 C1)`之后，C1被填充到C0的`yin`中，新生成的C2（其中`yin`是C1，`yang`是□，即包含C1）则被绑定到`yang`，于是第二步就是`(C1 C2)`，到这一步，没有C0的参与，C2被传送到C1的`yang`中，于是第三步就是`(C0 C2)`，又会生成一个C3，下一步application就是`(C2 C3)`…\*…`(C1 C3)`…\*…`(C0 C3)`…@…`(C3 C4)`…\*…`(C2 C4)`…\*…`(C1 C4)`…\*…`(C0 C4)`…@…`(C4 C5)`…\*…`(C3 C5)`…\*…`(C2 C5)`…\*…`(C1 C5)`…\*…`(C0 C5)`…@…`(C5 C6)`…\*…

这也就是说，每输出一个@，意味着一个新的continuation诞生了；每输出一颗星星，意味着已存在的continuation又转手了一次；每转手一次，`yin`指向的continuation就被脱掉一层。因为输出@的时候都会给`yang`指向的continuation包裹上一层，所以下一轮转手的次数就会多一次。

好像还是很复杂呀\~但愿过几个月后我还能看懂\~

**等价的代码**

参考资料[[5]](#参考资料)只使用函数而不是continuation来实现同样的功能，但是依然难以理解。我自己采用CPS风格写了一个等价的程序，以帮助理解。代码如下：

```:Scheme
(define (yinyang cont)
  (display "@")
  (cont)
  (yinyang (lambda () (cont) (display "*"))))

(yinyang (lambda () (display "*")))
```

这段代码还是比较容易理解的。实现此功能的方法有很多，这只是其中之一。

到这里，我觉得我已经可以说服我自己了。你觉得呢？

**参考资料**

- [[1] How-Does-the-Yin-Yang-Puzzle-Work](https://stackoverflow.com/questions/2694679/how-does-the-yin-yang-puzzle-work)
- [[2] Madore 的 call/cc](http://www.madore.org/~david/computers/callcc.html)
- [3] Springer G, Friedman D P. Scheme and the Art of Programming[M]. McGraw-Hill, Inc. 1989.
- [[4] Call-with-current-continuation](https://en.wikipedia.org/wiki/Call-with-current-continuation)
- [[5] Understanding the Yin-Yang Puzzle](https://www.cnblogs.com/cbscan/p/3746861.html)
- [[6] call/cc总结](http://www.sczyh30.com/posts/Functional-Programming/call-with-current-continuation/)
- [[7] Scheme语言深入](https://www.ibm.com/developerworks/cn/linux/l-schm/part3/)
- [[8] Scheme 程序语言介绍之一](https://www.ibm.com/developerworks/cn/linux/l-scheme/part2/index.html)

## 递归论（2017-09-22）

+ 递归和迭代的区别和联系（栈vs寄存器）
+ μ-递归函数（递归论）
+ 自相似数据结构（列表）和数学归纳法
+ SICP的最大和问题，以及多步递归与多个寄存器、时域平移的关系
+ Ackermann函数

**丘奇-图灵论题：直观可计算与（等价）图灵机可计算是同一回事。**基于这个“论题”，只要是图灵机可实现的计算，那么就认为它是直观可计算的。所谓的直观可计算并不是一个严格的形式化概念，所以这个论题也只能叫“论题”。因为还没有发现“直观可计算”但图灵机无法计算的算法，所以大家默认CT论题是正确的。

### 程序设计语言

书中给出的语言有四条基本语句：空语句、增量、减量和条件（为0）跳转。但是这个指令集完备吗？这里暂时没有给出回答。

所有变量及其取值组成的有穷映射称为程序的**状态**，这个在调试的时候很清楚。

程序状态与下条指令组成的有序对称为程序的**快照**。

对某个非终点快照按照指令行为加以解释，可得到它的**后继快照**。

由快照→后继快照组成的有穷快照序列称为一个**计算**。如果程序陷入死循环，或者不考虑资源消耗的无穷递归，那么快照序列就是无穷的，这就属于不可计算了。无法在有限的步骤内给出有意义的结果，就属于是不可计算。

当然，对于计算机（尤其是图灵机）而言，获得结果并不是唯一的目的，计算过程中的“**副作用**”也是需要加以利用的。比如说操作系统本质上就是一个大的死循环，它并不以输出什么为目的，它只要一直运转就行了，就像一台自动扶梯一样。很多人用C语言写程序的时候，尤其是初学者写嵌入式程序的时候，往往会忽视返回值的问题，甚至无视规范写出`void main()`这样的函数，这就是忽视了程序的“初衷”，毕竟跑马灯不需要返回什么结果。所以我们说C语言是“过程式”语言，因为它非常关注计算过程本身，也引导程序员通过分析计算过程来编写程序。

**可计算性与可计算函数**

The Little Schemer 第九章给出了这样的一个函数：

```:Scheme
(define looking
  (lambda (a lat)
    (keep-looking a (pick 1 lat) lat)))

(define keep-looking
  (lambda (a sorn lat)
    (cond ((number? sorn) (keep-looking a (pick sorn lat) lat))
          (else (eq? sorn a)))))
```

这个函数的特点是：对于某些输入，可以终止并输出结果；但对于另外一些输入，例如`(2,1,a)`，程序就会陷入死循环，永远无法停止。

所谓的数论函数，就是从自然数笛卡尔积集到自然数的函数。下文首先考虑数论函数。

设程序所计算的（数论）函数为$\psi (\mathbf \sigma )$，其中$ \mathbf \sigma $是初始状态，也就是算法的输入参数。对于程序终止且输出有效结果的情形，$\psi (\mathbf \sigma ) = Y $，其中$ Y $是最终状态中代表结果的变量；对于程序无法终止的情形，$\psi (\mathbf \sigma ) \uparrow$。函数$ \psi $在这里显然是一个部分函数，称为**部分可计算函数**。如果它恰好是一个全函数，也就是说，并没有那种能够导致死循环的输入，那它就是**可计算函数**。

**谓词**是值域为{0, 1}的全函数，相应地存在**可计算谓词**的概念。

### 原始递归函数

**合成和原始递归操作**

**合成**操作可以理解为函数的嵌套调用。（部分）可计算函数合成后得到的函数也是（部分）可计算的。

**原始递归**操作的一般形式如下：

$$
\begin{cases}
{prf}(\sigma , 0) = {init}(\sigma), \\\\
{prf}(\sigma , t + 1) = {step}(\sigma, {prf}(\sigma , t) , t)
\end{cases}
$$

写成Scheme是：

```:Scheme
(define prf
  (lambda (input t)
    (cond ((= t 0) (init input))
          (else (step input (prf input (- t 1)) (- t 1))))))
```

函数`prf`是`init`和`step`两个函数经过原始递归得到的。如果`init`和`step`都是可计算的，那么`prf`也是可计算的。

函数`init`给出了递归终止条件下的、在某个输入上的、原始递归函数的返回值；而函数`step`则给出了每次递归要对上次递归的结果执行怎样的处理。

**由初始函数构造原始递归函数**

合成和原始递归是构造原始递归函数的基本规则，按照这些规则将**初始函数**进行有限次处理，得到的就是**原始递归函数**。**原始递归函数是可计算的。**

初始函数有：

- 后继函数（+1，加法器）
- 零函数（返回常数0）
- 投影函数（查线性表，译码器）

在图灵机的语境下，这三个函数非常容易理解，也非常容易实现。但是在lambda演算的语境下，则显得不够简洁。例如，使用Scheme实现的列表投影函数，就不够“基本”。造成这种现象的根本原因是二者数据结构的基础不同：图灵机基于线性表和状态机，而lisp是基于嵌套表的。这本薄薄的教材暂时没有就这个问题给出更多解释。

虽然写出来会很繁琐，但是我觉得仍然有必要将感兴趣的函数用Scheme写出来。

在书中举出的若干个例子里，前驱函数是构造起来比较巧妙的一个。由于后继函数只能提供后继信息，在下一次递归后，调用前的前驱信息将丢失，因此必须以某种方式，在递归过程中保存前驱信息。对于Scheme来说，可以利用原生的表结构存储(前驱,后继)信息，每次递归调用时，同时为二者+1，递归结束时取前驱项返回即可。代码如下：

```:Scheme
;前驱函数
(define prec
  (lambda (n)
    (define prec-iter
      (lambda (x pair)
        (cond ((= x 0) 0)
              ((= x (cdr pair)) (car pair))
              (else (prec-iter x (cons (succ (car pair)) (succ (cdr pair))))))))
    (prec-iter n '(0 . 1))))
```

基于这种想法，还可以有更多简洁的写法。归根结底，都是通过保存“状态”来实现。对于命令式编程而言，状态就是存储器格局；对于函数式编程而言，状态就是堆或者栈中的参数列表。

至于补码加法实现减法这种邪术，和现在所讨论的问题已经不是同一个层次的问题了。

参见：SICP习题1.11。

对于谓词，同样有**原始递归谓词**的说法。可以证明，条件分支函数是原始递归函数。

**迭代**运算定义为原始递归函数的有限累加或者累乘，迭代后的原始递归函数也是原始递归函数。

**有界量词**可以转化到有限次的谓词迭代运算，因此使用了有界量词的谓词也是原始递归谓词。Scheme代码如下：

```:Scheme
;有界量词
(define arbitrary
  (lambda (p max)
    (cond ((= 0 max) (p max))
          (else (and (p max) (arbitrary p (- max 1)))))))
(define exist
  (lambda (p max)
    (cond ((= 0 max) (p max))
          (else (or (p max) (exist p (- max 1)))))))
```

利用现有的量词，可以构造出素数判断谓词如下：

```:Scheme
;y是否整除x
(define idiv
  (lambda (y x)
    (exist (lambda (t) (= x (* y t))) x)))

;Prime
(define is-prime
  (lambda (x)
    (and (> x 1) (arbitrary (lambda (t) (or (= t 1) (not (idiv t x)))) (- x 1)))
  ))
```

**极小化和递归函数**

**有界极小化**运算求谓词$ P(\sigma ,t)$在输入$\sigma$的条件下，取得真值的$t$的最小值；如果找不到最小值，则返回0。记作：

$$ \mathrm{min}_{t \le y}(P(\sigma ,t)) $$其中，y是极小化上界。

例如对于谓词$P(t)=5 \ge t$，其极小化的结果就是5，因为5是使谓词为真的最小自然数。

利用有界极小化算子和其他函数，可以拼凑出求素数的函数：

```:Scheme
;有界极小化（itor赋0）
(define minimalization
  (lambda (predicate max itor)
    (cond ((> itor max) 0)
          ((predicate itor) itor)
          (else (minimalization predicate max (+ itor 1))))))

;阶乘
(define fac
  (lambda (n)
    (cond ((= n 0) 1)
          (else (* n (fac (- n 1)))))))

;求第n个素数
(define prime
  (lambda (x)
    (cond ((= x 0) 0)
          (else ((lambda (y z) (minimalization (lambda (t) (and (is-prime t) (> t y))) z 0)) (prime (- x 1)) (+ 1 (fac (prime (- x 1)))))
          ))))
```

如果取消有界极小化的上界限制，则得到一般的**极小化**算子。取消了上界的极小化算子不再是全函数，因为有可能永远也找不到最小成真赋值。

因此定义**部分递归函数**如下：由初始函数经过

- 有限次合成
- 原始递归（迭代的本质是原始递归，量词的本质是迭代）
- 极小化

三种运算得到的函数称作部分递归函数。其全函数就是传说中的**递归函数**。

### “编码”的奥秘

**配对函数**

$$ \langle x,y \rangle =2^x(2y+1)-1 $$

**哥德尔（Gödel）数**

进制数可以看做是对自然数的一种编码方式，它将一个自然数编码为一个（并不唯一的）基本数字符号序列。与此相对，哥德尔数试图将有穷数列编码为一个唯一的自然数，其编码规则如下：

$$ [{array}(1:n)] = \prod_{i=1}^n {\mathrm {Prime}(i)^{ {array}[i]} } $$

注意，在哥德尔编码语境下的数组，约定起始下标是1。

类似于$k$进制数，哥德尔数也是带权数，只不过哥德尔数的基数是（第$i$个）素数。哥德尔数与进制数有这样几点不同：

- 哥德尔数是用乘的，而进制数用加；
- 任何有穷数列经哥德尔编码得到的哥德尔数是唯一的，而进制数一定不唯一（例如十进制25和025代表同一个数）；
- 哥德尔数的计算顺序是从左到右的，而进制数一般是高位在左的；

每一个有穷数列经哥德尔编码都可以得到唯一哥德尔数，但是反过来，哥德尔数并不对应唯一的有穷数组，例如{1,2}和{1,2,0,0}的哥德尔数是一样的，都等于18。这并不妨碍使用，尤其是解码工作。

哥德尔数的解码同编码一样是原始递归的。为了求某个哥德尔数$gcode$对应的数列的某一项（就第$i$项吧），因为所有因子项必然是整数，只需要考察整除$gcode$的第$i$个素数的几次幂，这个次数的最大值就是原数列的第$i$项，再多一项就不可能整除了。只要找到了这个不能整除的次数的最小值，就找到了原数列的第$i$项。如果找遍了所有的次数（最大肯定不能超过$gcode$）还没有遇到无法整除的情况，那就是0了。这与极小化算子的操作步骤是一致的，所以解码算法如下：

$$ \mathrm {GDecoding}(gcode,i) = \mathrm {min}_{t \le gcode} (\lnot (\mathrm {Prime}(i)^{(t+1)} | gcode)) $$

但由于哥德尔数不可能是0，为了使解码算法成为全函数，规定对于每个$i$，$ \mathrm {GDecoding}(0,i) = 0 $；并且对于数组中没有的下标，函数也返回0。

> 以上：2017.9.22

有了哥德尔数之后，通过极小化算子也可以求出对应的最短数组的长度。

用Scheme编写哥德尔数编解码算法如下：

```:Scheme
;哥德尔数编码（itor赋1）
(define g-encode
  (lambda (ln itor)
    (cond ((null? ln) 1)
          (else (* (exp (prime itor) (car ln)) (g-encode (cdr ln) (+ itor 1)))))))

;哥德尔数解码
(define g-decode
  (lambda (gcode index)
    (minimalization (lambda (t) (not (idiv (exp (prime index) (+ t 1)) gcode))) gcode 0)))

(g-encode '(3 2 1) 1)
(g-decode 360 1)
```

**还有一些特殊的递归也是原始递归**

除了原始递归之外，书中还介绍了联立递归、多步递归和多变量递归。联立递归通过形式上的变换就可以得到原始递归的形式，所以联立递归无疑是原始递归。但对于多步递归和多变量递归，事情就没有那么简单了。

多步递归的可计算性证明：所谓的多步递归，就是每次递归都要用到不止一个过往的递归结果，甚至用到所有的递归结果。求斐波那契数列的递归过程就是一个典型的多步递归。多步递归的复杂性在于，它的递归展开和回溯过程并不是线性的，而是树状的。为了证明多步递归的原始递归本质，书中考虑了极端情况——所有过往计算的返回值都有用到。考虑函数$mr$：

$$
\begin{cases}
{mr}(0) = {init}, \\\\
{mr}(t + 1) = {step}({mr}(0) , {mr}(1) , ... , {mr}(t) , t)
\end{cases}
$$

这里特地把书中的累加抽象成了原始递归的step函数。这个step函数接受一个参数列表，其中就有从0到$t$的所有过往结果。将它们视为数列，计算哥德尔数：

$$ {MR}(t) = \prod_{i=0}^{t} {\mathrm {Prime}(i+1) ^{mr(i)}} \tag{1}$$

对其进行解码，就可以计算出每一个${mr}(i)$的值：

$$ {mr}(i) = \mathrm {GDecoding}({MR}(t), i+1) , 0 \le i \le t \tag{2}$$

之所以要这样构造，是因为已知哥德尔数的编解码过程都是原始递归，如果可以证明${MR}(t)$是原始递归的话，说明${mr}(t)$也是原始递归。

那么就用(2)右边的式子换掉$ {mr}(t+1) $的右边的各个函数调用，就得到新的含有${MR}(t)$的形式：

$$ {mr}(t + 1) = {step}(\mathrm {GDecoding}({MR}(t), 1) , \mathrm {GDecoding}({MR}(t), 2) , ... , \mathrm {GDecoding}({MR}(t), t+1) , t) \tag{3}$$

进一步将${step}(\mathrm {GDecoding}(\cdot, 1) , \mathrm {GDecoding}(\cdot, 2) , ... , \mathrm {GDecoding}(\cdot, t+1) , t)$抽象为${gstep}(\cdot, t)$，${gstep}$显然也是原始递归函数。那么$ {mr}(t + 1) $就可以写成更简洁的形式：

$$ {mr}(t + 1) = {gstep}({MR}(t), t) \tag{4}$$

到这里，就可以开始考虑${MR}$本身了。因为已经有了${mr}(t + 1)$，所以将$ {MR}(t+1) $写成递归的形式，以暴露出${mr}(t + 1)$：

$$ {MR}(t+1) = {MR}(t) \cdot \mathrm {Prime}(t+2)^{mr(t+1)} \tag{5} $$

将(4)代入(5)得到：

$$ {MR}(t+1) = {MR}(t) \cdot \mathrm {Prime}(t+2)^{ {gstep}({MR}(t),t)} \tag{6} $$

现在可以进一步将$ (\bullet) \cdot \mathrm {Prime}(t+2)^{ {gstep}(\bullet,t)} $抽象为$ {GSTEP}(\bullet,t) $，简化(6)得到：

$$ {MR}(t+1) = {GSTEP}({MR}(t),t) \tag{7} $$

由于$ {gstep} $是原始递归函数，所以$ {GSTEP} $也是原始递归函数。这样的话，(7)式以及${MR}(0)=2^{init}$的事实说明${MR}$也是原始递归函数。

既然${MR}$是原始递归函数，那么**多步递归${mr}$也是原始递归函数，也就是可计算函数。**

多变量递归可计算性的证明同样利用了哥德尔编解码。

**阿克曼（Ackermann）函数**

阿克曼函数可以说是可计算函数里面的一股清流了。前段时间在做SICP的习题1.10时就觉察出这个函数的变态之处，但是当时并不晓得这个函数的意义所在。The Little Schemer也有专门提到这个函数。从实际意义上来说，这个函数的增长阶极高，以至于没什么实际用处；但是在可计算理论中，这个函数被证明是可计算的并且是非原始递归的。它的存在，意味着“可计算”并不等价于“原始递归”。

> 原始递归是可计算的充分条件，但不是必要条件。

> 以上：2017.9.23

**字函数的可计算性**

2.2.2节中，已经考虑到了进制数这一编码形式。进制数的实质是字符串，所使用的字母表就是基本数字和一些其他的字母。书中证明，进制数的编解码是原始递归的，并且通过舍弃“0”这一字符，避免了进制数的不唯一性。经过编码的字函数，本质上是数论函数。由于字函数编解码过程都是原始递归的，所以经进制数编码的可计算（部分可计算、原始递归）数论函数，即对应的字函数，也是可计算（部分可计算、原始递归）的；并且可以证明，这一结论不受字母表符号顺序的影响。

**Ex 2.1 原始递归性证明**

试证明：仅在有穷个点取非零值，其余点取值均为0的函数$f(x)$必为原始递归函数。

**证明**：设$f(i)$为非零函数值，$I$是非零取值自变量集合，$i \in I$。则构造包含所有非零函数值的有穷数列$A=\{f(i)\}$，其中$f(i)$的下标是$i$，其余下标不属于$I$的项都等于0。因此可以计算出$A$的哥德尔数

$$ {gcode} = \mathrm {GEncoding} (A) $$

对其进行解码：

$$ g(x) = \mathrm {GDecoding} ({gcode}, x) $$

若$x \notin I$，则$g(x)=f(x)=0$；若$x \in I$，则$g(x)=f(x)\neq 0$。也就是说，$g(x)=f(x)$。

由于$\mathrm {GDecoding}$是原始递归的，因此$f(x)$也是原始递归的。原命题得证。

书中将其构造为反向函数+时域平移+求和的形式，从而构造性地证明了题设函数的原始递归性。这很像表达离散时域信号的方式。

**Ex 2.12 最大公约数的原始递归性**

试证明：最大公约数`gcd(x,y)`是原始递归函数。

**证明**：由于有界极大化是原始递归，并且$\mathrm {GCD}(x,y) = \mathrm {max}_{t\le y} (t | x \land t | y)$，因此`gcd`是原始递归的。

### 通用程序

前面两章初步构建了基于递归函数的计算模型。为了在既有的数论基础上研究“程序”，首先要对程序进行编码，得到的就是“代码”。代码的存在，消除了数据与程序的界限，也因为代码的无穷尽性，让人们看到了递归函数的“能”与“不能”。

**程序的代码**

代码，就是指代程序的编码。书中，使用配对函数为快照进行编码，使用哥德尔数对计算过程（即快照序列）编码进行编码。为了避免麻烦，规定最后一条语句的后面不允许再有空语句。由于哥德尔编解码和配对函数都是可计算的，因此每一个程序都可以得到它的编码。又由于空指令的快照编码（被钦定）为0，所以程序末尾的空语句并不会影响程序的哥德尔编码，这样就保证了**①每一个程序都对应唯一的一个自然数**。反过来，对于任意的一个整数，**②总可以通过解码得到它对应的程序**，虽然这样得到的程序可能（大概率的可能）并没有什么卵用。这样，就保证了**每一个程序都与自然数有一一对应的关系**。

程序，也即部分可计算函数与自然数的这种双射关系，是后面许多术语带有“枚举”二字的根本原因。因为我们可以通过（递增地）枚举所有自然数，得到所有可能的程序，如《计算的本质》书中妙语所言，只要你愿意等待，总可以枚举出诸如Ajax或者Windows这样的伟大程序然后回家睡觉。

**停机问题**

http://blog.csdn.net/pongba/article/details/1336028

**假设**有一个神奇的程序`(isHalt p x)`，它计算谓词$\mathrm {HALT}(p, \mathbf x)$，这个谓词可以针对任何一个程序，回答在某个输入上该程序可否停机。于是图灵构造了这样的一个程序：

```:Scheme
(define wtf
  (lambda (p x)
    (cond ((isHalt p x) (eternity x))
          (else #t))))
```

用`wtf`和任意输入`x`去调`wtf`，也就是执行`(wtf wtf x)`：如果`wtf`可以停机，那么它本身就会陷入`(eternity x)`的循环中无法停机；如果`wtf`不能停机，那么它本身又会立即返回值而停机。这个矛盾意味着，并不存在计算谓词$\mathrm {HALT}$的程序。也就是说：

**定理3.1 停机问题不可计算**

我们不可能在有限的时间内判断一个程序在某个输入上能否停机，**停机问题是不可计算的**。

然而，停机问题并非唯一的不可计算问题。由于自然数集上的函数集的势是大于$\aleph_0$的，所以这种不可计算的问题应该说是非常“多”了，sad。

证明停机问题不可计算的关键就在于构造自我指涉，而自指的技巧，早在康托尔证明实数集不可数的时候，就已经开始使用了。

**对角线证明法**

对角线证明法是康托尔提出的，是用来证明$(0,1)$不可数的一种巧妙的方法。

所谓“可数”，指的是集合中的每个元素都可以与自然数建立一一对应的双射关系。假设$(0,1)$可数，那么存在函数$f(i),i\in \mathbb N$与集合中**每一个数**相一一对应。将$(0,1)$内的每一个数都写成十进制的无限小数（有限小数在末尾添加无穷个0），每个数写一行。并且，表中不允许存在以999...结尾的数字。以小数的序号为行数，小数的位序号（从0开始吧）为列数，列出下表：

| |0|1|2|3|4|5|...|
|-----------------|
|0|?| | | | | |...|
|1| |?| | | | |...|
|2| | |?| | | |...|
|3| | | |?| | |...|
|4| | | | |?| |...|
|5| | | | | |?|...|
|...| | | | | ||...|

设$(0,1)$内的某个数$r$的每一位$i$都与$f(i)$的第$i$位（也就是上表对角线上的问号）不等（例如循环加一），这样$r$仍然是$(0,1)$内的实数，但是与表中每一个$f(i)$都不相等。也就是说，构造出了不在上表中的，然而却真实存在的$(0,1)$内的实数。但根据假设，$f(i)$可以对应所有的实数，这就引起了矛盾。最终得到结论：$f(i)$是不存在的，$(0,1)$不可数。

程序可以通过编码转化为自然数，`wtf`程序的构造实际上也是利用了对角线证明法。停机函数`isHalt`接受程序（代码）和程序的输入，输出表示程序能否在输入上停机的布尔值。假设`isHalt`可计算，那么可以列出这样一张表：以程序代码为行数，以程序输入为列数，表格内容是输出的布尔值，如下：

|      |0|1|2|3|4|5|...|
|----------------------|
|Code:0|?| | | | | |...|
|Code:1| |?| | | | |...|
|Code:2| | |?| | | |...|
|Code:3| | | |?| | |...|
|Code:4| | | | |?| |...|
|Code:5| | | | | |?|...|
|...| | | | | ||...|

表中对角线上的元素代表某程序以自己（的代码）为输入时能否停机。现在不妨构造这样一个程序$P$：对于**任何**程序（代码）$i \in \mathbb N$，将其输入程序$P$的停机情况$\mathrm {isHalt}(P, i)$，都与它以自己为输入的停机情况$\mathrm {isHalt}(i, i)$相反。这样，$P$就不属于表中的任何一行，也就是说，$P$是不可构造的，矛盾。这就意味着停机谓词是不可计算的。

> 总感觉递归是人类思维的一个奇点、一个bug。

> 以上：2017.9.25

**通用程序**

这一节论述了这样一个事实：**可以构造这样一台计算机：它接受某个程序（的代码）以及该程序的输入作为输入，输出的结果就是输入程序的输出结果。**这意味着宿主机器是具有**通用性**的，它可以模拟任何一台其他的机器。在Windows系统里面可以运行Ubuntu虚拟机，在Ubuntu虚拟机中可以运行Python解释器，在Python解释器中可以运行Lisp解释器，这个Lisp解释器同样可以解释其他的Lisp程序……如此直至无穷，唯一的限制便是时间和空间，以及递归集之外无法穷尽的思维角落。通用性定理是计算机的理论基础，揭示了“程序即数据”最本质的原因。

**定理3.2 通用性定理**

所有程序可通过哥德尔编码与自然数集合建立一一对应关系。设程序$P$的代码为$p$，其计算的部分可计算函数为$\psi (\mathbf x)$，其中$\mathbf x$是程序的输入（向量）。现有函数

$$\Phi (\mathbf x, p) = \psi (\mathbf x)$$

当$p$取0、1、2……即可枚举出**所有**的部分可计算函数。上式中，$\Phi $体现出解释器的行为，即以程序代码为输入，以输入程序的输出为自己的输出。可以证明，函数$\Phi (\mathbf x, p)$都是部分可计算的。这就是通用性定理。

由于$\Phi $本身是部分可计算的，所以同样可以构造出解释$\Phi $的$\Phi (\Phi)$，也就可以构造出解释$\Phi (\Phi)$的$\Phi (\Phi (\Phi))$……这是好事，也是坏事。好事是总可以通过恰当的封装和抽象去方便地实现某种功能，而不削弱功能；坏事是我们似乎看到了图灵等价计算模型（部分递归函数类的计算能力与图灵机是等价的）的计算能力极限，无论如何抽象，都不能突破计算能力的天花板……

**定理3.3 计步定理**

通用性证明的过程中构造了计步谓词$\mathrm {STP}(\mathbf x, p, t)$及其对应的程序，该谓词表示代码为$p$的程序能够在$\mathbf x$的输入下在$t$步后停机。既然可以构造出计步谓词对应的程序，意味着计步谓词是可计算的。$\mathrm {STP}$与$\mathrm {HALT}$的区别有点像有界极小化和极小化的区别。至于计步谓词为何是可计算的，其实很容易理解，如果在有限步骤内没有结束，则返回false，无论如何总能返回一个结果，所以是可计算的。

撰文时恰好发现一个绝妙的Quine，在这里：https://github.com/mame/quine-relay

**递归可枚举集**

从第一章的`looking`程序可以看到，对于部分可计算函数来说，它们的定义域是自然数集的子集。我们已经在3.1中知道，部分可计算函数，也就是“程序”的个数是可数的，那么，所有部分可计算函数的定义域所构成的集合，同样是可数的，并且不会比自然数集合要“多”。可是问题在于，自然数集的全体子集构成的集合并不是可数的，也就是说，部分可计算函数的定义域，比自然数集的子集要少得“多”。既然我们可以枚举出所有部分可计算函数的定义域，因此，给这种并不平凡的集合类起了个名字——递归可枚举（recursively-enumerable，r.e.）集合。

形式化地表述就是，如果存在部分可计算函数$g(x)$，使得

$$ E=\{x\in \mathbb N | g(x) \downarrow \} $$

则称$E$为**递归可枚举集**。

如果一个自然数有幸成为r.e.集的元素，那么它必然导致某个程序停机。反过来，如果一个自然数可以导致某个程序停机，那么它必定是某个r.e.集的元素。然而，如果一个自然数并没有使某个程序停机，那么它**未必不属于**该程序对应的r.e.集，因为它可能只是需要更长的时间才能停机而你却等不及。所以，r.e.集在成员资格判定这个问题上，能力是有限的，其根本原因就在于部分可计算函数的“部分”性。

如果$g(x)$是全函数呢？由于$g(x)$是全函数，对于任何一个输入都可以得到结果，因此可以对集合元素加更多限制，得到新的集合类。如果定义可计算谓词$ \chi_{B} (x)$，表示某元素$x$是否属于集合$B$，那么

$$ B=\{x\in \mathbb N | \chi_{B} (x) \} $$

谓词$ \chi_{B} (x)$称为集合$B$的特征函数，若特征函数$ \chi_{B} (x)$可计算，则集合$B$是**递归**的。

从上面的论述就可以感觉到，递归集很可能是递归可枚举集的子类，事实确实如此。如果将递归集看做是二分类之后的r.e.集，就比较容易理解了。因此，

** 定理3.5 递归集必是递归可枚举集。**

既然说到了“二分类”，考虑这个问题：如果一个r.e.集$E$和它的补集$\overline E$都是r.e.集，那么就可以从正反两个方面确定两个集合各自可计算的“领域”，换言之，可以确定某个元素要么在$E$中，要么在$\overline E$中，并没有其他可能。这就相当于构造出了对$E$（或者$\overline E$）的可计算特征函数。因此，结合定理3.5，可以证明，

**定理3.6 集合$E$是递归的，当且仅当$E$和$\overline E$都是递归可枚举的。**

书中通过构造联合计步程序的方式证明了这一定理。不管用什么方法，总觉得这就是排中律的某个具体结论而已。

在GEB中，侯世达用“可以流畅画出”的图形来比喻递归可枚举集。可以流畅画出，意味着这个图形本身是具有某种意义的，但是如果把这个图案从背景上抠掉，那么背景所形成的图案也许就没有任何意义了，这是非常平常的。然而，艾舍尔以它非凡的想象力创造出许多名作，在这些精美的镶嵌画中，不仅前景是有意义可解释的，背景也是有意义可解释的；前景和背景一起，组成了一种宏观的和谐，侯世达将这种和谐称为“倍流畅”的。如果一个图形在它的前景和背景都具有可解释的意义，那么这个图形就是“递归”的。

递归可枚举集合类关于交、并运算是封闭的，这也很容易理解，因为与、或运算都是原始递归的。因此得：

**定理3.7 递归可枚举集合的交集和并集也是递归可枚举集合。**

推广到递归集就是书中的定理3.4了。不同的是，递归集的补集仍是递归集，因为递归集是非黑即白嘛。

那么，递归可枚举集的补集是什么呢？

本节开头就点明了“递归可枚举集就是部分递归函数的定义域”这一事实，并以此引入了r.e.的概念，这也是书中定理5.11明确指出的。根据定理3.2通用性定理，如果将部分可计算函数$g(x)$写成虚拟机在通用机中运行的形式$\Phi (x,p)$，那么集合

$$ W_p = \{ x \in \mathbb N | \Phi (x,p) \downarrow \} $$

显然是递归可枚举集合。并且，由于$p$可以取遍所有自然数，因此可以枚举出所有的$W_p$。这就是：

**定理3.8 枚举定理：集合$B$是递归可枚举的，当且仅当存在$n \in \mathbb N$使得$B=W_n$。**

与停机问题类似，不可计算的问题要远远多于可计算甚至部分可计算的问题，但停机问题是最典型的一个不可计算的问题。为了思考r.e.集的补集的问题，不妨借用停机问题的思路，构造一个集合$K$，它的元素是所有自己在自己的代码上停机的程序代码的集合

$$ K = \{ n\in \mathbb N | n \in W_n \} $$

按照上面给出的$W_n$的定义，也可以写成

$$ K = \{ n\in \mathbb N | \Phi (n,n)\downarrow \} $$

这明显是一个r.e.集。

它的补集$ \overline K $，也就是所有不在自己的代码上停机的程序代码的集合也是r.e.吗？为此，考虑$K$的特征函数，也就是$\mathrm{HALT}(n,n)$，而这个特征函数是不可计算的，也就是说，$K$并非递归集，从而$ \overline K $也不是递归可枚举集。

整个自然数集合是递归可枚举集，因为根据枚举定理，可以写出诸如`(lambda (x) x)`这样的函数，它的定义域是$\mathbb N$。同样的，可以将空集视为递归可枚举集，因为可以写出诸如`(define wtf (lambda (x) (wtf x)))`这样的函数。所以自然数集和空集都是递归集。

在书中5.4节中，给出了这样的结论：如果非空集合$B$是递归可枚举集，那么以下命题等价：

- $B$是部分可计算函数的定义域
- $B$是原始递归函数的值域
- $B$是（部分）可计算函数的值域

> 以上：2017.9.26

**参考资料**

- 1 / 杨跃, 郝兆宽, 杨睿之. **数理逻辑：证明及其限度**[M]. 复旦大学出版社, 2014.
- 2 / 张立昂. **可计算性与计算复杂性导引**（第3版）[M]. 北京大学出版社, 2011.


## 从语法到语义

![ ](./image/G2/缩进错误.jpg)

+ 求值顺序：积极求值和惰性求值
+ 约束变量和自由变量：闭包、环境和作用域

## 环境和控制流

静态作用域今天看似自然且合理，但实际上在Emacs Lisp等早期的Lisp方言中，设计者并没有意识到将定义环境与运行环境分开解释，事实上使用了充满歧义的动态作用域机制。（[来源](http://www.yinwang.org/blog-cn/2012/08/01/interpreter)）后来，绝大多数语言都采用了更加严谨、易于分析的静态作用域策略。现在，在完善的OO机制的保证下，动态绑定本身已经成了一种非常灵活好用的机制，但，仍然容易令初学者迷惑。

动态作用域与“**环境**”（environment）是息息相关的。所谓的“环境”，指的是一种抽象的东西，里面保存了一段程序的**上下文**（context），以及程序运行所需的符号的具体绑定。环境是语言的背景知识，是语言创造出的虚拟空间。说到环境，就不得不提一个更加令人费解的概念——**闭包**（closure）。

## 数据即代码——自我解释

## 通用机器

所谓图灵机的通用性，指的是**[[#ff0000:可以构造一个通用图灵机（UTM），它可以模拟出包括通用机在内的任何一台图灵机的行为#]]**。如何理解这句话呢？

至今为止，我们写出的每一段程序，都对应一部图灵机，都只能完成某一个特定的任务。通用性定理告诉我们，可以写出一台**[[#ff0000:可编程#]]**的机器，它可以“运行”其他的图灵机，完成其他图灵机的任务。进一步说，我们可以写出足够强大的通用图灵机，在它的上面可以运行另外一个通用图灵机……如此嵌套，理论上可以嵌套无穷层。

通用性定理带给我们的另一个重要启示是：**[[#ff0000:程序代码本身，也可以作为输入程序的数据#]]**。这一点，其实是非常自然的，也就是“解释器本身就是解释程序的程序”，JVM本质上也只不过是磁盘上的一个文件而已。许多高级语言，也提供了各种机制，帮助我们站在数据的角度上，去看待和操纵数据。例如，C++的模板和泛型、Java的反射、函数式语言的一等函数、Ruby强大的元编程等等。这些技术，都可以统称为“元编程”，即使用代码操纵代码的编程。

是不是很熟悉？没错，实际机器中，不同结构层次的UTM，有不同的名字：**解释器**、**虚拟机**、**指令集**，等等。尽管每一层的任务都不同，但是在理论上，每一层都是通用的。

许多语言也提供了运行时解释/编译的能力，名字可能叫做“动态编译”等等。总而言之，这类机制一般会提供一个诸如JS的`eval(code)`的接口，可以在运行时执行代码。对于一般的开发者而言，程序的功能是明确而有限的，一般不需要这些动态执行接口。但是，在某些场景下，例如手机App热更新代码还有某些计算机病毒，这些场景下就必须将数据作为代码，并在运行时动态地执行。这种动态执行的功能是极其强大，同时又极端危险的，所以各大平台一般都会封堵掉编程语言提供的这类接口，例如微信小程序就封堵了JavaScript的`eval`函数和`Function`类，避免开发者热更新内部代码。但是根据通用性定理，只要平台提供的语言是本身图灵完备的，理论上就可以手工写出`eval()`函数，相信鹅厂的工程师也明白这一点。在杀毒软件、iOS和现代浏览器中，普遍使用的“沙箱”，实际上就是一个UTM，它模拟出一个虚拟的但是与物理机完全隔离的世界，而这个世界实际上是运行在物理机这个UTM上面的，只不过它们中间还有一道关口，用来隔离二者。这种“隔离”，只要明白了我们上一节讨论的“闭包”和“作用域”思想，就很容易理解了。

使用以下代码说明什么是“部分可计算”：

```:js
function foo(array, index) {
    if(index === 100) {
        return 'Surprise!';
    }
    else {
        return foo(array, array[index]);
    }
}
```

## 丘奇-图灵论题

## 计算复杂度

+ 动力学和统计学：钟表的启示、麦克斯韦妖
+ 广义计算：存在于生命系统和自然系统中的计算、耗散系统（B-Z反应）
+ 启发式算法：作为黑盒的复杂系统，好用但难以解释
+ 统计学智能/逻辑学智能/控制论智能…如何统一？三方面都要有
+ 知识与逻辑，知识（数据）甚至更重要——统计学习能够更好地处理“复杂”
+ 自然语言和物理现象归根结底是统计学的——在大的层面上才体现出逻辑性
+ 哥德尔证明的启示：创造性与心灵
+ 危机就是机会：矛盾是动力
+ 东西文化的碰撞：分析、理性、精确——基础研究和原创性研究
+ 我们可以不用；我们不能不懂：无用之大用

# 第八章：超越无穷

## 数学危机与数学基础（2018-07-10）

在数学的发展历史中，曾经有过三次大的数学危机，直接动摇了数学的根本：

- 第一次数学危机：开辟了算术逻辑化的道路（这条路的前途是光明的吗？）
- 第二次数学危机：奠定了数学分析的坚实基础（真的坚实吗？[Weierstrass function](https://en.wikipedia.org/wiki/Weierstrass_function)）
- 第三次数学危机：开启了互联网时代（但矛盾还是没有解决）

这三次数学危机，都绕不开一个神秘的概念：无穷。

### 从计算到“计算”

数学有两大任务：计算和证明。漫长的数学史，某种意义上就是**算术公理化**和**逻辑代数化**的发展史。

古希腊人信奉万事万物都是整数和整数的比，**毕达哥拉斯**（570BC～495BC）学派是他们中的集大成者。然而，毕达哥拉斯的一位弟子发现：**等腰三角形的长边长（例如$ \sqrt 2$），并不能表示为整数之比**。这与毕达哥拉斯学派的信条不合，为了掩盖这件事，此人不幸被扔进大海。

这件事引发了**第一次数学危机**。人们逐渐领悟到，在几何学中，算术和直觉是不可靠的，**只有逻辑才是可靠的**。

此后，古希腊的逻辑学开始蓬勃发展。**亚里士多德**（384BC～322BC）提出了**公理化方法**以及著名的**三段论**，这是最早的公理系统，对后世影响极为深远，他的公理化方法，至今仍是初中数学和高中物理最重要的思想。后来的**欧几里得**集古希腊数学之大成，其《几何原本》已成为公理化方法的典范，牛顿的名著《自然哲学的数学原理》即采用《几何原本》的体例。欧几里得的几何学（**欧氏几何**）以有限的几个**公理**或者**公设**出发，通过简单的推理规则，就可以推导出古典几何学的整座大厦。

在欧氏几何的公理中，唯独**平行公理**过于繁琐，不像是基本的公理。证明平行公理的尝试，持续了两千年之久，仍未成功。直到十九世纪，其独立性才被证明。对这个问题的研究，催生了**非欧几何**的诞生，即不承认平行公理的几何学。同时，也带给人们两个重要的启示：

+ 再次确认，几何学中，合乎空间直观并不重要，重要的是**逻辑上的无矛盾性**。
+ “某定理的证明是不可能的”是可以被证明的。

第一点启发后来者，**[[#ff0000:也许可以抽离掉一切依赖于直观的“解释”，将几何学（乃至代数、分析等其他数学）建立在纯粹逻辑之上，成为完全公理化的体系#]]**。第二点启发人们，**[[#ff0000:似乎可以站在某个推理系统之外，去研究系统内部的性质#]]**。

从亚里士多德开始的数学公理化历程，整体上是一条从“计算”走向“推理”的路。然而，十七世纪的一位数学家，正是出于对亚里士多德哲学的深刻理解，他反其道而行之，选择了一条从“推理”走向“计算”的路，梦想**建立一种放之四海而皆准的“通用符号”系统，将“推理”转化为“计算”，从而将一切数学建立在机器运算的基础上**。

这条路比人们想象得要艰苦许多。之所以如此艰苦，是因为在从“推理”走向“计算”的漫长路途中，处处可见神秘而遥远的“无穷”，令人迷惘而绝望。在通向“无穷”的险途中，时常会与**悖论**狭路相逢，绕也绕不开。逻辑代数化之路的艰险，暗示着所谓的“逻辑”很有可能从一开始就是靠不住的。这时，前面说到的第二点给了人们低头看路的超然视角：也许我们可以停下匆匆前进的脚步，认真地思索我们脚下的这条通往终极真理之路——1931年，**哥德尔**终于证明，由于无穷的存在，这条路注定不是人们理想中的完美之路。令人惊叹的是，哥德尔的证明，正是利用了逻辑代数化的最前沿成果——“推理”和“计算”，在哥德尔的证明中实现了完美的统一；两条互为逆向的通向真理之路，在哥德尔的证明中竟然结成了美妙而令人遗憾的环路。在**无穷的循环**中，人们不再执着于“完美”的数学，却脚踏实地地创造了一个更加精彩、更加可爱的全新时代——信息时代。

我们何其幸运，既可以享受信息时代的便利，又可以站在历史长河的下游，尽情地回顾这波澜壮阔的一切。

------

现在，让我们从十七世纪的这位数学家——**莱布尼茨**（1646～1716）开始，踏上这条永无止境的追寻真理之路。

> 此外，法国数学家笛卡尔和费马各自独立发明了解析几何——即采用计算的方法去研究几何问题。解析几何规避了几何证明对于技巧和创造性的极高要求，将几何证明转化为按部就班的机械的计算。这与逻辑推理的机械化可以说是殊途同归。后文中，我们还将在哥德尔的精巧证明中，见识到将逻辑推理和机械计算结合起来的奇妙力量。

各位都知道，莱布尼茨独立于牛顿发明了微积分。我们所熟悉的两个符号：微分号$ \mathrm{d}$和积分号$\int $，都是莱布尼茨发明的，并沿用至今，可见他对于符号的深刻理解。发明微积分，已经是极为伟大的成就，然而他对于逻辑符号化的探索，更是润物无声地开启了逻辑代数化的历程。

莱布尼茨10岁时，第一次接触到亚里士多德的思想，他深受影响。经过长时间的思考，他产生了将“推理”和“计算”合二为一的设想：何不**发明一套“字母表”，其中的字母表示的是“概念”而不是具体的事物，通过[[#ff0000:机械化#]]的符号演算，就可以自动推导出定理**呢？莱布尼茨的高明之处在于，他认识到符号系统对于推理和运算的重大作用。除此之外，**他还意识到了[[#ff0000:二进制#]]与整数和他理想中的计算机器的关系**，这种想法是大大超前于时代的。

他不仅想了，而且做了。1673年，莱布尼茨在伦敦展示了一台能够进行加减乘除四则运算的[计算机模型](https://en.wikipedia.org/wiki/Stepped_reckoner)，他借此当选为伦敦皇家学会会员。

![莱布尼茨的 Stepped reckoner](https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Leibnitzrechenmaschine.jpg/340px-Leibnitzrechenmaschine.jpg)

毕生的工作使他坚定了自己的梦想：

+ 对人类所有知识进行概念化，或者说是符号化；[[#ff0000:（数据库和知识库的雏形）#]]
+ 将逻辑推理转换成对这些符号的“操作”，莱布尼茨称之为“推理演算”。[[#ff0000:（程序语言的雏形）#]]

一言以蔽之：莱布尼茨梦想**[[#ff0000:发明一套符号推理规则，将精巧的逻辑推理转化成机械而严谨的符号变换，从而用机器去代替人进行思考。#]]**这就是莱布尼茨之梦，也是我们的人工智能之梦。

由于时代的局限性，莱布尼茨没有也不可能实现他的梦想。尽管如此，他的思想仍然超前了他的时代一个半世纪，引领着后人在**逻辑符号化、推理自动化**的路上继续前行。沿着莱布尼茨指引的道路，后世的布尔、弗雷格等人，终于开辟出了一条逻辑形式化之路。

------

**乔治·布尔**（1815～1864）出生于英国，但是他对海峡对岸的莱布尼茨的著作特别感兴趣。在仔细研究了亚里士多德和莱布尼茨的著作后，他将前人的思想严格化、形式化，提出了他自己的符号演算体系，也就是著名的**布尔代数**。布尔代数是关于“0”和“1”的代数，但是这里的“0”和“1”并不仅仅是数字意义上的“0”和“1”。**布尔代数的0和1与莱布尼茨的二进制思想在这里达成了微妙的一致**，不得不说是历史的必然。如果将布尔代数解释为对命题的演算，就得到了著名的“**命题逻辑演算**”。

尽管在今天看来，布尔代数是比较弱的代数系统，但已经可以解决许多问题。例如**邮件分类问题**。布尔代数对于计算机体系架构的底层设计，有重要的指导意义。例如，尽管原始的布尔代数需要与、或、非三种运算，但是数字芯片上的逻辑门只需要一种与非门，大大降低了底层硬件的复杂度。此外，几乎所有的编程语言，都将只有true和false的数据类型称为“**Boolean**”型。甚至，还有神学家利用布尔代数去证明上帝的存在。这就是布尔代数的威力。

布尔超越了亚里士多德和莱布尼茨，**[[#ff0000:第一次将他们的设想纳入到一套完善的符号推演系统中#]]**，离莱布尼茨之梦近了一步。更重要的是，布尔代数第一次将计算和逻辑推演结合起来，形成了“逻辑代数”的概念。从此，算术不再是简单的计算，而逻辑也不再是无所寄托的虚幻的东西。**推理与计算、心灵与机械，第一次走得如此之近。**数字电路考场里的考生，对此应该有极其深刻的体会。

但是，布尔代数还不够强大。布尔代数只能处理命题粒度上的演算，而无法处理诸如“所有”、“存在”这样的量词，也无法处理个体的关系和性质（即“谓词”）。1879年，德国数学家**弗雷格**（1848～1925）在《概念文字》一书中提出了一套更加强大的符号演算体系，今天被称为“一阶谓词演算”，是所有学习逻辑学的人必学的内容。

一阶逻辑对于“普通”的数学来说已经完全够用了。弗雷格的工作，为逻辑学提供了一套完善的符号体系。但是，距离莱布尼茨的梦想，仍然有很长的路要走，仍然有很多的坑要补。晚年的弗雷格，在大功告成之时，遭遇了一个足以毁掉他毕生心血的打击。正如弗雷格自己所说：“正当工作就要完成之时，发现大厦的基础已经动摇。对于一个科学家来说，没有什么比这更不幸了。伯特兰·罗素的一封信使我陷入这样的境地。”

究竟是怎样的一封信呢？是什么问题足以动摇弗雷格毕生构建的逻辑大厦呢？下一节，让我们走进“无穷”的世界，一探究竟。

### “无穷”的梦魇

希尔伯特开了一家旅馆，这个旅馆有可数无穷多个房间，换言之，希尔伯特旅馆的房间数，和自然数的数量一样多。

这天，希尔伯特旅馆来了一个客人，但是很不巧，旅馆已经客满了。正当客人一筹莫展之际，希尔伯特说，别担心，咱们的旅馆有无穷多个房间，我只需要让每个客人都住到他们各自房间号的下一个房间，然后你住在第一个房间就可以了。客人成功入住。

某一天又是客满，此时来了可数无穷多个客人，要求入住。希尔伯特考虑了一下，说，已入住的客人都换到房号乘以2的房间去，这样新来的每个客人就都有房间住了。所有客人成功入住，大家很满意。

### 对角线证明法

对角线证明法是康托尔提出的，用来证明$(0,1)$不可数的一种巧妙的方法。

所谓“可数”，指的是集合中的每个元素都可以与自然数建立**一一对应**的双射关系。假设$(0,1)$可数，那么存在函数$f(i),i\in \mathbb N$与集合中**每一个数**相一一对应。将$(0,1)$内的每一个数都写成十进制的无限小数（有限小数在末尾添加无穷个0，不允许以999...结尾的数字），每个数写一行。以小数的序号为行数，小数的位序号（从0开始）为列数，列出下表：

| |0|1|2|3|4|5|...|
|-----------------|
|0|?| | | | | |...|
|1| |?| | | | |...|
|2| | |?| | | |...|
|3| | | |?| | |...|
|4| | | | |?| |...|
|5| | | | | |?|...|
|...| | | | | ||...|

设$(0,1)$内的某个数$r$的每一位$i$都与$f(i)$的第$i$位（也就是上表对角线上的问号）不等（例如加一，9+1=0），这样$r$仍然是$(0,1)$内的实数，但是与表中每一个$f(i)$都不相等。也就是说，构造出了不在上表中的，然而却真实存在的$(0,1)$内的实数。但根据假设，$f(i)$可以对应所有的实数，这就引起了矛盾。最终得到结论：$(0,1)$不可数。

![逻辑代数化和算术逻辑化，双轨并行](./image/G2/architecture.png)

### 梦碎、梦醒

罗素设想了这样一个集合S：**S是由所有不属于自己的集合构成的集合**。

- 如果S属于S：则按照S的定义，S“不属于自己”，所以S不属于S。
- 如果S不属于S：则按照S的定义，因为S不属于自己，因此S应当属于S。

这就推出了明显的悖论：S既属于自己，又不属于自己！

罗素悖论并没有涉及多么高深的数学，矛头直指集合论的核心概念。这个简单的悖论暗示着，集合论的基础，已经变得不牢靠了！

为了消除悖论，将数学建立在严格的逻辑基础上，罗素试图通过给集合乃至一切语言进行“分层”，以破解自指带来的迷惑。他多年的努力和心血，凝聚在一部三卷本的巨著中，这本巨著就是著名的《数学原理》（Principia Mathematica）。

《数学原理》“全面地、系统地总结了自莱布尼茨以来数理逻辑领域的重大成果，奠定了20世纪数理逻辑发展的基础。”此书充满了晦涩难懂的符号推理，导致真正读完这部书的人寥寥无几。事实上，当1930年哥德尔的不完备定理发表之后，就再没有深入研究这部《数学原理》的必要了。尽管如此，《数学原理》仍然是数理逻辑发展史上的一座里程碑。

![是时候展示真正的逻♂辑了<br>引自维基百科](https://upload.wikimedia.org/wikipedia/commons/d/d7/Principia_Mathematica_54-43.png)

- 一致性和完备性
- 数学和元数学
- 红与黑之辩

|[[#ff0000:<span style="font-size: 18px;">黑</span>#]]|<span style="font-size: 18px;">红</span>|
|-----|
|这个字是“黑”字|这个字是“红”字|
|这个字是**[[#ff0000:红#]]**字|这个字是**黑**字|

- 层次问题（见GEB“消除怪圈”）
- 我们终将知道？

## 哥德尔不完备定理（2018-07-10）

### 证明奠基：编码与元数学映射

哥德尔证明的核心，是通过构造一个不可证明但却为真的命题$G$，来否定一致PM系统的完备性。$G$的内容是：本命题在PM系统内不可证。

显然，如果$G$可证的话，这就是一个悖论；但如果$G$不可证，那么$G$本身所说的就契合了“不可证”这一事实，从而得到PM中存在不可证的真命题。$G$的奇妙之处在于，它如同一条衔尾蛇，通过自指将处于元PM层次的“可证性”表述，绕进了自身的PM内部的表达形式之中。因此，在构造$G$之前，我们首先要做到两件事情：

- 【元语言符号**形式**的转换】找到一种方法，将元数学关于“可证性”的陈述，表达为PM内部的合式公式（即PM的命题）。
- 【元语言**语义**解释的对应】保证元数学陈述的意义与形式化的PM命题之间的对应，即PM命题可以解释为元数学陈述，同时元数学陈述可形式化为PM中的命题。

如果能够做到这两点，并在PM中构造出$G$，则意味着找到了沟通PM与元PM之间的途径，从而使得PM系统具备了自省的能力。这样，就可以利用PM谈论元PM话题，进而谈论任意深度的“元”PM话题。

![元数学映射机制](./image/G2/meta-map.png)

PM系统自省的核心，便是**哥德尔编码**和**对应引理**。

对PM中的基本符号作编码：

|固定符号|哥德尔编码|意义|
|-------|
|～|1|非|
|∨|2|或|
|→|3|蕴涵（若…则…）|
|∃|4|存在…|
|=|5|等于|
|0|6|零|
|s|7|直接后继|
|(|8|左括号|
|)|9|右括号|
|,|10|逗号|
|+|11|加|
|×|12|乘|

在PM系统中，表示“零等于零”的公式“`0=0`”的哥德尔编码是243000000。下表（《哥德尔证明》表7-3）中，从上往下是对哥德尔编码进行解码、得到原始的PM公式的过程；而从下往上是将PM公式编码成哥德尔编码的过程。

|意义|符号串|
|-------|
|PM公式的哥德尔编码|243000000|
|PM公式的哥德尔编码|64×243×15625|
|PM公式的哥德尔编码|2<sup>6</sup> × 3<sup>5</sup> × 5<sup>6</sup>|
|每个符号的哥德尔编码|`6 5 6`<br>`↓ ↓ ↓`<br>`0 = 0`|
|PM公式|`0 = 0`|

哥德尔编码可以将PM公式转化为自然数编码，这样，对于这个自然数编码的数论论述，便等同于对PM命题本身的论述，即元数学论述。而数论论述又是可以被形式化为PM论述的，进而又可以被编码为自然数……这就形成了一个PM——元PM——PM……的循环，加之对应引理赋予PM符号串以元数学的意义，从而使得PM谈论自身成为可能。

为了构造$G$，哥德尔首先将两个元数学表述形式化为PM命题。其中一个用于表达可证性，另外一个用于表达变量代换机制。需要注意的是，下面仅仅说明了这个形式化过程的能行性，但这完全足够了，因为它们的PM符号序列非常非常复杂，写出来也没有太大的意义。此外，这两个形式化过程正是哥德尔证明中大量铺垫的用武之地，距离论证核心稍远，因此也没有必要详细阐明。

从这里开始，必须时刻注意“元数学命题”、“数论命题”和“PM命题”之间的层次和联系。

【第一个元数学话题：$DEM$（证明断言）】

- 元数学命题：哥德尔数为$x$的公式序列$X$，是哥德尔数为$z$的公式$Z$的PM证明
- 数论命题：因比较复杂，简记为$dem(x, z)$
- PM命题：将数论命题翻译为PM命题$Dem(x, z)$

【第二个元数学话题：$SUB$（符号代换）】

将公式$X$的哥德尔数$x$，代入公式自身内部的哥德尔数为$v$的变量$V$，得到的新公式的哥德尔数，记为$sub(x, v, x)$，注意这是数论层面的标记。

举例：

- 公式$(∃x)(x=sy)$的哥德尔数是$m$，则使用$m$这个数在系统内部的写法（$s...s0$，m个s）替换掉$y$得到的
- 公式$(∃x)(x=ss...s0)$的哥德尔数就是$sub(m, [y], m)$
- 与$DEM$类似，$sub$在PM内部的命题可记为$Sub(x, v, x)$

### 证明概览：不可判定的G

+ 在PM系统中构造命题$G$：$P(G)$，其元数学意义为“本命题在PM系统内不可证”。
+ 元数学证明：若PM一致，则$G$不可证。过程如下：
++ 首先证明：$G$可证，当且仅当$～G$可证。
++ 如果$G$和$～G$都可证，则PM不一致。即若PM一致，$G$和$～G$至少有一个不可证。
++ 综合以上两点可得：如果PM一致，则$G$正反均不可证，也就是所谓的“不可判定”。
+ 命题$G$对应的**元数学命题**，在第2步的**元数学论证**中被证明为真，则由对应引理可知，**PM命题$G$**是“真理”。
+ 因此，**PM中存在①不可证的②真命题，也就是说，PM是不完备的！**
+ 进一步地，无论如何扩充PM，都可以构造出类似的$G$。
+ 综合4和5可得：**PM是本质不完备的**。

### 证明细节

【第一步：构造自我指涉的PM命题$G$】

- 构造PM内部公式$G$，对应元数学命题“$G$在PM中不可证”，即“$G$不是PM的定理”。
- 换句话说，“哥德尔数为$g$的公式不是定理”。

- 首先，构造哥德尔数为$n$的公式$\gamma := ～(∃x)Dem(x, Sub(\mathrm Y, 17, \mathrm Y))$，其中$\mathrm Y$是一个“元”PM符号，可视为可以替换成其他合式PM公式的“占位符”。
- 将哥德尔数$n$对应的PM数字表示形式$N$<sup>[注]</sup>，代入上式$\gamma$中的$\mathrm Y$，得到公式$\Gamma := ～(∃x)Dem(x, Sub(N, 17, N))$
- 如何理解PM公式$\gamma$和$\Gamma$的关系呢？事实上$\gamma$**并不是一个确定的公式**，因为其中有个“变量”$\mathrm Y$，它的哥德尔数$n$实际上也是不确定的。我们不妨把$\gamma$看成是一个“公式方程”。而$\Gamma$是什么呢？$\Gamma$是一个**确定**的PM公式，它的哥德尔数是确定的数$n$，对应确定的PM表示形式$N$，它的PM公式形式也不含有任何不确定的部分。因为$N$和$n$是同一个数字的不同表示形式，而根据$\Gamma$的特点，$N$的形式决定了$n$的取值，也就是说，$\Gamma$通过哥德尔数进行了**自我指涉**。
- 回想$\Gamma$的构造过程：将$\Gamma$自身的哥德尔数$N$代入$\gamma$自身的变量$\mathrm Y$中，就得到$\Gamma$。也就是说，$\Gamma$是“公式方程”$\mathrm Y = \mathrm{PM\_WFF\_of\_Godel\_Number\_of}(\gamma(\mathrm Y))$的一个解。

- 依据对应引理，PM公式$\Gamma := ～(∃x)Dem(x, Sub(N, 17, N))$的元数学意义是：“哥德尔数为$sub(n, 17, n)$的PM公式是PM内不可证的。”注意这句话里面的符号都是小写的，也就是以数论的语言，表达了这个元数学命题。
- 这个元数学意义，恰好是我们最初打算构造的PM公式$G$，所表达的元数学意义。
- 也就是说，**PM公式$\Gamma := ～(∃x)Dem(x, Sub(N, 17, N))$就是我们所需要的$G$。**

- PM公式$G$的哥德尔数$g=n$恰好是PM公式$G$对应的数论命题$～(∃x)dem(x, sub(N, 17, N))$的一部分！
- 也就是说，构造了这样的一个对应的元数学诠释：
- “‘哥德尔数为$g$的公式是不可证的’这个公式是不可证的”
- 总之，的确可以构造出PM公式G，它说它自己不是PM的定理。

> 注：“$n$对应的PM数字表示形式”，指的是在PM系统中，用于表示数$n$的合式公式$N$，即形如“ss..s0”这样的字符串。这里一定要理解，数和用于表示数字的公式，是不同语言层面上言说的东西。

!["G"这个字母也很像衔尾蛇](./image/G2/ouroboros.png)

【第二步：$G$在一致的PM系统中是不可判定的】

- 可以证明：“$G$是可证的，当且仅当$～G$是可证的”。<sup>[注]</sup>
- 如果PM系统内部可以证明两个互相矛盾的命题，说明PM是不一致的。也就是说，若PM是一致的，则$G$和$～G$至少有一个不可证。
- 结合上面两点，$G$和$～G$都不可证。
- 因而，**若PM一致，则必然存在一个公式$G$，使得$G$和$～G$都不可证，即“形式上不可判定”**

> 注：哥德尔证明的是：若$G$可证，则$～G$可证（意味着PM不一致）；而若$～G$可证，则PM是ω-不一致的。

> 所谓的ω-不一致指的是：现有形式系统$C$，若其公式$(\exists x)P(x)$和无穷多个公式$～P(0)$、$～P(s0)$、$～P(ss0)$、……都是可证的，则$C$是ω-不一致的。

【第三步：$G$是元数学层面上的“真理”】

- 哥德尔说明，尽管$G$是PM不可判定的，但$G$在元数学意义/算术意义上是真的。
- 因为$G$的元数学意义是“某个命题自身是PM不可证的”，其算术意义是“并不存在一个数，满足这个数自身对应的某种性质”。
- 而我们刚刚（第二步）就**在元数学层面上**，证明了“$G$是PM不可判定的”**也即$G$本身所言说的**。
- 第二步的对$G$的不可判定性的元数学证明，实际上构成了对$G$的元数学真理性的证明。
- 综上，$G$在元数学层面上是真的。

【第四步：由于$G$的存在，PM是不完备的】

- “不完备”的意思是：存在系统内部不可形式判定的真命题。
- 在一致的前提下，存在PM命题$G$（第一步），它既是不可判定的（第二步），又是“真的”（第三步），所以PM必然是不完备的。

【第五步：还可以抢救一下吗？放弃治疗吧】

- 如果把刚刚找到的$G$作为公理，给PM打补丁呢？
- 然而，即便在PM中添加新的公理，使PM更强，但按照上面的套路，
- 总可以类似地找到另外一个$G'$，它是在“增强PM系统”中不可判定的真命题。
- 无论如何增强这个系统，都无法逃脱这个本质上的限制。
- 也就是说，**PM在本质上是不完备的。**

至此，我们得到了著名的哥德尔第一不完备定理：PM系统是不完备的。

### 一致性不可自证

PM足够强大到证明自身的一致性吗？很遗憾，不可能。请看证明：

- 构造PM公式$A→G$，其中$A$表达的元数学命题是“PM是一致的”，
- 并证明$A→G$在PM中可证。
- 假设$A$在PM中可证（也就是PM自身可以证明自身的一致性），
- 则根据分离规则，$G$也应该是可证的。
- 然而刚才已经证明，如果$G$可证，则$～G$可证，意味着PM不一致，矛盾。
- 因此，**如果PM一致，则PM不可能证明自身的一致性。**

这就是哥德尔第二不完备定理。

但请注意，哥德尔的证明**并未排除在PM系统外证明PM一致性的可能性！**

### 向创造思维致敬

> 演算机械的固有局限性并不意味着不能用物理学或者化学的方法来解释生命和理性。哥德尔定理既没有排除、也没有肯定这种可能性。哥德尔定理的确表明，**人类思想的结构和力量，要远比任何机器都要复杂和微妙。**哥德尔证明本身，便是这种**复杂**和微妙的显著例证。**我们完全不必为此失望，而应把握住这个对创造性理性再次赞赏的机会。**

> ——《哥德尔证明》第八章：结论性的反思

哥德尔证明→编码与计算→计算的极限→在微妙的复杂中超越计算极限

![“愚者”千反田酱，象征着无限的可能](./image/G2/chitanda.jpg)

## 理解复杂系统

![ ](./image/G2/conway-game-of-life-turing-machine.png)

## 大写的计算：向自然学习

# 尾声：无穷的Y

一等函数是许多高级语言都具备的特性，也是函数式编程的核心思想之一。一等函数思想和函数式编程的源头是丘奇发明的λ演算。通过本文介绍的Y组合子，看起来很简陋的λ演算，也可以实现递归函数，乃至具备和图灵机一样强大的计算能力。

不动点组合子的存在，意味着λ演算的确是足够强大的，但这并不意味着我们一定要使用它去书写递归程序。既然匿名函数可以通过不动点组合子实现递归，那么我们何必拘泥于“匿名”这一限制呢？直接赋予λ项以“名字”，岂不是更方便？于是，我们**终于可以安心地在编程语言中使用`(define ..)`这样的机制，给函数和各种各样的对象起名字，并且引用它们了**。不动点组合子，就是我们用来认识“名字”的深层意义的阶梯。

![你的名字？](./image/G2/omaedare.jpg)

事实上，λ演算并非最简洁的图灵完备系统。[SKI组合子](https://en.wikipedia.org/wiki/SKI_combinator_calculus)系统、标签系统、元胞自动机、甚至PPT，都具备和λ演算一样强大的能力，都可以实现递归，互相模拟彼此的行为。不动点组合子和这些同等强大的计算模型，能够帮助我们看清“名字”的本质。但是，自我指涉和互相模拟，似乎构成了一个无穷无尽的循环，似乎不能带领我们更进一步，不能带领我们突破计算的“极限”。

> 在登上高处后，就必须把梯子扔掉。必须超越这些命题，然后才会正确看待世界。
——维特根斯坦《逻辑哲学论》，命题6.54

在我们熟悉的代码的背后，有着深邃而奇妙的数理逻辑背景。Y组合子就像是镶嵌在数理逻辑天空中的一颗闪闪发光的星星，我们可以无视它，甚至不需要知道它的存在。但正是这一颗一颗闪烁着智慧之光的星星，共同点亮了计算机科学璀璨的星空，点亮了我们探索无穷的路。

为什么要仰望星空呢？因为星星就在那里呀。

# 参考资料选列

- [我想给你整个世界](#)
- Tom Stuart, 张伟（译）. [计算的本质](https://book.douban.com/subject/26148763/). 人民邮电出版社, 2014.
- Friedman D P, Wand M. [Essentials of Programming Languages, 3rd Edition](http://www.eopl3.com/)[M]. The MIT Press, 2008.
- [计算的本质](https://book.douban.com/subject/26148763/)
- [A Tutorial Introduction to the Lambda Calculus](http://www.inf.fu-berlin.de/inst/ag-ki/rojas_home/documents/tutorials/lambda.pdf)
- [维基百科 - Fixed-point combinator](https://en.wikipedia.org/wiki/Fixed-point_combinator)
- [类型与程序设计语言](https://book.douban.com/subject/1318672/)
- [https://en.wikipedia.org/wiki/Lambda_calculus]()
- [https://en.wikipedia.org/wiki/Church_encoding]()
- [http://www.yinwang.org/blog-cn/2013/03/31/purely-functional]()
