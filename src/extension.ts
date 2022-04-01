// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AblyAppProvider } from './appExplorer';
import { createAblyApp } from './command/CreateApp';
import { AblyControlApi } from './AblyControlApi';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// TODO: check config properties and throw an error if they're not yet set
	const config = vscode.workspace.getConfiguration("ably");

	const ablyControlApi = new AblyControlApi(config);
	const ablyAppProvider = new AblyAppProvider(config, ablyControlApi);
	vscode.window.registerTreeDataProvider('ablyAppExplorer', ablyAppProvider);
	vscode.commands.registerCommand("ably.copyToClipboard", ablyAppProvider.handleCopy);
	vscode.commands.registerCommand("ably.refresh", ablyAppProvider.refresh);
	vscode.commands.registerCommand("ably.revokeKey", ablyAppProvider.handleRevokeKey);

  
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('ably.createApp', () => {
		const options: { [key: string]: (context: vscode.ExtensionContext, controlApi: AblyControlApi) => Promise<void> } = {
			createAblyApp
		};
		const quickPick = vscode.window.createQuickPick();
		quickPick.items = Object.keys(options).map(label => ({ label }));
		quickPick.onDidChangeSelection(selection => {
			if (selection[0]) {
				options[selection[0].label](context, ablyControlApi)
					.catch(console.error);
			}
		});
		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
	});

	context.subscriptions.push(disposable);

}

// this method is called when your extension is deactivated
export function deactivate() {}
