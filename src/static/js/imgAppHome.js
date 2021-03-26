
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

    // 获取模型文件列表
    if (message.cmd == 'appsConfigListRet') {
        this.appsConfigList = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get apps list', this.appsConfigList.length);
        // 在table 中生成tr
        // for (let i = 0; i < this.appsConfigList.length; i++) {
        //     let tr = $("<tr><td width='10%'>" + this.appsConfigList[i].id +
        //         "</td><td width='10%'>" + this.appsConfigList[i].name +
        //         "</td><td width='10%'>" + "数字图像识别" +
        //         "</td><td width='10%'>" + this.appsConfigList[i].modeFileID +
        //         "</td><td width='10%'>" + this.appsConfigList[i].encodeMethodID +
        //         "</td><td width='10%'>" + this.appsConfigList[i].createTime +
        //         "</td><td width='20%'>" + 
        //         " <button onclick='gotoImgAppInfoPage( " + this.appsConfigList[i].id + ")'>详情</button>" + 
        //         " <button onclick='gotoImgAppRunTaskPage( " + this.appsConfigList[i].id + " )'>启动</button>" +
        //         " <button onclick='deleteAppConfig(this, " + this.appsConfigList[i].id + ")'>移除</button>" +
        //         "</td></tr>");
        //     $("#appsTable").append(tr);
        // }
    }


    // 应用删除结果
    if (message.deleteAppConfigRet != undefined) {
        console.log('---------------------------message：delete app ', message.deleteAppConfigRet);
        // 表格中删除一行数据
        document.getElementById('appsTable').deleteRow(message.deleteAppConfigRet + 1);
    }

});


new Vue({
    el: '#imgAppHome',
    data: {
        appsConfigList: [],
        show: true,
    },

    mounted() {
        callbacks('getAppsConfigList', appsConfigList => this.appsConfigList = appsConfigList);
    },
    watch: {

    },
    methods: {
        gotoNewAppPage() {
            vscode.postMessage({
                command: 'gotoNewAppPage',
                text: '进入新建应用页面'
            });
        },

        gotoImgAppInfoPage(imgAppID) {
            console.log("search app: ", imgAppID);
            // 给插件发送消息 跳转到详情页
            vscode.postMessage({
                command: 'gotoImgAppInfoPage',
                text: imgAppID,
            });
        },
        gotoImgAppRunTaskPageByID(imgAppID) {
            console.log("run app: ", imgAppID);
            // 给插件发送消息 跳转到任务页面
            vscode.postMessage({
                command: 'gotoImgAppRunTaskPageByID',
                text: imgAppID,
            });
        },

        deleteAppConfig(index, appID) {
            console.log("delete app: ", appID);
            // 给插件发送消息 删除一条应用
            vscode.postMessage({
                command: 'deleteAppConfig',
                text: [index, appID],
            });
        }
    }
});