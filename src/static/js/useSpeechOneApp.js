const vscode = acquireVsCodeApi();

var runSpeechRegScriptProcessError = false;

var wavesurfer = WaveSurfer.create({
    container: '#userSpeechOneApp_recorder_audioData'
});


new Vue({
    el: '#userSpeechOneApp',
    data: {
        show: true,
        userAppInfo: [],
        recorderServerURL: "",  // 手写板应用的ip地址
    },

    mounted() {
        callbacks('getOneUserSpeechAppInfo', userAppInfo => this.userAppInfo = userAppInfo);
        callbacks('getRecorderHttpsServerURL', recorderServerURL => this.recorderServerURL = recorderServerURL);
    },
    watch: {

    },
    methods: {
        userAppGotoSpeechAppInfoPage(speechAppID) {
            console.log("search app: ", speechAppID);
            // 给插件发送消息 跳转到详情页
            vscode.postMessage({
                command: 'userAppGotoSpeechAppInfoPage',
                text: speechAppID,
            });
        },
        userAppGotoSpeechAppTaskPage(speechAppID) {
            console.log("run app: ", speechAppID);
            // 给插件发送消息 跳转到任务页面
            vscode.postMessage({
                command: 'userAppGotoSpeechAppTaskPage',
                text: speechAppID,
            });
        },
    }
});


/**
 * ******************************************************************************************************
 * 给插件发送消息
 * ******************************************************************************************************
 */
/**
 * 调用vscode原生api
 * @param data 可以是类似 {command: 'xxx', param1: 'xxx'}，也可以直接是 command 字符串
 * @param cb 可选的回调函数
 */
function callbacks(data, cb) {
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
    console.log("call vscode to get information", data.command, data.cbid);
}

// 收到server 地址后执行
function startGetRecorderAudio() {
    // 给vscode发送消息接收移动端发送的音频
    vscode.postMessage({
        command: 'startGetRecorderAudio',
        text: [this.userAppInfo.id],
    });

    // 标志值初始化
    runSpeechRegScriptProcessError = false;

    // 解包配置文件
    vscode.postMessage({
        command: 'unpackSpeechRegConfig',
        text: "解包语音识别配置文件",
    });
}



/**
 * ******************************************************************************************************
 * 接收插件的消息
 * ******************************************************************************************************
 */
window.addEventListener('message', event => {
    const message = event.data;
    console.log("html get message:", message);

    // 获取本应用配置信息
    if (message.cmd == 'getOneUserSpeechAppInfoRet') {
        this.userAppInfo = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get user app info', this.userAppInfo.name);
    }


    // 获取网页地址
    if (message.cmd == 'getRecorderHttpsServerURLRet') {
        this.recorderServerURL = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get recorder url', this.recorderServerURL);

        // 开始接收音频数据
        startGetRecorderAudio();


    }

    // 获取音频文件
    if (message.getRecorderAudioFileRet != undefined) {
        console.log("message.getRecorderAudioFileRet 页面接收到音频");

        // 音频播放
        startPlayRecorderAudio(message.getRecorderAudioFileRet);







        // 开始执行图像编码和识别
        handWriterAppStartRun();

        // 识别结果清除
        document.getElementById("userMnistOneApp_handWriter_outputNum").innerHTML = "";
        // echart图清除
        clearEchart("handWriter_spikes_charts");
        clearEchart("handWriter_output_charts");
        // echart div隐藏
        document.getElementById("handWriter_spikes_charts").style.display = "none";
        document.getElementById("handWriter_output_charts").style.display = "none";
        document.getElementById("handWriter_output_num").style.display = "none";
        // loading转圈图显示出来
        document.getElementById("userMnistOneApp_handWriter_encodeEchartLoading").style.display = "block";
        document.getElementById("userMnistOneApp_handWriter_outputEchartLoading").style.display = "block";
        document.getElementById("userMnistOneApp_handWriter_outputNumLoading").style.display = "block";

        // 启动计时器 更新进度
        clearRegSpeedTimer();
        clearEncodeSpeedTimer();
        startEncodeSpeedTimer();
    }

});


/**
 * ******************************************************************************************************
 * 工具函数
 * ******************************************************************************************************
 */

function startPlayRecorderAudio(file) {
    console.log(file);
    if (file) {
        var reader = new FileReader();
        reader.onload = function (evt) {
            var blob = new window.Blob([new Uint8Array(evt.target.result)]);
            wavesurfer.loadBlob(blob);
        };
        reader.onerror = function (evt) {
            console.error("An error ocurred reading the file: ", evt);
        };
        reader.readAsArrayBuffer(file);
    }
    // 播放和暂停
    btnPlay.addEventListener('click', function () {
        wavesurfer.play();
    });
    btnPause.addEventListener('click', function () {
        wavesurfer.pause();
    });
}