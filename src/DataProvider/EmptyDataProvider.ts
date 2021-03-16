import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import{Chip, Node} from "./ResProvider"
import  get_slave_boards  from "../os/get_slave_boards";




export class EmptyDataProvider implements vscode.TreeDataProvider<EmptyData> {
    private _onDidChangeTreeData: vscode.EventEmitter<EmptyData | undefined | void> = new vscode.EventEmitter<EmptyData | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<EmptyData | undefined | void> = this._onDidChangeTreeData.event;

	
	constructor(private workspaceRoot: string) {
	}

    refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: EmptyData): vscode.TreeItem {
		return element;
	  }
	
	getChildren(element?: EmptyData): Thenable<EmptyData[]> {		
		return Promise.resolve([]);		
		
	}

}



export class EmptyData extends vscode.TreeItem {

	constructor(
		public readonly label: string,     //label和modelName一样
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,

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