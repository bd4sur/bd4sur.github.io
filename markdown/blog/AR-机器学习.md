#!title:    机器学习
#!date:     2023-03-28

#!content

> 2023-03-28：增加《机器学习》专题。为什么不叫《人工智能》：首先这个专题并不关注“人工”的部分，只关注“机器”的部分；其次我不知道什么是“智能”，很难讨论一个没有良好定义的东西，而“学习”是个相对明确的东西，是一种数据驱动的方法、途径。这个专题不太关注目标ML能干什么，也不关注ML能否到达“智能”（这在其他专题中讨论），主要关注的是方法和技术的中微观细节。

# 优化算法

## 梯度下降

<iframe class="MikumarkIframe" src="./html/sgd.html" height="450px"></iframe>

- 多个同参数高斯函数叠加形成峰谷
- 点击坐标区域，添加极小值
- 点击**选择起点**，可选择迭代起始点
- 再点一次**选择起点**按钮，退出起点选择
- 点击**切换为极大/小值**，可切换极大/小值

更新日志：

- 2018.05.24 初始版本

参考：[梯度下降](https://en.wikipedia.org/wiki/Stochastic_gradient_descent)

## 模拟退火

<iframe class="MikumarkIframe" src="./html/simulated-annealing.html" height="450px"></iframe>

- 多个同参数高斯函数叠加形成峰谷
- 点击坐标区域，添加极小值
- 点击**选择起点**，可选择迭代起始点
- 再点一次**选择起点**按钮，退出起点选择
- 点击**切换为极大/小值**，可切换极大/小值

更新日志：

- 2020-07-16 初始版本

参考：[模拟退火](https://zh.wikipedia.org/wiki/%E6%A8%A1%E6%8B%9F%E9%80%80%E7%81%AB)
参考：[HSV色彩空间](https://zh.wikipedia.org/wiki/HSL%E5%92%8CHSV%E8%89%B2%E5%BD%A9%E7%A9%BA%E9%97%B4)

## 遗传算法

2019.4.29

利用遗传算法求解旅行商问题（TSP）。

<iframe class="MikumarkIframe" src="./html/genetic-tsp.html" height="460px"></iframe>

# 基础机器学习算法

## 分类算法：支持向量机SVM

2018-06-02

<iframe class="MikumarkIframe" src="./html/svm.html" height="500px"></iframe>

: 左下角为原点，右上角坐标(300,300)

+ SVM核心使用第三方实现：[SVMJS](https://cs.stanford.edu/people/karpathy/svmjs/demo/)（[GitHub](https://github.com/karpathy/svmjs/)）
+ 参考资料：[支持向量机：理论、算法与拓展](https://book.douban.com/subject/3927560/)

## 分类算法：多层感知机MLP

2018-05-26

<iframe class="MikumarkIframe" src="./html/perceptron.html" height="450px"></iframe>

若数据集线性不可分，则会陷入无穷迭代。此例二维空间上线性可分的判定，可采用凸包+扫描线算法解决。
左下角(-160,-160)，右上角坐标(160,160)
感知机是简单的线性二分类模型，是神经网络和SVM的基础。这里使用随机梯度下降方法对其进行训练。

## 聚类算法

# 概率图模型

# 神经网络

- [矩阵求导术（上）](https://zhuanlan.zhihu.com/p/24709748)、[矩阵求导术（下）](https://zhuanlan.zhihu.com/p/24863977)
- [Matrix Calculus](https://www.matrixcalculus.org/)

# 人类知觉智能(NLP/CV/多模态)

2023-12-03：前几年，在人工智能领域，有一种学科划分方式，将NLP、知识工程划分为“认知智能”，将计算机视觉、语音、触觉等涉及视听和感觉的，划分为“感知智能”。然而，近几年的研究表明，“认知”和“感知”不应分家，多模态融合才是正确的发展路线。因此本章的标题是“人类智能”，将自然语言处理、机器视觉、语音等学科，统统纳入“人类智能”的范畴，或者称为“知觉智能”。此处再次强调我关于所谓人工智能的观点：**人工智能的使命是理解世界，而不是理解人类。**

## 在普通CPU机器上部署大语言模型

2023-11-28

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

## 在低性能CPU机器上部署FunASR

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

## Transformer

![[来源](https://www.youtube.com/watch?v=-9vVhYEXeyQ)](./image/G4/bert-3d.png)

- https://arxiv.org/abs/1706.03762
- https://jalammar.github.io/illustrated-transformer/
- https://nlp.seas.harvard.edu/2018/04/03/attention.html

# 机器视觉
