
const vscode = acquireVsCodeApi();


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

// 保存应用配置信息
function saveImgAppConfig() {
    console.log("saveImgAppConfig js function ");

    // 判断各个选项是否为空

    // 获取各个输入项
    var appName = document.getElementById("project_name").value;
    var imgDir = document.getElementById("img-local-dir").value;
    var modelFileID = document.getElementById("select_model").value;
    var encodeMethodID = document.getElementById("encode_method_type").value;

    console.log("获取各个输入项", appName, imgDir, modelFileID, encodeMethodID);

    vscode.postMessage({
        command: 'saveImgAppConfig',
        text: [appName, imgDir, modelFileID, encodeMethodID],
    });
}


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
        imgOriginPath = message.selectedImgDir;
        console.log('---------------------------message：get img dir', imgOriginPath);
        document.getElementById("img-local-dir").value = message.selectedImgDir;
    }

    // 获取模型文件列表
    if (message.modelFileListRet != undefined) {
        modelFileListRet = message.modelFileListRet;
        console.log('---------------------------message：get model list', modelFileListRet[0].id);
        this.modelFileList = modelFileListRet;
        console.log(this.modelFileList[0].name);
        for (var i = 0; i < modelFileListRet.length; i++) {
            // new Option("Option text","Option value");
            $("#select_model").append((new Option(modelFileListRet[i].id + " - " + modelFileListRet[i].name + " - " + modelFileListRet[i].nodeIP, modelFileListRet[i].id)));
        }
    }

    // 获取应用配置保存结果
    if (message.saveImgAppConfigRet != undefined) {
        console.log('---------------------------message：get config save result', message.saveImgAppConfigRet);
        if(message.saveImgAppConfigRet == "success") {

        } else if(message.saveImgAppConfigRet == "error") {
            
        }
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

        getModelFileList();
    },
    watch: {

    },
    methods: {

    }
});