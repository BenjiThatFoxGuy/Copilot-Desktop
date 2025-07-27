// Test settings functionality
const fs = require('fs');
const path = require('path');

console.log('Testing settings functionality...');

// Test 1: Check if main.js contains settings functions
const mainJsPath = path.join(__dirname, '..', 'src', 'main.js');
const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

const requiredFunctions = [
  'loadSettings',
  'saveSettings', 
  'setupGlobalHotkey',
  'setupAutoStart',
  'showSettingsChoiceDialog',
  'showDesktopSettingsDialog'
];

let functionTests = 0;
for (const func of requiredFunctions) {
  if (mainJsContent.includes(`function ${func}(`)) {
    console.log(`✅ Function ${func} found`);
    functionTests++;
  } else {
    console.log(`❌ Function ${func} missing`);
  }
}

// Test 2: Check if globalShortcut import is present
if (mainJsContent.includes('globalShortcut')) {
  console.log('✅ globalShortcut import found');
} else {
  console.log('❌ globalShortcut import missing');
}

// Test 3: Check if settings variables are declared
const settingsVars = ['appSettings', 'trayNotificationShown', 'settingsPath'];
let varTests = 0;
for (const varName of settingsVars) {
  if (mainJsContent.includes(varName)) {
    console.log(`✅ Variable ${varName} found`);
    varTests++;
  } else {
    console.log(`❌ Variable ${varName} missing`);
  }
}

// Test 4: Check if IPC handler for save-settings exists
if (mainJsContent.includes("ipcMain.on('save-settings'")) {
  console.log('✅ save-settings IPC handler found');
} else {
  console.log('❌ save-settings IPC handler missing');
}

// Test 5: Check if preload.js contains saveSettings API
const preloadJsPath = path.join(__dirname, '..', 'src', 'preload.js');
const preloadJsContent = fs.readFileSync(preloadJsPath, 'utf8');

if (preloadJsContent.includes('saveSettings')) {
  console.log('✅ saveSettings API exposed in preload.js');
} else {
  console.log('❌ saveSettings API missing in preload.js');
}

// Test 6: Check if settings hotkeys have been updated
if (mainJsContent.includes('showSettingsChoiceDialog()')) {
  console.log('✅ Settings hotkeys updated to show choice dialog');
} else {
  console.log('❌ Settings hotkeys not updated');
}

// Test 7: Check if tray notification logic updated
if (mainJsContent.includes('appSettings.showTrayNotification && !trayNotificationShown')) {
  console.log('✅ Tray notification logic updated');
} else {
  console.log('❌ Tray notification logic not updated');
}

// Test 8: Check version bump
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.version === '0.2.8') {
  console.log('✅ Version bumped to 0.2.8');
} else {
  console.log(`❌ Version not bumped correctly (current: ${packageJson.version})`);
}

const totalTests = requiredFunctions.length + settingsVars.length + 5; // +5 for the other individual tests
const passedTests = functionTests + varTests + 
  (mainJsContent.includes('globalShortcut') ? 1 : 0) +
  (mainJsContent.includes("ipcMain.on('save-settings'") ? 1 : 0) +
  (preloadJsContent.includes('saveSettings') ? 1 : 0) +
  (mainJsContent.includes('showSettingsChoiceDialog()') ? 1 : 0) +
  (mainJsContent.includes('appSettings.showTrayNotification && !trayNotificationShown') ? 1 : 0) +
  (packageJson.version === '0.2.8' ? 1 : 0);

console.log(`\nTest Results: ${passedTests}/${totalTests} passed`);

if (passedTests >= totalTests) {
  console.log('✅ All settings tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some settings tests failed!');
  process.exit(1);
}