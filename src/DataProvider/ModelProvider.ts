import * as vscode from 'vscode';
import * as path from 'path';
import { allData } from '../os/server';


export class ModelProvider implements vscode.TreeDataProvider<Model> {
	private _onDidChangeTreeData: vscode.EventEmitter<Model | undefined | void> = new vscode.EventEmitter<Model | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Model | undefined | void> = this._onDidChangeTreeData.event;

	public models: Model[];

	constructor(private workspaceRoot: string) {
		this.models = [];
	}

	refresh(): void {
		this.updateModels(allData.modelFileList);
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Model): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Model): Thenable<Model[]> {
		return Promise.resolve(this.models);

	}

	public updateModels(models) {
		if (models == undefined) {
			return;
		}
		this.models = [];
		for (var i = 0; i < models.length; i++) {
			var name = models[i].name;
			var modelID = models[i].id;
			var nodeID = models[i].nodeID;
			var nodeIP = models[i].nodeIP;

			var model = new Model(
				name,
				vscode.TreeItemCollapsibleState.None,
				modelID,
				nodeID,
				nodeIP
			)
			this.models.push(model);
		}
		console.log("更新模型", this.models.length);
	}
}

export class Model extends vscode.TreeItem {

	constructor(
		public readonly label: string,     //label和modelName一样
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,

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
		dark: path.join(__filename, '..', '..', '..', 'media', 'dark', 'string.svg')
	};

	contextValue = 'Model';
}


