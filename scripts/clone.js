import path from 'path';
import { ensureDir } from 'fs-extra/esm';
import { execSync } from 'child_process';

const uniqueKey = String(Date.now()).slice(2);
const dirname = path.parse(process.cwd()).name;
const dest = `../temp/${dirname}_${uniqueKey}`;
const cmd = `cp -r ./ ${dest}`;

console.info(cmd);

ensureDir('../temp');

execSync(cmd, {
  stdio: 'inherit',
  shell: true
});

console.info(path.resolve(dest));


