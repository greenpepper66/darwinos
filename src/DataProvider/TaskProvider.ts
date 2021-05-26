import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ImgAppJsonData } from '../DataProvider/ImgAppJsonDataProvider';
const imgAppsConfigFile = "src/static/cache/imgAppsConfig.json";

export class TaskProvider implements vscode.TreeDataProvider<Task> {
	private _onDidChangeTreeData: vscode.EventEmitter<Task | undefined | void> = new vscode.EventEmitter<Task | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Task | undefined | void> = this._onDidChangeTreeData.event;

	public tasks: Task[];

	constructor(private workspaceRoot: string) {
		this.getTasksList();
	}

	refresh(): void {
		console.log("fire!!!", this.tasks);
		this.getTasksList();
		console.log("after!!!", this.tasks);
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Task): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Task): Thenable<Task[]> {
		return Promise.resolve(this.tasks);
	}

	// 原来从web页面获取部署的模型列表作为任务，现在改为应用名字
	// public updateTasks(tasks) {
	// 	this.tasks = [];
	// 	for (var i = 0; i < tasks.length; i++) {
	// 		var name = tasks[i].name;
	// 		var modelID = tasks[i].id;
	// 		var nodeID = tasks[i].nodeID;
	// 		var nodeIP = tasks[i].nodeIP;

	// 		var task = new Task(
	// 			name,
	// 			vscode.TreeItemCollapsibleState.None,
	// 			0,
	// 			modelID,
	// 			nodeID,
	// 			nodeIP,
	// 			{
	// 				command: 'extension.openHttpPage',
	// 				title: '',
	// 				arguments: ["任务" + name + "详情",
	// 					5001,
	// 				"taskDetail?nodeID=" + nodeID + "&modelID=" + modelID]
	// 			}
	// 		);
	// 		this.tasks.push(task);
	// 	}
	// }

	public getTasksList() {
		this.tasks = [];
		console.log("task list searching ...", __filename);
		let resourcePath = path.join(__filename, "..", "..", "..", imgAppsConfigFile);
		let data = fs.readFileSync(resourcePath, 'utf-8');
		let stringContent = data.toString();//将二进制的数据转换为字符串
		let jsonContent: ImgAppJsonData = JSON.parse(stringContent);//将字符串转换为json对象

		for (var i = 0; i < jsonContent.data.length; i++) {
			if (jsonContent.data[i].status == 1) {  // 状态为1的表示一条任务
				var taskID = jsonContent.data[i].id;
				var name = jsonContent.data[i].name;
				var modelID = jsonContent.data[i].modeFileID;
				var nodeID = jsonContent.data[i].modelFileNodeID;
				var nodeIP = jsonContent.data[i].modelFileNodeIP;

				var task = new Task(
					name,
					vscode.TreeItemCollapsibleState.None,
					taskID,
					modelID,
					nodeID,
					nodeIP,
					{
						command: 'extension.gotoImgAppTaskPage',
						title: '',
						arguments: [name, taskID, "图像识别"]
					}
				);
				this.tasks.push(task);
			}
		}
	}
}

export class Task extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,

		public readonly taskId?: number,
		public readonly modelId?: number,
		public readonly nodeId?: number,
		public readonly nodeIp?: string,

		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}`;
		// this.description = this.label;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', '..', 'media', 'light', '文件.png'),
		dark: path.join(__filename, '..', '..', 'media', 'dark', 'document.svg')
	};

	contextValue = 'Task';
}


