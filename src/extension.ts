import * as vscode from 'vscode';
import { AblyAppProvider } from './appExplorer';
import { createAblyApp } from './command/CreateApp';
import { AblyControlApi } from './AblyControlApi';

export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration("ably");
	const extensionVersion = context.extension.packageJSON.version;
	const ablyControlApi = new AblyControlApi(config, extensionVersion);
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
