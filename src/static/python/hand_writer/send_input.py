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
import time
import datetime
import requests
import socket
import json

configDir = sys.argv[1]        # 用户指定的配置文件所在目录
inputDir = sys.argv[2]         # input.txt row.txt数据所在目录
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "start hand-writer send input data.")

def get_host_ip():
    """
    查询本机ip地址
    :return:
    """
    try:
        s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
        s.connect(('8.8.8.8',80))
        ip=s.getsockname()[0]
    finally:
        s.close()

    return ip
LOCALHOST_IP = get_host_ip()


# test
spike = [0,1,2,30,4,5,6,7,8,9]
max_index = spike.index(max(spike)) 
# 数据重排，发送给工具，用于显示脉冲图
output_tuples = []
for i in range(len(spike)):
    output_tuples.append([i, spike[i]])
print("发送spikes：", output_tuples)
headers = {'Content-Type': 'application/json'}
datas = json.dumps({"spikes": output_tuples, "result": max_index})
r = requests.post("http://" + LOCALHOST_IP + ":5003/get_result", data=datas, headers=headers)
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "post recognition result finish.")



# CLIENT_IP = '192.168.1.254'
# TCP_PORT = 10123    
# MODEL_DEPLOY_MASTER = 0
# SPIKE_DEPLOY_MASTER = 0
# SET_TICK = 3
# TCP_CLEAR_PROCESS = 4
# TCP_ENABLE_PROCESS = 5
# TCP_CLEAR_START = 6

# def md5(fname):
#     hash_md5 = hashlib.md5()
#     with open(fname, "rb") as f:
#         for chunk in iter(lambda: f.read(4096), b""):
#             hash_md5.update(chunk)
#     return hash_md5.hexdigest()

# def get_slave_ip_port_fid(config_file_path):
#         ip = ''
#         port = ''
#         file_id = ''
#         md5value = md5(config_file_path)
#         jsn = requests.post(
#             "http://192.168.1.254/get_config_info_by_md5/", {"key1": md5value, }).json()
#         if jsn["code"] == 0:
#             ip = jsn["ip"]
#             port = jsn["port"]
#             file_id = jsn["file_id"]
#             status = jsn["status"]
#         else:
#             print(jsn)
#             print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] get slave ip port failed. ", flush=True)
#             exit(0)
#         return ip,port


# configFile = os.path.join(configDir, "config.b")
# ip, port = get_slave_ip_port_fid(configFile)


# conn1 = ClientConnection(ip, port)
# conn1._socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, True)
# def set_tick_time(conn, tick_time):
#     print("set tick time")
#     tick_times = [tick_time]
#     length = len(tick_times)
#     send_bytes = bytearray()
#     for i in range(length):
#         send_bytes += struct.pack('<Q',tick_time)
#     conn.send(SET_TICK,send_bytes)
#     id_, result = conn.receive()
#     while result is None:
#         id_, result = conn.receive()
#     # print(result)

# set_tick_time(conn1, 5000000)

# def clear_start(conn, clear_enable):
#     clear_enables = [clear_enable]
#     length = len(clear_enables)
#     send_bytes = bytearray()
#     for i in range(length):
#         send_bytes += struct.pack('<Q',clear_enable)
#     conn.send(TCP_CLEAR_START,send_bytes)
#     id_, result = conn.receive()
#     while result is None:
#         id_, result = conn.receive()
#     # print(result)



# isExists1 = os.path.exists(os.path.join(inputDir, "row.txt"))
# isExists2 = os.path.exists(os.path.join(inputDir, "input.txt"))


# if isExists1 and isExists2:
#     roxTxt = os.path.join(inputDir, "row.txt")
#     inputTxt = os.path.join(inputDir, "input.txt")
    
#     print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] open rowText. ")

#     with open(roxTxt, 'r') as row:
#         row_list = row.readlines()
#     with open(inputTxt, 'r') as file:
#         input_list = file.readlines()
#     cheng_conv = Convert()
#     pos = 0
#     idx = 0
#     pr = []
#     result = []
#     spike = [0] * 10
#     while pos < len(input_list):
#         rank = int(row_list[idx].strip(), 16)
#         idx += 1
#         input_tick = input_list[pos:rank]
#         input_tick = cheng_conv.convert(input_tick)
#         conn1.send(SPIKE_DEPLOY_MASTER,input_tick)
#         id_,result = conn1.receive()
#         while result is None:
#             id_,result = conn1.receive()
#         if len(result) > 8:
#             fmt = 'Q' * int(len(result)/8)    # Q: unsigned long long
#             result = struct.unpack(fmt,result)
#             for i in range(0, len(result), 2):
#                 spike[int(result[i + 1] % (1 << 32) // (1 << 16))] += 1
#         pos = rank


#     spike_str = str(spike)
#     max_index = spike.index(max(spike))  

#     # 发送芯片识别结果
#     # 数据重排，发送给工具，用于显示脉冲图
#     output_tuples = []
#     for i in range(len(spike)):
#         output_tuples.append([i, spike[i]])
#     print("发送spikes：", output_tuples)
#     headers = {'Content-Type': 'application/json'}
#     datas = json.dumps({"spikes": output_tuples, "result": max_index})
#     r = requests.post("http://" + LOCALHOST_IP + ":5003/get_result", data=datas, headers=headers)
#     print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "post recognition result finish.")



#     Number = str(max_index)
#     print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] get Number. ")
#     print(Number + " ")
#     print("HANDWRITERRECOGNITION RESULT: **", Number, "**", flush=True)

#     clear_start(conn1, 1)

#     # # 删除文件
#     # os.remove(os.path.join(inputDir, "row.txt"))
#     # os.remove(os.path.join(inputDir, "input.txt"))


print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] HANDWRITERRECOGNITION FINISHED!", flush=True)

