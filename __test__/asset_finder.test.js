import { describe, test, expect } from '@jest/globals';
import { existsSync } from 'fs';
import { multiLevelSearchForResources, parse_a_md_file_and_find_nonrelative_path_asset } from './test_cases/asset_finder.js';

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
});
