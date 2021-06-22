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
    console.log("call vscode to get this img app information", data.command, data.cbid);
}






new Vue({
    el: '#speechAppHome',
    data: {
        appsConfigList: [], // 全部应用
        appsShowedList: [],  // 根据搜索条件匹配的应用
        searchByAppName: "", // 搜索应用名称
        searchByModelID: -1, // 搜索模型ID

        show: true,
    },

    mounted() {
        callbacks('getSpeechAppsConfigList', appsConfigList => {
            this.appsConfigList = appsConfigList;
            this.appsShowedList = appsConfigList;
        });
    },
    watch: {

    },
    methods: {
        gotoNewSpeechAppPage() {
            vscode.postMessage({
                command: 'gotoNewSpeechAppPage',
                text: '进入新建语音应用页面'
            });
        },
    }
});