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
	let disposable = vscode.commands.registerCommand('ably.createApp', () => {
		createAblyApp(context, ablyControlApi)
			.catch(console.error);
	});

	context.subscriptions.push(disposable);

}

export function deactivate() {}
