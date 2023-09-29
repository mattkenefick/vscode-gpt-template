// @ts-nocheck

import axios, { AxiosRequestConfig } from 'axios';

/**
 * @type type
 */
type IGptMessageRole = 'user' | 'assistant' | 'system';

/**
 * @type interface
 */
interface IGptMessage {
	content: string;
	pin?: boolean;
	role: IGptMessageRole;
	timestamp?: number;
}

/**
 * @type interface
 */
interface IGptChoice {
	finish_reason: string;
	index: number;
	message: IGptMessage;
}

/**
 * @param string url
 * @param Record<string, string>
 * @param string|object postData
 * @return Promise<object>
 */
function httpsRequest(url: string, headers: Record<string, string>, postData: any): Promise<any> {
	const config: AxiosRequestConfig = {
		data: postData,
		headers: headers,
		method: 'POST',
		url: url,
	};

	return axios(config).then((response) => response.data);
}

/**
 * @param IGptMessage[] messages
 * @param string token
 * @return Promise<any>
 */
export async function gpt(messages: IGptMessage[] = [], token: string = ''): Promise<any> {
	const headers = {
		'Authorization': 'Bearer ' + token,
		'Content-Type': 'application/json',
	};
	const model = 'gpt-3.5-turbo';
	const url = 'https://api.openai.com/v1/chat/completions';
	const data = { messages, model };
	const request = httpsRequest(url, headers, data);

	return request;
}

/**
 *
 * {
 * 	"id": "chatcmpl-7rAoqVcJbJEMl7QLIWnqpa9V53sAU",
 * 	"object": "chat.completion.chunk",
 * 	"created": 1692907328,
 * 	"model": "gpt-3.5-turbo-0613",
 * 	"choices": [
 * 		{
 * 			"index": 0,
 * 			"delta": {
 * 				"content": " one"
 * 			},
 * 			"finish_reason": null
 * 		}
 * 	]
 * }
 *
 * The last one will be:
 *
 * "choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}
 *
 * @param IGptMessage[] messages
 * @param string token
 * @param Function callback
 * @return Promise<string>
 */
