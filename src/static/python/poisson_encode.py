import os
import sys
import argparse
import pickle
import datetime
import numpy as np
from PIL import Image



################################
# param:
# argv[1] 图像源所在文件夹
# argv[2] 配置文件 br2.pkl 所在文件夹
# argv[3] 输出pickle文件保存路径
################################

imgSrcDir = sys.argv[1]
configDir = sys.argv[2]     #config file is not used currently
# TODO : get run time from cinfig file
outputDir = sys.argv[3]

dt=0.1
time_step=200

def rename_suffix(oldname):
    portion = os.path.splitext(oldname)
    newname = portion[0] + ".pickle"
    return newname  

#baseDirPath = os.path.dirname(os.path.abspath(__file__))
#baseDirPath = sys.argv[1]
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] Start to run poisson_encode.py script. ", flush=True)
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] ImgSrc dir is: ", imgSrcDir, ". ", flush=True)

 # 输出文件所在目录
outputDir = os.path.join(outputDir, "pickleDir")
isExists = os.path.exists(outputDir)
if not isExists:
    os.mkdir(outputDir)
print(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f'), "[I] MakeDir output dir is: ", outputDir, ". ", flush=True)

for root,dirs,files in os.walk(imgSrcDir):
    for file in files:
        image=np.array(Image.open(os.path.join(root,file)))/255
        flatten_image=image.reshape(image.shape[0]*image.shape[1])            
        spikes = np.random.rand(time_step,flatten_image.size).__le__(flatten_image * dt).astype(float)

        print("processing "+file)

        spikes = spikes.transpose()
        result=[]
        for i in range(spikes.shape[0]):
            time=np.where(spikes[i])
            #if time[0].size!=0:  
            result.append([i,time[0].tolist()])

        new_file_name=rename_suffix(file)
        with open(os.path.join(outputDir,new_file_name),'wb') as f:
            #f.write(str(result))
            pickle.dump(result,f)    

                    
print("all done...")