"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = exports.ModelProvider = void 0;
const vscode = require("vscode");
const path = require("path");
class ModelProvider {
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
        return Promise.resolve(this.models);
    }
    updateModels(models) {
        console.log("updateModels!!");
        this.models = [];
        for (var i = 0; i < models.length; i++) {
            var name = models[i].name;
            var modelID = models[i].id;
            var nodeID = models[i].nodeID;
            var nodeIP = models[i].nodeIP;
            var model = new Model(name, vscode.TreeItemCollapsibleState.None, modelID, nodeID, nodeIP);
            this.models.push(model);
        }
    }
}
exports.ModelProvider = ModelProvider;
class Model extends vscode.TreeItem {
    constructor(label, //label和modelName一样
    collapsibleState, modelId, nodeId, nodeIp, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.modelId = modelId;
        this.nodeId = nodeId;
        this.nodeIp = nodeIp;
        this.command = command;
        this.iconPath = {
            light: path.join(__filename, '..', '..', '..', 'media', 'light', 'string.svg'),
            dark: path.join(__filename, '..', '..', '..', 'media', 'dark', 'string.svg')
        };
        this.contextValue = 'Model';
        this.tooltip = `${this.label}`;
        // this.description = this.label;
    }
}
exports.Model = Model;
//# sourceMappingURL=ModelProvider.js.map