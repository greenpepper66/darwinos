
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
    console.log("regist user.", name, pwd);
    vscode.postMessage({
        command: 'loginSystem',
        text: [name, pwd]
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

    if (message.loginSystemErrorRet != undefined) {
        console.log("login error: ", message.loginSystemErrorRet);
        document.getElementById('login_alert_result').style.display = 'block';
    }



});



new Vue({
    el: '#login',
    data: {
        show: true,
    },

    mounted() {

    },
    watch: {

    },
    methods: {

    }
});

function closeLoginAlertBox() {
    document.getElementById('login_alert_result').style.display = 'none';
}