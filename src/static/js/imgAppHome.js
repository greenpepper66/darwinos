
const vscode = acquireVsCodeApi();


// 与插件的交互
// 1. 数字图像识别应用首页
function gotoNewAppPage() {
    vscode.postMessage({
        command: 'gotoNewAppPage',
        text: '进入新建应用页面'
    });
}

// 2. 新建图像识别应用页面
function selectImgDir() {
    vscode.postMessage({
        command: 'selectImgDir',
        text: '选择本地图像所在文件夹'
    });
}
function getModelFileList() {
    console.log("tetasgdaagfdgfdgfdgfd");
    vscode.postMessage({
        command: 'getModelFileList',
        text: '从插件获取所有模型文件'
    });
}


// vscode返回的消息处理
window.addEventListener('message', event => {
    const message = event.data;
    console.log("html get message:", message);

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
    }

});


new Vue({
    el: '#imgAppHome',
    data: {
        modelFileList: [], // 所有运行节点上的模型文件
        createTime: '',  // 应用创建时间
        show: true,
        selected_dropdown_value: "-",  // 默认值
    },
    mounted() {
        getModelFileList();
    },
    watch: {

    },
    methods: {

    }
});