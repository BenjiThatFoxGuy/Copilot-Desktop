#!/usr/bin/env node

// Simple test to verify the main.js file can be loaded without syntax errors
console.log('Testing main.js syntax...');

try {
  // Only check syntax, don't actually run it
  const fs = require('fs');
  const path = require('path');
  const mainJS = fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8');
  
  // Check if it compiles without errors
  new Function(mainJS);
  
  console.log('✅ main.js syntax is valid');
  
  // Check for key autoupdate imports
  if (mainJS.includes('electron-updater')) {
    console.log('✅ electron-updater import found');
  } else {
    console.log('❌ electron-updater import not found');
    process.exit(1);
  }
  
  if (mainJS.includes('autoUpdater.checkForUpdatesAndNotify')) {
    console.log('✅ Auto-update functionality implemented');
  } else {
    console.log('❌ Auto-update functionality not found');
    process.exit(1);
  }
  
  if (mainJS.includes('update-available')) {
    console.log('✅ Update event handlers implemented');
  } else {
    console.log('❌ Update event handlers not found');
    process.exit(1);
  }
  
  console.log('✅ All tests passed!');
  
} catch (error) {
  console.error('❌ Syntax error in main.js:', error.message);
  process.exit(1);
}