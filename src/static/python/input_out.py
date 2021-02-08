import pickle
import time
import gen_input as gen_in
import math
import re
import os
import sys

# 用户指定目录
baseDirPath = sys.argv[1]
print("base dir is: ", baseDirPath)

path = os.path.join(baseDirPath, "img_encode_output")
count = 0
for file in os.listdir(path): #file 表示的是文件名
        count = count+1


for k in range(count):
    if __name__ == "__main__":
        # ------------------------------------- input ----------------------------------------------

        # str1 = 'bin_darwin_out/connfiles1_1'
        str1 = os.path.join(baseDirPath, "pickle_encode_config", "connfiles1_1")
        print(str1)
        fw = open(str1, 'rb')
        connfiles = pickle.load(fw)
        fw.close()

        # str2 = 'bin_darwin_out/layerWidth1_1'
        str2 = os.path.join(baseDirPath, "pickle_encode_config", "layerWidth1_1")
        fw = open(str2, 'rb')
        layerWidth = pickle.load(fw)
        fw.close()

        # str3 = 'bin_darwin_out/nodelist1_1'
        str3 = os.path.join(baseDirPath, "pickle_encode_config", "nodelist1_1")
        fw = open(str3, 'rb')
        nodelist = pickle.load(fw)
        fw.close()

    # ------------------------------------- input ----------------------------------------------总共只要一个

    # 加载输入层
        # f = open('darlang_out/input_to_layer_1.pickle', 'rb') #输入层到芯片的连接文件
        str4 = os.path.join(baseDirPath, "pickle_encode_config", "input_to_layer_1.pickle")
        f = open(str4, 'rb')
        in_conv1 = pickle.load(f)
        f.close()


        print("in_conv1 len: ", len(in_conv1))
        times = time.time()

        input_node_map = {}
        neuron_num = int(math.ceil(layerWidth[1] / float(len(nodelist[0]))))

        interval = 100  #

        for line in in_conv1:
            src = int(line[0])
            dst = int(line[1])
            node_x = nodelist[0][dst // neuron_num][0]
            node_y = nodelist[0][dst // neuron_num][1]
            nodenumber = node_x * 64 + node_y
            if not nodenumber in input_node_map.keys():
                input_node_map[nodenumber] = {}
            input_node_map[nodenumber].update({dst % neuron_num: dst})
        gen_in.change_format(in_conv1)

        time1 = time.time()
        print(time1)

        print('input done')

        # 加载spikes
        # t1 = []
        # for i in range(300):  #### 输入层neuron number
        #     t1.append([i, [1]])

        t1 = []
        str5 = os.path.join(baseDirPath, "img_encode_output", "img_idx_" + str(k) + ".pickle")
        print(str5)
        f = open(str5, 'rb')
        # f = open(f"bin_darwin_out/inputs/img_idx_{k}.pickle",'rb')
        t1 = pickle.load(f)

        # 输出文件所在目录，以编号命名文件夹
        outputPath = os.path.join(baseDirPath, "pickle_encode_output", str(k))
        isExists = os.path.exists(outputPath)
        if not isExists:
            os.mkdir(outputPath)
        # 每个文件夹下的输出文件
        inputTxt = os.path.join(outputPath, "input.txt")
        roxTxt = os.path.join(outputPath, "row.txt")

        gen_in.gen_inputdata(in_conv1, t1, input_node_map, int(interval), inputTxt, roxTxt)

        inputlist1, rowlist1 = gen_in.gen_inputdata_list(in_conv1, t1, input_node_map, int(interval))

        print(len(inputlist1))
        print('input done')

        time2 = time.time()
        print(time2 - time1)
