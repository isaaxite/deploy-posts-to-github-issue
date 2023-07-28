import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import chalk from 'chalk';
import { execSync } from 'child_process';

const pkgJson= JSON.parse(fs.readFileSync('package.json', 'utf8'));
const {
  version
} = pkgJson;

const PUBLISH_CWD = 'dist';

const enumPublishTagType = {
  BETA: 'beta',
  ALPHA: 'alpha',
  LATEST: 'latest'
};

async function selectTag() {
  const choices = Object.values(enumPublishTagType).map(tag => ({
    title: tag,
    value: tag
  }));
  const tag = (await prompts({
    type: 'select',
    name: 'value',
    message: `${chalk.greenBright('The current version is')} ${chalk.bgWhite(chalk.black(` ${version} `))}`,
    choices
  })).value;

  return tag;
}

function excludepRrops(src, ...keys) {
  const ret = {};
  for (const [key, val] of Object.entries(src)) {
    if (!keys.includes(key)) {
      ret[key] = val;
    }
  }
  return ret;
}

function deleteScripts() {
  let distPkg = pkgJson;
  const distPkgPath = path.join(PUBLISH_CWD, 'package.json');
  let shouldUpdate = false;

  if (!fs.existsSync(distPkgPath)) {
    throw new Error(`✖ ${chalk.redBright(`${distPkgPath} not exist!`)}`);
  }

  if (pkgJson?.scripts?.prepare) {
    distPkg = {
      ...pkgJson,
      scripts: excludepRrops(
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

function execPublishCmd(tag) {
  const fullCmd = `npm publish --tag ${tag}`;
  console.info(`✔ ${chalk.greenBright(`${fullCmd}\n`)}`);

  deleteScripts(); 

  execSync(fullCmd, {
    stdio: 'inherit',
    cwd: PUBLISH_CWD
  });
}

function loginIf() {
  const isLogin = !!execSync(`npm whoami`, {
    encoding: 'utf8'
  });
  if (!isLogin) {
    execSync('npm login', { stdio: 'inherit' });
  }
}

async function main() {
  try {
    if (!fs.existsSync(PUBLISH_CWD)) {
      console.info(`✖ ${chalk.redBright(`${PUBLISH_CWD} missing build artifacts!`)}`);
      return;
    }
    loginIf();
    const tag = await selectTag();
    execPublishCmd(tag);
  } catch (error) {
    console.info(`✖ ${chalk.redBright(error.message)}`);
  }
}

await main();
