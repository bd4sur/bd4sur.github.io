#!title:    法规·标准

#!content

# 自制的业余无线电宣传海报

[打开原页面](./html/ar-flyer.html)

<iframe class="MikumarkIframe" src="./html/ar-flyer.html" height="1000px"></iframe>

# RJ45水晶头线序

2018-12-28

以触点面为正面，触点向上，则左边是1，右边是8。

普通的直通线使用568B线序。

|线序|1 2 3 4 5 6 7 8|
|---------------|
|**568B**|[[#ff8800:◑#]] [[#ff8800:●#]] [[#00bb00:◑#]] [[#0000ff:●#]] [[#0000ff:◑#]] [[#00bb00:●#]] [[#995500:◑#]] [[#995500:●#]]|
|568A|[[#00bb00:◑#]] [[#00bb00:●#]] [[#ff8800:◑#]] [[#0000ff:●#]] [[#0000ff:◑#]] [[#ff8800:●#]] [[#995500:◑#]] [[#995500:●#]]|

参考：[https://en.wikipedia.org/wiki/TIA/EIA-568]()

# 3.5mm音频接口（4段）

- 国标：末端-L-R-MIC-GND-根部
- 美标：末端-L-R-GND-MIC-根部

KC908U的耳机接口采用国标。IC-705的SP接口是三段接口，遵循此顺序。

小米、苹果手机的音频接口采用美标。

关于麦克风的接口，参考[这篇资料](https://www.hobby-hour.com/electronics/computer_microphone.php)。

# 法律法规

- [中华人民共和国无线电管理条例](http://www.gov.cn/zhengce/content/2016-11/25/content_5137687.htm)
- [中华人民共和国无线电频率划分规定2018](https://www.miit.gov.cn/jgsj/wgj/wjfb/art/2020/art_83e48005edf142a38b17aeff93ef9053.html)
- [业余无线电台管理办法](http://www.gov.cn/flfg/2012-11/08/content_2260255.htm)
- [GB 8702-2014 电磁环境控制限值](http://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/hxxhj/dcfsbz/201410/t20141022_290449.htm)
- [微功率短距离无线电发射设备（工信部公告〔2019〕第52号）](https://www.miit.gov.cn/zwgk/zcwj/wjfb/gg/art/2020/art_4f2c890530cc4837b2113cf977e249c4.html)

- [国际电联无线电规则](https://www.itu.int/en/publications/ITU-R/pages/publications.aspx?parent=R-REG-RR-2020&media=electronic)

## 中国业余无线电频率划分

![ ](image/G3/业余无线电频率划分-v2.svg)

## 中国无线电频率划分示意图（旧，仅供参考）

![ ](./image/G3/radio-freq-allocation-china.jpg)

## 世界业余无线电CQ分区地图

![图中我国国界线有误，需注意辨别。](./image/G3/cq-zones.jpg)

## 中国业余无线电呼号分区

![ ](http://www.crac.org.cn/wp-content/uploads/2011/07/2011-0802-%E4%B8%AD%E5%9B%BD%E4%B8%9A%E4%BD%99%E5%88%86%E5%8C%BA%E5%9C%B0%E5%9B%BE%E8%8B%B1%E6%96%871800x1344-1024x764.jpg)

## 业余无线电频率使用推荐规范

<style>
.amateur_freq {
    font-size: 12px;
    text-align: center;
    margin: 0 auto;
    border-collapse: collapse;
}
.amateur_freq td, .amateur_freq th {
    padding: 2px;
    border: 1px solid #000;
}
</style>

<div style="text-align: center;">
<table class="amateur_freq">
    <tr>
        <th rowspan="2">频段</th>
        <th rowspan="2">通信方式</th>
        <th rowspan="2">频率范围</th>
        <th rowspan="1" colspan="2">应急通信主控/公用呼叫频率</th>
    </tr>
    <tr>
        <th rowspan="1">国内通信</th>
        <th rowspan="1">IARU R3</th>
    </tr>
    <tr>
        <td>135kHz</td>
        <td>CW/NB</td>
        <td>135.7-137.8</td>
        <td>-</td>
        <td>-</td>
    </tr><tr>
        <td rowspan="3">1.8MHz</td>
        <td>CW</td>
        <td>1.800-2.000</td>
        <td rowspan="3">-</td>
        <td rowspan="3">-</td>
    </tr>
    <tr>
        <td>RTTY DX窗口</td>
        <td>1.830-1.834</td>
    </tr>
    <tr>
        <td>无线电话</td>
        <td>1.840-2.000</td>
    </tr><tr>
        <td rowspan="4">3.5MHz</td>
        <td>CW</td>
        <td>3.500-3.900</td>
        <td rowspan="4">3.600</td>
        <td rowspan="4">3.600</td>
    </tr>
    <tr>
        <td>CW DX窗口</td>
        <td>3.500-3.510</td>
    </tr>
    <tr>
        <td>无线电话</td>
        <td>3.535-3.900</td>
    </tr>
    <tr>
        <td>无线电话DX窗口</td>
        <td>3.775-3.800</td>
    </tr><tr>
        <td rowspan="3">7MHz</td>
        <td>CW</td>
        <td>7.000-7.025</td>
        <td rowspan="3">7.030(CW/NB)<br>7.050(SSB)</td>
        <td rowspan="3">7.110</td>
    </tr>
    <tr>
        <td>窄带</td>
        <td>7.025-7.040</td>
    </tr>
    <tr>
        <td>无线电话</td>
        <td>7.030-7.200</td>
    </tr><tr>
        <td rowspan="2">10MHz</td>
        <td>CW</td>
        <td>10.100-10.150</td>
        <td rowspan="2">10.145(CW/NB)</td>
        <td rowspan="2">-</td>
    </tr>
    <tr>
        <td>窄带</td>
        <td>10.140-10.150</td>
    </tr><tr>
        <td rowspan="6">14MHz</td>
        <td>CW</td>
        <td>14.000-14.350</td>
        <td rowspan="6">14.050(CW/NB)<br>14.270(SSB)</td>
        <td rowspan="6">14.300</td>
    </tr>
    <tr>
        <td rowspan="2">窄带</td>
        <td>14.070-14.095<br>(传统)</td>
    </tr>
    <tr>
        <td>14.095-14.112<br>(Packet等)</td>
    </tr>
    <tr>
        <td>信标保护频带</td>
        <td>14.0995-14.1005</td>
    </tr>
    <tr>
        <td>无线电话</td>
        <td>14.100-14.350</td>
    </tr>
    <tr>
        <td>SSTV推荐频率</td>
        <td>14.225-14.235</td>
    </tr><tr>
        <td rowspan="4">18MHz</td>
        <td>CW</td>
        <td>18.068-18.168</td>
        <td rowspan="4">18.160</td>
        <td rowspan="4">18.160</td>
    </tr>
    <tr>
        <td>窄带</td>
        <td>18.100-18.110</td>
    </tr>
    <tr>
        <td>信标保护频带</td>
        <td>18.1095-18.1105</td>
    </tr>
    <tr>
        <td>无线电话</td>
        <td>18.110-18.168</td>
    </tr><tr>
        <td rowspan="5">21MHz</td>
        <td>CW</td>
        <td>21.000-21.450</td>
        <td rowspan="5">21.080(CW/NB)<br>21.400(SSB)</td>
        <td rowspan="5">21.360</td>
    </tr>
    <tr>
        <td>窄带</td>
        <td>21.070-21.125</td>
    </tr>
    <tr>
        <td>信标保护频带</td>
        <td>21.1495 21.1505</td>
    </tr>
    <tr>
        <td>无线电话</td>
        <td>21.125-21.450</td>
    </tr>
    <tr>
        <td>SSTV推荐频率</td>
        <td>21.335-21.345</td>
    </tr><tr>
        <td rowspan="4">24MHz</td>
        <td>CW</td>
        <td>24.890-24.990</td>
        <td rowspan="4">-</td>
        <td rowspan="4">-</td>
    </tr>
    <tr>
        <td>窄带</td>
        <td>24.920-24.930</td>
    </tr>
    <tr>
        <td>信标保护频带</td>
        <td>24.9295-29.9305</td>
    </tr>
    <tr>
        <td>无线电话</td>
        <td>24.930-24.990</td>
    </tr><tr>
        <td rowspan="7">28MHz</td>
        <td>CW</td>
        <td>28.000-29.700</td>
        <td rowspan="7">28.080(CW/NB)<br>28.400(SSB)<br>29.600(FM)</td>
        <td rowspan="7">-</td>
    </tr>
    <tr>
        <td>窄带</td>
        <td>28.050-28.150</td>
    </tr>
    <tr>
        <td>信标保护频带</td>
        <td>28.200±500Hz</td>
    </tr>
    <tr>
        <td>无线电话</td>
        <td>28.300-29.300</td>
    </tr>
    <tr>
        <td>SSTV推荐频率</td>
        <td>28.675-28.685</td>
    </tr>
    <tr>
        <td>业余卫星</td>
        <td>29.300-29.510</td>
    </tr>
    <tr>
        <td>宽带</td>
        <td>29.510-29.700</td>
    </tr><tr>
        <td rowspan="3">50MHz</td>
        <td>CW</td>
        <td>50.000-54.000</td>
        <td rowspan="3">-</td>
        <td rowspan="3">-</td>
    </tr>
    <tr>
        <td>信标保护频带</td>
        <td>50.050-50.100</td>
    </tr>
    <tr>
        <td>CW/AM/NB/WB</td>
        <td>50.100-54.000</td>
    </tr><tr>
        <td rowspan="4">144MHz</td>
        <td>EME</td>
        <td>144.000-144.035</td>
        <td rowspan="4">145.000<br>本地中继频率<br>APRS频率</td>
        <td rowspan="4">-</td>
    </tr>
    <tr>
        <td>CW/AM/NB/WB</td>
        <td>144.035-145.800</td>
    </tr>
    <tr>
        <td>业余卫星</td>
        <td>145.800-146.000</td>
    </tr>
    <tr>
        <td>各种方式</td>
        <td>146.000-148.000</td>
    </tr><tr>
        <td rowspan="5">430MHz</td>
        <td>CW/AM/NB/WB</td>
        <td>430.000-431.900</td>
        <td rowspan="5">435.000<br>本地中继频率<br>APRS频率</td>
        <td rowspan="5">-</td>
    </tr>
    <tr>
        <td>EME</td>
        <td>431.900-432.240</td>
    </tr>
    <tr>
        <td>CW/AM/NB/WB</td>
        <td>432.240-435.000</td>
    </tr>
    <tr>
        <td>业余卫星</td>
        <td>435.000-438.000</td>
    </tr>
    <tr>
        <td>CW/AM/NB/WB</td>
        <td>438.000-439.000</td>
    </tr>
</table>
</div>

# 常用数值表

## 分贝（功率值）换算

|分贝|线性值|分贝|线性值|
|---------------------|
|0dB|1|||
|3dB|2|-3dB|0.5|
|4dB|2.5|-4dB|0.4|
|6dB|4|-6dB|0.25|
|7dB|5|-7dB|0.2|
|9dB|8|-9dB|0.125|
|10dB|10|-10dB|0.1|
|20dB|100|-20dB|百分之一|
|30dB|1000|-30dB|千分之一|
|40dB|10000|-40dB|万分之一|

- 分贝数＝10×log10(线性数)
- 线性数＝10^(分贝数÷10)
- 分贝数相加＝线性数相乘

## 波长频率换算

光速300M米/秒

|频率|波长|波段名称|
|---------------------|
|~300kHz|1km|长波/低频LF|
|~3MHz|100m|中波/中频MF|
|~30MHz|10m|短波/高频HF|
|~300MHz|1m|米波/甚高频VHF|
|~3GHz|10cm|分米波/特高频UHF|
|~30GHz|1cm|厘米波/超高频SHF|
|~300GHz|1mm|毫米波/极高频EHF|
|~3THz|0.1mm|亚毫米波/太赫兹|

- 红外光：几μm
- 可见光：几百nm
- 紫外光：几十nm


# 莫尔斯码和ITA2

## Morse Code

符合 [ITU-R M.1677 建议书](https://www.itu.int/rec/R-REC-M.1677/en)。

|字符|编码|字符|编码|
|-----------------|
|A|● — |0|— — — — — |
|B|— ● ● ● |1|● — — — — |
|C|— ● — ● |2|● ● — — — |
|D|— ● ● |3|● ● ● — — |
|E|● |4|● ● ● ● — |
|F|● ● — ● |5|● ● ● ● ● |
|G|— — ● |6|— ● ● ● ● |
|H|● ● ● ● |7|— — ● ● ● |
|I|● ● |8|— — — ● ● |
|J|● — — — |9|— — — — ● |
|K|— ● — |@|● — — ● — ● |
|L|● — ● ● |?|● ● — — ● ● |
|M|— — |/|— ● ● — ● |
|N|— ● |()|— ● — — ● — |
|O|— — — |—|— ● ● ● ● — |
|P|● — — ● |。|● — ● — ● — |
|Q|— — ● — |||
|R|● — ● |||
|S|● ● ● |||
|T|— |||
|U|● ● — |||
|V|● ● ● — |||
|W|● — — |||
|X|— ● ● — |||
|Y|— ● — — |||
|Z|— — ● ● |||

## ITA2

[国际电报字母表第2号](https://zh.wikipedia.org/wiki/%E5%8D%9A%E5%A4%9A%E5%BC%8F%E7%94%B5%E6%8A%A5%E6%9C%BA)
International telegraphy alphabet No. 2（Baudot-Murray code）

![ ](https://upload.wikimedia.org/wikipedia/commons/b/b2/Ita2.png)

|大端序|小端序|字母集<br>Letters|数字标点符号集<br>Figures|
|-----------------|
|00000|00000|Null|Null|
|00100|00100|Space|Space|
|10111|11101|Q|1|
|10011|11001|W|2|
|00001|10000|E|3|
|01010|01010|R|4|
|10000|00001|T|5|
|10101|10101|Y|6|
|00111|11100|U|7|
|00110|01100|I|8|
|11000|00011|O|9|
|10110|01101|P|0|
|00011|11000|A|–|
|00101|10100|S|Bell|
|01001|10010|D|$|
|01101|10110|F|!|
|11010|01011|G|&|
|10100|00101|H|#|
|01011|11010|J|'|
|01111|11110|K|（|
|10010|01001|L|）|
|10001|10001|Z|"|
|11101|10111|X|/|
|01110|01110|C|:|
|11110|01111|V|;|
|11001|10011|B|?|
|01100|00110|N|,|
|11100|00111|M|.|
|01000|00010|CR|CR|
|00010|01000|LF|LF|
|11011|11011|Shift to figures||
|11111|11111||Shift to letters|

# 常用简语

## Q简语

B类题库涉及的：

|Q简语|解释|备注|
|---------------------|
|QRL|在忙|Live|
|QRM|他台干扰|Manual|
|QRN|天电干扰|Natural|
|QRO|增加功率||
|QRP|减小功率||
|QRQ|加快发送速度|Quick|
|QRS|减慢发送速度|Slow|
|QRT|停止发送|Terminate|
|QRU|有事吗？无事了||
|QRV|准备好||
|QRZ|谁在呼叫我？||
|QSA|信号强度（是1-5级）|Amplitude|
|QSB|信号衰落||
|QSD|发报手法有毛病|Disease|
|QSK|在发射的信号间隙接收|题干里出现|
|QSL|请求/给你/收妥QSL卡片|题干里出现|
|QSO x|直接和x电台通信||
|QSP x|传信（中转）到x电台||
|QSX x ON n|在某频率n守听某电台x||
|QSY n|将频率改到n||
|QTH|电台位置||

其他：

|Q简语|:问句含义|:答句含义|
|---------------------|
|QRA|你的电台名称是？|我的电台名称是...|
|QRB|你台离我台多远？|我们相距约为...|
|QRG|我的准确频率是多少？|你的准确频率是...|
|QRI|我的音调如何？|你的音调是(T1-T9)|
|QRJ|我的信号小吗？|你的信号小|
|QRK|我的信号可辨度是多少？|你的信号可辨度是(R1-R5)|
|QRL|你忙吗？|我正忙|
|QRM|你受到他台干扰吗？|我正受到他台干扰 1.无 2.稍有 3.中等 4.严重 5.极端|
|QRN|你受到天电干扰吗？|我正受到天电干扰 1.无 2.稍有 3.中等 4.严重 5.极端|
|QRO|要我增加发信功率吗？|请增加发信功率|
|QRP|要我减低发信功率吗？|请减低发信功率|
|QRQ|要我发得快些吗？|请发快些|
|QRS|要我发得慢些吗？|请发慢些|
|QRT|要我停止拍发吗？|请停止拍发|
|QRU|你有事吗？|无事|
|QRV|你准备好了吗？|我已准备好了|
|QRW|需要我转告吗？|请转告|
|QRX|要我等多长时间？|请等待... ...分钟|
|QRZ|谁在呼叫我？|...KHz/MHz正在呼叫你|
|QSA|我的信号强度是多少？|你的信号强度是...|
|QSB|我的信号有衰落吗？|你的信号强度是，1.几乎不能抄收 2.弱 3.还好 4.好 5.很好|
|QSD|我的信号不完整吗?|你的信号不完整|
|QSL|你确认收妥／QSL卡片吗？|我确认收妥／QSL卡片|
|QSO|你能否和...直接（或转接）通信？|你能和...直接（或转接）通信？|
|QSP|你能中转到...吗？|我能中转到...|
|QSU|能在这个频率(或某个频率)回复吗？|我将在此频率(或某频率)回复|
|QSV|有天电干扰要我在此频率发一串 V 字吗？|请在此频率发一串 V 字|
|QSW|你将在此频率(或某频率)发吗？|我将在此频率(或某频率)发|
|QSX|你将在某频率收听吗？|我将在某频率收听|
|QSY|要我改用其他频率拍发吗？|请改用...KHz/MHz拍发|
|QSZ|要我每组发两遍吗？|请每组发两遍|
|QTB|要我查对组数吗？|请查对组数|
|QTC|你有几份报要发？|我有...份报要发|
|QTH|你的地理位置是？|我的地理位置是...|
|QTR|你的标准时间是？|我的标准时间是...|


## 简语

B类题库涉及的：

|简语|解释|简语|解释|
|---------------------|
|ABT|关于/大约|CPI|抄收|
|ADR/ADDR|地址|HPE|希望|
|ATT|衰减|HPY/HPI|幸福|
|PWR|功率|HR|这里、听到|
|AGN|再、再来一次|HW|怎样、如何|
|GA|继续、请过来；下午好|MNY/MNI|很多|
|AHR|另一个|MTRS|米|
|ANT|天线|MODE|方式|
|ARDF|业余无线电测向|NAME|名字|
|KP|收听|NICE|良好的|
|HST|快速收发报|NW|现在|
|AS经常连发在一起|请稍等|OM|老朋友|
|AS|请稍等、亚洲、如同|OP/OPR|操作员|
|BEST|最好的|P O BOX|邮政信箱|
|BJT|北京时间|RIG|电台设备|
|BK|插入、打断|RMKS|备注、注释|
|BURO|QSL卡片管理局|RPRT|报告|
|C|遇到、见面|RCVR/RX|收信机|
|CFM|确认|XMTR/TX|发信机|
|CHEERIO|再会、祝贺|XCVR|收发信机|
|CL|关闭、呼叫|SK|结束通信（CW用）|
|CLS|呼号|SRI/SRY|对不起|
|CLG|呼叫|STN|电台|
|DATE|日期|SURE|确实|
|DR|亲爱的|SWL|短波收听者|
|EL/ELE/ELS|单元（天线振子）|TEMP|温度|
|ES|和（CW用）|TNX/TKS|谢谢|
|FB|很好的|TU|谢谢你|
|FINE|好的、精细的|UTC|协调世界时|
|FR/FER|为了、对于|VIA|经由|
|FREQ|频率|VY|很、非常|
|GM|早晨好|WK|星期、工作|
|GE|晚上好|WKD|联络过、工作过|
|GN|晚安|WTS|瓦特|
|GB|再见|WX|天气|
|GL|好运气|XMAS|圣诞节|
|GLD|高兴|XYL|妻子、已婚女子|
|GMT|格林尼治时间|YL|小姐、女士|
|GND|地线、地面|UR|你的、你是|

其他：

|缩写|:全写|:注释|
|---------------------|
|AA|All after|某字以后|
|AB|All before|字以前|
|ARRL|American Radio Relay League|美国无线电中继联盟|
|ABT|About|大约|
|ADS|Address|地址|
|AGN|Again|再一次|
|ANT|Antenna|天线|
|BN|All between|……之间|
|BUG|Semiautomatic key|半自动关键|
|C|Yes|是，好|
|CBA|Callbook address|呼号手册|
|CFM|Confirm|确认|
|CLG|Calling|调用|
|CQ|Calling any station|调用任意台站|
|CUL|See you later|再见|
|CUZ|Because|因为|
|CW|Continuous wave|连续波|
|CX|Conditions|状况|
|CY|Copy|抄收|
|DE|From|来自|
|DX|Distance (sometimes refers to long distance contact)|距离（有时指长程通联）|
|ES|And|（和；且）|
|FB|Fine business (Analogous to "OK")|类似于“确定”|
|FCC|Federal Communications Commission|（美国）联邦通信委员会|
|FER|For|为了|
|FREQ|Frequency|频率|
|GA|Good afternoon or Go ahead (depending on context)|午安；请发报（依上下文而定）|
|GE|Good evening|晚安|
|GM|Good morning|早安|
|GND|Ground (ground potential)|地面（地电位）|
|GUD|Good|好|
|HI|Laughter|笑|
|HR|Here|这里|
|HV|Have|有|
|LID|Lid|覆盖|
|MILS|Milliamperes|毫安培|
|NIL|Nothing|无收信，空白|
|NR|Number|编号，第……|
|OB|Old boy|老大哥|
|OC|Old chap|老伙计|
|OM|Old man (any male amateur radio operator is an OM)|前辈，老手（男性）（任何男性业余无线电操作员都是OM）|
|OO|Official Observer|官方观察员|
|OP|Operator|操作员|
|OT|Old timer|老前辈|
|OTC|Old timers club|老手俱乐部|
|OOTC|Old old timers club|资深老手俱乐部|
|PSE|Please|请|
|PWR|Power|功率|
|QCWA|Quarter Century Wireless Association|四分之一世界无线电协会|
|R|Received,Roger or decimal point (depending on context)|收到；小数点（依上下文而定）|
|RCVR|Receiver|接收机|
|RPT|Repeat or report (depending on context)|重复；报告（依上下文而定）|
|RST|Signal report format (Readability-Signal Strength-Tone)|信号报告格式（可读性信号强度音）|
|RTTY|Radioteletype|无线电传|
|RX|Receive|接收|
|SAE|Self addressed envelope|回邮信（即已填写自己地址以便对方回信的信封）|
|SASE|Self addressed, stamped envelope|带邮票的回邮信封|
|SED|Said|说|
|SEZ|Says|说|
|SIG|Signal|信号|
|SIGS|Signals|信号|
|SKED|Schedule|行程表|
|SN|Soon|很快；不久的将来|
|SRI|Sorry|抱歉|
|STN|Station|台站|
|TEMP|Temperature|温度|
|TMW|Tomorrow|明天|
|TNX|Thanks|谢谢|
|TU|Thank you|谢谢你|
|TX|Transmit|发射|
|U|You|你|
|UR|Your or you're (depending on context)|你的；你是（依上下文而定）|
|URS|Yours|你的|
|VY|Very|非常；很|
|WDS|Words|词|
|WKD|Worked|工作|
|WL|Will or Well|将会；好（依上下文而定）|
|WUD|Would|将会|
|WX|Weather|天气|
|XMTR|Transmitter|发射机|
|XYL|Wife|妻子|
|YL|Young lady (used of any female)|女报务员（称呼任何女性报务员）|
|73|Best regards|致敬|
|88|Love and kisses|吻别|
|99|go way|走开（非友善）|


# B类操作证考点记录

执照续期：有效期届满一个月前（LK0044 (30)）

凡涉及应急通信，都是只能在紧急情况下才可以。

考题中涉及的发射类别（详见ITU《无线电规则》附录A）：

- CW：A1A（LK0127）
- 单边带话：J3E（LK0128）
- 单边带话传输的RTTY：F2B（LK0129）
- 单边带话传输的PSK31：G2B（LK0130）
- 调频话：F3E（LK0132）

# A类操作证考点速记

**政策法规**

- 凡是涉及刑事制裁的必然是《刑法》。
- 无线电频谱资源属国家所有，这是《物权法》中的规定。
- 无线电领域的最高法律是国务院和中央军委制定的《无线电管理条例》。注意无线电事务跟军队关系密切。
- **业余**无线电管理的法规是**工信部**制定的《业余无线电台管理办法》。
- 业余电台的法定用途：**自我训练、相互通信和技术研究**。

- A类电台不论在哪个波段，最大发射功率都不能超过25W。
- 不同类别的区别只有两个：发射频率范围和最大发射功率。

- 考操作证没有年龄限制，但是申请设台必须年满18周岁。
- 有操作证可以在任何合法电台上进行发射，跟年龄无关。
- 没有操作证的学员只能在监督下进行短时间体验性发射，且由电台负责人承担责任。

- 申请设台应提供**两种**表格，同时必须具备操作证。（工信部网站可以下载）

- 电台执照续期：有效期届满一个月前。

- 业余电台应符合的技术指标有两个：**频率容限**和**杂散发射**。（凡是出现“带外发射”的都不是正确答案）

**频谱划分相关**

- **LK1031**：430MHz（70cm）业余频段中留给业余卫星通信使用，话音及其他通信方式不应占用的频率段为：**435\~438**
- **LK1032**：144MHz（2m）业余频段中留给业余卫星通信使用，话音及其他通信方式不应占用的频率段为：**145.8\~146**
- **LK0171**：144MHz（2m）频段进行本地联络时应避免占用的频率为：144\~144.035 和 145.8\~146
- **LK0172**：430MHz（70cm）频段进行本地联络时应避免占用的频率为：431.9\~432.240 和 435\~438

关于频谱管理的术语：

- 划分：频带→业务
- 分配：频点频道→部门
- 指配：频点频道/呼号→电台

同一频段的业务分为**主要**和**次要**。原则是：

- 次要业务不得干扰主要业务。
- 次要业务不得对来自主要业务的干扰提出保护要求。
- 但是任何业务都可以对来自不高于的它的业务的干扰提出保护要求。

业余业务和卫星业余业务专用的频段：7MHz、14MHz、21MHz、28MHz、47GHz。记忆方法：前四个都是7的倍数。

UV调频中继台的标准频差：2米波段600kHz；0.7米波段5MHz。

|dBi|dBd|dB|
|------|
|相对于理想点源|相对于半波长偶极子|没有意义|

- 对于同一个增益值，dBi比dBd大2.15
- 总结起来就是只要看到0.8就是正确答案（LK0932、LK0933，试卷中至多出现1道）

|DP|GP|VERT|YAGI|BEAM|
|----------|
|偶极子|垂直接地|垂直|八木|定向|

信号报告必须体现的几个要素：日期和时间、双方呼号、信号报告

- 客席发射：去别人的电台发射。
- 异地发射：带上自己的电台去外地发射。
- 无论是客席还是异地，呼号中必须体现位置（分区）信息，操作员的身份信息不重要。

分区编码：

- 我国的**CQ分区**是：23、24、27
- 我国的**ITU分区**是：33、42、43、44、50

**滤波器的使用**

- 题LK0574：中继台的上行频率指的是它的收信频率（因为中继台在上）、下行频率是它的发信频率。因此收信频率为F1、发信频率为F2。为了防止发信机干扰收信机，需要做两方面工作：一是不允许发信机发出F1的频率，二是不允许收信机收到F2的频率。因此答案就是：给发信机加中心频率为F1的带阻，给收信机加中心频率为F2的带阻。
- 题LK0575：HF的发射频率一般都是1M以上，因此应该加截止频率为1M的低通（以便滤除HF以外的杂散产物，同时允许音频信号通过电话线）。

**电磁辐射污染**

- 衡量标准是24小时内任意6分钟内。
- 对人伤害最大的波段是30M~3G。




