import { IssueBro } from '../lib/issue_bro.js';
import { readFileSync } from 'fs';
import { PostParse } from '../lib/post_parse.js';



(async function main() {

  const issue = new IssueBro({
    owner: 'isaaxite',
    repo: 'deploy-posts-to-github-issue',
    token: process.env.GITHUB_TOKEN
  });

  const post = new PostParse({
    path: '__test__/post1.md',
    conf: {
      dir: 'license',
      prefix: 'https://isaaxite.github.io/blog/resources/license/',
      types: ['image']
    }
  });
  const frontmatter = post.getFrontmatter();
  const markdown = post.getFormatedMarkdown();

  // const resp = await issue.create({
  //   title: frontmatter.title,
  //   labels: frontmatter.tags,
  //   body: markdown
  // });

  const resp = await issue.update({
    title: frontmatter.title,
    labels: frontmatter.tags,
    body: markdown,
    issue_number: frontmatter.issue_number
  });

  console.info(resp)
})()
