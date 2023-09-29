import * as vscode from 'vscode';

/**
 * @object Settings
 */
export default class Settings {
	/**
	 * @todo memoize
	 *
	 * @return object
	 */
	public static get configuration() {
		return vscode.workspace.getConfiguration('gpt-template') || {};
	}

	/**
	 * @return string
	 */
	public static get token(): string {
		return this.configuration?.token || '';
	}
}
