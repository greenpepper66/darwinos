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





/**
 * ******************************************************************************************************
 * 接收插件的消息
 * ******************************************************************************************************
 */
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


    // 点击隐藏的按钮，弹出模态框
    if (message.startFfmpegEncodeVideoRet == "success") {
        document.getElementById("startFfmpegEncodeVideoRet").innerHTML = "FFMPEG Working！"
    } else if (message.startFfmpegEncodeVideoRet == undefined || message.startFfmpegEncodeVideoRet != "success") {
        document.getElementById("startFfmpegEncodeVideoRet").innerHTML = "Inner Error！"
    }

});




function startFfmpegEncodeVideo() {
    let pingRet = document.getElementById("checkCameraStatusRet").innerHTML;
    console.log("ip通不通：", pingRet);
    if (pingRet.indexOf("success") == -1) {
        document.getElementById("startFfmpegEncodeVideoRet").innerHTML = "找不到摄像头！"
        return
    }

    console.log("start 摄像头推流.");
    vscode.postMessage({
        command: 'startFfmpegEncodeVideo',
        text: '启动服务，开始推流'
    });
}

// 开始疲劳检测
function startFatigueDriving() {
    let pingRet = document.getElementById("checkCameraStatusRet").innerHTML;
    console.log("ip通不通：", pingRet);
    if (pingRet.indexOf("success") == -1) {
        document.getElementById("startFatigueDrivingRet").innerHTML = "找不到摄像头！"
        return
    }

    console.log("start 疲劳检测.");
    vscode.postMessage({
        command: 'startFatigueDriving',
        text: '开始疲劳检测'
    });
}




















/*
 *************************************************************************************
 * 工具函数
 * ************************************************************************************
 */
function checkCameraStatus() {
    ping("192.168.1.108");
}
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
            document.getElementById("checkCameraStatusRet").innerHTML = "Connection " + ip + " success!";
        }
    };
    img.onerror = function () {
        if (!hasFinish) {
            if (!isCloseWifi) {
                flag = true;
                console.log('Ping ' + ip + ' success. ');
                // alert("成功" + ip);
                document.getElementById("checkCameraStatusRet").innerHTML = "Connection " + ip + " success!";
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
            document.getElementById("checkCameraStatusRet").innerHTML = "Connection " + ip + " failed!";
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