import { describe, test, expect } from '@jest/globals';
import { detectOnly, sleepFactory } from './utils/index.js';
import { force_create_a_issue_and_then_update_it, getPostManagerIns, update_a_post_without_issue_number } from './test_cases/post_manager.js';
import { CtorParamDataObjectError, DataObjectError, NonEmptyStringError, NonEmptyStringItemArrayError, TruthPositiveIntError } from '../lib/utils/error.js';
import { PostManager } from '../lib/post_manager.js';

import "./utils/msw.jest.js";

describe('Class PostManager, instance init', () => {
  test.each(detectOnly([
    {
      // only: true,
      name: 'init with empty',
      param: undefined,
      expectErr: new CtorParamDataObjectError()
    },
    {
      // only: true,
      name: 'init with empty owner',
      param: { owner: '' },
      expectErr: new NonEmptyStringError('owner')
    },
    {
      name: 'init with non-string owner',
      param: { owner: 0 },
      expectErr: new NonEmptyStringError('owner')
    },
    {
      name: 'init with empty repo',
      param: { owner: 'owner' },
      expectErr: new NonEmptyStringError('repo')
    },
    {
      name: 'init with non-string repo',
      param: { owner: 'owner', repo: 0 },
      expectErr: new NonEmptyStringError('repo')
    },
    {
      name: 'init with empty token',
      param: { owner: 'owner', repo: 'repo'  },
      expectErr: new NonEmptyStringError('token')
    },
    {
      name: 'init with non-string token',
      param: { owner: 'owner', repo: 'repo', token: 'token'  },
      expectErr: new NonEmptyStringError('token')
    }
  ]))('$name, it will emit err', ({ param, expectErr }) => {
    try {
      new PostManager(param);
    } catch (error) {
      expect(expectErr.message).toEqual(error.message);
    }
  });

  test('init with right data type param, it will pass', () => {
    new PostManager({ 
      owner: 'owner',
      repo: 'repo',
      token: 'token'
    });
  });
});

describe('Class PostManager, method test', () => {
  const expextBaseResp = (ret) => {
    expect(ret).not.toBeUndefined();
    expect(ret.status).toBeGreaterThanOrEqual(200);
    expect(ret.status).toBeLessThan(300);
  };

  sleepFactory(test)('force create a issue and then update it', async () => {
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
  }, 30 * 1000);

  sleepFactory(test)('force create a issue and then update it', async () => {
    try {
      await update_a_post_without_issue_number(); 
    } catch (error) {
      expect(
        new TruthPositiveIntError('params.issue_number').message
      ).toEqual(error.message);
    }
  }, 30 * 1000);

  test.each(detectOnly([
    {
      // only: true,
      name: 'use empty params',
      param: undefined,
      method: 'update',
      expectErr: new TruthPositiveIntError('params.issue_number')
    },
    {
      // only: true,
      name: 'use empty params',
      param: undefined,
      method: 'forceCreate',
      expectErr: new DataObjectError('params')
    },
    {
      // only: true,
      name: 'use non-object params',
      param: { any: 1 },
      method: 'forceCreate',
      expectErr: new NonEmptyStringError('params.title')
    },
    {
      // only: true,
      name: 'use params that non-string title',
      param: { title: 1 },
      method: 'forceCreate',
      expectErr: new NonEmptyStringError('params.title')
    },
    {
      // only: true,
      name: 'use params that empty-string title',
      param: { title: '' },
      method: 'forceCreate',
      expectErr: new NonEmptyStringError('params.title')
    },
    {
      // only: true,
      name: 'use params without body',
      param: { title: 'title' },
      method: 'forceCreate',
      expectErr: new NonEmptyStringError('params.body')
    },
    {
      // only: true,
      name: 'use params that empty-string body',
      param: { title: 'title', body: '' },
      method: 'forceCreate',
      expectErr: new NonEmptyStringError('params.body')
    },
    {
      // only: true,
      name: 'use params that non-string body',
      param: { title: 'title', body: 0 },
      method: 'forceCreate',
      expectErr: new NonEmptyStringError('params.body')
    },
    {
      // only: true,
      name: 'use params that non-array labels',
      param: { title: 'title', body: 'body', labels: 0 },
      method: 'forceCreate',
      expectErr: new NonEmptyStringItemArrayError('params.labels')
    },
    {
      // only: true,
      name: 'use params that non-string-array labels',
      param: { title: 'title', body: 'body', labels: [0] },
      method: 'forceCreate',
      expectErr: new NonEmptyStringItemArrayError('params.labels')
    },
    {
      // only: true,
      name: 'use params that string-array labels include empty item',
      param: { title: 'title', body: 'body', labels: ['label-1', ''] },
      method: 'forceCreate',
      expectErr: new NonEmptyStringItemArrayError('params.labels')
    }
  ]))('invoked $method method, $name that will emit err', async ({
    method,
    param,
    expectErr
  }) => {
    try {
      const postManager = getPostManagerIns();
      await postManager[method](param);
    } catch (error) {
      expect(error.message).toEqual(expectErr.message);
    }
  });

  test.todo('update fail');

  test.todo('get a post by issue_numer');

  test.todo('check post is exist by issue_number or create one');

  test.todo('update by waste issue_number and create it');
});
