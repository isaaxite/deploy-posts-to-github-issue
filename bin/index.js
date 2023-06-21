#!/usr/bin/env node

import yargs from 'yargs';
import { Isubo } from '../index.js';
import { ConfReader } from '../lib/conf_reader.js';
import { hinter } from '../lib/hinter.js';
import { AssetPublisher } from '../lib/asset_publisher.js';

const KEY_POSTS = 'posts';

yargs(process.argv.slice(2))
  .usage(
    `$0 publish [${KEY_POSTS}]`,
    'Determin whether to create or update the posts base on issue_number',
    function builder(yargs) {
      return yargs.positional('posts', {
        describe: 'post name, one or several, use comma to split several post names',
        type: 'string'
      })
    },
    async function handler(argv) {
      wraper(async () => {
        const isubo = getIsuboIns(argv);
        await isubo.publish();
      });
    }
  )
  .command({
    command: `update [${KEY_POSTS}]`,
    describe: 'Update only those posts that have issue_number',
    async handler(argv) {
      wraper(async () => {
        const isubo = getIsuboIns(argv);
        await isubo.update();
      });
    }
  })
  .command({
    command: `create [${KEY_POSTS}]`,
    describe: 'Mandatory creation, although the article contains issue_number',
    async handler(argv) {
      wraper(async () => {
        const isubo = getIsuboIns(argv);
        await isubo.create();
      });
    }
  })
  .command({
    command: 'init conf',
    describe: 'Initialize the configuration file (isubo.conf.yml) in the current directory',
    async handler() {
      ConfReader.initConf();
      process.exit(0);
    }
  })
  .example([
    ['$0 publish "How to use license"', 'publish a post name "How to use license"'],
    ['$0 publish "How to use license","What is git"', 'publish several posts']
  ])
  .demandCommand(0)
  // .demandCommand(2, 'You need at least one command before moving on')
  .parse()

function getIsuboIns(argv) {
  const cliParams = formatArgv(argv);
  return new Isubo({
    selectPosts: !argv[KEY_POSTS],
    cliParams,
    confPath: 'isubo.conf.yml'
  });
}

function formatArgv(argv) {
  const cliParams = {
    filename: argv[KEY_POSTS] ? argv.posts.split(',') : ''
  };

  return cliParams;
}

async function wraper(cb) {
  try {
    await AssetPublisher.push();
    // await cb();
  } catch (error) {
    hinter.errMsg(error.message);
  }
  process.exit(0);
}