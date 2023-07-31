#!title:    软件无线电
#!date:     2020-12-08

#!content

![2022年3月13日，使用GNURadio测试SDR单边带发射机](./image/G3/sdr/gnuradio-ssb-tx-test.jpg)

# GNU Radio

- [GNU Radio 入门之旅](https://www.cnblogs.com/WindyZ/p/10284473.html)
- [GNU Radio 中文社区](http://gnuradio.microembedded.com/)
- [GNU Radio 教程](https://www.white-alone.com/GNURadio%E6%95%99%E7%A8%8B_1/)

2022-03-09：玩了三天GNURadio，收获比读一百本书还要大。今天画了个SSB发射机，相移法实现。然而实际发射出去的电波，在接收机的频谱上，存在一个十分扎眼的载波，而理论上是不应该有载波的。经过一番分析，认为可能是IQ路径上存在直流所致。于是在发射前暂且对一路分量进行补偿，发射期间拖动滑块改变补偿量，可以在接收机的频谱上观察到载波强度的显著变化，说明补偿是有效的。载波泄露可能还跟本振馈通等因素有关，这些都有待研究。存在的问题还有另一侧边带仍有残余，以及发射机自身的频偏问题，等等。

## 安装 GNU Radio 3.8

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

Setting the env variables（[参考](https://wiki.gnuradio.org/index.php?title=ModuleNotFoundError)）  :

```
# Use the following command to locate Python path (for Ref.):
find $(gnuradio-config-info --prefix) -name gnuradio | grep "packages"
```

在`/etc/profile`末尾添加：

```
export PYTHONPATH=/usr/local/lib/python3/dist-packages:/usr/local/lib/python3.8/dist-packages:$PYTHONPATH
export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH
```

Execute `source /etc/profile` and reboot.

## KC908接口库安装

- https://www.kechuang.org/t/86100
- 先安装接口库
- 安装GR的OOT模块

## RTL-SDR

必须**按顺序**安装以下组件：

安装：`sudo apt install librtlsdr-dev`

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

安装[gr-osmosdr](https://github.com/osmocom/gr-osmosdr)

```
cd ~
git clone git://git.osmocom.org/gr-osmosdr
git checkout gr3.8
cd gr-osmosdr/
mkdir build
cd build/
cmake ../
make
sudo make install
sudo ldconfig
```

装好后，执行以下命令以测试（详见[这里](https://osmocom.org/projects/rtl-sdr/wiki/Rtl-sdr)）：

```
rtl_test
rtl_adsb
rtl_fm -f 97500000 -M wbfm -s 200000 -r 48000 - | aplay -r 48000 -f S16_LE
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
