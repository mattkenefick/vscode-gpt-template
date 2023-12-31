# GPT Template

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/polymermallard.gpt-template.svg)](https://marketplace.visualstudio.com/items?itemName=polymermallard.gpt-template)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/polymermallard.gpt-template.svg)](https://marketplace.visualstudio.com/items?itemName=polymermallard.gpt-template)
[![Backers on Patreon](https://img.shields.io/badge/backer-Patreon-orange.svg)](https://www.patreon.com/mattkenefick)
[![Backers on Paypal](https://img.shields.io/badge/backer-Paypal-blue.svg)](https://paypal.me/polymermallard)

Creates a new file using an existing one as a template.

![Example](./assets/gpt-template.gif)

## Usage

Right click a file in the tree explorer and select "Generate using this as template." OR open a file, press Cmd+P, search for "Generate using this as template."

You will be prompted for what you want to create. An example might be "Create a database migration for UserDetail using key value fields."

## Configuration

Add your OpenAI token to the settings JSON/UI.

```
	"gpt-template.token": "sk-qkjKAcpQTPGKLEkFfvDbT3BlbkFJ...",
```

![Settings](./assets/settings.png)

## Release Notes

### 0.3.0

-   Ability to cancel active generations (in status bar)
-   Open new file if nothing is open
-   Write to existing file if it's empty
-   Optionally save to relative path

### 0.2.0

-   Update app icon
-   Add GPT streaming
-   Update example GIF
-   Use Settings class

### 0.1.0

Initial release
