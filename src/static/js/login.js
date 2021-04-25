
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

function regist() {
    let name = document.getElementById("login_username").value;
    let pwd = document.getElementById("login_password").value;
    console.log("regist user.", name, pwd);
    vscode.postMessage({
        command: 'registUser',
        text: [name, pwd]
    });
}

function login() {
    let name = document.getElementById("login_username").value;
    let pwd = document.getElementById("login_password").value;
    console.log("login user.", name, pwd);
    vscode.postMessage({
        command: 'loginSystem',
        text: [name, pwd]
    });
}

function logout() {
    console.log("logout user.");
    vscode.postMessage({
        command: 'logoutSystem',
        text: "退出登录"
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

    // 登录失败弹出提示框
    if (message.loginSystemErrorRet != undefined) {
        console.log("login error: ", message.loginSystemErrorRet);
        document.getElementById('login_alert_result').style.display = 'block';
    }

    // 登录成功更新页面显示
    if (message.loginSystemSuccess != undefined) {
        // 保存登录用户信息
        this.userInfo = message.loginSystemSuccess;
        console.log("login success: ", this.userInfo);
        // document.getElementById("login_already_username").innerText = this.userInfo.name;
        // let role = "";
        // if (this.userInfo.userRole == 0) {
        //     role = "系统管理员";
        // } else if(this.userInfo.userRole == 1) {
        //     role = "开发者用户";
        // } else if (this.userInfo.userRole == 2) {
        //     role = "普通用户";
        // }
        // document.getElementById("login_already_userRole").innerText = role;
        // document.getElementById('login_already_box').style.display = 'block';
        // document.getElementById('login_input_box').style.display = 'none';

    }

    // 获取任务文件列表
    if (message.cmd == 'getCurrentUserInfoRet') {
        this.userInfo = message.data;
        console.log(message.data);
        (callbacks[message.cbid] || function () { })(message.data);
        delete callbacks[message.cbid];
        console.log('---------------------------message：get user info', this.userInfo.name);
    }

    // 退出登录成功
    if (message.logoutSystemSuccess != undefined) {
        console.log("logout success", message.logoutSystemSuccess);
        this.userInfo = [];
        
    }

});



new Vue({
    el: '#login',
    data: {
        show: true,
        userInfo: []
    },

    mounted() {
        callbacks('getCurrentUserInfo', userInfo => this.userInfo = userInfo);
    },
    watch: {

    },
    methods: {

    }
});

function closeLoginAlertBox() {
    document.getElementById('login_alert_result').style.display = 'none';
}