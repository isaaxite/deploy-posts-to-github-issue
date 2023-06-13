import { IssueBro } from '../lib/issue_bro.js';

(async function main() {

  const issue = new IssueBro({
    owner: 'isaaxite',
    repo: 'blog',
    token: process.env.GITHUB_TOKEN
  });

  // issue.create({
  //   title: 
  // })

  const data = await issue.get({ issue_number: '305' })

  console.info(data)
})()
