"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = exports.TaskProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const imgAppsConfigFile = "src/static/cache/imgAppsConfig.json";
class TaskProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        console.log("fire!!!");
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return Promise.resolve(this.tasks);
    }
    // 原来从web页面获取部署的模型列表作为任务，改为应用名字
    updateTasks(tasks) {
        this.tasks = [];
        for (var i = 0; i < tasks.length; i++) {
            var name = tasks[i].name;
            var modelID = tasks[i].id;
            var nodeID = tasks[i].nodeID;
            var nodeIP = tasks[i].nodeIP;
            var task = new Task(name, vscode.TreeItemCollapsibleState.None, 0, modelID, nodeID, nodeIP, {
                command: 'extension.openPage',
                title: '',
                arguments: ["任务" + name + "详情",
                    5001,
                    "taskDetail?nodeID=" + nodeID + "&modelID=" + modelID]
            });
            this.tasks.push(task);
        }
    }
    getTaskList(context) {
        this.tasks = [];
        console.log("task list searching ...");
        let resourcePath = path.join(context.extensionPath, imgAppsConfigFile);
        let data = fs.readFileSync(resourcePath, 'utf-8');
        let stringContent = data.toString(); //将二进制的数据转换为字符串
        let jsonContent = JSON.parse(stringContent); //将字符串转换为json对象
        for (var i = 0; i < jsonContent.data.length; i++) {
            var taskID = jsonContent.data[i].id;
            var name = jsonContent.data[i].name;
            var modelID = jsonContent.data[i].modeFileID;
            var nodeID = jsonContent.data[i].modelFileNodeID;
            var nodeIP = jsonContent.data[i].modelFileNodeIP;
            var task = new Task(name, vscode.TreeItemCollapsibleState.None, taskID, modelID, nodeID, nodeIP, {
                command: 'extension.gotoImgAppTaskPage',
                title: '',
                arguments: [name, taskID, "图像识别"]
            });
            this.tasks.push(task);
        }
    }
}
exports.TaskProvider = TaskProvider;
class Task extends vscode.TreeItem {
    constructor(label, collapsibleState, taskId, modelId, nodeId, nodeIp, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.taskId = taskId;
        this.modelId = modelId;
        this.nodeId = nodeId;
        this.nodeIp = nodeIp;
        this.command = command;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'media', 'light', 'document.svg'),
            dark: path.join(__filename, '..', '..', 'media', 'dark', 'document.svg')
        };
        this.contextValue = 'Task';
        this.tooltip = `${this.label}`;
        // this.description = this.label;
    }
}
exports.Task = Task;
//# sourceMappingURL=TaskProvider.js.map