import path from "path";
import { describe, test, expect } from '@jest/globals';
import { Isubo } from '../index.js';
import { TempRepo, sleepFactory } from './utils/index.js';
import { PostParse } from '../lib/post_parse.js';
import { enumPushAssetType } from "../lib/constants/enum.js";
import { create_a_post_but_disable_push_assets, create_posts, create_posts_without_assets, deploy_emit_err_by_hook, update_one_post, write_to_clipboard } from "./test_cases/isubo.js";
import { AtLeastPropError, CtorParamDataObjectError, DataObjectError } from "../lib/utils/error.js";
import prompts from "prompts";

import "./utils/msw.jest.js";

describe('Class Isubo, init instance', () => {
  test.each([
    {
      name: 'init with empty',
      params: [undefined],
      expectErr: new CtorParamDataObjectError()
    },
    {
      name: 'init with undefined conf data',
      params: [
        { conf: undefined }
      ],
      expectErr: new AtLeastPropError('conf, confPath')
    },
    {
      name: 'init with non-object or empty-object conf data',
      params: [
        { conf: '' },
        { conf: null },
        { conf: 0 },
        { conf: 1 },
        { conf: [] },
        { conf: {} }
      ],
      expectErr: new DataObjectError('conf')
    },
    {
      name: 'init with non-object or empty-object cliParams data',
      params: [
        '', 0, 1, null, [], {}
      ].map(wrongCliParams => ({
        confPath: '__test__/assets/isubo.conf.yml',
        cliParams: wrongCliParams
      })),
      expectErr: new DataObjectError('cliParams')
    }
  ])('$name. It with emit err', ({ params, expectErr }) => {
    for (const param of params) {
      try {
        new Isubo(param);
      } catch (error) {
        expect(error.message).toEqual(expectErr.message);
      }
    }
  });
});


describe('Class Isubo, method test', () => {
  sleepFactory(test.each([
    {
      name: 'disable push assets',
      push_asset: enumPushAssetType.DISABLE
    },
    {
      name: 'auto push assets',
      push_asset: enumPushAssetType.AUTO
    },
    {
      name: 'prompts to confirm if push assets',
      push_asset: enumPushAssetType.PROMPT,
      injectFunc: () => prompts.inject(true)
    }
  ]))('create posts, $name', async ({ push_asset, injectFunc }) => {
    injectFunc && injectFunc();
    const retArr = await create_posts({ push_asset });
    for (const { ret, frontmatter } of retArr) {
      expect(ret.data.number).toEqual(frontmatter.issue_number);
    }
  }, 60 * 1000);

  sleepFactory(test)('create a post but disable push assets', async () => {
    const ret = await create_a_post_but_disable_push_assets();
    expect(ret).not.toBeUndefined();
    expect(ret.status).toBeGreaterThanOrEqual(200);
    expect(ret.status).toBeLessThan(300);
  }, 60 * 1000);

  sleepFactory(test.each([
    {
      name: 'disable push assets',
      push_asset: enumPushAssetType.DISABLE
    },
    {
      name: 'auto push assets',
      push_asset: enumPushAssetType.AUTO
    },
    {
      name: 'prompts to confirm if push assets',
      push_asset: enumPushAssetType.PROMPT,
      injectFunc: () => prompts.inject([true])
    }
  ]))('create posts without assets, $name', async ({ push_asset, injectFunc }) => {
    injectFunc && injectFunc();
    const retArr = await create_posts_without_assets({ push_asset });
    for (const { ret, frontmatter } of retArr) {
      expect(ret.data.number).toEqual(frontmatter.issue_number);
    }
  }, 60 * 1000);

  test('deploy_emit_err_by_hook', async () => {
    await deploy_emit_err_by_hook();
  });

  sleepFactory(test)('update one post', async () => {
    const ret = await update_one_post();
    expect(ret).not.toBeUndefined();
    expect(ret.status).toBeGreaterThanOrEqual(200);
    expect(ret.status).toBeLessThan(300);
  }, 60 * 1000);

  sleepFactory(test)(`publish posts, according post's issue_number`, async () => {
    const issue_number = 58;
    const tempRepo = new TempRepo();
    tempRepo.copy((preConf) => ({
      ...preConf,
      source_dir: tempRepo.tempSourceDir,
      push_asset: enumPushAssetType.DISABLE
    }));
    const conf = tempRepo.conf;
    const postParse = new PostParse({
      path: path.join(tempRepo.tempSourceDir, 'license.md'),
      conf
    });
    postParse.injectFrontmatter({
      issue_number
    });
    const isubo = new Isubo({
      conf,
      cliParams: {
        filename: ['license', "WSL的hosts文件被重置"]
      }
    });
    await isubo.publish();
  }, 60 * 1000);

  test('write to clipboard', async () => {
    const {
      destPostContent,
      formatedPostContent,
    } = await write_to_clipboard();

    expect(formatedPostContent).toEqual(destPostContent);
  });
});
