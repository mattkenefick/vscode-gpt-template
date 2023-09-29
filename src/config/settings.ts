import * as vscode from 'vscode';

/**
 * @author Matt Kenefick <matt@polymermallard.com>
 * @package Config
 * @project GPT Template
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
