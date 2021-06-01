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


    // 0-不疲劳，1-疲劳
    if (message.chipFatigueDrivingResult != undefined) {
        console.log("***************************疲劳检测结果********************", message.chipFatigueDrivingResult);

        if(message.chipFatigueDrivingResult == "1" || message.chipFatigueDrivingResult == 1 || message.chipFatigueDrivingResult.indexOf("1") != -1) {
            document.getElementById('fatigueDrivingApp_result_txt').innerHTML = "WARNING! 您已疲劳，请休息！";
        } else {
            document.getElementById('fatigueDrivingApp_result_txt').innerHTML = "状态良好，请保持。";
        }
    }
});



// 结束推流，关闭websocket和Python脚本
function finishFatigueDrivingAfter() {
    console.log("finish 疲劳检测.");
    vscode.postMessage({
        command: 'finishFatigueDrivingAfter',
        text: '结束疲劳检测'
    });
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
    el: '#fatigueDrivingAppAfter',
    data: {

    },
    mounted() {
        callVscode('fatigueDrivingAppAfterConnChip', null);
    },
    watch: {

    },
    methods: {

    }
});