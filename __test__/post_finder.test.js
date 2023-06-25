import path from 'path';
import { describe, expect, test } from '@jest/globals';
import { PostFinder } from '../lib/post_finder.js';

describe('post_finder', () => {
  test('glob all matched fileoath', () => {
    const finder = new PostFinder({
      patterns: ['__test__/source/**/*.md']
    });

    const ret = finder.getFilepaths();

    expect(ret).not.toBeUndefined();
  });

  test.each([
    {
      name: 'sourceDir, filename and ext', 
      params: { sourceDir: '__test__/source/', filename: 'WSL的hosts文件被重置', ext: 'md' }
    },
    { 
      name: 'sourceDir and filename', 
      params: { sourceDir: '__test__/source/', filename: 'WSL的hosts文件被重置' }
    },
    {
      name: 'filename include multiple path',
      params: { sourceDir: '__test__/source/', filename: '/source/WSL的hosts文件被重置' }
    },
    {
      name: 'filename include multiple path and ext',
      params: { sourceDir: '__test__/source/', filename: '/source/WSL的hosts文件被重置.html' }
    },
    {
      name: 'only sourceDir',
      params: { sourceDir: '__test__/source/' }
    },
  ])('glob a matched file with $name', ({ params }) => {
    const finder = new PostFinder({
      ...params
    });

    if (params.filename) {
      const filepath = finder.getFilepaths().pop();
      const ext = path.extname(params.filename);
      const readFilename = ext
        ? path.basename(params.filename).replace(ext, '')
        : path.basename(params.filename);
      expect(filepath).toEqual(`__test__/source/${readFilename}.md`)
    } else {
      const filepaths = finder.getFilepaths();
      const isDescendant = filepaths.every(it => it.startsWith('__test__/source/'));
      const isValidExt = filepaths.every(it => path.extname(it) === '.md');

      expect(isDescendant).toBeTruthy();
      expect(isValidExt).toBeTruthy();
    }
  });

  test('find with serveral filenames', () => {
    const filename = ['WSL的hosts文件被重置', 'license'];
    const finder = new PostFinder({
      sourceDir: '__test__/source/',
      filename
    });
    const destFilepaths = finder.getFilepaths();
    expect(destFilepaths).toEqual(
      expect.arrayContaining(filename.map(it => `__test__/source/${it}.md`))
    );
  });

  test('todo: check PostFinder params', () => {})
});
