const vscode = acquireVsCodeApi();

// 标记每步的脚本运行是否error
var runAgeJudgeScriptProcessError = false;
// 记录当前页面上的音频数据
var wavAudioBuffer = null;

// 进度条计时器
var mobileAgeJudgeEncodeTimer = undefined;
var mobileAgeJudgeRegTimer = undefined;





new Vue({
    el: '#userAgeJudgeOneApp',
    data: {
        show: "true",
        userAppInfo: [],
        ageJudgeServerURL: "",  // 手写板应用的ip地址
    },

    mounted() {
        callbacks('getOneUserAgeJudgeAppInfo', userAppInfo => this.userAppInfo = userAppInfo);
        callbacks('getAgeJudgeHttpsServerURL', ageJudgeServerURL => this.ageJudgeServerURL = ageJudgeServerURL);
    },
    watch: {

    },
    methods: {
        userAppGotoAgeJudgeAppInfoPage(speechAppID) {
            console.log("search app: ", speechAppID);
            // 给插件发送消息 跳转到详情页
            vscode.postMessage({
                command: 'userAppGotoAgeJudgeAppInfoPage',
                text: speechAppID,
            });
        },
        userAppGotoAgeJudgeAppTaskPage(speechAppID) {
            console.log("run app: ", speechAppID);
            // 给插件发送消息 跳转到任务页面
            vscode.postMessage({
                command: 'userAppGotoAgeJudgeAppTaskPage',
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

// 1. 收到server 地址后执行解包和接收照片
function startGetPhotoFromMobile() {
    // 标志值初始化
    runAgeJudgeScriptProcessError = false;

    // 解包配置文件
    vscode.postMessage({
        command: 'unpackAgeJudgeConfig',
        text: "解包年龄检测配置文件",
    });

    // 给vscode发送消息接收手机发送来的照片
    vscode.postMessage({
        command: 'startGetPhotoFromMobile',
        text: [this.userAppInfo.id],
    });
}

// 2. 加载照片后，自动执行编码
function ageJudgeAppStartEncode() {
    // 解包没有错误才执行编码
    if (runAgeJudgeScriptProcessError == false) {
        vscode.postMessage({
            command: 'ageJudgeAppStartEncode',
            text: "执行移动端年龄检测编码",
        });
    } else {
        // 脚本运行失败，弹出提示框
        document.getElementById("userAgeJudgeOneApp_alertContent").innerText = "解包配置文件失败，请查看日志或联系系统管理员，并刷新当前页面！";
        document.getElementById('userAgeJudgeOneApp_alert_result').style.display = 'block';
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
    if (message.cmd == 'getOneUserAgeJudgeAppInfoRet') {
        this.userAppInfo = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get user age judge app info', this.userAppInfo.name);
    }

    // 获取网页地址
    if (message.cmd == 'getAgeJudgeHttpsServerURLRet') {
        this.ageJudgeServerURL = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get age-judge url', this.ageJudgeServerURL);

        // 开始接收人脸照片
        startGetPhotoFromMobile();
    }

    // 解包配置文件失败
    if (message.unpackAgeJudgeConfigProcessErrorLog != undefined) {
        console.log("run age judge unpack script err: ", message.unpackAgeJudgeConfigProcessErrorLog);
        runAgeJudgeScriptProcessError = true;
    }

    // 解包结束
    if (message.unpackAgeJudgeConfigProcessFinish != undefined) {
        console.log("run age judge unpack script over!", message.unpackAgeJudgeConfigProcessFinish);
    }

    // 获取照片
    if (message.getPhotoFromMobileRet != undefined) {
        console.log("message.getPhotoFromMobileRet 页面接收到照片");

        // 显示照片
        document.getElementById("userAgeJudgeOneApp_photo_imgData").src = message.getPhotoFromMobileRet;

        // 开始执行照片编码和识别
        ageJudgeAppStartEncode();

        // 识别结果清除
        document.getElementById("mobileAgeJudge_output_num").innerHTML = "";
        // echart图清除
        clearEchart("mobileAgeJudge_spikes_charts");
        clearEchart("mobileAgeJudge_output_charts");
        // echart div隐藏
        document.getElementById("mobileAgeJudge_spikes_charts").style.display = "none";
        document.getElementById("mobileAgeJudge_output_charts").style.display = "none";
        document.getElementById("mobileAgeJudge_output_num").style.display = "none";

        // loading转圈图显示出来
        document.getElementById("userAgeJudgeOneApp_photo_encodeEchartLoading").style.display = "block";
        document.getElementById("userAgeJudgeOneApp_photo_outputEchartLoading").style.display = "block";
        document.getElementById("userAgeJudgeOneApp_photo_outputNumLoading").style.display = "block";

        // // 启动计时器 更新进度
        clearAgeJudgeRegSpeedTimer();
        clearAgeJudgeEncodeSpeedTimer();
        startAgeJudgeEncodeSpeedTimer();
    }

    // 获取编码脉冲数据，绘制echart图
    if (message.getMobileAgeJudgeAppEncodeRet != undefined) {
        console.log("get age-judge encode spikes data to draw echart.", message.getMobileAgeJudgeAppEncodeRet);
        // loading图隐藏
        document.getElementById('userAgeJudgeOneApp_photo_encodeEchartLoading').style.display = 'none';
        // 画图
        document.getElementById("mobileAgeJudge_spikes_charts").style.display = "block";
        display_ageJudgeEncode_scatterChart(message.getMobileAgeJudgeAppEncodeRet, "mobileAgeJudge_spikes_charts");
    }

    // 编码失败
    if (message.encodeMobileAgeJudgeAppProcessErrLog != undefined) {
        console.log("run age judge encode script err: ", message.encodeMobileAgeJudgeAppProcessErrLog);
        // 脚本运行失败，弹出提示框
        document.getElementById("userAgeJudgeOneApp_alertContent").innerText = "脉冲编码失败，请查看日志或联系系统管理员！";
        document.getElementById('userAgeJudgeOneApp_alert_result').style.display = 'block';
        // 标记脚本运行有误
        runAgeJudgeScriptProcessError = true;
        // 清除计时器
        clearAgeJudgeEncodeSpeedTimer();
    }


    // 编码结束，发送命令执行芯片识别
    if (message.encodeMobileAgeJudgeAppProcessFinish != undefined) {
        console.log("run age judge encode script over!", message.encodeMobileAgeJudgeAppProcessFinish);

        // 解包没有错误才执行下一步
        if (runAgeJudgeScriptProcessError == false) {
            vscode.postMessage({
                command: 'startMobileAgeJudgeRecognitionProcess',
                text: "给芯片发送数据年龄检测识别",
            });

            // 启动识别计时器
            startAgeJudgeRegSpeedTimer();
        }

        // 清除编码计时器
        clearAgeJudgeEncodeSpeedTimer();
    }

    // 没有上传config.b文件
    if (message.mobileAgeJudgeGetIPAndPortFailed != undefined) {
        console.log("get config info by md5 failed!", message.mobileAgeJudgeGetIPAndPortFailed);
        // 脚本运行失败,节点上没找到config.b，弹出提示框
        document.getElementById("userAgeJudgeOneApp_alertContent").innerText = "数据发送失败，找不到模型文件！";
        document.getElementById('userAgeJudgeOneApp_alert_result').style.display = 'block';
    }

    // 发送数据失败
    if (message.runMobileAgeJudgeSendInputProcessErrorLog != undefined) {
        console.log("run age-judge send-input script error, ", message.runMobileAgeJudgeSendInputProcessErrorLog);
        document.getElementById("userAgeJudgeOneApp_alertContent").innerText = "数据发送失败，请查看日志或联系系统管理员！";
        document.getElementById('userAgeJudgeOneApp_alert_result').style.display = 'block';
        clearAgeJudgeRegSpeedTimer();
    }


    // 芯片年龄检测结束，输出脉冲
    if (message.getMobileAgeJudgeOutputSpikesRet != undefined) {
        console.log("get age-judge output spikes result", message.getMobileAgeJudgeOutputSpikesRet);
        clearAgeJudgeRegSpeedTimer();
        // loading图隐藏
        document.getElementById('userAgeJudgeOneApp_photo_outputEchartLoading').style.display = 'none';
        // 画输出脉冲图
        document.getElementById("mobileAgeJudge_output_charts").style.display = "block";
        display_ageJudgeOutput_scatterChart(message.getMobileAgeJudgeOutputSpikesRet, "mobileAgeJudge_output_charts");
    }

    // 显示识别结果
    if (message.getMobileAgeJudgeRegRet != undefined) {
        console.log("get speech reg result", message.getMobileAgeJudgeRegRet);
        document.getElementById('userAgeJudgeOneApp_photo_outputNumLoading').style.display = 'none';
        document.getElementById("mobileAgeJudge_output_num").style.display = "block";
        // 显示识别结果
        console.log("为啥没了啊！！", document.getElementById("userAgeJudgeOneApp_photo_outputResult"))

         // 显示年龄段
         var age = "0";
         if (message.getMobileAgeJudgeRegRet == 0) {
             age = "0-20";
         } else if (message.getMobileAgeJudgeRegRet == 1) {
             age = "21-32";
         } else if (message.getMobileAgeJudgeRegRet == 2) {
             age = "33-48";
         } else if (message.getMobileAgeJudgeRegRet == 3) {
             age = "49-59";
         } else if (message.getMobileAgeJudgeRegRet == 4) {
             age = "60-100";
         }

        if (document.getElementById("userAgeJudgeOneApp_photo_outputResult") == null) {
            let div_tag = document.createElement('div');
            div_tag.className = "userAgeJudgeOneApp_outputNum";
            div_tag.id = "userAgeJudgeOneApp_photo_outputResult";
            div_tag.innerHTML = age + "岁";
            console.log("*********************create div !!!!!!!!!!!!!!!!!");
            document.getElementById("mobileAgeJudge_output_num").appendChild(div_tag);
        } else {
            document.getElementById("userAgeJudgeOneApp_photo_outputResult").innerHTML = age + "岁";
        }
    }

    // 运行时间
    if (message.mobileAgeJudgeRecognitionProcessTime != undefined) {
        console.log("get age judge run time: ", message.mobileAgeJudgeRecognitionProcessTime);
        document.getElementById("userAgeJudgeOneApp_photo_runtime").innerHTML = message.mobileAgeJudgeRecognitionProcessTime;
    }

});



/**
 * ******************************************************************************************************
 * 工具函数
 * ******************************************************************************************************
 */
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
function display_ageJudgeEncode_scatterChart(datas, eleID) {
    var opt = {
        tooltip: {
            formatter: '({c})'   // 鼠标悬浮显示坐标
        },
        xAxis: {
            type: 'value',
            interval: 5, // 步长
            min: 0, // 起始
            max: 50, // 终止
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
            max: 800,   // 28*28
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
function display_ageJudgeOutput_scatterChart(datas, eleID) {
    var opt = {
        tooltip: {
            formatter: '({c})'   // 鼠标悬浮显示坐标
        },
        xAxis: {
            type: 'value',
            interval: 1, // 步长
            min: 0, // 起始
            max: 4, // 终止
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
    document.getElementById('userAgeJudgeOneApp_alert_result').style.display = 'none';
}



// 编码进度计时器
function startAgeJudgeEncodeSpeedTimer() {
    let tmpSpeed = 0;
    mobileAgeJudgeEncodeTimer = setInterval(function setEncodeSpeed() {
        let curSpeed = Number(document.getElementById("mobileAgeJudge_encode_processBar").innerHTML.replace(/(^\s*)|(\s*$)/g, ""));
        console.log("现在的编码进度为： ", curSpeed);
        if (curSpeed < 80) {
            tmpSpeed += 20;
            document.getElementById("mobileAgeJudge_encode_processBar").innerHTML = tmpSpeed;
        }
    }, 600);
}
function clearAgeJudgeEncodeSpeedTimer() {
    if (mobileAgeJudgeEncodeTimer != undefined) {
        clearInterval(mobileAgeJudgeEncodeTimer);
        mobileAgeJudgeEncodeTimer = undefined;
        console.log("encodeSpeed timer killed!");
    }
    document.getElementById("mobileAgeJudge_encode_processBar").innerHTML = "0";
}

// 芯片识别进度计时器
function startAgeJudgeRegSpeedTimer() {
    let tmpSpeed = 0;
    mobileAgeJudgeRegTimer = setInterval(function setEncodeSpeed() {
        let curSpeed = Number(document.getElementById("mobileAgeJudge_output_processBar").innerHTML.replace(/(^\s*)|(\s*$)/g, ""));
        console.log("现在的识别进度为： ", curSpeed);
        if (curSpeed < 80) {
            tmpSpeed += 20;
            document.getElementById("mobileAgeJudge_output_processBar").innerHTML = "" + tmpSpeed;
        }
    }, 1000);
}
function clearAgeJudgeRegSpeedTimer() {
    if (mobileAgeJudgeRegTimer != undefined) {
        clearInterval(mobileAgeJudgeRegTimer);
        mobileAgeJudgeRegTimer = undefined;
        console.log("regSpeed timer killed!");
    }
    document.getElementById("mobileAgeJudge_output_processBar").innerHTML = "0";
}








