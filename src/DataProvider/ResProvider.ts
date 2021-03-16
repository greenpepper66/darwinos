import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import get_slave_boards from '../os/get_slave_boards';

import {testquery }from '../testaxios';




export class ResProvider implements vscode.TreeDataProvider<Node> {
    private _onDidChangeTreeData: vscode.EventEmitter<Node | undefined | void> = new vscode.EventEmitter<Node | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<Node | undefined | void> = this._onDidChangeTreeData.event;

  
  public nodes:Node[];

  constructor(private workspaceRoot: string) {
    this.nodes = [];
  }

    refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Node): vscode.TreeItem {
    return element;
    }
  
  getChildren(element?: Node): Thenable<Node[]> {
    if (element){

      return Promise.resolve(this.getChips(element));
      
    }
    else{      
          return Promise.resolve(this.nodes);   
      }
    }
    
  //暂时用于打开vscode时跳出导航栏  
  getParent(element? : Node | undefined): import("vscode").ProviderResult<Node>{       
      return undefined;    
  }
  
    
  
  private getChips(node:Node):Chip[]{
    var _chip_list=node.chips;
    var chip_list=[];
    for (let i=0; i < _chip_list.length; i++){
      chip_list.push(new Chip(
        "芯片"+i,
        vscode.TreeItemCollapsibleState.None,
        node.nodeID,
        i,
        node.usedNeureNums[i],
        {
          command: 'extension.openPage',
          title: '',
          arguments: ["节点"+node.nodeID+"芯片"+i+"详情",
          5001,
          "chip?nodeID="+node.nodeID+"&chipID="+i]
          
        }
      ))
    }
    return chip_list;
  }

  public updateNodes(nodes){
    this.nodes=[];
    for (var i = 0; i < nodes.length; i++){
      var id=nodes[i].id;
      var ip=nodes[i].ip;
      var role=nodes[i].role;
      var chips=nodes[i].chips;
      var usedNeureNums=nodes[i].usedNeureNums;

      var node=new Node(
        "节点"+id,
        vscode.TreeItemCollapsibleState.Collapsed,
        role,
        id,
        ip,
        chips,
        usedNeureNums,
        {
          command: 'extension.openPage',
          title: '',
          arguments: ["节点"+id+"详情",
          5001,
          "node?nodeID="+id]
        }
      );
      
      this.nodes.push(node);
      
    }
  }
}


export class Node extends vscode.TreeItem {

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    

    public readonly nodeRole?:number,  //节点角色，1-master, 2-shadow,3-slave
    public readonly nodeID?: number,
    public readonly nodeIP?: string,
    public readonly chips?: number[],
    public readonly usedNeureNums?: number[],
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.tooltip = `${this.label}`;
    this.description = this.nodeRole===1?"master":(this.nodeRole===2?"shadow":"slave");
  }

  iconPath = {
    light: path.join(__filename, '..', '..', '..','media', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..','..', 'media', 'dark', 'dependency.svg')
  };

  contextValue = 'Node';
}


export class Chip extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    
    public readonly nodeID: number,
    public readonly chipID: number,
    public readonly usedNeureNum: number,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.tooltip = `${this.label}`;
    this.description = (usedNeureNum / (24 * 24) * 100).toFixed(2)+"%";
  }
  iconPath = {
    light: path.join(__filename, '..', '..', '..','media', 'light', 'chip.svg'),
    dark: path.join(__filename, '..', '..','..', 'media', 'dark', 'chip.svg')
  };

  contextValue = 'Chip';
}


