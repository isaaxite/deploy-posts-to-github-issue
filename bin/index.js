#!/usr/bin/env node

import yargs from 'yargs';
import figlet from 'figlet';
import chalk from 'chalk';
import { Isubo } from '../index.js';
import { hinter } from '../lib/hinter.js';
import { init as initConf } from '@isubo-org/init-conf';

const KEY_POSTS = 'posts';
function formatArgv(argv) {
  const cliParams = {
    filename: argv[KEY_POSTS] ? argv.posts.split(',') : undefined,
    onlyPrint: !!argv.onlyPrint,
    disableBack2top: !!argv.disableBack2top,
    disableToc: !!argv.disableToc
  };

  return cliParams;
}
function getIsuboIns(argv) {
  const cliParams = formatArgv(argv);
  return new Isubo({
    selectPosts: !argv[KEY_POSTS],
    cliParams,
    confPath: 'isubo.conf.yml',
  });
}
function logo() {
  const logoStr = Array.from('isubo').join('');
  const print = (val) => hinter.streamlog(chalk.blueBright(val));
  try {
    print(figlet.textSync(logoStr, 'Slant'));
  } catch (error) { /* empty */ }
}

async function wraper(cb) {
  try {
    logo();
    await cb();
  } catch (error) {
    hinter.errMsg(error.message);
  }
  process.exit(0);
}

export const cmder = yargs(process.argv.slice(2))
  .usage(
    `$0 [cmd] [${KEY_POSTS}]`,
    'Exec default cmd: \'isubo publish\' to select posts for publishing.',
    (lastYargs) => lastYargs
      .positional('cmd', {
        describe: 'Isubo cmds include \'publish\', \'create\', \'update\'.Default is \'publish\'.',
        type: 'string',
      })
      .positional('posts', {
        describe: 'post name, one or several, use comma to split several post names.',
        type: 'string',
      }),
    async (argv) => {
      wraper(async () => {
        const isubo = getIsuboIns(argv);
        await isubo.publish();
      });
    },
  )
  .command({
    command: `publish [${KEY_POSTS}]`,
    describe: 'Determin whether to create or update the posts base on issue_number',
    async handler(argv) {
      wraper(async () => {
        const isubo = getIsuboIns(argv);
        await isubo.update();
      });
    },
  })
  .command({
    command: `update [${KEY_POSTS}]`,
    describe: 'Update only those posts that have issue_number',
    async handler(argv) {
      wraper(async () => {
        const isubo = getIsuboIns(argv);
        await isubo.update();
      });
    },
  })
  .command({
    command: `create [${KEY_POSTS}]`,
    describe: 'Mandatory creation, although the article contains issue_number',
    async handler(argv) {
      wraper(async () => {
        const isubo = getIsuboIns(argv);
        await isubo.create();
      });
    },
  })
  .command({
    command: 'init-conf',
    describe: 'Initialize the configuration file (isubo.conf.yml) in the current directory',
    async handler() {
      await initConf();
      process.exit(0);
    },
  })
  .command({
    command: 'clipboard',
    describe: 'Writing the formatted markdown text to the clipboard',
    builder(nestedYargs) {
      return nestedYargs
        .option('print', {
          alias: 'p',
          default: false,
          type: 'boolean',
          describe: 'Printing the formatted markdown text to the console'
        })
    },
    handler(argv) {
      wraper(async () => {
        const isubo = getIsuboIns(argv);
        await isubo.writeToClipboard({ print: argv.print });
      });
    }
  })
  .option('disable-back2top', {
    default: false,
    type: 'boolean',
    describe: 'Disable the inserting of the back-to-top button'
  })
  .option('disable-toc', {
    default: false,
    type: 'boolean',
    describe: 'Disable the inserting of the toc'
  })
  .example([
    ['$0', 'Select posts by prompt for publishing'],
    ['$0 publish | create | update', 'Select posts by prompt'],
    ['$0 publish "How to use license"', 'publish a post name "How to use license"'],
    ['$0 publish "How to use license","What is git"', 'publish several posts'],
  ])
  .demandCommand(0);

cmder.parse();
