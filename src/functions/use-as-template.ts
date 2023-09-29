import * as vscode from 'vscode';
import { ChatGPT } from './gptbuilder';

/**
 * @return Promise<void>
 */
export async function useAsTemplate(fileUri: vscode.Uri): Promise<void> {
	const editor = vscode.window.activeTextEditor;

	// Read settings for this extension
	const config = vscode.workspace.getConfiguration('gpt-template');
	const token = config.get('token');

	// Get API token from settings
	if (!token) {
		vscode.window.showErrorMessage('OpenAI token is not set as `gpt-template.token` in settings.');
		return;
	}

	// Get purpose from the user
	const purpose = await vscode.window.showInputBox({
		prompt: 'What would you like to do with this template?',
	});

	// If purpose is set, then continue
	if (purpose) {
		let response;

		// VScode extension, print console log
		vscode.window.showInformationMessage(`Requesting new templated file...`);

		// If fileUri isn't available, then get text from open file
		if (!fileUri) {
			if (editor) {
				fileUri = editor.document.uri;
			}
		}

		// Read contents from fileUri
		const file = await vscode.workspace.openTextDocument(fileUri);
		const language = file.languageId;
		const fileContent = file.getText();

		// Create GPT request
		const gptBuilder = new ChatGPT(token);
		gptBuilder.debug = true;
		gptBuilder.pinSystem(`You are helping me create new code snippets. Only return the code as one file, do not provide context or explanations. Here is an example of the template you will follow:\n\n${fileContent}`);
		response = await gptBuilder.ask(`I want to: ${purpose}`);

		// Create an untitled file with the specified content
		const newFile = await vscode.workspace.openTextDocument({
			language: language,
			content: response,
		});

		// Show new doc
		await vscode.window.showTextDocument(newFile);

		// Set tab indent size to 4 for this file
		const config = vscode.workspace.getConfiguration('editor');
		await config.update('tabSize', 4, true);
	} else {
		vscode.window.showErrorMessage('No purpose was provided. Please try again.');
	}
}
