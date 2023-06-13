import { Octokit } from 'octokit'

console.info(process.env.GITHUB_TOKEN)

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

(async function main() {

  const resp = await octokit.rest.issues.get({
    owner: 'isaaxite',
    repo: 'blog',
    issue_number: '305'
  });

  console.info(resp.data)
})()
