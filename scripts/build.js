import { execSync } from 'child_process';

function streamlog(text) {
  process.stderr.write(text + '\n');
}

let cmd = `rm -rf dist && npx rollup -c rollup.config.js && sed -i '1i#!/usr/bin/env node' dist/bin/index.js`;
streamlog(cmd);

execSync(cmd, {
  stdio: 'inherit',
  shell: true
});

cmd = 'du -sh dist';
streamlog('\n' + cmd);

execSync(cmd, {
  stdio: 'inherit',
  shell: true
});
