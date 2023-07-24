import path from 'path';
import { describe, test, expect } from '@jest/globals';
import { existsSync } from 'fs';
import { asset_is_outside_the_source_dir, multiLevelSearchForResources, parse_a_md_file_and_find_nonrelative_path_asset } from './test_cases/asset_finder.js';
import { AssetFinder } from '../lib/asset_finder.js';
import { CtorParamDataObjectError, DirNotExistError, FileNotExistError, NonEmptyStringError } from '../lib/utils/error.js';
import { getTimestampKey } from './utils/index.js';
import { copySync, ensureDirSync, ensureFileSync, removeSync } from 'fs-extra/esm';

describe('Class AssetFinder', () => {
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

  test('asset is outside the source_dir', () => {
    const ret = asset_is_outside_the_source_dir();
    expect(ret).toEqual('');
  });

  test.each([
    {
      param: undefined,
      name: 'init with undefined will emit err',
      getExpect: () => new CtorParamDataObjectError().message
    },
    {
      param: {},
      name: 'init with empty object will emit err',
      getExpect: () => new CtorParamDataObjectError().message
    },
    {
      param: { postpath: '' },
      name: 'init with empty str for param.postpath will emit err',
      getExpect: () => new NonEmptyStringError('postpath').message
    },
    {
      param: { postpath: '__test__/temp/not_exist.md' },
      name: 'init with not exist path for param.postpath will emit err',
      getExpect: ({ param }) => new FileNotExistError(param.postpath).message
    },
    {
      param: { postpath: '__test__/source/license.md' },
      name: 'init with not exist path for param.postpath will emit err',
      getExpect: () => new NonEmptyStringError('assetPath').message
    },
    {
      param: {
        postpath: '__test__/source/license.md',
        assetPath: 'license/9720a0afdb60d23b31b3a667ad6e70a2.png'
      },
      name: 'init with not exist path for param.postpath will emit err',
      getExpect: () => new NonEmptyStringError('sourceDirPath').message,
    },
    {
      param: {
        postpath: '__test__/source/license.md',
        assetPath: 'license/9720a0afdb60d23b31b3a667ad6e70a2.png',
        sourceDirPath: '__test__/not_exist_source/'
      },
      name: 'init with not-exist sourceDirPath',
      getExpect: ({ param }) => new DirNotExistError(param.sourceDirPath).message,
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
      // console.info(`errMsg: ${error.message}`);
      expect(error.message).toEqual(getExpect({ param }));
    }
  })
});
