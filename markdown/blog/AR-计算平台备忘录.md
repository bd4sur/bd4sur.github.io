#!title:    计算平台备忘录

#!content

本文记录个人计算平台（PCCP）的搭建、运维知识。所谓个人计算平台（可以按需翻译成个人P私有P云C计算C平台P），指的是**产权私有的、物理可及的、受到本人完全管控的计算机系统**。在我看来，个人计算平台不等于HomeLab，HomeLab是个更广义的概念。个人计算平台是HomeLab的一部分，而业余电台实际上也属于HomeLab的一部分。

<details>

<summary>HomeLab包括哪些子系统？</summary>

HomeLab有哪些子系统？

- 基地平台：房子，含强电、照明、暖通、上下水、煤气等
- 陆地移动平台：各种车辆
- 个人计算平台：所谓的弱电，计算机和网络
- 业余无线电台：收发信机、天馈系统和辅助设备
- 机电平台：机电工具、仪器仪表、耗材、零件备件
- 生物质平台：种菜、养殖小动物等等

其中，个人计算平台包括以下子系统：

- 计算设备：服务器、桌面计算机、便携电脑、嵌入式计算机、开发板、微控制器、甚至计算器等
- 网络设备：交换机、路由器、调制解调器、光纤收发器、无线AP、网卡、光模块等
- 存储设备：硬盘、光盘、硬盘盒/柜、硬盘复制器、阵列卡、光驱、U盘、存储卡等
- 控制台：KVM、显示器、键盘、鼠标等
- 结构件：机柜、机架、导轨、托盘、线卡等
- 动力设备：UPS、PDU、电源时序器、电瓶、功率计、遥控插座等
- 线缆：铜线、光纤、AOC线、DAC线、USB线、电源线等
- 散热设备：空调、风机、导流板、温控器、散热片等
- 动环监控设备
- 安全防护设备：防雷器等
- 其他辅助设备

</details>

# 系统总体

![组网方案](./image/G2/homelab/homenet.png)



# 计算设备

<details>

<summary>CPU天梯图</summary>

