import * as vscode from 'vscode';
import * as path from 'path';
import axios from 'axios';

// TODO: replace with config
const key = "";
const accountId = "";

export class AblyAppProvider implements vscode.TreeDataProvider<AblyApp> {
    private _onDidChangeTreeData: vscode.EventEmitter<AblyApp | undefined | void> = new vscode.EventEmitter<AblyApp | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<AblyApp | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AblyApp): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: AblyApp): Promise<AblyApp[]> {

        // No element gets the parent
        if(!element){
            const {data: apps} = await axios.get(`https://control.ably.net/v1/accounts/${accountId}/apps`, {
                headers: {
                    authorization: "Bearer "+key,
                }
            });
            return apps.map((app: any)=>new AblyApp(app.name, app.id, "app", vscode.TreeItemCollapsibleState.Collapsed));
        }

        if(element.type === "app") {
            return Promise.resolve([
                new AblyApp("keys", element.internalId, "keyList", vscode.TreeItemCollapsibleState.Collapsed),
                new AblyApp("queues", element.internalId, "queueList", vscode.TreeItemCollapsibleState.Collapsed),
                new AblyApp("rules", element.internalId, "ruleList", vscode.TreeItemCollapsibleState.Collapsed),
                new AblyApp("namespace", element.internalId, "namespaceList", vscode.TreeItemCollapsibleState.Collapsed),
            ]);
        }

        if(element.type === "queueList"){
            const {data: queues} = await axios.get(`https://control.ably.net/v1/apps/${element.internalId}/queues`, {headers: {authorization: "Bearer "+key}});
            return queues.map((queue: any)=>new AblyApp(queue.name, queue.id, "queue", vscode.TreeItemCollapsibleState.None));
        }

        if(element.type === "ruleList"){
            const {data: rules} = await axios.get(`https://control.ably.net/v1/apps/${element.internalId}/rules`, {headers: {authorization: "Bearer "+key}});
            return rules.map((rule: any)=>new AblyApp(`${rule.source.channelFilter}`, rule.id, "rule", vscode.TreeItemCollapsibleState.None));
        }

        return [];
	}

}


type AblyAppType = "app" | "key" | "queue" | "rule" | "namespace" | "keyList" | "queueList" | "ruleList" | "namespaceList";


export class AblyApp extends vscode.TreeItem {

    childCache: AblyApp[] = [];

    constructor(
		public readonly label: string,
		public readonly internalId: string,
        public readonly type: AblyAppType,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.tooltip = this.label;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'media', 'icon', `${this.type}.svg`),
		dark: path.join(__filename, '..', '..', 'media', 'icon', `${this.type}.svg`)
	};

	contextValue = 'app';
}