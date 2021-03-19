"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
//import * as fs from 'fs';
//import * as http from 'http';
//import * as handler from 'serve-handler';
const ModelProvider_1 = require("./DataProvider/ModelProvider");
const TaskProvider_1 = require("./DataProvider/TaskProvider");
const ResProvider_1 = require("./DataProvider/ResProvider");
const AppsProvider_1 = require("./DataProvider/AppsProvider");
const EmptyDataProvider_1 = require("./DataProvider/EmptyDataProvider");
const PageProvider_1 = require("./PageProvider");
const task_operations_1 = require("./os/task_operations");
const server_1 = require("./os/server");
const AppsHome_1 = require("./pages/AppsHome");
const ImgAppHome_1 = require("./pages/ImgAppHome");
const PORT = 5001;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log('Congratulations, your extension "darwinos" is now active!');
    context.subscriptions.push(vscode.commands.registerCommand('darwinos.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from darwinos!');
    }));
    // 根据vscode主题颜色 修改index.html
    let _vscodeThemeKind = vscode.window.activeColorTheme.kind;
    PageProvider_1.changeIndexHtmlCss(context, _vscodeThemeKind);
    //启动一个terminal，运行网页服务端
    const resourcePath = path.join(context.extensionPath, 'src/resources');
    const terminal1 = vscode.window.createTerminal('webServer');
    terminal1.sendText("cd " + resourcePath);
    terminal1.sendText("serve -s dist -l 5001");
    //打开home页
    PageProvider_1.PageProvideByPort("类脑计算机", 5001, "");
    const ResDataProvider = new ResProvider_1.ResProvider(vscode.workspace.rootPath);
    vscode.window.registerTreeDataProvider('resource_view', ResDataProvider);
    const ModelDataProvider = new ModelProvider_1.ModelProvider(vscode.workspace.rootPath);
    vscode.window.registerTreeDataProvider('model_view', ModelDataProvider);
    const TaskDataProvider = new TaskProvider_1.TaskProvider(vscode.workspace.rootPath);
    vscode.window.registerTreeDataProvider('task_view', TaskDataProvider);
    const AppsDataProvider = new AppsProvider_1.AppsProvider(vscode.workspace.rootPath);
    vscode.window.registerTreeDataProvider('apps_view', AppsDataProvider);
    //上传模型
    vscode.commands.registerCommand('model_view.uploadModel', () => {
        PageProvider_1.PageProvideByPort("上传模型", 5001, "UploadModel");
        vscode.window.showInformationMessage(`Successfully called upload model.`);
    });
    const uploadModelDataProvider = new EmptyDataProvider_1.EmptyDataProvider(vscode.workspace.rootPath);
    vscode.window.registerTreeDataProvider('upload_model_view', uploadModelDataProvider);
    let uploadModelTreeView = vscode.window.createTreeView('upload_model_view', { treeDataProvider: uploadModelDataProvider });
    uploadModelTreeView.onDidChangeVisibility((evt) => {
        if (evt.visible) {
            vscode.commands.executeCommand('model_view.uploadModel');
        }
    });
    // 刷新
    vscode.commands.registerCommand('resource_view.refreshEntry', () => ResDataProvider.refresh());
    vscode.commands.registerCommand('model_view.refreshEntry', () => ModelDataProvider.refresh());
    vscode.commands.registerCommand('apps_view.refreshEntry', () => AppsDataProvider.refresh());
    vscode.commands.registerCommand('task_view.refreshEntry', () => TaskDataProvider.refresh());
    //启动httpserver，接收来自web页面的数据
    server_1.startHttpServer(ResDataProvider, ModelDataProvider, TaskDataProvider, context);
    //自动弹出导航栏
    let ResTreeView = vscode.window.createTreeView('resource_view', { treeDataProvider: ResDataProvider });
    ResTreeView.reveal(ResDataProvider.nodes[0]);
    // 立即显示导航栏
    ResDataProvider.refresh();
    ModelDataProvider.refresh();
    TaskDataProvider.refresh();
    vscode.commands.registerCommand('extension.openPage', (name, port, route) => {
        PageProvider_1.PageProvideByPort(name, port, route);
    });
    // OverView
    vscode.commands.registerCommand('resource_view.resOverview', () => {
        PageProvider_1.PageProvideByPort("资源视图", 5001, "");
    });
    vscode.commands.registerCommand('model_view.modelOverview', () => {
        PageProvider_1.PageProvideByPort("模型视图", 5001, "model");
    });
    vscode.commands.registerCommand('apps_view.appsOverview', () => {
        AppsHome_1.AppsHomePageProvide(context); // overview按钮打开应用视图首页
    });
    vscode.commands.registerCommand('task_view.taskOverview', () => {
        PageProvider_1.PageProvideByPort("任务视图", 5001, "task");
    });
    // 应用视图
    // 应用视图导航栏子选项单击命令
    vscode.commands.registerCommand('extension.gotoAppPage', (name, num) => {
        AppsHome_1.openCertainAppHomePage(context, num);
    });
    // 任务视图导航栏子选项单击命令
    vscode.commands.registerCommand('extension.gotoImgAppTaskPage', (name, id, type) => {
        ImgAppHome_1.openImgAppRunTaskPage(context, id);
    });
    //定时自动刷新导航栏，显示信息
    setTimeout(function refreshEntrys() {
        vscode.commands.executeCommand('resource_view.refreshEntry');
        vscode.commands.executeCommand('model_view.refreshEntry');
        vscode.commands.executeCommand('task_view.refreshEntry');
    }, 500);
    //model view  
    vscode.commands.registerCommand('model_view.deployTask', (model) => {
        task_operations_1.task_deploy(model.nodeIp, model.modelId);
        vscode.window.showInformationMessage(`Successfully called deploy task.`);
        ModelDataProvider.refresh();
    });
    vscode.commands.registerCommand('model_view.deleteTask', (model) => {
        task_operations_1.task_delete(model.nodeIp, model.modelId);
        vscode.window.showInformationMessage(`Successfully called delete task.`);
        ModelDataProvider.refresh();
    });
    //task view
    // 启动任务
    // vscode.commands.registerCommand('task_view.startTask', (task: Task) => {
    // 	task_start(task.nodeIp,task.modelId);		
    // 	vscode.window.showInformationMessage(`Successfully called start task.`);
    // });
    require('./pages/TaskStart')(context); // 
    // require('./DataProvider/welcome')(context); // 欢迎提示
    vscode.commands.registerCommand('task_view.stopTask', (task) => {
        task_operations_1.task_stop(task.nodeIp, task.modelId);
        vscode.window.showInformationMessage(`Successfully called stop task.`);
    });
    vscode.commands.registerCommand('task_view.resetTask', (task) => {
        task_operations_1.task_reset(task.nodeIp, task.modelId);
        vscode.window.showInformationMessage(`Successfully called reset task.`);
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map