import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import{Chip, Node} from "./ResProvider"
import  get_slave_boards  from "../os/get_slave_boards";


export class ModelProvider implements vscode.TreeDataProvider<Model> {
    private _onDidChangeTreeData: vscode.EventEmitter<Model | undefined | void> = new vscode.EventEmitter<Model | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<Model | undefined | void> = this._onDidChangeTreeData.event;

	private models:Model[];

	constructor(private workspaceRoot: string) {
	}

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: Model): vscode.TreeItem {
		return element;
	  }
	
	getChildren(element?: Model): Thenable<Model[]> {		
		return Promise.resolve(this.models);		
		
	}


	

	public updateModels(models){
		this.models=[];
		for (var i = 0; i < models.length; i++){
			var name=models[i].name;
			var modelID=models[i].id;
			var nodeID=models[i].nodeID;
			var nodeIP=models[i].nodeIP;

			var model=new Model(
				name,
				vscode.TreeItemCollapsibleState.None,
				modelID,
				nodeID,
				nodeIP
			)
			this.models.push(model);
		}
	}
}



export class Model extends vscode.TreeItem {

	constructor(
		public readonly label: string,     //label和modelName一样
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
		light: path.join(__filename, '..', '..',  '..','media', 'light', 'string.svg'),
		dark: path.join(__filename, '..', '..', '..', 'media', 'dark', 'string.svg')
	};

	contextValue = 'Model';
}


