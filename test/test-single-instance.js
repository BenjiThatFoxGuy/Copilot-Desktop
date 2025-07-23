#!/usr/bin/env node

// Test to verify single instance functionality is implemented
console.log('Testing single instance functionality...');

try {
  const fs = require('fs');
  const path = require('path');
  const mainJS = fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8');
  
  // Check if single instance lock is implemented
  if (mainJS.includes('app.requestSingleInstanceLock')) {
    console.log('✅ Single instance lock implementation found');
  } else {
    console.log('❌ Single instance lock implementation not found');
    process.exit(1);
  }
  
  // Check if second-instance event handler is implemented
  if (mainJS.includes('second-instance')) {
    console.log('✅ Second instance event handler found');
  } else {
    console.log('❌ Second instance event handler not found');
    process.exit(1);
  }
  
  // Check if the app quits when it doesn't get the lock
  if (mainJS.includes('!gotTheLock') && mainJS.includes('app.quit()')) {
    console.log('✅ App quit logic when lock is not obtained found');
  } else {
    console.log('❌ App quit logic when lock is not obtained not found');
    process.exit(1);
  }
  
  // Check if the window is shown and focused when second instance is attempted
  if (mainJS.includes('win.show()') && mainJS.includes('win.focus()')) {
    console.log('✅ Window show and focus logic found');
  } else {
    console.log('❌ Window show and focus logic not found');
    process.exit(1);
  }
  
  console.log('✅ All single instance tests passed!');
  
} catch (error) {
  console.error('❌ Error testing single instance functionality:', error.message);
  process.exit(1);
}