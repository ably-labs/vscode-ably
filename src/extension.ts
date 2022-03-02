// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AblyAppProvider } from './appExplorer';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// TODO: check config properties and throw an error if they're not yet set
	const config = vscode.workspace.getConfiguration("ably");

	const ablyAppProvider = new AblyAppProvider(config);
	vscode.window.registerTreeDataProvider('ablyAppExplorer', ablyAppProvider);
	vscode.commands.registerCommand("ably.copyToClipboard", ablyAppProvider.handleCopy);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-ably" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
