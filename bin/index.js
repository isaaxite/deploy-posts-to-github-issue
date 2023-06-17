#!/usr/bin/env node

import yargs from 'yargs'

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
    function handler(argv) {
      console.log(111, argv)
    }
  )
  .command('update <posts>', 'Update only those posts that have issue_number', () => {}, (argv) => {
    console.info(argv)
  })
  .command('create <posts>', 'Mandatory creation, although the article contains issue_number', () => {}, (argv) => {
    console.info(argv)
  })
  .example([
    ['$0 publish "How to use license"', 'publish a post name "How to use license"'],
    ['$0 publish "How to use license","What is git"', 'publish several posts']
  ])
  .demandCommand(1, 'You need at least one command before moving on')
  .parse()
