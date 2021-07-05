
const vscode = acquireVsCodeApi();


function getAgeJudgeModelFileList() {
    console.log("getAgeJudgeModelFileList js function ");
    vscode.postMessage({
        command: 'getAgeJudgeModelFileList',
        text: '从插件获取所有模型文件'
    });
}

function selectAgeJudgeEncodeConfFile() {
    console.log("selectAgeJudgeEncodeConfFile js function ");
    vscode.postMessage({
        command: 'selectAgeJudgeEncodeConfFile',
        text: '选择编码所需配置文件'
    });
}

function selectAgeJudgeOutputDir() {
    console.log("selectAgeJudgeOutputDir js function ");
    vscode.postMessage({
        command: 'selectAgeJudgeOutputDir',
        text: '选择编码过程中输出文件所在的文件夹'
    });
}

// 用户选择输出方式：本地展示或输出给远程地址
function selectAgeJudgeRetShowWay() {
    console.log(document.getElementById("newAgeJudgeApp_retShow_way").value);
    let retShowWay = document.getElementById("newAgeJudgeApp_retShow_way").value;
    if (retShowWay == "localShow") {
        document.getElementById("newAgeJudgeApp_remoteIP_forRet").style.display = "none";//隐藏
    } else if (retShowWay == "remoteShow") {
        document.getElementById("newAgeJudgeApp_remoteIP_forRet").style.display = "";//显示
    }
}

// 保存应用配置信息
function saveAgeJudgeAppConfig() {
    console.log("saveAgeJudgeAppConfig js function ");

    // 获取各个输入项
    let appName = document.getElementById("newAgeJudgeApp_appName").value;                // 应用名称
    let modelFileID = document.getElementById("newAgeJudgeApp_select_model").value;            // 绑定模型
    let encodeMethodID = document.getElementById("newAgeJudgeApp_encodeMethod").value;   // 编码方法
    let encodeConfDir = document.getElementById("newAgeJudgeApp_encodeConfig_file").value;     // 编码配置文件所在目录
    let outputDir = document.getElementById("newAgeJudgeApp_outputDir").value;                // 编码过程中间文件输出目录 

    console.log("获取各个输入项", appName, modelFileID, encodeMethodID, encodeConfDir, outputDir);
    if (appName == "" || modelFileID == "" || encodeMethodID == "" || encodeConfDir == "" || outputDir == "") {
        console.log("some input is null!");
        document.getElementById("saveAgeJudgeAppInfoModalContent").innerText = "保存失败：输入不能为空！";
        document.getElementById('newAgeJudgeApp_alert_result').style.display = 'block';
        return
    }

    vscode.postMessage({
        command: 'saveAgeJudgeAppConfig',
        text: [appName, modelFileID, encodeMethodID, encodeConfDir, outputDir],
    });
}


// 弹出框 相关
function closeNewAgeJudgeAppAlertBox() {
    document.getElementById('newAgeJudgeApp_alert_result').style.display = 'none';

    // 保存成功的话，跳转到应用列表页面
    let saveRet = document.getElementById("saveAgeJudgeAppInfoModalContent").innerText;
    if (saveRet == "保存成功！") {
        vscode.postMessage({
            command: 'newAgeJudgeAppSaveSuccGotoListPage',
            text: "新建应用保存成功，回到年龄检测应用列表页面",
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
    if (message.getAgeJudgeModelFileListRet != undefined) {
        let modelFileListRet = message.getAgeJudgeModelFileListRet;
        console.log('---------------------------message：get age judge model list', modelFileListRet[0].id);
        this.modelFileList = modelFileListRet;
        console.log(this.modelFileList[0].name);
        for (let i = 0; i < modelFileListRet.length; i++) {
            // new Option("Option text","Option value");
            let text = modelFileListRet[i].id + " - " + modelFileListRet[i].name + " - " + "节点" + modelFileListRet[i].nodeID + " - " + modelFileListRet[i].nodeIP;
            let value = modelFileListRet[i].id + " - " + modelFileListRet[i].name + " - " + modelFileListRet[i].nodeID + " - " + modelFileListRet[i].nodeIP;
            $("#newAgeJudgeApp_select_model").append((new Option(text, value)));
        }
    }

    // 用户选择的配置文件目录
    if (message.selectAgeJudgeEncodeConfFileRet != undefined) {
        let dir = message.selectAgeJudgeEncodeConfFileRet;
        console.log('---------------------------message：get speech encode config dir', dir);
        document.getElementById("newAgeJudgeApp_encodeConfig_file").value = message.selectAgeJudgeEncodeConfFileRet;
    }

    // 用户选择的输出文件目录
    if (message.selectAgeJudgeOutputDirRet != undefined) {
        let dir = message.selectAgeJudgeOutputDirRet;
        console.log('---------------------------message：get speech output dir', dir);
        document.getElementById("newAgeJudgeApp_outputDir").value = message.selectAgeJudgeOutputDirRet;
    }

    // 获取应用配置保存结果，并弹出提示框
    if (message.saveAgeJudgeAppConfig != undefined) {
        console.log('---------------------------message：get speech config save result', message.saveAgeJudgeAppConfig);
        if (message.saveAgeJudgeAppConfig == "success") {
            document.getElementById("saveAgeJudgeAppInfoModalContent").innerText = "保存成功！";
        } else if (message.saveAgeJudgeAppConfig.indexOf("error") != -1) {
            document.getElementById("saveAgeJudgeAppInfoModalContent").innerText = "保存失败：" + message.saveAgeJudgeAppConfig;
        }
        // document.getElementById("btn_saveAppInfoRetModal").click();
        document.getElementById('newAgeJudgeApp_alert_result').style.display = 'block';
    }

});





new Vue({
    el: '#newAgeJudgeApp',
    data: {
        modelFileList: [], // 所有运行节点上的模型文件
        createTime: '',  // 应用创建时间
        shows: true,

    },
    mounted() {
        getAgeJudgeModelFileList();
    },
    watch: {

    },
    methods: {

    }
});