#!title: 无线电测定

#!content

# 雷达研究记录

![某款毫米波雷达的射频模块，图片出处不详](./image/G3/radar/mmw-radar.jpg)

## 2022-03-11

昨天测试的穿墙雷达，原则上是可以感知到墙体背后运动人体的存在，但无法获得更多的信息。人在墙后走动，会引起接收信号电平的微弱摆动，摆幅不到1个dBm。

可以这样理解：用手电筒从前面照射铝箔纸，铝箔纸后面有个东西在动。在铝箔纸前面，隐约可以看到铝箔纸背面有影子在动，但仅此而已。

目前的想法是，先从多天线和MIMO开始研究，做好知识准备。雷达不是个随便就能搞定的东西。

# 远望号航天测量船大型天线配置

![[来源：归零工作室](https://t.bilibili.com/574813761197383334)](./image/G3/radar/yuanwang.png)

# 参考资料

- https://en.wikipedia.org/wiki/Continuous-wave_radar
- [radartutorial.eu](https://www.radartutorial.eu/index.en.html)
- [PyRAPID](http://radar.alizadeh.ca/)
- [Third version of homemade 6 GHz FMCW radar](https://hforsten.com/third-version-of-homemade-6-ghz-fmcw-radar.html)
- [Broadband terahertz time-domain spectroscopy and fast FMCW imaging: Principle and applications](http://cpb.iphy.ac.cn/article/2020/2034/cpb_29_7_078705.html)
