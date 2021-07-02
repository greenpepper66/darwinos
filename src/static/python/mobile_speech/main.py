# -*- coding:utf-8 -*-
import os
from flask.wrappers import Response
import numpy as np
import brian2
import pickle
from flask import Flask
import threading
# from data_encode import gen_input
import pyaudio
import wave
import librosa
import time
from data_encode import gen_input
import sys
import time
import datetime


inputImgFile = sys.argv[1]  # wav音频文件
configDir = sys.argv[2]  # 解包后的配置文件路径
outputDir = sys.argv[3]  # 生成的编码文件所在路径 

print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "start speech audio encode.")


SHARE_FRAMES = None
SNN_MODEL_FILE_PATH = os.path.join(configDir, "br2.pkl")
LAYER_WIDTH_FILE_PATH = os.path.join(configDir, "layerWidth1_1")
NODE_LIST_FILE_PATH = os.path.join(configDir, "nodelist1_1")
INPUT_LAYER1_FILE_PATH = os.path.join(configDir, "input_to_layer_1.pickle")
INPUT_TXT_FILE = os.path.join(outputDir, "input.txt")
ROW_TXT_FILE = os.path.join(outputDir, "row.txt")
PADU = pyaudio.PyAudio()
AUDIO_STREAM = None
CHUNK_SIZE =2048
RATE = 44100
RECORD_DURA = 2 # seconds
WAV_FILE = inputImgFile
NEW_AUDIO_COME = False
FEAT_VAL_OFFSET=800




def preprocess_wav():


    audio_seq, sr = librosa.load(WAV_FILE)
    mfcc_ft = librosa.feature.mfcc(np.array(audio_seq, dtype="float32"), sr=sr)
    mfcc_ft = np.array(mfcc_ft, dtype="float32")
    print("mfcc feat shape={}".format(np.shape(mfcc_ft)))
    mfcc_ft += FEAT_VAL_OFFSET
    
    for i in range(np.shape(mfcc_ft)[0]):
        mfcc_ft[i] = mfcc_ft[i] - mfcc_ft[i].min()
        fac = 300.0 / mfcc_ft[i].max()
        mfcc_ft[i] = mfcc_ft[i] * fac

    mfcc_ft = mfcc_ft[:,::4]
    mfcc_ft = mfcc_ft.astype("int32").astype("float32")
    mfcc_ft /= 300.0
    print("mfcc max={}, min={}".format(np.max(mfcc_ft), np.min(mfcc_ft)))
    return mfcc_ft




def real_time_snn_detect():
    with open(SNN_MODEL_FILE_PATH, "rb") as f:
        snn_model = pickle.load(f)
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Loading snn model finish.")
    
    br2_neurons=[]
    br2_synapses=[]
    model_eqs="""
        dv/dt = bias : 1
        bias : Hz
    """
    for i in range(len(snn_model["neurons"])):
        br2_neurons.append(brian2.NeuronGroup(snn_model["neurons"][i], model_eqs, method="euler", threshold="v >= v_thresh", reset="v = v - v_thresh", dt=1*brian2.ms))
    
    for i in range(len(snn_model["synapses_i"])):
        br2_synapses.append(brian2.Synapses(br2_neurons[i], br2_neurons[i+1], model="w : 1", on_pre="v += w", dt=1*brian2.ms))
        br2_synapses[-1].connect(i=snn_model["synapses_i"][i], j=snn_model["synapses_j"][i])
        br2_synapses[-1].w = snn_model["synapses_w"][i]

    br2_output_spike_monitor = brian2.SpikeMonitor(br2_neurons[-1])
    br2_input_spike_monitor = brian2.SpikeMonitor(br2_neurons[0])
    br2_net = brian2.Network(br2_neurons, br2_synapses, br2_output_spike_monitor, br2_input_spike_monitor)
    br2_net.store()
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Finish initialize snn.")


    with open(LAYER_WIDTH_FILE_PATH, "rb") as f:
        layerWidth = pickle.load(f)
    with open(NODE_LIST_FILE_PATH, "rb") as f:
        nodeList = pickle.load(f)
    with open(INPUT_LAYER1_FILE_PATH, "rb") as f:
        in_layer1 = pickle.load(f)


    audio_feat = preprocess_wav()
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Loading audio finish.")


    tmpAudio = audio_feat.flatten() / brian2.ms
    for i in range(len(br2_neurons[0].bias)):
        if i < len(tmpAudio):
            br2_neurons[0].bias[i] = tmpAudio[i]
        else:
            br2_neurons[0].bias[i] = 0.0
     
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Running....", br2_neurons[0].bias)




    br2_net.run(snn_model['run_dura']*brian2.ms, namespace={"v_thresh": snn_model["v_thresh"]})
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Finish.")

    out_spikes = br2_output_spike_monitor.spike_trains()
    out_spikes = [len(e) for e in out_spikes.values()]
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "out spikes={}, pred_label={}".format(out_spikes, np.argmax(out_spikes)))

    input_spike_seqs = []
    for i in range(len(br2_input_spike_monitor.spike_trains().items())):
        input_spike_seqs.append([i, [int(tm/brian2.ms) for tm in list(br2_input_spike_monitor.spike_trains()[i])]])

    # 数据重排，写入缓存文件，用于显示脉冲图
    spike_tuples = []
    for i in range(len(input_spike_seqs)):
        for j in range(len(input_spike_seqs[i][1])):
            spike_tuples.append([input_spike_seqs[i][1][j], input_spike_seqs[i][0]])
    print("ENCODE RESULT: **", spike_tuples, "**", flush=True)



    br2_net.restore()
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Reset snn network...")

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
        input_node_map[node_number].update({dst % neuron_num : dst})
    
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Generating binary files...")
    gen_input.change_format(in_layer1)
    gen_input.gen_inputdata(in_layer1, input_spike_seqs, input_node_map, snn_model["run_dura"],INPUT_TXT_FILE, ROW_TXT_FILE)
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "Binary files generate done.")



if __name__ == '__main__':
    real_time_snn_detect()

