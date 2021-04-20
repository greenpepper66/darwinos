
const vscode = acquireVsCodeApi();


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
    console.log("call vscode to get userApps list information", data.command, data.cbid);
}



/**
 * ******************************************************************************************************
 * 接收插件的消息
 * ******************************************************************************************************
 */
window.addEventListener('message', event => {
    const message = event.data;
    console.log("html get message:", message);

    // 获取应用文件列表
    if (message.cmd == 'getUserAppsListRet') {
        this.userAppsList = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get img task list', this.userAppsList.length);
    }


});



new Vue({
    el: '#userAppHome',
    data: {
        userAppsList: [],
        show: true,
        appsRowsCount: 1,  // 九宫格排列几行
        appsRowsArr:[0], // 九宫格行号
    },

    mounted() {
        callbacks('getUserAppsList', userAppsList => {
            this.userAppsList = userAppsList;
            this.appsRowsCount = Math.ceil(userAppsList.length / 3);  // 向上取整
            console.log("行数： ", this.appsRowsCount);
        });
    },
    watch: {

    },
    methods: {
        gotoOneMnistUserAppPage(id) {
            console.log("run app: ", id);
            // 给插件发送消息 跳转到用户应用页面
            vscode.postMessage({
                command: 'gotoOneMnistUserAppPage',
                text: id,
            });
        },
    } 
});