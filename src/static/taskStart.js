const vscode = acquireVsCodeApi();
const callbacks = {};

let imgConvertPath = "";
let pickleConvertPath = "";



// 与插件的交互
// 1. 步骤一
// 1.1. 给插件发消息，选择输入数据所在文件夹
function selectImgDir() {
    vscode.postMessage({
        command: 'selectImgDir',
        text: '选择输入数据所在目录'
    })
}
// 1.2. 给插件发送消息，选择配置文件路径
function selectBr2pkl() {
    vscode.postMessage({
        command: 'selectBr2pkl',
        text: '导入配置文件'
    })
}
// 1.3 
function selectRetSavePath() {
    vscode.postMessage({
        command: 'selectRetSavePath',
        text: '选择存储路径'
    })
}
// 1.4 
function doImgConvert() {
    vscode.postMessage({
        command: 'doImgConvert',
        text: '执行图像转换'
    })
}


// 步骤二
// 2.1 选择目录
function selectPickleDir() {
    vscode.postMessage({
        command: 'selectPickleDir',
        text: '选择脉冲数据所在目录'
    })
}
// 2.2 数据转换并输出结果
function doPickleConvert() {
    vscode.postMessage({
        command: 'doPickleConvert',
        text: '执行二进制转换'
    })
}

// 步骤三
function doStartTask() {
    vscode.postMessage({
        command: 'doStartTask',
        text: '运行任务'
    })
}

// 步骤四 
function getTaskDetail() {
    vscode.postMessage({
        command: 'getTaskDetail',
        text: '查看任务信息'
    })
}



/**
 * vscode返回的消息处理
 */
window.addEventListener('message', event => {
    const message = event.data;
    console.log("html get message:", message);

    // 用户选择的输入数据目录
    if (message.selectedImgDir != undefined) {
        imgConvertPath = message.selectedImgDir;
        console.log('---------------------------message：get img dir', imgConvertPath);
        document.getElementById("select-png-dir-ret").innerHTML = message.selectedImgDir;
    }

    // 用户选择配置文件路径
    if (message.selectedBr2pkl != undefined) {
        console.log('---------------------------message：get br2 pkl');
        document.getElementById("select-br2-pkl-ret").innerHTML = message.selectedBr2pkl;
    }

    // 用户选择存储路径
    if (message.selectedRetSavePath != undefined) {
        console.log('---------------------------message：get save path');
        document.getElementById("select-save-dir-ret").innerHTML = message.selectedRetSavePath;
    }

    // 图像编码开始
    if (message.startImgConvert != undefined) {
        console.log('---------------------------message：start img convert', message.startImgConvert);
        document.getElementById("start-img-convert").innerHTML = "&nbsp;&nbsp;&nbsp;" + "图像编码开始运行，请稍后。" + "&nbsp;&nbsp;&nbsp;";
    }

    // 图像编码转换结果
    if (message.doImgConvertRet != undefined) {
        console.log('---------------------------message：get convert ret', imgConvertPath);
        document.getElementById("convert-ret").innerHTML = "&nbsp;&nbsp;&nbsp;" + message.doImgConvertRet + "&nbsp;&nbsp;&nbsp;";
        document.getElementById("convert-ret-path").innerHTML = imgConvertPath + "/img_encode_output";
    }

    // 用户选择的pickle数据目录
    if (message.selectedPickleDir != undefined) {
        pickleConvertPath = message.selectedPickleDir;
        console.log('---------------------------message：get pickle dir', pickleConvertPath);
        document.getElementById("select-pickle-dir-ret").innerHTML = message.selectedPickleDir;
    }

    // 二进制编码开始
    if (message.startPickleConvert != undefined) {
        console.log('---------------------------message：start pickle convert', message.startPickleConvert);
        document.getElementById("start-pickle-convert").innerHTML = "&nbsp;&nbsp;&nbsp;" + "二进制编码开始运行，请稍后。" + "&nbsp;&nbsp;&nbsp;";
    }

    // 二进制编码转换结果
    if (message.doPickleConvertRet != undefined) {
        console.log('---------------------------message：get pickle convert ret', message.doPickleConvertRet);
        document.getElementById("convert-pickle-ret").innerHTML = "&nbsp;&nbsp;&nbsp;" + message.doPickleConvertRet + "&nbsp;&nbsp;&nbsp;";
        document.getElementById("convert-pickle-ret-path").innerHTML = pickleConvertPath + "/pickle_encode_output";
    }

    // 任务启动结果
    if (message.doStartTaskSuccess != undefined) {
        console.log('---------------------------message：start task ret', message.doStartTaskSuccess);
        document.getElementById("start-task-ret").innerHTML = "任务启动成功，运行中，请等待";
    }

    // 任务执行结果
    if (message.doStartTaskRet != undefined) {
        console.log('---------------------------message：start task ret', message.doStartTaskRet);
        document.getElementById("run-task-ret").innerHTML = "任务运行成功，输出结果" + message.doStartTaskRet;
    }
    // 任务执行失败
    if (message.doStartTaskFailed != undefined) {
        console.log('---------------------------message：start task ret', message.doStartTaskFailed);
        document.getElementById("run-task-ret").innerHTML = "任务运行失败，失败原因：" + message.doStartTaskFailed;
    }
    // 任务执行结束
    if (message.doStartTaskFinish != undefined) {
        console.log('---------------------------message：start task ret', message.doStartTaskFinish);
        document.getElementById("finish-task-ret").innerHTML = message.doStartTaskFinish;
    }


});

new Vue({
    el: '#page-inner',
    data: {
        userName: '',
        time: '',
        show: true,
    },
    mounted() {

    },
    watch: {

    },
    methods: {

    }
});