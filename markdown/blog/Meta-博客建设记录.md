
#!title:    博客建设记录
#!date:     2018-02-14

#!content

# 各版本视觉传达设计

![V0 2016.11](./image/B/blog-screenshot/V0.png)

![V1 2017.09](./image/B/blog-screenshot/V1.jpg)

![V2 2018.02](./image/B/blog-screenshot/V2.jpg)

![V3 2018.07](./image/B/blog-screenshot/V3.jpg)

![V4 2019.10](./image/B/blog-screenshot/V4.jpg)

![V5 2021.02](./image/B/blog-screenshot/V5.jpg)

# 内容和表达风格

本站的表达风格，总体上是冷静的、庄重的、规范的，而不是热情的、诙谐的、散漫的。力求生动、准确、简练、新颖。

# 视觉传达设计

媒介自适应、暗黑风格、排版原则、富文本内容

- 少即是多。（奥卡姆剃刀）
- 避免过度设计。
- 注意留白，谨防花里胡哨。
- 说话要说清楚。说不清楚，意味着没有想清楚。但是想不清楚，也可以说出来。
- 版式是重要的语言。版式一般应该具有正确的语义，兼顾美观。

- 善用四件套：圆角、阴影、模糊、渐变
- 应避免纯黑，善用灰色。
- 克制使用动效。非必要，不动效。不鸣则已，一鸣惊人。

