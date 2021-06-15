import struct
import numpy as np
class Convert(object):
    def __init__(self):
        pass
    def convert(self,config_list):
        length = len(config_list)
        send_bytes = bytearray()
        for i in range(length):
            send_bytes += struct.pack('<Q', int(config_list[i].strip(), 16))
        return send_bytes

    def getResult(self,result):
        return 0

        # i = 0
        # while(i < len(output_list)):
        #     leng = output_list[i]
        #     for j in range(0, leng, 2):
        #         spike[int(result[i+j+1 + 1] % (1 << 32) // (1 << 16))] += 1
        #     i+=leng+1
        
        # res = np.argmax(np.asarray(spike))
        # return res