|型号|年代|跑分*|C/T|TDP|主频|工艺|能耗比|
|------------------------------------|
|Ryzen 7 5800H|21Q1|21624|8/16|45W|3.2GHz|7nm|480|
|[Xeon E5-2686 v4](https://www.intel.cn/content/www/cn/zh/support/articles/000090280/processors/intel-xeon-processors.html)|16Q4|21000|18/36|145W|2.3GHz|14nm|144|
|[Xeon E5-2680 v4](https://www.intel.cn/content/www/cn/zh/products/sku/91754/intel-xeon-processor-e52680-v4-35m-cache-2-40-ghz/specifications.html)|16Q1|18000|14/28|120W|2.4GHz|14nm|150|
|i5-8500|18Q2|9543|6/6|65W|3.0GHz|14nm|147|
|i5-8259U|18Q2|8300|4/8|28W|2.3GHz|14nm|296|
|i5-8365U|19Q2|6300|4/8|15W|1.6GHz|14nm|420|
|i5-7300U|17Q1|3700|2/4|15W|2.6GHz|14nm|246|
|Celeron J4125|19Q4|3061|4/4|10W|2.0GHz|14nm|306|
|A10-5700|12|2733|4/4|65W|3.4GHz|32nm|42|
|i5-3320M|12Q2|2650|2/4|35W|2.6GHz|22nm|76|
|i5-3210M|12Q2|2426|2/4|35W|2.5GHz|22nm|69|
|Pentium N3700|15Q1|1313|4/4|6W|1.6GHz|14nm|219|
|Core2 Duo E8500|08Q1|1233|2/2|65W|3.16GHz|45nm|19|
|Pentium M LV|08Q4|199|1/1|12W|1.2GHz|130nm|17|
|Atom N270|08Q2|175|1/2|2.5W|1.6GHz|45nm|70|

注：跑分数据来自[这里](http://cdn.malu.me/cpu/)。鉴于CPU性能度量是个很复杂的问题，这个数据仅供半定量参考。

</details>

<details>

<summary>GPU对比</summary>

|型号|P40|P100|V100|A100|H100|
|----------------------------|
|芯片|GP102|GP100|GV100|GA100|GH100|
|架构|Pascal|Pascal|Volta|Ampere|Hopper|
|年代|2016.9|2016.6|2017.6|2020.6|2023.3|
|TDP|250W|250W|300W|300W|350W|
|显存|24GB|16GB|16GB|80GB|80GB|
|显存类型|GDDR5|HBM2|HBM2|HBM2e|HBM2e|
|显存位宽(bits)|GDDR5|4096|4096|5120|5120|
|显存带宽(GB/s)|347|732|897|1935|2039|
|接口|PCIe Gen3|PCIe Gen3|PCIe Gen3|PCIe Gen4|PCIe Gen5|
|  CUDA Cores|3840|3584|5120|?|?|
|Tensor Cores|N/A|N/A|640|432|456|
|       BF16(TFLOPS)| N/A | N/A |  ?  |312  |1513 |
|       TF32(TFLOPS)| N/A | N/A |  ?  |156  |756  |
|       FP16(TFLOPS)|0.2  |18.7 |28   |  -  |  -  |
|       FP32(TFLOPS)|11.8 |9.3  |14   |19.5 |51   |
|       FP64(TFLOPS)|0.4  |4.7  |7    |9.7  |26   |
|FP64 Tensor(TFLOPS)| N/A | N/A |  ?  |19.5 |51   |
|FP16 Tensor(TFLOPS)| N/A | N/A | 112 |312  |1513 |
|Int8 Tensor(TOPS)  | N/A | N/A |  ?  |624  |3026 |
|[Compute Capability](https://developer.nvidia.com/cuda-gpus)|6.1|6.0|7.0|8.0|9.0|

</details>

P40支持ECC，如果开启ECC，则可用显存为22.5GiB，并且运算性能会有6%左右的下降（基于[gpu-burn](https://github.com/wilicc/gpu-burn)）

`./gpu_burn 60` FP32性能

- P40 24GB 关ECC：约 9010 Gflop/s，稳定温度78℃
- P40 22.5GB 开ECC：约 8650 Gflop/s，稳定温度81℃


## Nvidia Jetson

![在 Orin NX 16GB 上运行 Stable Diffusion WebUI](./image/G2/homelab/jetson-orin-nx-sd.jpg)

**通用情报**

- [NV官网主站-Jetson介绍页](https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/)
- [NV开发者-Jetson支持资源汇总](https://developer.nvidia.com/embedded/community/support-resources)
- [NV开发者-Jetson入门](https://developer.nvidia.com/embedded/learn/getting-started-jetson)
- [NV开发者-Jetson模块信息汇总](https://developer.nvidia.com/embedded/jetson-modules)
- [NV开发者-Jetson路线图](https://developer.nvidia.com/embedded/develop/roadmap)
- [GA10B芯片规格](https://www.techpowerup.com/gpu-specs/jetson-orin-nx-16-gb.c4086)

|                      |AGX Orin 64GB                    |Orin NX 16GB                 |Orin NX 8GB                      |Orin Nano 8GB                    |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Architecture          |2048-core Ampere 64 Tensor Cores |1024-core Ampere 32 Tensor Cores |1024-core Ampere 32 Tensor Cores |1024-core Ampere 32 Tensor Cores |
|GPU Max Frequency     |1300MHz                          |918MHz                           |765MHz                           |625MHz                           |
|Overall (Sparse INT8) |275TOPS                          |100TOPS                          |70TOPS                           |40TOPS                           |
|GPU Tensor Core INT8  |Sparse 170TOPS<br>Dense 85TOPS   |Sparse 60TOPS<br>Dense 30TOPS    |Sparse 50TOPS<br>Dense 25TOPS    |Sparse 40TOPS<br>Dense 20TOPS    |
|GPU Tensor Core FP16  |Sparse 85TFLOPS<br>Dense 43TFLOPS|Sparse 30TFLOPS<br>Dense 15TFLOPS|Sparse 25TFLOPS<br>Dense 13TFLOPS|Sparse 20TFLOPS<br>Dense 10TFLOPS|
|GPU CUDA Core FP16/32 |FP32 5.3TFLOPS<br>FP16 10.6TFLOPS|FP32 1.9TFLOPS<br>FP16 3.8TFLOPS |FP32 1.6TFLOPS<br>FP16 3.1TFLOPS |FP32 1.3TFLOPS<br>FP16 2.6TFLOPS |
|CPU                   |12c Cortex-A78AE / L2=3MB/L3=6MB |8c Cortex-A78AE /L2=2MB/L3=4MB   |6c Cortex-A78AE /L2=1.5MB/L3=4MB |6c Cortex-A78AE /L2=1.5MB/L3=4MB |

![AGX Orin 64GB vs Orin NX 16GB ([Source](https://www.youtube.com/watch?v=VWdJ4BCtam))](./image/G2/homelab/jetson-agx-vs-nx.jpg)

![Jetson AGX Orin HW diagram ([Source:gtc24-se62675](https://www.nvidia.com/en-us/on-demand/session/gtc24-se62675/))](./image/G2/homelab/jetson-agx-orin-hw-diagram.jpg)

![JetPack SW Arch ([Source:gtc24-se62940](https://www.nvidia.com/en-us/on-demand/session/gtc24-se62940/))](./image/G2/homelab/jetpack-sw-arch.png)

**Orin NX 16GB**

- [亚博智能的介绍](https://www.yahboom.com/tbdetails?id=550)
- [亚博智能的技术资料](https://www.yahboom.com/study/Jetson-Orin-NX)（仅限客户）
- [微雪的说明](https://www.waveshare.net/wiki/JETSON-ORIN-NX-16G-DEV-KIT)

**AGX Orin 64GB**

**系统备份和恢复**

按照[官方文档](https://docs.nvidia.com/jetson/archives/r35.3.1/DeveloperGuide/text/SD/FlashingSupport.html#to-back-up-and-restore-a-jetson-device)操作，困难重重。无奈之下，只好动用钞能力，购买NVMe硬盘复制机，直接复制装好系统的NVMe硬盘。但是需要注意的是，仅复制硬盘，并不等于完全克隆开发板，因QSPI的内容仍然需要通过官方的烧录工具备份和恢复。

拷贝出来的NVMe硬盘，需要修复GPT表，并对其扩容。方法如下：

```
sudo parted /dev/nvme0n1
# 输入 print，可能会提示修复分区表，输入“Fix”修复。
# 修复完成后，机器可能会重新引导，所需时间略长。
# 重启后，再次进入parted
sudo parted /dev/nvme0n1
# 然后输入 print，查看硬盘总容量（以GB为单位）
# 然后输入 resizepart <APP分区的编号>，结束位置填写xxxGB，也就是硬盘的总容量
# 扩容后，执行以下命令，为文件系统扩容
sudo resize2fs /dev/nvme0n1p1
```

**镜像方式部署StableDiffusion**

[Tutorial - Stable Diffusion](https://www.jetson-ai-lab.com/tutorial_stable-diffusion.html)

```
# 条件：JetPack 6 (L4T r36.x)

# 安装镜像启动工具，该工具实质上是一系列启动脚本，以及各种镜像的Dockerfiles和启动参数
git clone https://github.com/dusty-nv/jetson-containers
bash jetson-containers/install.sh

# 执行启动命令
docker run --runtime nvidia -it --rm --network host\
  --volume /tmp/argus_socket:/tmp/argus_socket\
  --volume /etc/enctune.conf:/etc/enctune.conf\
  --volume /etc/nv_tegra_release:/etc/nv_tegra_release\
  --volume /tmp/nv_jetson_model:/tmp/nv_jetson_model\
  --volume /var/run/dbus:/var/run/dbus\
  --volume /var/run/avahi-daemon/socket:/var/run/avahi-daemon/socket\
  --volume /var/run/docker.sock:/var/run/docker.sock\
  --volume /home/bd4sur/ai/jetson-containers/data:/data\
  --volume /home/bd4sur/ai/_model/stable-diffusion:/data/models/stable-diffusion\
  --device /dev/snd\
  --device /dev/bus/usb\
  -e DISPLAY=:0\
  -v /tmp/.X11-unix/:/tmp/.X11-unix\
  -v /tmp/.docker.xauth:/tmp/.docker.xauth\
  -e XAUTHORITY=/tmp/.docker.xauth\
  --device /dev/i2c-0 --device /dev/i2c-1 --device /dev/i2c-2 --device /dev/i2c-4 --device /dev/i2c-5 --device /dev/i2c-7 --device /dev/i2c-9\
  -v /run/jtop.sock:/run/jtop.sock\
  -e HTTP_PROXY=http://192.168.10.90:1080/ -e HTTPS_PROXY=http://192.168.10.90:1080/ -e 'NO_PROXY=192.168.*.*, localhost, 127.0.0.1, ::1'\
  dustynv/stable-diffusion-webui:r36.2.0

# 这个启动命令实际上就是：
jetson-containers run -e "HTTP_PROXY=http://192.168.10.90:1080/" -e "HTTPS_PROXY=http://192.168.10.90:1080/" -e "NO_PROXY=192.168.*.*, localhost, 127.0.0.1, ::1" $(autotag stable-diffusion-webui)

# 注意，在`run.sh`中有挂载关系 --volume $ROOT/data:/data ，其中ROOT="$(dirname "$(readlink -f "$0")")"
# 因此SD模型可以放在 /home/bd4sur/ai/jetson-containers/data/models/stable-diffusion/models/Stable-diffusion
# 但是出于方便迁移考虑，所有模型统一放置在/home/bd4sur/ai/_model/下，所以需要另外挂载
```

**刷JetPack6并安装PyTorch**

刷JetPack：按照[官方文档](https://developer.nvidia.com/embedded/jetpack)指示操作。

安装PyTorch：两个选项

- 2.3.0：使用[官方论坛](https://forums.developer.nvidia.com/t/pytorch-for-jetson/72048)提供的wheel。同时提供了torchvision和torchaudio。这一版本使用nanogpt实测更快。
- 2.4.0：按照[官方文档](https://docs.nvidia.com/deeplearning/frameworks/install-pytorch-jetson-platform/index.html)安装PyTorch。注意，实测验证，Orin NX 16GB 仅可安装[`torch-2.4.0a0+07cecf4168.nv24.05.14710581-cp310-cp310-linux_aarch64.whl`](https://developer.download.nvidia.com/compute/redist/jp/v60/pytorch/torch-2.4.0a0+07cecf4168.nv24.05.14710581-cp310-cp310-linux_aarch64.whl)

**编译安装llama.cpp和llama-cpp-python**

[单独编译llama.cpp，然后复用已有的`libllama.so`安装llama-cpp-python](https://github.com/abetlen/llama-cpp-python/issues/1070)：

```
cd /home/bd4sur/ai
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

mkdir build
cd build
cmake .. -DBUILD_SHARED_LIBS=ON -DGGML_CUDA=ON
cmake --build . --config Release

export LLAMA_CPP_LIB=/home/bd4sur/ai/llama.cpp/build/src/libllama.so
cp /home/bd4sur/ai/llama.cpp/build/src/libllama.so /home/bd4sur/miniconda3/envs/mio/lib/python3.10/site-packages/llama_cpp/lib
CMAKE_ARGS="-DLLAMA_BUILD=OFF" python -m pip install llama-cpp-python
```


## 通算/智算服务器

||1号机(通用计算)|2号机(智能计算)|
|------------|
|机器型号|戴尔 PowerEdge R730|超微 7048GR-TR / 浪潮 NF5568M4|
|集群内IP|192.168.10.61|192.168.10.81|
|OS|Ubuntu 20.04.6 LTS|Ubuntu 20.04.6 LTS|
|CPU|双路 Xeon E5-2680 v4|双路 Xeon E5-2686 v4|
|内存|64GB (4×16GB RDIMM 2133)|128GB (2×64GB LRDIMM 2133)|
|存储|H730 Mini 8盘位3.5寸|NVMe SSD|
|GPU 0|Tesla P100 PCIe 16GB|Tesla P40 24GB|
|GPU 1|Tesla P100 PCIe 16GB|Tesla P40 24GB|
|GPU 2|-|Tesla P40 24GB|
|GPU 3|-|Tesla P40 24GB|

2号机各GPU的连接拓扑：

```
        GPU0    GPU1    GPU2    GPU3    CPU Affinity    NUMA Affinity   GPU NUMA ID
GPU0     X      PHB     SYS     SYS     0-13,28-41      0               N/A
GPU1    PHB      X      SYS     SYS     0-13,28-41      0               N/A
GPU2    SYS     SYS      X      PHB     14-27,42-55     1               N/A
GPU3    SYS     SYS     PHB      X      14-27,42-55     1               N/A

Legend:

  X    = Self
  SYS  = Connection traversing PCIe as well as the SMP interconnect between NUMA nodes (e.g., QPI/UPI)
  NODE = Connection traversing PCIe as well as the interconnect between PCIe Host Bridges within a NUMA node
  PHB  = Connection traversing PCIe as well as a PCIe Host Bridge (typically the CPU)
  PXB  = Connection traversing multiple PCIe bridges (without traversing the PCIe Host Bridge)
  PIX  = Connection traversing at most a single PCIe bridge
  NV#  = Connection traversing a bonded set of # NVLinks
```

![ ](./image/G2/homelab/dell-poweredge-r730.jpg)

注意显卡电源线插拔次数不要超过30次，否则容易因接触不良而增加起火风险。

### 家用炼丹炉选型心得（2024-03-12）

![超微7048GR-TR / 浪潮NF5568M4](./image/G2/homelab/7048gr-p40.jpg)

超微四卡工作站和八卡机架服务器大概是现在大模型爱好者最喜欢的硬件平台，性价比高，扩展性比较好。图中这套超微7048GR-TR四卡炼丹炉，实际上是浪潮NF5568M4塔式服务器，基于超微X10DRG-Q主板（C612芯片组），整机不到八千块钱，拥有96GB显存和128GB内存，可以装得下市面上大多数开源LLM。

但是由于Pascal架构实在太老，加上没有nvlink卡间高速互联，体验不佳。Qwen1.5-72B-Chat的q4_k_m量化的GGUF模型，使用Llama.cpp在GPU上推理，最大可以设置16k上下文长度，生成速度可以达到每秒约5个token，能用，但不够好用。不过，14B及以下的模型，体验还是相当好的，上下文长度可以拉满，生成速度也令人满意。

Stable Diffusion Web-UI 至今不支持多卡，因此在孱弱的P40卡上画图的体验就不太好了，512×512常规尺寸的图，出一张大概要50秒左右。至于大显存有没有什么好处，其实好处并不大，因为文生图的图片尺寸本来就不宜过大，业界推荐的最佳实践是先生成小图，再超分重建成大图。不过，使用中发现，大内存比大显存更重要，足够大的内存可以显著提升ckpt模型加载和切换的速度。因此，对于画图应用，建议优先考虑单卡性能，2080ti就是很好的选择。

但是抛开钞票谈性能就是耍流氓。八千块钱能买到什么显卡呢？以当前二手市场价格看，2080ti魔改22GB版本可以买3块，V100(16GB/PCIe)可以买两块半，都很难装下72B规模的大模型。从解决本地超大规模LLM推理“能用”问题的角度看，四卡P40应该是性价比比较高的解决方案。

我觉得价格比任何跑分都能更准确地反映硬件性能。大显存的计算卡，同等算力下，比小显存要贵出很多。价格提供了一个重要信息，即显存实际上是比算力更稀缺的。大语言模型恰恰是吃显存的，因此P40这样的便宜大碗的卡很受欢迎，P100的价格不涨反降。对于私有场景来说，这推理多快才是快啊，我寻思比我阅读速度快一点，就足够了。

在技术上，一方面是存算融合，现在所谓的存内计算是一个研究热点。理论层面有突破冯诺依曼架构的诉求，工程层面发展出忆阻器、片上光网络、chiplet等技术，为微观节点的极致效率提供保证。而另一方面则是存算分离，像DPU、RDMA等技术，则为构建宏观巨型计算集群提供支撑。大模型的价值不仅仅在于它的应用，更在于它为很多基础科学和技术提供了一个巨大的标靶。而价值会以价格的方式体现出来，价格实际上是熵的一种度量。经济活动的一种本质，就是复杂性在市场主体之间的交换。大模型在各种层面上都会加速这个交换过程。

话说回来，P40虽然便宜大碗，但是Pascal架构没有张量核心，很多新特性都不支持，例如混合精度、FlashAttention等等，训练效率极其低。而V100是Tesla系列中第一款具备张量核心的计算卡，预计在未来若干年内的价格仍然会比较坚挺。近期有一些廉价的SXM2接口的V100流入二手市场，看似很香，实际上如果考虑到平台的成本，就没那么香了。不过未来似乎也未必不能考虑。毕竟，Ampere、Ada Lovelace和Hopper对于个人玩家来说实在是太过于奢侈了，买不如租。

我向来推崇用钱购买时间，但是为什么在训练问题上又舍得浪费时间了呢？因为训练不耽误我打工，多花点时间也没什么。不过更深层次的原因是，我现在也没什么好训的，主要是缺乏（整理语料的）时间…我现在的观点是，**通过提示工程挖掘超大规模语言模型的潜在能力，比（不得法的）训练和微调（甚至可能破坏模型原有能力）更有实用意义。我对RAG和Agent的兴趣大于训练微调。**话虽这么说，我还是愿意基于nanogpt做一些实验性质的训练，做一些赛博复读机（比如拉康黑话生成器、齐泽克笑话机器人等），探索所谓的“大模型训练动力学”，例如 scaling law 的直观验证、各种分布式训练加速策略的实践、甚至魔改模型结构等等。

在家炼丹，还有一个极其重要的问题是安全。炼丹炉满载运行时，功率可能高达将近两千瓦，最近天气不太冷，明显可以感觉到机房温度有所升高。因此一定要重视安全问题，包括用电安全、消防安全等。

另外刚才发现，P40从过年时的800出头涨到850，现在（2024年3月中旬）又涨到950块左右了…真就理财产品了是吧…

最后要说的是，不能对大模型有过高的期待，不能指望一个封闭的大模型能端到端地解决问题，还是要把它当成一个agent用，借助它去撬动（leverage）更大规模的信源。不论如何，这个不到1立方米的机柜内部，浓缩了极为致密的信息，其复杂度远远超过它旁边那个装了200本书的书架。而代价就是满载情况下可能要消耗高达2千瓦以上的功率。如果我找一个大学生，把他塞进机柜，不考虑人道主义的话，能耗比应该是远远超过电子计算机的。堪用的本地私有LLM系统的门槛大约是七千元，也就是现在的四卡P40工作站的价格。但是这里面有更昂贵的隐形成本，例如摆放这六千元设备的空间，以及学习折腾所消耗的大量时间，以及系统运行时耗费的电力，等等。这些成本是不可消除的，并且硬件成本越高，这些隐形成本反而越高。不要低估“智能”的代价。

## NAS服务器：i5-8500 PC

<details>

<summary>2019年8月装机笔记（2019-07-10起草）</summary>

CPU选择英特尔8代i5-8500。8500据说是性价比较高的一款U，适合绝大多数用户。6核6线程，带集成显卡，LGA1151插座，芯片组支持B360等。主板选择技嘉的B360M D3H，内存频率最高支持到2666，只有一个M.2/NVMe接口。内存选择金士顿的高端子品牌HyperX的Fury 8G×2内存条套装，组成双通道。由于主板最高支持2666，所以这里选择的是2666频率的。

SSD经过调研，中端SSD以英特尔760p、三星970evo和浦科特M9PeG最为流行。其中三星和英特尔分别采用自家颗粒，浦科特好像是采用东芝的颗粒。SSD的闪存颗粒有SLC、MLC、TLC和QLC等技术，简单来说就是指一个浮栅晶体管可以存储1、2、3、4个bit。三款SSD均采用TLC颗粒，存储密度比前代的SLC和MLC要高很多，但是寿命上（体现为P/E循环次数）就打了折扣。目前消费者产品中基本上没有SLC了，TLC已经成为主流，QLC也已经开始铺开。英特尔660p即采用QLC颗粒，容量512GB起步，价格仅450左右，单位容量价格已经不足1元/GB。QLC可以大幅提高单颗粒存储容量，但寿命大大降低，据说单元P/E循环仅有100次左右，不过现在通过多层堆叠（即3D NAND）等技术已经可以提高到1000次以上了。这三款均支持NVMe协议。NVMe协议是英特尔提出的新传输协议，理论速度可以达到32Gbps。M.2接口是一种接口物理规格，支持PCIe和SATA两类协议。

前段时间曾经针对HDD做了不少的功课，由于旧机器上已经有两块容量分别是1TB和2TB的硬盘，所以就直接利旧了。1TB的那块是希捷酷鱼系列，7200rpm，64MB缓存，从这个参数看，很有可能是PMR技术的盘。而2TB的那块是西数蓝盘，5400rpm，缓存高达256MB，采用SMR技术。SMR存在写放大效应，需要像SSD一样准备较大的缓存，甚至还有垃圾回收机制在里面，因而性能相对差一点。

电源选用酷冷至尊的MASTERWATT LITE 500电源，这款电源采用全模组设计，转换效率为80%，通过80plus白盘认证。功率500W可以满足轻度游戏需要。

**装机操作**

- 操作之前先洗手，释放静电，避免ESD损坏硬件，最好是戴手套或者防静电手环。
- 确认主板是否遮挡机箱的背部走线孔，如果不遮挡的话，那么可以将电源线、SATA线等线材从机箱的背板后面绕过去，作背部走线。
- 如果散热器有支架的话，先将支架安装到主板上。
- 将电源安装到机箱上，梳理好走线，然后放倒机箱，开始安装主板。先安装主板螺丝孔上对应的铜柱，然后将主板接口挡板装在机箱背部。注意，接口挡板很锋利，不要划破手。随后，将主板接口对准挡板的对应孔位，将主板放入机箱，并使螺丝孔和铜柱对齐，安装螺丝。要注意接口挡板上的弹性触片与接口部件的金属屏蔽良好接触，并且安装时不要太用力，避免主板弯曲。
- 主板安装好之后，开始安装CPU。注意，装好CPU之后才可以去掉CPU插座上的挡板，避免安装过程中碰坏弹片。CPU装好之后，在CPU顶盖上均匀涂抹少量硅脂，然后安装散热器。
- 安装内存和SSD，需要注意的是，两条内存组成双通道，应该按照主板的说明去接，例如这款主板是接在1、2或3、4槽位上才可以组成双通道，其他组合无法组成双通道。
- 随后在机箱上安装HDD等大件设备，安装的原则是尽可能留有较大空隙，以便于散热。
- 下一步是接线。ATX电源和CPU电源都是防呆的，插进去就可以了，注意不要太用力压主板。SATA接线尽可能从编号小的开始接。前面板的USB和音频接线也是防呆的，直接安装就好。电源按钮、指示灯和蜂鸣器（如果有）按照主板上的标记接，注意分清正负极。NC是没有连接的意思。
- 机箱风扇的气流方向，我觉得应该是向外吹，也就是冷空气从四面八方流入机箱，热空气被风扇排出。

</details>

## 主力桌面：NUC8i5BEH

- 出品时间：2018Q3
- 处理器：Core i5-8259U
- 显卡：Intel Iris Plus 655 核显
- 内存：SO-DIMM DDR4 2400 8GB×2=16GB 双通道
- 硬盘：Intel SSD 760P 512GB；WD HDD 1TB
- 电源：90W 19V 外置电源
- 有线网：Intel i219-v 千兆以太网 RJ45
- 无线网：Intel Wireless AC 9500 板载
- USB/雷电：USB3.1第二代×4；USB2.0板载×2；雷电3×1
- 视频接口：HDMI 2.0a；雷电3（DP1.2）
- 音频接口：3.5mm；内置话筒阵列
- 内部扩展：SATA；M.2 PCIe
- 其他接口：前置红外接收；MicroSD插槽
- 外形尺寸：11.7×11.2×5.1
- 机械接口：VESA支架接口

## 便携电脑：松下中古笔记本

|参数|CF-SV8|CF-SZ6|CF-SX2|
|------------------|
|CPU|Core i5-8365U|Core i5-7300U|Core i5-3320M|
|RAM|DDR4 16GB 板载|DDR3L 8GB 板载|DDR3L×2 插槽|
|硬盘|M.2 NVMe|M.2 SATA|SATA2|
|屏幕|1920×1200|1920×1200|1920×1080 TN|
|电源|16V输入|16V输入|16V输入|
|网络|4G LTE WWAN|Wi-Fi WLAN|Wi-Fi WLAN|
|购置时间|2023年11月|2023年5月|2023年5月|

![CF-SX2 内部](./image/G2/homelab/cf-sx2-inside.jpg)

![CF-SZ6 内部](./image/G2/homelab/cf-sz6-inside.jpg)

![CF-SZ6 实际使用场景](./image/G2/homelab/cf-sz6-seu.jpg)

优势特点：①轻盈。不到一公斤的重量，“轻若无物”，在任何场景下都不会带来很多负担。②小巧。虽然厚，但是12英寸的尺寸很好地兼顾了节约空间和操作上的舒适性，在户外架设电台等场景下，不会占用过多的桌面空间。③坚固。机器主体结构采用铝镁合金打造，宣称可以抵抗一般的跌落和挤压，这对于通勤携行、户外操作来说无疑是相当重要的。因此，很多汽修、机械、建筑工程等行业用户选择松下的笔记本。除了Let's Note系列之外，还有一个主打坚固耐操的系列“TOUGHBOOK”。④性能和续航的平衡。由于购买的是洋垃圾，在续航上并未有什么优势。

- 家居自动化控制台。虽然自己搭建家具自动化解决方案并非不可能，但是这显然不经济。在这种情况下，所谓的家居自动化控制台，更像是那种智能镜子，起到信息呈现和简单交互的功能，例如日历、天气预报、便利贴、闹钟、网管面板之类的。在家中设置这样一个不间断运行的控制台，带来的更多是操纵感和交互感，让人感觉到整个环境是充盈着信息的、是可以控制和互动的。至于真正的“智能家居”的部分，还是交给成熟的专用产品比较好。
- 半固定的电台计算机：可以连接SDR接收机，当作简单的频谱显示器；还可以连接到电台，进行FT8等数字模式操作。由于机器很轻，可以挂在墙上，也可以、

<details>

<summary>2023-05-25</summary>

说到日式小笔记本，学生时代曾经买到一个富士通的10寸小笔记本，FMV-P8215T，不到200块钱，无风扇被动散热，Pentium.M处理器，性能非常孱弱却发热巨大。搭载了一块电阻触屏，用处并不是很大。当年在这个笔记本上完成了一些课程设计作业，很奇妙的工作体验。怎么讲呢，这款笔记本也是典型的社畜本，小巧是真小巧，性能也是真乐色。在续航上下了功夫的，虽然小，但是有光驱位的。光驱可以拔下来，换成备用电池，这个设计还是很值得赞赏的。总而言之，日式社畜本的设计风格很对我电波，不过仅限于捡洋垃圾。我是不会花冤枉钱的233

松下笔记本的定位是生产资料，而不是生活资料。生产资料，顾名思义，是用来生产的。生产是与消费相对的。您有生产能力吗？如果有，那么松下的笔记本实在是再合适不过了。一般来说，高生产力人士的消费能力也不低，因此这个定价是非常合理的。尤其是法人向产品，与其可能创造的潜在价值相比，上万元人民币的售价实在不值一提。那么什么是“生产”呢？文字工作固然是一种生产，音视频也是一种生产。松下笔记本由于性能相对孱弱，并不适合音视频类生产。而我们所说的生产，更广泛的含义是物质世界的生产，例如矿山、工厂、车间、机房、耕地、工地。在这些场景下维持生产力，普通的消费级产品，也就是那些定位为生活资料的电脑，是难以胜任的。最近在小地瓜上看到不少西域沙漠单车骑行的视频，那些up主在路上也要剪视频。那么这种应用场景下，Let's Note 系列甚至TOUGHBOOK系列无疑是非常合适的，甚至可能是唯一合适的选择（轻且耐操），而这两个系列也确实有内置WWAN（如4G LTE）模块的机型。我一开始买的就是带LTE模块的机型。

另外，故乡家里有一台松下的微波炉，跟我年龄差不多，至今正常服役，功能性胜于如今市面上任何微波炉。印象最深的就是它的说明书，全彩印刷，十分用心，附有不少带彩色照片的食谱，是我的识字读物之一，我从小看到大。

为什么我一定要笔记本电脑带光驱呢，因为我从小就对光驱这种光机电一体化的东西十分感兴趣……我算不上什么发烧友，只是喜欢收集音乐CD盘而已，有廉价的中古盘，也有正版计销量的专辑。大学时代曾经把家里退役的90年代的VCD机拆成模块，带到学校，装进纸盒里，作为台式CD机。由于原机有机械式换碟机构，去掉换碟机构后机器无法正常工作，当时还用74芯片搭建了简单的逻辑电路，模拟机械换碟机构的工作时序。

松下的笔记本，无论多小多紧凑，都能塞进一个光驱进去。机电一体化的东西，在我看来简直是艺术品，这种XP在他人看来可能很难理解。又回到那个我吐槽了无数遍的事情了：中国没有发展出成熟的唱片产业，在我看来是十分遗憾的一件事情。现在发售的数字专辑似乎有U盘介质的了，我的评价是：好，但不如CD好。无论如何，实体介质对于我们维护精神生活的安全和自主而言，我认为是极其重要的。CD是一种把技术美学和艺术美学完美融合在一起的奇妙玩意儿，我希望它一直存在下去。

多说几句吧。我们似乎很喜欢用“不思进取”去指责别人，调研松下笔记本的时候就看到很多“不思进取”的评价。归根结底，在于“进取”的标准和方向有分歧。消费级产品百花齐放，努力内卷儿，竭尽所能讨好用户，这是进取。二十年固守同一个模具，但是坚守核心特色，新瓶装旧酒，本色不改，小步慢跑推陈出新，也不能说不是进取。毕竟，在一个不努力就会被无情淘汰的世界里，能保持安稳镇定已经是非常了不起的成就了。不过，未来不好说。

最近讲得比较多的“高质量增长”，也就是所谓的“量的合理增长，质的稳步提升”，我觉得每个人都应该好好思考下，这两句话的深层含义。这涉及价值观、业绩观、发展观的底层变革，是非常重要的方向性问题，值得深思。

</details>

## 开发板

### ESP32 (2023)

开发板：ESP32-DevKitC V4（[官方指南](https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32/hw-reference/esp32/get-started-devkitc.html#get-started-esp32-devkitc-board-front)），模块：ESP32-WROVER-IE（[官方指南](https://docs.espressif.com/projects/esp-idf/zh_CN/v3.3.1/get-started/index.html)）

![ ](./image/G3/mcu/esp32-devkitC-v4-pinout.png)

### NodeMCU/ESP8266 (2017-02-11)

![NodeMCU端口与ESP12的连接关系](./image/G3/mcu/NodeMCU-ports.png)

![NodeMCU原理图](./image/G3/mcu/NodeMCU-schematic.png)

|NodeMCU编号|ESP模块编号|Arduino编号|备注|
|------|
|D0|GPIO16|16|下拉使能板载LED|
|D1|GPIO5|5||
|D2|GPIO4|4||
|D3|GPIO0|0|带3V3上拉|
|D4|GPIO2|2|带3V3上拉|

只有D3、D4可以方便地设置为I2C总线，因其带有上拉电阻。尽管其他端口均可通过软件设置为I2C总线，但是需要外部上拉。Arduino中，调用`begin(SDA=0, SCL=2)`设置I2C总线，即，默认D3接器件的SDA，D4接器件的SCL。

### 树莓派 (2017-02-13)

![ ](./image/G3/mcu/Raspberry-Pi-4.jpg)

![[来源](https://www.raspberrypi-spy.co.uk/2012/06/simple-guide-to-the-rpi-gpio-header-and-pins)](./image/G3/mcu/Raspberry-Pi-GPIO.jpg)

如何控制（[参考](http://codefoster.com/pi-basicgpio/)）：

```
echo 端口号 > /sys/class/gpio/export
echo out > /sys/class/gpio/gpio端口号/direction
echo 0/1 > /sys/class/gpio端口号/gpio4/value
```

```
# 串口工具
sudo apt-get install minicom
# 修改开机启动信息
/etc/motd
```

### Edison开发板 (2017-03-11)

<details>

<summary>环境搭建</summary>

**安装驱动并更新固件**：连接usb client（拨动开关下面的那个）至电脑，SSH登录Edison，ip地址一般是192.168.2.15。也可以利用无线网登录。然后，利用wpa_cli连接wlan，步骤如下[1]：

```
 > add_network（返回X）
 > set_network X ssid "<你的AP的SSID>"
 > set_network X psk "<你的AP的密码>"
 > enable_network X
 > save_config
 > quit
```

添加软件仓库：修改`cat /etc/opkg/base-feeds.conf`为

```
src/gz all http://repo.opkg.net/edison/repo/all
src/gz edison http://repo.opkg.net/edison/repo/edison
src/gz core2-32 http://repo.opkg.net/edison/repo/core2-32
```

**串口设置**

> 本节参考
[https://communities.intel.com/thread/57321]()
[http://www.arduino.cn/thread-12344-1-1.html]()
[https://communities.intel.com/thread/54236]()

使用Arduino扩展板的话，串口（Arduino 0、1）对应的设备文件是`/dev/ttyMFD1`，但是直接使用是不行的。执行下列命令：

```
echo 214 > /sys/class/gpio/export 2>&1
echo high > /sys/class/gpio/gpio214/direction
echo low > /sys/class/gpio/gpio214/direction
echo 131 > /sys/class/gpio/export 2>&1
echo mode1 > /sys/kernel/debug/gpio_debug/gpio131/current_pinmux
echo 249 > /sys/class/gpio/export 2>&1
echo high > /sys/class/gpio/gpio249/direction
echo 1 > /sys/class/gpio/gpio249/value
echo 217 > /sys/class/gpio/export 2>&1
echo high > /sys/class/gpio/gpio217/direction
echo 1 > /sys/class/gpio/gpio217/value
echo out > /sys/class/gpio/gpio131/direction
echo 0 > /sys/class/gpio/gpio131/value
echo 130 > /sys/class/gpio/export 2>&1
echo mode1 > /sys/kernel/debug/gpio_debug/gpio130/current_pinmux
echo 248 > /sys/class/gpio/export 2>&1
echo low > /sys/class/gpio/gpio248/direction
echo 0 > /sys/class/gpio/gpio248/value
echo 216 > /sys/class/gpio/export 2>&1
echo in > /sys/class/gpio/gpio216/direction
echo in > /sys/class/gpio/gpio130/direction
echo high > /sys/class/gpio/gpio214/direction
```

控制安信可A6模块，通过串口向其发送AT指令。注意，系列指令的每条指令之间最好有1秒的延时。另外，使用A6模块时，由于A6模块耗电量较大，必须用交流电源适配器对Edison板子供电。

```:C
...
char CMGF[12] = "AT+CMGF=0\r\n";
char CMGS[13] = "AT+CMGS=<编码器计算出的短信长度>\r\n";
char text[74] = "<经PDU编码的短信内容>\x1a";
int cntr = 1;
while(cntr > 0) {
    write(fd, CMGF, strlen(CMGF));
    sleep(2);
      read(fd, buff, 64);printf("[sms]%s\n", buff);
    write(fd, CMGS, strlen(CMGS));
    sleep(2);
      read(fd, buff, 64);printf("[sms]%s\n", buff);
    write(fd, text, strlen(text));
    sleep(2);
      read(fd, buff, 64);printf("[sms]%s\n", buff);
    cntr--;
}
...
```

**关于扩展板的I2C**：使用Arduino扩展底板时，其上引出的I2C对应于`/dev/i2c-6`设备文件。

</details>

### Galileo开发板 (2017年6月~10月)

<details>

<summary>展开</summary>

**引言**

去年（2016年）暑假，偶然发现Intel在2013年推出的Galileo开发板（一代）。因为颜值很高，所以就入手了两块，一块用来把玩，另一块用来收藏。

Intel与Arduino合作推出Galileo的初衷是推销自家的Quark SoC，希望在物联网市场上有所作为。为了帮助开发者快速将原型转化为产品，Intel开源了电路图、BOM、PCB设计、Datasheet等文档。Quark X1000 SoC是Intel研制的一款低功耗x86架构的SoC，Galileo也成为市面上为数不多的一款基于x86的开发板。实际上，包括Galileo在内的一众Intel开发板一直备受吐槽，吐槽的点不外乎价格贵、性能弱、功耗高、资料少等方面，每一个方面对于开发板而言貌似都是比较致命的劣势。与市场上久经考验的基于ARM的各种派相比，Intel开发板的生态很差，定位不明且两极分化；再者，尽管x86非常好用，但吓人的功耗天然地绝缘了x86与IoT领域。根据Intel官网提供的数据，Galileo的功率为2.2~2.5W，并不是很令人满意，后续推出的Edison在性能和功耗方面则找到了很好的平衡。并且，X1000作为第一版Quark，存在一个比较严重的Bug：含有LOCK前缀的原子指令不可用。这个Bug严重影响原生多线程的实现，因此诸如Debian的一般的Linux发行版无法正常在Galileo上运行。为规避此问题，Intel在工具链中增加了一个代码生成选项，该选项可以生成不含LOCK指令的代码，官方提供的Yocto就是使用这个工具链编译生成的，因此可以在Galileo上正常运行。

Galileo（一代）是Intel进军IoT开发板市场的首款产品，设计上有诸多硬伤，并且定位相当不清晰，属于试验性产品。后续推出的二代板大幅提升了I/O性能，但基本上是换汤不换药的水平。在市场上有众多物美价廉的开发板可供选择的当下，Galileo已经可以列入“不推荐”名单了。

![图1 Galileo Gen1 正面SoC特写](./image/G3/mcu/galileo-soc.jpg)

**资源与接口**

Galileo板子非常漂亮，尺寸比Arduino和树莓派略大，但也只是手掌大小，比想象中小很多。GPIO布局和Arduino基本一致，这意味着很多Arduino Shield都可以用到Galileo上。中间那个BGA封装的芯片，就是Quark SoC，运行时表面温度比较高，以至于盒子里的安全说明特地提示用户不要用手触摸SoC。图2是Galileo开发板提供的接口和主要板载设施。

![图2 Galileo Gen1接口示意[[5]](#参考资料与文献)](./image/G3/mcu/galileo-components.jpg)

Galileo支持以太网、RS232、USB2.0、PCIe等多种接口。需要说明的是，Quark SoC只提供了两个支持外部中断的GPIO（位于Arduino IO 2、3），其余所有GPIO和PWM都是由CY8C9540A扩展芯片从I2C总线（100kHz）上扩展出来的。因此，这种设计尽管很好地保护了SoC，也提供了多电平兼容的能力，但是带来的性能损失是非常严重的，甚至无法软件实现1-wire总线这样的逻辑，因此英特尔在Galileo Gen2中对IO扩展电路作了重大修改，极大地提高了IO性能。

![图3 Galileo Gen1系统框图[[4]](#参考资料与文献)](./image/G3/mcu/galileo-diagram.jpg)

串口使用3.5毫米音频接口，RS232电平。尽管这种设计并非不常见，但对于一款2013年出品的开发板来说，对开发者是非常不友好的。Gen2则知趣地改为开发者喜闻乐见的TTL串口插针。Edison的底板则更为人性化，自带串口转USB的FT232模块。

板子右上角是一块SPI接口的Flash，存有一个小型的Yocto Linux作为无卡情况下引导的系统。Intel官网上提供了固件和更新工具，可以用来更新这块Flash里面的固件，当然，也可以使用旁边的SPI插针。在不插卡的情况下，也可以将Galileo作为一块Arduino使用，但是下载的Sketch并不会写入Flash中的文件系统，重启后就消失了；如果使用SD卡中的Linux系统则可以永久保存。

**使用前设置**

需要特别注意的是：[[#ff0000:**必须在接通5V电源之后，再插入USB线。因为Galileo开发板启动瞬间电流较大，若接通电源前就接通USB，有烧毁开发板或者电脑的危险。下述诸步骤必须遵守此原则。**#]]这也是官方文档中反复强调的一点。

板载固件更新：开始使用前，最好更新板载Flash里面的固件。在[这里](https://downloadcenter.intel.com/download/26417/Intel-Galileo-Firmware-Updater-and-Drivers)下载固件和烧写工具，按提示更新板载固件。官方文档的说明非常清楚，操作比较简单，这里就不复述了。

系统盘制作：首先在[iotdk.intel.com](https://iotdk.intel.com/)下载IoT DevKit系统镜像压缩包，解压后会得到一个后缀为.direct的文件。使用Win32 Disk Imager将其写入SD卡，即完成系统盘制作。将SD卡插入Galileo的SD卡槽，插入串口线和以太网线，上电开机，Galileo便会从SD卡引导系统。

登录系统：如果有插入串口线，可以通过串口进入GRUB菜单，看到Linux启动时输出的日志。系统默认启用SSH服务，也可以使用SSH连接登录系统。以root**（没有密码）**登录Linux系统，即可进入字符终端。

连接网络：连接有线网络，只需要插入以太网线就可以。无线网络就比较麻烦，首先需要有一张PCIe的网卡。这里使用的网卡型号是Intel Centrino Advanced-N 6205 AGN，淘宝价格20元左右。网卡是半高的，购买时应当同时购买半高卡支架，否则很麻烦。断电状态下，将网卡插入开发板背面的mini-PCIe接口，开机后即可检测到网卡，并加载驱动。按照[入门指南](https://software.intel.com/en-us/get-started-galileo-windows-step4)的说明，执行如下操作：

- 执行`connmanctl`，然后`enable wifi`，然后`scan wifi`
- 键入`services`回车，找到要连接的那个SSID，把后面的一串复制下来
- 执行`agent on`，然后`connect <刚才复制的一串>`
- 按照提示输入密码，即可连接

需要说明的是，connmanctl这个东西有一套自己的术语，比如“service”就是指一种网络连接的配置。Service配置文件在`/var/lib/connman`目录下，一般来说，只要网络环境好，每次开机都可以自动连接无线网络。如果没有连接，可以手动执行`connmanctl connect wifi_xxx_xxx_managed_psk`进行连接。

**注意：如果开机前没有插入网线，则自动连接无线网络；连接无线网络后插入网线，仍然可以连接有线网络。若开机前已经插入网线，则不会连接无线网络。**

系统时间设定：与树莓派不同，Galileo带有RTC电池插针。Galileo的RTC电池使用普通的3V电池，例如常见的CR2032。首次启动，先执行`date -s "yyyy-mm-dd hh:MM:ss"`设置时间。注意引号内的时间字符串是UTC时间，也就是北京时间向前调8个小时。然后执行`hwclock -w`，将UTC时间写入硬件RTC。最后设置系统时间为中国标准时间CST，即完成时间设置。`cp /usr/share/zoneinfo/PRC /etc/localtime`

安装必需软件：Yocto使用opkg进行软件包管理。[[#ff0000:**注意：不要使用iotdk软件源更新任何软件！经测试，nodejs升级之后无法正常工作。**#]]

**配置关机按键（2017-10-22）**

前段时间，由于频繁的强行断电关机，造成Galileo的文件系统损坏，具体表现是部分shell命令会报IO错误，sqlite数据库损坏，等等。但是，如果每次都通过SSH执行`poweroff`命令来关机，又非常麻烦。因此，这里将板子上的reset按钮改造成一个关机按钮：短按仍然是重启sketch，而长按则执行`poweroff`关机。下文描述的Galileo一代的解决方案。二代原理类似。

首先要知道，Reset键对应的Linux GPIO编号是53（可查看Arduino交叉编译工具链目录`./variants/galileo_fab_d/variant.cpp`得知），可通过以下方式读取其值：

```
# 用户态映射
echo 53 > /sys/class/gpio/export
# 设置端口方向
echo in > /sys/class/gpio/gpio53/direction
# 读取端口状态
cat /sys/class/gpio/gpio53/value
```

Reset键带有上拉电阻，按下则拉低，因此读到“1”为释放状态，读到“0”为按下状态。因此，可编写脚本轮询gpio53，若连续多次读取gpio53都是“0”，意味着Reset键被按下并保持了一段时间，时间到即可执行`poweroff`命令以关机。脚本`galileo_shutdown_daemon.sh`内容如下：

```
#!/bin/sh
keepgoing=true
counter=0
while $keepgoing
do
    value=`cat /sys/class/gpio/gpio53/value`
    if [ "$value" == "0" ]; then
        echo "$counter"
        let "counter=counter+1"
        flag=`expr $counter % 2`
        if [ "$flag" == "0" ]; then
            echo 1 > /sys/class/gpio/gpio3/value
        else
            echo 0 > /sys/class/gpio/gpio3/value
        fi
        if [ "$counter" == "20" ]; then
            echo `uname`
        fi
    else
        counter=0
    fi
    usleep 50000
done
```

为了使这个脚本常驻后台，需要设定为启动服务。Intel官方提供的IoT Devkit版本的操作系统采用systemd管理开机启动的诸多服务。按照以下步骤，添加`galileo-shutdown-daemon.service`服务并启动。

① 将刚刚编写的脚本`galileo_shutdown_daemon.sh`移动到`/opt/cln/galileo`。当然移动到其他地方也没问题，只要和后面一致就可以。随后，在`/lib/systemd/system`中添加文件`galileo-shutdown-daemon.service`，内容如下：

```
[Unit]
Description=Galileo Poweroff Daemon

[Service]
Type=simple
ExecStart=/bin/sh  /opt/cln/galileo/galileo_shutdown_daemon.sh

[Install]
WantedBy=multi-user.target
```

② 执行以下脚本启用该服务。

```
systemctl enable galileo-shutdown-daemon.service
```

③ reboot，如果一切正常的话，即实现长按Reset关机的功能。

此时，开发板的使用前准备已经基本完成。配置完成后，系统可以干净、稳定地运行。此时，可将SD卡的内容备份为镜像文件。

**应用程序开发**

英特尔提供的产品简介文档[[10]](#参考资料与文献)中说明了Galileo的软件架构。Galileo的软件系统分为Bootloader、Linux操作系统和应用程序三个层次，Arduino Sketch实际上是运行在Linux操作系统上面的应用程序，位于`/sketch/sketch.elf`。在`/opt/cln/galileo`目录中，可以找到clloader。根据[[11]](#参考资料与文献)，clloader原本是给串口modem下载程序用的，后来被Intel改写，用于PC端Arduino IDE与Galileo的串口通信。Yocto Linux将与PC机通信的串口（包括3.5mm和USB client）抽象为`/dev/ttyGS0`设备文件，clloader即负责通过ttyGS0从PC机上接收交叉编译好的Sketch，并启动新下载的Sketch，同时备份旧Sketch。在PC端，经过开发板配置的Arduino IDE包含了Galileo交叉编译的全套工具链，以及封装好的[常用函数库](https://github.com/01org/corelibs-galileo)。若脱离Arduino IDE，使用[官网提供的工具链](https://downloadmirror.intel.com/24619/eng/galileo-toolchain-20150120-windows.zip)一样可以完成交叉编译。

以OpenCV图像处理为例：由于官方Yocto系统中已经集成了OpenCV，所以可以实现很多机器视觉的功能。但由于处理器速度是硬伤，所以不能跑太复杂的图像应用。测试：运行下列Python代码，即可从USB摄像头捕捉图像，并且在上面添加文字并保存。至于C语言的OpenCV使用，可以参考《Intel Edison智能硬件开发指南》书中的讲解。

```
import cv2
import numpy as np

cap = cv2.VideoCapture(0)
ret,frame = cap.read()
cv2.putText(frame, 'BD4SUR\'s Galileo - OpenCV Python Test', (100,100),  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255),2)
cv2.imwrite("/home/root/haruhi2.png", frame, [int(cv2.IMWRITE_PNG_COMPRESSION), 0])
```

![对摄像头捕捉的图像作Canny卷积，实时输出在SSD1306屏幕上（2017年摄影）](./image/G3/mcu/galileo-opencv-canny.jpg)

**GPIO和低级总线操作**

![GPIO编号的对应关系](./image/G3/mcu/galileo-io.png)

操作系统将可用GPIO（包括控制复用器的内部端口）抽象为目录和文件，位于`/sys/class/gpio`目录下，直接读写这些文件即可操作GPIO。例如，执行

```
echo 3 > /sys/class/gpio/unexport
echo 3 > /sys/class/gpio/export
echo out > /sys/class/gpio/gpio3/direction
echo 1 > /sys/class/gpio/gpio3/value
```

将点亮板子上的LED。Arduino库的digitalWrite等函数的内部本质上就是这样的文件操作。但由于Quark内部的GPIO有两种，板子上的选通关系也比较复杂，所以接口内部的实现也有一些比较复杂的细节。参考资料[[2，3]](#参考资料与文献)详细分析了Linux系统中GPIO操作的原理，值得一读。I<sup>2</sup>C和SPI按照通常方法即可操作，唯一需要注意的是板子上有个跳线用来控制I/O扩展器的I<sup>2</sup>C地址。GitHub上已经积累了若干器件的API，直接拿来用就可以了。

**参考资料**

- [Intel Galileo Gen 2开发板的性能评估、使用技巧和实现分析.](http://www.csksoft.net/blog/post/306.html)
- [Intel Galileo 开发板的体验、分析和应用.](http://www.csksoft.net/blog/post/304.html)
- [clloader](https://github.com/01org/clloader/tree/galileo/bootloaders/izmir)
- [非官方软件源](http://alextgalileo.altervista.org/package-repo-configuration-instructions.html)（只可用于默认uClibc-based操作系统）
- [Arduino Galileo核心库](https://github.com/01org/corelibs-galileo)

</details>

## 计算器

![ ](./image/G2/calculator/hp_calculators.jpg)

- [HP-39系列](https://calcwiki.org/HP-39%E7%B3%BB%E5%88%97)
- [ExistOS-For-HP39GII](https://github.com/ExistOS-Team/ExistOS-For-HP39GII)
- [HP 39gII 是怎么回事？](https://zhuanlan.zhihu.com/p/380273576)
- [被遗忘的非CAS神器：HP-39GII介绍与评测](https://www.cncalc.org/thread-8253-1-1.html)

# 网络设备

## 交换机：Cisco Catalyst 4948E

![Cisco Catalyst 4948E](./image/G2/homelab/cisco-4948e.jpg)

![Cisco Catalyst 4948E 内部](./image/G2/homelab/cisco-4948e-inside.jpg)

## 英特尔82599网卡

关于10G光网的几个要点：

- 光纤：分为单模和多模，多模光纤又分成[OM1~OM4若干等级](http://www.fangyuhe.com/news/gsxg/20211001/55.html)，数字越大越好。这里选用OM3，外皮是言和绿色的。
- 光纤接口：常用的是LC接口。这里选用LC，双工。
- 光模块接口：区分单模多模（波长不同）、接口标准（SFP、SFP+）、传输距离（300m、10km等）。这里选用SFP+。
- 网卡：选用基于英特尔82599芯片的网卡CN21ITGA，PCIe 3.0 x8 接口（理论带宽63Gbps[[参考]](https://zh.wikipedia.org/wiki/PCI_Express)），两个SFP+光模块接口。
- iperf3测速时应开多线程，否则不能充分利用带宽。
- 似乎可以打开巨帧选项，提升信道利用率。

参考资料：[家用万兆网络指南：不如先来个最简单的100G网络](https://zhuanlan.zhihu.com/p/74082377)

解决82599网卡不识别不支持的SFP+光模块的问题（[参考](https://help.cesbo.com/misc/articles/hardware/unsupported-sfp-module)）：

- 首先`dmesg | grep ixgbe`可以看到不支持SFP+光模块的警告。
- `modprobe -r ixgbe`卸载网卡驱动模块。
- `modprobe ixgbe allow_unsupported_sfp=1`重新加载网卡驱动模块，允许不支持的SFP+模块。等待片刻。
- 为了在开机加载驱动时增加这个选项，编辑`sudo nano /etc/default/grub`
- 将这一行改成`GRUB_CMDLINE_LINUX_DEFAULT="quiet splash ixgbe.allow_unsupported_sfp=1"`
- 保存文件后执行`sudo update-grub`。

# 机柜和环境

![ ](./image/G2/homelab/rack-front.jpg)

![ ](./image/G2/homelab/rack-back.jpg)

![机柜布置](./image/G2/homelab/homelab_rack.png)

# Ubuntu运维操作备忘

适用20.04LTS和22.04LTS。

## 系统部署检查单

说明：以下检查单适用于x86服务器、Jetson开发板、树莓派等等。可按照实际情况裁剪。

1、硬盘分区设置（如果分区有问题可以`sudo gparted`可视化设置，或者`sudo parted`命令行设置）

- UEFI分区（如果是LegacyBIOS则为`/boot`分区）：500MB，主分区，设为启动分区
- 交换空间：内存的1-2倍（如果内存很大则灵活设置），主分区
- 根目录，主分区
- `/home`目录等，主分区

2、安装后重启，黑屏怎么办？按`Ctrl+Alt+F2`进入字符终端，安装`sudo apt install openssh-server`，即可通过ssh远程进系统。

3、禁止自动休眠

```
# 查看休眠设置
systemctl status sleep.target
# 关闭自动休眠
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
# 然后，最好进入GUI桌面，禁止熄屏、关闭待机
```

4、禁止内核自动更新：`sudo apt-mark hold linux-image-generic linux-headers-generic`

5、设置声卡采样率到48kHz：`arecord --list-devices`查看声卡设备，`/etc/pulse/daemon.conf`编辑采样率。

6、设置代理

在设置代理前，先安装pysocks：`pip install pysocks httpx[socks]`。这一步可能会比较艰难，多试几次，或者直接找wheel安装。

在GUI界面上设置代理：`192.168.*.*, localhost, 127.0.0.1, ::1`。

设置`apt`代理（[参考](https://askubuntu.com/questions/257290/configure-proxy-for-apt)）：

```
sudo nano /etc/apt/apt.conf
# 添加以下一行，存退
Acquire::http::Proxy "http://192.168.10.90:1080";
```

设置当前用户的shell全局代理：

```
sudo nano /etc/profile
# 最后加上以下语句，存退
export proxy="socks5://192.168.10.90:1080"
export http_proxy=$proxy
export https_proxy=$proxy
export all_proxy=$proxy
export no_proxy="192.168.*.*, localhost, 127.0.0.1, ::1"
```

设置root用户的shell全局代理：

```
sudo su - root
visudo
# 在编辑器中增加一行：
Defaults env_keep += "http_proxy https_proxy no_proxy"
```

7、安装必备软件

桌面系统，在应用商店中通过snap安装Chromium、VSCode。然后安装其他必备软件：

```
sudo apt install gcc cmake lame mpg123 git npm screen neofetch rsync python-is-python3 python3-pip

# 通过npm安装node
sudo npm install -g n
sudo n stable
```

安装miniconda：下载[安装脚本](https://docs.anaconda.com/miniconda/#miniconda-latest-installer-links)，运行。

docker的安装比较复杂，参考[文档](https://docs.docker.com/engine/install/ubuntu/)。Jetson的JetPack已经安装了docker。

8、设置各类软件的代理

设置git代理：

```
git config --global http.proxy "socks5://192.168.10.90:1080"
git config --global https.proxy "socks5://192.168.10.90:1080"
```

设置conda虚拟环境中如何使用socks代理：

- 首先`unset http_proxy ; unset https_proxy`，然后`pip install pysocks`，然后`source /etc/profile`，然后再重新进入虚拟环境。
- 或者`conda install pysocks`，然后再`pip install xxx`。

设置 docker 仓库代理：

```
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo nano /etc/systemd/system/docker.service.d/http-proxy.conf

# 添加以下内容后保存：
[Service]
Environment="HTTP_PROXY=http://192.168.10.90:1080/"
Environment="HTTPS_PROXY=http://192.168.10.90:1080/"
Environment="NO_PROXY=192.168.*.*, localhost, 127.0.0.1, ::1"

# 然后重启docker服务
sudo systemctl daemon-reload
sudo systemctl restart docker

# 查看环境变量：
sudo systemctl show --property=Environment docker
sudo docker info
```

9、安装CUDA（详见后文；Jetson只要安装好了JetPack，就无需手动安装CUDA等）。

10、Jetson特有的初始设置

具体内容详见上文，以下仅为事项检查单：

- 设置电源模式为MAXN（无限制），执行后reboot：`sudo nvpmodel -m 0`
- 设置VNC-server：[官方文档](https://developer.nvidia.com/embedded/learn/tutorials/vnc-setup)
- 安装PyTorch。
- 编译部署llama.cpp、Mio等（拉取funasr等镜像）。
- 拉取sdgui等镜像。
- 在图形桌面中，将语言设置成中文，并安装中文输入法。

11、桌面OS的GUI优化

- `sudo nautilus`打开文件管理器。
- 将微软雅黑字体放置在`/usr/share/fonts/msyh`目录下。
- 添加权限：`sudo chmod 755 /usr/share/fonts/msyh/*`
- 在此目录下执行`sudo mkfontscale && sudo mkfontdir && sudo fc-cache -fv`添加缓存。
- 安装GUI美化工具：`sudo apt install gnome-tweak-tool`
- 在应用-工具菜单中找到“优化”，除设置字体外，还可以设置其他。

12、安装filebrowser

- `curl -fsSL https://raw.githubusercontent.com/filebrowser/get/master/get.sh | bash`
- `cd /nas`
- 将`config.json`、`custom.css`复制到`/nas`
- `filebrowser config import config.json`
- `filebrowser users add <username> <password> [flags]`

创建一个服务：`sudo nano /lib/systemd/system/filebrowser.service`，内容如下

```
[Unit]
Description=Filebrowser Clipboard

[Service]
Type=simple
ExecStart=filebrowser --disable-type-detection-by-header --disable-preview-resize -d /nas/filebrowser.db

[Install]
WantedBy=multi-user.target
```

然后`systemctl enable filebrowser.service`启动服务。

## 内核和引导相关

1、更改启动内核（用于解决内核更新后显卡驱动无法连接问题）

问题背景：Ubuntu静默自动更新内核后，由于显卡驱动与内核绑定，新内核找不到显卡，导致报错：`NVIDIA-SMI has failed because it couldn't communicate with the NVIDIA driver.`

```
# 查看当前内核
uname -a
# 查看系统中有哪些内核
dpkg -l | grep linux-image
# 查看grub启动项列表
cat /boot/grub/grub.cfg | grep menuentry
# 修改默认启动的内核
sudo nano /etc/default/grub
将GRUB_DEFAULT的值改为需要默认启动的启动项名称，如"Ubuntu，Linux 5.4.0-169-generic"等等。
# 更新grub设置
sudo update-grub
如果出现提示，则按照提示重新修改GRUB_DEFAULT的值即可。
# 最后reboot
```

2、解决丢失GRUB启动项的问题（[参考](https://io-oi.me/tech/how-to-reinstall-grub/)）

```
# 插入Linux安装盘，开机按F12进入U盘的Linux系统。
# 查看电脑原有的Linux分区，例如/dev/nvmxx
fdisk -l
sudo mount /dev/nvmxx /mnt
mount --bind /dev /mnt/dev
mount --bind /dev/pts /mnt/dev/pts
mount --bind /proc /mnt/proc
mount --bind /sys /mnt/sys
sudo chroot /mnt
mount /dev/<通过fdisk查询到的EFI_System分区> /boot/efi/
grub-install /dev/nvmxx
grub-install --recheck /dev/nvmxx
update-grub
```

## 进程管理相关

```
# 查看当前用户下的进程树
ps xuf

# NUMA控制
sudo apt install numactl

# 远程ssh情况下使用nohup实现后台运行
# 注意，这个方法有坑。建议使用 GNU Screen 等工具
nohup xxx 1>xxx.log 2>&1 &

# GNU Screen 使用方法
screen -r <session>
^a c 创建
^a <num> 切换到
```

## 硬盘相关

```
# 查看磁盘分区表
fdisk -l

# 查看文件系统情况（文件系统容量、挂载点等）
df -Th

# 硬盘格式化并挂载
sudo mkfs.ext4 /dev/sdx
sudo mount /dev/sdx /path/to/hdd

# 永久挂载
1. 查询硬盘的UUID：blkid
2. 将UUID写入配置文件 /etc/fstab，格式如下：
   /dev/disk/by-uuid/硬盘UUID 挂载点路径 ext4 defaults 0 0
3. 执行：sudo mount -a

# 用随机内容填充硬盘
dd if=/dev/urandom of=被填充硬盘上的某个文件

# 全盘镜像
sudo dd status=progress if=/dev/sdx of=xxx.img

# 硬盘测速
sudo apt install hdparm
hdparm -Tt /dev/sdx
```

<details>

<summary>Windows下控制线程的CPU亲和性</summary>

```
#include <iostream>
#include <windows.h>
#include <process.h>
#include <cmath>

#define NUM_OF_CORES 72
#define NUM_OF_THREADS 30

HANDLE gDoneEvent1;
HANDLE gDoneEvent2;

void infloop(int core) {
    HANDLE currentThread = GetCurrentThread();
    DWORD_PTR threadAffinityMask = (DWORD_PTR)(1 << (core % NUM_OF_CORES));
    SetThreadAffinityMask(currentThread, threadAffinityMask);
    while(1) {
        log(100); //占用cPU
    }
}

VOID CALLBACK suspend(PVOID hThread) {
    printf("Suspend\n");
    SuspendThread((HANDLE)hThread);
    SetEvent(gDoneEvent1);
}
VOID CALLBACK resume(PVOID hThread) {
    printf("Resume\n");
    ResumeThread((HANDLE)hThread);
    SetEvent(gDoneEvent2);
}

int main() {

    HANDLE* threads = (HANDLE*)malloc(NUM_OF_THREADS);

    for(unsigned long i = 0; i < NUM_OF_THREADS; i++) {
        threads[i] = (HANDLE)_beginthreadex(NULL, 0, (unsigned int (*)(void *))infloop, (void *)i, 0, NULL);
    }

    HANDLE hTimerQueue = NULL;

    gDoneEvent1 = CreateEvent(NULL, TRUE, FALSE, NULL);
    gDoneEvent2 = CreateEvent(NULL, TRUE, FALSE, NULL);
    hTimerQueue = CreateTimerQueue();

    for(int t = 0; t < NUM_OF_THREADS * 50; t++) {
        HANDLE hTimer1 = NULL;
        HANDLE hTimer2 = NULL;
        CreateTimerQueueTimer(&hTimer1, hTimerQueue, (WAITORTIMERCALLBACK)suspend, threads[t % NUM_OF_THREADS], 200 * (t), 0, 0);
        CreateTimerQueueTimer(&hTimer2, hTimerQueue, (WAITORTIMERCALLBACK)resume,  threads[t % NUM_OF_THREADS], 200 * (t+1), 0, 0);
    }

    for(int i = 0; i < NUM_OF_THREADS; i++) {
        WaitForSingleObject(threads[i], INFINITE);
    }
    WaitForSingleObject(gDoneEvent1, INFINITE);
    WaitForSingleObject(gDoneEvent2, INFINITE);

    CloseHandle(gDoneEvent1);
    CloseHandle(gDoneEvent2);
    for(int i = 0; i < NUM_OF_THREADS; i++) {
        CloseHandle(threads[i]);
    }

    DeleteTimerQueue(hTimerQueue);

    return 0;
}
```

</details>

## 网络相关

**注意**：所有与代理相关的内容，见系统部署检查单。

```
# 设置网卡自动启动
首先 ip link 查看网卡名称，然后
编辑 /etc/netplan/00-installer-config.yaml，在ethernets字段下加入以下配置：
    enp132s0f0:
      dhcp4: true
    enp132s0f0:
      dhcp4: true

# 查看各个网卡的IP
sudo ip addr

# 启动|关闭某个网卡
sudo ip link set dev DEVICE up|down

# 查看端口占用
sudo apt install net-tools
sudo netstat -ap | grep 端口号

# 查看网络实时流量
sudo apt install ethstatus
sudo ethstatus -i eno1

# 测速
sudo apt install iperf3
Windows 从 https://iperf.fr/iperf-download.php 下载可执行文件。
- 首先启动服务端：iperf3 -s
- 然后启动客户端：iperf3 -c 服务端IP -P 线程数 -t 秒数

# 基于rsync的远程文件传输
# 参考：https://www.ruanyifeng.com/blog/2020/08/rsync.html
rsync -av <user>@<host>:<source> <user>@<host>:<dest>

```

## apt相关

```
# 查看已安装软件包
sudo apt list --installed

# 卸载并清理某个软件包（可使用通配符）
sudo apt purge xxx
```

## docker相关

```
docker images / docker image ls
docker rmi <imageid>
docker save -o <output_tar> repo:tag
docker load -i <tar_path>
docker container ls -a / docker ps -a
docker container stats
```

## Python和Conda环境相关

```
# 安装Python-is-python3
sudo apt install python-is-python3
```

**安装conda**

参考[conda官方文档](https://docs.anaconda.com/free/anaconda/install/linux/)

```
sudo apt install curl
curl -O https://repo.anaconda.com/archive/Anaconda3-2023.09-0-Linux-x86_64.sh
bash Anaconda3-2023.09-0-Linux-x86_64.sh
```

注意最后最好选yes，这样默认进入base环境。如果没有选yes，则first run `source <path to conda>/bin/activate` and then run `conda init`.

```
conda config --set proxy_servers.http "socks5://192.168.10.90:1080"
conda config --set proxy_servers.https "socks5://192.168.10.90:1080"
conda config --add channels conda-forge
https://mirrors.tuna.tsinghua.edu.cn/help/anaconda/
```

**conda常用操作**

- 建立虚拟环境：`conda create -n xxx python==3.11 xxxpackage ... 建议加上pysocks`
- 进入虚拟环境：`conda activate xxx`
- 退出虚拟环境：`conda deactivate`
- 删除虚拟环境：`conda env remove -n xxx`
- 在虚拟环境中安装软件包：`conda install xxxpackage`或者`conda install --file requirements.txt`
- 查看已经建立的虚拟环境：`conda env list`


## 安装CUDA

到[英伟达官网](https://developer.download.nvidia.com/compute/cuda/12.3.1/local_installers/cuda_12.3.1_545.23.08_linux.run)下载安装包。

首先[禁用nouveau](https://askubuntu.com/questions/841876/how-to-disable-nouveau-kernel-driver)：

Create a file: `sudo nano /etc/modprobe.d/blacklist-nouveau.conf`

With the following contents:

```
blacklist nouveau
options nouveau modeset=0
```

Regenerate the kernel initramfs: `sudo update-initramfs -u`, and reboot.

- 清理掉所有通过apt安装的CUDA驱动和CUDA-Toolkit：`sudo apt purge *nvidia*`，`sudo apt purge *cuda*`，`sudo apt autoremove`。
- 然后执行安装程序（一个巨大的自解压脚本）：`sudo sh xxx.run`.
- 默认安装位置是：`/usr/local/cuda-12.3/`.
- 在`/etc/profile`最后加上以下语句：
-- 设置环境变量：`export PATH=/usr/local/cuda-12.3/bin:$PATH`.
-- 设置环境变量`export LD_LIBRARY_PATH=/usr/local/cuda-12.3/lib64:$LD_LIBRARY_PATH`.
- 将`/usr/local/cuda-12.3/lib64`添加到`/etc/ld.so.conf`，然后运行`sudo ldconfig`.
- To uninstall the CUDA Toolkit, run `cuda-uninstaller` in `/usr/local/cuda-12.3/bin`.
- To uninstall the NVIDIA Driver, run `nvidia-uninstall`.

安装完成后，执行`nvidia-smi`查看能否识别显卡。建议安装`pip install nvitop`。

执行`sudo nvidia-smi -e 0`关闭ECC，否则会浪费一部分内存在ECC上，计算性能也有一定损失。

执行`sudo nvidia-smi -pm 1`开启持久模式。

# Windows 10 运维操作备忘

**初始配置**

- 运行`gpedit.msc`，计算机配置→管理模板→Windows组件→Windows更新，【配置自动更新】改为【已禁用】
- 检查更新并安装
- 电源设置：待机和熄屏时间、电源键和合盖动作等
- 文件夹选项：打开文件资源管理器时打开此电脑、取消隐藏扩展名
- **仅限内网**：开启远程桌面；允许空密码：运行gpedit.msc，在计算机配置/Windows设置/安全设置/本地策略/安全选项中，找到“账户：使用空密码的本地账户……”，将其设置为“禁用”
- 卸载一切没用的预置软件
- 安装必要软件
- 在设置中清理掉传递优化等无用文件

**安装必备软件**

- VSCode、git、TortoiseGit
- FSViewer(并替换exe)、PotPlayer、千千静听或者Foobar2000(安装插件)
- SumatraPDF(绿色)
- node、npm

**安装nssm**

- 下载nssm，将其复制到`C:/Windows`。

**安装filebrowser**

文件服务器选用FileBrowser，实现内网多台机器间文件的共享（云剪贴）。

- 下载exe，放在`C:/app/filebrowser`，此为FB自身的工作目录，包含配置db和自定义样式等文件。
- 修改`config.json`，将`root`字段改成文件服务器目标目录路径。
- 在工作目录中执行`./filebrowser.exe config import ./config.json`。
- 启动管理员命令行，输入`nssm install filebrowser C:/app/filebrowser/filebrowser.exe --disable-type-detection-by-header --disable-preview-resize`。
- 打开高级防火墙设置，增加**入站规则**：程序、允许连接、域/专用/公用、TCP、UDP
- 最后通过Web前端关掉一切修改类的权限，只保留只读权限，防止远端修改UPDB。

**安装gitea**

Git服务器选用gitea，这是一款开源的Git代码托管平台软件。设置私有代码托管平台，主要是出于两点考虑。一是SDR开发过程中，需要在多台机器之间管理和同步代码，同时还要保持版本控制的一致性，这种情况下就很有必要建立一个私有云内代码托管平台，集中式管理内网中所有的代码仓库。二是不信任公有云上的代码托管服务，如GitHub等等。众所周知，GitHub通过正常途径访问可谓困难重重，并且其自身的业务连续性也是不可控的，必须将自己代码托管在自有的环境中。

- 系统环境变量`Path`添加
-- `C:\Program Files\Git\cmd`
-- `C:\Program Files\TortoiseGit\bin`
-- `C:\Program Files\nodejs\`
- 首先安装Git
- 创建目录`C:/app/gitea`
- 创建目录`G:/gitea_repo`、`G:/gitea_lfs`
- 将`gitea.exe`放在`C:/app/gitea`目录下，启动，访问`localhost:3000`进行初始化配置。
- 管理员模式执行`sc.exe create gitea start= auto binPath= "\"C:\app\gitea\gitea.exe\" web --config \"C:\app\gitea\custom\conf\app.ini\""`
