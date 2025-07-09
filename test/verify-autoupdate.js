#!/usr/bin/env node

// Verification script for Squirrel auto-update implementation
console.log('🔍 Verifying Squirrel Auto-Update Implementation...\n');

const fs = require('fs');
const path = require('path');

let allPassed = true;

function check(name, condition, message) {
  if (condition) {
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name}: ${message}`);
    allPassed = false;
  }
}

// 1. Check package.json configuration
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

check(
  'electron-updater dependency', 
  packageJson.dependencies && packageJson.dependencies['electron-updater'],
  'electron-updater not found in dependencies'
);

check(
  'electron-builder dev dependency',
  packageJson.devDependencies && packageJson.devDependencies['electron-builder'],
  'electron-builder not found in devDependencies'
);

check(
  'GitHub publish configuration',
  packageJson.build && packageJson.build.publish && packageJson.build.publish[0] && packageJson.build.publish[0].provider === 'github',
  'GitHub publish configuration not found in build.publish'
);

check(
  'App ID configured',
  packageJson.build && packageJson.build.appId,
  'appId not configured in build section'
);

check(
  'Repository configuration',
  packageJson.repository && packageJson.repository.url,
  'repository URL not configured'
);

check(
  'Author with email',
  packageJson.author && packageJson.author.email,
  'author email not configured (required for Linux builds)'
);

// 2. Check main.js implementation
const mainJs = fs.readFileSync('src/main.js', 'utf8');

check(
  'electron-updater import',
  mainJs.includes("require('electron-updater')"),
  'electron-updater not imported'
);

check(
  'autoUpdater configuration',
  mainJs.includes('autoUpdater.checkForUpdatesAndNotify'),
  'autoUpdater.checkForUpdatesAndNotify not found'
);

check(
  'Update event handlers',
  mainJs.includes('update-available') && mainJs.includes('update-downloaded'),
  'update event handlers not implemented'
);

check(
  'Development mode detection',
  mainJs.includes('app.isPackaged'),
  'development mode detection not implemented'
);

check(
  'Manual update check in menu',
  mainJs.includes('Check for Updates') && !mainJs.includes('Auto-update is currently disabled'),
  'manual update check not properly implemented in menu'
);

// 3. Check GitHub workflow
const workflowPath = '.github/workflows/build-electron.yml';
if (fs.existsSync(workflowPath)) {
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  
  check(
    'GitHub workflow exists',
    true,
    ''
  );
  
  check(
    'electron-builder in workflow',
    workflow.includes('npm run build:'),
    'electron-builder commands not found in workflow'
  );
  
  check(
    'Auto-update artifacts in workflow',
    workflow.includes('latest*.yml'),
    'latest*.yml artifacts not included in workflow'
  );
  
  check(
    'GH_TOKEN environment variable',
    workflow.includes('GH_TOKEN'),
    'GH_TOKEN environment variable not configured'
  );
} else {
  check('GitHub workflow exists', false, 'workflow file not found');
}

// 4. Check for required files
check(
  'Main entry point exists',
  fs.existsSync('src/main.js'),
  'src/main.js not found'
);

check(
  'Icon file exists',
  fs.existsSync('src/icon.ico'),
  'src/icon.ico not found'
);

// 5. Summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 All checks passed! Squirrel auto-update is properly implemented.');
  console.log('\n📋 Next steps:');
  console.log('   1. Create a git tag (e.g., v0.0.2) to trigger a release build');
  console.log('   2. The GitHub workflow will build installers with auto-update support');
  console.log('   3. Future app launches will automatically check for updates');
  console.log('   4. Users can manually check for updates via Help > Check for Updates');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}