export async function gptStream(messages: IGptMessage[] = [], token: string = '', callback: (content: string) => void): Promise<string> {
	const headers = {
		'Authorization': 'Bearer ' + token,
		'Content-Type': 'application/json',
	};
	const model = 'gpt-3.5-turbo';
	const url = 'https://api.openai.com/v1/chat/completions';
	const data = {
		messages: messages,
		model: model,
		stream: true,
	};
	let outputString: string = '';

	return new Promise((resolve, reject) => {
		fetch(url, {
			body: JSON.stringify(data),
			cache: 'no-cache',
			headers: headers,
			method: 'POST',
			mode: 'cors',
		}).then((response) => {
			let reader: ReadableStreamDefaultReader<string>;

			if (response.ok && response.body) {
				function readStream() {
					reader.read().then(({ value, done }) => {
						if (done) {
							reader.cancel();
							return resolve(outputString);
						}

						// Extract the complete JSON object
						value = value || '';
						value = value.replace(/^data\:\ \{/gi, '{');
						value = value.replace(/\ndata\:\ \{/gi, ', {');
						value = value.match(/\{.*\}/gi)?.join(', ');

						const json = JSON.parse(`[${value}]`);
						const data = json.pop();

						if (!data) {
							return readStream();
						}

						const choices = data.choices;
						const content = choices.length ? choices[0].delta?.content || '' : '';

						// Build content
						outputString += content;

						// Trigger callback
						callback && callback(content);

						return readStream();
					});
				}

				// Define the reader stream
				reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

				return readStream();
			} else {
				return reject(response);
			}
		});
	});
}

/**
 * Example Usage:
 *
 *  GptBuilder(API_TOKEN)
 *  	.addUser(`Knock knock`)
 *  	.addAssistant(`Who's there?`)
 *  	.addUser(`Orange.`)
 *  	.send()
 *  	.then(({ choices, created, id, model, object, usage }) => {
 *  		console.log(choices[0]);
 *  	});
 *
 * -----------------------------------------------------------------------------
 *
 * 	const builder = GptBuilder(API_TOKEN);
 * 	let response;
 *
 * 	response = await builder.ask('Knock knock');
 * 	console.log('Response:', response);
 *
 * 	response = await builder.ask('Orange');
 * 	console.log('Response:', response);
 *
 * -----------------------------------------------------------------------------
 *
 * In summary, you would use the User role to represent the user's input
 * or query, the System role to represent the system's response to the user,
 * and the Assistant role to represent the specific implementation of the
 * ChatGPT API that is tailored to a particular use case or application.
 *
 * If you want to set context for future messages, such as describing a
 * character, you would use the User role to provide the initial description
 * of the character, and then use the Assistant role to keep track of and
 * provide additional information about the character in future messages.
 *
 * For example, suppose you are building a chatbot for a game that involves
 * a cast of characters, and you want to describe one of the characters to
 * the user. You could use the User role to provide the initial description
 * of the character, such as their name, appearance, and backstory. Then,
 * in subsequent messages, you could use the Assistant role to provide
 * additional information about the character as the user interacts with
 * the game. This could include updates on the character's actions or
 * status, as well as hints about their motivations and personality.
 *
 * By using the User role to set up the initial context and the Assistant
 * role to provide additional information, you can create a more immersive
 * and engaging experience for the user.
 *
 * @return GptBuilder
 */
export class ChatGPT {
	/**
	 * @type boolean
	 */
	public debug: boolean = false;

	/**
	 * Experimental feature that will try to summarize longer histories
	 * so we can have long conversations.
	 *
	 * @type boolean
	 */
	public enableSummaries: boolean = false;

	/**
	 * @type string
	 */
	public id: string = '';

	/**
	 * ChatGPT has a max character limit
	 *
	 * @type number
	 */
	public maxCharacters: number = 4096;

	/**
	 * @type number
	 */
	public maxMessages: number = 200;

	/**
	 * @type IGptMessage[] messages
	 */
	public messages: IGptMessage[] = [];

	/**
	 * @type IGptMessage[] pinnedMessages
	 */
	public pinnedMessages: IGptMessage[] = [];

	/**
	 * How many messages to summarize after
	 *
	 * @type number
	 */
	public summarizeAfter: number = 3;

	/**
	 * @type string
	 */
	public token: string = '';

	/**
	 * @param string token
	 * @param number maxMessages
	 * @param boolean enableSummaries
	 */
	constructor(token: string, maxMessages: number = 200, enableSummaries: boolean = false) {
		this.enableSummaries = enableSummaries;
		this.maxMessages = maxMessages;
		this.token = token;
	}

	/**
	 * @param IGptMessage message
	 * @return GptBuilder
	 */
	public add(message: IGptMessage): this {
		this.addMessage(message.content, message.role, message.pin);
		return this;
	}

	/**
	 * @param string content
	 * @return GptBuilder
	 */
	public addAssistant(content: string): this {
		this.addMessage(content, 'assistant');
		return this;
	}

	/**
	 * @param string content
	 * @return GptBuilder
	 */
	public addSystem(content: string): this {
		this.addMessage(content, 'system');
		return this;
	}

	/**
	 * @param string content
	 * @return GptBuilder
	 */
	public addUser(content: string): this {
		this.addMessage(content, 'user');
		return this;
	}

	/**
	 * @param string message
	 * @param boolean returnObject
	 * @return Promise<object | string>
	 */
	public async ask(message: string, returnObject: boolean = false): Promise<string | any> {
		let response;
		let output = '';

		// Check if we should summarize first
		if (this.enableSummaries && this.messages.length > this.summarizeAfter) {
			const summary = await this.summarize();
		}

		// Add user message
		this.addUser(message);

		// Send
		if (returnObject) {
			return this.send();
		} else {
			try {
				response = await this.send();
				output = response?.choices?.length ? response.choices[0].message.content : '';

				// Log
				if (this.debug) {
					console.log('Response:', output);
				}
			} catch (error) {
				console.error(error);
			}

			return output;
		}
	}

	/**
	 * @param boolean includePinned
	 * @return GptBuilder
	 */
	public clear(includePinned: boolean = false): this {
		this.messages = [];
		includePinned && (this.pinnedMessages = []);
		return this;
	}

	/**
	 * @param number take
	 * @return IGptMessage[]
	 */
	public getHistory(take: number = 1): IGptMessage[] {
		return this.getMessages().slice(-take);
	}

	/**
	 * @return number
	 */
	public getMessageCount(): number {
		return this.messages.length;
	}

	/**
	 * @return number
	 */
	public getPinnedMessageCount(): number {
		return this.pinnedMessages.length;
	}

	/**
	 * @return number
	 */
	public getTotalMessageCount(): number {
		return this.getMessageCount() + this.getPinnedMessageCount();
	}

	/**
	 * @param string content
	 * @return GptBuilder
	 */
	public pinAssistant(content: string): this {
		this.addMessage(content, 'assistant', true);
		return this;
	}

	/**
	 * @param string content
	 * @return GptBuilder
	 */
	public pinSystem(content: string): this {
		this.addMessage(content, 'system', true);
		return this;
	}

	/**
	 * @param string content
	 * @return GptBuilder
	 */
	public pinUser(content: string): this {
		this.addMessage(content, 'user', true);
		return this;
	}

	/**
	 * @param Function callback
	 * @return Promise<any>
	 */
	public async stream(callback: (content: string) => void): Promise<any> {
		return gptStream(this.getMessages(), this.token, callback);
	}

	/**
	 * @param string token
	 * @return Promise<object>
	 */
	public async send(): Promise<any> {
		let response;

		// Fetch response from server
		try {
			response = await gpt(this.getMessages(), this.token);
		} catch (error: any) {
			if (error.response && error.response.status === 429) {
				console.error('BUCKGPT: Cannot send message; service is overloaded.');
			} else if (error.response && error.response.status === 503) {
				console.warn('BUCKGPT: Service unavailable:', error);
			} else {
				console.warn('BUCKGPT: Could not send message:', error);
			}

			return {};
		}

		// Check if error
		// {
		// 	error: {
		// 	  message: 'Incorrect API key provided: sk-qkjKA***************************..... You can find your API key at https://platform.openai.com/account/api-keys.',
		// 	  type: 'invalid_request_error',
		// 	  param: null,
		// 	  code: 'invalid_api_key'
		// 	}
		//   }
		if (response?.error) {
			throw new Error(response.error?.message);
		}

		// Add this message to the history for context
		response?.choices.forEach((choice: IGptChoice) => {
			this.addMessage(choice.message.content, choice.message.role);
		});

		// Returns first half, destroys array in place and keeps last half
		this.messages.splice(0, this.messages.length - this.maxMessages);

		// Log messages
		if (this.debug) {
			console.log(`Messages [${this.messages.length}]:`, this.messages);
		}

		return response;
	}

	/**
	 * Attempt to summarize the conversatino
	 *
	 * @return void
	 */
	public async summarize(): Promise<void> {
		// Add a message to the history
		this.addUser('Thoroughly summarize what was discussed. Be as detailed as possible.');

		// Ask for a summary of what we talked about
		let response = await this.send();

		// Clear everything except our summary
		this.messages.splice(0, this.messages.length - 1);

		// Log
		if (this.debug) {
			console.log(' 📖 Generated summary:', response);
		}
	}

	/**
	 * @param string content
	 * @param IGptMessageRole role
	 * @param boolean isPinned
	 * @return GptBuilder
	 */
	protected addMessage(content: string, role: IGptMessageRole, isPinned: boolean = false): this {
		const timestamp: number = Date.now();
		const message: IGptMessage = {
			content,
			role,
			timestamp,
		};

		// Choose which array
		if (isPinned) {
			// Add to pinned messages if content is not found in existing pins
			if (!this.pinnedMessages.find((message: IGptMessage) => message.content === content)) {
				this.pinnedMessages.push(message);
			}
		} else {
			this.messages.push(message);
		}

		// Log
		if (this.debug) {
			console.log(` 🔹 Adding (${timestamp}) [${role}]: "${content}"`);
		}

		return this;
	}

	/**
	 * Returns filtered message block ready to send to GPT
	 *
	 * @return IGptMessage[]
	 */
	public getMessages(): IGptMessage[] {
		const pinnedMessages: IGptMessage[] = [];
		let output: IGptMessage[] = [];
		let characterCount: number = 0;

		// Add pinned messages to temp array
		this.pinnedMessages.forEach((message: IGptMessage) => {
			pinnedMessages.push(message);
			characterCount += message.content.length;
		});

		// Iterate through messages backwards
		for (let i = this.messages.length - 1; i >= 0; i--) {
			const message = this.messages[i];

			// Check if this will be too long
			if (characterCount + message.content.length > this.maxCharacters) {
				// Log
				if (this.debug) {
					console.log(` 🔹 Skipping [${message.role}] (${characterCount} / ${this.maxCharacters}): "${message.content}"`);
				}

				break;
			}

			// Add message to beginning of output
			output.unshift(message);

			// Add message length to character count
			characterCount += message.content.length;
		}

		// Prepend the pinned messages to the output
		output.unshift(...pinnedMessages);

		// Remove any additional properties
		output = output.map((message: IGptMessage) => {
			return {
				content: message.content,
				role: message.role,
			};
		});

		return output;
	}
}
