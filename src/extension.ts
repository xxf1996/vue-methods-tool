import * as vscode from 'vscode';
import { VueMethodsProvider } from './data-provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vue-methods-tool" is now active!');
	const provider = new VueMethodsProvider(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined);
	vscode.window.registerTreeDataProvider(
		'vue-methods-tool',
		provider
	);
	vscode.window.showInformationMessage('注册成功！');

	let disposable = vscode.commands.registerCommand('vue-methods-tool.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('吃饭了吗？');
	});
	let refresh = vscode.commands.registerCommand('vue-methods-tool.refresh', () => {
		provider.refresh();
	});
	/** 监听VSCode编辑器当前激活的实例（即编辑的文件变化时） */
	vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (!editor) {
			return;
		}
		provider.refresh();
		// vscode.window.showInformationMessage(`当前窗口：${editor.document.fileName}`);
	});

	context.subscriptions.push(disposable, refresh);
}

// this method is called when your extension is deactivated
export function deactivate() {}
