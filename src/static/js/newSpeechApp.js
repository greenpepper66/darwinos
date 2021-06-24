
const vscode = acquireVsCodeApi();


// 新建语音识别应用页面
function getSpeechModelFileList() {
    console.log("getSpeechModelFileList js function ");
    vscode.postMessage({
        command: 'getSpeechModelFileList',
        text: '从插件获取所有模型文件'
    });
}

function selectSpeechEncodeConfFile() {
    console.log("selectSpeechEncodeConfFile js function ");
    vscode.postMessage({
        command: 'selectSpeechEncodeConfFile',
        text: '选择编码所需配置文件'
    });
}

function selectSpeechOutputDir() {
    console.log("selectSpeechOutputDir js function ");
    vscode.postMessage({
        command: 'selectSpeechOutputDir',
        text: '选择编码过程中输出文件所在的文件夹'
    });
}

// 用户选择输出方式：本地展示或输出给远程地址
function selectSpeechRetShowWay() {
    console.log(document.getElementById("newSpeechApp_retShow_way").value);
    let retShowWay = document.getElementById("newSpeechApp_retShow_way").value;
    if (retShowWay == "localShow") {
        document.getElementById("newSpeechApp_remoteIP_forRet").style.display = "none";//隐藏
    } else if (retShowWay == "remoteShow") {
        document.getElementById("newSpeechApp_remoteIP_forRet").style.display = "";//显示
    }
}

// 保存应用配置信息
function saveSpeechAppConfig() {
    console.log("saveSpeechAppConfig js function ");

    // 获取各个输入项
    let appName = document.getElementById("newSpeechApp_appName").value;                // 应用名称
    let modelFileID = document.getElementById("newSpeechApp_select_model").value;            // 绑定模型
    let encodeMethodID = document.getElementById("newSpeechApp_encodeMethod").value;   // 编码方法
    let encodeConfDir = document.getElementById("newSpeechApp_encodeConfig_file").value;     // 编码配置文件所在目录
    let outputDir = document.getElementById("newSpeechApp_outputDir").value;                // 编码过程中间文件输出目录 

    console.log("获取各个输入项", appName, modelFileID, encodeMethodID, encodeConfDir, outputDir);
    if (appName == "" || modelFileID == "" || encodeMethodID == "" || encodeConfDir == "" || outputDir == "") {
        console.log("some input is null!");
        document.getElementById("saveSpeechAppInfoModalContent").innerText = "保存失败：输入不能为空！";
        // document.getElementById("btn_saveAppInfoRetModal").click();
        document.getElementById('newSpeechApp_alert_result').style.display = 'block';
        return
    }

    vscode.postMessage({
        command: 'saveSpeechAppConfig',
        text: [appName, modelFileID, encodeMethodID, encodeConfDir, outputDir],
    });
}




// 弹出框 相关
function closeNewSpeechAppAlertBox() {
    document.getElementById('newSpeechApp_alert_result').style.display = 'none';

    // 保存成功的话，跳转到应用列表页面
    let saveRet = document.getElementById("saveSpeechAppInfoModalContent").innerText;
    if (saveRet == "保存成功！") {
        vscode.postMessage({
            command: 'newSpeechAppSaveSuccGotoListPage',
            text: "新建应用保存成功，回到语音应用列表页面",
        });
    }

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

    // 获取模型文件列表
    if (message.getSpeechModelFileListRet != undefined) {
        let modelFileListRet = message.getSpeechModelFileListRet;
        console.log('---------------------------message：get speech model list', modelFileListRet[0].id);
        this.modelFileList = modelFileListRet;
        console.log(this.modelFileList[0].name);
        for (let i = 0; i < modelFileListRet.length; i++) {
            // new Option("Option text","Option value");
            let text = modelFileListRet[i].id + " - " + modelFileListRet[i].name + " - " + "节点" + modelFileListRet[i].nodeID + " - " + modelFileListRet[i].nodeIP;
            let value = modelFileListRet[i].id + " - " + modelFileListRet[i].name + " - " + modelFileListRet[i].nodeID + " - " + modelFileListRet[i].nodeIP;
            $("#newSpeechApp_select_model").append((new Option(text, value)));
        }
    }

    // 用户选择的配置文件目录
    if (message.selectSpeechEncodeConfFileRet != undefined) {
        let dir = message.selectSpeechEncodeConfFileRet;
        console.log('---------------------------message：get speech encode config dir', dir);
        document.getElementById("newSpeechApp_encodeConfig_file").value = message.selectSpeechEncodeConfFileRet;
    }

    // 用户选择的输出文件目录
    if (message.selectSpeechOutputDirRet != undefined) {
        let dir = message.selectSpeechOutputDirRet;
        console.log('---------------------------message：get speech output dir', dir);
        document.getElementById("newSpeechApp_outputDir").value = message.selectSpeechOutputDirRet;
    }

    // 获取应用配置保存结果，并弹出提示框
    if (message.saveSpeechAppConfigRet != undefined) {
        console.log('---------------------------message：get speech config save result', message.saveSpeechAppConfigRet);
        if (message.saveSpeechAppConfigRet == "success") {
            document.getElementById("saveSpeechAppInfoModalContent").innerText = "保存成功！";
        } else if (message.saveSpeechAppConfigRet.indexOf("error") != -1) {
            document.getElementById("saveSpeechAppInfoModalContent").innerText = "保存失败：" + message.saveSpeechAppConfigRet;
        }
        // document.getElementById("btn_saveAppInfoRetModal").click();
        document.getElementById('newSpeechApp_alert_result').style.display = 'block';
    }

});



new Vue({
    el: '#newImgApp',
    data: {
        modelFileList: [], // 所有运行节点上的模型文件
        createTime: '',  // 应用创建时间
        shows: true,

    },
    mounted() {
        getSpeechModelFileList();
    },
    watch: {

    },
    methods: {

    }
});