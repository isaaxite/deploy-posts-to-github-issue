import { describe, test, expect } from '@jest/globals';
import { existsSync } from 'fs';
import { multiLevelSearchForResources, parse_a_md_file_and_find_nonrelative_path_asset } from './test_cases/asset_finder.js';
import { AssetFinder } from '../lib/asset_finder.js';

describe('asset_finder', () => {
  test('multi-level search for resources', () => {
    multiLevelSearchForResources(({destPath, assetPath}) => {
      // console.info({
      //   destPath, assetPath
      // })
      expect(assetPath).toEqual(destPath);
    });
  });

  test('parse a md file, and find non-relative path asset', () => {
    parse_a_md_file_and_find_nonrelative_path_asset((assetPath) => {
      expect(existsSync(assetPath)).toBeTruthy();
    });
  });

  test.each([
    {
      param: undefined,
      name: 'init with undefined will emit err',
      getExpect: () => 'Constructor param must be object'
    },
    {
      param: {},
      name: 'init with empty object will emit err',
      getExpect: () => 'Constructor param must be object'
    },
    {
      param: { postpath: '' },
      name: 'init with empty str for param.postpath will emit err',
      getExpect: () => 'Must be provided non-empty string postpath'
    },
    {
      param: { postpath: '__test__/temp/not_exist.md' },
      name: 'init with not exist path for param.postpath will emit err',
      getExpect: ({ param }) => `postpath: ${param.postpath} not exist!`
    },
    {
      param: { postpath: '__test__/source/license.md' },
      name: 'init with not exist path for param.postpath will emit err',
      getExpect: () => `Must be provided non-empty string assetPath`
    },
    {
      param: {
        postpath: '__test__/source/license.md',
        assetPath: 'license/9720a0afdb60d23b31b3a667ad6e70a2.png'
      },
      name: 'init with not exist path for param.postpath will emit err',
      getExpect: () => `Must be provided non-empty string sourceDirPath`,
    },
    {
      param: {
        postpath: '__test__/source/license.md',
        assetPath: 'license/9720a0afdb60d23b31b3a667ad6e70a2.png',
        sourceDirPath: '__test__/source/'
      },
      name: 'init with right param object',
    }
  ])('AssetFinder ctor param, $name', ({ param, getExpect }) => {
    try {
      const ins = new AssetFinder(param);
      expect(ins instanceof AssetFinder).toBeTruthy();
    } catch (error) {
      console.info(`errMsg: ${error.message}`);
      expect(error.message).toEqual(getExpect({ param }));
    }
  })
});
