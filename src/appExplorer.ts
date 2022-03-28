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
            return sortedApps.map((app: any) => new AblyItem(app.name, app.id, `App ID: ${app.id} | status: ${app.status}`, "app", vscode.TreeItemCollapsibleState.Collapsed, app, this.getStatusIcon(app.status)));
        }

        if(element.type === "app") {
            return Promise.resolve([
                new AblyItem(`Status: ${element.data.status}`, element.internalId, element.data.status, "singleItem", vscode.TreeItemCollapsibleState.None, null, this.getStatusIcon(element.data.status)),
                new AblyItem(`TLS only: ${element.data.tlsOnly}`, element.internalId, element.data.tlsOnly, "singleItem", vscode.TreeItemCollapsibleState.None, null, "lock"),
                new AblyItem("API Keys", element.internalId, "keys" , "keyList", vscode.TreeItemCollapsibleState.Collapsed, undefined, "key"),
                new AblyItem("Queues", element.internalId, "queues", "queueList", vscode.TreeItemCollapsibleState.Collapsed, undefined, "queue"),
                new AblyItem("Rules", element.internalId, "rules", "ruleList", vscode.TreeItemCollapsibleState.Collapsed, undefined, "rule"),
                new AblyItem("Namespaces", element.internalId, "namespaces", "namespaceList", vscode.TreeItemCollapsibleState.Collapsed, undefined, "namespace"),
            ]);
        }

        if(element.type === "keyList"){
            const {data: keys} = await this.ax.get(`apps/${element.internalId}/keys`);
            const sortedKeys = keys.sort((a: any, b: any) => a.name.localeCompare(b.name));
            return sortedKeys.map((key: any) => new AblyItem(key.name, key.id, `Key: ${key.key}`, "key", vscode.TreeItemCollapsibleState.Collapsed, key));
        }

        if(element.type === "queueList"){
            const {data: queues} = await this.ax.get(`apps/${element.internalId}/queues`);
            const sortedQueues = queues.sort((a: any, b: any) => a.name.localeCompare(b.name));
            return sortedQueues.map((queue: any) => new AblyItem(queue.name, queue.id, queue.name, "queue", vscode.TreeItemCollapsibleState.None, queue));
        }

        if(element.type === "ruleList"){
            const {data: rules} = await this.ax.get(`apps/${element.internalId}/rules`);
            const sortedRules = rules.sort((a: any, b: any) => a.source.channelFilter.localeCompare(b.source.channelFilter));
            return sortedRules.map((rule: any) => new AblyItem(`${rule.source.channelFilter}`, rule.id, rule.source.channelFilter, "rule", vscode.TreeItemCollapsibleState.None, rule));
        }

        if(element.type === "namespaceList"){
            const {data: namespaces} = await this.ax.get(`apps/${element.internalId}/namespaces`);
            const sortedNameSpaces = namespaces.sort((a: any, b: any) => a.id.localeCompare(b.id));
            return sortedNameSpaces.map((namespace: any) => new AblyItem(namespace.id, namespace.id, namespace.id, "namespace", vscode.TreeItemCollapsibleState.None, namespace));
        }
        
        if(element.type === "key"){
            const dateCreated = new Date(element.data.created).toUTCString();
            const createdItem = new AblyItem(`Created: ${dateCreated} ` , dateCreated, dateCreated, "singleItem", vscode.TreeItemCollapsibleState.None, null, "calendar");
            const dateModified = new Date(element.data.modified).toUTCString();
            const modifiedItem = new AblyItem(`Modified: ${dateModified} ` , dateModified, dateModified, "singleItem", vscode.TreeItemCollapsibleState.None, null, "calendar");
            const resourceRestriction = Object.keys(element.data.capability).map((resource: string) => new AblyItem(`Resource restriction: ${resource}`, resource, resource, "singleItem", vscode.TreeItemCollapsibleState.None, null, "restriction"));
            const capabilities = Object.keys(element.data.capability).map((resource: string) => new AblyItem("Capabilities", "Capabilities", "Capabilities", "keyCapChannel", vscode.TreeItemCollapsibleState.Collapsed, element.data.capability[resource], "checklist"));
            return capabilities.concat(resourceRestriction, createdItem, modifiedItem);
        }

        if(element.type === "keyCapChannel"){
            return element.data.map((capability: string) => new AblyItem(capability, capability, capability, "keyCapability", vscode.TreeItemCollapsibleState.None, null, "check"));
        }

        return [];
	}

    getStatusIcon(status: string): string {
        let icon;
        switch (status.toLowerCase()) {
            case "disabled":
                icon = "blocked";
                break;
            case "deleted":
                icon = "trash";
                break;
            default:
                icon = "run";
                break;
        }

        return icon;
    }

    // Handles the copy event for all copy to clipboard functions
    async handleCopy(item: AblyItem){
        let data;
        switch(item.contextValue){
            case "key":
                data = item.data.key;
                break;
            default:
                console.warn(`Clipboard command implemented incorrectly for ${item.contextValue}`);
                return;
        }
    
        vscode.env.clipboard.writeText(data);
        vscode.window.showInformationMessage(`${item.label} ${item.contextValue} copied to clipboard.`);
        
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


type AblyItemType = "app" | "key" | "queue" | "rule" | "namespace" | "keyList" | "queueList" | "ruleList" | "namespaceList" | "singleItem" | "keyCapChannel" | "keyCapability";


export class AblyItem extends vscode.TreeItem {

    childCache: AblyItem[] = [];

    constructor(
		public readonly label: string,
		public readonly internalId: string,
        public readonly tooltip: string,
        public readonly type: AblyItemType,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly data?: any,
        public readonly icon: string = type
	) {
		super(label, collapsibleState);
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'media', 'icon', 'light', `${this.icon}.svg`),
		dark: path.join(__filename, '..', '..', 'media', 'icon', 'dark', `${this.icon}.svg`)
	};

	contextValue = this.type;
}