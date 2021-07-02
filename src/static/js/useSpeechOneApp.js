const vscode = acquireVsCodeApi();

// 标记每步的脚本运行是否error
var runSpeechRegScriptProcessError = false;
// 记录当前页面上的音频数据
var wavAudioBuffer = null;

// 进度条计时器
var mobileSpeechEncodeTimer = undefined;
var mobileSpeechRegTimer = undefined;

// var wavesurfer = WaveSurfer.create({
//     container: '#userSpeechOneApp_recorder_audioData'
// });


new Vue({
    el: '#userSpeechOneApp',
    data: {
        show: "true",
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

// 1. 收到server 地址后执行解包和接收音频
function startGetRecorderAudio() {
    // 标志值初始化
    runSpeechRegScriptProcessError = false;

    // 解包配置文件
    vscode.postMessage({
        command: 'unpackSpeechRegConfig',
        text: "解包语音识别配置文件",
    });

    // 给vscode发送消息接收移动端发送的音频
    vscode.postMessage({
        command: 'startGetRecorderAudio',
        text: [this.userAppInfo.id],
    });
}

// 2. 加载音频后，自动执行编码
function speechAppStartEncode() {
    // 解包没有错误才执行编码
    if (runSpeechRegScriptProcessError == false) {
        vscode.postMessage({
            command: 'speechAppStartEncode',
            text: "执行移动端音频编码",
        });
    } else {
        // 脚本运行失败，弹出提示框
        document.getElementById("userSpeechOneApp_alertContent").innerText = "解包配置文件失败，请查看日志或联系系统管理员，并刷新当前页面！";
        document.getElementById('userSpeechOneApp_alert_result').style.display = 'block';
    }
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

        // 保存音频数据
        wavAudioBuffer = message.getRecorderAudioFileRet;
        // 显示播放div
        document.getElementById("userSpeechApp_inputAudio").style.display = 'block';

        // 开始执行音频编码和识别
        speechAppStartEncode();

        // 识别结果清除
        document.getElementById("mobileAudio_output_num").innerHTML = "";
        // echart图清除
        clearEchart("mobileAudio_spikes_charts");
        clearEchart("mobileAudio_output_charts");
        // echart div隐藏
        document.getElementById("mobileAudio_spikes_charts").style.display = "none";
        document.getElementById("mobileAudio_output_charts").style.display = "none";
        document.getElementById("mobileAudio_output_num").style.display = "none";

        // loading转圈图显示出来
        document.getElementById("userSpeechOneApp_recorder_encodeEchartLoading").style.display = "block";
        document.getElementById("userSpeechOneApp_recorder_outputEchartLoading").style.display = "block";
        document.getElementById("userSpeechOneApp_recorder_outputNumLoading").style.display = "block";

        // // 启动计时器 更新进度
        clearSpeechRegSpeedTimer();
        clearSpeechEncodeSpeedTimer();
        startSpeechEncodeSpeedTimer();
    }

    // 解包配置文件失败
    if (message.unpackSpeechRegConfigProcessErrorLog != undefined) {
        console.log("run speech unpack script err: ", message.unpackSpeechRegConfigProcessErrorLog);
        runSpeechRegScriptProcessError = true;
    }

    // 解包结束
    if (message.unpackSpeechRegConfigProcessFinish != undefined) {
        console.log("run speech unpack script over!", message.unpackSpeechRegConfigProcessFinish);
    }

    // 获取编码脉冲数据，绘制echart图
    if (message.getMobileSpeechAppEncodeRet != undefined) {
        console.log("get speech encode spikes data to draw echart.", message.getMobileSpeechAppEncodeRet);
        // loading图隐藏
        document.getElementById('userSpeechOneApp_recorder_encodeEchartLoading').style.display = 'none';
        // 画图
        document.getElementById("mobileAudio_spikes_charts").style.display = "block";
        display_speechEncode_scatterChart(message.getMobileSpeechAppEncodeRet, "mobileAudio_spikes_charts");
    }

    // 编码失败
    if (message.encodeMobileSpeechAppProcessErrLog != undefined) {
        console.log("run speech encode script err: ", message.encodeMobileSpeechAppProcessErrLog);
        // 脚本运行失败，弹出提示框
        document.getElementById("userSpeechOneApp_alertContent").innerText = "脉冲编码失败，请查看日志或联系系统管理员！";
        document.getElementById('userSpeechOneApp_alert_result').style.display = 'block';
        // 标记脚本运行有误
        runSpeechRegScriptProcessError = true;
        // 清除计时器
        clearSpeechEncodeSpeedTimer();
    }

    // 编码结束，发送命令执行芯片识别
    if (message.encodeMobileSpeechAppProcessFinish != undefined) {
        console.log("run speech encode script over!", message.encodeMobileSpeechAppProcessFinish);

        // 解包没有错误才执行下一步
        if (runSpeechRegScriptProcessError == false) {
            vscode.postMessage({
                command: 'startMobileSpeechRecognitionProcess',
                text: "给芯片发送数据执行y语音识别",
            });

            // 启动识别计时器
            startSpeechRegSpeedTimer();
        }

        // 清除编码计时器
        clearSpeechEncodeSpeedTimer();
    }


    // 没有上传config.b文件
    if (message.mobileSpeechGetIPAndPortFailed != undefined) {
        console.log("get config info by md5 failed!", message.mobileSpeechGetIPAndPortFailed);
        // 脚本运行失败,节点上没找到config.b，弹出提示框
        document.getElementById("userSpeechOneApp_alertContent").innerText = "数据发送失败，找不到模型文件！";
        document.getElementById('userSpeechOneApp_alert_result').style.display = 'block';
    }

    // 发送数据失败
    if (message.runMobileSpeechSendInputProcessErrorLog != undefined) {
        console.log("run speech send-input script error, ", message.runMobileSpeechSendInputProcessErrorLog);
        document.getElementById("userSpeechOneApp_alertContent").innerText = "数据发送失败，请查看日志或联系系统管理员！";
        document.getElementById('userSpeechOneApp_alert_result').style.display = 'block';
        clearSpeechRegSpeedTimer();
    }

    // 芯片语音识别结束，输出脉冲
    if (message.getMobileSpeechOutputSpikesRet != undefined) {
        console.log("get speech output spikes result", message.getMobileSpeechOutputSpikesRet);
        clearSpeechRegSpeedTimer();
        // loading图隐藏
        document.getElementById('userSpeechOneApp_recorder_outputEchartLoading').style.display = 'none';
        // 画输出脉冲图
        document.getElementById("mobileAudio_output_charts").style.display = "block";
        display_speechOutput_scatterChart(message.getMobileSpeechOutputSpikesRet, "mobileAudio_output_charts");
    }

    // 显示识别结果
    if (message.getMobileSpeechRegRet != undefined) {
        console.log("get speech reg result", message.getMobileSpeechRegRet);
        document.getElementById('userSpeechOneApp_recorder_outputNumLoading').style.display = 'none';
        document.getElementById("mobileAudio_output_num").style.display = "block";
        // 显示识别结果
        console.log("为啥没了啊！！", document.getElementById("userSpeechOneApp_recorder_outputResult"))

        if (document.getElementById("userSpeechOneApp_recorder_outputResult") == null) {
            let div_tag = document.createElement('div');
            div_tag.className = "userMnistOneApp_handWriter_outputNum";
            div_tag.id = "userSpeechOneApp_recorder_outputResult";
            div_tag.innerHTML = message.getMobileSpeechRegRet;
            console.log("*********************create div !!!!!!!!!!!!!!!!!");
            document.getElementById("mobileAudio_output_num").appendChild(div_tag);
        } else {
            document.getElementById("userSpeechOneApp_recorder_outputResult").innerHTML = message.getMobileSpeechRegRet;
        }


    }

    // 运行时间
    if (message.mobileSpeechRecognitionProcessTime != undefined) {
        console.log("get speech run time: ", message.mobileSpeechRecognitionProcessTime);
        document.getElementById("userSpeechOneApp_recorder_runtime").innerHTML = message.mobileSpeechRecognitionProcessTime;
    }

});


/**
 * ******************************************************************************************************
 * 工具函数
 * ******************************************************************************************************
 */
// 单击按钮，播放音频
function startPlayAudio() {
    console.log("test", wavAudioBuffer);
    // 音频播放
    startPlayRecorderAudio(wavAudioBuffer);
}


// 音频播放+绘图
function startPlayRecorderAudio(audioData) {
    console.log("播放音频主函数", audioData);


    const audioContext = new AudioContext({ sampleRate: audioData.sampleRate });
    console.log("音频采样率=" + audioData.sampleRate);
    const audio_buffer = audioContext.createBuffer(audioData.numberOfChannels, audioData.length, audioData.sampleRate);
    for (let ch = 0; ch < audio_buffer.numberOfChannels; ++ch) {
        const f32a = new Float32Array(audio_buffer.length);
        for (let i = 0; i < audio_buffer.length; ++i) {
            f32a[i] = audioData.channelData[ch][i];
        }
        audio_buffer.copyToChannel(f32a, ch);
    }
    // let source = audioContext.createBufferSource();
    // source.buffer = audio_buffer;
    // source.connect(audioContext.destination);
    // source.start(audioContext.currentTime, 0);   // 播放音频

    let audioBufferSouceNode = audioContext.createBufferSource(),
        analyser = audioContext.createAnalyser();
    // 将source与分析器连接
    audioBufferSouceNode.connect(analyser);
    // 将分析器与destination连接，这样才能形成到达扬声器的通路
    analyser.connect(audioContext.destination);
    // 将上一步解码得到的buffer数据赋值给source
    audioBufferSouceNode.buffer = audio_buffer;
    // 播放
    audioBufferSouceNode.start(audioContext.currentTime, 0);
    // 音乐响起后，把analyser传递到另一个方法开始绘制频谱图了，因为绘图需要的信息要从analyser里面获取
    drawSpectrum(analyser);


    // // base64 转blob
    // let audioBlob = base64ToBlob(bs64, "wav");
    // console.log("DDDD", audioBlob);
    // wavesurfer.loadBlob(audioBlob);

    // // wavesurfer实现不了
    // console.log(file);
    // if (file) {
    //     var reader = new FileReader();
    //     reader.onload = function (evt) {
    //         var blob = new window.Blob([new Uint8Array(evt.target.result)]);
    //         wavesurfer.loadBlob(blob);
    //     };
    //     reader.onerror = function (evt) {
    //         console.error("An error ocurred reading the file: ", evt);
    //     };
    //     reader.readAsArrayBuffer(file);
    // }
    // 播放和暂停
    // btnPlay.addEventListener('click', function () {
    //     console.log("播放");
    //     wavesurfer.play();
    // });
    // btnPause.addEventListener('click', function () {
    //     console.log("暂停");
    //     wavesurfer.pause();
    // });
}

// 绘制音频频谱图
function drawSpectrum(analyser) {
    var that = this,
        canvas = document.getElementById('canvas'),
        cwidth = canvas.width,
        cheight = canvas.height - 2,
        meterWidth = 2, //width of the meters in the spectrum
        gap = 1, //gap between meters
        capHeight = 2,
        capStyle = '#77a4ff',
        meterNum = 150 / (2 + 1), //count of the meters
        capYPositionArray = []; ////store the vertical position of hte caps for the preivous frame
    ctx = canvas.getContext('2d'),
        gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(1, '#0f0');
    gradient.addColorStop(0.5, '#ff0');
    gradient.addColorStop(0, '#f00');
    var drawMeter = function () {
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        if (that.status === 0) {
            //fix when some sounds end the value still not back to zero
            for (var i = array.length - 1; i >= 0; i--) {
                array[i] = 0;
            };
            allCapsReachBottom = true;
            for (var i = capYPositionArray.length - 1; i >= 0; i--) {
                allCapsReachBottom = allCapsReachBottom && (capYPositionArray[i] === 0);
            };
            if (allCapsReachBottom) {
                cancelAnimationFrame(that.animationId); //since the sound is stoped and animation finished, stop the requestAnimation to prevent potential memory leak,THIS IS VERY IMPORTANT!
                return;
            };
        };
        var step = Math.round(array.length / meterNum); //sample limited data from the total array
        ctx.clearRect(0, 0, cwidth, cheight);
        for (var i = 0; i < meterNum; i++) {
            var value = array[i * step];
            if (capYPositionArray.length < Math.round(meterNum)) {
                capYPositionArray.push(value);
            };
            ctx.fillStyle = capStyle;
            //draw the cap, with transition effect
            if (value < capYPositionArray[i]) {
                ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
            } else {
                ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
                capYPositionArray[i] = value;
            };
            ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
            ctx.fillRect(i * 12 /*meterWidth+gap*/, cheight - value + capHeight, meterWidth, cheight); //the meter
        }
        that.animationId = requestAnimationFrame(drawMeter);
    }
    this.animationId = requestAnimationFrame(drawMeter);
}


// 清空echart图
function clearEchart(eleID) {
    // 重新绘图前先清空
    let dom = document.getElementById(eleID);
    let existInstance = echarts.getInstanceByDom(dom);
    if (existInstance) {
        if (true) {
            echarts.dispose(existInstance);
            console.log("清除echart", eleID);
        }
    }
}

// 脉冲编码图
function display_speechEncode_scatterChart(datas, eleID) {
    var opt = {
        tooltip: {
            formatter: '({c})'   // 鼠标悬浮显示坐标
        },
        xAxis: {
            type: 'value',
            interval: 10, // 步长
            min: 0, // 起始
            max: 100, // 终止
            name: "Time(ms)",
            nameGap: 25,   // 坐标名称距离x轴的距离，默认15
            nameLocation: "center",
            nameTextStyle: {
                color: "#999999"
            },
            axisLabel: {
                textStyle: {
                    color: "#999999"
                },
            }
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 500,  // 手写板的神经元个数 28*28
            scale: true,
            name: "Neuron",
            nameTextStyle: {
                color: "#999999"
            },
            axisLabel: {
                formatter: '{value}',
                textStyle: {
                    color: "#999999"
                }
            }
        },
        grid: {
            left: 50, // 图表距离左侧的间距
        },
        series: [{
            symbolSize: 5,
            data: datas,
            type: 'scatter'
        }]
    };
    var spike_chart = echarts.init(document.getElementById(eleID));
    spike_chart.setOption(opt);
}



// 脉冲输出图
function display_speechOutput_scatterChart(datas, eleID) {
    var opt = {
        tooltip: {
            formatter: '({c})'   // 鼠标悬浮显示坐标
        },
        xAxis: {
            type: 'value',
            interval: 1, // 步长
            min: 0, // 起始
            max: 9, // 终止
            name: "Neuron",
            nameGap: 25,   // 坐标名称距离x轴的距离，默认15
            nameLocation: "center",
            nameTextStyle: {
                color: "#999999"
            },
            axisLabel: {
                textStyle: {
                    color: "#999999"
                },
            }
        },
        yAxis: {
            type: 'value',
            scale: true,
            name: "count",
            nameTextStyle: {
                color: "#999999"
            },
            axisLabel: {
                formatter: '{value}',
                textStyle: {
                    color: "#999999"
                }
            }
        },
        grid: {
            left: 50, // 图表距离左侧的间距
        },
        series: [{
            symbolSize: 5,
            data: datas,
            type: 'scatter'
        }]
    };
    var spike_chart = echarts.init(document.getElementById(eleID));
    spike_chart.setOption(opt);
}


// 弹出框 相关
function closeUserOneAppAlertBox() {
    document.getElementById('userSpeechOneApp_alert_result').style.display = 'none';
}



// 编码进度计时器
function startSpeechEncodeSpeedTimer() {
    let tmpSpeed = 0;
    mobileSpeechEncodeTimer = setInterval(function setEncodeSpeed() {
        let curSpeed = Number(document.getElementById("mobileAudio_encode_processBar").innerHTML.replace(/(^\s*)|(\s*$)/g, ""));
        console.log("现在的编码进度为： ", curSpeed);
        if (curSpeed < 80) {
            tmpSpeed += 20;
            document.getElementById("mobileAudio_encode_processBar").innerHTML = tmpSpeed;
        }
    }, 600);
}
function clearSpeechEncodeSpeedTimer() {
    if (mobileSpeechEncodeTimer != undefined) {
        clearInterval(mobileSpeechEncodeTimer);
        mobileSpeechEncodeTimer = undefined;
        console.log("encodeSpeed timer killed!");
    }
    document.getElementById("mobileAudio_encode_processBar").innerHTML = "0";
}

// 芯片识别进度计时器
function startSpeechRegSpeedTimer() {
    let tmpSpeed = 0;
    mobileSpeechRegTimer = setInterval(function setEncodeSpeed() {
        let curSpeed = Number(document.getElementById("mobileAudio_output_processBar").innerHTML.replace(/(^\s*)|(\s*$)/g, ""));
        console.log("现在的识别进度为： ", curSpeed);
        if (curSpeed < 80) {
            tmpSpeed += 20;
            document.getElementById("mobileAudio_output_processBar").innerHTML = "" + tmpSpeed;
        }
    }, 1000);
}
function clearSpeechRegSpeedTimer() {
    if (mobileSpeechRegTimer != undefined) {
        clearInterval(mobileSpeechRegTimer);
        mobileSpeechRegTimer = undefined;
        console.log("regSpeed timer killed!");
    }
    document.getElementById("mobileAudio_output_processBar").innerHTML = "0";
}










/**
  * desc: base64对象转blob文件对象
  * @param base64  ：数据的base64对象
  * @param fileType  ：文件类型 mp3等;
  * @returns {Blob}：Blob文件对象
  */
function base64ToBlob(base64, fileType) {
    let typeHeader = 'data:application/' + fileType + ';base64,'; // 定义base64 头部文件类型
    let audioSrc = typeHeader + base64; // 拼接最终的base64
    let arr = audioSrc.split(',');
    let array = arr[0].match(/:(.*?);/);
    let mime = (array && array.length > 1 ? array[1] : type) || type;
    // 去掉url的头，并转化为byte
    let bytes = window.atob(arr[1]);
    // 处理异常,将ascii码小于0的转换为大于0
    let ab = new ArrayBuffer(bytes.length);
    // 生成视图（直接针对内存）：8位无符号整数，长度1个字节
    let ia = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) {
        ia[i] = bytes.charCodeAt(i);
    }
    console.log("base64转为blob");
    return new Blob([ab], {
        type: mime
    });
}
