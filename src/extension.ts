import * as vscode from 'vscode';
import { useAsTemplate } from './functions/use-as-template';

/**
 * Extension activated
 *
 * @param ExtensionContract context
 * @return void
 */
export function activate(context: vscode.ExtensionContext) {
	let disposable;

	disposable = vscode.commands.registerCommand('gpt-template.useAsTemplate', async (fileUri) => useAsTemplate(fileUri));
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
