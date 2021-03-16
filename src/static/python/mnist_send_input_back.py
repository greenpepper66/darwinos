import struct
import numpy as np
import time
import requests
import hashlib
from comm import ClientConnection
import socket
from convert import Convert
import threading
import os
import sys
import datetime

# 用户指定目录
oriOutputDir = sys.argv[1]                             # 用户选择的输出文件目录
configDir = sys.argv[2]                                # 用户指定的配置文件所在目录
inputDataDir = os.path.join(oriOutputDir, "textDir")  # 上一步转换pickle后生成的input数据所在目录


print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Start to run mnist_send_input_back.py script. ", flush=True)
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Input data dir is: ", inputDataDir, ". ", flush=True)

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

def md5(fname):
    hash_md5 = hashlib.md5()
    with open(fname, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def get_slave_ip_port_fid(config_file_path):
        ip = ''
        port = ''
        file_id = ''
        md5value = md5(config_file_path)
        jsn = requests.post(
            "http://192.168.1.254/get_config_info_by_md5/", {"key1": md5value, }).json()
        if jsn["code"] == 0:
            ip = jsn["ip"]
            port = jsn["port"]
            file_id = jsn["file_id"]
            status = jsn["status"]
        else:
            print(jsn)
            exit(0)
        return ip,port

# 配置文件目录
configFile = os.path.join(configDir, "config.b")
ip, port = get_slave_ip_port_fid(configFile)

print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Config file ", configFile, " checked ok. ", flush=True)

conn1 = ClientConnection(ip, port)
conn1._socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, True)
def set_tick_time(conn, tick_time):
    tick_times = [tick_time]
    length = len(tick_times)
    send_bytes = bytearray()
    for i in range(length):
        send_bytes += struct.pack('<Q',tick_time)
    conn.send(SET_TICK,send_bytes)
    id_, result = conn.receive()
    while result is None:
        id_, result = conn.receive()
    # print(result)

set_tick_time(conn1, 5000000)
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Set tick time ok.", flush=True)

def clear_start(conn, clear_enable):
    clear_enables = [clear_enable]
    length = len(clear_enables)
    send_bytes = bytearray()
    for i in range(length):
        send_bytes += struct.pack('<Q',clear_enable)
    conn.send(TCP_CLEAR_START,send_bytes)
    id_, result = conn.receive()
    while result is None:
        id_, result = conn.receive()
    # print(result)

# while 1:

# f = open(os.path.join(baseDirPath, "result.txt"),"a+")
# f.truncate(0)
# f1 = open(os.path.join(baseDirPath, "result_str.txt"),"a+")
# f1.truncate(0)

# path = os.path.join(baseDirPath, "pickle_encode_output")
count = 0
for file in os.listdir(inputDataDir): #file 表示的是文件名
        count = count+1
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] There are all ", str(count), " files.", flush=True)

for j in range(count):
    i = j + 1
    # 首先发送给MASTER 模型
    roxTxt = os.path.join(inputDataDir, str(i), "row.txt")
    inputTxt = os.path.join(inputDataDir, str(i), "input.txt")
    
    with open(roxTxt, 'r') as row:
        row_list = row.readlines()
    with open(inputTxt, 'r') as file:
        input_list = file.readlines()
    cheng_conv = Convert()
    pos = 0
    idx = 0
    pr = []
    result = []
    spike = [0] * 10
    while pos < len(input_list):
        rank = int(row_list[idx].strip(), 16)
        idx += 1
        input_tick = input_list[pos:rank]
        input_tick = cheng_conv.convert(input_tick)
        conn1.send(SPIKE_DEPLOY_MASTER,input_tick)
        id_,result = conn1.receive()
        while result is None:
            id_,result = conn1.receive()
        if len(result) > 8:
            fmt = 'Q' * int(len(result)/8)
            result = struct.unpack(fmt,result)
            for i in range(0, len(result), 2):
                spike[int(result[i + 1] % (1 << 32) // (1 << 16))] += 1
        # if len(result) > 7:
        #     fmt = 'Q' * int(len(result)/8)
        #     result = struct.unpack(fmt,result)
        #     print([hex(res) for res in result])
        pos = rank

    # t.start()
    # print(spike)
    # print("Hello, World dddd!")

    spike_str = str(spike)
    # f1.write(spike_str)
    # f1.write('\r')
    
    max_index = spike.index(max(spike))    
    Number = str(max_index)
    print(Number + " ")
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] The ", str(i), " image recognition results is ", str(Number), ". ", flush=True)
    print("RECOGNITION RESULT: **", Number, "**", flush=True)
    # f.write(Number)
    # f.write('\r')
    # exit(0)
    clear_start(conn1, 1)
    time.sleep(1)
    
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Recognize one image ok. ", flush=True)

# f.close()
# f1.close()
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Recognition FINISHED!", flush=True)
