import * as vscode from 'vscode';
import { AblyItem } from './AblyItem';
import { AblyControlApi } from './AblyControlApi';

export class AblyAppProvider implements vscode.TreeDataProvider<AblyItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<AblyItem | undefined | void> = new vscode.EventEmitter<AblyItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<AblyItem | undefined | void> = this._onDidChangeTreeData.event;

    accountId: string;
    authKey: string;
    controlApi: AblyControlApi;

	constructor(private config: vscode.WorkspaceConfiguration, controlApi: AblyControlApi) {
        this.accountId = this.config.get("accountId") as string;
        this.authKey = this.config.get("controlApiKey") as string;
        this.controlApi = controlApi;
	}

	refresh(): void {
		this. _onDidChangeTreeData.fire();
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
            const apps = await this.controlApi.getApps();
            const sortedApps = apps.sort((a: any, b: any) => a.name.localeCompare(b.name));
            return sortedApps.map((app: any) => new AblyItem(app.name, app.id, `App ID: ${app.id} | status: ${app.status}`, "app", vscode.TreeItemCollapsibleState.Collapsed, app, this.getStatusIcon(app.status)));
        }

        if(element.type === "app") {
            return Promise.resolve([
                new AblyItem(`Status: ${element.data.status}`, element.internalId, element.data.status, "singleItem", vscode.TreeItemCollapsibleState.None, undefined, this.getStatusIcon(element.data.status)),
                new AblyItem(`TLS only: ${element.data.tlsOnly}`, element.internalId, element.data.tlsOnly, "singleItem", vscode.TreeItemCollapsibleState.None, undefined, "shield"),
                new AblyItem("API Keys", element.internalId, "API Keys" , "keyList", vscode.TreeItemCollapsibleState.Collapsed, undefined, "key"),
                new AblyItem("Queues", element.internalId, "Queues", "queueList", vscode.TreeItemCollapsibleState.Collapsed, undefined, "mail"),
                new AblyItem("Integration Rules", element.internalId, "Integration Rules", "ruleList", vscode.TreeItemCollapsibleState.Collapsed, undefined, "symbol-event"),
            ]);
        }

        if(element.type === "keyList"){
            const keys = await this.controlApi.getKeys(element.internalId);
            const sortedKeys = keys.sort((a: any, b: any) => a.name.localeCompare(b.name));
            return sortedKeys.map((key: any) => new AblyItem(key.name, key.id, `Key: ${key.key}`, "key", vscode.TreeItemCollapsibleState.Collapsed, key));
        }

        if(element.type === "queueList"){
            const queues = await this.controlApi.getQueues(element.internalId);
            const sortedQueues = queues.sort((a: any, b: any) => a.name.localeCompare(b.name));
            return sortedQueues.map((queue: any) => new AblyItem(queue.name, queue.id, queue.name, "queue", vscode.TreeItemCollapsibleState.Collapsed, queue, "mail"));
        }

        if(element.type === "queue"){
            const messagesItem = new AblyItem("Messages", element.internalId, "Messages", "messagesList", vscode.TreeItemCollapsibleState.Collapsed, element.data.messages, "mail");
            const statsItem = new AblyItem("Stats", element.internalId, "Stats", "statsList", vscode.TreeItemCollapsibleState.Collapsed, element.data.stats, "pulse");
            const regionItem = new AblyItem(`Region: ${element.data.region}`, element.internalId, element.data.region, "singleItem", vscode.TreeItemCollapsibleState.None, null, "globe");
            const stateItem = new AblyItem(`State: ${element.data.state}`, element.internalId, element.data.state, "singleItem", vscode.TreeItemCollapsibleState.None, null, this.getStatusIcon(element.data.state));
            const ttlItem = new AblyItem(`TTL: ${element.data.ttl}`, element.internalId, element.data.ttl, "singleItem", vscode.TreeItemCollapsibleState.None, null, "watch");
            const maxLengthItem = new AblyItem(`Max length: ${element.data.maxLength}`, element.internalId, element.data.maxLength, "singleItem", vscode.TreeItemCollapsibleState.None, null, "arrow-both");
            return [messagesItem, statsItem, regionItem, stateItem, ttlItem, maxLengthItem];
        }

        if(element.type === "messagesList"){
            const readyItem = new AblyItem(`Ready: ${element.data.ready} `, element.internalId, element.data.ready, "singleItem", vscode.TreeItemCollapsibleState.None, null, "mail");
            const unacknowledgedItem = new AblyItem(`Unacknowledged: ${element.data.unacknowledged} `, element.internalId, element.data.unacknowledged, "singleItem", vscode.TreeItemCollapsibleState.None, null, "mail");
            const totalItem = new AblyItem(`Total: ${element.data.total} `, element.internalId, element.data.total, "singleItem", vscode.TreeItemCollapsibleState.None, null, "mail");
            return [readyItem, unacknowledgedItem, totalItem];
        }

        if(element.type === "statsList"){
            const publishRateItem = new AblyItem(`Publish rate: ${element.data.publishRate ?? '-'} `, element.internalId, element.data.publishRate, "singleItem", vscode.TreeItemCollapsibleState.None, null, "pulse");
            const deliveryRateItem = new AblyItem(`Delivery rate: ${element.data.deliveryRate  ?? '-'} `, element.internalId, element.data.deliveryRate, "singleItem", vscode.TreeItemCollapsibleState.None, null, "pulse");
            const acknowledgementRateItem = new AblyItem(`Acknowledgement rate: ${element.data.acknowledgementRate  ?? '-'} `, element.internalId, element.data.acknowledgementRate, "singleItem", vscode.TreeItemCollapsibleState.None, null, "pulse");
            return [publishRateItem, deliveryRateItem, acknowledgementRateItem];
        }

        if(element.type === "ruleList"){
            const rules = await this.controlApi.getRules(element.internalId);
            const sortedRules = rules.sort((a: any, b: any) => a.ruleType.localeCompare(b.ruleType));
            return sortedRules.map((rule: any) => new AblyItem(`Type: ${rule.ruleType}`, rule.id, `Type: ${rule.ruleType} | ID: ${rule.id}`, "rule", vscode.TreeItemCollapsibleState.Collapsed, rule, "symbol-event"));
        }

        if(element.type === "rule"){
            const stateItem = new AblyItem(`Status: ${element.data.status}`, element.internalId, element.data.state, "singleItem", vscode.TreeItemCollapsibleState.None, null, this.getStatusIcon(element.data.status));
            const versionItem = new AblyItem(`Version: ${element.data.version}`, element.internalId, element.data.version, "singleItem", vscode.TreeItemCollapsibleState.None, null, "dash");
            const requestModeItem = new AblyItem(`Request mode: ${element.data.requestMode}`, element.internalId, element.data.requestMode, "singleItem", vscode.TreeItemCollapsibleState.None, null, "dash");
            const sourceItem = new AblyItem("Source", element.internalId, "Source", "ruleSource", vscode.TreeItemCollapsibleState.Collapsed, element.data.source, "arrow-left");
            const targetItem = new AblyItem("Target", element.internalId, "Target", "ruleTarget", vscode.TreeItemCollapsibleState.Collapsed, element.data.target, "arrow-right");
            const dateCreated = new Date(element.data.created).toUTCString();
            const createdItem = new AblyItem(`Created: ${dateCreated} ` , dateCreated, dateCreated, "singleItem", vscode.TreeItemCollapsibleState.None, null, "calendar");
            const dateModified = new Date(element.data.modified).toUTCString();
            const modifiedItem = new AblyItem(`Modified: ${dateModified} ` , dateModified, dateModified, "singleItem", vscode.TreeItemCollapsibleState.None, null, "calendar");
            return [stateItem, versionItem, requestModeItem, sourceItem, targetItem, createdItem, modifiedItem];
        }

        if(element.type === "ruleSource"){
            const typeItem = new AblyItem(`Type: ${element.data.type}`, element.internalId, element.data.type, "singleItem", vscode.TreeItemCollapsibleState.None, null, "arrow-left");
            const channelFilterItem = new AblyItem(`Channel filter: ${element.data.channelFilter}`, element.internalId, element.data.channelFilter, "singleItem", vscode.TreeItemCollapsibleState.None, null, "arrow-left");
            return [typeItem, channelFilterItem];
        }

        if(element.type === "ruleTarget"){
            const urlItem = new AblyItem(`URL: ${element.data.url ?? "-"}`, element.internalId, element.data.url ?? "-", "singleItem", vscode.TreeItemCollapsibleState.None, null, "arrow-right");
            const formatItem = new AblyItem(`Format: ${element.data.format}`, element.internalId, element.data.format, "singleItem", vscode.TreeItemCollapsibleState.None, null, "arrow-right");
            const envelopedItem = new AblyItem(`Enveloped: ${element.data.enveloped}`, element.internalId, element.data.enveloped, "singleItem", vscode.TreeItemCollapsibleState.None, null, "arrow-right");
            const signingKeyIdItem = new AblyItem(`Signing Key Id: ${element.data.signingKeyId ?? "-"} `, element.internalId, element.data.signingKeyId, "singleItem", vscode.TreeItemCollapsibleState.None, null, "arrow-right");
            let headersItem;
            if (element.data.headers) {
                headersItem = new AblyItem(`Headers: ${element.data.headers.length} `, element.internalId, element.data.headers.length, "headerList", vscode.TreeItemCollapsibleState.Collapsed, element.data.headers, "arrow-right");
            }
            else {
                headersItem = new AblyItem("Headers: 0", element.internalId, "Headers", "singleItem", vscode.TreeItemCollapsibleState.None, null, "arrow-right");
            }
            return [urlItem, formatItem, headersItem, envelopedItem, signingKeyIdItem];
        }

        if(element.type === "headerList"){
            return element.data.map((header: any) => new AblyItem(`${header.name}: ${header.value}`, element.internalId, `${header.name}: ${header.value}`, "singleItem", vscode.TreeItemCollapsibleState.None, null, "arrow-right"));
        }

        if(element.type === "key"){
            const dateCreated = new Date(element.data.created).toUTCString();
            const createdItem = new AblyItem(`Created: ${dateCreated} ` , dateCreated, dateCreated, "singleItem", vscode.TreeItemCollapsibleState.None, null, "calendar");
            const dateModified = new Date(element.data.modified).toUTCString();
            const modifiedItem = new AblyItem(`Modified: ${dateModified} ` , dateModified, dateModified, "singleItem", vscode.TreeItemCollapsibleState.None, null, "calendar");
            const resourceRestriction = Object.keys(element.data.capability).map((resource: string) => new AblyItem(`Resource restriction: ${resource}`, resource, resource, "singleItem", vscode.TreeItemCollapsibleState.None, null, "lock"));
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

        let result = await this.controlApi.revokeKey(keyItem.data.appId, keyItem.data.id);
        vscode.window.showInformationMessage("Key was successfully revoked");
    }
}


export type AblyItemType = "app" | "key" | "queue" | "rule" | "namespace" | "keyList" | "queueList" | "ruleList" | "ruleSource" | "ruleTarget" | "headerList" | "messagesList"| "namespaceList" | "singleItem" | "statsList" | "keyCapChannel" | "keyCapability";