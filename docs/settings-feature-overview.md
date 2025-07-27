# Settings Feature Overview

## New Settings Functionality in Copilot Desktop v0.2.8

### 1. Settings Choice Dialog

When pressing **Ctrl+P** or **Ctrl+,**, users now see a dialog asking which settings to open:

```
┌─────────────────────────────────────┐
│ Open Settings                        │
├─────────────────────────────────────┤
│ Which settings would you like to     │
│ open?                               │
│                                     │
│ [Copilot Settings] [Copilot Desktop │
│                     Settings] [Cancel] │
└─────────────────────────────────────┘
```

- **Copilot Settings**: Opens GitHub's Copilot settings page
- **Copilot Desktop Settings**: Opens the new app-specific settings dialog
- **Cancel**: Dismisses the dialog

### 2. Copilot Desktop Settings Dialog

The new settings window provides three key configuration options:

```
┌──────────────────────────────────────────────────────────┐
│ Copilot Desktop Settings                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ☑ Show notification when minimized to tray        │   │
│ │   Display a notification when the app is minimized │   │
│ │   to the system tray (only shows once per session) │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ☐ Start with Windows                               │   │
│ │   Automatically start Copilot Desktop when        │   │
│ │   Windows starts                                   │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Global hotkey to summon app:                       │   │
│ │ [CommandOrControl+Shift+C                        ] │   │
│ │   Press this key combination to show and focus    │   │
│ │   the app from anywhere                           │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│                  [Save]  [Cancel]                        │
└──────────────────────────────────────────────────────────┘
```

### 3. Settings Access Points

Settings can be accessed from multiple locations:

#### File Menu
- **File** → **Settings...** (Ctrl+P)
- **File** → **Settings... (Alt)** (Ctrl+,)

#### Tray Context Menu
- Right-click tray icon → **Settings...**

### 4. Technical Features

#### Settings Storage
- Settings are stored in `userData/settings.json`
- Persistent across app sessions
- Default values provided for new installations

#### Global Hotkey
- Default: **Ctrl+Shift+C** (Cmd+Shift+C on macOS)
- Customizable by user
- Works system-wide to summon and focus the app
- Proper cleanup on app quit

#### Windows Startup
- Uses Electron's `setLoginItemSettings()` API
- Cross-platform compatible (Windows/macOS)
- Toggleable via settings dialog

#### Smart Tray Notification
- Only shows **once per app session**
- Respects user preference setting
- Maintains existing notification content and styling

### 5. Backward Compatibility

All existing functionality is preserved:
- Original hotkeys still work (now show choice dialog)
- Existing users see default settings (tray notification enabled)
- No breaking changes to existing workflows
- All original menu items and features intact

### 6. Default Settings

New installations start with these defaults:
```json
{
  "showTrayNotification": true,
  "startWithWindows": false,
  "globalHotkey": "CommandOrControl+Shift+C"
}
```

Users can modify these through the settings dialog and changes are saved immediately.