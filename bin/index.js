#!/usr/bin/env node

import yargs from 'yargs';
import { Isubo } from '../index.js';
import { ConfReader } from '../lib/conf_reader.js';

yargs(process.argv.slice(2))
  .usage(
    '$0 publish <posts>',
    'Determin whether to create or update the posts base on issue_number',
    function builder(yargs) {
      return yargs.positional('posts', {
        describe: 'post name, one or several, use comma to split several post names',
        type: 'string'
      })
    },
    async function handler(argv) {
      const isubo = getIsuboIns(argv);
      await isubo.publish();
      process.exit(0);
    }
  )
  .command({
    command: 'update <posts>',
    describe: 'Update only those posts that have issue_number',
    async handler(argv) {
      const isubo = getIsuboIns(argv);
      await isubo.update();
      process.exit(0);
    }
  })
  .command({
    command: 'create <posts>',
    describe: 'Mandatory creation, although the article contains issue_number',
    async handler(argv) {
      const isubo = getIsuboIns(argv);
      await isubo.create();
      process.exit(0);
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
  .demandCommand(2, 'You need at least one command before moving on')
  .parse()

function getIsuboIns(argv) {
  const cliParams = formatArgv(argv);
  return new Isubo({
    cliParams,
    confPath: 'isubo.conf.yml'
  });
}

function formatArgv(argv) {
  const cliParams = {
    filename: argv.posts.split(',')
  };

  return cliParams;
}