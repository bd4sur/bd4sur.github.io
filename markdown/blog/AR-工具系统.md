#!title:    工具系统
#!date:     

#!content


> 机器是改造世界的工具，仪器是认识世界的工具。——王大珩

# N9020A频谱仪（信号分析仪）

![2022-04-22 采购 Agilent N9020A 频谱仪](./image/G3/instruments/reimu-sa.jpg)

![数字中频模块](./image/G3/instruments/n9020a-digital-if.jpg)

![参数](./image/G3/instruments/n9020a-info.jpg)

- [TSP #166](https://www.youtube.com/watch?v=0a6bpZZS23g)

# NanoVNA-F网络分析仪

![ ](image/G3/instruments/nanovna.jpg)

![ ](image/G3/instruments/nanovna-f-block-diagram.png)

![发射频谱。实测于2022-05-21](image/G3/instruments/nanovna-tx-spect.jpg)

[原理简要分析](https://kechuang.org/t/85722)

# KC-908U 频谱仪

本文起草于2021-10-27。

情报汇总（▲高价值 ★已备份）

- **一般问题**：[简介](https://www.kechuang.org/t/86706)、[▲★手册](https://www.kechuang.org/t/85239)、[▲★功能讲解视频](https://www.kechuang.org/t/86816)（[B站](https://www.bilibili.com/video/BV1rb4y1C7Cn)）
- **升级·工单**：[▲固件](https://www.kechuang.org/t/85623)、[▲故障反馈](https://www.kechuang.org/t/87180)、[▲内测版缺陷收集](https://www.kechuang.org/t/85638)
- **研发·内测·原理信息**：[▲AD9361抗阻塞实测](https://www.kechuang.org/t/82167)、[▲★基于AD9361的手持接收机](https://www.kechuang.org/t/82250)、[▲KC908各版区别](https://www.hellocq.net/forum/read.php?tid=370979)、[▲★内测生产进度](https://www.kechuang.org/t/85446)、[内测版预售](https://www.kechuang.org/t/85260)、[2021芯片行情](https://www.kechuang.org/t/86502)、[2022芯片行情](https://www.kechuang.org/t/87805)、[★抗摔测试](https://www.kechuang.org/t/87311)、[数字亚音原理](https://www.kechuang.org/t/87399)
- **SDR**：[▲★连接HDSDR](https://www.kechuang.org/t/85661)、[▲★连接GNURadio](https://www.kechuang.org/t/86100)
- **配件与选件**：[声码器选件购买](https://www.kechuang.org/t/86477)、[▲★安装AMBE声码器选件](https://www.kechuang.org/t/86420)（有拆机资料）、[橡胶垫](https://www.kechuang.org/t/85907)、[开通数字解调](https://www.kechuang.org/t/86656)
- **应用**：[黑电台测向](https://www.bilibili.com/video/BV1zA411E77f)、[★微波源输出品质](https://www.kechuang.org/t/85757)、[818/Q900电台收发性能](https://www.kechuang.org/t/86155)、[数字手台灵敏度](https://www.kechuang.org/t/87784)、★功率放大器通道间相位一致性测试
- **评测**：[VE2YMM的评测文章](https://ymartin.com/wordpress/archives/2888)

## 概述

KC908是科创论坛出品的一款便携式频谱仪，2017年开始研发，2020年开始发售内测版，2021年正式上市。KC908的定位是多功能便携射频仪器，具备频谱仪、接收机和信号源三大功能（信号源不能作为频谱仪的跟踪源）。该型机器主要面向业余无线电爱好者、射频工程师等用户群体，性能定位于“中等”水平，其优势和特色是功能丰富、成本较低、高度自持、紧凑便携、软件定义，可胜任一般非专业（经营）场合下的无线电扫描收听、测向定位、干扰排查、射频测试测量等任务。

KC908按照支持频段范围不同，划分为若干个子型号。本台持有的是KC908U即入门型号，标称覆盖频段为100kHz~4GHz。该机器支持所有常见模拟解调模式，解调带宽在一定范围内可连续设置。同时支持多种数字模式解调，但是某些频段和模式的解调选件，需要提供相应资质证明后有偿开通。机器可测量信号电平，若提供天线系数，还可以计算出场强。机器同时提供了电平音功能，可用于测向、猎狐等任务。KC908作为频谱仪，其实时带宽为15MHz。若扫宽超过15MHz，则采用扫描-拼接的方式，将多个实时频谱拼接在一起，获得全景频谱。频谱仪分辨率带宽最大可设置到8MHz。支持零扫宽模式。得益于SDR技术，KC908作为接收机，可以在显示动态实时频谱（最宽15MHz）的同时进行扫描、寻峰、测量、解调任务。接收机模式下除了可以设置检波方式、迹线保持等功能以外，还提供了数字荧光频谱功能，方便进行干扰定位、猝发信号扫描等任务。KC908还提供了简易信号源功能，最大输出电平在10dBm数量级（取决于频段），幅度范围约90dB，支持无调制连续波、AM、FM、ΦM等调制方式，还支持IQ序列回放。

KC908采用软件无线电技术实现，其核心是ADI的集成收发信机芯片AD9361，该芯片也是USRP等常见SDR开发平台的方案。外部天线接收到的信号，经过预选滤波、衰减/放大、混频等前端处理后，直接输入AD9361的零中频接收机，转化为IQ信号后送FPGA（Zynq SoC）进行DDC、FFT、解调等数字信号处理。零中频IQ信号也可直接通过USB3.0接口输出到计算机，供后期分析。

TODO Pros & Cons

## 产品定位、应用场景

## 功能特性

KC908具备频谱仪、接收机和信号源三大功能。

瀑布图刷新率是频谱的4倍，以保证瀑布图上CW点划清晰。小扫宽下由于FFT时间变长，因而刷新变慢。

## 外观、结构

![ ](./image/G3/kc908/KC908.jpg)

## 用户界面

## 使用环境、可靠性、安全性、自检机制

## 选件、附件、外设、耗材

## 升级、改造、维护、保养

### 升降级与版本记录

操作步骤：

- 电池电压应在7V以上，**使用电池供电，不要充电**。
- TF卡，32GB以内容量，FAT32文件系统。**若Windows系统提示SD卡需修复，则必须先修复**。
- 将固件（sdr_908.kc）存放在TF卡根目录。
- 如果升级异常，则：插好存有固件的TF卡，然后按住右侧三个菜单选择键不放，按RST键一次，保持右侧三个键继续按住，直到仪器开机。KC908将自动完成固件更新工作。如果三分钟后依然无动静，说明无法找到升级固件，请检查TF卡并再次尝试。多次尝试无果，请与经销商联系。

注意事项：

- [[#f00:**更新时勿使用USB线连接电脑**#]]。因为尽管用USB线将KC908与电脑连接后可以读写TF卡，但由于USB占用了TF卡，KC908将不能正常读写TF卡中的文件。
- [[#f00:**更新、重启时不要充电。**#]]因为如果在外部供电状态，重启不能完全复位。
- 固件可升可降。[[#f00:**降级前必须先恢复出厂设置**#]]，即清除所有用户数据。否则可能因旧版不兼容新版的数据，而导致设备故障，需返厂才能解除。
- 凡从V2.2及以下版本向上升级，必须先安装V2.2.1基础固件包，否则只能返厂处理。若降级至2.2.1以下版本之后再次向上升级，也必须重新安装V2.2.1基础固件包。如果曾经从V2.2以下向上升级但忘记安装V2.2.1基础固件包，即使仪器尚未故障，在下次升级时，也务必补充安装V2.2.1基础固件包，否则一旦升至V3.0，就会故障。
- 勿随意降级。若降级至相应机型上市之前的版本，可能导致硬件损坏。只有内测版可以降至V2以下版本。

<details>

<summary>版本记录</summary>

**V2.2.1，2021年4月2日发布**

本次升级需安装两个固件，首先安装基础固件，再安装升级包。两个固件包的升级操作方法相同。如果跨过本次升级而直接升级到将来更新的版本，也必须安装本基础固件。

**V2.3.0，2021年4月8日发布**

增加对NXDN低速模式和dPMR解调的支持。dPMR解调未经验证，由于dPMR普遍使用非协议推荐的声码器，因此常不能正确还原声音。暂不支持NXDN高速模式，需录制IQ数据。优化数字解调的稳定性。

**注意：如果没有升级V2.2.1版的基础固件包，则必须先升级基础固件，后续所有版本都依赖V2.2.1基础固件包。已经升级过V2.2.1基础固件包的，不用重复安装基础固件，直接安装最新的升级包即可。**

**V2.4.0，2021年7月1日发布**

- 增加P25、PDT解调功能。增加数字解调的授权机制。
- 在接收机模式下增加光标放大和自动寻峰延迟功能。
- 优化部分算法，修复一些积累BUG。
- 修复接收机模式增益跟随参考/手动增益及快捷开启前置放大器等操作中的逻辑错误。
- 修复部分频段高速IQ输出的I、Q搞反的问题。

**升级该版本后，如需降级至过去版本，务必先执行“恢复出厂设置”（FUNC-系统设置-恢复出厂设置），否则可能导致需要返厂处理的软件故障。**本次升级后，原有DMR解调功能的频率范围将自动限制在民商用频段（134-174，410-470MHz）。

------

**V3.0.0RC（2021-09-18）**

体验版，不完善，存在较多的问题。修复了自上次更新以来发现的一系列BUG。自该版本起，若降级至低版本，设备会自动清除所有的用户数据，恢复至出厂设置，用户不必先手动复位。

- 大幅优化了操作逻辑，操作流程较过去版本有较大变动，减少了不显然、易出错的设置方法，显著改善操作体验。
- 对信号源功能内部调制音的频率范围进行了扩展，其下限由300Hz降低至10Hz，将1kHz以下音频的频率分辨率提升至0.1Hz。
- 在接收机功能中，允许关闭300Hz音频高通滤波器，以便用户外接音频分析设备。**使用本机喇叭时，应当开启300Hz高通滤波器或使用较小的音量，以免烧坏扬声器。**
- 在数字解调功能中增加了声码器选择功能，可以选择与数字协议相匹配的非推荐声码器（选件），此时解调方式旁注“*”号提示。

**V3.0.0（2021-09-30）**

该版本在RC版的基础上，修复了已知的BUG，例如频谱数据消失的问题。产生了少量新的问题，待将来处理。

增加矢量信号源功能（重放模式）。可以播放IQ文件，支持的文件时长与文件的采样率有关，当文件采样率小于2MC/s时，可支持最长60秒。随着采样率的升高，逐渐减小到4秒，最高支持40MC/s的采样率。当IQ文件的时间长度大于所支持的时间长度时，截取前面的一段进行播放。载入IQ数据可能会失败，如果发生，请重启设备后重新载入。本机录制的IQ均可以播放。结束IQ录制时可能会卡死一段时间而无任何提示，这是在存储文件，属于正常现象。同许多功能一样，矢量信号源也是实验性功能，不对它的性能和可用性做任何保证。目前该功能尚有许多问题，且容易导致死机。

**升级本版本后，必须在[[#f00:非充电状态#]]下手动关机、开机一次。**

**V3.0.1（2021-10-11）**

- 修复了信号源功能在某些情况下幅度偏差很大的问题。修复一些小BUG。安装固件之后，请重启设备，用同轴电缆跨接端口1和端口2，进行信号源校准。

**V3.0.2（2021-10-19）**

- 增强矢量信号源功能：可以截取IQ文件中的一段播放，以解决基带文件超过内存容量的问题；支持IQ文件交换I、Q播放；降低IQ文件载入失败的概率。
- 改善IQ录制功能的稳定性，50kHz以下带宽录制时，对于大多数TF卡，可以长期录制直至存储空间用完。
- 该版本是本设备研发阶段的最后一个版本，从这时起，软件进入维护阶段，除特殊情况外，不再开发新的功能。

**V3.1.0（2022-1-3）**

- 优化音频AGC功能，提供快、中、慢三档可调。
- 裁剪写入TF卡的系统日志。
- 修复一些界面BUG，修复部分设备射频组件温度显示异常的问题。

**V3.1.1（2022-1-6）**

- 消除一、二本振五阶互调产物引起的剩余响应。

**V3.1.2（2022-1-25）**

- 提高升级固件时校验的严格程度，降低升级异常的概率。
- 修复出现在KC908U、KC908V上的频率步进与设置不符，步进约为313Hz的倍数的问题。
- 修复部分频率的幅度不确定度异常偏大的问题。
- 改变DCS解码的显示顺序，将符合83组常用码的解码结果放在左侧。关于DCS解码，参见[应用说明](https://www.kechuang.org/t/87399)

**V3.1.3（2022-02-23）**

- 修复部分设备开启数字解调时，间隔几分钟到几十分钟随机出现声音中断的问题。
- 消除一、二本振五阶互调产物导致的剩余响应（主要影响908、908A和内测版机型）。
- 修复关机状态下，部分Type-C快速充电器充电失败的问题。

**V3.1.4（2022-03-15）**

- 增加wav音频播放器，可以播放本机录制的音频文件（只支持本机录制的wav）。
- 改进算法，提高CTCSS频率测定准确度，将不确定度由±0.6Hz减小至±0.2Hz。
- 提高IQ发射功能的IQ文件兼容性，支持整型和浮点32位文件。
- 将亚音静噪添加至moni按键的可控范围。

**V3.1.5（2022-04-26）**

- 修复频道切换、CH/VFO切换后没有即时生效，需要调动一下频率才生效的问题。
- 精简日志信息，削减日志文件。修复其它零星的BUG。

**V3.1.6（2022-05-05）**

- 关闭日志自动写入TF卡的功能，减少对TF卡的损耗及由TF卡导致的系统工作异常。
- 增加用户导出日志到TF卡和用户删除本地日志的功能，用户可以在“关于本机”界面操作“导出日志”到TF卡，可以操作“清空日志”，清空日志只会清除本地日志，不会清除TF卡上的日志。

**V3.1.7（2022-08-28）**

重要可靠性改进，建议所有用户升级。

- 变更了设备内部的部分通信协议，以解决频谱功能长期工作后偶然出现的刷新缓慢、谱型丢失，必须重启才能恢复正常的现象。
- 优化第一本振的控制逻辑，以解决接收机功能长期工作后偶然出现本振失锁，必须重新RUN/STOP才能恢复正常的问题。
- 优化USB快速充电的控制逻辑，减少快充功能的异常概率。
- 优化IQ文件解析逻辑，以解决KC908U/V载入某些速率IQ文件时，发生死机的问题。

</details>

### 发现的问题和缺陷

#### 新机器调谐步进问题

2022-05-26采购新机器，MB-V2、RB-V5，结构有更新（TF卡槽突起），预装3.1.4固件。测试发现仍然存在调谐步进为300Hz倍数的问题。刷入3.1.2固件后，此问题解决。这意味着3.1.2固件似乎是对硬件作了一次性的烧写，引入了某些workaround，以补偿射频硬件的某些固有问题。新发货的机器跳过了这个版本，没有执行这个workaround，因此问题依然存在。

#### AGC时间常数可调

**2021-11-01 提出[建议](https://www.kechuang.org/t/87180)**

功能优化建议：音频AGC时间常数建议设为可调。现阶段音频AGC时间常数默认为1s，对于广播收听等场景来说，增益变动较大，体验不佳。故建议参照某些业余接收机的做法，将AGC时间常数设为可调，既可以连续可调，也可以分为快中慢三档，等等，请评估。该特性已经在固件3.1.0版本中实现。

#### 射频板故障

**2021-11-03 提出[工单](https://www.kechuang.org/t/87180)**

软件版本3.0.2，环境温度22℃，正常被动散热条件下，长时间开机运行（约40分钟），直至内部温度达到一定程度后（如CPU组件温度高于58℃，详见下面的截图），问题稳定复现。满足上述触发条件后，无论在频谱仪模式还是接收机模式，调谐时开始出现卡顿、乃至调谐失败。接收机模式下，调谐失败的具体表现是：频谱和瀑布图消失、解调停止、声音消失，但电平表数字仍在刷新（显然不是实际信号的测量值）。按 [RUN/STOP] 暂停后，重新开始运行，可正常调谐，但再次调谐仍会卡顿。**调谐失败发生的概率随温度上升而增加**，到60℃以上时，基本上无法执行任何调谐操作，按 [RUN/STOP] 也无法恢复，包括频谱仪模式下扫款大于15M的扫描频谱模式，也会受此影响而无法正常工作。尽管无法调谐，但是**用户界面是流畅的**。上述现象持续一段时间后，顶部开始闪动提示“未校准”，机器无法调谐至任何频率，按 [RUN/STOP] 也无法恢复，**须关机降温后才能恢复正常**。

**2021-11-10 返修后定位问题**

研发反馈：经过检查，发现CPU板正常，是射频组件硬件问题，在高温下通信不稳定，失锁，更换射频模组后恢复正常。

**2021-11-12 修复并老化完成发出**

908老化测试和标定完成，已经从成都发出。在产品可靠性理论中，有个著名的浴盆形曲线，它说明产品的失效率随使用时间而下降，并长期维持在一个稳定的低水平上，到了某个时间后，失效率又急剧上升。因此有这样的说法：如果产品第一个星期不出问题，那么它很有可能未来许多年都不会出问题。电子设备等工业产品，在出厂前通过加温、光照等手段，提前对产品人为加速老化，又叫烤机、烧机。产品出厂前进行老化试验，一方面可以筛选出有缺陷的产品，降低产品交付后的返修率；另一方面，老化试验可以使产品的内部特性趋于稳定，如消除内部应力等等，从而使产品在厂内提前度过浴盆形曲线的下降段，使出厂产品的失效率维持在较低水平，相应地MTBF也比较长。这次908出问题，说明厂家并未对每一部机器进行老化试验。考虑到908产品性质，也不能要求太多，毕竟是一个愿打一个愿挨。

#### 调谐步进问题

**2021-11-24 首次发现步进问题**

KC908U在短波段的调谐精细度（颗粒度）大约是0.25kHz或以上。这是在接收气象传真的时候发现的。同时用705和908接收气象传真，发现解调出来的音频频率有些微差异。使用标准频率发播台的信号进行校准，908的频率是准的，问题出在调谐精细度不够高。705标称可以以1Hz的精度进行调谐，0.1kHz当然没问题。但是实践发现908的调谐精度（颗粒度）仅0.25kHz或更高。这对于接收一般单边带或调幅音频信号自然是没问题的，但是对于CW、气象传真这类频率并非对齐在1kHz上的信号，多少会有些影响。0.25kHz的调谐颗粒度，意味着“量化误差”最大是125Hz左右。这大概就是包括908、德生的PL330（表面上看到的最小调谐粒度是100Hz）等单边带机器，在解调单边带语音时出现那种奇怪的失真的原因？并不确定，只是一个猜想。

**2022-01-22 提出[工单](https://www.kechuang.org/t/87180)**

软件版本3.1.1，关于调谐步进（分辨率）的问题。使用过程中，发现机器调谐最小步进为300Hz左右（无论是通过机器本体还是HDSDR调谐都如此），这个步进精度对于业余无线电爱好者收听短波段的CW、SSB、气象传真等信号，还是不够精确。操作上的调谐步进是可以设置的，显示上也可以精确到1Hz，但实际上是被量化为300Hz步进的。这个300Hz最小步进的现象，与扫宽、解调带宽的设置都无关。详见视频（视频中908的调谐步进是100Hz）。

**2022-01-24 研发侧复现问题**

有其他KC908U用户也复现了这一问题。研发反馈：经检查，是存在于908U和908V的软件缺陷，在下个固件版本中修复。

#### ExtIO库上下边带颠倒问题

**2022-01-03 首次发现此问题**

在微信群中反映此问题：尝试用908通过HDSDR收听DRM广播，发现HDSDR上下边带是反的。

**2022-01-04 问题修复**

研发侧修复了HDSDR的ExtIO库以及GNURadio接口。

#### 剩余响应问题

该问题在固件3.1.1版本中修复。升级前后对比详见[视频](https://www.bilibili.com/video/BV1aa411q7ug)。

## 电源

### 电池特性曲线

![NCR18650B](./image/G3/power/ncr18650b.png)

## 端口、兼容性、互操作性

## 技术原理分析

### 系统总体框图（推测）

![ ](./image/G3/kc908/kc908-block-diagram.png)

### 射频前端框图

![ ](./image/G3/kc908/KC908_RF_Front_end.jpg)

### 核心器件AD9361

![[来源](https://wiki.analog.com/resources/eval/user-guides/ad-fmcomms2-ebz/ad9361)](./image/G3/ad9361.svg)

### 原理分析笔记

2022-07-16

今天研究908收音机的射频前端设计，其中有个部分，起初让我感觉十分费解，那就是在接收路径上，0dB的前放（也就是关闭前放）是通过一个可调衰减器和固定LNA实现的。为什么这么设计呢？

后来我猜想，这可能是因为，在不需要开前放的应用场景下（比如闭路测量强信号），此时系统的阻抗匹配是比仪器的噪声系数（灵敏度）更主要的矛盾，运用衰减器作阻抗匹配，还可以起到保护后级的作用。另外也可能是考虑到整个系统的频率响应平坦度、各个射频器件的精度/误差传递等问题。

实际操作机器发现，将前放手动设置为0dB，底噪为-100dBm，而将前放手动设置为20dB，则底噪降低到-116dBm。这意味着衰减器至多引入了16dB的噪声系数（也即衰减器最小增益为-16dB）。

又想到汽车轮毂的动平衡。汽车车轴向车轮输出功率，其中车轮自身转动惯量和偏心、摩擦等因素带来的阻抗，可类比为天线的损耗阻抗；而车轮与地面之间的摩擦，反映了车轮“辐射”动力的能力，可类比为天线的辐射阻抗。给汽车轮毂加质量块，调整使整个车轮达到动平衡状态，实际上就是抵消掉损耗阻抗中的虚部（偏心项），使得轮子跟轮轴之间实现阻抗匹配。这虽然会略微增加轮轴的阻性负载，但却避免了偏心能量反射回轮轴。

------

2022-07-14

看了下AD9361的文档。说起来，在裸机器上运行的硬件接口库，我真正读过内部代码的，只有博世的BME280微机电温湿度气压传感器。这种驱动代码，很少有复杂的逻辑，大多数是寄存器操作，是对寄存器手册的一种实现，所以这种代码看起来是相当痛苦的。厂家一般也不建议自行实现驱动，一来容易出错（还不容易测试），二来驱动内部往往有某些屏蔽硬件故障的workaround，这个普通用户当然是无法理解的。

### 内部结构

![射频组件，左侧是射频端子](./image/G3/kc908/KC908-射频组件.jpg)

![核心组件](./image/G3/kc908/KC908-核心组件.jpg)

![核心板背面及电池](./image/G3/kc908/KC908-核心板背面及电池.jpg)

![2022年1月新版核心组件](./image/G3/kc908/kc908-新版核心组件.jpg)

### 拆装机要领

**注意事项：八该一反对**

- 该断电的断电：拆机前必须确认关机。因全程没有取下电池，要当心异物侵入造成短路。
- 该接地的接地：注意防静电，戴好防静电手环，使用防静电工具和桌垫。操作前触摸金属外壳使等电位。
- 该保护的保护：避免工具刮坏外壳，可以用薄的胶带保护外壳上易被工具刮伤的部位，例如射频连接器下方。
- 该绝缘的绝缘：尽可能使用不导电的工具，如塑料撬棍、陶瓷镊子等。
- 该收纳的收纳：妥善收纳螺丝、工具等零件，防止遗失、遗漏或者扰乱工作区域。
- 该清理的清理：保持工作区域整洁；避免将杂物带入机器内部，装配前要用气球吹干净。
- 该记录的记录：操作过程中，遇到复杂结构、复杂线序等情况，要及时拍照、纸笔记录。螺丝要记录对应的螺丝孔。
- 该观察的观察：仔细观察结构，遇到紧配、位置干涉等，想办法松动，必要时使用工具、夹具辅助操作，不要强行按压。
- 反对盲目蛮干：动作要轻柔、稳定，不要急躁冒进、不要强行操作、不要过度用力、不要过分紧固（尤其要防止给PCB施加额外应力）。不要拆卸无关部分。尽量不触碰管脚、射频信号线等敏感部分。

**拆机要领**

+ 关闭电源，使用H1.5螺丝刀取下后盖板共6颗螺丝和前盖板四角共4颗螺丝，将缓冲胶垫内的套管取下，拆除缓冲胶垫。分离后机壳。如有必要，拆卸前盖板的其余螺丝，拆下前盖板，取下键盘橡胶，并确认仪器处于关机状态。
+ **先**取下射频连接器的螺母，**再**取下射频组件上的固定螺丝。
+ 再次确认设备处于关机状态，分离射频组件上的两条排线。
+ 用塑料撬棒等带钩工具，从远离射频端口的一端提起射频组件，大约提起3cm。再向远离射频端口的方向将射频组件退出机壳，暴露核心组件。用手协助数据排线退出射频组件。注意射频组件屏蔽罩一侧的导热材料。
+ 取下连接在核心组件上的数据排线。拆除四颗固定核心组件的螺丝。如有必要，翻转仪器到键盘/显示器一面，松动控制组件上的所有螺丝（只需松动2周，使控制组件能够活动）。如果拆卸了前盖板并松动了控制组件：使核心组件向上。用手指向面板方向用力挤压紧邻核心组件的电池和12V充电口大插座，使其落下大约1mm，松手后核心组件即松动。然后用带钩撬棍从核心组件上的螺丝孔伸入，从远离USB连接器一侧提起核心组件。如果没有拆卸前盖板和松动控制组件，那么直接用撬棍从远离USB连接器一侧缝隙撬起核心组件。

**装机要领**

+ 将核心组件装入KC908，安装时将MicroUSB口一侧倾斜向下，紧贴机壳放到底，使USB口伸入外壳的孔中，然后逐步放平核心组件，在两个连接器上方按压，使核心组件下方的板间连接器互相插入。如果前面曾松动了控制组件，那么直接将核心组件平放至控制组件上，对准板间连接器位置并压紧，移动核心组件和控制组件（键盘板）整体的位置，使之靠向机壳数据和电源接口一侧，MicroUSB口稍稍伸入外壳上的MicroUSB孔，然后用手指将控制板和核心组件捏紧。检查核心组件四个螺丝孔与螺母之间应密合无缝隙。
+ 拧紧核心组件和控制组件上的所有螺丝，清洁键盘和显示屏，复装键盘、前盖板（只装中间两颗螺丝）。
+ 开机检查能否正常启动，如果正常，则继续下一步。如果出现显示颜色异常等情况，说明核心组件与控制组件之间的板间连接器有接触不良，应重新插拔安装。如果有污物，应使用蘸有少量蒸馏水的滤纸擦拭簧片。注意切勿将松香等绝缘物质带入连接器。
+ 安装好核心组件上的数据排线，使射频组件归位。
+ **先**装入射频组件的螺丝但不拧紧，**再**安装射频连接器的螺母并拧紧，**最后**紧固射频组件的固定螺丝。
+ 装好数据排线并弯折好窄排线；**装入四根肩带钢针**，装入后盖板，装入后盖板中部的2颗螺丝。
+ 连接天线，再次开机检查，确认各功能正常后，再装回四个缓冲胶垫和其余的螺丝和套管。

## 规格参数

### 标称参数（手册2021年7月第4版）

![ ](./image/G3/kc908/kc908-spec-1.png)

![ ](./image/G3/kc908/kc908-spec-2.png)

![ ](./image/G3/kc908/kc908-spec-3.png)

## 文档资料

### 说明书（大纲）

- 引言
- 第1章 概述
- 第2章 基本操作
- 第3章 频谱仪
- 第4章 接收机
- 第5章 信号源
- 第6章 典型应用场景
- 第7章 技术原理
- 第8章 规格参数
- 索引


# 元器件

## GP2Y1010AU0F细颗粒物传感器

2016-12-29

尽管我一直认为空气净化器是伪需求，但是我对粉尘检测器件还是比较感兴趣的。市面上已经有不少粉尘检测器件，最著名的一款大概是攀藤的传感器，模块化、高度集成、串口数据输出，非常好用。这些廉价粉尘传感器基本上都是通过测量空气散射光的强度，间接得到空气中的粉尘浓度。由于信号微弱，并且测量原理本质上不精确（不能区分烟雾、粉尘的粒子大小），因此测得的数据只能算是半定性的。

在2016年秋天的课程设计中，制作了一个简单的自动气象站。当时，我选择了淘宝上最便宜的GP2Y1010AU0F细颗粒物传感器，配合风机，作为空气质量检测的传感器。这款传感器对时序要求比较高，因此我选择Arduino UNO作为器件的控制器，由UNO将处理后的数据通过I2C总线发送到上位机。本文中，选用Intel Galileo一代开发板作为上位机。

GP2Y1010AU0F是夏普推出的一款粉尘浓度传感器，用于空气净化器、粉尘浓度监测等领域。该型号是GP2Y10系列里比较低端，同时也是比较便宜的型号，淘宝价格20元左右。这么便宜的价格，自然不能指望有多精确的测量结果。模块将红外光照射到采样孔，测量含尘空气的散射光强度，并将测得的模拟信号放大，以电压形式输出。输出电压与粉尘浓度成近似线性关系，根据输出电压可以计算出近似的粉尘浓度。

模块对外有6条引线，其中三条控制LED，另三条用于内部的传感器和放大器。为了消除干扰，LED端口**必须**按照图1的接线方式驱动。使用时，按照图1右侧所示的时序驱动LED，即可获取测量结果。采样时序如图2所示。从手册提供的这两个时序来看，MCU必须能够实现微秒级的定时精度，才能实现手册要求的时序。这个精度，在Galileo上是不可能实现的。另外，MCU必须有足够精度和速度的AD转换器，这样才能在很短的采样周期中迅速、精确地测量出输出信号。因此，使用Arduino UNO作为控制器，直接从传感器获取测量数据，而不是直接使用Galileo控制它。

![图1 GP2Y1010AU0F的外部连接方式以及驱动信号时序[[2]](#参考资料)](./image/G3/gp2y1010au_driving.jpg)

![图2 GP2Y1010AU0F的采样时序[[2]](#参考资料)](./image/G3/gp2y1010au_sampling.jpg)

尽管器件内置了放大器，外围电路也设置了必要的滤波措施，但是测量得到的模拟电压仍然会有抖动。如果通过串口将测量值打印到屏幕上，会看到数据的抖动很厉害，因此有必要对测得的数据进行滤波处理。常用的滤波器有限幅滤波、高斯滤波、滑动平均滤波、中值滤波、卡尔曼滤波等等，它们的实质都是低通滤波器。这里选择简单的滑动平均滤波。滑动平均滤波算法利用一次测量和前面$N-1$次测量的结果作为宽度为$N$的窗口，计算窗口内数据的平均值，作为最新测量的结果。经滑动平均处理的测量数据，就显得非常平滑了，不会有较明显的波动。

![图3 GP2Y1010AU0F的输出电压与粉尘浓度的关系[[2]](#参考资料)](./image/G3/gp2y1010au_graph.jpg)

测得模块输出的模拟电压之后，还需要经过换算，才能得到最终的粉尘浓度值。根据图3，环境中没有灰尘时，传感器会输出0.6V的无尘输出电压。灰尘浓度小于0.5mg/m<sup>3</sup>时，输出电压`outputVol`（单位：采样）与灰尘浓度`dustDensity`（单位：μg/m<sup>3</sup>）呈现出很好的线性关系：

```:C
dustDensity = (outputVol / 1024.0 * 5.0 - 0.6) * 159.7444089f;
```

但当灰尘浓度大于0.6mg/m<sup>3</sup>时，输出电压趋于饱和，饱和电压3.7V左右。因此，传感器只能测量0.5mg/m<sup>3</sup>（对应输出电压3.5V）以下的粉尘浓度。

事实上，AQI（空气质量指数）是多个具体指标的综合指标，本文方案所测到的AQI并不是严格意义上的AQI。本文描述的灰尘检测仪，其实没有太大的实际意义，更多地是想积累一点器件应用的经验。实际应用可以选用100元以上的激光散射式灰尘传感器，测量值相对准确，使用也更简易。

**系统集成**

将Galileo设为I2C主机；将Arduino设为I2C从机，响应主机的访问请求，并且根据内部的状态返回相应的数据。Arduino同时执行GP2Y的数据处理（滑动平均）、驱动DS18B20、串口输出。Arduino的I2C总线被上拉至5V，Galileo同样是5V，因此无需电平转换。Galileo可以直接给Arduino供电。

Galileo上运行Yocto Linux，定时访问Arduino从机，读取数据，并将测得的数据保存到数据库中。

主机和从机的代码分别如下：

**从机（Arduino UNO）**

```:C
#include <Wire.h>
#include <OneWire.h>

#define WINDOW_WIDTH 10 //滑动窗口窗宽

OneWire  ds(10);  // on pin 10 (a 4.7K resistor is necessary)

static unsigned char state;
static unsigned char addr;
static unsigned char result;
static byte aqi_byte[2];  //AQI输出结果（因为AQI的值是0到500，需要用两个IIC传输周期传输两个字节）
static byte data[12];  //DS18B20输出的温度

int dustPin=0;
int mqPin=1;
int rainPin=2;
int ledPower=2;

static unsigned char request_count = 0;
void receiveEvent(int);
void requestEvent(void);
void requestEvent(void);
void exec(void);
void read_ds18b20(void);
void read_gp2y();

//初始化
void setup()  {
    pinMode(ledPower,OUTPUT);
    pinMode(dustPin, INPUT);
    pinMode(mqPin, INPUT);
    pinMode(rainPin, INPUT);
    Wire.begin(0x01);
    Wire.onReceive(receiveEvent);
    Wire.onRequest(requestEvent);
    Serial.begin(9600);
    read_ds18b20();
    read_gp2y();
}

//主程序
void loop() {
    delay(500);//延时
}

//读取GP2Y - 滑动平均
void read_gp2y() {
restart:
    char valStr[16];
    static float val[10]={0.0};
    static float latest_aqi = 0.0;
    int count = 0;
    float sum = 0.0;

    float dustVal=0.0;
    int delayTime=280;
    int delayTime2=40;
    float offTime=9680;
    // ledPower is any digital pin on the arduino connected to Pin 3 on the sensor
    digitalWrite(ledPower,HIGH); 
    delayMicroseconds(delayTime);
    dustVal=analogRead(dustPin); 
    delayMicroseconds(delayTime2);
    digitalWrite(ledPower,LOW); 
    delayMicroseconds(offTime);

    if(dustVal > 80) {
        // Shift Average
        for(int i = 0; i < WINDOW_WIDTH - 1; i++) {
            val[i] = val[i+1];
        }
        val[WINDOW_WIDTH - 1] = dustVal;
        for(int i = 0; i < WINDOW_WIDTH; i++) {
            sum += val[i];
        }
        dustVal = sum / (float)WINDOW_WIDTH;
        if(dustVal > 122.8){
            float aqi = (dustVal / 1024.0 * 5.0 - 0.6) * 159.7444089f;
            latest_aqi = aqi;
            //Serial.println(aqi);
            unsigned int aqi_i = (unsigned int)aqi;
            aqi_byte[0] = aqi_i >> 8;
            aqi_byte[1] = aqi_i & 0xff;
        }
        else{
            goto restart;
        }
    }

    else {
        goto restart;
    }
    /*
    //Serial.println(latest_aqi);
    aqi_byte[0] = (unsigned int)latest_aqi >> 8;
    aqi_byte[1] = (unsigned int)latest_aqi & 0xff;
    }*/
}

//读取DS18B20 - 单总线接口操作
void read_ds18b20()
{
    byte i;
    byte present = 0;
    byte type_s;
    //byte data[12];
    byte addr[8];
    float celsius, fahrenheit;
    if ( !ds.search(addr)) {
        Serial.println("No more addresses.");
        ds.reset_search();
        delay(250);
        return;
    }
    ds.reset();
    ds.select(addr);
    ds.write(0x44, 1);        // start conversion, with parasite power on at the end

    delay(1000);     // maybe 750ms is enough, maybe not
    // we might do a ds.depower() here, but the reset will take care of it.

    present = ds.reset();
    ds.select(addr);    
    ds.write(0xBE);         // Read Scratchpad

    Serial.print("  Data = ");
    Serial.print(present);
    Serial.print(" ");
    for ( i = 0; i < 9; i++) {           // we need 9 bytes
        data[i] = ds.read();
        Serial.print(data[i]);
        Serial.print(" ");
    }

    // Convert the data to actual temperature
    // because the result is a 16 bit signed integer, it should
    // be stored to an "int16_t" type, which is always 16 bits
    // even when compiled on a 32 bit processor.
    int16_t raw = (data[1] << 8) | data[0];
    if (type_s) {
        raw = raw << 3; // 9 bit resolution default
        if (data[7] == 0x10) {
            // "count remain" gives full 12 bit resolution
            raw = (raw & 0xFFF0) + 12 - data[6];
        }
    } else {
        byte cfg = (data[4] & 0x60);
        // at lower res, the low bits are undefined, so let's zero them
        if (cfg == 0x00) raw = raw & ~7;  // 9 bit resolution, 93.75 ms
        else if (cfg == 0x20) raw = raw & ~3; // 10 bit res, 187.5 ms
        else if (cfg == 0x40) raw = raw & ~1; // 11 bit res, 375 ms
        //// default is 12 bit resolution, 750 ms conversion time
    }
    celsius = (float)raw / 16.0;
    Serial.print("Temperature = ");
    Serial.print(celsius);
    Serial.println(" Celsius");
}

// 当从机接收到主机字符，执行该事件
void receiveEvent(int howMany)
{
    request_count = 0;
    while( Wire.available()>1) // 循环执行，直到数据包只剩下最后一个字符
    {
        addr = Wire.read(); // 作为字符接收字节
    }
    //接收主机发送的数据包中的最后一个字节
    addr = Wire.read();    // 作为整数接收字节

    read_ds18b20();
    read_gp2y();

    Serial.print("received addr = ");
    Serial.println(addr);    //把整数打印到串口监视器中，并回车 
}

void requestEvent()
{
    //把接收主机发送的数据包中的最后一个字节再上传给主机
    if(request_count < 12) {
        Wire.write(data[request_count]); // 响应主机的通知，向主机发送一个字节数据
        request_count++;
    }
    else if(request_count == 12){
        byte rain = analogRead(rainPin);
        Wire.write(0xff - rain);
        request_count++;
    }
    else if(request_count == 13){
        Wire.write(aqi_byte[0]);
        request_count++;
    }
    else if(request_count == 14){
        Wire.write(aqi_byte[1]);
        request_count++;
    }
    else if(request_count == 15){
        byte sox = analogRead(mqPin);
        Wire.write(sox);
        request_count = 0;
    }
}
```

**主机（Galileo）**

```:C
#include <stdio.h>
#include <fcntl.h>
#include <linux/i2c-dev.h>
#include <errno.h>
#include <sys/types.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#define I2C_ADDR 0x01

int main(void)
{
    int fd;
    unsigned char buf[1];
    unsigned char data[13];
    unsigned char val;
    FILE *file;
    if ( (file = fopen( "/home/pi/data.dat", "w")) == NULL) {
        printf("Failed to open data file.\n");
    }
    printf("File opened.\n");

    while (1) {
        rewind(file);
        fd = open("/dev/i2c-1", O_RDWR);
        if (fd < 0) {
            printf("打开文件错误:%s\r\n", strerror(errno)); return 1;
        }
        if (ioctl( fd, I2C_SLAVE, I2C_ADDR) < 0 ) {
            printf("ioctl 错误 : %s\r\n", strerror(errno)); return 1;
        }

        val = 0x01;
        if (write(fd, &val, 1) < 0)
        {
            printf("Arduino从机初始化失败\r\n");
        }
        if (write(fd, &val, 1) < 0)
        {
            printf("I2C写失败\r\n");
        }

        usleep(1500000);

        int c = 0;
        for(c = 0; c < 12; c++) {
            if (read(fd, &buf, 1)) {
                data[c] = buf[0];
                //printf("%d  ",data[c]);
            }
        }
        if (read(fd, &buf, 1)) {
            printf("降水：%d\n", buf[0]);
            fprintf(file, "%d\n", buf[0]);
        }
        short aqi = 0;
        if (read(fd, &buf, 1)) {
            aqi = buf[0] << 8;
        }
        if (read(fd, &buf, 1)) {
            aqi |= buf[0];
            printf("细颗粒物：%d\n", aqi);
            fprintf(file, "%d\n", aqi);
        }
        if (read(fd, &buf, 1)) {
            printf("二氧化硫：%d\n", buf[0]);
            fprintf(file, "%d\n", buf[0]);
        }

        short raw = (data[1] << 8) | data[0];
        unsigned char cfg = (data[4] & 0x60);
        if (cfg == 0x00) raw = raw & ~7;
        else if (cfg == 0x20) raw = raw & ~3;
        else if (cfg == 0x40) raw = raw & ~1;
        printf("气温（DS18B20）：%.2f\n", (float)raw / 16.0);
        close(fd);
        //usleep(500000);
    }
    fclose(file);
    printf("File closed.\n");
}

```

**参考资料**

+ [http://smartairfilters.com/zh/blog/how-accurate-are-common-particle-counters-comparison-test/]()
+ [GP2Y1010AU Datasheet](http://pdf1.alldatasheet.com/datasheet-pdf/view/412700/SHARP/GP2Y1010AU0F.html)
+ [Arduino主从机之间的I2C通讯实验](http://www.eefocus.com/zhang700309/blog/12-01/236815_59f78.html)

# 材料

# 机械加工工具

# 3D打印机
