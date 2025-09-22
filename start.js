#!/usr/bin/env node

// Alternative start script for Replit deployment
// This bypasses the missing package.json start script

import { exec } from 'child_process';

console.log('🚀 Starting FlightAI Flight Search App...');

// Run the server using tsx
const serverProcess = exec('tsx server/index.ts', {
  stdio: 'inherit',
  env: { ...process.env }
});

serverProcess.stdout?.on('data', (data) => {
  console.log(data.toString());
});

serverProcess.stderr?.on('data', (data) => {
  console.error(data.toString());
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  serverProcess.kill('SIGINT');
});