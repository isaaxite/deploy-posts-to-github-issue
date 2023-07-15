import path from 'path';
import prompts from 'prompts';
import { describe, expect, test } from '@jest/globals';
import { PostFinder } from '../lib/post_finder.js';
import { detectOnly, getTimestampKey } from './utils/index.js';
import { ensureFileSync, ensureDirSync, removeSync } from 'fs-extra/esm';
import { postPath } from '../lib/post_path.js';
import { copyFileSync } from 'fs';
import { AtLeastPropError, CtorParamDataObjectError, DirNotExistError, InvalidPatternListError, NonEmptyError, NonEmptyStringError, NonEmptyStringItemArrayError, NonEmptyStringOrNonEmptyStringItemArrayError, TruthNaturalNumError } from '../lib/utils/error.js';

describe('Class PostFinder, init instance', () => {
  test.each(detectOnly([
    {
      name: 'init with empty',
      param: undefined,
      expectErr: new CtorParamDataObjectError()
    },
    {
      // only: true,
      name: 'init with wrong-object whithout patterns or sourceDir',
      param: { any: 0 },
      expectErr: new AtLeastPropError('param.patterns, param.sourceDir')
    },
    {
      // only: true,
      name: 'init with non-array patterns',
      param: { patterns: 0 },
      expectErr: new NonEmptyStringItemArrayError('patterns')
    },
    {
      // only: true,
      name: 'init with empty-array patterns',
      param: { patterns: [] },
      expectErr: new NonEmptyStringItemArrayError('patterns')
    },
    {
      // only: true,
      name: 'init with array patterns but include empty item',
      param: { patterns: [''] },
      expectErr: new NonEmptyStringItemArrayError('patterns')
    },
    {
      // only: true,
      name: 'init with array patterns but include non-string item',
      param: { patterns: [0] },
      expectErr: new NonEmptyStringItemArrayError('patterns')
    },
    {
      // only: true,
      name: 'init with array patterns but all invalid item',
      param: { patterns: ['/not_exist_dir', '/not_exist_dir/*'] },
      expectErr: new InvalidPatternListError(['/not_exist_dir', '/not_exist_dir/*'])
    },
    {
      // only: true,
      name: 'init with non-string sourceDir',
      param: { sourceDir: 0 },
      expectErr: new NonEmptyStringError(['sourceDir'])
    },
    {
      // only: true,
      name: 'init with not-exist sourceDir',
      param: { sourceDir: '/not_exist_dir' },
      expectErr: new DirNotExistError(`sourceDir(/not_exist_dir)`)
    },
    {
      // only: true,
      name: 'init with sourceDir and non-string, non-string-array filename ',
      param: {
        sourceDir: '__test__/source',
        filename: 0,
        postTitleSeat: 0
      },
      expectErr: new NonEmptyStringOrNonEmptyStringItemArrayError('filename')
    },
    {
      // only: true,
      name: 'init with sourceDir and empty-array filename ',
      param: {
        sourceDir: '__test__/source',
        filename: [],
        postTitleSeat: 0
      },
      expectErr: new NonEmptyStringOrNonEmptyStringItemArrayError('filename')
    },
    {
      // only: true,
      name: 'init with sourceDir, filename and undefined postTitleSeat',
      param: {
        sourceDir: '__test__/source',
        filename: ['postname'],
        postTitleSeat: undefined
      },
      expectErr: new NonEmptyError('postTitleSeat')
    },
    {
      // only: true,
      name: 'init with sourceDir, filename and decimal postTitleSeat',
      param: {
        sourceDir: '__test__/source',
        filename: ['postname'],
        postTitleSeat: 1.1
      },
      expectErr: new TruthNaturalNumError('postTitleSeat')
    },
    {
      // only: true,
      name: 'init with sourceDir, filename and postTitleSeat of negative number',
      param: {
        sourceDir: '__test__/source',
        filename: ['postname'],
        postTitleSeat: -1
      },
      expectErr: new TruthNaturalNumError('postTitleSeat')
    }
  ]))('$name, it will emit err', ({ param, expectErr }) => {
    try {
      new PostFinder(param);
    } catch (error) {
      // console.info(error)
      expect(error.message).toEqual(expectErr.message);
    }
  });

  test('init with unexpected ext', () => {
    const ext = 'html';
    const ins = new PostFinder({
      sourceDir: '__test__/source',
      ext
    });

    expect(ins.ext).not.toBe(ext);
    expect(ins.ext).toEqual('md');
  });

  test.each(detectOnly([
    {
      // only: true,
      name: 'source, filename, postTitleSeat, ext',
      param: {
        sourceDir: '__test__/source',
        postTitleSeat: 0,
        filename: 'post_name',
        ext: 'md'
      }
    },
    {
      // only: true,
      name: 'patterns',
      param: {
        patterns: ['__test__/source/*']
      }
    }
  ]))('init with right param that $name', ({ param }) => {
    new PostFinder(param);
  });
});

