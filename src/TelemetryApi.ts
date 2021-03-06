import axios, { Axios } from 'axios';

export enum EventName {
    Activated = "Activated",
    AppExpanded = "AppExpanded",
    KeysExpanded = "KeysExpanded",
    QueuesExpanded = "QueuesExpanded",
    IntegrationRulesExpanded = "IntegrationRulesExpanded",
    KeyCopied = "KeyCopied",
    KeyRevoked = "KeyRevoked",
    AppCreationInvoked = "AppCreationInvoked",
    AppCreationCompleted = "AppCreationCompleted",
    RefreshInvoked = "RefreshInvoked",
}

export class TelemetryApi {

    ax: Axios;
    version: string;
    apiKey: string = 'phc_y5U4cpSh6rv3Fphb6suqOpgHHPr6z2e5xB6l9Lk3jmh'; // This is allowed to be publicly available. Is POST only.
    source: string = 'ably-vscode';
    accountId: string;
    isTelemetryEnabled: boolean;

    constructor(version: string, accountId: string, isTelemetryEnabled: boolean) {
        this.version = version;
        this.accountId = accountId;
        this.isTelemetryEnabled = isTelemetryEnabled;5

        this.ax = axios.create({
            baseURL: "https://app.posthog.com/",
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }

    async postEvent(eventName: EventName): Promise<any> {
      if (this.isTelemetryEnabled) {
        return await this.ax.post("capture/", {
          api_key: this.apiKey,
          event: eventName,
          properties: {
            distinct_id: this.accountId,
            source: this.source,
            version: this.version,
          },
        });
      }
    }
}