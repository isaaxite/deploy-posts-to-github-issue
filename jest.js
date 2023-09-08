#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
try {
  const prevCmd = [
    'node --experimental-vm-modules node_modules/jest/bin/jest.js',
    '--config=jest.dev.config.mjs',
    '--runInBand',
  ].join(' ');

  const cmd = [
    'npx jest --clearCache &&',
    prevCmd,
    ...args
  ].join(' ');

  console.info(cmd);
  execSync(cmd, {
    stdio: 'inherit'
  });
} catch (error) {}

deleteTemp();

function deleteTemp() {
  const supDir = '__test__/temp';
  const dirpathArr = fs.readdirSync(supDir)
    .filter(dirname => !['reports', '.cache'].includes(dirname))
    .map(dirname => path.join(supDir, dirname));

  if (dirpathArr.length) {
    for (const dirpath of dirpathArr) {
      execSync(`rm -rf ${dirpath}`);
    }
  }
}
