import fs from 'fs';
import prompts from 'prompts';
import chalk from 'chalk';
import { execSync } from 'child_process';

const {
  version
} = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease | from-git]

const enumSingleNonRCmd = {
  BETA: 'beta',
  ALPHA: 'alpha'
};

const enumSingleRCmd = {
  MAJOR: 'major',
  MINOR: 'minor',
  PATCH: 'patch'
};

const enumMultpleNonRCmd = {
  BETA_MAJOR: 'beta-major',
  BETA_MINOR: 'beta-minor',
  BETA_PATCH: 'beta-patch',
  ALPHA_MAJOR: 'alpha-major',
  ALPHA_MINOR: 'alpha-minor',
  ALPHA_PATCH: 'alpha-patch'
}

const enumCmd = {
  ...enumSingleNonRCmd,
  ...enumSingleRCmd,
  ...enumMultpleNonRCmd
};

function increase(publishTag) {
  const verCharArr = version.split(`${publishTag}.`);
  const newTagNum = Number(verCharArr[1]) + 1;
  const newVersionTxt = `${verCharArr[0]}${publishTag}.${newTagNum}`;
  const cmd = `npm version ${newVersionTxt} --preid=${publishTag}`;
  return cmd;
}

function execmdSync(fullCmd) {
  if (!fullCmd) {
    console.info(`\n✖ ${chalk.yellowBright(`Invalid cmd`)}`)
    return;
  }
  console.info(`✔ ${chalk.greenBright(`${fullCmd}\n`)}`);
  execSync(fullCmd, {
    stdio: 'inherit'
  });

  execSync(`npm run build`, {
    stdio: 'inherit'
  });
}

function execSingleNonRCmd(cmd) {

  let fullCmd = '';
  if (version.includes(cmd)) {
    fullCmd = increase(cmd);
  }
  execmdSync(fullCmd);
}

function execSingleRCmd(cmd) {
  const fullCmd = `npm version ${cmd}`;
  execmdSync(fullCmd);
}

function execMultpleNonRCmd(cmds) {
  const [preid, cmd] = cmds.split('-');

  const fullCmd = `npm version pre${cmd} --preid=${preid}`;
  execmdSync(fullCmd);
}

async function selectCmd() {
  const choices = Object.values(enumCmd).map(cmd => ({
    title: cmd,
    value: cmd
  }));
  const cmd = (await prompts({
    type: 'autocomplete',
    name: 'value',
    message: `${chalk.greenBright('The current version is')} ${chalk.bgWhite(chalk.black(` ${version} `))}`,
    choices: choices
  })).value;

  return cmd;
}

async function main() {
  const cmd = await selectCmd();
  switch(cmd) {
    case enumCmd.ALPHA:
    case enumCmd.BETA:
      execSingleNonRCmd(cmd);
      break;
    case enumCmd.MAJOR:
    case enumCmd.MINOR:
    case enumCmd.PATCH:
      execSingleRCmd(cmd);
      break;
    case enumCmd.BETA_MAJOR:
    case enumCmd.BETA_MINOR:
    case enumCmd.BETA_PATCH:
    case enumCmd.ALPHA_MAJOR:
    case enumCmd.ALPHA_MINOR:
    case enumCmd.ALPHA_PATCH:
      execMultpleNonRCmd(cmd);
      break;
    default:
      // TODO
  }
}

await main();
