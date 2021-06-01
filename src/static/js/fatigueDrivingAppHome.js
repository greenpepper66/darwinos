
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
        console.log('---------------------------message：get fatigueDriving apps list', this.appsConfigList.length);
    }

    // 应用删除结果
    if (message.deleteFDAppConfigRet != undefined) {
        console.log('---------------------------message：delete fatigueDriving app ', message.deleteAppConfigRet);
        deleteRowByID(message.deleteFDAppConfigRet);
    }

});


// 根据id匹配结果，删除一行记录
function deleteRowByID(id) {
    let tab = document.getElementById('fdAppsTable');
    let trs = tab.getElementsByTagName('tr');
    for (let i = 0; i < trs.length; i++) {
        console.log("行号：", trs[i].rowIndex);
        if (trs[i].cells[1].innerHTML == id) {
            console.log("列一内容：", trs[i].cells[1].innerHTML);
            tab.deleteRow(trs[i].rowIndex);
        }
    }
}


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

        gotoFatigueDrivingAppInfoPage(imgAppID) {
            console.log("search app: ", imgAppID);
            // 给插件发送消息 跳转到详情页
            vscode.postMessage({
                command: 'gotoFatigueDrivingAppInfoPage',
                text: imgAppID,
            });
        },

        deleteFDAppConfig(appID) {
            console.log("delete fatigueDriving app: ", appID);
            // 给插件发送消息 删除一条应用
            vscode.postMessage({
                command: 'deleteFDAppConfig',
                text: appID,
            });
        },

        /* 搜索框实现 */
        searchImgApp() {

        },
    }
});