import * as vscode from 'vscode';
import { AnalysisInfo, getAnalysis } from './analysis';

function getRandomId (): number {
  return Math.round(Math.random() * 300 + 10);
}

class VueMethods extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}

export class VueMethodsProvider implements vscode.TreeDataProvider<VueMethods> {
  private analysisInfo: AnalysisInfo = {
    methods: new Set(),
    trigger: new Map()
  };

  constructor(private workspaceRoot?: vscode.WorkspaceFolder) {
    this.analysis();
  }

  /** 获取显示的结点数据 */
  getTreeItem(element: VueMethods): vscode.TreeItem {
    return element;
  }

  /** 获取当前结点的所有子结点 */
  getChildren(element?: VueMethods): Thenable<VueMethods[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }
    const list: VueMethods[] = [];
    if (element) {
      const triggers = this.analysisInfo.trigger.get(element.label);
      if (triggers) {
        triggers.forEach(item => {
          list.push(new VueMethods(item, vscode.TreeItemCollapsibleState.Collapsed));
        });
      }
    } else {
      this.analysisInfo.methods.forEach(item => {
        list.push(new VueMethods(item, vscode.TreeItemCollapsibleState.Collapsed));
      });
    }
    vscode.window.showInformationMessage(list.toString());
    return Promise.resolve(list);
  }

  /** 更新树状结构数据 */
  private _onDidChangeTreeData: vscode.EventEmitter<VueMethods | undefined | void> = new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<VueMethods | undefined | void> = this._onDidChangeTreeData.event;

  private analysis(): void {
    const curEditor = vscode.window.activeTextEditor;
    if (!curEditor) {
      return;
    }
    if (!/\.vue$/.test(curEditor.document.fileName)) { // 非vue文件不分析
      return;
    }

    this.analysisInfo = getAnalysis(curEditor.document.getText());
    vscode.window.showInformationMessage('分析完成！');
  }

  /** 触发更新 */
  refresh(): void {
    this.analysis();
    this._onDidChangeTreeData.fire();
  }
}

