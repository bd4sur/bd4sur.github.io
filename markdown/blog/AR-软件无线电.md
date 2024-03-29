#!title:    软件无线电
#!date:     2020-12-08

#!content

![2022年3月13日，使用GNURadio测试SDR单边带发射机](./image/G3/sdr/gnuradio-ssb-tx-test.jpg)

# 业余电视（无线音视频传输）研究记录

试验效果呈现：

- [2023-07-09 《纺歌》音视频传输试验](https://www.bilibili.com/video/BV1mF411X7Qf)
- [2023-07-09 "Bad Apple"音视频传输试验](https://www.bilibili.com/video/BV1wj411Z71x)
- [2022-07-09 《星之所在》音频传输试验](https://www.bilibili.com/video/BV1BW4y1U7ZD)

## QPSK数字音频传输

方便命令：

- 杀掉GR进程：`kill $(ps aux | grep -E "[Q]PSK_Rx.py" | awk '{print $2}')`
- 管道MP3音频输出：`cat xx.mp3/或者某命名管道 | lame --decode --mp3input - - | aplay -`

视频抽帧并裁切：`ffmpeg -i ba.mp4 -f image2 -vf crop=1080:1080 -r 10 -qscale:v 2 ./ba-%05d.jpg`

**发射机**

![ ](./image/G3/sdr/qpsk-tx.png)

`pcm_pdu_builder`模块：

```
import numpy as np
from gnuradio import gr
import pmt
import array
import queue
import math

def to_bytes(samples, scale):
    bytes = []
    for i in range(len(samples)):
        fvalue = samples[i] * scale # 适当衰减一些，防止编码有误。TODO 需要改进二进制编码。
        i16value = math.floor((fvalue + 1) * 32768)
        msb = ((i16value >> 8) & 255)
        lsb = (i16value & 255)
        bytes.append(msb)
        bytes.append(lsb)
    return bytes

class blk(gr.sync_block):
    """pcm_pdu_builder"""

    def __init__(self, mtu=1000, pcm_scale=0.9999):
        gr.sync_block.__init__(self,
            name = "pcm_pdu_builder",
            in_sig = [np.float32],
            out_sig = None
        )
        self.mtu = mtu
        self.pcm_scale = pcm_scale
        self.message_port_register_out(pmt.intern('pdu_out'))

        self.pcm_queue = queue.Queue()

    def work(self, input_items, output_items):
        input_buf = input_items[0].tolist()

        input_pcm_uint16s = to_bytes(input_buf, self.pcm_scale)

        for i in range(len(input_pcm_uint16s)):
            self.pcm_queue.put(input_pcm_uint16s[i])

        byte_counter = self.pcm_queue.qsize()
        while byte_counter > self.mtu:
            mtu_frame = []

            for i in range(self.mtu):
                pcm_byte = self.pcm_queue.get()
                byte_counter = byte_counter - 1
                mtu_frame.append(pcm_byte)

            output_msg = pmt.cons(pmt.PMT_NIL, pmt.init_u8vector(len(mtu_frame), (mtu_frame)))
            self.message_port_pub(pmt.intern("pdu_out"), output_msg)

        return len(input_items[0])
```

`Packet_Format_GR38`模块：

```
import numpy as np
from gnuradio import gr
import pmt
import array
class blk(gr.sync_block):
    """Packet Format"""

    def __init__(self):
        gr.sync_block.__init__(self,
            name = "Packet Format GR38",
            in_sig = None,
            out_sig = None)
        self.message_port_register_in(pmt.intern('PDU_in'))
        self.message_port_register_out(pmt.intern('PDU_out0'))
        self.set_msg_handler(pmt.intern('PDU_in'), self.handle_msg)

    def handle_msg(self, msg):
        pld = pmt.to_python(pmt.cdr(msg))
        mLen = len(pld)
        if (mLen > 0):
            ## create a numpy array of type 'int' with preamble and sync word
            tmp_char_list = np.array([85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,225,90,232,147],dtype=int)
            ## append length 2x
            tmp_char_list=np.append(tmp_char_list,(mLen >> 8))
            tmp_char_list=np.append(tmp_char_list,(mLen & 255))
            tmp_char_list=np.append(tmp_char_list,(mLen >> 8))
            tmp_char_list=np.append(tmp_char_list,(mLen & 255))
            tmp_char_list_len=len(tmp_char_list)
            ## append original payload
            new_char_list=np.insert(tmp_char_list,tmp_char_list_len,pld)
            new_char_list_len=len(new_char_list)
            ## save final numpy array as byte array (requires 'import array')
            byte_array_new_char_list=array.array('B',new_char_list)
            new_bytes_out_len = len(byte_array_new_char_list)
            ## create PMT u8vector using byte array
            new_out_bytes_pmt=pmt.cons(pmt.PMT_NIL,pmt.init_u8vector(new_bytes_out_len,(byte_array_new_char_list)))
            self.message_port_pub(pmt.intern('PDU_out0'), new_out_bytes_pmt)
```

**接收机**

![ ](./image/G3/sdr/qpsk-rx.png)

其中`PDU_to_File_no_header`模块的代码：

```
import numpy as np
from gnuradio import gr
import pmt
import queue

class blk(gr.sync_block):

    def __init__(self):
        gr.sync_block.__init__(
            self,
            name = 'PDU to File no header',
            in_sig = None,
            out_sig = [np.uint8]
        )
        self.message_port_register_in(pmt.intern("message_in"))
        self.set_msg_handler(pmt.intern("message_in"), self.handle_msg)

        self.msg_queue = queue.Queue()
        self.out_queue = queue.Queue()
        self.msg_counter = 0

    def decode_packet(self, packet):
        return packet[:]

    def work(self, input_items, output_items):
        out = output_items[0]
        if not self.out_queue.empty():
            packet = self.out_queue.get()
            if len(out) < (len(packet)):
                self.out_queue.put(packet)
                print(f"Buffer Length = {self.out_queue.qsize()}")
                return 0
            else:
                body = self.decode_packet(packet)
                out[:len(packet)] = body
                return (len(packet))

        if not self.msg_queue.empty():
            self.msg_counter += 1
            packet = self.msg_queue.get()
            if len(out) < (len(packet)):
                self.out_queue.put(packet)
                return 0
            else:
                body = self.decode_packet(packet)
                out[:len(packet)] = body
                return (len(packet))
        else:
            return 0

    def handle_msg(self, msg):
        payload = pmt.to_python(pmt.cdr(msg))
        self.msg_queue.put(payload.tolist())
```

------

2023-07-02

![ ](./image/G3/sdr/qpsk-tx-202307.png)

```
import numpy as np
from gnuradio import gr
import pmt
import array
import random

class blk(gr.sync_block):
    """封装DLN层报文"""
    def __init__(self, padding_bytes=260):
        gr.sync_block.__init__(self,
            name = "DLN_Packing",
            in_sig = None,
            out_sig = None)

        self.padding_bytes = padding_bytes

        self.message_port_register_in(pmt.intern('nal_in'))
        self.message_port_register_out(pmt.intern('dln_out'))
        self.set_msg_handler(pmt.intern('nal_in'), self.handle_msg)

    def handle_msg(self, msg):

        ## 每次过来一个NALU
        payload = pmt.to_python(pmt.cdr(msg))
        payload_len = len(payload)

        ## create a numpy array of type 'int' with preamble and sync word
        buf = np.array([], dtype=int)

        ## payload length
        buf = np.append(buf, (payload_len >> 8))
        buf = np.append(buf, (payload_len & 255))

        ## payload type
        buf = np.append(buf, (0 >> 8))
        buf = np.append(buf, (0 & 255))

        ## append original payload
        buf = np.append(buf, payload)

        ## padding bytes
        padding = []
        for i in range(0, self.padding_bytes):
            random_byte = random.randint(0, 255)
            padding.append(random_byte)
        buf = np.append(buf, padding)

        ## save final numpy array as byte array (requires 'import array')
        byte_array = array.array('B', buf)

        ## create PMT u8vector using byte array
        pdu_pmt = pmt.cons(pmt.PMT_NIL, pmt.init_u8vector(len(byte_array), (byte_array)))
        self.message_port_pub(pmt.intern('dln_out'), pdu_pmt)
```

![ ](./image/G3/sdr/qpsk-rx-202307.png)

```
import numpy as np
from gnuradio import gr
import pmt
import array
import random

class blk(gr.sync_block):
    """Parsing DLN Packet"""
    def __init__(self, padding_bytes=110):
        gr.sync_block.__init__(self,
            name = "DLN_Unpacking",
            in_sig = None,
            out_sig = None)

        self.padding_bytes = padding_bytes

        self.message_port_register_in(pmt.intern('dln_in'))
        self.message_port_register_out(pmt.intern('nal_out'))
        self.set_msg_handler(pmt.intern('dln_in'), self.handle_msg)

    def handle_msg(self, msg):

        ## 每次过来一个DLN frame
        dln_packet = pmt.to_python(pmt.cdr(msg))

        payload_len_msb = dln_packet[0]
        payload_len_lsb = dln_packet[1]

        payload_len = (payload_len_msb << 8) + (payload_len_lsb & 255)

        payload = dln_packet[4 : (4 + payload_len)]

        ## save final numpy array as byte array (requires 'import array')
        byte_array = array.array('B', payload)

        ## create PMT u8vector using byte array
        pdu_pmt = pmt.cons(pmt.PMT_NIL, pmt.init_u8vector(len(byte_array), (byte_array)))
        self.message_port_pub(pmt.intern('nal_out'), pdu_pmt)
```

------

2023-02-10

![ ](./image/G3/sdr/system.png)

物理层以上的每个环节，都是长江黄河，可以认为是不限流的，至少是远大于物理层速率的。上层不关心（也难以精确控制）绝对速率，只关心逻辑帧的组织方式和同步关系。

而物理层是一个水泵，它只能以**固定**的速率传输比特流，不快，也不慢。物理层自身的速率（比特率），仅由物理层自身的参数，如采样率、每个码元的采样点数等参数决定，这也与加窗参数等共同决定了信号的最大占用带宽。不管输入的是波涛汹涌还是涓涓细流，水泵都是以固定的流量去抽水。只不过，长江黄河由于源头流量够大，可以保证水泵不断流，代价就是输入端的FIFO会积压；而小池塘就难免“吃不饱”，输入FIFO并不会积压，数据一旦过来就被抽走，就像用吸管去吸快要喝完的酸奶一样，会混入空气。如果在传输的信号中混入了“空气”，载波没有受到调制，频谱缩成一条线，会影响Rx端的时钟同步。

物理层并不关心比特流的内容，也不关心上层逻辑帧以什么速率去传输，这些都是在上层去控制。例如TP层控制Padding长度，以控制音频帧的传输速率。**物理层每传输一个比特，都需要一定的时间，因而物理层比特率实际上确定了一个物理FIFO/Source/Sink的实际吞吐率/生产率/消费率。**假设物理层的比特率是固定的500kbps，那么，24ms内可以（需要）发送12kb的数据，物理层并不关心这24ms内传输了什么。因此，为了实现音频帧速率的稳定，每发送一个音频帧之后，都要接着发送一些Padding数据，再发送下一个音频帧，而发送Padding数据的目的，就是使得两个音频帧之间经过24ms（或者说发送了12kb的数据）。接收端也会以同样的速率收到音频帧。而为了实现音视频数据的复用，实际上是采取了一种时分复用的方式，可以在发送Padding数据的时间窗内，划出一部分时间，用于传输视频帧。而发送视频帧的时机，由应用层根据绝对时间戳去大致确定；Rx端根据时间戳去精确控制回放时间同步。

------

2023-02-08

关于无线音视频传输的最新进展：Rx端推流服务器原理验证成功。该服务器可以从GR获取应用层视频帧流，完成应用层分片重组，视频帧缓存，通过WebSocket推给网页播放器，网页播放器再次缓冲视频帧流，并负责帧率同步、视频解码、渲染绘制。目前存在潜在的性能问题，因各个环节的FIFO都是用最基本的Array实现的，有非常大的优化空间。

------

**音视频同步**

![ ](./image/G3/sdr/av-sync.svg)

2023-07-03：更新示意图

2023-02-05：关于Rx端播放器的音视频同步：视频帧率定为10fps，音频帧长度24ms，以第0帧为首帧，以音频帧为时间基准。当音频取得第n帧时，视频应当取得哪一帧？`floor(n / 25) * 6 + floor((n % 25) * 0.24)`

------

2023-02-04

![视频帧格式](./image/G3/sdr/video-frame-format.png)

------

![四层协议栈](./image/G3/sdr/protocol-layers.svg)

2023-02-13更新：MMM多媒体复用层，逻辑上由若干个slot构成，MMM层的一个逻辑报文称为一个group，即一个group由若干个slot构成。一般第一个slot固定为音频帧，而其余slot用于传输视频MCS分片、或者其他轨道。但是为了使得group能够在各种网络上传输，借鉴H.264的NAL和TS的分包思路，如果需要传输group，则可以将其切分成若干个packet。每个packet的尺寸可以灵活调整，使其不大于网络的MTU。packet自带前导码（同步字），目前设置为`BD4SUR\x00M`，用于经过流式传输的信道后，在Rx端可以恢复packet的边界。这样做的目的是将上层协议与同步层和数据链路层解耦，处理上层协议的进程，可以通过各种信道（如socket、FIFO等）将上层协议报文传递给SDR接口层。

2023-02-03：设计了一个四层协议栈，物理层目前是QPSK，数据链路层处理字节定界和CRC，传输层负责流量控制（以实现音视频流的同步传输），应用层处理一切与音视频编码和直播相关的事情。Tx端已经实现了此协议栈，解决了物理层“吃不饱”的问题。明天在Rx端实现此协议栈。关于应用层报文分片的问题，还需要仔细研究。分开容易，拼接起来难。不过并不打算在视频编码中引入双向参考的帧间预测，所以问题稍微简单些。

2023-02-03：早在玩无线电之前就实现了一个极为简单的静止图像压缩编码的实验原型，实际上就是去掉了Huffman编码和JFIF的JPEG。视频编码的核心技术在我看来就是量化因子、熵编码码表之类的东西，这些东西的背后是真金白银和调查研究，不是在实验室里拍脑袋就能想出来的。现在的任务就是：①改造成视频编码，设计码流封装格式和定时同步方案；②研究如何实现播放器；③研究加入帧间预测编码。实际上还是如前所说，任何一个编码工具的引入，后面都要有相应的熵编码去支撑，而取得熵编码表是困难的。

------

2023-02-02

新需求：做个原型，支持音视频同步传输，目标是BadApple!，不使用现有视频压缩编码标准，自行开发某些基于简单变换的编码算法及其封包格式，以及音画同步算法，传输画幅小、帧率慢、色彩深度有限的动态图像序列。

------

2023-02-01

实现了同步的音频流传输。现在的想法是参考蓝牙HFP、HSP、A2DP做一些上层的东西，比如PBC，比如音量控制等等。

------

2023-01-28

去年7月实现了QPSK数字音频无线传输，当时传输的是MP3裸流，没有任何上层协议和定时同步机制，算不上是“实时”传输（不是说传得快就叫“实时”）。下一步打算：仍然是做窄带数字音频传输，①调制方式改为OFDM；②设计上层协议，实现真正的实时音频传输；③参照DRM，使其支持多种业务（音频、文本消息等）、同时传输多个节目、或两者兼有；④针对各类信道、各类场景，做实际通联试验。不是很想照搬现有的协议，如RTMP之类的，毕竟我们是业余无线电嘛，那些东西都太专业了。不过参考肯定是要参考的。

2023-01-31：学习Reed-Solomon编码。

------

2022-05-24

GNURadio发射电脑播放的声音：1）安装pavucontrol；2）Audio Source 填写 “pulse”。

------

2022-07-04

最近状态逐渐恢复，重新开始玩SDR。因为是无线电，必然涉及收发至少两端，所以分布式版本控制的重要性就凸显出来了。目前在NUC盒子上建立局域网Git服务器，所有SDR方面的设计资料通过它来同步和管理，使用体验还算凑合。另外，SDR接收机对电脑性能要求很高。大学时代的旧笔记本是十年前的古董，酷睿3代，跑QPSK接收机已经是断断续续、基本不可用了。软件无线电虽然叫“软件”无线电，但是在性能敏感的场景下，还是要硬起来才行。比如把接收机算法前移到FPGA上，等等。

------

2022-07-04

说到当年做的MP3编码器，性能很差，勉强达到了实时编码的程度，这还是在没有心理声学模型、开最高码率的条件下。直觉上认为性能瓶颈是构建比特流时采用了字符串操作（而非位操作），但经过分析后发现，瓶颈在于量化过程中的分数次幂运算。因此做文献调研的时候，发现多数论文做性能优化都是在此处着力。方法有很多，比如分段线性逼近之类的。如果有空的话，或许我应该研究一下。

另外一个很重要的特性就是支持实时流，这个是后面构建进一步自主化的音频数字传输系统所必备的。当然，解码器我不想做，一是因为它是编码器的子集，做起来没意思；二是因为解码器要处理的情况反而比较多，工程上比较复杂，现在没有那个耐心。

------

2022-07-08

① MP3选用128kbps码率，SDR设备采样率选用2MHz，则QPSK的理论每符号采样点数sps为 2MHz × 2bit/sym ÷ 128kbps = 31.25 samples/sym。占用带宽为2MHz ÷ 31.25sps = 64kHz。
② 发射端发射一段时间后，信号会出现断续，目前尚不清楚原因所在，计划换一台性能高一点的计算机，看看效果如何。
码率降低可以节省带宽，避免发射端吞吐不足；但是低码率又势必会提高编码延迟，反过来拖累吞吐，合着横竖都不好过，唉，还是对编码器开刀吧，编码速度没有三五十倍实时还好意思叫编码器吗？

------

2022-07-11

针对朴素QPSK发射机因输入信号本身存在的某些特殊模式导致发射频谱间或“收缩”成几条谱线进而导致接收机难以执行同步的问题，应引入加扰scrambler模块，使待发射的码流变成具有伪随机特性的码流，以解决上述问题。至于加扰为什么有利于定时同步，可以跟前段时间了解到的dithering联合起来看。加扰使得信号更加“随机”，更加白色，也就是熵比较高，有利于充分利用信道。加扰使得时域信号不至于出现连续0或1。加扰还有保密和区分用户（多址）的好处。

而交织是打乱比特顺序，主要是为了便于在信道衰落等原因导致偶然误码的情况下，纠错码可以成功纠错，就是为了避免一死死一片。

今天调研这个加扰模块的时候，了解到线性反馈移位寄存器LFSR，这东西可以用来生成伪随机数。

翻阅《通信原理》给大脑充电，了解到数字基带信号的一种非常有价值的分析方法：把基带信号分为“稳态波”和“交变波”两部分。前者可视为时钟，其频谱为离散谱；后者真正携带信息，其频谱与基带信号的统计分布有关，是连续谱，占据一定的带宽。所以当基带信号出现某些规律模式（比如全0）的时候，交变波分量很弱以至于消失，于是频谱只剩下时钟信号所对应的几条离散谱线。

直接在信号流中（不按照正确的使用方式）插入加扰模块，频谱±1/4带宽处出现两个坑。由于gr的scrambler模块是“bit-wise”的，送给QPSK调制器的每个字节，都只有最低位有效，其余7位都是0。而QPSK调制是每2bits对应一个符号，也就意味着发射出去的符号是3个0符号跟一个随机的0/1符号。这就可以视为某种意义上的四分频，有效带宽实际上只有实际QPSK带宽的四分之一。


# GNU Radio

- [GNU Radio 入门之旅](https://www.cnblogs.com/WindyZ/p/10284473.html)
- [GNU Radio 中文社区](http://gnuradio.microembedded.com/)
- [GNU Radio 教程](https://www.white-alone.com/GNURadio%E6%95%99%E7%A8%8B_1/)

2022-03-09：玩了三天GNURadio，收获比读一百本书还要大。今天画了个SSB发射机，相移法实现。然而实际发射出去的电波，在接收机的频谱上，存在一个十分扎眼的载波，而理论上是不应该有载波的。经过一番分析，认为可能是IQ路径上存在直流所致。于是在发射前暂且对一路分量进行补偿，发射期间拖动滑块改变补偿量，可以在接收机的频谱上观察到载波强度的显著变化，说明补偿是有效的。载波泄露可能还跟本振馈通等因素有关，这些都有待研究。存在的问题还有另一侧边带仍有残余，以及发射机自身的频偏问题，等等。

## 搭建 GNU Radio 3.8 研发环境

**从源码编译安装 GNU Radio 3.8 基本环境**

首先安装依赖（[参考](https://wiki.gnuradio.org/index.php?title=UbuntuInstall#Focal_Fossa_.2820.04.29_through_Impish_Indri_.2821.10.29)）：

```
sudo apt install git cmake g++ libboost-all-dev libgmp-dev swig python3-numpy \
python3-mako python3-sphinx python3-lxml doxygen libfftw3-dev \
libsdl1.2-dev libgsl-dev libqwt-qt5-dev libqt5opengl5-dev python3-pyqt5 \
liblog4cpp5-dev libzmq3-dev python3-yaml python3-click python3-click-plugins \
python3-zmq python3-scipy python3-gi python3-gi-cairo gir1.2-gtk-3.0 \
libcodec2-dev libgsm1-dev
```

从源码安装（[参考](https://wiki.gnuradio.org/index.php?title=InstallingGR#From_Source)）：

```
cd ~
git clone https://github.com/gnuradio/gnuradio.git
cd gnuradio
git checkout maint-3.8
git submodule update --init --recursive
mkdir build
cd build
cmake -DCMAKE_BUILD_TYPE=Release -DPYTHON_EXECUTABLE=/usr/bin/python3 ../
make -j4 (Number of CPU Cores for compiling)
sudo make install
sudo ldconfig
```

设置环境变量（[参考](https://wiki.gnuradio.org/index.php?title=ModuleNotFoundError)）  :

```
# Use the following command to locate Python path (for Ref.):
find $(gnuradio-config-info --prefix) -name gnuradio | grep "packages"
```

在`/etc/profile`末尾添加：

```
export PYTHONPATH=/usr/local/lib/python3/dist-packages:/usr/local/lib/python3.8/dist-packages:$PYTHONPATH
export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
```

执行`source /etc/profile`并重启`sudo reboot`。

**安装KC908接口库和OOT模块**

首先[下载](https://www.kechuang.org/t/86100)，路径中不能出现汉字。先安装接口库，再安装GR的OOT模块。

**安装RTL-SDR和HackRF的接口库和OOT模块**

必须**按顺序**安装以下组件：

安装RTL-SDR：`sudo apt install librtlsdr-dev`

安装HackRF：`sudo apt install hackrf libhackrf-dev`

<details>
<summary>安装libosmocore（不需要，仅供参考）</summary>

安装[libosmocore](https://osmocom.org/projects/libosmocore/wiki/Libosmocore)

```
sudo apt-get install build-essential libtool libtalloc-dev libsctp-dev \
shtool autoconf automake git-core pkg-config make gcc gnutls-dev \
libusb-1.0.0-dev libmnl-dev

# Maybe not install this:
sudo apt install python-minimal

sudo apt-get install libpcsclite-dev
cd ~
git clone git://git.osmocom.org/libosmocore.git
cd libosmocore/
autoreconf -i
./configure
make
sudo make install
sudo ldconfig -i
```

</details>

安装[gr-osmosdr](https://github.com/osmocom/gr-osmosdr)：

首先直接下载代码仓库`https://gitea.osmocom.org/sdr/gr-osmosdr/src/branch/gr3.8`到`~/gr-osmosdr`目录。

~注意：仓库中有部分代码使用了`boost::chrono`，这会导致最终编译出的so出现无法解析的符号，报`undefined symbol: _ZN5boost6chrono12steady_clock3nowEv`错误。其原因可以参考[这里](https://sources.debian.org/patches/gr-iio/0.3-9/)。因此，在编译之前，务必将`lib/CMakeLists.txt`中涉及这个问题的编译选项关闭掉。具体来说，就是注释掉208行附近RFSPACE相关的选项，以及240行附近FreeSRP相关的选项。~然后执行：

```
mkdir build
cd build
cmake ..
make
sudo make install
sudo ldconfig
```

装好后，执行以下命令以测试（详见[这里](https://osmocom.org/projects/rtl-sdr/wiki/Rtl-sdr)）：

```
hackrf_info
rtl_test
rtl_adsb
rtl_fm -f 97500000 -M wbfm -s 200000 -r 48000 - | aplay -r 48000 -f S16_LE
```

**安装GQRX**

首先安装依赖：`sudo apt install qt5-default libqt5svg5-dev`

从源码编译安装：

```
cd ~
git clone https://github.com/gqrx-sdr/gqrx.git
cd gqrx
mkdir build
cd build
cmake ..
make -j4
sudo make install
sudo ldconfig
```



## gr-gsm

安装RTL-SDR接口库之后，按照[这篇文档](https://osmocom.org/projects/gr-gsm/wiki/Installation)的指示，编译安装。

[GitHub Wiki](https://github.com/ptrkrysik/gr-gsm/wiki/Passive-IMSI-Catcher)

# HackRF + PortaPack H2

![HackRF框图（[来源](https://hackrf.readthedocs.io/en/latest/hardware_components.html)）](./image/G3/sdr/HackRF-Block-Diagram.png)

- [hackrf.net](https://www.hackrf.net/)
- [HackRF on GitHub](https://github.com/mossmann/hackrf)
- [HackRF official](https://greatscottgadgets.com/hackrf/)
- [PortaPack H1 (Sharebrained)](https://github.com/sharebrained/portapack-hackrf)
- → [PortaPack Havoc (H1 firmware)](https://github.com/furrtek/portapack-havoc/)
- → [PortaPack Mayhem (H1/H2, 在用)](https://github.com/eried/portapack-mayhem)
- → [H1和H2的区别](https://github.com/eried/portapack-mayhem/wiki/Differences-Between-H1-and-H2-models)
- [GSM扫描 (by BH1RLW)](https://github.com/scateu/kalibrate-hackrf)
- → [一个类似的项目](https://github.com/ptrkrysik/gr-gsm)

# RTL-SDR

![上变频版](image/G3/rigs/rtl-sdr.jpg)

![上变频版](image/G3/rigs/rtl-sdr-fm.jpg)

![RTL-SDR框图](./image/G3/sdr/RTL-SDR-Block-Diagram-2.png)

![RTL-SDR框图](./image/G3/sdr/RTL-SDR-Block-Diagram.png)

![RTL-SDR行为级模型](./image/G3/sdr/RTL-SDR-Behavioral-Model.png)

![RTL2832U框图（来自Datasheet）](./image/G3/sdr/RTL2832U.png)

![R820T框图（来自Datasheet）](./image/G3/sdr/R820T.png)

[RTL-SDR电视棒快速上手指南](https://www.rtl-sdr.com/rtl-sdr-quick-start-guide/)

要点总结：

- 采样率高于2.56Msps（也有说是2.4的）会丢采样。详见[这里](https://www.reddit.com/r/RTLSDR/comments/1r5d6l/32_mss_on_usb_30_ports_without_lost_samples/)。
- RTL2832U原本有IQ两路模拟输入，以兼容零中频结构的前端。但是对于R820T2这类混频前端，实际上只利用了2832的I通道，Q通道被闲置。因此可以将外部信号直接馈入Q通道，实现短波接收等功能。

参考资料：

- https://www.rtl-sdr.com/
- http://superkuh.com/rtlsdr.html
- [TerayTech：RTL-SDR的原理与结构](https://www.bilibili.com/video/BV1n7411z7MZ)
- [关于RTL-SDR的实验讲义](http://www.eas.uccs.edu/~mwickert/ece4670/lecture_notes/Lab6.pdf)（失效连接）
- https://www.kechuang.org/t/81349
- https://microhams.blob.core.windows.net/content/2017/03/RTL-SDR-dongle.pdf
- [有关R820T和R820T2的一些定性对比](https://hamradioscience.com/rtl2832u-r820t-vs-rtl2832u-r820t2/2/)
- [如何降低RTL电视棒的噪声](https://ham.stackexchange.com/questions/1174/how-can-i-reduce-the-noise-coming-in-from-an-rtl-sdr-dongle)
- Stewart R W, Barlee K W, Atkinson D S W. **Software defined radio using MATLAB & Simulink and the RTL-SDR**\[M\]. Strathclyde Academic Media, 2015.（[下载电子书](https://www.desktopsdr.com/download-files)）
- [关于“超外差”](https://zhuanlan.zhihu.com/p/115333800)

# WebSDR

- [websdr.org](http://websdr.org/)

# 心得记录

## SDR软件的交互设计问题

刚开始用HDSDR的时候，LO和Tune两个调谐选项让我十分困惑。但是我看过他们的FAQ之后，认为这实在是非常科学。原因大概有两点：

- 908型收音机能够提供宽达几十MHz的中频带宽，很多时候，是将LO（即频谱中心位置）调谐到一个合适的位置，然后手动在全景频谱中寻找感兴趣的信号，对其进行解调，此时解调通带中心（载波）位置即为Tune频率。
- 908型收音机直接输出未经变频的IQ信号（零中频），存在本振泄露问题，因而频谱中心位置存在一个尖峰。这种情况下，在频谱中心频率解调是不合适的，因而需要使感兴趣的解调频率偏离本振一点儿。但也不能偏离太远，因为中频通带似乎不是完全平坦的。从HackRF的瀑布图可以看出一些端倪。

像705型收音机，可显示的中频带宽仅1MHz。它在HF波段采取射频直采+数字IQ解调方案，VU段采取模拟下变频到38.85MHz的中频再数字解调的方案，本振泄露问题似乎不大，至少频谱图上是看不到的。因此默认LO频率即为解调频率，可以用一个大旋钮同时调节LO和解调频率，这也是传统的standalone业余电台最常用的交互逻辑。

我是用SDRsharp入门的，对它更熟悉一点。它的顶部显示的频率实际上相当于HDSDR的Tune频率，但是操作上也可以在固定LO的情况下手动拖动解调频率。这种情况下，解调频率和本振频率二者之间的联动，还是比较令人迷惑的。当然啦，这是交互设计的问题。只要理解它背后的RF原理，我觉得都是可以接受的。HDSDR现在在我看来也不是那么难用了。
