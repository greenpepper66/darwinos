
const vscode = acquireVsCodeApi();


/**
 * ******************************************************************************************************
 * 给插件发送消息
 * ******************************************************************************************************
 */
function gotoNewAppPage() {
    vscode.postMessage({
        command: 'gotoNewAppPage',
        text: '进入新建应用页面'
    });
}

function getAppsConfigList() {
    console.log("getAppsConfigList js function ");
    vscode.postMessage({
        command: 'getAppsConfigList',
        text: '从插件获取最近应用列表'
    });
}

function deleteAppConfig(row, appID) {
    // 页面上删除
    var i = row.parentNode.parentNode.rowIndex;
    document.getElementById('appsTable').deleteRow(i);
    console.log("delete app: ", appID);
    // 给插件发送消息 删除一条应用
    vscode.postMessage({
        command: 'deleteAppConfig',
        text: appID,
    });
}

function godoImgAppInfoPage(imgAppID) {
    console.log("search app: ", imgAppID);
    // 给插件发送消息 跳转到详情页
    vscode.postMessage({
        command: 'godoImgAppInfoPage',
        text: imgAppID,
    });
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
    if (message.appsConfigListRet != undefined) {
        this.appsConfigList = message.appsConfigListRet;
        console.log('---------------------------message：get apps list', this.appsConfigList.length);
        // 在table 中生成tr
        for (let i = 0; i < this.appsConfigList.length; i++) {
            let tr = $("<tr><td width='10%'>" + this.appsConfigList[i].id +
                "</td><td width='10%'>" + this.appsConfigList[i].name +
                "</td><td width='10%'>" + "数字图像识别" +
                "</td><td width='10%'>" + this.appsConfigList[i].modeFileID +
                "</td><td width='10%'>" + this.appsConfigList[i].encodeMethodID +
                "</td><td width='10%'>" + this.appsConfigList[i].createTime +
                "</td><td width='20%'>" + 
                " <button onclick='godoImgAppInfoPage( " + this.appsConfigList[i].id + ")'>详情</button>" + 
                " <button>启动</button>" +
                " <button onclick='deleteAppConfig(this, " + this.appsConfigList[i].id + ")'>移除</button>" +
                "</td></tr>");
            $("#appsTable").append(tr);
        }
    }


    // 应用删除结果
    if (message.deleteAppConfigRet != undefined) {
        console.log('---------------------------message：delete app ', message.deleteAppConfigRet);
    }

});


function deleteRow(Field, targetTable) {

    var findex = getElementOrder(Field) - 1;//此处减1是因sourceTable中有一行是隐藏的

    document.getElementById(targetTable).deleteRow(findex);

}



new Vue({
    el: '#imgAppHome',
    data: {
        appsConfigList: [],
        show: true,
    },

    mounted() {

        getAppsConfigList();
    },
    watch: {

    },
    methods: {

    }
});