import * as vscode from "vscode";
import { AblyAppProvider } from "./appExplorer";
import { createAblyApp } from "./command/CreateApp";
import { AblyControlApi } from "./AblyControlApi";
import { TelemetryApi, EventName } from "./TelemetryApi";
import { AblyItem } from "./AblyItem";

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("ably");
  const accountId = config.get("accountId") as string;
  const authKey = config.get("controlApiKey") as string;
  const isTelemetryEnabled = config.get("sendTelemetry") as boolean;
  if (!accountId || !authKey) {
    vscode.window.showErrorMessage(
      "Please update the Extensions > Ably settings with your Ably Account ID and Control API access token before using this."
    );
    vscode.commands.executeCommand("workbench.action.openGlobalSettings");
    return;
  }

  const extensionVersion = context.extension.packageJSON.version;
  const telemetryProvider = new TelemetryApi(extensionVersion, accountId, isTelemetryEnabled);
  telemetryProvider.postEvent(EventName.Activated);
  const ablyControlApi = new AblyControlApi(config, extensionVersion);
  const ablyAppProvider = new AblyAppProvider(
    config,
    ablyControlApi,
    telemetryProvider
  );
  vscode.window.registerTreeDataProvider("ablyAppExplorer", ablyAppProvider);
  vscode.commands.registerCommand("ably.copyToClipboard", (item: AblyItem) => {
    ablyAppProvider.handleCopy(item);
  });
  vscode.commands.registerCommand("ably.refresh", () => {
    ablyAppProvider.refresh();
  });
  let disposable = vscode.commands.registerCommand("ably.createApp", () => {
    createAblyApp(context, ablyControlApi, telemetryProvider)
      .catch(console.error)
      .then(() => {
        ablyAppProvider.refresh();
      });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
