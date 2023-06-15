import path from 'path';
import { describe, expect, test } from '@jest/globals';
import { PostFinder } from '../lib/post_finder.js';

describe('post_finder', () => {
  test('glob all matched fileoath', () => {
    const finder = new PostFinder({
      patterns: ['__test__/temp/source/_posts/**/*.md']
    });

    const ret = finder.getFilepaths();

    expect(ret).not.toBeUndefined();
  });

  test.each([
    {
      name: 'postDir, filename and ext', 
      params: { postDir: '__test__/temp/source/', filename: 'NexT添加文章置顶feat', ext: 'md' }
    },
    { 
      name: 'postDir and filename', 
      params: { postDir: '__test__/temp/source/', filename: 'NexT添加文章置顶feat' }
    },
    {
      name: 'filename include multiple path',
      params: { postDir: '__test__/temp/source/', filename: '/source/_posts/NexT添加文章置顶feat' }
    },
    {
      name: 'filename include multiple path and ext',
      params: { postDir: '__test__/temp/source/', filename: '/source/_posts/NexT添加文章置顶feat.html' }
    },
    {
      name: 'only postDir',
      params: { postDir: '__test__/temp/source/' }
    },
  ])('glob a matched file whit $name', ({ params }) => {
    const finder = new PostFinder({
      ...params
    });

    if (params.filename) {
      const filepath = finder.getFilepaths().pop();
      const ext = path.extname(params.filename);
      const readFilename = ext
        ? path.basename(params.filename).replace(ext, '')
        : path.basename(params.filename);
      expect(filepath).toEqual(`__test__/temp/source/_posts/${readFilename}.md`)
    } else {
      const filepaths = finder.getFilepaths();
      const isDescendant = filepaths.every(it => it.startsWith('__test__/temp/source/'));
      const isValidExt = filepaths.every(it => path.extname(it) === '.md');

      expect(isDescendant).toBeTruthy();
      expect(isValidExt).toBeTruthy();
    }
  });

  test('todo: check PostFinder params', () => {})
});