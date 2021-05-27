import asyncio
import websockets
import base64
from cv2 import cv2
import numpy as np

capture = cv2.VideoCapture("rtsp://admin:admin123@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0")
if not capture.isOpened():
    print('quit')
    quit()
ret, frame = capture.read()
encode_param=[int(cv2.IMWRITE_JPEG_QUALITY),95]

# 向服务器端实时发送视频截图
async def send_msg(websocket):
    global ret,frame
    while ret:
        #time.sleep(2)
        result, imgencode = cv2.imencode('.jpg', frame, encode_param)
        data = np.array(imgencode)
        img = data.tostring()

        # base64编码传输
        img = base64.b64encode(img).decode()
        await websocket.send("data:image/jpeg;base64,"+img)
        # await websocket.send("a1=sq="+repr(np.random.randn(7).tolist()))

        ret, frame = capture.read()

# 客户端主逻辑
async def main_logic():
    async with websockets.connect('ws://127.0.0.1:8188', ping_interval=None) as websocket:
        await send_msg(websocket)

asyncio.get_event_loop().run_until_complete(main_logic())
