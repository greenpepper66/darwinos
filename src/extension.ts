// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
//import * as fs from 'fs';
//import * as http from 'http';
//import * as handler from 'serve-handler';
import { Model, ModelProvider } from "./DataProvider/ModelProvider";
import { Task, TaskProvider } from "./DataProvider/TaskProvider";
import { Node, Chip, ResProvider } from "./DataProvider/ResProvider";
import { PageProvideByPort, PageProvideByPath, changeIndexHtmlCss } from "./PageProvider";
import { task_start, task_stop, task_reset, task_deploy, task_delete } from "./os/task_operations"
import {startHttpServer} from './os/server';
import { getTaskInputHtml } from "./DataProvider/TaskStart"

const PORT = 5001;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "darwinos" is now active!');

	context.subscriptions.push(vscode.commands.registerCommand('darwinos.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from darwinos!');
	})
	);

	// 根据vscode主题颜色 修改index.html
	let _vscodeThemeKind = vscode.window.activeColorTheme.kind;
	changeIndexHtmlCss(context, _vscodeThemeKind);


	//启动一个terminal，运行网页服务端
	const resourcePath = path.join(context.extensionPath, 'src/resources');
	const terminal1 = vscode.window.createTerminal('webServer')
	terminal1.sendText("cd " + resourcePath);
	terminal1.sendText("serve -s dist -l 5001");

	//打开home页
	PageProvideByPort("类脑计算机", 5001, "")


	//PageProvideByPath(context,"asd","src/resources/dist/index.html");




	const ResDataProvider = new ResProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('resource_view', ResDataProvider);

	const ModelDataProvider = new ModelProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('model_view', ModelDataProvider);

	const TaskDataProvider = new TaskProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('task_view', TaskDataProvider);


	//启动httpserver，接收来自web页面的数据
	startHttpServer(ResDataProvider,ModelDataProvider,TaskDataProvider);

	//resource view
	vscode.commands.registerCommand('resource_view.refreshEntry', () => ResDataProvider.refresh());

	vscode.commands.registerCommand('resource_view.resOverview', () => {
		PageProvideByPort("资源视图", 5001, "")
	});



	//model view  
	vscode.commands.registerCommand('model_view.refreshEntry', () => ModelDataProvider.refresh());

	vscode.commands.registerCommand('model_view.modelOverview', () => {
		PageProvideByPort("模型视图", 5001, "model")
	});

	vscode.commands.registerCommand('model_view.deployTask', (model: Model) => {
		task_deploy(model.nodeIp, model.modelId);
		vscode.window.showInformationMessage(`Successfully called deploy task.`);
		ModelDataProvider.refresh();
	});

	vscode.commands.registerCommand('model_view.deleteTask', (model: Model) => {
		task_delete(model.nodeIp, model.modelId);
		vscode.window.showInformationMessage(`Successfully called delete task.`);
		ModelDataProvider.refresh();
	});

	vscode.commands.registerCommand('model_view.uploadModel', () => {
		PageProvideByPort("模型视图", 5001, "UploadModel");
		vscode.window.showInformationMessage(`Successfully called upload model.`);
	});



	//task view
	vscode.commands.registerCommand('task_view.refreshEntry', () => TaskDataProvider.refresh());

	vscode.commands.registerCommand('task_view.taskOverview', () => {
		PageProvideByPort("任务视图", 5001, "task")
	});

	// 启动任务
	// vscode.commands.registerCommand('task_view.startTask', (task: Task) => {
	// 	task_start(task.nodeIp,task.modelId);		
	// 	vscode.window.showInformationMessage(`Successfully called start task.`);
	// });

	require('./DataProvider/TaskStart')(context); // 
	// require('./DataProvider/welcome')(context); // 欢迎提示


	vscode.commands.registerCommand('task_view.stopTask', (task: Task) => {
		task_stop(task.nodeIp, task.modelId);
		vscode.window.showInformationMessage(`Successfully called stop task.`);
	});

	vscode.commands.registerCommand('task_view.resetTask', (task: Task) => {
		task_reset(task.nodeIp, task.modelId);
		vscode.window.showInformationMessage(`Successfully called reset task.`);
	});


	vscode.commands.registerCommand('extension.openPage', (name, port, route) => {
		PageProvideByPort(name, port, route)
	});

}

// this method is called when your extension is deactivated
export function deactivate() { }



