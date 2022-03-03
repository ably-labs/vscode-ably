import * as vscode from 'vscode';
import * as path from 'path';
import axios, { Axios } from 'axios';

export class AblyAppProvider implements vscode.TreeDataProvider<AblyItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AblyItem | undefined | void> = new vscode.EventEmitter<AblyItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<AblyItem | undefined | void> = this._onDidChangeTreeData.event;

    accountId: string;
    authKey: string;

    ax: Axios;

	constructor(private config: vscode.WorkspaceConfiguration) {
        this.accountId = this.config.get("accountId") as string;
        this.authKey = this.config.get("controlApiKey") as string;

        this.ax = axios.create({
            baseURL: "https://control.ably.net/v1/",
            headers: {
                authorization: `Bearer ${this.authKey}`
            }
        });

	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AblyItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: AblyItem): Promise<AblyItem[]> {
        // Can't show anything here if the auth key/account ID aren't set
        if(!this.accountId || !this.authKey){
            vscode.window.showErrorMessage("Please set your Ably Account ID and Control API Key before using this.");
            return [];
        }


        // No element gets the parent
        if(!element){
            const {data: apps} = await this.ax.get(`accounts/${this.accountId}/apps`);
            const sortedApps = apps.sort((a: any, b: any) => a.name.localeCompare(b.name));
            return sortedApps.map((app: any)=>new AblyItem(app.name, app.id, "app", vscode.TreeItemCollapsibleState.Collapsed));
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
            const {data: keys} = await this.ax.get(`apps/${element.internalId}/keys`);
            const sortedKeys = keys.sort((a: any, b: any) => a.name.localeCompare(b.name));
            return sortedKeys.map((key: any)=>new AblyItem(key.name, key.id, "key", vscode.TreeItemCollapsibleState.Collapsed, key));
        }

        if(element.type === "queueList"){
            const {data: queues} = await this.ax.get(`apps/${element.internalId}/queues`);
            const sortedQueues = queues.sort((a: any, b: any) => a.name.localeCompare(b.name));
            return sortedQueues.map((queue: any)=>new AblyItem(queue.name, queue.id, "queue", vscode.TreeItemCollapsibleState.None, queue));
        }

        if(element.type === "ruleList"){
            const {data: rules} = await this.ax.get(`apps/${element.internalId}/rules`);
            const sortedRules = rules.sort((a: any, b: any) => a.source.channelFilter.localeCompare(b.source.channelFilter));
            return sortedRules.map((rule: any)=>new AblyItem(`${rule.source.channelFilter}`, rule.id, "rule", vscode.TreeItemCollapsibleState.None, rule));
        }

        if(element.type === "namespaceList"){
            const {data: namespaces} = await this.ax.get(`apps/${element.internalId}/namespaces`);
            const sortedNameSpaces = namespaces.sort((a: any, b: any) => a.id.localeCompare(b.id));
            return sortedNameSpaces.map((namespace: any)=>new AblyItem(namespace.id, namespace.id, "namespace", vscode.TreeItemCollapsibleState.None, namespace));
        }
        
        if(element.type === "key"){
            return Object.keys(element.data.capability).map((channel: string)=>new AblyItem(channel, channel, "keyCapChannel", vscode.TreeItemCollapsibleState.Collapsed, element.data.capability[channel], "capability"))
        }

        if(element.type === "keyCapChannel"){
            return element.data.map((capability: string)=>new AblyItem(capability, capability, "keyCapability", vscode.TreeItemCollapsibleState.None, null, "key"));
        }

        return [];
	}

    // Handles the copy event for all copy to clipboard functions
    async handleCopy(item: AblyItem){
        let data;
        let success = false;
        switch(item.contextValue){
            case "key":
                data = item.data.key;
                success = true;
                break;
            default:
                data = `Clipboard command implemented incorrectly for ${item.contextValue}`;
                break;
        }
        if (success) {
            vscode.env.clipboard.writeText(data);
            vscode.window.showInformationMessage(`${item.label} ${item.contextValue} copied to clipboard.`);
        }
    }


    // Handles the key revocation command
    async handleRevokeKey(keyItem: AblyItem){
        const answer = await vscode.window.showInformationMessage(`Are you sure you want to revoke the key '${keyItem.label}'?`, "Yes", "No");
        if(answer !== "Yes"){
            return;
        }

        let result = await this.ax.post(`/apps/${keyItem.data.appId}/${keyItem.data.id}/revoke`);
        vscode.window.showInformationMessage("Key was successfully revoked");
        
        
    }

}


type AblyItemType = "app" | "key" | "queue" | "rule" | "namespace" | "keyList" | "queueList" | "ruleList" | "namespaceList" | "keyCapChannel" | "keyCapability";


export class AblyItem extends vscode.TreeItem {

    childCache: AblyItem[] = [];

    constructor(
		public readonly label: string,
		public readonly internalId: string,
        public readonly type: AblyItemType,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly data?: any,
        public readonly icon: string = type
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