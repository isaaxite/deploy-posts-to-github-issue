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

  test('check PostFinder params is empty', () => {
    try {
      new PostFinder(); 
    } catch (error) {
      expect(error.message).toEqual('<patterns> or <sourceDir> must be provided');
    }
  });

  test('init PostFinder with patterns', () => {
    try {
      new PostFinder({
        patterns: 'Err Data Type'
      })
    } catch (error) {
      console.info(`errMsg: ${error.message}`);
      expect(error.message).toEqual('patterns must be Array<string>');
    }

    try {
      new PostFinder({
        patterns: ['__test__/test_err_dir/**/*.md']
      });
    } catch (error) {
      console.info(`errMsg: ${error.message}`);
      expect(error.message.startsWith('patterns invalid'));
    }

    const postFinder1 = new PostFinder({
      patterns: [
        '__test__/source/license_not_exist.md',
        '__test__/source/**/*.md',
        '__test__/test_err_dir/**/*.md'
      ]
    });

    expect(postFinder1.patterns).toEqual(expect.arrayContaining(['__test__/source/**/*.md']));

    const postFinder2 = new PostFinder({
      patterns: [
        '__test__/source/license.md'
      ]
    });
    const filepaths = postFinder2.getFilepaths();
    expect(filepaths).toEqual(expect.arrayContaining(['__test__/source/license.md']));
  });

  test('init PostFinder with not exist path of source dir', () => {
    const sourceDir = '__test__/source_not_exist';
    try {
      new PostFinder({
        sourceDir,
      }); 
    } catch (error) {
      console.info(`errMsg: ${error.message}`);
      expect(error.message).toEqual(`source dir(${sourceDir}) not exist`);
    }
  });

  test('init PostFinder with err ext', () => {
    const postFinder1 = new PostFinder({
      sourceDir: '__test__/source',
      ext: 'html'
    });

    expect(postFinder1.ext).toEqual('md');
  });
});