- 关于段首缩进，参考[这篇文章](http://bewho.us/mindmeters/why-indent-in-the-first-paragraph/)。
- 博客目前以[无衬线字体](https://en.wikipedia.org/wiki/Sans-serif)为主。无衬线字体在高分辨率的电子屏幕上比较清晰，但衬线字体（如宋体）在纸上比较清晰。
- 字距非常重要。恰当的字距可以大大缓解阅读者的视觉疲劳。
- 不要对汉字和假名使用斜体样式。
- 中西文之间是否加空格，视心情而定。
- 汉语拼音的拼写要规范。除非有技术上的困难，一般都应该**带调号**。用西文拼写中国姓名，姓氏要放在前面。格式为：Zhuge Kongming。
- 中文引号既可以使用直引号，也可以使用弯引号。

# 版本控制

勘误与更新

GitHub目前看来可能是最适合作为博客平台的平台。作为真·独立博客和寄生于平台的自媒体的折中，它的优势如下：

- Git本身是代码管理工具，天然地适合处理语义化数据（文本）。
- Git适合社会化开发，可用于实现评论系统。
- Git是分布式的，使用得当的话不需要担心数据丢失的问题。
- Git可以追踪版本记录，这非常有利于长期填坑。

但GitHub是有劣势的，例如

- 它终究是寄生于GitHub这个平台，内容不能被一般的搜索引擎抓取。
- 维护门槛较高，受众面太窄，内容难以传播、变现。

# 网页技术和语义化

# 博客更新记录

**2022年3月下旬更新**：在Markdown解析器解耦的工作的基础上，“灵感”页开始支持Markdown格式。

**2021.4.16更新**：博客改用 MathJax 3.1.2，并集成进博客自身，不再调用外部CDN提供的资源。从此开始，已经消除了几乎所有外部依赖，成为一个自持的内容展示工具了。为什么强调自持性？因为①方便随时迁移和备份；②保持合理的兼容性、固化技术状态；③博客应该能在没有网络甚至没有浏览器的条件下阅读或解读。

**V4.0更新（2019-10-23）**：功能更新：①为“灵感”页增加了侧栏目录，方便快速定位到某个灵感。增加了标签索引，可以根据灵感中标注的标签，建立倒排索引，使用标签对灵感进行归类。②增加个人Wiki功能，也就是“百科”栏目。原有的“书签”栏目作为单独的Wiki文章。视觉更新：继续沿用 Material Design 风格的设计。更换了封面图片，优化了个别样式。技术更新：①使用TypeScript彻底重构了 Mikumark Markdown 解析器，同时修改了Markdown文章模板的格式。②博客彻底重构为SPA（单页应用），全站目前仅有1个HTML页面。③文章URL优化：`https://bd4sur.com/#/blog/博客文章标题`

**V3.1更新（2019-01-10）**：文章页模板与Markdown文档彻底分离，同时保留了对文档内嵌JavaScript和CSS代码的支持。理顺了文章页CSS样式类的关系。将MikuMark.js模块化。增加了伪加载动效。通过前端路由，实现quasi-SPA的特性。

# 技术问题记录

**博客域名解析（2018-10-28）**

目标是将新买的域名 bd4sur.com 解析到 bd4sur.github.io。这里需要做两件事情：

+ 在阿里云的云解析配置中，增加CNAME配置：@.bd4sur.com，解析到 bd4sur.github.io。其中“@”符号代表空的二级域名。套餐最低TTL为10分钟。
+ 在GitHub的站点根目录下增加一个文件，文件名为“CNAME”，内容只有一行，写 bd4sur.com。

设置就绪后，等一段时间（至少要过一次TTL时间），即可正常解析。

CNAME记录和A记录都可以指定域名解析规则，区别在于CNAME记录是将域名解析到其他域名，而A记录是将域名解析到IP地址。本次设置的目的是将 bd4sur.com 映射到 GitHub 提供的 bd4sur.github.io，因此云解析服务侧需要配置CNAME记录；同时 GitHub 侧也需要配置CNAME记录，用于将 bd4sur.github.io 重定向到 bd4sur.com，然后通过云解析服务解析到 bd4sur.github.io 所在的服务器。这一过程并不会形成死循环，猜想 GitHub 侧的CNAME记录并不是真正的CNAME记录。详细的原因还不清楚，需要继续学习。

------

**使用TravisCI自动生成RSS（2019-02-20）**

为了实现RSS自动更新，使用 Travis CI 持续集成工具，在新内容被推送至远端仓库的同时，触发自动构建脚本，生成新的RSS并自动提交到远端仓库。所谓的持续集成（CI），是敏捷开发的一个概念，指的是在开发过程中不断将新产出的代码集成到主干分支上。但是，频繁的集成，势必需要高度自动化的测试和构建工具，才能保证持续集成到主干的代码不出现质量问题。Travis CI便是这样一个工具，它与GitHub无缝对接，对开源项目免费，支持多种语言（开发的项目），提供了自动化测试和构建的服务。利用Travis CI提供的便利，可以实现RSS的自动更新。这篇文章简要记录了Travis CI的配置过程。

第一步：使用GitHub账号，注册Travis CI账号。

第二步：编辑根目录下配置文件`.travis.yml`，内容如下：

```
language: generic
dist: xenial

branches:
  only:
    - master

before_install:
  - sudo apt-get install git
  - chmod +x ./CI/push.sh

script:
  - node ./CI/build.js $TRAVIS_COMMIT_MESSAGE

after_success:
  - ./CI/push.sh
```

解释：

- language指的是CI支持的语言，这里generic指的是支持所有可支持的语言，参见[文档](https://docs.travis-ci.com/user/languages/minimal-and-generic/)。
- dist指的是虚拟机运行的环境，xenial即Ubuntu 16.04LTS。这里需要解释一下，每次提交触发自动构建时，CI系统都会创建一个虚机环境，在此环境中运行构建流程。
- branches指的是参与CI的分支，这里只有一个master分支。
- before_install指的是安装依赖之前所执行的动作。根据[文档](https://docs.travis-ci.com/user/job-lifecycle/)所述，一个CI任务的生命周期包括install（安装依赖）和script（执行构建脚本）两大流程。上述配置文件中，before_install有两个动作，一是安装git，二是给已有的脚本加上可执行权限，免得执行时报权限错误。
- script是构建的主体流程。这里执行`build.js`脚本，其功能是根据文章目录和“灵感”内容生成RSS文档，并输出到虚机的文件系统中。script各条指令均返回0，即执行成功，意味着构建成功。否则为构建失败。
- after_success是构建成功后需要走的流程。刚才的构建流程只是把生成的RSS保存在虚机文件系统中，并没有推送到远端仓库。因此，在这一步中，执行`push.sh`脚本，将生成的RSS推送到远端仓库。

第三步：添加`build.js`和`push.sh`脚本，脚本内容这里不详述。唯一需要注意的是对于GitHub令牌的处理。在`push.sh`中，需要使用GitHub令牌执行推送动作，但是这个令牌应当是保密的，因此不可以直接写在配置文件或者脚本中。解决方案是：①在GitHub的设置-开发者选项-Personal access tokens中新建一个令牌，权限只提供仓库访问权限即可。然后点击“生成”，将生成的令牌复制出来并保存，注意这个令牌只在刚刚生成之后可以显示，以后就看不到了。②在Travis的仓库设置中，增加一个环境变量，名字为`GITHUB_TOKEN`（总之就是脚本中使用的），值为刚才生成的Token。通过这种途径保存的环境变量，是加密的环境变量。

第四步：在Travis中，打开对应仓库的CI功能。此时，每次推送，都会触发CI的自动构建过程。

参考资料：

+ [Travis CI Doc](https://docs.travis-ci.com/)
+ [持续集成服务 Travis CI 教程](http://www.ruanyifeng.com/blog/2017/12/travis_ci_tutorial.html)

------

**HTML空格的语义（2018.2.14）**

写Mikumark.js时，为了支持连续空格，将原始MD文本中的所有空格替换为HTML的`&amp;nbsp;`，即不换行空格（No Break SPace）。但是在后来的测试中，发现`&amp;nbsp;`会带来一系列问题：

+ MD文本中不再支持原生HTML标签，因为HTML标签中的空格都被转义成无HTML语义的`&amp;nbsp;`字符串，并导致HTML文档结构的混乱。
+ 段落文本的按西文单词换行功能（即CSS的word-wrap）失效，仍然是因为`&amp;nbsp;`是无HTML语义的，word-wrap不会将`&amp;nbsp;`看作是具有词语分隔符语义的普通空格，而是与普通半角字母一样的空白字符，类似于中文全角空格。

**不推荐在Markdown内容文本中使用`&amp;nbsp;`，因为内容文本应尽可能独立于HTML。**更多的字符实体可参考这里：[HTML字符实体参考](http://www.w3school.com.cn/tags/html_ref_symbols.html)

------

**关闭弹出窗口后刷新原窗口（2018.2.22整理）**

这个需求是之前做记账系统时遇到的。

```
window.opener.location.reload(); //刷新父窗口中的网页
window.close(); //关闭当前窗口
```

------

**JavaScript的顺序执行（动效·交互）（2018.10.18整理）**

在今年（2018年）2月开发MikuRec初版时，遇到了一个关于交互的问题。问题是这样的：由于解释器执行需要一定的时间，在这段时间内，需要把“执行”按钮变成灰色，标题改成“正在执行”；待解释器执行完毕后，再把按钮恢复成原来的颜色，标题改回原来的文字。这是一个顺序的过程，第一想法是这样写：

```:javascript
onclick = ()=>{
    $(标题).html('执行中');
    interpreter.run(); // 阻塞片刻
    $(标题).html('执行完毕');
};
```

这里是一个演示：<button class="MikumarkButton" id="test20181018" onclick="(()=>{$('#test20181018').html('执行中（大量循环）'); for(let i=0;i<99999999;i++){} $('#test20181018').html('执行完毕');})()">【点击这里查看效果】</button>

尽管操作DOM的jQuery代码位于阻塞代码的两端，但是并没有体现出顺序执行的效果。猜想DOM操作的本质是被放在事件队列中，然后触发浏览器局部重渲染的事件。换句话说，DOM操作是非阻塞的。

按照JavaScript的异步特性，事件队列内的动作会在阻塞代码执行完毕后执行，因此上面代码的执行顺序实际是：第一个DOM操作放入事件队列→阻塞循环片刻→第二个DOM操作放入事件队列→从队列中取出事件依次执行。这就导致了第一次DOM操作实际上是一闪而过，而没有体现出来。

正确的方式是利用回调，即CPS，以显式表达程序控制流。实现回调的方式至少有两种，一种是JS内置的Promise机制，另一种就是手写CPS。这里采用手写CPS的方式。

这种方法的原理是：充分利用JS事件循环的特性，将连贯的动作按照回调嵌套指定的顺序加入时间队列，随后按顺序执行时间队列中的DOM操作和阻塞代码。代码如下：

```:javascript
function actionStart(cont)=>{
    $(标题).html('执行中');
    setTimeout(cont, 10); // 短暂延时，尽量保证事件顺序，下同
}
function actionRunning(cont) {
    interpreter.run(); // 阻塞片刻
    setTimeout(cont, 10);
}
function actionFinish(cont) {
    $(标题).html('执行完毕');
    setTimeout(cont, 10);
}

onclick = ()=>{
    actionStart(()=>{
        actionRunning(()=>{
            actionFinish(()=>{});
        });
    });
};
```

演示：<button class="MikumarkButton" id="test201810182" onclick="(()=>{((cont)=>{$('#test201810182').html('执行中');setTimeout(cont, 10);})(()=>{((cont)=>{for(let i=0;i<399999999;i++){} setTimeout(cont, 10);})(()=>{((cont)=>{$('#test201810182').html('执行完毕');setTimeout(cont, 10);})(()=>{});});});})()">点我</button>

如果同步执行的顺序比较复杂，最好使用原生Promise对象，以避免堕入回调地狱。

------

**关于安卓端文字不居中的问题（2018.11.24整理）**

在安卓系统的浏览器上，以下样式会出现文字不居中的问题：

```
<span style="
    display: inline-block;
    border: 1px solid #aaaaaa;
    height: 30px;
    line-height: 30px;
    font-size: 13px;
">Android下文字不居中</span>
```

<span style="display: inline-block; border: 1px solid #aaaaaa; height: 30px; line-height: 30px; font-size: 13px;">Android下文字不居中</span>

在iOS的Safari，以及PC端各浏览器均没有这个问题。

解决这个问题有[多种workaround](http://www.fxss5201.cn/project/cssProject/lineHeight/)，但是为简单和语义化起见，暂时不打算解决此问题。这里仅记录下这个“特性”。

