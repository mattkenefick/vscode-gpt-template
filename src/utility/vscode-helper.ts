import * as vscode from 'vscode';

let buckOutput = vscode.window.createOutputChannel('buck');

/**
 * @class VsCodeHelper
 */
export default class VsCodeHelper {
	/**
	 * @param string text
	 * @return void
	 */
	public static append(text: string): void {
		const editor = vscode.window.activeTextEditor;
		const document: vscode.TextDocument | undefined = editor?.document;

		// Exit if we don't have the references we need
		if (!editor || !document) {
			console.warn('Exiting because we dont have something');
			return;
		}
		const lastLine = document.lineAt(document.lineCount - 1);

		editor.edit((editBuilder) => {
			editBuilder.insert(lastLine.range.end, text);
		});
	}

	/**
	 * @return void
	 */
	public static clear(): void {
		const editor = vscode.window.activeTextEditor;
		const document: vscode.TextDocument | undefined = editor?.document;

		// Exit if we don't have the references we need
		if (!editor || !document) {
			console.warn('Exiting because we dont have something');
			return;
		}

		// Get the last line of the document
		const lastLine = document.lineAt(document.lineCount - 1);

		// Get the last line text range
		const range = new vscode.Range(lastLine.range.start, lastLine.range.end);

		// Append the text to the document
		editor?.edit((editBuilder) => {
			editBuilder.delete(range);
		});
	}

	/**
	 * @param vscode.Uri fileUri
	 * @return Promise<string>
	 */
	public static async getLanguageFromFile(fileUri: vscode.Uri): Promise<string> {
		const file = await vscode.workspace.openTextDocument(fileUri);
		const language = file.languageId;

		return language;
	}

	/**
	 * @param vscode.Uri fileUri
	 * @return Promise<string>
	 */
	public static async getTextFromFile(fileUri: vscode.Uri): Promise<string> {
		const file = await vscode.workspace.openTextDocument(fileUri);
		const language = file.languageId;
		const fileContent = file.getText();

		return fileContent;
	}

	/**
	 * @param number amount
	 * @return void
	 */
	public static indent(amount: number = 4): void {
		const config = vscode.workspace.getConfiguration('editor');
		config.update('tabSize', amount, true);
	}

	/**
	 * @param string text
	 * @return void
	 */
	public static log(text: string): void {
		buckOutput.appendLine(text);
	}

	/**
	 * Check if nothing is selected; normal caret position
	 *
	 * @return boolean
	 */
	public static nothingIsSelected(): boolean {
		const editor = vscode.window.activeTextEditor;
		const document: vscode.TextDocument | undefined = editor?.document;
		let selections: vscode.Selection[] | undefined = editor?.selections;

		// Default to the entire document
		return !!(selections && selections.length <= 1 && selections[0].start.line === selections[0].end.line);
	}

	/**
	 * Replace selections with string or functio
	 *
	 * @param vscode.Selection[] selections
	 * @param string|function replacement
	 * @return void
	 */
	public static replaceSelections(selections: vscode.Selection[], replacement: any): void {
		const editor = vscode.window.activeTextEditor;
		const document: vscode.TextDocument | undefined = editor?.document;

		// Exit if we don't have the references we need
		if (!editor || !document || !selections) {
			console.warn('Exiting because we dont have something');
			return;
		}

		// Iterate and replace selections
		selections.forEach((selection) => {
			const range: vscode.Range = new vscode.Range(selection.start, selection.end);
			const text: string = document.getText(range);
			const replacementStr: string = typeof replacement === 'string' ? replacement : replacement(text);

			editor.edit((editBuilder: vscode.TextEditorEdit): void => {
				editBuilder.replace(selection, replacementStr);
			});
		});
	}

	/**
	 * @param string text
	 * @return void
	 */
	public static replace(text: string): void {
		const editor = vscode.window.activeTextEditor;
		const document: vscode.TextDocument | undefined = editor?.document;

		// Exit if we don't have the references we need
		if (!editor || !document) {
			console.warn('Exiting because we dont have something');
			return;
		}

		const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));

		editor.edit((editBuilder) => {
			editBuilder.replace(fullRange, text);
		});
	}

	/**
	 * mk: I'm sure there's a better way to do this.
	 *
	 * @return vscode.Selection[]
	 */
	public static selectAll(): vscode.Selection[] {
		let selections: vscode.Selection[] = [];

		selections.push(new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(99999, 9999)));

		return selections;
	}
}
