const vscode = acquireVsCodeApi();
const callbacks = {};

/**
 * 调用vscode原生api
 * @param data 可以是类似 {command: 'xxx', param1: 'xxx'}，也可以直接是 command 字符串
 * @param cb 可选的回调函数
 */
function callVscode(data, cb) {
    if (typeof data === 'string') {
        data = { command: data };
    }
    if (cb) {
        // 时间戳加上5位随机数
        const cbid = Date.now() + '' + Math.round(Math.random() * 100000);
        callbacks[cbid] = cb;
        data.cbid = cbid;
    }
    vscode.postMessage(data);
    console.log("call vscode to get this img app information", data.command, data.cbid);
}

// vscode返回的消息处理
window.addEventListener('message', event => {
    const message = event.data;
    console.log("html get message:", message);

    // switch (message.cmd) {
    //     case 'getImgAppInfosRet':
    //         console.log(message.data);
    //         (callbacks[message.cbid] || function () { })(message.data);
    //         delete callbacks[message.cbid];
    //         break;
    //     default: break;
    // }

    // 启动websocket和python推流脚本后
    if (message.startWebsocketServerAndPushCameraRet != undefined) {
        console.log("get startWebsocketServerAndPushCameraRet");
        sleep(8000);
        ping("192.168.1.108");
    }

});

// 开始疲劳检测
function startFatigueDriving() {
    let pingRet = document.getElementById("checkCameraStatusRet").innerHTML;
    console.log("ip通不通：", pingRet);
    if (pingRet.indexOf("成功") == -1) {
        document.getElementById("startFatigueDrivingRet").innerHTML = "找不到摄像头！"
        return
    }

    console.log("start 疲劳检测.");
    vscode.postMessage({
        command: 'startFatigueDriving',
        text: '开始疲劳检测'
    });
}

// 结束推流，关闭websocket和Python脚本
function finishFatigueDriving() {
    console.log("finish 疲劳检测.");
    vscode.postMessage({
        command: 'finishFatigueDriving',
        text: '结束疲劳检测'
    });
}

// 检查摄像头状态
function checkCameraStatus() {
    // 如果没有输入摄像头地址
    let addr = document.getElementById("fatigueDrivingApp_rtsp_addr").value;
    if(addr == "") {
        document.getElementById("checkCameraStatusRet").innerHTML = "请输入摄像头地址";
        return;
    }
    // 摄像头如果已经连接成功
    let pingRet = document.getElementById("checkCameraStatusRet").innerHTML;
    if (pingRet.indexOf("成功") != -1) {
        document.getElementById("checkCameraStatusRet").innerHTML = "摄像头已连接成功！"
        return;
    }
    
    // 暂时将地址写死
    if(addr.indexOf("192.168.1.108") == -1) {
        document.getElementById("checkCameraStatusRet").innerHTML = "地址错误!";
        return;
    }


    // todo
    // 地址校验，ip能联通，用户名密码正确才启动websocket和python推流
    // 如果输入地址变了，又重新连接摄像头

    document.getElementById("checkCameraStatusRet").innerHTML = "摄像头连接中，请等待!";
    // 给插件发消息，提前启动websocket和python推流
    console.log("start push video.");
    vscode.postMessage({
        command: 'startWebsocketServerAndPushCamera',
        text: '开始疲劳检测'
    });

}

// ping
function ping(ip) {
    var img = new Image();
    var start = new Date().getTime();
    var flag = false;
    var isCloseWifi = true;
    var hasFinish = false;
    img.onload = function () {
        if (!hasFinish) {
            flag = true;
            hasFinish = true;
            console.log('Ping ' + ip + ' success. ');
            // alert("成功" + ip);
            document.getElementById("checkCameraStatusRet").innerHTML = "摄像头连接成功!";
        }
    };
    img.onerror = function () {
        if (!hasFinish) {
            if (!isCloseWifi) {
                flag = true;
                console.log('Ping ' + ip + ' success. ');
                // alert("成功" + ip);
                document.getElementById("checkCameraStatusRet").innerHTML = "摄像头连接成功!";
            } else {
                console.log('network is not working!');
            }
            hasFinish = true;
        }
    };
    setTimeout(function () {
        isCloseWifi = false;
        console.log('network is working, start ping...');
    }, 2);
    img.src = 'http://' + ip + '/' + start;
    var timer = setTimeout(function () {
        if (!flag) {
            hasFinish = true;
            flag = false;
            console.log('Ping ' + ip + ' fail. ');
            // alert("失败" + ip);
            document.getElementById("checkCameraStatusRet").innerHTML = "摄像头连接失败!";

            // 失败的话，关闭推流过程
            finishFatigueDriving();
        }
    }, 3000);
}


function sleep(numberMillis) {
    var start = new Date().getTime();
    while (true) {
        if (new Date().getTime() - start > numberMillis) {
            break;
        }
    }
}

new Vue({
    el: '#fatigueDrivingApp',
    data: {

    },
    mounted() {
        // callVscode('getImgAppInfos', imgAppInformation => this.imgAppInformation = imgAppInformation);
    },
    watch: {

    },
    methods: {

    }
});