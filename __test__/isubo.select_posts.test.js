import { describe, test, expect } from '@jest/globals'
import { enumPushAssetType } from "../lib/constants/enum.js";
import { create_posts_inject_select_posts } from "./test_cases/isubo.js";
import { sleepFactory } from "./utils/index.js";
import { Isubo } from '../index.js';
import prompts from 'prompts';

describe('Class Isubo', () => {
  sleepFactory(test.each([
    {
      name: 'disable push assets',
      push_asset: enumPushAssetType.DISABLE
    }
  ]))('create posts by select posts, $name', async ({ push_asset }) => {
    const retArr = await create_posts_inject_select_posts({ push_asset });
    for (const { ret, frontmatter } of retArr) {
      expect(ret.data.number).toEqual(frontmatter.issue_number);
    }
  }, 60 * 1000);

  sleepFactory(test.each([
    { name: 'publish' },
    { name: 'update' },
    { name: 'create' },
  ]))('$name but no selects', ({ name }) => {
    const ins = new Isubo({
      confPath: '__test__/assets/isubo.conf.yml',
      cliParams: { filename: undefined },
      selectPosts: true
    });

    const value = [];
    prompts.inject([value]);

    ins[name]();
  })
});
