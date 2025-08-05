#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 Setting up your Elysia SSR project...\n');

// Check if .env exists, if not create from example
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📋 Creating .env file from .env.example...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env file created! Please update it with your configuration.\n');
}

// Generate a random JWT secret if not already set
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('JWT_SECRET="your-secret-key-here"')) {
    const crypto = require('crypto');
    const jwtSecret = crypto.randomBytes(32).toString('hex');
    envContent = envContent.replace('JWT_SECRET="your-secret-key-here"', `JWT_SECRET="${jwtSecret}"`);
    fs.writeFileSync(envPath, envContent);
    console.log('🔐 Generated secure JWT secret\n');
  }
}

console.log('\n✨ Setup complete!\n');
console.log('Next steps:');
console.log('1. Update your .env file with your database credentials');
console.log('2. Run "bun db:push" to set up your database');
console.log('3. Run "bun dev" to start the development server');
console.log('\nHappy coding! 🎉\n');
