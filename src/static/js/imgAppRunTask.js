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

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.cmd) {
        case 'getImgAppInfosRet':
            console.log(message.data);
            (callbacks[message.cbid] || function () { })(message.data);
            delete callbacks[message.cbid];
            break;
        default: break;
    }
});


/**
 * ******************************************************************************************************
 * 给插件发送消息
 * ******************************************************************************************************
 */
function doStartRunTask() {
    console.log("start run task button is clicked.");
    vscode.postMessage({
        command: 'doStartRunTask',
        text: '开始运行应用,先执行脉冲编码脚本'
    });
}

function startPickleConvertProcess() {
    console.log("start convert pickle files.");
    vscode.postMessage({
        command: 'startPickleConvertProcess',
        text: '运行pickle文件转换脚本'
    });
}

function startRecognitionProcess() {
    console.log("start recognition process.");
    vscode.postMessage({
        command: 'startRecognitionProcess',
        text: '开始执行手写体数字识别'
    });
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

    // 1. 李畅的脚本 - 图像编码 相关消息
    // 日志输出
    if (message.imgConvertProcessLog != undefined) {
        let log_output_lists = new Array();
        log_output_lists = log_output_lists.concat(message.imgConvertProcessLog.split("<br/>"));
        console.log("data.logoutput=[" + message.imgConvertProcessLog + "]");
        console.log("data split list len=" + log_output_lists.length);
        $("#log_output_div").append(log_output_lists.join("<br/>"));
        document.getElementById("log_output_div").scrollTop = document.getElementById("log_output_div").scrollHeight;
    }

    // 一个图像转换完成后需要累加的进度
    if (message.imgConvertOneDone != undefined) {
        console.log("run script middle: ", message.imgConvertOneDone);
        let addVal = parseInt(message.imgConvertOneDone[0] / message.imgConvertOneDone[1] * 100) + "%";
        document.getElementById("png_convert_progress_div").style.width = addVal;
    }

    // 错误和告警输出
    if (message.imgConvertProcessErrorLog != undefined) {
        console.log("run script err: ", message.imgConvertProcessErrorLog);
        $("#log_output_div").append(message.imgConvertProcessErrorLog + "<br/>");
        document.getElementById("log_output_div").scrollTop = document.getElementById("log_output_div").scrollHeight;
    }

    // 脉冲编码结束，进度条刷满格
    if (message.imgConvertProcessFinish != undefined) {
        console.log("run script over!", message.imgConvertProcessFinish);
        document.getElementById("png_convert_progress_div").style.width = "100%";
        $("#log_output_div").append(message.imgConvertProcessFinish + "<br/><br/><br/>");
        document.getElementById("log_output_div").scrollTop = document.getElementById("log_output_div").scrollHeight;

        // 发送消息执行柳铮的脚本
        startPickleConvertProcess();
    }

    // 2. 柳铮的脚本 - 打包编译 相关消息
    if (message.pickleConvertProcessLog != undefined) {
        let log_output_lists = new Array();
        log_output_lists = log_output_lists.concat(message.imgConvertProcessLog.split("<br/>"));
        console.log("data.logoutput=[" + message.imgConvertProcessLog + "]");
        console.log("data split list len=" + log_output_lists.length);
        $("#log_output_div").append(log_output_lists.join("<br/>"));
        document.getElementById("log_output_div").scrollTop = document.getElementById("log_output_div").scrollHeight;
    }

    if (message.pickleConvertOneDone != undefined) {
        console.log("run script2 middle: ", message.pickleConvertOneDone);
        let addVal = parseInt(message.pickleConvertOneDone[0] / message.pickleConvertOneDone[1] * 100) + "%";
        document.getElementById("pickle_convert_progress_div").style.width = addVal;
    }

    if (message.pickleConvertProcessErrorLog != undefined) {
        console.log("run script2 err: ", message.pickleConvertProcessErrorLog);
        $("#log_output_div").append(message.pickleConvertProcessErrorLog + "<br/>");
        document.getElementById("log_output_div").scrollTop = document.getElementById("log_output_div").scrollHeight;
    }

    if (message.pickleConvertProcessFinish != undefined) {
        console.log("run script2 over!", message.pickleConvertProcessFinish);
        document.getElementById("pickle_convert_progress_div").style.width = "100%";
        $("#log_output_div").append(message.pickleConvertProcessFinish + "<br/><br/><br/>");
        document.getElementById("log_output_div").scrollTop = document.getElementById("log_output_div").scrollHeight;

        // 发送消息执行图像识别的脚本
        startRecognitionProcess();
    }

    // 3. 图像识别 相关消息
    if (message.recognitionProcessLog != undefined) {
        let log_output_lists = new Array();
        log_output_lists = log_output_lists.concat(message.recognitionProcessLog.split("<br/>"));
        console.log("data.logoutput=[" + message.recognitionProcessLog + "]");
        console.log("data split list len=" + log_output_lists.length);
        $("#log_output_div").append(log_output_lists.join("<br/>"));
        document.getElementById("log_output_div").scrollTop = document.getElementById("log_output_div").scrollHeight;
    }

    if (message.recognitionOneDone != undefined) {
        console.log("run mnist middle: ", message.recognitionOneDone);
        let addVal = parseInt(message.recognitionOneDone[0] / message.recognitionOneDone[1] * 100) + "%";
        document.getElementById("recognition_task_progress_div").style.width = addVal;
    }

    if (message.recognitionProcessErrorLog != undefined) {
        console.log("run mnist err: ", message.recognitionProcessErrorLog);
        $("#log_output_div").append(message.recognitionProcessErrorLog + "<br/>");
        document.getElementById("log_output_div").scrollTop = document.getElementById("log_output_div").scrollHeight;
    }

    if (message.recognitionProcessFinish != undefined) {
        console.log("run mnist over!", message.recognitionProcessFinish);
        document.getElementById("recognition_task_progress_div").style.width = "100%";
        $("#log_output_div").append(message.recognitionProcessFinish + "<br/><br/><br/>");
        document.getElementById("log_output_div").scrollTop = document.getElementById("log_output_div").scrollHeight;
    }

    if (message.recognitionOneResult != undefined) {
        console.log("run mnist result: ", message.recognitionOneResult[0], message.recognitionOneResult[1]);

        // 动态添加列元素
        let tab = document.getElementById("recognition_ret_tab");

        let row1 = tab.rows[0];
        let row2 = tab.rows[1];
        let newCell1 = row1.insertCell();
        let newCell2 = row2.insertCell();
        newCell1.innerHTML = '<img src="' + message.recognitionOneResult[1] + '"></img>';
        newCell2.innerHTML = message.recognitionOneResult[0];

        // $("#recognition_result_div").append(message.recognitionOneResult + "<br/>");
        // document.getElementById("recognition_result_div").scrollTop = document.getElementById("recognition_result_div").scrollHeight;
    }

    if (message.recognitionOneSrcImg != undefined) {
        console.log("run mnist src image: ", message.recognitionOneSrcImg);
        document.getElementById('recognition_result_div').innerHTML += '<li><img src="' + message.recognitionOneSrcImg + '"></img></li>';
    }
});




new Vue({
    el: '#imgAppRunTask',
    data: {
        currentPageAppID: -1,
        imgAppInformation: [],
        appName: '',

        iframeRoute: "",
    },
    mounted() {
        callVscode('getImgAppInfos', imgAppInformation => {
            this.imgAppInformation = imgAppInformation;
            this.iframeRoute = "http://localhost:5001/#/appDetail?nodeID=" + this.imgAppInformation.modelFileNodeID  + "&modelID=" + this.imgAppInformation.modeFileID;
            console.log("TTT", iframeRoute);
        });
    },
    watch: {

    },
    methods: {

    }
});