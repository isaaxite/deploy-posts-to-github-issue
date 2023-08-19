import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const conf = {
  pkgJsonPath: './package.json',
  distDirPath: './dist'
};

function streamlog(text) {
  process.stderr.write(text + '\n');
}

function getPkgData() {
  const ret = JSON.parse(fs.readFileSync(conf.pkgJsonPath, 'utf8'));
  return ret;
}

function excludeProps(src, ...keys) {
  const ret = {};
  for (const [key, val] of Object.entries(src)) {
    if (!keys.includes(key)) {
      ret[key] = val;
    }
  }
  return ret;
}

export function deleteScripts() {
  const pkgJson = getPkgData();
  let distPkg = pkgJson;
  const PUBLISH_CWD = conf.distDirPath;
  const distPkgPath = path.join(PUBLISH_CWD, 'package.json');
  let shouldUpdate = false;

  if (!fs.existsSync(distPkgPath)) {
    throw new Error(`${distPkgPath} not exist!`);
  }

  if (pkgJson?.scripts) {
    distPkg = {
      ...pkgJson,
      scripts: excludeProps(
        pkgJson.scripts,
        'build',
        'prepare',
        'publish',
        'postversion'
      )
    };

    shouldUpdate = true;
  }

  if (shouldUpdate) {
    fs.writeFileSync(distPkgPath, JSON.stringify(distPkg, null, 2));
  }
}

function main() {
  let cmd = `rm -rf dist && npx rollup -c rollup.config.js && sed -i '1i#!/usr/bin/env node' dist/bin/index.js`;
  streamlog(cmd);

  execSync(cmd, {
    stdio: 'inherit',
    shell: true
  });

  deleteScripts();

  cmd = 'du -sh dist';
  streamlog('\n' + cmd);

  execSync(cmd, {
    stdio: 'inherit',
    shell: true
  });

  process.exit(0);
}

main();
