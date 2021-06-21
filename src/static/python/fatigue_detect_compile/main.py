# -*- coding:utf-8 -*-
from logging import debug
import os
from flask.wrappers import Response
import keras
import numpy as np
import cv2
from PIL import Image
import matplotlib.pyplot as plt
from numpy.core.shape_base import block
import frst_alg
import facial_feat_extract
import mlp
from sklearn.utils import shuffle
import brian2
import pickle
import time
import gen_input
from flask import Flask
import threading
import multiprocessing
import asyncio
import websockets
import base64

app = Flask(__name__)

base_path = os.path.join(os.path.dirname(__file__))
model_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "model")
img_data_path = os.path.join(os.path.abspath(
    os.path.dirname(__file__)), "detected_images")
landmark_detector = cv2.face.createFacemarkLBF()
landmark_detector.loadModel(os.path.join(model_path, "lbfmodel.yaml"))
label_file_path = os.path.join(os.path.dirname(__file__), "detected_images_labels.txt")
cascade_classifier = cv2.CascadeClassifier(os.path.join(model_path, "haarcascade_frontalface_default.xml"))
NORM_FAC = 200
CONN_FILES_PATH = os.path.join(os.path.dirname(__file__),  "detect_models", "darwin_models", "connfiles1_1")
LAYER_WIDTH_PATH = os.path.join(os.path.dirname(__file__),  "detect_models", "darwin_models", "layerWidth1_1")
NODE_LIST_PATH = os.path.join(os.path.dirname(__file__),  "detect_models", "darwin_models", "nodelist1_1")
INPUT_LAYER1_PATH = os.path.join(os.path.dirname(__file__),  "detect_models", "darwin_models", "input_to_layer_1.pickle")
IS_NEED_DETECT = True # only when the flag is True, binary input txt file will be generated, otherwise, only extract feature
FACE_MARKED_IMG = None

@app.route("/need_detect")
def need_detect():
    global IS_NEED_DETECT
    IS_NEED_DETECT = True
    return Response("ok")



