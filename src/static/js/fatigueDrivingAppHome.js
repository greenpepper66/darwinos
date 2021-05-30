
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






/**
 * ******************************************************************************************************
 * 接收插件的消息
 * ******************************************************************************************************
 */
window.addEventListener('message', event => {
    const message = event.data;
    console.log("html get message:", message);

    // 获取应用文件列表
    if (message.cmd == 'getFDAppsConfigListRet') {
        this.appsConfigList = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get apps list', this.appsConfigList.length);
    }



});



new Vue({
    el: '#fatigueDrivingAppHome',
    data: {
        appsConfigList: [], // 全部应用
        appsShowedList: [],  // 根据搜索条件匹配的应用
        searchByAppName: "", // 搜索应用名称
        searchByModelID: -1, // 搜索模型ID

        show: true,
    },

    mounted() {
        callbacks('getFDAppsConfigList', appsConfigList => {
            this.appsConfigList = appsConfigList;
            this.appsShowedList = appsConfigList;
        });
    },
    watch: {

    },
    methods: {
        gotoNewFDAppPage() {
            vscode.postMessage({
                command: 'gotoNewFDAppPage',
                text: '进入新建应用页面'
            });
        },


        /* 搜索框实现 */
        searchImgApp() {
          
        },
    }
});