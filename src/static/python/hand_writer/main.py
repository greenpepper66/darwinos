# -*- coding:utf-8 -*-
import os
import flask
from flask.wrappers import Response
import numpy as np
import cv2
import brian2
import pickle
from flask import Flask
import threading
import multiprocessing
import base64
from data_encode import gen_input
import sys
import time
import datetime
import json
import requests
import socket


inputImgFile = sys.argv[1]  # base64编码的用户手写体数字图像文件
configDir = sys.argv[2]  # 解包后的配置文件路径
outputDir = sys.argv[3]  # 生成的编码文件所在路径 

print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "start hand-writer img encode.")

SNN_MODEL_FILE_PATH = os.path.join(configDir, "br2.pkl")
LAYER_WIDTH_FILE_PATH = os.path.join(configDir, "layerWidth1_1")
NODE_LIST_FILE_PATH = os.path.join(configDir, "nodelist1_1")
INPUT_LAYER1_FILE_PATH = os.path.join(configDir, "input_to_layer_1.pickle")
INPUT_TXT_FILE = os.path.join(outputDir, "input.txt")
ROW_TXT_FILE = os.path.join(outputDir, "row.txt")


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


def real_time_snn_detect():
    with open(SNN_MODEL_FILE_PATH, "rb") as f:
        snn_model = pickle.load(f)
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Loading snn model finish.")

    br2_neurons = []
    br2_synapses = []
    model_eqs = """
        dv/dt = bias : 1
        bias : Hz
    """
    for i in range(len(snn_model["neurons"])):
        br2_neurons.append(brian2.NeuronGroup(
            snn_model["neurons"][i], model_eqs, method="euler", threshold="v >= v_thresh", reset="v = v - v_thresh", dt=1*brian2.ms))

    for i in range(len(snn_model["synapses_i"])):
        br2_synapses.append(brian2.Synapses(
            br2_neurons[i], br2_neurons[i+1], model="w : 1", on_pre="v += w", dt=1*brian2.ms))
        br2_synapses[-1].connect(i=snn_model["synapses_i"]
                                 [i], j=snn_model["synapses_j"][i])
        br2_synapses[-1].w = snn_model["synapses_w"][i]

    br2_output_spike_monitor = brian2.SpikeMonitor(br2_neurons[-1])
    br2_input_spike_monitor = brian2.SpikeMonitor(br2_neurons[0])
    br2_net = brian2.Network(br2_neurons, br2_synapses,
                             br2_output_spike_monitor, br2_input_spike_monitor)
    br2_net.store()
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Finish initialize snn.")

    with open(LAYER_WIDTH_FILE_PATH, "rb") as f:
        layerWidth = pickle.load(f)
    with open(NODE_LIST_FILE_PATH, "rb") as f:
        nodeList = pickle.load(f)
    with open(INPUT_LAYER1_FILE_PATH, "rb") as f:
        in_layer1 = pickle.load(f)

    # 获取图像
    with open(inputImgFile, "r") as f:
        png_bs64 = f.read()
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Loading img finish.")

    img = base64.b64decode(png_bs64)
    img = cv2.imdecode(np.fromstring(img, np.uint8), cv2.IMREAD_COLOR)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, img = cv2.threshold(img, 40, 255, cv2.THRESH_BINARY)
    img = cv2.resize(img, (28, 28))
    img = np.array(img, dtype="float32") / 255.0
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Fetch one image.")

    br2_neurons[0].bias = img.flatten() / brian2.ms
    print("Running....")
    br2_net.run(snn_model["run_dura"]*brian2.ms,
                namespace={"v_thresh": snn_model["v_thresh"]})
    print("Finish.")
    out_spikes = br2_output_spike_monitor.spike_trains()
    out_spikes = [len(e) for e in out_spikes.values()]
    input_spike_seqs = []
    for i in range(len(br2_input_spike_monitor.spike_trains().items())):
        input_spike_seqs.append([i, [int(tm/brian2.ms) for tm in list(br2_input_spike_monitor.spike_trains()[i])]])
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "out spikes={}, pred label={}".format(out_spikes, np.argmax(out_spikes)))


    # 数据重排，发送给工具，用于显示脉冲图
    spike_tuples = []
    for i in range(len(input_spike_seqs)):
        for j in range(len(input_spike_seqs[i][1])):
            spike_tuples.append([input_spike_seqs[i][1][j], input_spike_seqs[i][0]])

    print("发送spikes：", spike_tuples)
    headers = {'Content-Type': 'application/json'}
    datas = json.dumps({"spikes": spike_tuples})
    r = requests.post("http://" + LOCALHOST_IP + ":5003/spike_tuples", data=datas, headers=headers)
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "post spike tuples finish.")


    br2_net.restore()
    # Encode input data
    input_node_map = {}
    neuron_num = int(np.math.ceil(layerWidth[1] / len(nodeList[0])))
    for line in in_layer1:
        dst = int(line[1])
        node_x = nodeList[0][dst // neuron_num][0]
        node_y = nodeList[0][dst // neuron_num][1]
        node_number = node_x * 64 + node_y
        if not node_number in input_node_map.keys():
            input_node_map[node_number] = {}
        input_node_map[node_number].update({dst % neuron_num: dst})

    gen_input.change_format(in_layer1)
    gen_input.gen_inputdata(in_layer1, input_spike_seqs, input_node_map,
                            snn_model["run_dura"], INPUT_TXT_FILE, ROW_TXT_FILE)



if __name__ == '__main__':
    real_time_snn_detect()
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "encode img finish.")

