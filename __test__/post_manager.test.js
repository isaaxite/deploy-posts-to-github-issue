import { describe, test, expect } from '@jest/globals';
import { PostManager } from '../lib/post_manager.js';
import { TempPost } from './utils/index.js';
import { force_create_a_issue_and_then_update_it } from './test_cases/post_manager.js';

const OWNER = 'isaaxite';
const REPO = 'test-repo_deploy-posts-to-github-issue';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const getPostManagerIns = () => new PostManager({
  owner: OWNER,
  repo: REPO,
  token: GITHUB_TOKEN
});

describe('post_manager', () => {
  const expextBaseResp = (ret) => {
    expect(ret).not.toBeUndefined();
    expect(ret.status).toBeGreaterThanOrEqual(200);
    expect(ret.status).toBeLessThan(300);
  };

  test('force create a issue and then update it', async () => {
    await force_create_a_issue_and_then_update_it({
      forceCreate(ret) {
        expextBaseResp(ret);
        expect(ret).toHaveProperty('data');
        expect(ret.data).toHaveProperty('number');
        expect(ret.data.number).toBeGreaterThan(0);
      },
      update(updateRet, updateTitle) {
        expextBaseResp(updateRet);
        expect(updateRet).toHaveProperty('data');
        expect(updateRet.data).toHaveProperty('title');
        expect(updateRet.data.title).toStrictEqual(updateTitle);
      }
    });
  }, 10000);

  test.todo('update fail');

  test.todo('get a post by issue_numer');

  test.todo('check post is exist by issue_number or create one');

  test.todo('update by waste issue_number and create it');
});
