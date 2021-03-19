"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyData = exports.EmptyDataProvider = void 0;
const vscode = require("vscode");
const path = require("path");
class EmptyDataProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return Promise.resolve([]);
    }
}
exports.EmptyDataProvider = EmptyDataProvider;
class EmptyData extends vscode.TreeItem {
    constructor(label, //label和modelName一样
    collapsibleState, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.iconPath = {
            light: path.join(__filename, '..', '..', '..', 'media', 'light', 'string.svg'),
            dark: path.join(__filename, '..', '..', '..', 'media', 'dark', 'string.svg')
        };
        this.contextValue = 'Model';
        this.tooltip = `${this.label}`;
        this.description = this.label;
    }
}
exports.EmptyData = EmptyData;
//# sourceMappingURL=EmptyDataProvider.js.map