def gen_binary_input_txt(run_dura: int, spike_seqs:list):
    with open(CONN_FILES_PATH,"rb") as f:
        connfiles = pickle.load(f)
    
    with open(LAYER_WIDTH_PATH, "rb") as f:
        layerWidth = pickle.load(f)
    
    with open(NODE_LIST_PATH, "rb") as f:
        nodelist = pickle.load(f)
    
    with open(INPUT_LAYER1_PATH, "rb") as f:
        in_layer1 = pickle.load(f)
    
    input_node_map = {}
    neuron_num = int(np.math.ceil(layerWidth[1] / len(nodelist[0])))

    for line in in_layer1:
        src = int(line[0])
        dst = int(line[1])
        node_x = nodelist[0][dst // neuron_num][0]
        node_y = nodelist[0][dst // neuron_num][1]
        node_number = node_x * 64 + node_y
        if not node_number in input_node_map.keys():
            input_node_map[node_number] = {}
        input_node_map[node_number].update({dst % neuron_num: dst})
    
    gen_input.change_format(in_layer1)
    inputTxtFile = os.path.join(os.path.dirname(__file__), "tmp_input_txts", "input.txt")
    rowTxtFile = os.path.join(os.path.dirname(__file__), "tmp_input_txts", "row.txt")
    gen_input.gen_inputdata(in_layer1, spike_seqs, input_node_map, run_dura, inputTxtFile, rowTxtFile)


async def send_marked_face( websocket):
    """
    向前端发送检测出人脸特征点的图像
    """
    global FACE_MARKED_IMG
    while True:
        time.sleep(0.01) # 0.1 second
        if FACE_MARKED_IMG is None:
            continue
        print("Encoding before websocket send...")
        _, img_encoded = cv2.imencode(".jpg", FACE_MARKED_IMG, [int(cv2.IMWRITE_JPEG_QUALITY), 50])
        img_encoded = np.array(img_encoded).tostring()
        img_encoded = base64.b64encode(img_encoded).decode()
        await websocket.send("data:image/jpeg;base64,"+img_encoded)


async def main_logic():
    async with websockets.connect('ws://127.0.0.1:8188', ping_interval=None) as websocket:
        await send_marked_face(websocket)



def train_model(img_name_idx=False):
    trainX=[]
    trainY=[]
    if os.path.exists(os.path.join(base_path, "train_new_x.npz")):
        trainX = np.load(os.path.join(base_path, "train_new_x.npz"))["arr_0"]
        trainY = np.load(os.path.join(base_path, "train_new_y.npz"))["arr_0"]
    elif img_name_idx:
        with open(label_file_path, "r") as f:
            for line in f.readlines():
                line = line.strip()
                if len(line) == 0:
                    continue
                img_idx, lb_cls = int(line.split(",")[0]), int(line.split(",")[1])
                feats = facial_feat_extract.extract_facial_features(
                    cascade_classifier,
                    landmark_detector,
                    os.path.join(img_data_path, str(img_idx)+".jpg")
                )
                if not feats or len(feats) < 4:
                    continue
                trainX.append(np.array(feats))
                trainY.append([0,1]) if lb_cls == 1 else trainY.append([1,0])
    else:
        with open(label_file_path, "r") as f:
            for line in f.readlines():
                line=line.strip()
                if len(line) == 0:
                    continue
                img_fname, lb = line.split(",")[0], int(line.split(",")[1])
                feats = facial_feat_extract.extract_facial_features(
                    cascade_classifier,
                    landmark_detector,
                    os.path.join(os.path.dirname(label_file_path), "frames", img_fname)
                )
                if not feats or len(feats) < 4 or not feats[0]:
                    continue
                trainX.append(np.array(feats[:4]))
                trainY.append([0, 1]) if lb==1 else trainY.append([1,0])

        trainX = np.array(trainX, dtype="float32")
        trainY = np.array(trainY, dtype="int32")
        np.savez(os.path.join(base_path, "trainx.npz"), trainX)
        np.savez(os.path.join(base_path, "trainy.npz"), trainY)

    print("trainX shape={}, trainY shape={}".format(trainX.shape, trainY.shape))
    trainX /= trainX.max()
    np.savez("x_train.npz", trainX)
    np.savez("y_train.npz", trainY)
    model = mlp.build_mlp((4,))
    trainX, trainY = shuffle(trainX, trainY)
    model.fit(trainX, trainY, epochs=5, batch_size=1, validation_split=0.2, shuffle=True)
    model.save("fatigue_detect_model.h5")


def real_time_detect():
    model = keras.models.load_model("fatigue_detect_model.h5")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Camera not opened!")
        exit(1)
    
    while True:
        ret, frame=cap.read()
        if not ret:
            print("Fetch frame from video error!")
            exit(1)
        
        img = cv2.flip(frame, 1)
        rets = facial_feat_extract.extract_facial_features(
            cascade_classifier,
            landmark_detector,
            img
        )

        if rets[0]:
            rets = list(rets)
            rets[0] = int(rets[0] * 150) / NORM_FAC
            rets[1] = int(rets[1] * 100) / NORM_FAC
            rets[2] = int(rets[2] * 50) / NORM_FAC
            rets[3] = int(rets[3] * 25) / NORM_FAC
            pred_res = model.predict([[rets[0], rets[1], rets[2], rets[3]]])
            print("pred_res={}".format(pred_res))
            if pred_res[0, 1] > pred_res[0, 0]:
                cv2.putText(rets[-1], "WARNING!!!!", (100,100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 5, cv2.LINE_AA)
            
            cv2.imshow("", rets[-1])
        if cv2.waitKey(1) == ord('q'):
            break
        
    cap.release()
    cv2.destroyAllWindows()


def read_from_camera(share_queue: multiprocessing.Queue):
    cap = cv2.VideoCapture("rtsp://admin:zhijianglab123@192.168.1.109:554/h264/ch1/sub/av_stream")
    # cap = cv2.VideoCapture(0)
    while True:
        ret, frame = cap.read()
        if ret is not None:
            share_queue.put(frame)
            while share_queue.qsize() > 1:
                share_queue.get()
            time.sleep(0.01)
        


def real_time_snn_detect(snn_model_file_path, share_queue: multiprocessing.Queue):
    with open(snn_model_file_path, "rb") as f:
        snn_model = pickle.load(f)

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

    # br2_output_spike_monitor = brian2.SpikeMonitor(br2_neurons[-1])
    br2_input_spike_monitor = brian2.SpikeMonitor(br2_neurons[0])
    # br2_net = brian2.Network(br2_neurons, br2_synapses, br2_output_spike_monitor, br2_input_spike_monitor)
    br2_net = brian2.Network(br2_neurons, br2_synapses, br2_input_spike_monitor)
    br2_net.store()

    # cap = cv2.VideoCapture(0)
    
    # if not cap.isOpened():
    #     print("Camera not opened!")
    #     exit(1)
    
    frame_count=0
    start_time = time.perf_counter()
    while True:
        # ret, frame=cap.read()
        try:
            frame = share_queue.get(block=False, timeout=0.1)
        except Exception as e:
            continue
        # if not ret:
        #     print("Fetch frame from video error!")
        #     exit(1)
        
        img = cv2.flip(frame, 1)
        feat_process_start = time.perf_counter()
        rets = facial_feat_extract.extract_facial_features(
            cascade_classifier,
            landmark_detector,
            img
        )
        feat_process_end = time.perf_counter()
        print("特征提取用时 {} 秒".format(feat_process_end - feat_process_start))

        global IS_NEED_DETECT
        global FACE_MARKED_IMG

        if rets[-1] is not None:
            # cv2.imshow("", rets[-1])
            # if cv2.waitKey(1) == ord('q'):
            #     break
            FACE_MARKED_IMG = rets[-1]
        else:
            FACE_MARKED_IMG = img
        
        if rets[0] and IS_NEED_DETECT:
            rets = list(rets)
            rets[0] = int(rets[0] * 150) / NORM_FAC
            rets[1] = int(rets[1] * 100) / NORM_FAC
            rets[2] = int(rets[2] * 50) / NORM_FAC
            rets[3] = int(rets[3] * 25) / NORM_FAC
            encode_process_start = time.perf_counter()
            br2_neurons[0].bias = rets[:-1]/brian2.ms
            br2_net.run(snn_model["run_dura"]*brian2.ms, namespace={"v_thresh": snn_model["v_thresh"]})
            # out_spikes = br2_output_spike_monitor.spike_trains()
            # Extract spike sequence of the input layer
            input_spk_train = br2_input_spike_monitor.spike_trains()
            input_spike_seqs = []
            for i in range(len(input_spk_train.items())):
                input_spike_seqs.append([i, [int(tm / brian2.ms) for tm in list(input_spk_train[i])]])

            print("input spike seq={}".format(input_spike_seqs))
            # print("out_spikes:  len1={}, len2={}".format(len(out_spikes[0]), len(out_spikes[1])))
            br2_net.restore()
            encode_process_end = time.perf_counter()
            print("脉冲编码用时 {} 秒".format(encode_process_end - encode_process_start))
            # Generate binary input.txt for darwin board using the feature seq input spikes
            # input.txt and row.txt will be generated under current directory
            gen_binary_process_start = time.perf_counter()
            gen_binary_input_txt(snn_model["run_dura"], input_spike_seqs)
            gen_binary_process_end = time.perf_counter()

            print("生成二进制文件用时 {} 秒".format(gen_binary_process_end - gen_binary_process_start))

            print("Generate done!")
            # if len(out_spikes[1]) > len(out_spikes[0]):
            #     cv2.putText(rets[-1], "WARNING!!!!", (100,100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 5, cv2.LINE_AA)
            IS_NEED_DETECT = False
        frame_count +=1
    
    print("frame 个数={}，耗时 {} 毫秒".format(frame_count, (time.perf_counter() - start_time)*1000))
    # cap.release()
    cv2.destroyAllWindows()


def util_split_video_frames(video_files, save_dir,step_frames=120):
    frame_count=-1
    idx=0
    for vfile in video_files:
        cap = cv2.VideoCapture(vfile)
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_count +=1
            if frame_count % step_frames !=0:
                continue
            cv2.imwrite(os.path.join(save_dir,"frame_{:06}.png".format(frame_count)), frame)
            idx +=1

def prepare_yawn_dataset():
    vd_files = os.listdir("../user06/YawDD dataset/Dash/Male")
    vd_files = [os.path.join("../user06/YawDD dataset/Dash/Male", e) for e in vd_files]
    util_split_video_frames(vd_files, "../yawn_dataset/frames")


def prep_fatigue_dataset_train():
    dataset_imgs = []
    trainX = []
    trainY = []
    count = 0
    for img_file in os.listdir(os.path.join(os.path.dirname(__file__), "..", "fatigue_new_dataset","0")):
        dataset_imgs.append(os.path.join(os.path.dirname(__file__), "..", "fatigue_new_dataset","0", img_file))
        ft1,ft2,ft3,ft4,_ = facial_feat_extract.extract_facial_features(cascade_classifier, landmark_detector, dataset_imgs[-1])
        ft1 *= 100
        ft2 *= 100
        ft3 *= 50
        ft4 *= 25
        ft1 = int(ft1) / NORM_FAC
        ft2 = int(ft2) / NORM_FAC
        ft3 = int(ft3) / NORM_FAC
        ft4 = int(ft4) / NORM_FAC
        if ft1 is None:
            continue
        trainX.append([ft1, ft2, ft3, ft4])
        trainY.append([1, 0])
        count +=1
        if count == 320:
            break
    
    count=0
    for img_file in os.listdir(os.path.join(os.path.dirname(__file__), "..", "fatigue_new_dataset","1")):
        dataset_imgs.append(os.path.join(os.path.dirname(__file__), "..", "fatigue_new_dataset","1", img_file))
        ft1,ft2,ft3,ft4,_ = facial_feat_extract.extract_facial_features(cascade_classifier, landmark_detector, dataset_imgs[-1])
        ft1 *= 100
        ft2 *= 100
        ft3 *= 50
        ft4 *= 25
        ft1 = int(ft1) / NORM_FAC
        ft2 = int(ft2) / NORM_FAC
        ft3 = int(ft3) / NORM_FAC
        ft4 = int(ft4) / NORM_FAC
        if ft1 is None:
            continue
        trainX.append([ft1, ft2, ft3, ft4])
        trainY.append([0, 1])
        count +=1
        if count == 320:
            break

    trainX = np.array(trainX, dtype="float32")
    trainY = np.array(trainY, dtype="int32")
    np.savez("train_new_x.npz", trainX)
    np.savez("train_new_y.npz", trainY)
    
    train_model()


def util_check_landmark(img_files):
    for img_f in img_files:
        facial_feat_extract.extract_facial_features(cascade_classifier, landmark_detector, img_f)


def run_ws_client():
    asyncio.get_event_loop().run_until_complete(main_logic())


def run_server():
    print("Server started!!!")
    app.run(host='0.0.0.0', port=2345,debug=False)

if __name__ == '__main__':
    # prep_fatigue_dataset_train()
    # real_time_detect()
    share_queue = multiprocessing.Queue(maxsize=2)
    threading.Thread(target=real_time_snn_detect, args=("./detect_models/snn_model.pkl", share_queue, )).start()
    threading.Thread(target=read_from_camera, args=(share_queue,)).start()
    threading.Thread(target=run_server).start()
    run_ws_client()
    # real_time_snn_detect("./detect_models/snn_model.pkl")

    # sub_thread = threading.Thread(target=real_time_snn_detect, args=("./detect_models/snn_model.pkl", ))
    # sub_thread.start()

    # UTA Epoch 50/50
    # 720/720 [==============================] - 1s 1ms/step - loss: 0.2972 - accuracy: 0.8889 - val_loss: 0.2607 - val_accuracy: 0.8944
    # SNN float  accu=0.8792
    # SNN uint8  accu=searching v_thres=1, 0.8722222222222222

    # train_model()
    # real_time_detect()
    # real_time_snn_detect("snn_model.pkl")
    # vd_files = [os.path.join("../Fold3_part2/31", e) for e in os.listdir("../Fold3_part2/31")]\
    #             +[os.path.join("../Fold3_part2/32", e) for e in os.listdir("../Fold3_part2/32")]\
    #             +[os.path.join("../Fold3_part2/33", e) for e in os.listdir("../Fold3_part2/33")]\
    #             +[os.path.join("../Fold3_part2/34", e) for e in os.listdir("../Fold3_part2/34")]\
    #             +[os.path.join("../Fold3_part2/35", e) for e in os.listdir("../Fold3_part2/35")]\
    #             +[os.path.join("../Fold3_part2/36", e) for e in os.listdir("../Fold3_part2/36")]
    # util_split_video_frames(vd_files, "../uta_dataset/frames")


    # yawn_imgs = os.listdir("../uta_dataset/frames")
    # yawn_imgs = [os.path.join("../uta_dataset/frames", e) for e in yawn_imgs]
    # util_check_landmark(yawn_imgs)
    # label_file_path = os.path.join(base_path, "..", "yawn_dataset" ,"labels.txt")
    # train_model()

