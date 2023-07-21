import { describe, test } from '@jest/globals';
import { postPath } from "../lib/post_path.js";
import { updateConfFileSync } from './utils/index.js';
import { copySync, removeSync } from 'fs-extra/esm';
import { expect } from '@jest/globals';
import { AtLeastPropError, DataObjectError, FileNotExistError, NonEmptyStringError } from '../lib/utils/error.js';
import { ConfReader } from '../lib/conf_reader.js';

describe('Class PostPathParse, method test', () => {
  test('parse before init, it will emit err', () => {
    const postname = 'license';
    const postpath = `__test__/source/${postname}.md`;

    try {
      postPath.parse(postpath).postTitle;
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.message).toEqual('Pleace set confpath');
    }
  });

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

  test.each([
    {
      name: 'non-object',
      params: [
        function(){}, () => {}, 1, [], true,
        {}, undefined, null, 0, '', false
      ],
      expectErr: new DataObjectError('argv')
    },
    {
      name: 'object but without conf or confpath',
      params: [
        { any: 0 },
        { conf: undefined },
        { confpath: undefined },
        { conf: undefined, confpath: undefined }
      ],
      expectErr: new AtLeastPropError('confpath, conf')
    },
    {
      name: 'conf non-object',
      params: [
        { conf: function() {} },
        { conf: () => {} },
        { conf: 0 },
        { conf: 1 },
        { conf: [] },
        { conf: true },
        { conf: {} },
        { conf: null },
        { conf: '' },
        { conf: false }
      ],
      expectErr: new DataObjectError('conf')
    },
    {
      name: 'confpath non-empty-string',
      params: [
        { confpath: function() {} },
        { confpath: () => {} },
        { confpath: 0 },
        { confpath: 1 },
        { confpath: [] },
        { confpath: true },
        { confpath: {} },
        { confpath: null },
        { confpath: '' },
        { confpath: false }
      ],
      expectErr: new NonEmptyStringError('confpath')
    },
    {
      name: 'confpath not exist',
      params: [
        { confpath: '/not_exist_file.yml' }
      ],
      expectErr: new FileNotExistError('/not_exist_file.yml')
    },
  ])('setConfBy $name. It will emit err', ({params, expectErr}) => {
    for (const param of params) {
      try {
        postPath.setConfBy(param);
      } catch (error) {
        expect(error.message).toEqual(expectErr.message);
      }
    }
  });

  test.each([
    {
      name: 'non-object',
      params: [
        function(){}, () => {}, 1, [], true,
        {}, null, 0, '', false
      ],
      expectErr: new DataObjectError('conf')
    }
  ])('init $name. It will emit err', ({params, expectErr}) => {
    for (const param of params) {
      try {
        postPath.init(param);
      } catch (error) {
        expect(error.message).toEqual(expectErr.message);
      }
    }
  });

  test('setConfBy and init right data that conf or confpath, it will be passed', () => {
    const confpath = '__test__/assets/isubo.conf.yml';
    const confReader = new ConfReader({ path: confpath });
    const postname = 'license';
    const postFilepath = `__test__/source/${postname}.md`;

    postPath.init(confReader.get());
    expect(postPath.parse(postFilepath).postTitle).toEqual(postname);

    postPath.setConfBy({
      conf: confReader.get()
    });
    expect(postPath.parse(postFilepath).postTitle).toEqual(postname);

    postPath.setConfBy({ confpath });
    expect(postPath.parse(postFilepath).postTitle).toEqual(postname);
  });
});