describe('Class PostFinder', () => {
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
      params: { postTitleSeat: 0, sourceDir: '__test__/source/', filename: "WSL的hosts文件被重置", ext: 'md' }
    },
    { 
      name: 'sourceDir and filename', 
      params: { postTitleSeat: 0, sourceDir: '__test__/source/', filename: "WSL的hosts文件被重置" }
    },
    {
      name: 'filename include multiple path',
      params: { postTitleSeat: 0, sourceDir: '__test__/source/', filename: "/source/WSL的hosts文件被重置" }
    },
    {
      name: 'filename include multiple path and ext',
      params: { postTitleSeat: 0, sourceDir: '__test__/source/', filename: "/source/WSL的hosts文件被重置.html" }
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
    const filename = ["WSL的hosts文件被重置", 'license'];
    const finder = new PostFinder({
      sourceDir: '__test__/source/',
      filename,
      postTitleSeat: 0
    });
    const destFilepaths = finder.getFilepaths();
    expect(destFilepaths).toEqual(
      expect.arrayContaining(filename.map(it => `__test__/source/${it}.md`))
    );
  });

  test('init PostFinder with patterns', () => {
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

  test('init PostFinder with err ext', () => {
    const postFinder1 = new PostFinder({
      sourceDir: '__test__/source',
      ext: 'html'
    });

    expect(postFinder1.ext).toEqual('md');
  });

  test('find with filename and diffence postTitleSeat', () => {
    const sourceDir = '__test__/temp/postTitleSeat';
    const timestampKey = `post_title_${getTimestampKey()}`;
    const items = [
      {
        path: `${sourceDir}/${timestampKey}.md`,
        postTitleSeat: 0
      },
      {
        path: `${sourceDir}/${timestampKey}/${getTimestampKey()}.md`,
        postTitleSeat: 1
      },
      {
        path: `${sourceDir}/${timestampKey}/${getTimestampKey()}/${getTimestampKey()}.md`,
        postTitleSeat: 2
      }
    ];

    for (const it of items) {
      ensureFileSync(it.path);
    }

    for (const it of items) {
      const postFinder = new PostFinder({
        sourceDir,
        filename: timestampKey,
        postTitleSeat: it.postTitleSeat
      });

      const filepaths = postFinder.getFilepaths();
      expect(filepaths.length).toEqual(1);
      expect(filepaths[0]).toEqual(it.path);
    }
    removeSync(sourceDir);
  });

  test('method test, selectpost', async () => {
    const timestampKey = getTimestampKey();
    const postname = 'license.md';
    const sourceDir = `__test__/temp/source_${timestampKey}`;
    const postFilepath = path.join(sourceDir, postname);
    const confpath = '__test__/assets/isubo.conf.yml';
    const getIns = () => new PostFinder({
      postTitleSeat: 0,
      sourceDir
    });

    ensureDirSync(sourceDir);
    copyFileSync(`__test__/source/${postname}`, postFilepath);

    postPath.setConfBy({ confpath });
    prompts.inject(['__ALL__']);
    const ins = getIns();
    const choices = await ins.selectPosts();
    expect(choices).toEqual(expect.arrayContaining([postFilepath]));

    prompts.inject([[postFilepath]]);
    const ins2 = getIns();
    const choices2 = await ins2.selectPosts();
    expect(choices2).toEqual(expect.arrayContaining([postFilepath]));

    removeSync(sourceDir);
  });
});
