#!title:    计算机备忘录

#!content

# 嵌入式系统·开发板

## ESP32

开发板：ESP32-DevKitC V4

[官方指南](https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32/hw-reference/esp32/get-started-devkitc.html#get-started-esp32-devkitc-board-front)

![ ](./image/G3/mcu/esp32-devkitC-v4-pinout.png)

ESP32-WROVER-IE

[官方指南](https://docs.espressif.com/projects/esp-idf/zh_CN/v3.3.1/get-started/index.html)

## NodeMCU/ESP8266

2017-02-11

**NodeMCU端口布局**

![NodeMCU端口与ESP12的连接关系](./image/G3/mcu/NodeMCU-ports.png)

![NodeMCU原理图](./image/G3/mcu/NodeMCU-schematic.png)

**NodeMCU端口编号**

|NodeMCU编号|ESP模块编号|Arduino编号|备注|
|------|
|D0|GPIO16|16|下拉使能板载LED|
|D1|GPIO5|5||
|D2|GPIO4|4||
|D3|GPIO0|0|带3V3上拉|
|D4|GPIO2|2|带3V3上拉|

**NodeMCU I2C配置**

只有D3、D4可以方便地设置为I2C总线，因其带有上拉电阻。尽管其他端口均可通过软件设置为I2C总线，但是需要外部上拉。

使用以下Arduino函数设置I2C总线：

```
begin(SDA=0, SCL=2)
```

即，默认D3接器件的SDA，D4接器件的SCL。

## 树莓派

![ ](./image/G3/mcu/Raspberry-Pi-4.jpg)

**树莓派ZeroW开机自动登录root用户**

注意：危险操作。除非不打算联网，否则不要这样。

[参考](https://blog.oddbit.com/post/2020-02-24-a-passwordless-serial-console/)（已保存）

------

2017-02-13

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

## Edison开发板

2017-03-11

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

安装必要软件：

```
opkg update
opkg install lighttpd-module-cgi
opkg install lighttpd-module-scgi
opkg install lighttpd-module-fastcgi
opkg install nodejs-npm
opkg install sqlite3
opkg install php
```

**PHP+lighttpd配置**：修改`/etc/lighttpd.conf`，加入

```
server.modules += ( "mod_fastcgi" )
fastcgi.server = ( ".php" =>
  (( "socket" => "/tmp/php-fastcgi.socket",
    "bin-path" => "/usr/bin/php-cgi",
     "min-procs" => 1,
     "max-procs" => 1,
     "max-load-per-proc" => 4,
     "bin-environment" => (
     "PHP_FCGI_CHILDREN" => "2",
        "PHP_FCGI_MAX_REQUESTS" => "10000" ),
      "bin-copy-environment" => (
        "PATH", "SHELL", "USER" ),
      "broken-scriptfilename" => "enable",
     "idle-timeout" => 20
  ))
)
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

- Intel Edison智能硬件开发指南
- [https://github.com/cheaven/edison_native]()
- [http://www.dfrobot.com.cn/community/thread-12877-1-1.html]()

</details>

# Galileo开发板

本文最后建立基线的日期是2017-10-18。

<details>

<summary>展开</summary>

**0.引言**

去年（2016年）暑假，偶然发现Intel在2013年推出的Galileo开发板（一代）。因为颜值很高，所以就入手了两块，一块用来把玩，另一块用来收藏。

Intel与Arduino合作推出Galileo的初衷是推销自家的Quark SoC，希望在物联网市场上有所作为。为了帮助开发者快速将原型转化为产品，Intel开源了电路图、BOM、PCB设计、Datasheet等文档。操作系统使用Yocto Linux。Intel用Curie（居里）、Edison（爱迪生）、Joule（焦耳）、以及Galileo（伽利略）等物理学家的名字命名自家开发板，产品包装上的口号——“What will you make?”——让开发者非常excited。然而，据今年（2017年）6月的消息[[1]](#参考资料与文献)，Galileo、Edison和Joule三款开发板将在年内停产，Curie SoC也将停产，简直是创业未半而中道崩殂。

Quark X1000 SoC是Intel研制的一款低功耗x86架构的SoC，Galileo也成为市面上为数不多的一款基于x86的开发板。实际上，包括Galileo在内的一众Intel开发板一直备受吐槽，吐槽的点不外乎价格贵、性能弱、功耗高、资料少等方面，每一个方面对于开发板而言貌似都是比较致命的劣势。与市场上久经考验的基于ARM的各种派相比，Intel开发板的生态很差，定位不明且两极分化；再者，尽管x86非常好用，但吓人的功耗天然地绝缘了x86与IoT领域。根据Intel官网提供的数据，Galileo的功率为2.2~2.5W，并不是很令人满意，后续推出的Edison在性能和功耗方面则找到了很好的平衡。并且，X1000作为第一版Quark，存在一个比较严重的Bug：含有LOCK前缀的原子指令不可用。这个Bug严重影响原生多线程的实现，因此诸如Debian的一般的Linux发行版无法正常在Galileo上运行。为规避此问题，Intel在工具链中增加了一个代码生成选项，该选项可以生成不含LOCK指令的代码，官方提供的Yocto就是使用这个工具链编译生成的，因此可以在Galileo上正常运行。当然，涉及到多线程的场景，性能都很差。例如，SSH连接速度极慢，lighttpd的Python CGI响应极慢而异步单线程的Nodejs非常快，等等。

Galileo（一代）是Intel进军IoT开发板市场的首款产品，所以设计上有诸多硬伤，并且定位相当不清晰，属于试验性产品。后续推出的二代板大幅提升了I/O性能，但基本上是换汤不换药的水平[[2]](#参考资料与文献)。在市场上有众多物美价廉的开发板可供选择的当下，Galileo已经可以列入“不推荐”名单了，进一步说，Galileo是一款过时的产品。

之所以购买Galileo，主要是因为**板子漂亮、做工精致**，摆在书架上，就像一件精致的手办。其次是Arduino兼容，有许多现成的Arduino库和示例程序，上手成本比较低。买来的虽然是二手货，但实际上是没开封的全新品。开箱过程就不细说了，可参考[[3]](#参考资料与文献)等评测文章。

![图1 Galileo Gen1 正面SoC特写](./image/G3/mcu/galileo-soc.jpg)

**1.上手准备**

Galileo板子非常漂亮，尺寸比Arduino和树莓派略大，但也只是手掌大小，比想象中小很多。GPIO布局和Arduino基本一致，这意味着很多Arduino Shield都可以用到Galileo上。中间那个BGA封装的芯片，就是Quark SoC，运行时表面温度比较高，以至于盒子里的安全说明特地提示用户不要用手触摸SoC。

**1.1 资源与接口**

拿到一块开发板，或者说任何一个系统，首先要了解的就是它提供怎样的接口。图2是Galileo开发板提供的接口和主要板载设施。

![图2 Galileo Gen1接口示意[[5]](#参考资料与文献)](./image/G3/mcu/galileo-components.jpg)

作为一款比较高端的开发板，Galileo支持以太网、RS232（虽然并没有什么卵用）、USB2.0、PCIe等多种高级接口，尤其是PCIe接口，大大增强了Galileo的可拓展性。关于接口的细节问题，例如GPIO的驱动能力、跳线设置等，在英特尔提供的Datasheet[[4]](#参考资料与文献)和使用说明书[[5]](#参考资料与文献)中都有比较详细的说明。这里需要说明的是，Quark SoC只提供了两个支持外部中断的GPIO（位于Arduino IO 2、3），其余所有GPIO和PWM都是由CY8C9540A扩展芯片从I2C总线（100kHz）上扩展出来的。因此，这种设计尽管很好地保护了SoC，也提供了多电平兼容的能力，但是带来的性能损失是非常严重的，甚至无法软件实现1-wire总线这样的逻辑（见参考资料[[6]](#参考资料与文献)[[7]](#参考资料与文献)），因此英特尔在Galileo Gen2中对IO扩展电路作了重大修改，极大地提高了IO性能。资料[[2]](#参考资料与文献)中详细评估了Gen2的性能提升水平。

为了理解Galileo的奇葩设计，必须有系统框图（图3）才能理解这里面的细节。

![图3 Galileo Gen1系统框图[[4]](#参考资料与文献)](./image/G3/mcu/galileo-diagram.jpg)

另一点比较奇葩的是，比较重要的串口竟然使用3.5毫米音频接口，RS232电平，这可以说是非常反人类了。尽管这种设计并非不常见，但对于一款2013年出品的开发板来说，对开发者是非常不友好的。Gen2则知趣地取消了这个设计，改为开发者喜闻乐见的TTL串口插针。Edison的底板则更为人性化，自带串口转USB的FT232模块，非常方便。

板子右上角是一块SPI接口的Flash，存有一个小型的Yocto Linux作为无卡情况下引导的系统。Intel官网上提供了固件和更新工具，可以用来更新这块Flash里面的固件，当然，也可以使用旁边的SPI插针。在不插卡的情况下，也可以将Galileo作为一块Arduino使用，但是下载的Sketch并不会写入Flash中的文件系统，重启后就消失了；如果使用SD卡中的Linux系统则可以永久保存。

整体的介绍就到这里，下面是使用前的准备步骤。

**1.2 使用前准备**

**(0) 软硬件准备**

开始操作前，首先准备好下列软件：

- [SDFormatter](https://www.sdcard.org/downloads/formatter_4/)，用于格式化SD卡
- [Win32 Disk Imager](http://sourceforge.net/projects/win32diskimager)，用于制作系统SD卡
- PuTTY等远程终端
- FileZilla等FTP工具
- Arduino IDE 1.6.8，并下载Galileo开发板所需文件
- Intel XDK（非必需）

线材暂时需要这些：

- microUSB数据线
- microUSB转USB Type-A转接线
- USB Hub，最好是有源的
- 以太网线

最好再准备一条3.5mm转RS232的串口线，方便使用串口终端。如果使用笔记本电脑，那么还需要一个RS232转USB的转接器。

需要特别注意的是：[[#ff0000:**必须在接通5V电源之后，再插入USB线。因为Galileo开发板启动瞬间电流较大，若接通电源前就接通USB，有烧毁开发板或者电脑的危险。下述诸步骤必须遵守此原则。**#]]这也是官方文档中反复强调的一点。

**(1) 板载固件更新**

开始使用前，最好是更新一下板载Flash里面的固件。在[这里](https://downloadcenter.intel.com/download/26417/Intel-Galileo-Firmware-Updater-and-Drivers)下载固件和烧写工具，按提示更新板载固件。官方文档的说明非常清楚，操作比较简单，这里就不复述了。

**(2) 系统盘制作**

首先在[iotdk.intel.com](https://iotdk.intel.com/)下载IoT DevKit系统镜像压缩包，解压后会得到一个后缀为.direct的文件。使用Win32 Disk Imager将其写入SD卡，即完成系统盘制作。将SD卡插入Galileo的SD卡槽，插入串口线和以太网线，上电开机，Galileo便会从SD卡引导系统。

**(3) 登录系统**

如果有插入串口线，可以通过串口进入GRUB菜单，看到Linux启动时输出的日志。系统默认启用SSH服务，也可以使用SSH连接登录系统。以root**（没有密码）**登录Linux系统，即可进入字符终端。

**(4) 连接网络**

连接有线网络，只需要插入以太网线就可以。无线网络就比较麻烦，首先需要有一张PCIe的网卡。这里使用的网卡型号是Intel Centrino Advanced-N 6205 AGN，淘宝价格20元左右。网卡是半高的，购买时应当同时购买半高卡支架，否则很麻烦。断电状态下，将网卡插入开发板背面的mini-PCIe接口，开机后即可检测到网卡，并加载驱动。按照[入门指南](https://software.intel.com/en-us/get-started-galileo-windows-step4)的说明，执行如下操作：

- 执行`connmanctl`，然后`enable wifi`，然后`scan wifi`
- 键入`services`回车，找到要连接的那个SSID，把后面的一串复制下来
- 执行`agent on`，然后`connect <刚才复制的一串>`
- 按照提示输入密码，即可连接

需要说明的是，connmanctl这个东西有一套自己的术语，比如“service”就是指一种网络连接的配置。Service配置文件在`/var/lib/connman`目录下，一般来说，只要网络环境好，每次开机都可以自动连接无线网络。如果没有连接，可以手动执行`connmanctl connect wifi_xxx_xxx_managed_psk`进行连接。

**注意：如果开机前没有插入网线，则自动连接无线网络；连接无线网络后插入网线，仍然可以连接有线网络。若开机前已经插入网线，则不会连接无线网络。**

**(5) 系统时间设定**

与树莓派不同，Galileo带有RTC电池插针。Galileo的RTC电池使用普通的3V电池，例如常见的CR2032。首次启动，先执行以下命令设置时间。注意引号内的时间字符串是UTC时间，也就是北京时间向前调8个小时。

```
date -s "yyyy-mm-dd hh:MM:ss"
```

然后执行以下命令，将UTC时间写入硬件RTC。

```
hwclock -w
```

最后设置系统时间为中国标准时间CST，即完成时间设置。

```
cp /usr/share/zoneinfo/PRC /etc/localtime
```

**(6) 安装必需软件**

Yocto使用opkg进行软件包管理。顺序执行以下命令，安装一些常用的软件：

```
opkg update
opkg install lighttpd-module-cgi
opkg install lighttpd-module-scgi
opkg install lighttpd-module-fastcgi
opkg install nodejs-npm
opkg install sqlite3
opkg install python-opencv
```

[[#ff0000:**注意：不要使用iotdk软件源更新任何软件！经测试，nodejs升级之后无法正常工作。**#]]

**(7) 配置关机按键（2017-10-22）**

前段时间，由于频繁的强行断电关机，造成Galileo的文件系统损坏，具体表现是部分shell命令会报IO错误，sqlite数据库损坏，等等。但是，如果每次都通过SSH执行`poweroff`命令来关机，又非常麻烦。因此，这里将板子上的reset按钮改造成一个关机按钮：短按仍然是重启sketch，而长按则执行`poweroff`关机。下文描述的Galileo一代的解决方案。二代原理类似。

> 关于SQLite3“database disk image is malformed”错误（2018.2.22整理）：由于经常强行断电，文件系统和数据库非常容易损坏。为了从损坏的db中恢复文件，执行以下步骤（[参考资料](http://www.sunnyu.com/?p=201)）：

> 首先导出数据

> ```
$ sqlite3 my.db
sqlite>.output tmp.sql
sqlite>.dump
sqlite>.quit
```

> 再倒入到一个新库中

> ```
$ sqlite3 my_new.db
sqlite>.read tmp.sql
sqlite>.quit
```


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

**2.开始开发**

**2.1 Arduino Sketch**

由于nodejs和MRAA库的存在，Galileo上的Arduino开发不见得是最好的选择。但是，Arduino上积累了不少现成的项目，有些是可以拿来即用的。尽管如此，由于Galileo本身的特性，尤其是弱气的GPIO，导致很多器件不能（简单地）在Galileo上使用。最重要的一点是，必须弄清楚Galileo在系统中的地位：Galileo不是用来做前端的控制和采集，更多地是用来做存储和计算。例如，《[基于GP2Y10的简易灰尘检测仪](./20180124.html)》介绍了一个实用的空气质量检测仪。文中使用Arduino作为器件的控制板，而将数据库、服务器等高级功能布置在Galileo上。

**2.2 生Linux应用程序开发**

**原理剖析**

Galileo本质上是一款可以运行Linux的单板计算机，因此可以进行生·Linux用户态应用的开发。

英特尔提供的产品简介文档[[10]](#参考资料与文献)中说明了Galileo的软件架构。可见，Galileo的软件系统分为Bootloader、Linux操作系统和应用程序三个层次，Arduino Sketch实际上是运行在Linux操作系统上面的应用程序，位于`/sketch/sketch.elf`。在`/opt/cln/galileo`目录中，可以找到clloader。根据[[11]](#参考资料与文献)，clloader原本是给串口modem下载程序用的，后来被Intel改写，用于PC端Arduino IDE与Galileo的串口通信。Yocto Linux将与PC机通信的串口（包括3.5mm和USB client）抽象为`/dev/ttyGS0`设备文件，clloader即负责通过ttyGS0从PC机上接收交叉编译好的Sketch，并启动新下载的Sketch，同时备份旧Sketch。在PC端，经过开发板配置的Arduino IDE包含了Galileo交叉编译的全套工具链，以及封装好的[常用函数库](https://github.com/01org/corelibs-galileo)。若脱离Arduino IDE，使用[官网提供的工具链](https://downloadmirror.intel.com/24619/eng/galileo-toolchain-20150120-windows.zip)一样可以完成交叉编译。

可见，Arduino Sketch的开发过程是典型的Linux嵌入式开发。

**GPIO和低级总线操作**

操作系统将可用GPIO（包括控制复用器的内部端口）抽象为目录和文件，位于`/sys/class/gpio`目录下，直接读写这些文件即可操作GPIO。例如，执行

```
echo 3 > /sys/class/gpio/unexport
echo 3 > /sys/class/gpio/export
echo out > /sys/class/gpio/gpio3/direction
echo 1 > /sys/class/gpio/gpio3/value
```

将点亮板子上的LED。Arduino库的digitalWrite等函数的内部本质上就是这样的文件操作。但由于Quark内部的GPIO有两种，板子上的选通关系也比较复杂，所以接口内部的实现也有一些比较复杂的细节。参考资料[[2，3]](#参考资料与文献)详细分析了Linux系统中GPIO操作的原理，值得一读。

![图4 GPIO编号的对应关系](./image/G3/mcu/galileo-io.png)

I<sup>2</sup>C和SPI按照通常方法即可操作，唯一需要注意的是板子上有个跳线用来控制I/O扩展器的I<sup>2</sup>C地址。GitHub上已经积累了若干器件的API，直接拿来用就可以了。

**高级应用**

很多PC能做的事情，例如连接摄像头等外设进行图像处理、搭建HTTP服务器这些事情都可以做。以OpenCV图像处理为例：由于官方Yocto系统中已经集成了OpenCV，所以可以实现很多机器视觉的功能。但由于处理器速度是硬伤，所以不能跑太复杂的图像应用。

测试：运行下列Python代码，即可从USB摄像头捕捉图像，并且在上面添加文字并保存。

```
import cv2
import numpy as np

cap = cv2.VideoCapture(0)
ret,frame = cap.read()
cv2.putText(frame, 'BD4SUR\'s Galileo - OpenCV Python Test', (100,100),  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255),2)
cv2.imwrite("/home/root/haruhi2.png", frame, [int(cv2.IMWRITE_PNG_COMPRESSION), 0])
```

关于Python+OpenCV的更多内容可参考：

- [OpenCV-Python Tutorial](http://opencv-python-tutroals.readthedocs.io/en/latest/)
- [Python opencv 使用摄像头捕获视频并显示](http://blog.csdn.net/huanglu_thu13/article/details/52337013)

至于C语言的OpenCV使用，可以参考《Intel Edison智能硬件开发指南》书中的讲解，示例代码在 https://github.com/cheaven/edison_native 。

![图5 对摄像头捕捉的图像作Canny卷积，实时输出在SSD1306屏幕上](./image/G3/mcu/galileo-opencv-canny.jpg)

**2.3 使用Node.js开发物联网应用**

Intel提供了自家开发板的JavaScript集成开发环境——XDK。XDK包含丰富的示例程序，以及众多的基于MRAA库的元件库，可以供初学者快速上手。

MRAA库的[在线文档](http://iotdk.intel.com/docs/master/mraa/index.html)。

**参考资料**

+ [重磅！英特尔将要停产3款开发板，物联网之梦终于要醒了.](http://www.eeboard.com/news/wulianwang-4/)
+ [Intel Galileo Gen 2开发板的性能评估、使用技巧和实现分析.](http://www.csksoft.net/blog/post/306.html)
+ [Intel Galileo 开发板的体验、分析和应用.](http://www.csksoft.net/blog/post/304.html)
+ [Intel Galileo Datasheet.](https://www.intel.com/content/dam/www/public/us/en/documents/datasheets/galileo-g1-datasheet.pdf)
+ [Intel Galileo Board User Guide.](https://www.intel.com/content/dam/support/us/en/documents/processors/embedded-processors/galileo_boarduserguide_330237_002.pdf)
+ [Galileo+OneWire](https://communities.intel.com/message/245840)
+ [Using 1-Wire device with Intel Galileo](http://www.cnblogs.com/jikexianfeng/p/6279260.html)
+ [Getting Started with the Intel Galileo Board on Windows](https://software.intel.com/en-us/get-started-galileo-windows)
+ [Connecting to a Wi-Fi Network](https://software.intel.com/en-us/node/519955)
+ [Product Brief](https://www.intel.com/content/dam/support/us/en/documents/galileo/sb/galileoprodbrief_329680_003.pdf)
+ [clloader](https://github.com/01org/clloader/tree/galileo/bootloaders/izmir)

**重要资源导航**

- [Galileo产品首页](https://software.intel.com/en-us/iot/hardware/discontinued)（Intel弃坑Maker产品合集）
-[Galileo官方社区](https://communities.intel.com/community/tech/galileo)
-[Intel支持页](https://www.intel.com/content/www/us/en/support/products/78919/boards-and-kits/intel-galileo-boards/intel-galileo-board.html)
-[Arduino首页](https://www.arduino.cc/en/ArduinoCertified/IntelGalileo)
-[Galileo入门指南](https://software.intel.com/en-us/get-started-galileo-windows)
-[软件资源下载](https://downloadcenter.intel.com/search?keyword=Galileo)
-[文档资源](https://software.intel.com/en-us/iot/hardware/galileo/documentation)（不完全，更多文档需要在支持页查找）
-[IoT DevKit](http://iotdk.intel.com)（包含系统镜像、源码、软件仓库，以及MRAA和UPM的文档）
-[Galileo常见问题解答](https://www.intel.com/content/www/us/en/support/articles/000006413/boards-and-kits/intel-galileo-boards.html)
-[非官方软件源](http://alextgalileo.altervista.org/package-repo-configuration-instructions.html)（只可用于默认uClibc-based操作系统）
-[Arduino Galileo核心库](https://github.com/01org/corelibs-galileo)

**官方文档目录**：下列文档是Intel官方编写的支持文档，目录可能会有遗漏之处。后文中凡是引用官方文档的部分，都可以在这里找到，一般不显式注明。链接可能会失效，如果失效，可以从上面列出的地址搜索对应的文档。此外，笔者将抽时间将所有官方文档备份到网盘，并提供链接。

- [Datasheet](https://www.intel.com/content/dam/support/us/en/documents/galileo/sb/galileo_datasheet_329681_003.pdf)
- [Product Brief](https://www.intel.com/content/dam/support/us/en/documents/galileo/sb/galileoprodbrief_329680_003.pdf)
- [User Guide](https://www.intel.com/content/dam/support/us/en/documents/processors/embedded-processors/galileo_boarduserguide_330237_002.pdf)
- [Board Schematic](https://www.intel.com/content/dam/support/us/en/documents/galileo/sb/galileo_schematic.pdf)
- [IO Mappings](https://www.intel.com/content/dam/support/us/en/documents/galileo/sb/galileoiomappingrev2.pdf)
- [Quark X1000 Datasheet](https://www.intel.cn/content/www/cn/zh/embedded/products/quark/quark-x1000-datasheet.html)（失效）
- [Quark X1000 BSP Build Guide](https://www.intel.com/content/dam/support/us/en/documents/processors/quark/sb/quark_bspbuildguide_329687_001.pdf)
- [User Guide for Firmware Updater Tools](https://www.intel.com/content/dam/support/us/en/documents/galileo/intelgalileofirmwareupdateruserguide-1.0.4.pdf)
- [Quark BSP Download](https://downloadcenter.intel.com/download/23197/Intel-Quark-SoC-X1000-Board-Support-Package-BSP)

**其余参考资料**

- [Nav Linux](http://blog.dimitridiakopoulos.com/2014/03/18/navigating-linux-on-intel-galileo/)
- [Galileo Curriculum](https://www.intel.com/content/www/us/en/support/articles/000022551/programs.html)
- [Yocto Build x264 Error](https://www.intel.com/content/www/us/en/support/articles/000006363/boards-and-kits/intel-galileo-boards.html)
- [Power Consumption](https://www.intel.com/content/www/us/en/support/articles/000006250/boards-and-kits/intel-galileo-boards.html)
- [SystemD](http://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-commands.html)

</details>

# 计算器

![ ](./image/G2/calculator/hp_calculators.jpg)

CASIO fx-9750gII

CASIO fx-991ES Plus

CASIO fx-350MS

HP Prime G1 V2

HP 39gII

- [HP-39系列](https://calcwiki.org/HP-39%E7%B3%BB%E5%88%97)
- [ExistOS-For-HP39GII](https://github.com/ExistOS-Team/ExistOS-For-HP39GII)
- [HP 39gII 是怎么回事？](https://zhuanlan.zhihu.com/p/380273576)
- [被遗忘的非CAS神器：HP-39GII介绍与评测](https://www.cncalc.org/thread-8253-1-1.html)

HP 39gs


# PC处理器和整机

|型号|年代|跑分*|C/T|TDP|主频|工艺|能耗比|
|------------------------------------|
|Ryzen 7 5800H|21Q1|21624|8/16|45W|3.2GHz|7nm|480|
|i5-8500|18Q2|9543|6/6|65W|3.0GHz|14nm|147|
|i5-8259U|18Q2|8286|4/8|28W|2.3GHz|14nm|296|
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

## 松下中古笔记本

2023年5月，本台购置两台松下笔记本，分别是CF-SZ6和CF-SX2。这两款笔记本的详细配置参数如下表。

|参数|CF-SZ6|CF-SX2|
|------------------|
|CPU|Core i5-7300U|Core i5-3320M|
|GPU|核显|核显|
|RAM|DDR3L 8GB不可更换|DDR3L×2可更换|
|硬盘|M.2 SATA|SATA2|
|屏幕|1920×1200|1920×1080 TN|
|电源|16V输入|16V输入|
|USB|USB3.0×3|USB3.0×2 USB2.0×1|
|有线网络|RJ45以太网|RJ45以太网|
|无线网络|WiFi|WiFi|
|视频接口|VGA HDMI|VGA HDMI|
|音频接口|3.5mm耳麦合一|3.5mm耳麦分开|
|光驱|DVD|DVD|
|照相机|有|有|
|其他|||

- 轻盈。不到一公斤的重量，“轻若无物”，在任何场景下都不会带来很多负担。
- 小巧。虽然厚，但是12英寸的尺寸很好地兼顾了节约空间和操作上的舒适性，在户外架设电台等场景下，不会占用过多的桌面空间。
- 坚固。机器主体结构采用铝镁合金打造，宣称可以抵抗一般的跌落和挤压，这对于通勤携行、户外操作来说无疑是相当重要的。因此，很多汽修、机械、建筑工程等行业用户选择松下的笔记本。除了Let's Note系列之外，还有一个主打坚固耐操的系列“TOUGHBOOK”。
- 性能和续航的平衡。
- 设计理念。

- 文件服务器。选用FileBrowser，实现内网多台机器间文件的共享。
- Git服务器。选用gitea，这是一款开源的Git代码托管平台软件。设置私有代码托管平台，主要是出于两点考虑。一是SDR开发过程中，需要在多台机器之间管理和同步代码，同时还要保持版本控制的一致性，这种情况下就很有必要建立一个私有云内代码托管平台，集中式管理内网中所有的代码仓库。二是不信任公有云上的代码托管服务，如GitHub等等。众所周知，GitHub通过正常途径访问可谓困难重重，并且其自身的业务连续性也是不可控的，必须将自己代码托管在自有的环境中。
- 家居自动化控制台。虽然自己搭建家具自动化解决方案并非不可能，但是这显然不经济。在这种情况下，所谓的家居自动化控制台，更像是那种智能镜子，起到信息呈现和简单交互的功能，例如日历、天气预报、便利贴、闹钟、网管面板之类的。在家中设置这样一个不间断运行的控制台，带来的更多是操纵感和交互感，让人感觉到整个环境是充盈着信息的、是可以控制和互动的。至于真正的“智能家居”的部分，还是交给成熟的专用产品比较好。
- 半固定的电台计算机：可以连接SDR接收机，当作简单的频谱显示器；还可以连接到电台，进行FT8等数字模式操作。由于机器很轻，可以挂在墙上，也可以、

2023-05-25

继续调研松下的笔记本。松下笔记本的定位是生产资料，而不是生活资料。生产资料，顾名思义，是用来生产的。生产是与消费相对的。您有生产能力吗？如果有，那么松下的笔记本实在是再合适不过了。一般来说，高生产力人士的消费能力也不低，因此这个定价是非常合理的。尤其是法人向产品，与其可能创造的潜在价值相比，上万元人民币的售价实在不值一提。

那么什么是“生产”呢？文字工作固然是一种生产，音视频也是一种生产。松下笔记本由于性能相对孱弱，并不适合音视频类生产。而我们所说的生产，更广泛的含义是物质世界的生产，例如矿山、工厂、车间、机房、耕地、工地。在这些场景下维持生产力，普通的消费级产品，也就是那些定位为生活资料的电脑，是难以胜任的。

最近在小地瓜上看到不少西域沙漠单车骑行的视频，那些up主在路上也要剪视频。那么这种应用场景下，Let's Note 系列甚至TOUGHBOOK系列无疑是非常合适的，甚至可能是唯一合适的选择（轻且耐操），而这两个系列也确实有内置WWAN（如4G LTE）模块的机型。我一开始买的就是带LTE模块的机型。

另外，故乡家里有一台松下的微波炉，跟我年龄差不多，至今正常服役，功能性胜于如今市面上任何微波炉。印象最深的就是它的说明书，全彩印刷，十分用心，附有不少带彩色照片的食谱，是我的识字读物之一，我从小看到大。

为什么我一定要笔记本电脑带光驱呢，因为我从小就对光驱这种光机电一体化的东西十分感兴趣……我算不上什么发烧友，只是喜欢收集音乐CD盘而已，有廉价的中古盘，也有正版计销量的专辑。

大学时代曾经把家里退役的90年代的VCD机拆成模块，带到学校，装进纸盒里，作为台式CD机。由于原机有机械式换碟机构，去掉换碟机构后机器无法正常工作，当时还用74芯片搭建了简单的逻辑电路，模拟机械换碟机构的工作时序。

松下的笔记本，无论多小多紧凑，都能塞进一个光驱进去。机电一体化的东西，在我看来简直是艺术品，这种XP在他人看来可能很难理解。

又回到那个我吐槽了无数遍的事情了：中国没有发展出成熟的唱片产业，在我看来是十分遗憾的一件事情。现在发售的数字专辑似乎有U盘介质的了，我的评价是：好，但不如CD好。无论如何，实体介质对于我们维护精神生活的安全和自主而言，我认为是极其重要的。CD是一种把技术美学和艺术美学完美融合在一起的奇妙玩意儿，我希望它一直存在下去。

------

2023-05-26：说到日式小笔记本，学生时代曾经买到一个富士通的10寸小笔记本，FMV-P8215T，不到200块钱，无风扇被动散热，Pentium.M处理器，性能非常孱弱却发热巨大。搭载了一块电阻触屏，用处并不是很大。当年在这个笔记本上完成了一些课程设计作业，很奇妙的工作体验。怎么讲呢，这款笔记本也是典型的社畜本，小巧是真小巧，性能也是真乐色。在续航上下了功夫的，虽然小，但是有光驱位的。光驱可以拔下来，换成备用电池，这个设计还是很值得赞赏的。总而言之，日式社畜本的设计风格很对我电波，不过仅限于捡洋垃圾。我是不会花冤枉钱的233

------

2023-05-26

我们似乎很喜欢用“不思进取”去指责别人。调研松下笔记本的时候就看到很多“不思进取”的评价。然而我之前曾经发表过我的“废物”观，大意我承认并甘于当“废物”。诚然日本人在笔记本这个细分领域内患了所谓的加拉帕戈斯综合征，但是说他们“不思进取”，恐怕并不公允。我是比较理解日本人的这种“不思进取”的。

归根结底，在于“进取”的标准和方向有分歧。消费级产品百花齐放，努力内卷儿，竭尽所能讨好用户，这是进取。二十年固守同一个模具，但是坚守核心特色，新瓶装旧酒，本色不改，小步慢跑推陈出新，也不能说不是进取。毕竟，在我看来，在一个不努力就会被无情淘汰的世界里，能保持安稳镇定已经是非常了不起的成就了。正如在跑步机上锻炼，尽管没有前进一步，但脂肪的确是被燃烧了。

最近讲得比较多的“高质量增长”，也就是所谓的“量的合理增长，质的稳步提升”，我觉得每个人都应该好好思考下，这两句话的深层含义。这涉及价值观、业绩观、发展观的底层变革，是非常重要的方向性问题，值得深思。

## NUC8i5BEH（主力机）

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

## 2019年台式机装机记录

本文创建于2019-07-10，装机时间大概在2019年8月前后。

**装机需求**

- 预算5000上下。
- 以上网和视频、音乐为主，偶尔做一些小规模的开发。
- 对虚拟化的性能有一定要求。
- 几乎不玩游戏。
- 存储统一个人数据库（UPDB）的完整副本。
- 作为主力机，安全稳定第一，不折腾，不玩超频（毕竟还有一大堆垃圾等着我折腾呢233

**选型说明**

CPU选择英特尔8代i5-8500。8500据说是性价比较高的一款U，适合绝大多数用户。6核6线程，带集成显卡，LGA1151插座，芯片组支持B360等。

主板选择技嘉的B360M D3H。这款主板接口比较丰富，内存频率最高支持到2666，只有一个M.2/NVMe接口。

内存选择金士顿的高端子品牌HyperX的Fury 8G×2内存条套装，组成双通道。由于主板最高支持2666，所以这里选择的是2666频率的。金士顿有让多条内存的灯光同步的技术<sup>[\[参考资料\]](http://www.pceva.com.cn/article/3759-3.html)</sup>。

SSD经过调研，中端SSD以英特尔760p、三星970evo和浦科特M9PeG最为流行。其中三星和英特尔分别采用自家颗粒，浦科特好像是采用东芝的颗粒。SSD的闪存颗粒有SLC、MLC、TLC和QLC等技术，简单来说就是指一个浮栅晶体管可以存储1、2、3、4个bit。三款SSD均采用TLC颗粒，存储密度比前代的SLC和MLC要高很多，但是寿命上（体现为P/E循环次数）就打了折扣。目前消费者产品中基本上没有SLC了，TLC已经成为主流，QLC也已经开始铺开。英特尔660p即采用QLC颗粒，容量512GB起步，价格仅450左右，单位容量价格已经不足1元/GB。QLC可以大幅提高单颗粒存储容量，但寿命大大降低，据说单元P/E循环仅有100次左右，不过现在通过多层堆叠（即3D NAND）等技术已经可以提高到1000次以上了，并不是很差。现在网上普遍不看好QLC。起初考虑入浦科特M9PeG，但后来决定选择英特尔760p 512G版本。这三款均支持NVMe协议。NVMe协议是英特尔提出的新传输协议，理论速度可以达到32Gbps。M.2接口是一种接口物理规格，支持PCIe和SATA两类协议。它们之间的关系可以这样理解：M.2对应RJ45，PCIe/SATA对应以太网（802.3），NVMe可以理解成是TCP/IP那一层。当然这个对应并不准确（例如SATA还包括物理接口标准），只是为了方便说明协议层次而已。

前段时间曾经针对HDD做了不少的功课，由于旧机器上已经有两块容量分别是1TB和2TB的硬盘，所以就直接利旧了。1TB的那块是希捷酷鱼系列，7200rpm，64MB缓存，从这个参数看，很有可能是PMR技术的盘。而2TB的那块是西数蓝盘，5400rpm，缓存高达256MB，采用SMR技术。SMR存在写放大效应，需要像SSD一样准备较大的缓存，甚至还有垃圾回收机制在里面，因而性能相对差一点。HDD只要运用得当，总体上是比SSD要靠谱的，毕竟SSD数据丢失是完全无法恢复。至于两块盘的分工，PMR那块盘用作工作区，用来暂存日常使用中下载和产生的文件，包括虚拟机的虚拟磁盘也在上面。SMR那块盘作为仓库盘，保存UPDB的全部内容，平时只读不写。

电源对于整机的安全稳定运行非常重要。调研时，看到有人推荐酷冷至尊的MASTERWATT LITE 500电源，这款电源采用全模组设计，也就是电源线与电源本体分离，以插座连接的设计，非常有利于走线。转换效率为80%，通过80plus白盘认证。作为一款中端电源，该有的保护机制都有，风扇声音不大，功率500W可以满足轻度游戏需要。

**装机操作**

按顺序操作：

- 操作之前先洗手，释放静电，避免ESD损坏硬件，最好是戴手套或者防静电手环。
- 确认主板是否遮挡机箱的背部走线孔，如果不遮挡的话，那么可以将电源线、SATA线等线材从机箱的背板后面绕过去，作背部走线。
- 如果散热器有支架的话，先将支架安装到主板上。
- 将电源安装到机箱上，梳理好走线，然后放倒机箱，开始安装主板。先安装主板螺丝孔上对应的铜柱，然后将主板接口挡板装在机箱背部。注意，接口挡板很锋利，不要划破手。随后，将主板接口对准挡板的对应孔位，将主板放入机箱，并使螺丝孔和铜柱对齐，安装螺丝。要注意接口挡板上的弹性触片与接口部件的金属屏蔽良好接触，并且安装时不要太用力，避免主板弯曲。
- 主板安装好之后，开始安装CPU。注意，装好CPU之后才可以去掉CPU插座上的挡板，避免安装过程中碰坏弹片。CPU装好之后，在CPU顶盖上均匀涂抹少量硅脂，然后安装散热器。
- 安装内存和SSD，需要注意的是，两条内存组成双通道，应该按照主板的说明去接，例如这款主板是接在1、2或3、4槽位上才可以组成双通道，其他组合无法组成双通道。
- 随后在机箱上安装HDD等大件设备，安装的原则是尽可能留有较大空隙，以便于散热。
- 下一步是接线。ATX电源和CPU电源都是防呆的，插进去就可以了，注意不要太用力压主板。SATA接线尽可能从编号小的开始接。前面板的USB和音频接线也是防呆的，直接安装就好。电源按钮、指示灯和蜂鸣器（如果有）按照主板上的标记接，注意分清正负极。NC是没有连接的意思。
- 机箱风扇的气流方向，我觉得应该是向外吹，也就是冷空气从四面八方流入机箱，热空气被风扇排出。

