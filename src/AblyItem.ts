import * as vscode from 'vscode';
import * as path from 'path';
import { AblyItemType } from './appExplorer';

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
