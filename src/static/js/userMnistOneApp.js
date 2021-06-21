const vscode = acquireVsCodeApi();


// 标记脚本运行是否返回错误，有错误的话不再执行下一步
var runScriptProcessError = false;           // 本地图像的
var runHandWriterScriptProcessError = false; // 手写板的

// 手写板是否有输入图像传过来
var getHandWriterImgFlag = false;   // 没收到图像的话是false

// 进度条计时器
var handWriterImgEncodeTimer = undefined;
var handWriterImgRegTimer = undefined;


new Vue({
    el: '#userMnistOneApp',
    data: {
        show: true,
        userAppInfo: [],
        handWriterServerURL: "",  // 手写板应用的ip地址
    },

    mounted() {
        callbacks('getOneMnistUserAppInfo', userAppInfo => this.userAppInfo = userAppInfo);
        callbacks('getHandWriterServerURL', handWriterServerURL => this.handWriterServerURL = handWriterServerURL);
    },
    watch: {

    },
    methods: {
        userAppGotoImgAppInfoPage(imgAppID) {
            console.log("search app: ", imgAppID);
            // 给插件发送消息 跳转到详情页
            vscode.postMessage({
                command: 'userAppGotoImgAppInfoPage',
                text: imgAppID,
            });
        },
        userAppGotoImgAppTaskPage(imgAppID) {
            console.log("run app: ", imgAppID);
            // 给插件发送消息 跳转到任务页面
            vscode.postMessage({
                command: 'userAppGotoImgAppTaskPage',
                text: imgAppID,
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
    console.log("call vscode to get task list information", data.command, data.cbid);
}

function userAppSelectImgDir() {
    vscode.postMessage({
        command: 'userAppSelectImgDir',
        text: '选择本地图像所在文件夹'
    });
}

// 点击启动应用按钮
function userAppStartRun() {
    // 标志值初始化
    runScriptProcessError = false;

    // 清空进度条
    document.getElementById("png_convert_progress_div").style.width = "0%";
    document.getElementById("pickle_convert_progress_div").style.width = "0%";
    document.getElementById("recognition_task_progress_div").style.width = "0%";

    // 清空结果
    document.getElementById("userMnistOneApp_imgNum").innerHTML = "";
    document.getElementById("userMnistOneApp_runtime").innerHTML = "";
    DeleteAllColumnExceptFirst("recognition_ret_tab");


    // 保存图像源信息
    console.log("start run task button is clicked.");
    let imgKind = document.getElementById("userMnistOneApp_select_imgSrc_type").value;
    if (imgKind == "localImg") {
        var imgDir = document.getElementById("userMnistOneApp_select_file_ret").value;            // 本地图像文件夹
    } else if (imgKind == "networkImg") {
        var imgDir = document.getElementById("userMnistOneApp_get_remoteIP_addr").value;
    }
    if (imgKind == "" || imgDir == "") {
        console.log("some input is null!");
        document.getElementById("userMnistOneApp_alertContent").innerText = "启动失败：输入源不能为空！";
        // document.getElementById("btn_saveAppInfoRetModal").click();
        document.getElementById('userMnistOneApp_alert_result').style.display = 'block';
        return
    }
    vscode.postMessage({
        command: 'userAppStartRun',
        text: [imgKind, imgDir]
    });
}

function startImgConvertProcess() {
    console.log("start convert png images.");
    vscode.postMessage({
        command: 'startImgConvertProcess',
        text: '运行image图像转换脚本'
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
window.addEventListener('message', event => {
    const message = event.data;
    console.log("html get message:", message);

    // 获取本应用配置信息
    if (message.cmd == 'getOneMnistUserAppInfoRet') {
        this.userAppInfo = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get user app info', this.userAppInfo.name);
    }

    // 显示选择的图像路径
    if (message.userAppSelectImgDirRet != undefined) {
        let imgOriginPath = message.userAppSelectImgDirRet;
        console.log('---------------------------message：get img dir', imgOriginPath);
        document.getElementById("userMnistOneApp_select_file_ret").value = message.userAppSelectImgDirRet;
    }

    // 获取图像数量
    if (message.userAppStartRunReturnImgNum != undefined) {
        console.log('---------------------------message：get img num', message.userAppStartRunReturnImgNum);
        document.getElementById("userMnistOneApp_imgNum").innerHTML = message.userAppStartRunReturnImgNum;
    }

    // 0. 解包配置文件的脚本
    // 日志输出
    if (message.unpackConfigFileProcessLog != undefined) {
        let log_output_lists = new Array();
        log_output_lists = log_output_lists.concat(message.unpackConfigFileProcessLog.split("<br/>"));
        console.log("data.logoutput=[" + message.unpackConfigFileProcessLog + "]");
        console.log("data split list len=" + log_output_lists.length);
    }
    // 错误和告警输出
    if (message.unpackConfigFileProcessErrorLog != undefined) {
        console.log("run script err: ", message.unpackConfigFileProcessErrorLog);

        // 脚本运行失败，弹出提示框
        document.getElementById("userMnistOneApp_alertContent").innerText = "解包配置文件失败，请查看日志或联系系统管理员！";
        document.getElementById('userMnistOneApp_alert_result').style.display = 'block';

        // 标记脚本运行有误
        runScriptProcessError = true;
    }

    // 解包结束，发送命令 编码
    if (message.unpackConfigFileProcessFinish != undefined) {
        console.log("run script over!", message.unpackConfigFileProcessFinish);

        // 解包没有错误才执行下一步
        if (runScriptProcessError == false) {
            startImgConvertProcess();
        }
    }


    // 1. 李畅的脚本 - 图像编码 相关消息
    // 日志输出
    if (message.imgConvertProcessLog != undefined) {
        let log_output_lists = new Array();
        log_output_lists = log_output_lists.concat(message.imgConvertProcessLog.split("<br/>"));
        console.log("data.logoutput=[" + message.imgConvertProcessLog + "]");
        console.log("data split list len=" + log_output_lists.length);
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

        // 脚本运行失败，弹出提示框
        document.getElementById("userMnistOneApp_alertContent").innerText = "脉冲编码失败，请查看日志或联系系统管理员！";
        document.getElementById('userMnistOneApp_alert_result').style.display = 'block';

        // 标记脚本运行有误
        runScriptProcessError = true;
    }

    // 脉冲编码结束，进度条刷满格
    if (message.imgConvertProcessFinish != undefined) {
        console.log("run script over!", message.imgConvertProcessFinish);
        document.getElementById("png_convert_progress_div").style.width = "100%";

        // 编码没有错误， 才 发送消息执行柳铮的脚本
        if (runScriptProcessError == false) {
            startPickleConvertProcess();
        }
    }

    // 2. 柳铮的脚本 - 打包编译 相关消息
    if (message.pickleConvertProcessLog != undefined) {
        let log_output_lists = new Array();
        log_output_lists = log_output_lists.concat(message.imgConvertProcessLog.split("<br/>"));
        console.log("data.logoutput=[" + message.imgConvertProcessLog + "]");
        console.log("data split list len=" + log_output_lists.length);
    }

    if (message.pickleConvertOneDone != undefined) {
        console.log("run script2 middle: ", message.pickleConvertOneDone);
        let addVal = parseInt(message.pickleConvertOneDone[0] / message.pickleConvertOneDone[1] * 100) + "%";
        document.getElementById("pickle_convert_progress_div").style.width = addVal;
    }

    if (message.pickleConvertProcessErrorLog != undefined) {
        console.log("run script2 err: ", message.pickleConvertProcessErrorLog);
        // 脚本运行失败，弹出提示框
        document.getElementById("userMnistOneApp_alertContent").innerText = "脉冲打包失败，请查看日志或联系系统管理员！";
        document.getElementById('userMnistOneApp_alert_result').style.display = 'block';

        // 标记脚本运行有误
        runScriptProcessError = true;
    }

    if (message.pickleConvertProcessFinish != undefined) {
        console.log("run script2 over!", message.pickleConvertProcessFinish);
        document.getElementById("pickle_convert_progress_div").style.width = "100%";

        // 打包没有错误，才 发送消息执行图像识别的脚本
        if (runScriptProcessError == false) {
            startRecognitionProcess();
        }
    }

    // 3. 图像识别 相关消息
    if (message.recognitionProcessLog != undefined) {
        let log_output_lists = new Array();
        log_output_lists = log_output_lists.concat(message.recognitionProcessLog.split("<br/>"));
        console.log("data.logoutput=[" + message.recognitionProcessLog + "]");
        console.log("data split list len=" + log_output_lists.length);
    }

    if (message.recognitionOneDone != undefined) {
        console.log("run mnist middle: ", message.recognitionOneDone);
        let addVal = parseInt(message.recognitionOneDone[0] / message.recognitionOneDone[1] * 100) + "%";
        document.getElementById("recognition_task_progress_div").style.width = addVal;
    }

    if (message.getConnectionIPAndPortFailed != undefined) {
        console.log("get config info by md5 failed!", message.getConnectionIPAndPortFailed);
        // 脚本运行失败,节点上没找到config.b，弹出提示框
        document.getElementById("userMnistOneApp_alertContent").innerText = "数据发送失败，找不到模型文件！";
        document.getElementById('userMnistOneApp_alert_result').style.display = 'block';
    }

    if (message.recognitionProcessErrorLog != undefined) {
        console.log("run mnist err: ", message.recognitionProcessErrorLog);
        // 脚本运行失败，弹出提示框
        document.getElementById("userMnistOneApp_alertContent").innerText = "数据发送失败，请查看日志或联系系统管理员！";
        document.getElementById('userMnistOneApp_alert_result').style.display = 'block';

        // 标记脚本运行有误
        runScriptProcessError = true;
    }

    // 获取应用运行时间
    if (message.recognitionProcessFinish != undefined) {
        console.log("run mnist over and runtime is：", message.recognitionProcessFinish);
        document.getElementById("recognition_task_progress_div").style.width = "100%";
        document.getElementById("userMnistOneApp_runtime").innerHTML = message.recognitionProcessFinish;
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
    }




    /**
     * *************************
     * 手写板应用
     * *************************
     */
    // 获取网页地址
    if (message.cmd == 'getHandWriterServerURLRet') {
        this.handWriterServerURL = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get hand writer url', this.handWriterServerURL);
    }

    // 获取手写图像
    if (message.getHandWriterImgRet != undefined) {
        console.log("message.getHandWriterImgRet 页面接收到图像");
        getHandWriterImgFlag = true;
        document.getElementById("userMnistOneApp_handWriter_imgData").src = message.getHandWriterImgRet;
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
        startEncodeSpeedTimer();
    }

    // 解包配置文件失败
    if (message.unpackHandWriterConfigProcessErrorLog != undefined) {
        console.log("run hand-writer unpack script err: ", message.unpackHandWriterConfigProcessErrorLog);
        runHandWriterScriptProcessError = true;
    }

    // 解包结束
    if (message.unpackHandWriterConfigProcessFinish != undefined) {
        console.log("run hand-writer unpack script over!", message.unpackHandWriterConfigProcessFinish);
    }

    // 编码失败
    if (message.encodeHandWriterImgProcessErrorLog != undefined) {
        console.log("run hand-writer encode script err: ", message.encodeHandWriterImgProcessErrorLog);
        // 脚本运行失败，弹出提示框
        document.getElementById("userMnistOneApp_alertContent").innerText = "脉冲编码失败，请查看日志或联系系统管理员！";
        document.getElementById('userMnistOneApp_alert_result').style.display = 'block';
        // 标记脚本运行有误
        runHandWriterScriptProcessError = true;
        // 清除计时器
        clearEncodeSpeedTimer();
    }

    // 编码结束，发送命令执行芯片识别
    if (message.encodeHandWriterImgProcessFinish != undefined) {
        console.log("run hand-writer encode script over!", message.encodeHandWriterImgProcessFinish);

        // 解包没有错误才执行下一步
        if (runHandWriterScriptProcessError == false) {
            startHandWriterRecognitionProcess();
            // 启动识别计时器
            startRegSpeedTimer();
        }

        // 清除编码计时器
        clearEncodeSpeedTimer();
    }

    // 获取编码脉冲数据，绘制echart图
    if (message.getHandWriterEncodeRet != undefined) {
        console.log("get hand-writer encode spikes data to draw echart.", message.getHandWriterEncodeRet);
        // loading图隐藏
        document.getElementById('userMnistOneApp_handWriter_encodeEchartLoading').style.display = 'none';
        // 画图
        document.getElementById("handWriter_spikes_charts").style.display = "block";
        display_spike_scatter_chart(message.getHandWriterEncodeRet);
    }

    // 没有上传config.b文件
    if (message.handWriterGetIPAndPortFailed != undefined) {
        console.log("get config info by md5 failed!", message.handWriterGetIPAndPortFailed);
        // 脚本运行失败,节点上没找到config.b，弹出提示框
        document.getElementById("userMnistOneApp_alertContent").innerText = "数据发送失败，找不到模型文件！";
        document.getElementById('userMnistOneApp_alert_result').style.display = 'block';
    }
    // 发送数据失败
    if (message.runHandWriterSendInputProcessErrorLog != undefined) {
        console.log("run hand writer img send-input script error, ", message.runHandWriterSendInputProcessErrorLog);
        document.getElementById("userMnistOneApp_alertContent").innerText = "数据发送失败，请查看日志或联系系统管理员！";
        document.getElementById('userMnistOneApp_alert_result').style.display = 'block';
        clearRegSpeedTimer();
    }
    // 芯片图像识别结束
    if (message.runHandWriterSendInputProcessResult != undefined) {
        console.log("get hand-writer img recognition result", message.runHandWriterSendInputProcessResult);
        clearRegSpeedTimer();
        // loading图隐藏
        document.getElementById('userMnistOneApp_handWriter_outputEchartLoading').style.display = 'none';
        document.getElementById('userMnistOneApp_handWriter_outputNumLoading').style.display = 'none';
        // 画输出脉冲图
        document.getElementById("handWriter_output_charts").style.display = "block";
        document.getElementById("handWriter_output_num").style.display = "block";
        display_output_scatter_chart(message.runHandWriterSendInputProcessResult[0]);
        // 显示识别结果
        document.getElementById("userMnistOneApp_handWriter_outputNum").innerHTML = message.runHandWriterSendInputProcessResult[1];
    }
    // 运行时间
    if (message.handWriterRecognitionProcessTime != undefined) {
        console.log("get hand writer run time: ", message.handWriterRecognitionProcessTime);
        document.getElementById("userMnistOneApp_handWriter_runtime").innerHTML = message.handWriterRecognitionProcessTime;
    }



});




/**
 * ******************************************************************************************************
 * 手写板应用
 * ******************************************************************************************************
 */
// 1. 加载图像后，自动执行图像识别
function handWriterAppStartRun() {
    // // 检查有没有图像
    // if (getHandWriterImgFlag == false) {
    //     console.log("没图");
    //     document.getElementById("userMnistOneApp_alertContent").innerText = "请先在手机浏览器中绘制要识别的数字并提交！";
    //     document.getElementById('userMnistOneApp_alert_result').style.display = 'block';
    //     return;
    // }

    // // 清空结果
    // document.getElementById("userMnistOneApp_handWriter_outputNum").innerHTML = "";
    // document.getElementById('userMnistOneApp_handWriter_outputNumLoading').style.display = 'block';

    // 解包没有错误才执行编码
    if (runHandWriterScriptProcessError == false) {
        startHandWriterEncode();
    } else {
        // 脚本运行失败，弹出提示框
        document.getElementById("userMnistOneApp_alertContent").innerText = "解包配置文件失败，请查看日志或联系系统管理员，并刷新当前页面！";
        document.getElementById('userMnistOneApp_alert_result').style.display = 'block';
    }
}

// 2. 执行编码
function startHandWriterEncode() {
    vscode.postMessage({
        command: 'startHandWriterEncode',
        text: "执行手写板图像编码",
    });
}
// 3. 执行芯片识别过程
function startHandWriterRecognitionProcess() {
    vscode.postMessage({
        command: 'startHandWriterRecognitionProcess',
        text: "给芯片发送数据执行数字识别",
    });
}








// 用户选择数据源：本地图像还是手写板
function selectImgSrcKind() {
    console.log(document.getElementById("userMnistOneApp_select_imgSrc_type").value);
    let imgSrcKind = document.getElementById("userMnistOneApp_select_imgSrc_type").value
    if (imgSrcKind == "localImg") {
        document.getElementById("userMnistOneApp_select_local_path").style.display = "";//显示
        document.getElementById("userMnistOneApp_localImg_startBtn").style.display = "";
        document.getElementById("userMnistOneApp_localImg_mainPage").style.display = "";

        document.getElementById("userMnistOneApp_handWriter_addr").style.display = "none"; //隐藏
        document.getElementById("userMnistOneApp_handWriter_mainPage").style.display = "none";

    } else if (imgSrcKind == "handWriter") {
        // 本地图像相关元素
        document.getElementById("userMnistOneApp_select_local_path").style.display = "none";//隐藏
        document.getElementById("userMnistOneApp_localImg_startBtn").style.display = "none";
        document.getElementById("userMnistOneApp_localImg_mainPage").style.display = "none";

        // 手写板相关元素
        document.getElementById("userMnistOneApp_handWriter_addr").style.display = ""; //显示
        document.getElementById("userMnistOneApp_handWriter_mainPage").style.display = "";

        // 给vscode发送消息接收移动端输入的手写体图像
        vscode.postMessage({
            command: 'startGetHandWriterImg',
            text: "接收手机手写体图像",
        });

        // 标志值初始化
        runHandWriterScriptProcessError = false;

        // 解包配置文件
        vscode.postMessage({
            command: 'unpackHandWriterConfig',
            text: "解包手写板配置文件",
        });

    }
}




/**
 * ******************************************************************************************************
 * 工具函数
 * ******************************************************************************************************
 */

// 弹出框 相关
function closeUserOneAppAlertBox() {
    document.getElementById('userMnistOneApp_alert_result').style.display = 'none';
}

// 删除表格列
function DeleteAllColumnExceptFirst(eleID) {
    var tab = document.getElementById(eleID);
    var columnLength = tab.rows[1].cells.length;
    console.log("删除表格列：", columnLength);

    //删除指定单元格 
    for (var i = columnLength - 1; i > 0; i--) {
        tab.rows[0].deleteCell(i);
        tab.rows[1].deleteCell(i);
    }
}







/**
 * ******************************************************************************************************
 * 画图函数
 * ******************************************************************************************************
 */
// var testData = [[9, 182], [18, 182], [27, 182], [36, 182], [45, 182], [9, 183], [18, 183], [27, 183], [36, 183], [45, 183], [9, 209], [18, 209], [27, 209], [36, 209], [45, 209], [9, 210], [18, 210], [27, 210], [36, 210], [45, 210], [9, 211], [18, 211], [27, 211], [36, 211], [45, 211], [9, 237], [18, 237], [27, 237], [36, 237], [45, 237], [9, 238], [18, 238], [27, 238], [36, 238], [45, 238], [9, 239], [18, 239], [27, 239], [36, 239], [45, 239], [9, 265], [18, 265], [27, 265], [36, 265], [45, 265], [9, 266], [18, 266], [27, 266], [36, 266], [45, 266], [9, 267], [18, 267], [27, 267], [36, 267], [45, 267], [9, 293], [18, 293], [27, 293], [36, 293], [45, 293], [9, 294], [18, 294], [27, 294], [36, 294], [45, 294], [9, 295], [18, 295], [27, 295], [36, 295], [45, 295], [9, 321], [18, 321], [27, 321], [36, 321], [45, 321], [9, 322], [18, 322], [27, 322], [36, 322], [45, 322], [9, 323], [18, 323], [27, 323], [36, 323], [45, 323], [9, 349], [18, 349], [27, 349], [36, 349], [45, 349], [9, 350], [18, 350], [27, 350], [36, 350], [45, 350], [9, 351], [18, 351], [27, 351], [36, 351], [45, 351], [9, 377], [18, 377], [27, 377], [36, 377], [45, 377], [9, 378], [18, 378], [27, 378], [36, 378], [45, 378], [9, 379], [18, 379], [27, 379], [36, 379], [45, 379], [9, 405], [18, 405], [27, 405], [36, 405], [45, 405], [9, 406], [18, 406], [27, 406], [36, 406], [45, 406], [9, 407], [18, 407], [27, 407], [36, 407], [45, 407], [9, 433], [18, 433], [27, 433], [36, 433], [45, 433], [9, 434], [18, 434], [27, 434], [36, 434], [45, 434], [9, 435], [18, 435], [27, 435], [36, 435], [45, 435], [9, 461], [18, 461], [27, 461], [36, 461], [45, 461], [9, 462], [18, 462], [27, 462], [36, 462], [45, 462], [41, 463], [9, 489], [18, 489], [27, 489], [36, 489], [45, 489], [9, 490], [18, 490], [27, 490], [36, 490], [45, 490], [9, 517], [18, 517], [27, 517], [36, 517], [45, 517], [9, 518], [18, 518], [27, 518], [36, 518], [45, 518]];

// 脉冲编码图
function display_spike_scatter_chart(datas) {
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
            max: 784,  // 手写板的神经元个数 28*28
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
    var spike_chart = echarts.init(document.getElementById("handWriter_spikes_charts"));
    spike_chart.setOption(opt);
}

// 脉冲输出图
function display_output_scatter_chart(datas) {
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
    var spike_chart = echarts.init(document.getElementById("handWriter_output_charts"));
    spike_chart.setOption(opt);
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

// 编码进度计时器
function startEncodeSpeedTimer() {
    let tmpSpeed = 0;
    handWriterImgEncodeTimer = setInterval(function setEncodeSpeed() {
        let curSpeed = document.getElementById("handWriter_encode_processBar").innerHTML;
        console.log("现在的进度为： ", curSpeed);
        if (curSpeed != "80%") {
            tmpSpeed += 20;
            document.getElementById("handWriter_encode_processBar").innerHTML = tmpSpeed + "%";
        }
    }, 800); 
}
function clearEncodeSpeedTimer() {
    if(handWriterImgEncodeTimer != undefined) {
        clearInterval(handWriterImgEncodeTimer);
        handWriterImgEncodeTimer = undefined;
        console.log("encodeSpeed timer killed!");
    }
    document.getElementById("handWriter_encode_processBar").innerHTML = "0%";
}

// 芯片识别进度计时器
function startRegSpeedTimer() {
    let tmpSpeed = 0;
    handWriterImgRegTimer = setInterval(function setEncodeSpeed() {
        let curSpeed = document.getElementById("handWriter_output_processBar").innerHTML;
        console.log("现在的进度为： ", curSpeed);
        if (curSpeed != "80%") {
            tmpSpeed += 20;
            document.getElementById("handWriter_output_processBar").innerHTML = tmpSpeed + "%";
        }
    }, 600); 
}
function clearRegSpeedTimer() {
    if(handWriterImgRegTimer != undefined) {
        clearInterval(handWriterImgRegTimer);
        handWriterImgRegTimer = undefined;
        console.log("regSpeed timer killed!");
    }
    document.getElementById("handWriter_output_processBar").innerHTML = "0%";
}