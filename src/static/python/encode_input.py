# -*- coding:utf-8 -*-
import brian2
import os
import numpy as np
import pickle
from PIL import Image
import json
import sys

################################
# param:
# argv[1] 图像源所在文件夹
# argv[2] 配置文件 br2.pkl 所在文件夹
# argv[3] 输出pickle文件保存路径
################################

imgSrcDir = sys.argv[1]
configDir = sys.argv[2]
outputDir = sys.argv[3]

#baseDirPath = os.path.dirname(os.path.abspath(__file__))
#baseDirPath = sys.argv[1]
print("imgSrc dir is: ", imgSrcDir)


print("Loading convert config file br2.pkl ...")
with open(os.path.join(configDir, "br2.pkl"), "rb") as f:
    info = pickle.load(f)

print("Creating...")
br2_neurons = []
br2_synapses = []
model_eqs = """
            dv/dt = bias : 1
            bias : Hz
        """
for i in range(len(info["neurons"])):
    br2_neurons.append(brian2.NeuronGroup(
        info["neurons"][i], model_eqs, method="euler", threshold="v >= v_thresh", reset="v = v - v_thresh", dt=1*brian2.ms))


for k in range(len(info["synapses_i"])):
    br2_synapses.append(brian2.Synapses(
        br2_neurons[k], br2_neurons[k+1], model="w:1", on_pre="v+=w", dt=0.1*brian2.ms))
    br2_synapses[-1].connect(i=info["synapses_i"][k], j=info["synapses_j"][k])
    br2_synapses[-1].w = info["synapses_w"][k]

br2_input_monitor = brian2.SpikeMonitor(br2_neurons[0])
br2_net = brian2.Network(br2_neurons, br2_synapses, br2_input_monitor)
br2_net.store()

print("start convert img into pickle format file ...")
count = 1
for file in os.listdir(imgSrcDir):
    img_path = os.path.join(imgSrcDir, file)
    img = Image.open(img_path)
    img = np.array(img, dtype="int32")/255
    br2_net.restore()
    br2_neurons[0].bias = img.flatten()/brian2.ms
    br2_net.run(info["run_dura"]*brian2.ms,
                namespace={"v_thresh": info["v_thresh"]}, report=None)
    input_spike = br2_input_monitor.spike_trains()
    input_spike_arrs = []
    for k, v in input_spike.items():
        input_spike_arrs.append(
            [k, np.array(v/brian2.ms, dtype="int32").tolist()])

    with open(os.path.join(outputDir, file[:-12]+".pickle"), "wb+") as f:
        # f.write(json.dumps(input_spike_arrs))
        pickle.dump(input_spike_arrs, f)

    print("Converting img " + str(count) + ": " + file + " ok ")
    count = count + 1
    
print("convert img into pickle format file finished ...")
