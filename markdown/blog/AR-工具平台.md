#!title:    工具平台
#!date:     

#!content

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
