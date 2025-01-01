#!title:    机器学习
#!date:     2023-03-28

#!content

> 2023-03-28：增加《机器学习》专题。为什么不叫《人工智能》：首先这个专题并不关注“人工”的部分，只关注“机器”的部分；其次我不知道什么是“智能”，很难讨论一个没有良好定义的东西，而“学习”是个相对明确的东西，是一种数据驱动的方法、途径。这个专题不太关注目标ML能干什么，也不关注ML能否到达“智能”（这在其他专题中讨论），主要关注的是方法和技术的中微观细节。

# 机器学习理论

![机器学习模型训练的一般框架](./image/G4/ml-model-training.png)

## 最优化

> 2024-02-21

> 现在遵循控制论思想原则的人工智能实现方法，如机器学习、强化学习等等，都可以归结为两个字：寻优。

> “优”反映出人类对于问题域的理解，为解决方案注入人类的主观和先验，是问题的最终目标。机器学习我们叫损失函数、距离度量等等，概率统计我们叫似然函数、交叉熵一类的东西，理论物理我们把它称为“作用量”、哈密顿量等等。甚至我们常说的奥卡姆剃刀、正则化等等，它们反映了人类对于问题性质的某种信念，因而也属于“优”的范畴。

> 而“寻”，则是达到“优”的途径和方法。最优化理论就是“寻”优的理论。而落实到实践上，除了少数定义明确、性质良好的问题类，例如凸优化，有相当优雅高效的理性算法，大多数寻优方法都是所谓启发式的、出于人类对于物理世界的模仿的直觉。例如梯度下降，现在深度学习大模型的训练“寻”优手段，实质上就是梯度下降，其核心思想十分朴素，却相当有效。这种有效性可能反映出问题域的某种内在的结构。再例如遗传算法模仿生物进化、模拟退火模仿晶体退火过程中粒子各归其位等等。每种寻优算法在某些问题上相当有效，却不见得在任何问题上都有效，因而寻优方法和具体问题之间如何良好匹配，就构成了元寻优问题，因而相应出现了元启发式寻优算法。

> 进一步地，很多、甚至绝大多数情况下，我们甚至很难定义或者验证这个所谓的“优”，具体来说，就是找不到能够良好定义的目标函数，或者目标函数计算成本太高。既然“优”难以定义，那怎么寻呢？黑盒优化试图解决这类问题。极其粗糙地讲，黑盒优化的诸多手段，可以概括为“有根据地猜”。这也符合我们一般人在决策和判断时的行为策略。

> 在我个人看来，从可计算性理论的视角来看，所有的“计算”问题，都可以分为“判定”和“寻优”两大类。布尔可满足性（SAT）问题就是一个沟通了判定和寻优两大类问题的经典问题。经典问题之所以经典，是因为它具体而微。但是小不意味着简单喔。考虑到问题可以依复杂度归约，研究个别经典问题，有助于推广到一大类问题。而这个画头像的小demo，虽然简单而无用，但是我觉得它的内部深不可测。这种感觉完全出于我的无知。因此我时常提起这句话：

> **“实现了一个东西，不等于你理解了它。”**

### 优化稳定性与MIMO（2024-03-20）

① softmax的上溢问题。前段时间手写的多层感知机可视化，使用了sigmoid激活函数，没有遇到softmax上溢的问题。然而，如果把激活函数换成ReLU，则网络输出NaN。这是因为自己实现的softmax没有处理数值上溢的问题，从ReLU层输出到指数函数的数值过大，致使softmax层的输出变成infinity，导致后面各层变成NaN。

