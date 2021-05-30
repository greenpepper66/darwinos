
const vscode = acquireVsCodeApi();

/**
 * ******************************************************************************************************
 * 给插件发送消息
 * ******************************************************************************************************
 */
// 新建疲劳检测应用页面
function fdAppGetModelFileList() {
    console.log("fdAppGetModelFileList js function ");
    vscode.postMessage({
        command: 'fdAppGetModelFileList',
        text: '从插件获取所有模型文件'
    });
}
function fdAppSelectEncodeConfFile() {
    console.log("fdAppSelectEncodeConfFile js function ");
    vscode.postMessage({
        command: 'fdAppSelectEncodeConfFile',
        text: '选择疲劳检测编码所需配置文件'
    });
}
function fdAppSelectOutputDir() {
    console.log("fdAppSelectOutputDir js function ");
    vscode.postMessage({
        command: 'fdAppSelectOutputDir',
        text: '选择编码过程中输出文件所在的文件夹'
    });
}


// 用户选择输出方式：本地展示或输出给远程地址
function selectRetShowWay() {
    console.log(document.getElementById("fatigueDrivingApp_select_retShow_way").value);
    let retShowWay = document.getElementById("fatigueDrivingApp_select_retShow_way").value;
    if (retShowWay == "localShow") {
        document.getElementById("fatigueDrivingApp_get_remoteIP_addr_forRet").style.display = "none";//隐藏
    } else if (retShowWay == "remoteShow") {
        document.getElementById("fatigueDrivingApp_get_remoteIP_addr_forRet").style.display = "";//显示
    }
}

// 保存应用配置信息
function saveFatigueDrivingAppConfig() {
    console.log("saveFatigueDrivingAppConfig js function ");

    // 获取各个输入项
    let appName = document.getElementById("fatigueDrivingApp_appName").value;                // 应用名称
    let modelFileID = document.getElementById("fatigueDrivingApp_model").value;            // 绑定模型
    let encodeMethodID = document.getElementById("fatigueDrivingApp_encode_method").value;   // 编码方法
    let encodeConfDir = document.getElementById("fatigueDrivingApp_encode_config_file").value;     // 编码配置文件所在目录
    let outputDir = document.getElementById("fatigueDrivingApp_output_dir").value;                // 编码过程中间文件输出目录 

    console.log("获取各个输入项", appName, modelFileID, encodeMethodID, encodeConfDir, outputDir);
    if (appName == "" || modelFileID == "" || encodeMethodID == "" || encodeConfDir == "" || outputDir == "") {
        console.log("some input is null!");
        document.getElementById("saveAppInfoModalContent").innerText = "保存失败：输入不能为空！";
        // document.getElementById("btn_saveAppInfoRetModal").click();
        document.getElementById('fatigueDrivingApp_alert_result').style.display = 'block';
        return
    }

    vscode.postMessage({
        command: 'saveFatigueDrivingAppConfig',
        text: [appName, modelFileID, encodeMethodID, encodeConfDir, outputDir],
    });
}



// 关闭弹出框
function closeNewFDAppAlertBox() {
    document.getElementById('fatigueDrivingApp_alert_result').style.display = 'none';

    // 保存成功的话，跳转到应用列表页面
    let saveRet = document.getElementById("saveAppInfoModalContent").innerText;
    if(saveRet == "保存成功！") {
        vscode.postMessage({
            command: 'newFDAppSaveSuccGotoListPage',
            text: "新建应用保存成功，回到应用列表页面",
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


    // 1. 获取模型文件列表
    if (message.fdAppGetModelFileListRet != undefined) {
        let modelFileListRet = message.fdAppGetModelFileListRet;
        console.log('---------------------------message：get model list', modelFileListRet[0].id);
        this.modelFileList = modelFileListRet;
        console.log(this.modelFileList[0].name);
        for (let i = 0; i < modelFileListRet.length; i++) {
            // new Option("Option text","Option value");
            let text = modelFileListRet[i].id + " - " + modelFileListRet[i].name + " - " + "节点" + modelFileListRet[i].nodeID + " - " + modelFileListRet[i].nodeIP;
            let value = modelFileListRet[i].id + " - " + modelFileListRet[i].name + " - " + modelFileListRet[i].nodeID + " - " + modelFileListRet[i].nodeIP;
            $("#fatigueDrivingApp_model").append((new Option(text, value)));
        }
    }

    // 2. 用户选择的配置文件目录
    if (message.fdAppSelectEncodeConfFileRet != undefined) {
        let dir = message.fdAppSelectEncodeConfFileRet;
        console.log('---------------------------message：get encode config dir', dir);
        document.getElementById("fatigueDrivingApp_encode_config_file").value = message.fdAppSelectEncodeConfFileRet;
    }

    // 3. 用户选择的输出文件目录
    if (message.fdAppSelectOutputDirRet != undefined) {
        let dir = message.fdAppSelectOutputDirRet;
        console.log('---------------------------message：get output dir', dir);
        document.getElementById("fatigueDrivingApp_output_dir").value = message.fdAppSelectOutputDirRet;
    }

    // 4. 获取应用配置保存结果，并弹出提示框
    if (message.saveFatigueDrivingAppConfigRet != undefined) {
        console.log('---------------------------message：get config save result', message.saveFatigueDrivingAppConfigRet);
        if (message.saveFatigueDrivingAppConfigRet == "success") {
            document.getElementById("saveAppInfoModalContent").innerText = "保存成功！";
        } else if (message.saveFatigueDrivingAppConfigRet.indexOf("error") != -1) {
            document.getElementById("saveAppInfoModalContent").innerText = "保存失败：" + message.saveFatigueDrivingAppConfigRet;
        }
        // document.getElementById("btn_saveAppInfoRetModal").click();
        document.getElementById('fatigueDrivingApp_alert_result').style.display = 'block';
    }

});



/**
 * ******************************************************************************************************
 * 工具函数
 * ******************************************************************************************************
 */
// 用户选择数据源：本地图像还是远程ip
function selectImgSrcKind() {
    console.log(document.getElementById("select_imgSrc_type").value);
    let imgSrcKind = document.getElementById("select_imgSrc_type").value
    if (imgSrcKind == "localImg") {
        document.getElementById("select_local_path").style.display = "";//显示
        document.getElementById("get_remoteIP_addr").style.display = "none";//隐藏
    } else if (imgSrcKind == "remoteImg") {
        document.getElementById("select_local_path").style.display = "none";//隐藏
        document.getElementById("get_remoteIP_addr").style.display = "";//显示
    }
}


new Vue({
    el: '#newFatigueDrivingApp',
    data: {
        modelFileList: [], // 所有运行节点上的模型文件
        createTime: '',  // 应用创建时间
        shows: true,

    },
    mounted() {
        fdAppGetModelFileList();
    },
    watch: {

    },
    methods: {

    }
});