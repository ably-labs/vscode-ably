import axios, { Axios } from 'axios';
import * as vscode from 'vscode';

export type CreateAppContext = {
    appName: string;
    appState: string;
    tlsOnly: boolean;
    apnsUseSandboxEndpoint: boolean;
};

export class AblyControlApi {

    accountId: string;
    authKey: string;
    ax: Axios;
    version: string;

    constructor(private config: vscode.WorkspaceConfiguration, version: string) {
        this.accountId = this.config.get("accountId") as string;
        this.authKey = this.config.get("controlApiKey") as string;
        this.version = version;

        this.ax = axios.create({
            baseURL: "https://control.ably.net/v1/",
            headers: {
                'authorization': `Bearer ${this.authKey}`,
                'Ably-Agent': `ably-vscode/${this.version}`
            }
        });
    }

    async createApp(context: CreateAppContext): Promise<any> {
        return await this.ax.post(`accounts/${this.accountId}/apps`, {
            name: context.appName,
            status: context.appState,
            tlsOnly: context.tlsOnly,
            apnsUseSandboxEndpoint: context.apnsUseSandboxEndpoint
        });
    }

    async getApps(): Promise<any> {
        return (await this.ax.get(`accounts/${this.accountId}/apps`)).data;
    }

    async getKeys(appId: string): Promise<any> {
        return (await this.ax.get(`apps/${appId}/keys`)).data;
    }

    async getQueues(appId: string): Promise<any> {
        return (await this.ax.get(`apps/${appId}/queues`)).data;
    }

    async getRules(appId: string): Promise<any> {
        return (await this.ax.get(`apps/${appId}/rules`)).data;
    }

    async revokeKey(appId: string, keyId: string): Promise<any> {
        return await this.ax.post(`/apps/${appId}/${keyId}/revoke`);
    }
}