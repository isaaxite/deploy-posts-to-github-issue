import fs from 'fs';
import prompts from 'prompts';
import chalk from 'chalk';
import { execSync } from 'child_process';

const {
  version
} = JSON.parse(fs.readFileSync('package.json', 'utf8'));

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

function execPublishCmd(tag) {
  const fullCmd = `npm publish --tag ${tag}`;
  console.info(`✔ ${chalk.greenBright(`${fullCmd}\n`)}`);
  execSync(fullCmd, {
    stdio: 'inherit',
    cwd: PUBLISH_CWD
  });
}

async function main() {
  try {
    if (!fs.existsSync(PUBLISH_CWD)) {
      console.info(`✖ ${chalk.redBright(`${PUBLISH_CWD} missing build artifacts!`)}`);
      return;
    }
    execSync('npm login', { stdio: 'inherit' });
    const tag = await selectTag();
    execPublishCmd(tag);
  } catch (error) {
  }
}

await main();
