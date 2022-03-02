import * as vscode from 'vscode';
import * as path from 'path';
import axios from 'axios';

export class AblyAppProvider implements vscode.TreeDataProvider<AblyItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AblyItem | undefined | void> = new vscode.EventEmitter<AblyItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<AblyItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private config: vscode.WorkspaceConfiguration) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AblyItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: AblyItem): Promise<AblyItem[]> {

        const accountId = this.config.get("accountId") as string;
        const authKey = this.config.get("controlApiKey") as string;

        // Can't show anything here if the auth key/account ID aren't set
        if(!accountId || !authKey){
            return [];
        }

        const ax = axios.create({
            baseURL: "https://control.ably.net/v1/",
            headers: {
                authorization: `Bearer ${authKey}`
            }
        });

        // No element gets the parent
        if(!element){
            const {data: apps} = await ax.get(`accounts/${accountId}/apps`);
            return apps.map((app: any)=>new AblyItem(app.name, app.id, "app", vscode.TreeItemCollapsibleState.Collapsed));
        }

        if(element.type === "app") {
            return Promise.resolve([
                new AblyItem("keys", element.internalId, "keyList", vscode.TreeItemCollapsibleState.Collapsed, undefined, "key"),
                new AblyItem("queues", element.internalId, "queueList", vscode.TreeItemCollapsibleState.Collapsed, undefined, "queue"),
                new AblyItem("rules", element.internalId, "ruleList", vscode.TreeItemCollapsibleState.Collapsed, undefined, "rule"),
                new AblyItem("namespaces", element.internalId, "namespaceList", vscode.TreeItemCollapsibleState.Collapsed, undefined, "namespace"),
            ]);
        }

        if(element.type === "keyList"){
            const {data: keys} = await ax.get(`apps/${element.internalId}/keys`);
            return keys.map((key: any)=>new AblyItem(key.name, key.id, "key", vscode.TreeItemCollapsibleState.None, key));
        }

        if(element.type === "queueList"){
            const {data: queues} = await ax.get(`apps/${element.internalId}/queues`);
            return queues.map((queue: any)=>new AblyItem(queue.name, queue.id, "queue", vscode.TreeItemCollapsibleState.None, queue));
        }

        if(element.type === "ruleList"){
            const {data: rules} = await ax.get(`apps/${element.internalId}/rules`);
            return rules.map((rule: any)=>new AblyItem(`${rule.source.channelFilter}`, rule.id, "rule", vscode.TreeItemCollapsibleState.None, rule));
        }

        if(element.type === "namespaceList"){
            const {data: namespaces} = await ax.get(`apps/${element.internalId}/namespaces`);
            return namespaces.map((namespace: any)=>new AblyItem(namespace.id, namespace.id, "namespace", vscode.TreeItemCollapsibleState.None, namespace));
        }

        return [];
	}

    async handleCopy(app: AblyItem){
        console.log("copy to clipboard", app.data.key);
        if(app.data.key){
            vscode.env.clipboard.writeText(app.data.key);
        }else{
            console.log("AblyItem has no clipboard context", app.label);
        }
    }

}


type AblyItemType = "app" | "key" | "queue" | "rule" | "namespace" | "keyList" | "queueList" | "ruleList" | "namespaceList";


export class AblyItem extends vscode.TreeItem {

    childCache: AblyItem[] = [];

    constructor(
		public readonly label: string,
		public readonly internalId: string,
        public readonly type: AblyItemType,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly data?: any,
        public readonly icon = type
	) {
		super(label, collapsibleState);
		this.tooltip = this.label;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'media', 'icon', 'light', `${this.icon}.svg`),
		dark: path.join(__filename, '..', '..', 'media', 'icon', 'dark', `${this.icon}.svg`)
	};

	contextValue = this.type;
}