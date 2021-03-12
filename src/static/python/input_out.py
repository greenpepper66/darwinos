import pickle
import time
import gen_input as gen_in
import math
import re
import os
import sys
import datetime

# 用户指定目录
oriOutputDir = sys.argv[1]                             # 用户选择的输出文件目录
configDir = sys.argv[2]                                # 用户指定的配置文件所在目录
pickleFileDir = os.path.join(oriOutputDir, "pickleDir")  # 上一步编码的pickle文件所在目录


print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Start to run input_out.py script. ", flush=True)
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] The pickle file dir is: ", pickleFileDir, ". ",  flush=True)


# 转化的input.txt和row.txt所在文件夹
outputDir = os.path.join(oriOutputDir, "textDir")
isExists = os.path.exists(outputDir)
if not isExists:
    os.mkdir(outputDir)
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] MakeDir output dir is: ", outputDir, ". ", flush=True)


# 遍历有多少个pickle文件
# count = 0
# for file in os.listdir(pickleFileDir): #file 表示的是文件名
#     count = count+1
# print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] There are ", count, " pickle files. ", flush=True)



if __name__ == "__main__":
    # ------------------------------------- input ----------------------------------------------

    # str1 = 'bin_darwin_out/connfiles1_1'
    str1 = os.path.join(configDir, "connfiles1_1")
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Loading config ", str1, ". ", flush=True)
    fw = open(str1, 'rb')
    connfiles = pickle.load(fw)
    fw.close()

    # str2 = 'bin_darwin_out/layerWidth1_1'
    str2 = os.path.join(configDir, "layerWidth1_1")
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Loading config ", str2, ". ", flush=True)
    fw = open(str2, 'rb')
    layerWidth = pickle.load(fw)
    fw.close()

    # str3 = 'bin_darwin_out/nodelist1_1'
    str3 = os.path.join(configDir, "nodelist1_1")
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Loading config ", str3, ". ", flush=True)
    fw = open(str3, 'rb')
    nodelist = pickle.load(fw)
    fw.close()

    # ------------------------------------- input ----------------------------------------------总共只要一个

    # 加载输入层
    # f = open('darlang_out/input_to_layer_1.pickle', 'rb') #输入层到芯片的连接文件
    str4 = os.path.join(configDir, "input_to_layer_1.pickle")
    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Loading config ", str4, ". ", flush=True)
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

    print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Loading input layer done. ", flush=True)




    count = 0
    # for k in range(count):
    for file in os.listdir(pickleFileDir): #file 表示的是文件名
        count = count+1

        # 加载spikes
        # t1 = []
        # for i in range(300):  #### 输入层neuron number
        #     t1.append([i, [1]])

        t1 = []
        str5 = os.path.join(pickleFileDir, file)
        print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Start to convert the  ", str(count) + " pickle file: ", str5, ". ", flush=True)
        f = open(str5, 'rb')
        # f = open(f"bin_darwin_out/inputs/img_idx_{k}.pickle",'rb')
        t1 = pickle.load(f)

        # 输出文件所在目录，以编号命名文件夹
        outputPath = os.path.join(outputDir, str(count))
        isExists = os.path.exists(outputPath)
        if not isExists:
            os.mkdir(outputPath)
        print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] MakeDir the ", str(count) + " dir is: ", outputPath, ". ", flush=True)
        # 每个文件夹下的输出文件
        inputTxt = os.path.join(outputPath, "input.txt")
        roxTxt = os.path.join(outputPath, "row.txt")

        gen_in.gen_inputdata(in_conv1, t1, input_node_map, int(interval), inputTxt, roxTxt)

        inputlist1, rowlist1 = gen_in.gen_inputdata_list(in_conv1, t1, input_node_map, int(interval))

        print(len(inputlist1))
        print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Converting one image " + str(count) + ": " + file + " ok. ", flush=True)

        time2 = time.time()
        print(time2 - time1)

print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] CONVERT FINISHED!", flush=True)
