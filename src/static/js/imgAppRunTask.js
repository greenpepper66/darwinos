const vscode = acquireVsCodeApi();
const callbacks = {};

/**
 * 调用vscode原生api
 * @param data 可以是类似 {command: 'xxx', param1: 'xxx'}，也可以直接是 command 字符串
 * @param cb 可选的回调函数
 */
function callVscode(data, cb) {
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
    console.log("call vscode to get this img app information", data.command, data.cbid);
}

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.cmd) {
        case 'getImgAppInfosRet':
            console.log(message.data);
            (callbacks[message.cbid] || function () { })(message.data);
            delete callbacks[message.cbid];
            break;
        default: break;
    }
});


/**
 * ******************************************************************************************************
 * 给插件发送消息
 * ******************************************************************************************************
 */
function doStartRunTask() {
    console.log("start run task button is clicked.");
    vscode.postMessage({
        command: 'doStartRunTask',
        text: '开始运行应用,先执行脉冲编码脚本'
    });
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

});




new Vue({
    el: '#imgAppRunTask',
    data: {
        currentPageAppID: -1,
        imgAppInformation: [],
        appName: '',

        iframeRoute: "",
    },
    mounted() {
        callVscode('getImgAppInfos', imgAppInformation => {
            this.imgAppInformation = imgAppInformation;
            this.iframeRoute = "http://localhost:5001/#/taskDetail?nodeID=" + this.imgAppInformation.modelFileNodeID  + "&modelID=" + this.imgAppInformation.modeFileID;
            console.log("TTT", iframeRoute);
        });
    },
    watch: {

    },
    methods: {

    }
});