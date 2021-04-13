import struct
import numpy as np
import time
import os
import sys
import datetime

# 用户指定目录
oriOutputDir = sys.argv[1]                             # 用户选择的输出文件目录
configDir = sys.argv[2]                                # 用户指定的配置文件所在目录
# 上一步转换pickle后生成的input数据所在目录
pickleDataDir = os.path.join(oriOutputDir, "pickleDir") # pickle data dir
inputDataDir = os.path.join(oriOutputDir, "textDir")


print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
      "[I] Start to run mnist_send_input_back.py script. ", flush=True)
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
      "[I] Input data dir is: ", inputDataDir, ". ", flush=True)

# baseDirPath = sys.argv[1]
# print("base dir is: ", baseDirPath)


CLIENT_IP = '192.168.1.254'
TCP_PORT = 10123
MODEL_DEPLOY_MASTER = 0
SPIKE_DEPLOY_MASTER = 0
SET_TICK = 3
TCP_CLEAR_PROCESS = 4
TCP_ENABLE_PROCESS = 5
TCP_CLEAR_START = 6


# 配置文件目录
configFile = os.path.join(configDir, "config.b")


print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
      "[I] Config file ", configFile, " checked ok. ", flush=True)


# set_tick_time(conn1, 5000000)
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
      "[I] Set tick time ok.", flush=True)

count = 0
for file in os.listdir(inputDataDir):  # file 表示的是文件名
        count = count+1
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'),
      "[I] There are all ", str(count), " files.", flush=True)

i = 0
for file in os.listdir(pickleDataDir):
    # get file name
    name_arr = file.split(".")
    img_name = ""
    for m in range(len(name_arr) - 1):
        img_name += name_arr[m]

    # 首先发送给MASTER 模型
    roxTxt = os.path.join(inputDataDir, str(img_name), "row.txt")
    inputTxt = os.path.join(inputDataDir, str(img_name), "input.txt")

    with open(roxTxt, 'r') as row:
        row_list = row.readlines()
    with open(inputTxt, 'r') as file:
        input_list = file.readlines()
    # cheng_conv = Convert()
    pos = 0
    idx = 0
    pr = []
    result = []
    spike = [0] * 10


    Number = str(i)
    i = i +1
    print(Number + " ")
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] The ", str(file), " image recognition results is ", str(Number), ". ", flush=True)
    print("RECOGNITION RESULT: **", Number, "**", img_name, "**", flush=True)
    print("ORIGINAL IMAGE: ##", img_name, "##", flush=True)
    # f.write(Number)
    # f.write('\r')
    # exit(0)
    # clear_start(conn1, 1)
    time.sleep(1)
    
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Recognize one image ok. ", flush=True)

# f.close()
# f1.close()
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Recognition FINISHED!", flush=True)
