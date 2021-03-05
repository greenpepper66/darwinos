
const vscode = acquireVsCodeApi();


// 与插件的交互
// 1. 数字图像识别应用首页
function gotoNewAppPage() {
    vscode.postMessage({
        command: 'gotoNewAppPage',
        text: '进入新建应用页面'
    });
}



// vscode返回的消息处理
window.addEventListener('message', event => {
    const message = event.data;
    console.log("html get message:", message);

});


new Vue({
    el: '#imgAppHome',
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