② 梯度下降的稳定性。自己手搓的梯度下降是最为朴素的恒定学习率小批量梯度下降，没有引入任何动量机制或者学习率调节机制。事实上，在神经网络的优化过程中，常常会在目标函数中遇到诸如鞍点、局部极小值、深而长的峡谷等“地形”，在这些位置上，简单的梯度下降优化往往会失效。在数学上，这些“病态”的情况可以用目标函数的Hessian矩阵来描述，而Hessian矩阵可以被分解成一组特征值，这些特征值足以描述目标函数在某点处的“地形”。具体地说，每个特征值都描述了目标函数在特定方向上的“曲率”。因而，如果目标函数某点Hessian矩阵的所有特征值都是正的，意味着此处是局部极小值。如果特征值有正有负，则此处可能是鞍点。而如果特征值的绝对值大小差异很大，直观上意味着此处“地形崎岖”，梯度下降容易迷路。[此处](https://en.wikipedia.org/wiki/Test_functions_for_optimization)有一些优化算法的测试函数，大多相当“崎岖”。

③ 梯度下降的改进。下图是自制的梯度下降可视化，手工绘制了一个狭长的深谷，这就是梯度下降的目标函数。在深谷峭壁上Hessian矩阵的各个特征值，也就是地形在各个方向上的“曲率”，差异很大，这意味着深谷的地形相当崎岖，因而在图中可以看到呈Z字形的梯度下降轨迹。这是因为朴素的梯度下降算法无法感知到地形的崎岖程度，只顾着找眼下最陡峭的方向猪突猛进，这样做的后果就是走弯路，甚至错过真正的极/最值点。因此，诸如AdaHessian之类的优化算法，可以感知到地形的崎岖程度，选择最合适的动量和学习率，尽可能少走弯路。而衡量“地形崎岖程度”的量，被称为Hessian矩阵的“条件数”，它是Hessian矩阵绝对值最大和最小的特征值的比值。Hessian矩阵的条件数越大，意味着目标函数越崎岖，梯度下降就要更加小心，以免迷路。

![ ](./image/G4/gd-ill.jpg)

④ 条件数与病态问题。在机器学习模型训练过程中，如果目标函数非常“崎岖”，意味着较小的位置变化可能会造成较大的上升和下降，这是一种不稳定的“病态”的情形。举一个更加形式化的例子来说明这个问题，线性方程组的系数，仅仅1%的微小扰动，就导致方程的解产生百倍的波动。如果矩阵的条件数非常大，意味着较小的误差会被放大成较大的波动。特别地，正交矩阵的条件数等于1，这意味着它在处理信息的时候，既没有损失，也没有冗余。直观来看，W矩阵的各行的相关性是很强的，意味着较大的条件数可能意味着较大的信息冗余（或者说线性变换的信息瓶颈），在W矩阵上损失的信息，就会在x矩阵中体现为巨大的不确定性。

$$ 令 \textbf{W}_0 = \begin{bmatrix} 100 & 100 \\ -100 & -101 \\ \end{bmatrix} \quad , \quad \textbf{b} = \begin{bmatrix} 1 \\ 1 \\ \end{bmatrix} $$

$$ 解方程 \textbf{W}_0 \textbf{x} = \textbf{b} \quad , \quad 得 \textbf{x} = \mathbf{W}_{0}^{-1} \textbf{b} = \begin{bmatrix} \color{blue}{2.01} \\ \color{blue}{-2.00} \\ \end{bmatrix}$$

$$ 令 \textbf{W}_1 = \begin{bmatrix} \color{red}{99} & 100 \\ -100 & -101 \\ \end{bmatrix} \quad , \quad \textbf{b} = \begin{bmatrix} 1 \\ 1 \\ \end{bmatrix} $$

$$ 解方程 \textbf{W}_1 \textbf{x} = \textbf{b} \quad , \quad 得 \textbf{x} = \mathbf{W}_{1}^{-1} \textbf{b} = \begin{bmatrix} \color{blue}{-201} \\ \color{blue}{199} \\ \end{bmatrix}$$

⑤ 深度学习中的训练稳定性问题。上周末用MLP解决Q问题（数字数圈圈找规律）时，一开始没有打乱训练数据集，每一批次参与训练的数据可能有较强的相关性，训练迟迟无法收敛。这可能就是因为样本之间相关性过强，样本矩阵的条件数过大，导致网络权值矩阵大幅震荡，从而难以收敛。将训练数据打乱后，网络很快就收敛了。另一方面，在深度学习的工程实践中，尽管诸如FP16、BF16甚至整数精度的训练可以有效节约显存、提升运算效率，但是由于数值精度的下降，在某些病态情况下，运算结果可能会大幅波动，导致训练失败。因此，在成熟的训练框架中，引入了自动混合精度（AMP）策略，可以通过梯度缩放等手段，避免因数值精度问题导致的训练不稳定性。不过，大模型提醒我，低精度训练也可以视为一种正则化手段，这大概就是无处不在的辩证法吧。

⑤ MIMO系统的预编码。在无线通信技术当中，对于多收多发MIMO系统，简而言之，多个收发天线之间的无线信道可以表示成矩阵H，它描述了多个收发天线两两之间的信道特性，这跟用矩阵来描述全连接神经网络的权值有相似之处。假设发射信号为x，经MIMO系统接收到的信号为y，那么对于MIMO接收机而言，它接收x的过程，实际上就是已知y、求解矩阵方程y=Hx的过程。然而，在Massive-MIMO系统中，H很大，并且未必可逆，因此求解过程的计算复杂度非常高。因此，工程上可以对H作奇异值分解，将H分解成UΣV，其中UV都是正交矩阵，而Σ是对角矩阵。U和V是收发两端通过CSI（信道状态信息）协商得到，在数学上（如图），可以通过简单的对角矩阵Σ来求取发射信号x，这就是MIMO的预编码技术。

![MIMO预编码原理，[来源](https://www.sharetechnote.com/html/BasicProcedure_LTE_MIMO.html)](./image/G3/mimo-precoding.png)

⑥ MIMO信道的层和条件数。MIMO信道的层，等于H的秩，也就是奇异值矩阵Σ对角线上非0值的个数。如果H是满秩的，意味着所有的信道都可以用于通信。然而，满秩不意味着最高的通信效率。如上文所述，MIMO信道的条件数定义为Σ对角线数值的差异，如果H的条件数约等于1，意味着所有信道都被利用、都是正交的、互不干扰，因而可以更高效地利用信道带宽，在较低的信噪比上实现较高的通信速率。

### 梯度下降演示（2018-05-24）

<iframe class="MikumarkIframe" src="./html/sgd.html" height="450px"></iframe>

- 多个同参数高斯函数叠加形成峰谷
- 点击坐标区域，添加极小值
- 点击**选择起点**，可选择迭代起始点
- 再点一次**选择起点**按钮，退出起点选择
- 点击**切换为极大/小值**，可切换极大/小值
- 参考：[Test functions for optimization](https://en.wikipedia.org/wiki/Test_functions_for_optimization)

### 模拟退火演示（2020-07-16）

<iframe class="MikumarkIframe" src="./html/simulated-annealing.html" height="450px"></iframe>

- 多个同参数高斯函数叠加形成峰谷
- 点击坐标区域，添加极小值
- 点击**选择起点**，可选择迭代起始点
- 再点一次**选择起点**按钮，退出起点选择
- 点击**切换为极大/小值**，可切换极大/小值

- 参考：[模拟退火](https://zh.wikipedia.org/wiki/%E6%A8%A1%E6%8B%9F%E9%80%80%E7%81%AB)
- 参考：[HSV色彩空间](https://zh.wikipedia.org/wiki/HSL%E5%92%8CHSV%E8%89%B2%E5%BD%A9%E7%A9%BA%E9%97%B4)

### 遗传算法求解旅行商问题（2019-04-29）

<iframe class="MikumarkIframe" src="./html/genetic-tsp.html" height="460px"></iframe>

### 遗传算法拟合任意图像（2024-02-21）

受到fwjmath的博客文章《[遗传算法：内存中的进化](https://fwjmath.wordpress.com/2009/03/02/genetic-algorithm-evolution-in-memory/)》启发而制作。以下引用该文：

> 从前在海岸边有一群扇贝在悠哉游哉地生活繁衍着。它们自然是衣食不愁，连房子也有了着落。它们担忧的只有一件事：每隔一段时间，总有一个人来挖走它们之中的一部分。当然啦，挖回去干什么这大家都知道。但扇贝们不知道的是，这人的家族图腾是Firefox的图标，所以他总是选择那些贝壳花纹长得比较不像Firefox图标的扇贝。这种状况持续了好几十万代。大家应该也猜到扇贝们身上发生什么事情了：它们的贝壳上都印着很像Firefox图标的图案。

<iframe class="MikumarkIframe" src="./html/genetic-image.html" height="200px"></iframe>

太史公曰：经常看到有人惊呼生命是多么神奇（进而引申到神创论的观点）等等。生命之所以神奇，不是因为生命多么神奇，实在是因为人类少见多怪。

### 迷宫生成与A*寻路算法（2024-02-26）

<iframe class="MikumarkIframe" src="./html/maze.html" height="400px"></iframe>

## 分类、回归

### 单层感知机演示（2018-05-26）

<iframe class="MikumarkIframe" src="./html/perceptron.html" height="450px"></iframe>

若数据集线性不可分，则会陷入无穷迭代。此例二维空间上线性可分的判定，可采用凸包+扫描线算法解决。
左下角(-160,-160)，右上角坐标(160,160)
感知机是简单的线性二分类模型，是神经网络和SVM的基础。这里使用随机梯度下降方法对其进行训练。

### 支持向量机演示（2018-06-02）

<iframe class="MikumarkIframe" src="./html/svm.html" height="500px"></iframe>

: 左下角为原点，右上角坐标(300,300)

+ SVM核心使用第三方实现：[SVMJS](https://cs.stanford.edu/people/karpathy/svmjs/demo/)（[GitHub](https://github.com/karpathy/svmjs/)）
+ 参考资料：[支持向量机：理论、算法与拓展](https://book.douban.com/subject/3927560/)

## 聚类、变换、压缩

## 集成学习

## 概率图模型

## 神经网络和深度学习

### 多层感知机可视化（2024-03-06）

<iframe class="MikumarkIframe" src="./html/mlp.html" height="600px"></iframe>

### 可微分计算

- [矩阵求导术（上）](https://zhuanlan.zhihu.com/p/24709748)、[矩阵求导术（下）](https://zhuanlan.zhihu.com/p/24863977)
- [Matrix Calculus](https://www.matrixcalculus.org/)

### Transformer

![Transformer语言模型](https://raw.githubusercontent.com/bd4sur/Nano/refs/heads/master/doc/nano-llm.png)

![多头注意力](./image/G4/multi-head-attention.svg)

![[来源](https://www.youtube.com/watch?v=-9vVhYEXeyQ)](./image/G4/bert-3d.png)

- https://arxiv.org/abs/1706.03762
- https://jalammar.github.io/illustrated-transformer/
- https://nlp.seas.harvard.edu/2018/04/03/attention.html
- https://erdem.pl/2021/05/introduction-to-attention-mechanism

# 应用：人类知觉智能(NLP/CV/多模态)

2023-12-03：前几年，在人工智能领域，有一种学科划分方式，将NLP、知识工程划分为“认知智能”，将计算机视觉、语音、触觉等涉及视听和感觉的，划分为“感知智能”。然而，近几年的研究表明，“认知”和“感知”不应分家，多模态融合才是正确的发展路线。因此本章的标题是“人类智能”，将自然语言处理、机器视觉、语音等学科，统统纳入“人类智能”的范畴，或者称为“知觉智能”。此处再次强调我关于所谓人工智能的观点：**人工智能的使命是理解世界，而不是理解人类。**

## 大规模语言模型

### 2024年预训练语言模型调研记录

**2024-12-30**：经过一轮预训练（256亿词元）和一轮监督微调（1288万条QA对）之后的效果：终于知道澳洲的首府在哪里了。但仅此而已，还是很蠢，没有实用价值。计划在2025年1月中旬结束训练。届时将完成两轮监督微调。后续不再折腾了。

**2024-12-24**：评[Meta的工作](https://ai.meta.com/research/publications/byte-latent-transformer-patches-scale-better-than-tokens/)：调教电子鹦鹉的时候就觉得词表这东西很没有智慧，没有智慧就在于它掺杂了人类对于“token”的理解。所以我自己的电子鹦鹉就没有词表的概念，就是unicode进unicode出。是时候把碳基彻底赶出硅基了。

**2024-12-20**：预训练持续40天，吃掉256亿个词元，验证集损失2.1，到此为止。今天开始，在12000000条问答语料上进行监督微调，至少一轮。

**2024-12-19**：魔改AK大佬的llama2.c，使其支持Qwen2(.5)的推理。Qwen2(.5)的模型结构，相比Llama2，只是在QKV上加了偏置，所以改动很小。

**2024-12-16**：自己拍脑袋设计词表的一个严重缺陷是…我忘了还有日本新字形…我只是简单地把两个国标里面的简繁体汉字塞进词表里。当然了，训练语料里想来也没有日文。

**2024-12-14**：自制168M电子鹦鹉在BBU上跑起来了，速度可以达到20个token/s。①上面那块VSWd1比下面那块更快，可以达到40token/s，估计是因为上面跑的任务比较少，看样子应该是2020年出厂的早期产品。②交换板手动关机后似乎会自动重启，重启后会重置系统，系统应该是存储在板子上的ROM里，每次上电都会写到SSD里，从SSD启动。

**2024-12-12**：虽然现在大家的兴趣都在1G以下的小模型上，但它的价值确实是要打个问号的。既然是说人话，那么“好”还是要比“快”重要一些。鹦鹉虽然会说人话，但是没人真的想跟鹦鹉唠嗑吧。归根结底，菜是原罪。不过，在封闭世界中的某些场景下，处理一些不那么严肃的任务，比如______，我觉得还是挺有价值的。等我的____模型炼成之后，第一件事就是郑重声明：电子鹦鹉所说的任何话，本人一概不承认。

**2024-12-09**：是从头训练小模型？还是把大模型压缩成小模型？根据[这篇文章](https://arxiv.org/pdf/2412.04315)，看来，依靠剪枝蒸馏量化把大模型压缩成小模型，还是把太多的人类自作聪明的理性因素引入了大模型，反而导致模型能力密度下降。而从头训练小规模模型，让小模型自己在大规模高质量语料中学习，更有利于得到知识密度更高的小模型，接近率失真优化的极限。此中得失，需要权衡。

**2024-11-28**：上月训练的56M语言模型，成本高于1克黄金，智力低下，几乎无法解决任何实际问题。终端部署是能行的，性能是可以接受的，唯一有潜力的是瑟琴机器人这种恰好需要幻觉但是创造力又很有限的场景。而现在正在训练的168M模型，已经训练了半个多月，吃掉了100多亿词元，但是远远不够。目前看到的各种数百数千M级小规模模型，包括Qwen、Phi、SmolLM、MiniCPM等等，在解决事实性问题上都不是很堪用，但是在解决通用的语义理解类问题上还是有一定用处的。监督微调归根结底还是体力劳动，我个人没法承担这么大的工作量。

**2024-11-18**：Nano的WASM推理引擎现已支持LoRA插件…因为我戴了__色的眼镜，所以看什么都是__色的～但更令人感叹的是NLP的奇妙的发展史。下图左边是2018年整的一个小活，只是一个ChatBot的静态前端界面而已，无论输入什么都只会返回一个meme图，唯一值得说的就是上古时代的RAG——点击图片会以上一句话为关键字去搜索百度。虽然当时AttentionIsAllUNeed已经发表，但是绝对无法预料人类究竟何时/能否通过图灵测试。短短6年后，我有了右边那个东西。能否通过图灵测试不知道，但是当一只____也很令人称奇了。**打造电子鹦鹉，是我试图回答“人类的本质是什么”这个难题的一个现象学的进路**。

![ ](./image/G4/nano-neko-lora.jpg)

**2024-11-17**：Nano浏览器推理现已支持WASM加速！按需加卸载LoRA模块机制稍后加入。最近研究了一点WASM，像这种栈式虚拟机长得都差不多，有意思的是适配各种运行时环境的部分，也就是对于标准库的实现那部分。今天完成的WASM推理引擎，最重要的改进是将C语言代码中手写的朴素Trie树改成了以内存池形式实现的高效实现，消除了运行时malloc，而这对于提升WASM性能是决定性的：因为观察到malloc在浏览器上性能很差，并且大部分时间都花费在GC上。看了这么久WASM汇编代码，基本上看不懂。尤其是开了最高优化之后的汇编代码，完全看不懂。我也算是一个编译器爱好者，但是我自己的编译器生成的汇编代码我自己也看不懂。另外汇编这个层面到底要侵入宿主环境多深，到底要跨越多少个抽象层次，是个很有趣的问题。我自己搞的虚拟机/指令集是可以感知到λ闭包的，这有利于减少编译器的工作量，但是虚拟机要考虑的就很多了，访问变量的开销非常大。WASM与WASI和emscripten这两层东西是分开的，这很好。很大一部分精力花在了搞清楚这两层之间的边界在哪里。浏览器上的 WASM API 给开发者留了很大的自由度，开发者可以自由操作所谓的线性内存，所以我说绝对的权力意味着绝对的责任。malloc帮我们干了很多脏活累活，但是作为他们一切的主人，我们也不能越俎代庖，专业的事情交给专业的人干。而问题在于，我是那个专业的人吗？

**2024-11-16**：现有的56M大模型，是一只合格的电子鹦鹉。它可以创造性地说出流利通顺的人话，但是并不能保证事实正确。其语言能力大概相当于刚学会说话不久的小朋友。但这并非没有价值。在______场景下，它的确能复读出语料中那些____的话，但同时因为模型规模较小、以及训练不充分的缘故，它似乎不能完全沉浸在____的语境中，往往会说出很出戏的话。所以与其说是____，不如说是搞笑，有种难以言喻的诙谐感🤣。作为极小规模的胡言乱语机器人是合格的。如果训练得当，放在某些大型游戏里，用Lua这类胶水语言直接嵌入进去，作为NPC的电子大脑是完全可行的。现在正在训练168M规模的语言模型，已经训练一个星期了。至于要训练多久，只能说多多益善吧。希望它的智商比起56M模型能有一些提升。

**2024-10-13**：租用1块A800(80GB)训练58M参数的语言模型，词元吞吐率大约200000token/s，大约是 AGX Orin 的十倍。因此我只能说我玩过的最离谱的东西就是用每小时x元的价格训练电子鹦鹉。现在想想，社会把很大一部分注意力放在电子鹦鹉上，这真的好吗？

**2024-10-12**：电子🦜的训练进展。50M参数，3.2B数据集，AGX Orin 盒子，预训练跑3天了，还不到两个epoch，已经没有耐心了= = 昨晚改进了词元编码，无非是覆盖了所有的CJK字符和绘文字（没错，我认为绘文字才是真正的世界语，给它分配1800个位置是值得的）。另外，考虑到英文的编码效率，加了几千个英文词根词缀和高频词，凑出32768个词，作为默认词表。构建词元编码器是基础工作，它如果不稳定，就不要贸然开展训练。语料还是要持之以恒地做，但是要有个基线。对于个人爱好者来说，数据算力算法，数据是最难搞的，算力倒还在其次（只需要付出亿点点钞能力）。数据难，还是因为把知识从人脑迁移到电脑这件事很难。

**2024-10-11**：用魔鬼辞典来微调正在炼制的50M语言模型。

**2024-10-09**：用假期前训练的预训练模型，在通用SFT数据集上做了小量的SFT，效果比预期好很多。看来没日没夜的长期连续充分预训练是非常有必要的。因此又准备了1.6B词元的预训练语料，计划再花几天时间，再训练一个基础预训练模型出来。

**2024-10-06**：关于大模型的监督微调究竟应该怎么调，现在依然是众说纷纭。机器学习喜欢谈“泛化能力”，但是我请问呢，从“短波业余波段有7MHz、14MHz、21MHz”能泛化出“18MHz”吗？恐怕是不能的。知之为知之，不知为不知。“泛化”是不存在的。“泛化”这个词就体现出一种人类特有的傲慢和自信，我都学会骑自行车了，开车有啥难的。不信你来刺桐城试试？一切训练的实质都是记忆，在封闭世界假设中，一定要让模型见到过全部的世界，最好还有它的反面。除此之外“泛化”出来的，都只能说是幻觉，而不是事实。如果说其中有符合事实的部分，那也只能说是巧合而已。

**2024-09-30：电子🦜训练随笔**

- **目标任务**：最近趁着假期前夕的宝贵空闲，从0927晚上9点开始，训练一个35M参数量的Llama-like语言模型，目标有二：①假装学会回答业余无线电操作证考试问题；②知道自己是BD4SUR训练的大模型和“人类的本质是复读机”这个事实。最终的目标是：对大模型祛魅。
- **模型结构**：模型的实现是基于Karpathy大佬的nanogpt魔改的，自己实现了数据预处理、数据加载器、简单的词元编码器、训练和微调流程等外围组件，并且对原有的GPT模型结构做了简单的魔改，使其兼容RoPE、RMSNorm两个重要技术（因而是Llama-like而不是GPT-like）。整个实现完全不依赖HF的各种框架，如Transformers、Tokenizers等等，也不打算兼容它们，仅依赖torch。具体而微，是我自己搞这些玩具的一个最重要的方针。模型的上下文窗口是256个词元，参数量35M。词元编码器采用最简单的方法，也就是将Unicode字符映射到一个整数。词典大小19000多，模型的词典大小设为20000整，为特殊词元预留一些空间。为了让模型更清楚地认识它的主人，将BD4SUR设置为特殊词元。
- **硬件和环境**：训练硬件使用 Jetson AGX Orin (64GB)，这个小盒子唯二的优势是显存大、功耗低（最高60W），通宵训练不用太担心消防安全问题。至于计算性能嘛，只能说“又不是不能用”，在BF16精度加自动混合精度加FlashAttn的设置下，粗略估计大概可以跑到23TFLOPS的速度（词元吞吐率没有计算）。从单位显存价格角度来看，AGX(64GB)比起 Mac Studio 其实是更划算的，但算力远逊于 Mac Studio，不过生态上的优势又弥补了这一点。虽说显存多多益善，但训练35M参数的语言模型，并不需要多少显存。大显存可以使用更大批大小，批大小设置为256时，显存占用大概30多GB。
- **预训练**：预训练语料的准备极端重要，其重要性无论如何强调都不为过。垃圾进垃圾出的铁律，会惩罚每一个不做数据工程的人。但是我并没有那么多的时间精力，只草草找了些百科、医学、xxqg、精神分析、无线电和经济类语料，利用GPT-4o等商用模型做了简单的、局部的清洗，也生成了一些语料，最终得到大约400M词元的预训练语料。按照所谓的规模扩展定律（Scaling law），预训练词元数至少要是模型参数量的20倍以上。虽然没有这么夸张的倍数，但是这次准备的语料，对于模型参数量来说，也不少了。模型的检查点文件（pickle）大概400MB左右，为了方便使用，将词元编码器（的配置文件，也就是词典）也包括在里面了。预训练持续到0929晚上，迭代了大概100000步，经历8到9个epoch，损失下降到2.1左右。数据的调度（或者叫“数据课程”）不太合理。6类语料是按顺序预训练的，这导致模型的损失曲线呈现出非常明显的分段，损失值低者达到2以下，高者依旧3点多，不过整体趋势是下降的。不知道这样做的负面影响是什么。为了弥补这一点，在第9个epoch将所有语料混合在一起，最终达到2.1的交叉熵损失。预训练阶段，还有一个很重要的技术细节，那就是分块的因果自注意力。预训练语料的分块（chunking）是个特别讲究的环节，如果不相关的句子出现在同一个上下文窗口中，需要用特殊词元将他们隔离开，并且训练阶段最好不要让他们互相看到，因此需要在注意力掩模上动手脚。或者直接在数据预处理阶段将不相关文本分配到不同的窗口中，代价是会浪费很多填充词元的长度，降低训练过程的有效吞吐率。但是我在数据处理阶段并没有很重视数据块的切分，甚至连bos/eos这样的分隔符都没加，所以这个是后续改进的一个点。
- **监督微调和偏好优化**：为了尽快看到效果，从0930凌晨开始，开始用业余无线电操作证考试QA数据集，对预训练模型作监督微调。为了提升SFT的效果，避免微调阶段过分过拟合，用商用大模型扩充了官方的操作证考试题库，每个QA扩充了3条不同的问法，试图激发出模型更一般的语义理解能力。最终得到大约5000条QA对，其中包括“我是BD4SUR训练的大模型”和“人类的本质是复读机”。今天（9月30日）早上8点左右看，损失下降到0.03，实际效果尚未验证。像这种损失值，恐怕早已发生了灾难性遗忘，模型原有的语言知识可能已经基本上被破坏殆尽，但是换来了在操作证考试QA上的精确（然而也是呆板的过）拟合。另外，SFT数据集中，加入大量“我是BD4SUR训练的实验性大模型”和“人类的本质是复读机”数据样例，试图为其注入自我认知。在这种场景下，RLHF的价值就体现出来了。一方面，BD4SUR作为特殊词元，特别容易跟填充词元、指令标记词元等特殊词元混淆，这可能是因为训练不充分，也有可能是SFT中缺乏惩罚机制（当我冒出惩罚的想法时，就意味着该上RL了）。另一方面，模型还不能很有效地学习到指令遵循能力，这会导致问答（chat）场景下，回答部分会出现特殊词元，也就是没有完全遵循指令模板的格式。无论如何，今晚回去看看，经过几百轮SFT的模型，在无线电领域上回答问题的效果如何。
- **推理及其优化**：推理优化，实际上是一个极其有价值且困难的课题，但这暂时不在我现阶段的考虑范围内。一个最基础的优化就是KV-Cache，以空间换时间，基本的实现并不复杂，但是它的优化非常高深，vLLM在这方面做了很多工作。
- **开源的考虑**：至于要不要发布在HF上，我看，还是不要了。拍个视频，留作证明就好了，不必什么东西都开放出去。最重要的考虑，当然是安全性问题。训练语料里面有大量的xxqg内容，所以模型会生成什么东西，我是完全无法控制的。另外，虽然这个模型并没有什么实用价值，但从成本的角度来看，应该说还是相当昂贵的。人力成本（不是什么阿猫阿狗都能搞定这个过程的，请给我技术咨询费！）、时间成本（它在炼丹的时候我在看杨旭游记）、能源成本（连着开了三天三夜的空调，并且是21度！冻死我了）、以及炼丹炉本身的成本（价格不菲的炼丹炉高负载连续运行三天三夜的折旧费估计也不便宜吧），都不可忽视。所以说，自己玩的东西不见得对他人有价值，但可能是相当昂贵的，只为博君一笑，拍个视频证明一下，天空没有留下痕迹，但我已经飞过，这就够了。

**2024-09-24**：词元编码（tokenizer）是传统NLP在大模型时代的最后堡垒之一。但是我觉得相比于其他模态的信源编码算法，自然语言文本的codec，诸如BPE之类的，并没有太多人类的智慧在里面。或者说，人类还是不要自作聪明地去做什么tokenize，直接交给模型去学就好了。因此，不想在词元编码上花费太多精力，直接使用一个Unicode字符一个词元的香草味方法。不过，对于英文这样的字母语文来说，BPE这样的词元编码还是有必要的。但我觉得这主要是经济性的考虑，里面是没有智慧的。当然工程实现层面很有智慧。

**2024-09-21**：我最近在尝试在nanogpt上进行预训练和监督微调，试图让小规模的GPT-like模型能够回答业余无线电操作技术能力验证的问题。不求正确，只求“说人话”。但是我总觉得现在的大模型与人脑的运作机制大不相同。具体来说就是LLM是“刚性”的、开环的，它不具备在推理时反馈重塑自身的能力。像语境学习（In-context learning）这样的能力，无非是搜索空间巨大，以至于给人一种举一反三的错觉而已，实际上模型并没有真的泛化出什么内在规律，也没有根据输入信息对自己进行“实时的重新训练”。像预训练、监督微调、人类反馈强化学习一类的手段，似乎都没有做到这一点。RLHF虽然体现了“实时训练”“训推闭环”这样的思想，但还是觉得不够到位。在自省和自我重塑这个视角看来，LLM作为一个庞大的开环控制系统，它甚至不如某些编程语言及其实现更有“智慧”。而人脑是一坨肉，它的结构是柔性的，神经元是会动的，在宏观的稳定中，存在着微观的噪声和易变。虽然诸如NAS（神经网络结构搜索）一类的技术试图将网络结构作为一种超参数甚至网络参数纳入优化的范围，但是如何在推理时实现这一点，可能还有很大的想象空间。归根结底，还是那种熟读唐诗三百首式的智能。LLM掌握了大量的“司机知识”，给人一种充满智慧的表象。至于 OpenAI o1 这类最新的工作，还需要进一步了解。最后还是要关注那个问题：**从表象到逻辑的模式之间，究竟是如何演化的。伽罗瓦式的智慧和拉马努金式的智慧，究竟有什么样的区别和联系。**

### LLM性能测试备忘录

机器配置如下：

```
OS: Ubuntu 20.04.6 LTS x86_64
Host: NF5568M4
Kernel: 5.15.0-100-generic
CPU: Intel Xeon E5-2686 v4 (72) @ 3.000GHz
GPU: NVIDIA Tesla P40
GPU: NVIDIA Tesla P40
GPU: NVIDIA Tesla P40
GPU: NVIDIA Tesla P40
Memory: 128767MiB
```

Llama.cpp测试，测试输入“频谱仪的分辨率带宽和扫描速度之间是什么关系？”，无系统提示。

- `./llama.cpp/main -m Qwen15-72B-Chat-q2_k.gguf   -n 512 --color -i --chatml --numa distribute -t 36 --mlock -ngl 81`：5.55 tokens/s
- `./llama.cpp/main -m Qwen15-72B-Chat-q4_k_m.gguf -n 512 --color -i --chatml --numa distribute -t 36 --mlock -ngl 81`：4.79 tokens/s

### 在安捷伦N9020A频谱仪上部署Qwen

视频：[在2007年的频谱仪上部署AI大模型](https://www.bilibili.com/video/BV1du4m1P7iU)

### 在松下SV8便携电脑上部署ChatGLM

<details>

<summary>2023-11-28 chatglm.cpp</summary>

以下完全基于[chatglm.cpp](https://github.com/li-plus/chatglm.cpp)（V0.3.0）部署。在松下SV8洋垃圾笔记本（Core i5-8365U，16GB内存，512GB的NVMe固态硬盘，Ubuntu 20.04 LTS）上测试，体验良好，运行速度尚在能够容忍的范围内，作为人工智障小玩具是堪用的。以下是部署过程备忘，连同环境在内的所有文件已备份到物理硬盘上。

首先，需要将全精度模型转换为低精度的GGML格式的模型。模型转换和量化过程对算力要求不大，但是对于内存需求巨大。6-7B模型需要至少16GB内存，13B模型需要至少64GB内存。由于SV8物理内存只有16GB，因此需要临时扩充交换空间，至少需要50GB的交换空间。临时交换空间的设置方式如下：

```
sudo fallocate -l 50G /swap
sudo sudo chmod 600 /swap
sudo mkswap /swap
sudo swapon /swap
# 查看交换空间
sudo swapon --show
# 查看所有内存
free -h
```

安装各种依赖。

```
python3 -m pip install -U pip
python3 -m pip install torch tabulate tqdm transformers==4.33.0 accelerate sentencepiece
```

拉取chatglm.cpp代码仓库和子模块：

```
cd ~/ai
git clone --recursive https://github.com/li-plus/chatglm.cpp.git && cd chatglm.cpp
git submodule update --init --recursive
```

去HuggingFace或者ModelScope下载模型权重文件。由于涉及巨大模型文件，需要先安装git-lfs：`sudo apt install git-lfs`。然后拉取模型仓库：

- `git clone https://www.modelscope.cn/ZhipuAI/chatglm3-6b.git`
- `git clone https://www.modelscope.cn/ZhipuAI/chatglm3-6b-32k.git`
- `git clone https://www.modelscope.cn/ZhipuAI/codegeex2-6b.git`
- `git clone https://www.modelscope.cn/baichuan-inc/Baichuan2-7B-Chat.git`
- `git clone https://www.modelscope.cn/baichuan-inc/Baichuan2-13B-Chat.git`

将模型转换为GGML格式并量化。其中`ModelRepoDir`是模型仓库的目录，量化类型建议取`q4_0`节约内存或者`q8_0`效果和速度折中。

```
cd ~/ai
python3 chatglm.cpp/chatglm_cpp/convert.py -i ModelRepoDir -t q8_0 -o ggml/xxx-ggml.bin
```

编译并安装chatglm.cpp。编译选项可以开启OpenBLAS：`-DGGML_OPENBLAS=ON`，但是实测发现性能似乎并未有提升，因此暂且不开启。

```
cmake -B build
cmake --build build -j4 --config Release
```

此时可以用编译好的可执行文件测试LLM推理：

```
chatglm.cpp/build/bin/main -m ggml/xxx-ggml.bin -p "执行JavaScript代码：Math.sqrt(2)"
# 交互式
chatglm.cpp/build/bin/main -m ggml/xxx-ggml.bin -i
```

还可以安装Python的接口库`pip install -U chatglm-cpp`，使用以下的简单代码进行测试：

```
#encoding=utf-8
from typing import List
import chatglm_cpp

SYSTEM_PROMPT = ""

MODE = "chat" # "chat" or "generate" for code generation
MODEL_INDEX = 1
MODEL = [
    "ggml/chatglm3-6b-32k-chat-i8-ggml.bin",
    "ggml/chatglm3-6b-chat-i8-ggml.bin",
    "ggml/baichuan2-13b-chat-i8-ggml.bin",
    "ggml/codegeex2-6b-i8-ggml.bin",
]

MAX_LENGTH         = 32000 # max total length including prompt and output
MAX_NEW_TOKENS     = -1 # max number of tokens to generate, ignoring the number of prompt tokens
TEMPERATURE        = 0.9
TOP_K              = 0
TOP_P              = 0.7
REPETITION_PENALTY = 1.0 # penalize repeat sequence of tokens
THREADS            = 8 # number of threads for inference

def main() -> None:

    print("""Input "restart" to restart conversation
      "stop" to quit\n""")

    generation_kwargs = dict(
        max_length = MAX_LENGTH,
        # max_new_tokens = MAX_NEW_TOKENS,
        # max_context_length = 512,
        do_sample = (TEMPERATURE > 0),
        top_k = TOP_K,
        top_p = TOP_P,
        temperature = TEMPERATURE,
        repetition_penalty = REPETITION_PENALTY,
        stream = True,
        num_threads = THREADS,
    )

    pipeline = chatglm_cpp.Pipeline(MODEL[MODEL_INDEX])

    system_messages: List[chatglm_cpp.ChatMessage] = [] # 注意：百川2-13B不要加入这两行
    system_messages.append(chatglm_cpp.ChatMessage(role="system", content=SYSTEM_PROMPT))

    messages = system_messages.copy()

    while True:
        try:
            prompt = input("User:\n")
        except EOFError:
            break

        if not prompt:
            continue
        if prompt == "stop":
            break
        if prompt == "restart":
            messages = system_messages.copy()
            continue

        if MODE == "generate":
            for chunk in pipeline.generate(prompt, **generation_kwargs):
                print(chunk, sep="", end="", flush=True)
        elif MODE == "chat":
            messages.append(chatglm_cpp.ChatMessage(role="user", content=prompt))
            print(f"{pipeline.model.config.model_type_name}:", sep="", end="")
            chunks = []
            for chunk in pipeline.chat(messages, **generation_kwargs):
                print(chunk.content, sep="", end="", flush=True)
                chunks.append(chunk)
            print()
            messages.append(pipeline.merge_streaming_messages(chunks))

    print("Bye~")


if __name__ == "__main__":
    main()

```

</details>

## 视觉和图文跨模态理解

### Qwen-VL

### 应用案例：表情包搜索引擎

视频演示：[自制表情包搜索引擎演示](https://www.bilibili.com/video/BV1vJ4m1e7MN)

2024-02-25：正在用Qwen-VL给六百多个表情包梗图做captioning。速度太慢了太慢了，按照这个速度，估计要做到明天去。并且视觉语言模型在meme理解上还是有很大的缺陷，最可笑的是，可能是由于价值观对齐的缘故，诸如“装逼”这样的词是无法出现的，会识别成“装通”。我们仍未知道视觉语言模型是如何实现OCR的。看来必须挂一个传统的OCR模型了，用来忠实提取画面上的文字，保证召回率。另外，提示语的设计仍然是个开放问题。

## 图像和视频合成（文生图等）

### Stable Diffusion

## 语音识别和理解

### Qwen-Audio

### FunASR

<details>

<summary>在低性能CPU机器上部署FunASR</summary>

2023年，阿里巴巴达摩院开源了[FunASR](https://github.com/alibaba-damo-academy/FunASR)语音识别工具包，可以在低资源CPU计算机上运行。以下参照实时语音转写的[官方安装指导](https://github.com/alibaba-damo-academy/FunASR/blob/main/runtime/docs/SDK_advanced_guide_online_zh.md)，整理出一份安装部署检查单。

**首先安装docker**

```
curl -O https://isv-data.oss-cn-hangzhou.aliyuncs.com/ics/MaaS/ASR/shell/install_docker.sh
sudo bash install_docker.sh
```

**拉取镜像并保存为本地tar包**

```
sudo docker pull registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr:funasr-runtime-sdk-online-cpu-0.1.5
sudo docker image save -o ~/ai/funsar/funsar.tar registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr:funasr-runtime-sdk-online-cpu-0.1.5
```

**启动容器和实时语音转写服务**

```
sudo docker run -p 10096:10095 -it \
  --rm \
  --privileged=true \
  --name funasr \
  --volume ~/ai/funasr/models:/workspace/models \
  --workdir /workspace/FunASR/runtime \
  registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr:funasr-runtime-sdk-online-cpu-0.1.5 \
    bash run_server_2pass.sh \
      --download-model-dir /workspace/models \
      --vad-dir damo/speech_fsmn_vad_zh-cn-16k-common-onnx \
      --model-dir damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-onnx  \
      --online-model-dir damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online-onnx  \
      --punc-dir damo/punc_ct-transformer_zh-cn-common-vad_realtime-vocab272727-onnx \
      --itn-dir thuduj12/fst_itn_zh \
      --hotword /workspace/models/hotwords.txt
```

以上命令中的镜像ID也可以替换为`docker image load -i ~/ai/funasr/funasr.tar`之后得到的镜像ID。

**启动客户端**

首先下载[客户端](https://isv-data.oss-cn-hangzhou.aliyuncs.com/ics/MaaS/ASR/sample/funasr_samples.tar.gz)。在启动Python客户端之前，需要针对音频做一些设置。首先安装工具和库：

```
sudo apt install pavucontrol portaudio19-dev
pip install websockets pyaudio
```

然后启动Python客户端：

```
python3 ~/ai/funasr/client/python/funasr_wss_client.py --host "127.0.0.1" --port 10096 --mode 2pass
```

</details>

## 语音/音乐合成和音色转换

### RVC
