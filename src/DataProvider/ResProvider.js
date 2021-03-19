"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chip = exports.Node = exports.ResProvider = void 0;
const vscode = require("vscode");
const path = require("path");
class ResProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.nodes = [];
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve(this.getChips(element));
        }
        else {
            return Promise.resolve(this.nodes);
        }
    }
    //暂时用于打开vscode时跳出导航栏  
    getParent(element) {
        return undefined;
    }
    getChips(node) {
        var _chip_list = node.chips;
        var chip_list = [];
        for (let i = 0; i < _chip_list.length; i++) {
            chip_list.push(new Chip("芯片" + i, vscode.TreeItemCollapsibleState.None, node.nodeID, i, node.usedNeureNums[i], {
                command: 'extension.openPage',
                title: '',
                arguments: ["节点" + node.nodeID + "芯片" + i + "详情",
                    5001,
                    "chip?nodeID=" + node.nodeID + "&chipID=" + i]
            }));
        }
        return chip_list;
    }
    updateNodes(nodes) {
        this.nodes = [];
        for (var i = 0; i < nodes.length; i++) {
            var id = nodes[i].id;
            var ip = nodes[i].ip;
            var role = nodes[i].role;
            var chips = nodes[i].chips;
            var usedNeureNums = nodes[i].usedNeureNums;
            var node = new Node("节点" + id, vscode.TreeItemCollapsibleState.Collapsed, role, id, ip, chips, usedNeureNums, {
                command: 'extension.openPage',
                title: '',
                arguments: ["节点" + id + "详情",
                    5001,
                    "node?nodeID=" + id]
            });
            this.nodes.push(node);
        }
    }
}
exports.ResProvider = ResProvider;
class Node extends vscode.TreeItem {
    constructor(label, collapsibleState, nodeRole, //节点角色，1-master, 2-shadow,3-slave
    nodeID, nodeIP, chips, usedNeureNums, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.nodeRole = nodeRole;
        this.nodeID = nodeID;
        this.nodeIP = nodeIP;
        this.chips = chips;
        this.usedNeureNums = usedNeureNums;
        this.command = command;
        this.iconPath = {
            light: path.join(__filename, '..', '..', '..', 'media', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', '..', 'media', 'dark', 'dependency.svg')
        };
        this.contextValue = 'Node';
        this.tooltip = `${this.label}`;
        this.description = this.nodeRole === 1 ? "master" : (this.nodeRole === 2 ? "shadow" : "slave");
    }
}
exports.Node = Node;
class Chip extends vscode.TreeItem {
    constructor(label, collapsibleState, nodeID, chipID, usedNeureNum, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.nodeID = nodeID;
        this.chipID = chipID;
        this.usedNeureNum = usedNeureNum;
        this.command = command;
        this.iconPath = {
            light: path.join(__filename, '..', '..', '..', 'media', 'light', 'chip.svg'),
            dark: path.join(__filename, '..', '..', '..', 'media', 'dark', 'chip.svg')
        };
        this.contextValue = 'Chip';
        this.tooltip = `${this.label}`;
        // this.description = (usedNeureNum / (24 * 24) * 100).toFixed(2)+"%";
    }
}
exports.Chip = Chip;
//# sourceMappingURL=ResProvider.js.map