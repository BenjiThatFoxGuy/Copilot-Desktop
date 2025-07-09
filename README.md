# Copilot-Desktop

- **Why?** Because Claude and ChatGPT have a Desktop app.
- **Suggestions? Ideas?** Open an issue/submit a PR. I'll consider them. Just note, this is a personal project with no guarantees. But I'll be willing to collaborate.

Unofficial GUI for GitHub Copilot, made in Electron.

## Features

- **Auto-Update Support**: The app now includes Squirrel-based auto-updates that check for new versions on startup and can be manually triggered via the Help menu.
- **System Tray Integration**: The app minimizes to system tray when closed.
- **GitHub Integration**: Embeds the GitHub Copilot interface directly, and smartly redirects certain GitHub links to your default browser for a seamless experience.

## Getting Started

1. Install dependencies:
    ```sh
    npm install
    ```
2. Start the app:
    ```sh
    npm start
    ```
3. Build the app:
    ```sh
    npm run build
    ```
4. Test the app:
    ```sh
    npm test
    ```

This will open a desktop window embedding https://github.com/copilot.

## Auto-Update

The application includes automatic update functionality:

- **Automatic Checking**: The app checks for updates 3 seconds after startup (production builds only)
- **Manual Checking**: Use the "Check for Updates" option in the Help menu
- **Update Process**: When an update is available, it downloads in the background and prompts for installation
- **GitHub Releases**: Updates are distributed through GitHub releases

## Development

- Auto-update checks are disabled in development mode (when `app.isPackaged` is false)
- Use `npm test` to verify the main application syntax and auto-update implementation

---

**Note:**
- You need a GitHub account and must be signed in within the embedded browser.
- Access to Copilot features depends on your available usage credits (completions and chat). If you have exhausted your free credits, you may need to wait for them to reset or upgrade your plan.