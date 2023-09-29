import * as vscode from 'vscode';
import { cancelRequest, useAsTemplate } from './functions/use-as-template';

/**
 * @param ExtensionContract context
 * @return void
 */
export function activate(context: vscode.ExtensionContext) {
	let disposable;

	disposable = vscode.commands.registerCommand('gpt-template.useAsTemplate', async (fileUri) => useAsTemplate(fileUri));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('gpt-template.cancelRequest', async () => cancelRequest());
	context.subscriptions.push(disposable);
}

/**
 * @return void
 */
export function deactivate() {}
