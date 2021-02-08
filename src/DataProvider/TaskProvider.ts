import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import  get_slave_boards  from "../os/get_slave_boards";

export class TaskProvider implements vscode.TreeDataProvider<Task> {
    private _onDidChangeTreeData: vscode.EventEmitter<Task | undefined | void> = new vscode.EventEmitter<Task | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Task | undefined | void> = this._onDidChangeTreeData.event;

	private tasks:Task[];

	constructor(private workspaceRoot: string) {
	}

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Task): vscode.TreeItem {
		return element;
	  }
	
	  getChildren(element?: Task): Thenable<Task[]> {
		
		return Promise.resolve(this.tasks);
	  }
	

	
	
	public updateTasks(tasks){
		this.tasks=[];
		for (var i = 0; i < tasks.length; i++){
			var name=tasks[i].name;
			var modelID=tasks[i].id;
			var nodeID=tasks[i].nodeID;
			var nodeIP=tasks[i].nodeIP;

			var task=new Task(
				name,
				vscode.TreeItemCollapsibleState.None,
				modelID,
				nodeID,
				nodeIP,
				{
					command: 'extension.openPage',
					title: '',
					arguments: ["任务"+name+"详情",
					5001,
					"taskDetail?nodeID="+nodeID+"&modelID="+modelID]
				}
			);
			this.tasks.push(task);
		}
	}
}



export class Task extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,

		public readonly modelId?:number,
		public readonly nodeId?:number,
		public readonly nodeIp?:string,

		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}`;
		this.description = this.label;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'media', 'light', 'document.svg'),
		dark: path.join(__filename, '..', '..', 'media', 'dark', 'document.svg')
	};

	contextValue = 'Task';
}


