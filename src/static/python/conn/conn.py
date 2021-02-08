import struct
import numpy as np
import time
import requests
import hashlib


class Conn(object):
    def __init__(self):
        pass

    def get_slave_ip_port_fid(self, config_file_path):
        ip = ''
        port = ''
        file_id = ''
        with open(config_file_path, 'r') as file:
            config_list = file.readlines()
            length = len(config_list)
            config_bytes = bytearray()
            for i in range(length):
                config_bytes += struct.pack('<Q', int(config_list[i].strip(), 16))
            md5 = hashlib.md5(config_bytes).hexdigest()

            jsn = requests.post(
                "http://192.168.1.254/get_config_info_by_md5/", {"key1": md5, }).json()
            if jsn["code"] == 0:
                ip = jsn["ip"]
                port = jsn["port"]
                file_id = jsn["file_id"]
                status = jsn["status"]
            else:
                print(jsn)
                exit(0)
            print(jsn)
        return ip, port, file_id, status

    def deploy(self, ip, file_id):
        data = {
            "file_name": file_id,
        }
        jsn = requests.post("http://"+ip+"/choosed_config/", data).json()
        data = {
            "op": 0,
        }
        jsn = requests.post("http://"+ip+"/get_result/", data).json()
        times = 5
        while jsn['code'] == -1 and times != 0:
            times -= 1
            jsn = requests.post("http://"+ip+"/get_result/", data).json()
            time.sleep(3)

        if jsn['code'] != 0:
            exit(0)
        return jsn['code']

    def configure_config(self, ip, tick_time, slice_num, is_reply):
        data = {
            "tick_time": tick_time,
            "slice_num": slice_num,
            "is_reply": is_reply,
        }
        jsn = requests.post("http://"+ip+"/configure_config/", data).json()
        if jsn['code'] != 0:
            exit(0)
        return jsn['code']

    def buildconn(self,config_file_path,tick_time,slice_num,is_reply):
        ip,port,file_id,status = self.get_slave_ip_port_fid(config_file_path)
        if status != 3:
            self.deploy(ip,file_id)
            print("deploy ok")
            self.configure_config(ip,tick_time,slice_num,is_reply)
            print("configure ok")
        else:
            print("deploy has been ok")
            print("configure has been ok")
        return ip,port

