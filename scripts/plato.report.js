import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const plugins = [
  '@babel/plugin-transform-optional-chaining',
  '@babel/plugin-transform-class-properties',
  '@babel/plugin-transform-private-property-in-object',
  '@babel/plugin-transform-private-methods',
].join(',');

const cmd = [
  'rm -rf temp/dist ./reports/plato',
  `npx babel ./bin ./lib --plugins ${plugins} --out-dir temp/dist`,
  'npx plato -r -d ./reports/plato ./temp/dist',
  'rm -rf temp/dist',
].join(' && ');

process.stderr.write(`${cmd}\n`);

execSync(cmd, {
  stdio: 'inherit',
  shell: true,
});
