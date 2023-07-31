#!title:    广播电视

#!content

# 音频广播

## SWL/BCL/中波长波接收

**短波广播米波段**

摘自[维基百科](https://en.wikipedia.org/wiki/Shortwave_bands)。

|Band|Frequency range (MHz)|:Remarks|
|----------------------------------|
|120m|2.3–2.495|Mostly used locally in tropical regions, with time stations at 2.5 MHz. Although this is regarded as shortwave, it is a MF band.|
|90m|3.2–3.4|Mostly used locally in tropical regions, with limited long-distance reception at night. A notable example of a station using this band is Canadian time station CHU on 3.33 MHz.|
|75m|3.9–4|Mostly used in the Eastern Hemisphere after dark; not widely received in North and South America. Shared with the North American amateur radio 80 m band.|
|60m|4.75–4.995|Mostly used locally in tropical regions, especially Brazil, although widely usable at night. Time stations use 5 MHz.|
|49m|5.9–6.2|Good year-round night band; daytime (long distance) reception poor|
|41m|7.2–7.45|Reception varies by region—reasonably good night reception, but few transmitters in this band target North America. According to the WRC-03 Decisions on HF broadcasting,[2] in International Telecommunication Union regions 1 and 3, the segment 7.1–7.2 MHz is reserved for amateur radio use and there are no new broadcasting allocations in this portion of the band. 7.35–7.4 MHz is newly allocated; in Regions 1 and 3, 7.4–7.45 MHz was also allocated effective March 29, 2009. In Region 2, 7.2–7.3 MHz is part of the amateur radio 40 m band.|
|31m|9.4–9.9|Most heavily used band. Good year-round night band; seasonal during the day, with best reception in winter. Time stations are clustered around 10 MHz.|
|25m|11.6–12.1|Generally best during summer and the period before and after sunset year-round|
|22m|13.57–13.87|Substantially used in Eurasia. Similar to the 19 m band; best in summer.|
|19m|15.1–15.83|Day reception good, night reception variable; best during summer. Time stations such as WWV use 15 MHz.|
|16m|17.48–17.9|Day reception good; night reception varies seasonally, with summer best.|
|15m|18.9–19.02|Lightly utilized; may become a Digital Radio Mondiale (DRM) band in future|
|13m|21.45–21.85|Erratic daytime reception, with very little night reception. Similar to 11 metres, but long-distance daytime broadcasting (best on north–south paths) keeps this band active in the Asia-Pacific region.|
|11m|25.67–26.1|Seldom used. Daytime reception is poor in the low solar cycle, but potentially excellent when the solar cycle (generally indicated by the number of sunspots) is high. Nighttime reception nonexistent, except for local groundwave propagation. DRM has proposed that this band be used for local digital shortwave broadcasts, testing the concept in Mexico City in 2005. Citizens band (CB) allocation in most countries, is slightly higher in frequency than the broadcasting 11m band. There are reports of pirate CB radio users operating equipment on frequencies as low as 25.615 MHz. In the United States, this band is also shared with Remote Pickup Units (RPUs), from 25.87 to 26.1 MHz in FM mode.|

**SWL记录**

2023-01-25：接收到阿拉斯加的KNLS电台，大圆距离约7000km。

![ ](./image/G3/broadcasting/knls-from-alaska.jpg)

**长波接收记录**

2023-01-26：夜间22:50在164kHz和209kHz收到两个长波广播台载波，其中164kHz（蒙古之声）隐约可以听到广播音乐声，从电平表判断，信噪比约2dB。23:05时，164kHz载波消失，QRT。

![注意频谱中央的载波](./image/G3/broadcasting/vom-long-wave-164khz-qrt.jpg)

**短波广播发射台站**

![位于日本茨城县古河市的[八俣送信所](https://ja.wikipedia.org/wiki/%E5%85%AB%E4%BF%A3%E9%80%81%E4%BF%A1%E6%89%80)，[图片出处](https://time-space.kddi.com/kddi-now/tsushin-chikara/20171128/2171)](./image/G3/broadcasting/八俣送信所.jpg)

## 数字广播(DRM/DAB/CDR等)

![使用IC-705接收中国之声短波DRM广播](./image/G3/broadcasting/drm-705.jpg)

[频率表](https://www.drmrx.org/drm-broadcasts-shortwave-by-frequency/)

这幅图是DReaM根据估计出的信道传递函数计算出的信道单位冲激响应。由于多径等因素的影响，短波信道存在时延扩展，会导致符号间干扰。这可以类比成在空旷的山洞中说话，如果说话语速过快，那么上一个字的回声就会淹没下一个字。这幅图可以显示出当前信道的时延扩展是否超过了OFDM保护间隔的长度，来辅助听众判断接收条件。简单地讲，如果两条黑色虚线所夹的部分（估计出的信道时延扩展）超出了红色虚线所夹的部分（OFDM保护间隔），意味着OFDM保护间隔的长度已不足以抵消信道的时延扩展所带来的符号间干扰，这会导致OFDM接收机失去同步，音频中断，影响收听体验。

**信道冲激响应**：本图由信道传递函数经过平均、加Hamming窗、傅里叶逆变换得到，PDS长度估计、时间同步跟踪都基于信道冲激响应提供的信息。两条红色虚线代表保护间隔（guard-interval）的起始点和终止点，两条黑色虚线代表估计的信道PDS起始点和终止点（基于多个冲激响应函数的平均估计得到）。如果选择了“第一个峰值”时间跟踪方式，将显示一条红色的水平虚线，用来指示峰值检测阈值，只有高于此阈值的峰，才会被用于定时同步。

![ ](./image/G3/broadcasting/dream-drm-channel-ir.png)

![ ](./image/G3/broadcasting/dream-drm-channel-tf.png)

![ ](./image/G3/broadcasting/dream-drm-constellation.png)

![ ](./image/G3/broadcasting/dream-drm-freq-offset.png)

关于DReaM的参考资料：

- [2.2.1（zefie edition v1.1）](https://bg1ica.home.blog/2020/10/13/dream-am-drm-receiver-2-1-1-%E7%BB%BF%E8%89%B2%E7%89%88%E4%BF%AE%E5%A4%8D%E9%9F%B3%E9%A2%91%E8%A7%A3%E7%A0%81/)

**2021-04-30**

首次解码成功，收听到6030kHz上的中国之声，以及朝鲜中央放送DRM频率3205kHz。

DRM使用AAC音频编码，而AAC解码器一般是收费的。

- 将接收机调整为上边带模式，使DRM信号频谱落在通带中央。DRM信号的带宽一般为10k，SSB通带带宽12k左右即可。
- 打开DReaM解码软件，输入设备选择虚拟声卡，输出设备选择电脑的扬声器。
- 调整接收机音频增益，使得DReaM左侧的S表不飘红（以免信噪比降低），也不偏低。
- 等待DReaM解码。当下方三个指示灯全部变绿，即可成功解码。

详细的安装说明可阅读[这份参考资料](https://www.rtl-sdr.com/tutorial-drm-radio-using-rtl-sdr/)。相关工具已经打包上传永硕网盘，安装方法如下：

- 首先安装虚拟声卡。
- 安装DReaM解码软件，该软件并不包含AAC解码器，但可以解码DRM数字信号。
- 将AAC解码器`faad2_drm.dll`移动到DReaM的安装目录，即可使用。

**2021-06-13**

- 使用wfview通过WiFi将中频信号（在Set→Connectors中设置）传输给电脑，因为传输的是中频信号，因此与电台的解调模式无关。
- DREAM中显示的信噪比至少需要17dB才能解码出正确的AAC帧。
- 705的任务是输出带宽20kHz的中频信号供DREAM解调。

**2021-06-16**

想做个视频介绍下毫无用处的短波DRM数字广播。为什么对DRM这么感兴趣呢，因为它在技术上还是蛮先进的。调制方式采用比较先进的正交频分复用（OFDM）调制（这也是4G LTE、Wi-Fi所采用的），可以在10kHz的带宽内传输23kbps左右的高质量AAC音频。

![OFDM示意。[来源](https://rfmw.em.keysight.com/wireless/helpfiles/89600B/WebHelp/Subsystems/wlan-ofdm/Content/ofdm_basicprinciplesoverview.htm)](./image/G3/ofdm-f-t.png)

拜SDR所赐，解码DRM广播的成本还是比较低的。例如，只需要一台电脑（安装DREAM解码软件）、一套SDR接收机（十分廉价的RTL-SDR就可以）、一副短波天线（如便宜好用的有源小环天线）即可收听。当然，也可以采用传统收音机+声卡的方案。

但，DRM的缺点也极为突出。

首先便是解码门槛太高。由于短波传播特性不稳定，属于靠天吃饭，甚至可以说是玄学，因此并非随时随地都可以稳定地接收到DRM信号。

另一方面是DRM技术自身的问题。由于OFDM/QAM解调对于时间同步和信号信噪比（SNR）的要求比较高，如果传播不佳，则接收并解调出来的数据帧很难通过CRC校验，结果就是要么能接收到高质量的数字广播音频，要么就完全静音，什么都听不见。不像普通的模拟调制（AM、FM、SSB），SNR只会影响语音的声音大小和可懂度，并不存在要么完全听到、要么完全听不到的极端对立。至于相位噪声和频率偏移，对于传统模拟调制来说甚至不算是问题，但对于OFDM来说是相当敏感的。

而考虑到短波传播的不确定性，结合我最近收听的经验，接收到的DRM信号往往很难达到能够稳定、连续解码所需的程度。具体来说，近期，采用有源小环天线室内假设，通过IC-705电台打通收听全链路，DREAM显示的SNR一直低于17dB，只能偶尔解码出断续的少许AAC音频帧，应该说是完全无法收听。

此外，AAC在我个人看来是一款比较奇葩的音频编码格式。AAC最初是MPEG-4标准的一部分，技术上比较先进，可以在64kbps以内的码率下传输质量相当于CD音质的音频信号，但是标准授权方面比较不友好。靠谱的几款编码器，都属于商业软件范畴，如Apple所使用的自研AAC编码器（集成在iTunes和设备中）。DREAM在SourceForge上提供的软件包，是不包括AAC编码器的，因此需要用户自行集成。虽然这个问题很好解决（只需要一个dll就可以了），但是给我的观感非常不好。尽管如此，DREAM软件本身是相当专业的，对于懂技术的SWLer和业余无线电爱好者来说非常有趣，这也是我研究DRM的最重要的原因。但是对于单纯希望收听广播的SWLer来说，它还是比较难用，甚至可以说是不实用。

DRM生态方面，就接收机（收音机）来说，相信是不少的，但是我并不感兴趣，因为我可以接收到的DRM电台，似乎只有CNR中国之声和朝鲜中央广播电台两个。

说了这么多，都是泛泛而谈，没有深入到细节去介绍。事实上我对于DRM的认识和接受经验也有限，但终究是能够打通整个收听链路的，因此还是可以分享一点经验。至于收听的效果，就需要各位同好自行研究了，我这里只是起到抛砖引玉的作用。

相关软件（如DREAM等），请通过站内信联系我索取，欢迎共同研究。

**2021-07-19**

DRM的粉丝真不少，其中有许多都是业余无线电爱好者。我的理解是，DRM是一种最接近4G LTE和Wi-Fi这类先进通信体制的技术，同时由于它的业务本身不复杂，所以系统也比较简单，单个爱好者独立构建原型系统是可能的。DRM的定位，我觉得作为省域高保真广播是比较适合的，尤其适合移动通信信号难以覆盖的偏远地区（也就是胡焕庸线以西的地区）的汽车广播场景，可以承载路况、气象、应急广播等多种业务。

**2023-01-25**

为了接收3205kHz上播出的主体DRM广播，使用EB200收音机，将IQ信号通过音频线输出到改造过的USB声卡，再通过DReaM软件对其解调。但是虽然目测信噪比还可以，却只能实现同步，上层的CRC一直亮红灯，无法解调出音频。后来在DReaM中打开频谱翻转开关，可以成功解调了。但是CNR的其他DRM信号不需要反转频谱，不知道为什么。跟EB200似乎没有关系。

------

- [数字广播资料收集](http://educypedia.karadimov.info/electronics/radiotuningdig.htm)
- [BBC的DAB白皮书](http://educypedia.karadimov.info/library/WHP061.pdf)


## 调频广播

<details>

<summary>南京地区调频广播2021-05-03收听记录</summary>

强度测量说明：使用德生PL-330和Icom的IC-705两台机器接收，PL-330外接垂直拉杆天线，IC-705接FM正V天线（无巴伦）且射频衰减调到70%。PL-330示数单位为dBμ。

|频率(MHz)|电台|强度(330/705)|
|----------|
|88.0|江苏健康广播|08/S5|
|88.5|江宁人民广播电台|47/S9+20|
|88.8|镇江交通广播|05/S1|
|89.0|金坛人民广播电台|03/S0|
|89.7|江苏音乐广播|47/S9+35|
|90.1|丹徒人民广播电台|12/S3|
|90.5|镇江城市广播|07/S1|
|90.8|安徽交通广播|10/S3|
|90.9|宜兴交通广播|?|
|91.1|苏州新闻广播？|？|
|91.2|？|？|
|91.4|江苏文艺广播|40/S+20|
|91.7|句容人民广播电台|22/S4~5|
|92.0|高淳人民广播电台|？|
|92.3|YO!FM923|36/S9+10|
|92.4|？|?|
|92.6|？|?|
|92.8|马鞍山交通广播|?|
|93.0|央广中国之声（滁州）|07/S1|
|93.3||？|
|93.5|常州音乐广播|05/S1|
|93.7|江苏新闻广播|45/S9+30|
|94.1|淮安新闻广播|没听到|
|94.3|仪征人民广播电台|07/S0~1|
|94.5|扬中人民广播电台|06/S3|
|94.7||没听到|
|94.9|扬州经济音乐|23/S7~8|
|95.2|江苏财经广播|23/S9|
|95.3||有信号，但被压制|
|95.8|央广中国之声|35/S9+10|
|96.6|南京活力调频UpRadio|36/S9+20|
|96.9|？|？|
|97.0|南通新闻综合广播？|11/S2|
|97.5|江苏经典流行音乐广播|60/S9+40|
|97.9|淮南交通文艺广播？|08/S3~4|
|98.1|南京经济广播|46/S9+20|
|98.3|滁州南谯之声|10/S6|
|98.5|湖州交通音乐广播？|18/S7~8|
|98.9|央广音乐之声|35/S9+10|
|99.2|淮安经典992|01/S1~S2|
|99.5|安徽PBC戏曲广播（滁州）|07/S3|
|99.7|金陵之声|50/S9+30|
|100.2|东阳城市广播？|06/S4~5|
|100.5|Youth FM|38/S9+20|
|100.7|扬州电台江都广播|18/S6~7|
|100.9|？|微弱|
|101.1|江苏交通广播||
|101.5|安徽经济广播（5.16实听，FM97.1）\[1\]|04/S1~2|
|101.7|南京城市调频|53/S9+40|
|102.0|南京HitFM|极微弱？|
|102.4|南京交通广播|33/S9+20|
|102.9|安徽故事广播（5.16实听）|01/S2~4|
|103.5|My FM 南京|34/S9+30|
|103.6|？|有信号，但被压制|
|103.7|？|极微弱|
|104.0|？|00/S0~1|
|104.3|南京体育广播\[2\]|43/S9+30|
|104.8||?|
|104.9|江苏故事广播|37/S9+30|
|105.4|Youth Radio|01/S6|
|105.8|南京音乐频率|37/S9+30|
|106.1|宣城交通文艺广播？|00/S1~S3|
|106.5|德清之声/安徽私家车广播|00/S2~S3|
|106.9|南京新闻调频|33/S9+20|
|107.5|？|22/S9+10|
|107.9|蚌埠新闻综合广播（其实是93.7江苏新闻广播的镜像\[3\]）|00/S0(有信号)|

+ 这个频率可以看出705的选择性要强于330。
+ 有文字消息：Welcome To Use CenNavi's TMC Service. RDS-TMC是采用RDS技术实现信息发布的应用之一。交通信息在广播前按照标准编码，采用RDS技术发布。车载终端设备可接收该码型信息，并可选择信息的实现方式，如文本、简单图形和语言等。接收RDS-TMC需要一个特别的无线电接收机，其最主要部分就是TMC卡，该卡包含了具体的路线信息等。假如要从甲地到乙地，在离开甲地前，先购买或租用甲地到乙地路线的TMC卡，这样就会收到路线中最新的交通信息。在进入其他国家时，接收机就会自动转到提供TMC信息流的另一个无线电台。
+ [魔镜魔镜告诉我—了解镜像抑制及其对所需信号的影响](https://www.analog.com/cn/analog-dialogue/articles/mirror-mirror-on-the-wall-understanding-image-rejection-and-its-impact-on-desired-signals.html)

</details>

**调频立体声MPX**

![MPX频谱图](./image/G3/fm-mpx-spectrum.png)

![MPX编码器](./image/G3/fm-mpx-encoder.png)

![MPX解调过程](./image/G3/fm-mpx-demodulation.jpg)

- [广播资料收集](http://educypedia.karadimov.info/electronics/radiotuning.htm)
- [FM Stereo/RDS Theory](http://rfmw.em.keysight.com/wireless/helpfiles/n7611b/Content/Main/FM_Broadcasting.htm)
- [FM Modulation (Slide)](http://cci.usc.edu/wp-content/uploads/2017/09/CLASS-6-FM-modulation.pdf)
- [Matlab - FM Broadcast Modulator Baseband](https://www.mathworks.com/help/comm/ref/fmbroadcastmodulatorbaseband.html)
- [The DARC side of Munich](https://apollo.open-resource.org/mission:log:2014:08:08:darc-side-of-munich-hunting-fm-broadcasts-for-bus-and-tram-display-information-on-90-mhz)

- [无线电数据广播RDS](https://zh.wikipedia.org/wiki/%E6%97%A0%E7%BA%BF%E7%94%B5%E6%95%B0%E6%8D%AE%E5%B9%BF%E6%92%AD)

## 放送文化

- [暗号广播](https://zh.wikipedia.org/wiki/%E6%95%B0%E5%AD%97%E7%94%B5%E5%8F%B0)、[新星广播电台](https://www.douban.com/group/topic/3299453/)（[维基百科](https://zh.wikipedia.org/wiki/%E6%98%9F%E6%98%9F%E5%B9%BF%E6%92%AD%E7%94%B5%E5%8F%B0)）、著名的[UVB-76](https://zh.wikipedia.org/wiki/UVB-76)（[收听](https://www.bilibili.com/video/BV1hb41187GH)）
- 维基百科词条[无线电干扰](https://zh.wikipedia.org/wiki/%E6%97%A0%E7%BA%BF%E7%94%B5%E5%B9%B2%E6%89%B0)：2000年以后亦有利用锣鼓唢呐民乐（所选用的曲目为《丰收锣鼓》、《秦王破阵乐》等民乐）进行干扰。[录音](https://www.bilibili.com/video/BV1FE411v7DT)

# 电视广播

## DTMB地面波数字电视

# 航海、气象等业务

## 接收GK-2A卫星云图

2022-07-31

关于GK-2A卫星的一些参数：

- 地球静止轨道：定点128.2°E上空
- 地平坐标：高度70°，方位162°
- 下行LRIT中心频率：1692.14MHz BPSK

## 收听JMH短波气象传真

需要准备的设备和软件：

- IC-705、有源短波小环天线
- wfview、Black Cat HF Weather Fax

## 海事无线电资料

- [XSQ](https://goughlui.com/2020/11/08/radiofax-xsq-guangzhou-china-south-china-sea-marine-weather-forecast-center-cma/)
- [XSG](https://goughlui.com/2019/03/07/radiofax-xsg-shanghai-china-national-meterological-centre-cma/)

- [关于上海海岸电台的历史](http://61.129.65.112/dfz_web/DFZ/Info?idnode=67463&tableName=userobject1a&id=64433)
- [长江水上甚高频](http://www.zgjtb.com/2016-05/31/content_85259.htm)

> 长江海事部门优化了相关VHF频道的功能定位，规定01频道（160.650MHz）为长江水上交通信息区播联播专用频道，06频道（156.300MHz）为长江机动船舶间航行避让通信专用频道，09频道（156.450MHz）、10频道（156.500MHz）、11频道（156.550MHz）为海事专用频道，船舶与船舶交通管理中心联系专用频道，16频道（156.800MHz）用于遇险船舶发送遇险信号，进行遇险呼叫和遇险通信。同时，海事部门要求各船舶应保持对VHF06频道和海事专用频道的双守听；按照规定使用海事专用频道实施船舶动态报告或与船舶交管中心间联系；充分利用VHF16频道的一键呼叫功能实施船舶遇险报警和通信。

