
const vscode = acquireVsCodeApi();

/**
 * ******************************************************************************************************
 * 给插件发送消息
 * ******************************************************************************************************
 */
// 新建图像识别应用页面
function selectImgDir() {
    vscode.postMessage({
        command: 'selectImgDir',
        text: '选择本地图像所在文件夹'
    });
}
function getModelFileList() {
    console.log("getModelFileList js function ");
    vscode.postMessage({
        command: 'getModelFileList',
        text: '从插件获取所有模型文件'
    });
}
function selectEncodeConfFile() {
    console.log("selectEncodeConfFile js function ");
    vscode.postMessage({
        command: 'selectEncodeConfFile',
        text: '选择编码所需配置文件'
    });
}
function selectOutputDir() {
    console.log("selectOutputDir js function ");
    vscode.postMessage({
        command: 'selectOutputDir',
        text: '选择编码过程中输出文件所在的文件夹'
    });
}


// 保存应用配置信息
function saveImgAppConfig() {
    console.log("saveImgAppConfig js function ");

    // 获取各个输入项
    let appName = document.getElementById("project_name").value;                // 应用名称
    let imgSrcKind = document.getElementById("select_imgSrc_type").value;       // 数据源
    if (imgSrcKind == "localImg") {
        var imgDir = document.getElementById("img-local-dir").value;            // 本地图像文件夹
    } else if (imgSrcKind == "remoteImg") {
        var imgDir = document.getElementById("remoteIP_addr").value;
    }

    let modelFileID = document.getElementById("select_model").value;            // 绑定模型
    let encodeMethodID = document.getElementById("encode_method_type").value;   // 编码方法
    let encodeConfDir = document.getElementById("encode_config_file").value;     // 编码配置文件所在目录
    let outputDir = document.getElementById("output_dir").value;                // 编码过程中间文件输出目录 

    console.log("获取各个输入项", appName, imgSrcKind, imgDir, modelFileID, encodeMethodID, encodeConfDir, outputDir);

    vscode.postMessage({
        command: 'saveImgAppConfig',
        text: [appName, imgSrcKind, imgDir, modelFileID, encodeMethodID, encodeConfDir, outputDir],
    });
}


// 新建的应用启动运行
function startRunTheNewApp() {
    // 先保存
    

    
    // // 跳转到任务界面
    // let imgAppName = document.getElementById("project_name").value;
    // vscode.postMessage({
    //     command: 'gotoImgAppRunTaskPageByName',
    //     text: imgAppName,
    // });
    // // 新增一条任务

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

    // 点击隐藏的按钮，弹出模态框
    if (message.createImgApplictaion != undefined) {
        document.getElementById("modal_dialog").click();
        console.log("web view, 创建新的应用");
    }

    // 用户选择的源图像数据目录
    if (message.selectedImgDir != undefined) {
        let imgOriginPath = message.selectedImgDir;
        console.log('---------------------------message：get img dir', imgOriginPath);
        document.getElementById("img-local-dir").value = message.selectedImgDir;
    }

    // 获取模型文件列表
    if (message.modelFileListRet != undefined) {
        let modelFileListRet = message.modelFileListRet;
        console.log('---------------------------message：get model list', modelFileListRet[0].id);
        this.modelFileList = modelFileListRet;
        console.log(this.modelFileList[0].name);
        for (let i = 0; i < modelFileListRet.length; i++) {
            // new Option("Option text","Option value");
            let text = modelFileListRet[i].id + " - " + modelFileListRet[i].name + " - " + "节点" + modelFileListRet[i].nodeID + " - " + modelFileListRet[i].nodeIP;
            let value = modelFileListRet[i].id + " - " + modelFileListRet[i].name + " - " + modelFileListRet[i].nodeID + " - " + modelFileListRet[i].nodeIP;
            $("#select_model").append((new Option(text, value)));
        }
    }

    // 获取应用配置保存结果，并弹出提示框
    if (message.saveImgAppConfigRet != undefined) {
        console.log('---------------------------message：get config save result', message.saveImgAppConfigRet);
        if (message.saveImgAppConfigRet == "success") {
            document.getElementById("saveAppInfoModalContent").innerText = "保存成功！";
        } else if (message.saveImgAppConfigRet.indexOf("error") != -1) {
            document.getElementById("saveAppInfoModalContent").innerText = "保存失败：" + message.saveImgAppConfigRet;
        }
        document.getElementById("btn_saveAppInfoRetModal").click();
    }

    // 用户选择的配置文件目录
    if (message.selectedEncodeConfDir != undefined) {
        let dir = message.selectedEncodeConfDir;
        console.log('---------------------------message：get encode config dir', dir);
        document.getElementById("encode_config_file").value = message.selectedEncodeConfDir;
    }

    // 用户选择的输出文件目录
    if (message.selectedOutputDir != undefined) {
        let dir = message.selectedOutputDir;
        console.log('---------------------------message：get output dir', dir);
        document.getElementById("output_dir").value = message.selectedOutputDir;
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
// 用户选择输出方式：本地展示或输出给远程地址
function selectRetShowWay() {
    console.log(document.getElementById("select_retShow_way").value);
    let retShowWay = document.getElementById("select_retShow_way").value;
    if (retShowWay == "localShow") {
        document.getElementById("get_remoteIP_addr_forRet").style.display = "none";//隐藏
    } else if (retShowWay == "remoteShow") {
        document.getElementById("get_remoteIP_addr_forRet").style.display = "";//显示
    }
}

new Vue({
    el: '#newImgApp',
    data: {
        modelFileList: [], // 所有运行节点上的模型文件
        createTime: '',  // 应用创建时间
        shows: true,

    },
    mounted() {
        getModelFileList();
    },
    watch: {

    },
    methods: {

    }
});