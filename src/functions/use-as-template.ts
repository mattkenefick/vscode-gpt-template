import * as vscode from 'vscode';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';
import { gptStream, ChatGPT } from './gptbuilder';

/**
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

	// If purpose is set, then continue
	if (purpose && Settings.token) {
		let response;
		let results = 0;

		// VScode extension, print console log
		vscode.window.showInformationMessage(`Requesting new templated file...`);

		// If fileUri isn't available, then get text from open file
		if (!fileUri && editor) {
			fileUri = editor.document.uri;
		}

		// Read contents from fileUri
		const language: string = await VsCodeHelper.getLanguageFromFile(fileUri);
		const fileContent: string = await VsCodeHelper.getTextFromFile(fileUri);

		// Create GPT request
		const gptBuilder = new ChatGPT(Settings.token);
		gptBuilder.debug = true;
		// gptBuilder.pinSystem(`You are helping me create new code snippets. Only return the code as one file, do not provide context or explanations. Here is an example of the template you will follow:\n\n${fileContent}`);
		// response = await gptBuilder.ask(`I want to: ${purpose}`);

		// Create an untitled file with the specified content
		const newFile = await vscode.workspace.openTextDocument({
			language: language,
			content: 'Waiting for response...',
		});

		// Show new doc
		await vscode.window.showTextDocument(newFile);

		// Fetch stream of data
		gptStream(
			[
				{
					content: `You are helping me create new code snippets. Only return the code as one file, do not provide context or explanations. Here is an example of the template you will follow:\n\n${fileContent}`,
					role: 'system',
				},
				{
					content: `I want to: ${purpose}`,
					role: 'user',
				},
			],
			Settings.token,

			// Append content to open document
			(content: string) => {
				// Log
				VsCodeHelper.log(content);

				// Clear placeholder
				if (results++ === 0) {
					VsCodeHelper.replace(content);
				} else {
					VsCodeHelper.append(content);
				}
			},
		)
			// Replace entire document with final content
			.then((final: string) => {
				VsCodeHelper.replace(final);
				VsCodeHelper.log(final);
				VsCodeHelper.indent(4);
			});
	} else {
		vscode.window.showErrorMessage('No purpose was provided. Please try again.');
	}
}
