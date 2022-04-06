import * as vscode from 'vscode';
import { AblyAppProvider } from './appExplorer';
import { createAblyApp } from './command/CreateApp';
import { AblyControlApi } from './AblyControlApi';
import { TelemetryApi, EventName } from './TelemetryApi';

export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration("ably");
	const extensionVersion = context.extension.packageJSON.version;
	const telemetryProvider = new TelemetryApi(extensionVersion);
	telemetryProvider.postEvent(EventName.Activated);
	const ablyControlApi = new AblyControlApi(config, extensionVersion);
	const ablyAppProvider = new AblyAppProvider(config, ablyControlApi, telemetryProvider);
	vscode.window.registerTreeDataProvider('ablyAppExplorer', ablyAppProvider);
	vscode.commands.registerCommand("ably.copyToClipboard", ablyAppProvider.handleCopy);
	vscode.commands.registerCommand("ably.refresh", () => { ablyAppProvider.refresh(); });
	let disposable = vscode.commands.registerCommand('ably.createApp', () => {
		createAblyApp(context, ablyControlApi, telemetryProvider)
			.catch(console.error)
			.then(() => { ablyAppProvider.refresh(); });
	});

	context.subscriptions.push(disposable);

}

export function deactivate() {}
