#!title:    机器学习
#!date:     2023-03-28

#!content

> 2023-03-28：增加《机器学习》专题。为什么不叫《人工智能》：首先这个专题并不关注“人工”的部分，只关注“机器”的部分；其次我不知道什么是“智能”，很难讨论一个没有良好定义的东西，而“学习”是个相对明确的东西，是一种数据驱动的方法、途径。这个专题不太关注目标ML能干什么，也不关注ML能否到达“智能”（这在其他专题中讨论），主要关注的是方法和技术的中微观细节。

![ ](./image/G4/sd.jpg)

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

受到fwjmath的博客文章《[遗传算法：内存中的进化](https://fwjmath.wordpress.com/2009/03/02/genetic-algorithm-evolution-in-memory/)》启发而制作。

<iframe class="MikumarkIframe" src="./html/genetic-image.html" height="200px"></iframe>

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

![[来源](https://www.youtube.com/watch?v=-9vVhYEXeyQ)](./image/G4/bert-3d.png)

- https://arxiv.org/abs/1706.03762
- https://jalammar.github.io/illustrated-transformer/
- https://nlp.seas.harvard.edu/2018/04/03/attention.html
- https://erdem.pl/2021/05/introduction-to-attention-mechanism

# 应用：人类知觉智能(NLP/CV/多模态)

2023-12-03：前几年，在人工智能领域，有一种学科划分方式，将NLP、知识工程划分为“认知智能”，将计算机视觉、语音、触觉等涉及视听和感觉的，划分为“感知智能”。然而，近几年的研究表明，“认知”和“感知”不应分家，多模态融合才是正确的发展路线。因此本章的标题是“人类智能”，将自然语言处理、机器视觉、语音等学科，统统纳入“人类智能”的范畴，或者称为“知觉智能”。此处再次强调我关于所谓人工智能的观点：**人工智能的使命是理解世界，而不是理解人类。**

## 大规模语言模型

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
