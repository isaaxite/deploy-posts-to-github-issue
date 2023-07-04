import { describe, test } from '@jest/globals';
import { postPath } from "../lib/post_path.js";
import { updateConfFileSync } from './utils/index.js';
import { copySync, removeSync } from 'fs-extra/esm';
import { expect } from '@jest/globals';

describe('post path parse', () => {
  test('parse post title with conf.post_title_seat', () => {
    const items = [
      {
        path: '__test_/source/licese.md',
        post_title_seat: 0,
        postTitle: 'licese'
      },
      {
        path: '__test_/source/licese/index.md',
        post_title_seat: 1,
        postTitle: 'licese'
      },
    ];


    for (const it of items) {
      const tempConfPath = `__test__/temp/isubo.conf_${String(Date.now()).slice(2)}.yml`;
      copySync('__test__/assets/isubo.conf.yml', tempConfPath);
      updateConfFileSync(tempConfPath, (conf) => {
        conf.post_title_seat = it.post_title_seat;
        return conf;
      });
      postPath.setConfBy({ confpath: tempConfPath })
      const detail = postPath.parse(it.path);
      expect(detail.postTitle).toEqual(it.postTitle);
      removeSync(tempConfPath);
    }
  });
});
