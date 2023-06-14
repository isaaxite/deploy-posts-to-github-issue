import { describe, test, expect } from '@jest/globals';
import { IssueBro } from '../lib/issue_bro.js';
import { copyFileSync, unlinkSync } from 'fs';
import path from 'path';
import { PostParse } from '../lib/post_parse.js';

const OWNER = 'isaaxite';
const REPO = 'test-repo_deploy-posts-to-github-issue';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const POST_MD_SRC_PATH = '__test__/post1.md';

class TempFile {
  #post = null;
  src = POST_MD_SRC_PATH;
  dest = '';
  constructor({ dest }) {
    this.dest = this.#tempjoin(dest);
    copyFileSync(this.src, this.dest);

    this.#post = new PostParse({
      path: this.dest,
      conf: {
        dir: 'license',
        prefix: 'https://isaaxite.github.io/blog/resources/license/',
        types: ['image']
      }
    });
  }
  #tempjoin(rest) {
    return path.resolve('__test__/temp', rest); 
  }
  getContent() {
    return this.#post.getFormatedMarkdown();
  }
  getFrontmatter() {
    return this.#post.getFrontmatter();
  }
  destory() {
    unlinkSync(this.dest);
  }
}

const getIssueBroIns = () => new IssueBro({
  owner: OWNER,
  repo: REPO,
  token: GITHUB_TOKEN
});

describe('issue_pro', () => {

  test('force crate a issue', async () => {
    const tempFile = new TempFile({ dest: 'post1-force_create_a_issue.md' });
    const mdtext = tempFile.getContent();
    const {
      title,
      tags
    } = tempFile.getFrontmatter();
    const issuebro = getIssueBroIns();
    const ret = await issuebro.forceCreate({
      title,
      body: mdtext,
      labels: tags
    });

    expect(ret).not.toBeUndefined();
    expect(ret.status).toBeGreaterThanOrEqual(200);
    expect(ret.status).toBeLessThan(300);
    expect(ret).toHaveProperty('data');
    expect(ret.data).toHaveProperty('number');
    expect(ret.data.number).toBeGreaterThan(0);

    tempFile.destory();
  });

});
