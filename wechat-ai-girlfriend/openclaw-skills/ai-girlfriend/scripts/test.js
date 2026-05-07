#!/usr/bin/env node

/**
 * Test script for AI Girlfriend OpenClaw Skill
 * This script tests the basic functionality without requiring an API key
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');

console.log('=== AI Girlfriend OpenClaw Skill Test ===\n');

// Test 1: Check file structure
console.log('Test 1: Checking file structure...');
const requiredFiles = [
  'SKILL.md',
  'package.json',
  'README.md',
  'scripts/simple-chat.js',
  'references/examples.md',
  'references/api-reference.md',
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = join(__dirname, '..', file);
  if (existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - MISSING`);
    allFilesExist = false;
  }
}

if (allFilesExist) {
  console.log('  Result: PASS\n');
} else {
  console.log('  Result: FAIL\n');
  process.exit(1);
}

// Test 2: Check package.json
console.log('Test 2: Checking package.json...');
try {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  console.log(`  Name: ${packageJson.name}`);
  console.log(`  Version: ${packageJson.version}`);
  console.log(`  Dependencies: ${Object.keys(packageJson.dependencies || {}).length} packages`);
  console.log('  Result: PASS\n');
} catch (error) {
  console.log(`  Error: ${error.message}`);
  console.log('  Result: FAIL\n');
  process.exit(1);
}

// Test 3: Check SKILL.md format
console.log('Test 3: Checking SKILL.md format...');
try {
  const skillContent = readFileSync(join(__dirname, '..', 'SKILL.md'), 'utf-8');
  
  // Check for YAML frontmatter
  if (skillContent.startsWith('---')) {
    console.log('  ✓ Has YAML frontmatter');
  } else {
    console.log('  ✗ Missing YAML frontmatter');
    process.exit(1);
  }
  
  // Check for required fields
  const hasName = skillContent.includes('name:');
  const hasDescription = skillContent.includes('description:');
  
  if (hasName && hasDescription) {
    console.log('  ✓ Has required metadata fields');
  } else {
    console.log('  ✗ Missing required metadata fields');
    process.exit(1);
  }
  
  console.log('  Result: PASS\n');
} catch (error) {
  console.log(`  Error: ${error.message}`);
  console.log('  Result: FAIL\n');
  process.exit(1);
}

// Test 4: Check database initialization
console.log('Test 4: Checking database initialization...');
try {
  const dataDir = join(projectRoot, 'data');
  const dbPath = join(dataDir, 'chat.db');
  
  if (!existsSync(dataDir)) {
    console.log('  ✗ Data directory does not exist');
    process.exit(1);
  }
  console.log('  ✓ Data directory exists');
  
  // Try to open database
  const db = new Database(dbPath);
  console.log('  ✓ Database can be opened');
  
  // Check tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);
  
  if (tableNames.includes('conversations')) {
    console.log('  ✓ Conversations table exists');
  } else {
    console.log('  ⚠ Conversations table will be created on first use');
  }
  
  db.close();
  console.log('  Result: PASS\n');
} catch (error) {
  console.log(`  Error: ${error.message}`);
  console.log('  Result: FAIL\n');
  process.exit(1);
}

// Test 5: Check environment variables handling
console.log('Test 5: Checking environment variables handling...');
const apiKey = process.env.OPENAI_API_KEY;
if (apiKey) {
  console.log('  ✓ OPENAI_API_KEY is set');
} else {
  console.log('  ⚠ OPENAI_API_KEY is not set (required for actual chat)');
}
console.log('  Result: INFO (not a failure)\n');

// Test 6: Validate script syntax
console.log('Test 6: Validating script syntax...');
try {
  const { execSync } = await import('node:child_process');
  
  // Check simple-chat.js
  execSync('node --check simple-chat.js', { 
    cwd: join(__dirname),
    stdio: 'pipe' 
  });
  console.log('  ✓ simple-chat.js syntax is valid');
  
  // Check chat-handler.js
  execSync('node --check chat-handler.js', { 
    cwd: join(__dirname),
    stdio: 'pipe' 
  });
  console.log('  ✓ chat-handler.js syntax is valid');
  
  console.log('  Result: PASS\n');
} catch (error) {
  console.log(`  Error: ${error.message}`);
  console.log('  Result: FAIL\n');
  process.exit(1);
}

// Summary
console.log('=== Test Summary ===');
console.log('All tests passed! ✓');
console.log('\nThe AI Girlfriend OpenClaw Skill is ready to use.');
console.log('\nTo start chatting, set your OPENAI_API_KEY and run:');
console.log('  node scripts/simple-chat.js --message "你好" --user-id "user123"');
