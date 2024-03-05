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

> “实现了一个东西，不等于你理解了它。”

### 梯度下降演示（2018-05-24）

<iframe class="MikumarkIframe" src="./html/sgd.html" height="450px"></iframe>

- 多个同参数高斯函数叠加形成峰谷
- 点击坐标区域，添加极小值
- 点击**选择起点**，可选择迭代起始点
- 再点一次**选择起点**按钮，退出起点选择
- 点击**切换为极大/小值**，可切换极大/小值

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
