import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from "child_process";
import { PageProvideByPort } from "../PageProvider";

const taskHtmlFilePath = 'src/static/views/taskStart.html';

const paramSet = {
    oriImgDir: "",  // 李畅目录， 只选一次
    pickleDir: "",  // 柳铮目录

}
/**
 * 获取html页面
 * @param context 
 * @param templatePath 
 * @returns
 */
export function getTaskInputHtml(context, templatePath) {
    const resourcePath = path.join(context.extensionPath, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');
    // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换

    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });

    // 替换任务输入页面中 script中attr相关
    html = html.replace(/(.+?)(attr\("src", ")(.+?)"/g, (m, $1, $2, $3) => {
        return $1 + $2 + vscode.Uri.file(path.resolve(dirPath, $3)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });

    
	// 任务输入执行页面样式
    let vscodeColorTheme = vscode.window.activeColorTheme.kind;
	if (vscodeColorTheme == 2) {
		html = html.replace(/taskstyle-light.css/, "taskstyle-dark.css");
	} else if(vscodeColorTheme == 1) {
		html = html.replace(/taskstyle-dark.css/, "taskstyle-light.css");
	}

    return html;
}



module.exports = function (context) {
    context.subscriptions.push(vscode.commands.registerCommand('task_view.startTask', function (uri) {
        const panel = vscode.window.createWebviewPanel(
            'taskWelcome', // viewType
            "task", // 视图标题
            vscode.ViewColumn.One, // 显示在编辑器的哪个部位
            {
                enableScripts: true, // 启用JS，默认禁用
                retainContextWhenHidden: true, // 默认情况下当webview被隐藏时资源会被销毁，通过retainContextWhenHidden: true会一直保存，但会占用较大内存开销，仅在需要时开启；
            }
        );
        let global = { panel, context };
        panel.webview.html = getTaskInputHtml(context, taskHtmlFilePath);
        panel.webview.onDidReceiveMessage(message => {
            if (messageHandler[message.command]) {
                messageHandler[message.command](global, message);
            } else {
                vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
            }
        }, undefined, context.subscriptions);
    }));
};


/**
 * 接收webview的消息 执行对应操作，并返回结果
 */
const messageHandler = {
    selectImgDir(global, message) {
        // 原始图像数据所在目录，注意选择上一层
        const options: vscode.OpenDialogOptions = {
            openLabel: "选择目录",
            canSelectFolders: true,
        };
        vscode.window.showOpenDialog(options).then(fileUri => {
            paramSet.oriImgDir = fileUri[0].path;
            console.log("选择目录为", paramSet.oriImgDir);
            // 将选择的目录返回给webview
            global.panel.webview.postMessage({ selectedImgDir: fileUri[0].path });
        });
    },
    selectBr2pkl(global, message) {
        const options: vscode.OpenDialogOptions = {
            openLabel: "选择配置文件br2.pkl",
        };
        vscode.window.showOpenDialog(options).then(fileUri => {
            console.log("配置文件路径为", fileUri);
            // 将选择的文件返回给webview
            global.panel.webview.postMessage({ selectedBr2pkl: fileUri[0].path });
        });
    },
    selectRetSavePath(global, message) {
        const options: vscode.OpenDialogOptions = {
            openLabel: "选择目录",
            canSelectFolders: true,
        };
        vscode.window.showOpenDialog(options).then(fileUri => {
            console.log("存储目录为", fileUri[0].path);
            // 将选择的目录返回给webview
            global.panel.webview.postMessage({ selectedRetSavePath: fileUri[0].path });
        });
    },
    doImgConvert(global, message) {
        // 执行python脚本，并返回执行结果
        console.log("选择目录为", paramSet.oriImgDir);
        let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "encode_input.py");
        // 文件夹选择器返回的路径如 /D:/workspace/lab-work/input整合/data_input_encode 需要去掉第一个/  并将/转为\  路径里不能带中文
        let param = paramSet.oriImgDir.substr(1).replace(/\//g, "\\");
        let command_str = "python " + scriptPath + " " + param;
        console.log("执行命令为", command_str);

        global.panel.webview.postMessage({ startImgConvert: "ok" });

        let convertRet = "";
        exec(command_str, function (err, stdout, stderr) {
            if (err) {
                convertRet = "Convert Failed!"
                console.log(err);
            } else {
                convertRet = "Convert Success!"
            }
            global.panel.webview.postMessage({ doImgConvertRet: convertRet });
        });
    },


    selectPickleDir(global, message) {
        // pickle文件所在目录，注意要选择上一层
        const options: vscode.OpenDialogOptions = {
            openLabel: "选择目录",
            canSelectFolders: true,
        };
        vscode.window.showOpenDialog(options).then(fileUri => {
            paramSet.pickleDir = fileUri[0].path;
            console.log("选择pickle文件目录为", paramSet.pickleDir);
            // 将选择的目录返回给webview
            global.panel.webview.postMessage({ selectedPickleDir: fileUri[0].path });
        });
    },

    doPickleConvert(global, message) {
        // 执行pickle文件转换的python脚本
        console.log("选择目录为", paramSet.oriImgDir);
        let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "input_out.py");
        let param = paramSet.oriImgDir.substr(1).replace(/\//g, "\\");

        let command_str = "python " + scriptPath + " " + param;
        console.log("执行命令为", command_str);

        global.panel.webview.postMessage({ startPickleConvert: "ok" });

        let convertRet = "";
        exec(command_str, function (err, stdout, stderr) {
            if (err) {
                convertRet = "Convert Failed!"
                console.log(err);
            } else {
                convertRet = "Convert Success!"
            }
            global.panel.webview.postMessage({ doPickleConvertRet: convertRet });
        });
    },

    doStartTask(global, message) {
        // 执行python脚本，并返回执行结果
        console.log("二进制所在目录为", paramSet.oriImgDir);
        let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "mnist_send_input_back.py");
        let param = paramSet.oriImgDir.substr(1).replace(/\//g, "\\");
        let command_str = "python " + scriptPath + " " + param;

        // let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "test.py");
        // let command_str = "python " + scriptPath ;
        console.log("执行命令为", command_str);
        let scriptProcess = exec(command_str,{});

        // 发送启动成功的消息
        global.panel.webview.postMessage({ doStartTaskSuccess: "start task success!" });

        scriptProcess.stdout?.on("data", function(data){
            console.log(data);
            // 发送任务输出的全部结果
            global.panel.webview.postMessage({ doStartTaskRet: data });
        });
        scriptProcess.stderr?.on("data", function(data){
            console.log(data);
            global.panel.webview.postMessage({ doStartTaskFailed: data });
        });
        scriptProcess.on("exit",function(){
            console.log("game over!!");
            global.panel.webview.postMessage({ doStartTaskFinish: "run task success!" });
        });



        // test
        // let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "test.py");
        // let command_str = "python " + scriptPath ;
        // console.log("执行命令为", command_str);
        // let scriptProcess = exec(command_str,{});

        // console.log("game start!!");

        // scriptProcess.stdout?.on("data", function(data){
        //     console.log(data);
        // });
        // scriptProcess.stderr?.on("data", function(data){
        //     console.log(data);
        // });
        // scriptProcess.on("exit",function(){
        //     console.log("game over!!");
        // });

    },

    getTaskDetail(global, message) {
        // 查看任务详情
        PageProvideByPort("任务视图", 5001, "task")
    },

};




