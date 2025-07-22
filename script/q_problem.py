import os
import random
import torch
import torch.nn as nn
import numpy as np
from torch.utils.data import DataLoader, TensorDataset
from torch.utils.tensorboard import SummaryWriter
from sklearn import metrics
from tqdm import tqdm

device = torch.device("cuda:1") if torch.cuda.is_available() else torch.device("cpu")

BATCH_SIZE = 2000
LEARNING_RATE = 1e-3
TRAIN_RATIO = 0.2
NUM_DIGITS = 5
NUM_CATEGORIES = NUM_DIGITS * 2 + 1
HIDDEN_DIMS = [32, 128, 1024, 1024, 128, 32]

# Q函数：一串数字中有多少个圈儿
def q_function(number: int) -> int:
    """
    Q函数：一串数字中有多少个圈儿。
        例如：q(2024)=1，q(888)=6
        出典：https://www.zhihu.com/question/338618946/answer/831919337、https://www.zhihu.com/question/341026031/answer/841578656
    """
    #         0  1  2  3  4  5  6  7  8  9  10
    qv_map = [1, 0, 0, 0, 0, 0, 1, 0, 2, 1, 0]
    istr = f"---------------------------{str(number)}"[-NUM_DIGITS:]
    qv = 0
    for i in range(NUM_DIGITS):
        d = 10 if istr[i] == "-" else int(istr[i])
        qv = qv + qv_map[d]
    return qv

def encode_number(n):
    """
    将一个整数变换成对应的矢量，作为神经网络的输入矢量。
    例如：114514变换为numpy.ndarray([1,1,4,5,1,4])
    """
    # return np.array([n >> d & 1 for d in range(NUM_DIGITS)], dtype=np.float32)
    istr = f"---------------------------{str(n)}"[-NUM_DIGITS:]
    return np.array([(10 if istr[i] == "-" else int(istr[i])) for i in range(NUM_DIGITS)], dtype=np.float32)

def create_dataset(train_ratio):
    """
    构造训练集和验证集
    """
    indexes = list(range(10 ** NUM_DIGITS))
    random.shuffle(indexes)
    train_x = torch.tensor(np.array([encode_number(v) for v in indexes[:int(10 ** NUM_DIGITS * train_ratio)]]), device=device, requires_grad=False)
    train_y = torch.tensor(np.array([q_function(v) for v in indexes[:int(10 ** NUM_DIGITS * train_ratio)]]), device=device, requires_grad=False)
    val_set = [(v, q_function(v)) for v in indexes[int(10 ** NUM_DIGITS * train_ratio):]]
    return TensorDataset(train_x, train_y), val_set

class QNet(nn.Module):
    """
    QNet：简单的多层感知机，用于解决Q问题。其层数和隐层维度在HIDDEN_DIMS中定义。
    """
    def __init__(self):
        super().__init__()
        self.layer_num = len(HIDDEN_DIMS)
        self.layers = nn.ModuleList()
        self.afs = nn.ModuleList()
        self.layers.append(nn.Linear(NUM_DIGITS, HIDDEN_DIMS[0]))
        self.afs.append(nn.ReLU())
        for i in range(self.layer_num-2):
            self.layers.append(nn.Linear(HIDDEN_DIMS[i], HIDDEN_DIMS[i+1]))
            self.afs.append(nn.ReLU())
        self.output = nn.Linear(HIDDEN_DIMS[self.layer_num-2], NUM_CATEGORIES)

    def forward(self, x):
        y = x
        for i in range(self.layer_num-1):
            y = (self.layers[i])(y)
            y = (self.afs[i])(y)
        return self.output(y)

    def predict(self, input_number):
        input_tensor = torch.tensor(encode_number(input_number), device=device)
        output = self.forward(input_tensor)
        return output.argmax()

def train():
    tb_writer = SummaryWriter(log_dir="log", comment='train')

    train_set, val_set = create_dataset(TRAIN_RATIO)
    data_loader = DataLoader(train_set, batch_size=BATCH_SIZE, pin_memory=False)
    model = QNet().to(device)

    # optimizer = optim.SGD(model.parameters(), lr=0.05, momentum=0.9)
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = torch.optim.lr_scheduler.ExponentialLR(optimizer, gamma=0.999)

    for epoch in range(100000):
        epoch_loss = 0
        for batch_index, batch in enumerate(data_loader):
            x, y = batch
            y_hat = model(x)
            loss = nn.CrossEntropyLoss()(y_hat, y)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            loss_value = loss.item()
            epoch_loss += loss_value
        scheduler.step()

        # 计算训练集损失和精度
        x_train, y_train_gold = data_loader.dataset.tensors
        y_train_pred = model(x_train).argmax(-1).detach()
        accuracy = metrics.accuracy_score(y_train_gold.cpu(), y_train_pred.cpu())
        print(f"Epoch={epoch}, lr={optimizer.param_groups[0]['lr']:.5e}, loss={epoch_loss:4.4f}, acc@train={accuracy}")
        tb_writer.add_scalar('loss@trainset', epoch_loss, epoch)

        # 计算验证集精度
        if epoch > 0 and epoch % 200 == 0:
            equal_count = 0
            val_results = []
            for x, y_gold in tqdm(val_set):
                y_hat = model.predict(x)
                if y_hat == y_gold:
                    flag = "√"
                    equal_count += 1
                else:
                    flag = "×"
                val_results.append(f"[{flag}] [{x}] 实际有 {y_gold} 个圈儿，预测有 {y_hat} 个圈儿")
            with open(os.path.join(os.path.dirname(__file__), 'val_results.txt'), 'w', encoding="utf-8") as f:
                f.write("\n".join(val_results))
            print(f"Acc@val = {equal_count / len(val_set)}")

if __name__ == "__main__":
    train()
