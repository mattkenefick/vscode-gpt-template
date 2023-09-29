import * as vscode from 'vscode';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';
import { gptStream, IGptMessage } from './gptbuilder';

let statusBarIcon: vscode.StatusBarItem;
let cancelFunction: () => void;

/**
 * @return void
 */
function removeStatusIcon(): void {
	statusBarIcon && statusBarIcon.dispose();
}

/**
 * @return void
 */
export async function cancelRequest(): Promise<void> {
	// Remove status bar item
	removeStatusIcon();

	// Cancel
	cancelFunction && cancelFunction();
}

/**
 * @param vscode.Uri fileUri
 * @return Promise<void>
 */
export async function useAsTemplate(fileUri: vscode.Uri): Promise<void> {
	const editor = vscode.window.activeTextEditor;

	// Get API token from settings
	if (!Settings.token) {
		vscode.window.showErrorMessage('OpenAI token is not set as `gpt-template.token` in settings.');
		return;
	}

	// Get purpose from the user
	const purpose = await vscode.window.showInputBox({
		prompt: 'What would you like to do with this template?',
	});

	// Get save location
	const saveAs = await vscode.window.showInputBox({
		prompt: 'Name this file (leave empty for new file)',
	});

	// vscode.window.showQuickPick(['Option 1', 'Option 2', 'Option 3'], {
	// 	placeHolder: 'Pick an option',
	// });

	// If purpose is set, then continue
	if (purpose && Settings.token) {
		let response;

		// Create status icon
		statusBarIcon = VsCodeHelper.createIcon('$(sync~spin) Creating Template...', 'Click to cancel', 'gpt-template.cancelRequest');

		// If fileUri isn't available, then get text from open file
		if (!fileUri && editor) {
			fileUri = editor.document.uri;
		}

		// Read contents from fileUri
		const language: string = await VsCodeHelper.getLanguageFromFile(fileUri);
		const fileContent: string = await VsCodeHelper.getTextFromFile(fileUri);
		const hasActiveDocument: boolean = VsCodeHelper.hasActiveDocument();
		const activeDocumentText: string = VsCodeHelper.getActiveText();
		const defaultText: string = 'Waiting for response\n(Formatting will come after)';

		// Create an saved file
		if (saveAs) {
			const outputPath = fileUri.fsPath.split('/').slice(0, -1).join('/');
			const saveUri = `${outputPath}/${saveAs}`;

			VsCodeHelper.log(`Saving file to ${saveUri}`);

			await VsCodeHelper.createFile(saveUri, defaultText);
		}

		// Create new file
		else if (!hasActiveDocument || activeDocumentText) {
			await VsCodeHelper.newFile(defaultText, language);
		}

		// Create content
		response = await fetchStream(fileContent, purpose);

		// Check if we have a relative filename and save the current document
		if (saveAs) {
			await VsCodeHelper.save();
		}
	} else {
		vscode.window.showErrorMessage('No purpose was provided. Please try again.');
	}
}

/**
 * @param string fileContent
 * @param string purpose
 * @return Promise<string>
 */
async function fetchStream(fileContent: string, purpose: string): Promise<string> {
	let results: number = 0;
	const options: IGptMessage[] = [
		{
			content: `You are helping me create new code snippets. Respond with just the code as a single file, do not provide context or explanations. Here the template you should follow:\n\n${fileContent}`,
			role: 'system',
		},
		{
			content: `I want to: ${purpose}`,
			role: 'user',
		},
	];

	/**
	 * @param string content
	 * @return void
	 */
	function onComplete(content: string): void {
		VsCodeHelper.replace(content);
		VsCodeHelper.log(content);
		VsCodeHelper.indent(4);

		removeStatusIcon();
	}

	/**
	 * @param string content
	 * @return void
	 */
	function onPartial(content: string): void {
		// Log
		VsCodeHelper.log(content);

		// Clear placeholder
		if (results++ === 0) {
			VsCodeHelper.replace(content);
		} else {
			VsCodeHelper.append(content);
		}
	}

	// Fetch stream of data
	const { cancel, promise } = gptStream(options, Settings.token, onPartial);

	cancelFunction = cancel;
	promise.then(onComplete);

	return promise;
}
