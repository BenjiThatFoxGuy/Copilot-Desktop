# Copilot-Desktop

Unofficial Electron-based desktop client for GitHub Copilot.

## Overview

Copilot-Desktop brings GitHub Copilot to your desktop, offering a native-like experience with system tray integration, auto-updates, and seamless GitHub authentication. This project is community-driven and not affiliated with GitHub.

> **Note:** Currently, Copilot-Desktop is only available for **Windows** due to Squirrel setup requirements. Support for other platforms may be added in the future.

## Features

- **Auto-Update**: Checks for updates on startup and via the Help menu (production builds, Windows only).
- **System Tray**: Minimizes to the tray instead of closing.
- **GitHub Copilot Integration**: Embeds GitHub's Copilot web UI with enhancements such as keyboard shortcuts, the convenience of pinning it to your taskbar, running in the system tray, and more.
- **Cross-Platform (Planned)**: Built with Electron, but currently distributed only for Windows.

## Download

For end users, download the latest release from the [Releases page](https://github.com/BenjiThatFoxGuy/Copilot-Desktop/releases).  
Just run the executable for your platform (**currently Windows only**).

## Dev Instructions

To run or develop Copilot-Desktop locally:

1. **Install dependencies:**
    ```sh
    npm install
    ```
2. **Start the app in development mode:**
    ```sh
    npm start
    ```
3. **Build the app for production:**
    ```sh
    npm run build
    ```
4. **Run tests:**
    ```sh
    npm test
    ```

> The app opens a desktop window embedding GitHub's Copilot web UI with enhancements like keyboard shortcuts, taskbar pinning, tray support, and more.

## Auto-Update Details

- **Automatic**: Checks for updates 3 seconds after startup (production only, Windows only).
- **Manual**: Use "Check for Updates" in the Help menu.
- **Distribution**: Updates are delivered via GitHub Releases.
- **Development Mode**: Auto-update is disabled when `app.isPackaged` is `false`.
- **Platform Limitation**: Auto-update uses Squirrel.Windows, so only Windows builds are supported at this time.

## Notes

- Requires a GitHub account; sign in within the embedded browser.
- Copilot access depends on your GitHub subscription and available usage credits.
- **Currently only Windows is supported due to Squirrel setup requirements.**

---

**Suggestions or ideas?**  
Open an issue or submit a PR. This is a personal project—no guarantees, but collaboration is welcome!