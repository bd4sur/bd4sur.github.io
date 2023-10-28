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

# 自然语言处理

## Transformer

![[来源](https://www.youtube.com/watch?v=-9vVhYEXeyQ)](./image/G4/bert-3d.png)

- https://arxiv.org/abs/1706.03762
- https://jalammar.github.io/illustrated-transformer/
- https://nlp.seas.harvard.edu/2018/04/03/attention.html

# 机器视觉
