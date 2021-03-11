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
        text: '开始运行应用'
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

    if (message.img_convert_log  != undefined) {
        let log_output_lists = new Array();
        log_output_lists = log_output_lists.concat(message.img_convert_log.split("<br/>"));
        console.log("data.logoutput=[" + message.img_convert_log + "]");
        console.log("data split list len=" + log_output_lists.length);
        $("#log_output_div").html(log_output_lists.join("<br/>"));
        document.getElementById("log_output_div").scrollTop = document.getElementById("log_output_div").scrollHeight;


    }

});




new Vue({
    el: '#imgAppRunTask',
    data: {
        currentPageAppID: -1,
        imgAppInformation: [],
        appName: '',
    },
    mounted() {
        callVscode('getImgAppInfos', imgAppInformation => this.imgAppInformation = imgAppInformation);
    },
    watch: {

    },
    methods: {

    }
});