
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
    console.log("call vscode to get task list information", data.command, data.cbid);
}



/**
 * ******************************************************************************************************
 * 接收插件的消息
 * ******************************************************************************************************
 */
window.addEventListener('message', event => {
    const message = event.data;
    console.log("html get message:", message);

    // 获取任务文件列表
    if (message.cmd == 'getImgAppTasksListRet') {
        this.imgAppTasksList = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get img task list', this.imgAppTasksList.length);
    }


    // 任务删除结果
    if(message.deleteImgAppTaskRet != undefined) {
        console.log('---------------------------message：delete task ', message.deleteImgAppTaskRet);
        // 表格中删除一行数据
        deleteRowByID(message.deleteImgAppTaskRet);
    }

});

// 根据id匹配结果，删除一行记录
function deleteRowByID(id) {
    let tab = document.getElementById('imgAppTasksTable');
    let trs = tab.getElementsByTagName('tr');
    for (let i = 0; i <trs.length; i++) {
        console.log("行号：", trs[i].rowIndex);
        if(trs[i].cells[1].innerHTML == id) {
            console.log("列一内容：", trs[i].cells[1].innerHTML);
            tab.deleteRow(trs[i].rowIndex);
        }
    }
}


new Vue({
    el: '#imgAppTasks',
    data: {
        imgAppTasksList: [],
        show: true,
    },

    mounted() {
        callbacks('getImgAppTasksList', imgAppTasksList => this.imgAppTasksList = imgAppTasksList);
    },
    watch: {

    },
    methods: {
        gotoNewImgAppTaskPage() {
            console.log("go to new img app task page!");
            // 给插件发送消息 跳转到应用列表页面
            vscode.postMessage({
                command: 'gotoNewImgAppTaskPage',
                text: "跳转到应用列表页面",
            });
        },

        gotoImgAppTaskPage(imgAppID) {
            console.log("run app: ", imgAppID);
            // 给插件发送消息 跳转到任务页面
            vscode.postMessage({
                command: 'gotoImgAppTaskPage',
                text: imgAppID,
            });
        },

        deleteImgAppTask(appID) {
            console.log("delete task: ", appID);
            // 给插件发送消息 删除一条应用
            vscode.postMessage({
                command: 'deleteImgAppTask',
                text: appID,
            });
        }
       
    }
});