const vscode = acquireVsCodeApi();

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


window.addEventListener('message', event => {
    const message = event.data;
    console.log("html get message:", message);

    // 获取模型文件列表
    if (message.cmd == 'getAgeJudgeAppsConfigListRet') {
        this.appsConfigList = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get age judge apps list', this.appsConfigList.length);
    }

    // 应用删除结果
    if (message.deleteAgeJudgeAppConfigRet != undefined) {
        console.log('---------------------------message：delete app ', message.deleteAgeJudgeAppConfigRet);
        // 表格中删除一行数据
        deleteRowByID(message.deleteAgeJudgeAppConfigRet);
    }

});

// 根据id匹配结果，删除一行记录
function deleteRowByID(id) {
    let tab = document.getElementById('ageJudgeAppsTable');
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
    el: '#ageJudgeAppHome',
    data: {
        appsConfigList: [], // 全部应用
        appsShowedList: [],  // 根据搜索条件匹配的应用
        searchByAppName: "", // 搜索应用名称
        searchByModelID: -1, // 搜索模型ID

        show: true,
    },

    mounted() {
        callbacks('getAgeJudgeAppsConfigList', appsConfigList => {
            this.appsConfigList = appsConfigList;
            this.appsShowedList = appsConfigList;
        });
    },
    watch: {

    },
    methods: {
        gotoNewAgeJudgeAppPage() {
            vscode.postMessage({
                command: 'gotoNewAgeJudgeAppPage',
                text: '进入新建年龄检测应用页面'
            });
        },

        // 删除一个应用
        deleteAgeJudgeAppConfig(appID) {
            console.log("delete speech app: ", appID);
            vscode.postMessage({
                command: 'deleteAgeJudgeAppConfig',
                text: appID,
            });

        },

        gotoAgeJudgeAppInfoPage(imgAppID) {
            console.log("search app: ", imgAppID);
            // 给插件发送消息 跳转到详情页
            vscode.postMessage({
                command: 'gotoAgeJudgeAppInfoPage',
                text: imgAppID,
            });
        },

        /* 搜索框实现 */
        searchAgeJudgeApp() {
            // 获取用户输入的模型名称
            let searchNameVal = document.getElementById("searchByAppName").value;
            let searchModelVal = document.getElementById("searchByModelID").value;   // 按类别分类暂时没有实现
            this.searchByAppName = searchNameVal.replace(/^\s*|\s*$/g, "");  //去除空格
            this.searchByModelID = searchModelVal.replace(/^\s*|\s*$/g, "");
            console.log("查询条件", this.searchByAppName, this.searchByModelID);

            // 名字和id都是空的
            if (this.searchByAppName == "" && this.searchByModelID == "") {
                this.appsShowedList = this.appsConfigList;
                console.log("查询条件都是空值");
            } else if (this.searchByAppName != "" && this.searchByAppName != undefined) {
                this.appsShowedList = [];
                // 名字和id都是非空的
                if (this.searchByModelID != -1 && this.searchByModelID != undefined && this.searchByModelID != "") {
                    console.log("查询条件: 名字和id都是非空的");
                    for (let i = 0; i < this.appsConfigList.length; i++) {
                        if (this.appsConfigList[i].name.includes(this.searchByAppName) && (this.searchByModelID == this.appsConfigList[i].modeFileID)) {
                            this.appsShowedList.push(this.appsConfigList[i]);
                        }
                    }
                } else {
                    // 名字非空，id为空
                    console.log("查询条件: 名字非空，id为空");
                    for (let i = 0; i < this.appsConfigList.length; i++) {
                        if (this.appsConfigList[i].name.includes(this.searchByAppName)) {
                            this.appsShowedList.push(this.appsConfigList[i]);
                        }
                    }
                }
            } else if (this.searchByModelID != -1 && this.searchByModelID != undefined && this.searchByModelID != "") {
                // 名字为空, id非空
                console.log("查询条件: 名字为空, id非空");
                this.appsShowedList = [];

                for (let i = 0; i < this.appsConfigList.length; i++) {
                    if (this.searchByModelID == this.appsConfigList[i].modeFileID) {
                        this.appsShowedList.push(this.appsConfigList[i]);

                    }
                }
            }
        },

    }
});