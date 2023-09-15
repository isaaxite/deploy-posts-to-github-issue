import path from 'path';
import { describe, test, expect } from '@jest/globals';
import { ConfReader } from '../lib/conf_reader.js';
import { copySync, removeSync } from 'fs-extra/esm';
import { load as loadYaml, dump as yamlDump } from 'js-yaml';
import { writeFileSync, readFileSync } from 'fs';
import { FileNotExistError, NonEmptyStringError } from '../lib/utils/error.js';
import { isFunction } from '../lib/utils/common.js';
import { enumPushAssetType } from '../lib/constants/enum.js';

describe('Class ConfReader init', () => {
  test('init with not exist conf path', () => {
    const confPath = '__test__/temp/not_exist_conf_path.conf.yml';
    try {
      new ConfReader({ path: confPath });
    } catch (error) {
      // console.info(`errMsg: ${error.message}`);
      expect(error.message).toEqual(
        new FileNotExistError(confPath).message
      );
    }
  });

  test.each([
    {
      name: 'init with non-string or empty string param.path',
      params: [
        function() {},
        () => {},
        undefined, 0, false, '',
        {}, { any: 0 },
        { path: undefined },
        { path: 0 },
        { path: false },
        { path: '' },
        { path: undefined },
        { path: function(){} },
        { path: () => {} }
      ],
      expectErr: new NonEmptyStringError('param.path')
    }
  ])('$name. It will emit err', ({ params, expectErr }) => {
    for (const param of params) {
      try {
        new ConfReader(param);
      } catch (error) {
        expect(error.message).toEqual(expectErr.message);
      }
    }
  });

  test('init with conf path of wrong ext', () => {
    const CONF_PATH = '__test__/assets/isubo.conf.yml';
    const confPath = `__test__/temp/isubo.conf_${String(Date.now()).slice(2)}.xml`;
    const exts = new ConfReader({ path: CONF_PATH }).exts;
    copySync(CONF_PATH, confPath)
    try {
      new ConfReader({
        path: confPath
      });
    } catch (error) {
      // console.info(`errMsg: ${error.message}`);
      expect(error.message).toEqual(`Only supports ${exts.map(it => `[${it}]`).join(', ')} files`);
    }
    removeSync(confPath);
  });
});

describe('Class ConfReader method test', () => {
  const CONF_PATH = '__test__/assets/isubo.conf.yml';
  test('read conf', () => {
    const confReader = new ConfReader({ path: CONF_PATH });
    const conf = confReader.get();

    expect(conf).not.toBeUndefined();
    expect(conf).toHaveProperty('source_dir');
    expect(conf).toHaveProperty('owner');
    expect(conf).toHaveProperty('repo');
    expect(conf).toHaveProperty('token', process.env.GITHUB_TOKEN); 
  });

  test('read object link_prefix conf', () => {
    const destPath = `__test__/temp/isubo.conf.${String(Date.now()).slice(2)}.yml`;
    copySync(CONF_PATH, destPath);
    const preConf = loadYaml(readFileSync(destPath));
    preConf.link_prefix = {
      owner: preConf.owner,
      repo: preConf.repo,
      branch: 'master',
      dir: 'source/'
    };
    writeFileSync(destPath, yamlDump(preConf));
    // console.log(yamlDump(preConf))

    const confReader = new ConfReader({ path: destPath });
    const conf = confReader.get();
    expect(conf.link_prefix).toEqual('https://raw.githubusercontent.com/isaaxite/test-repo_deploy-posts-to-github-issue/master/source/')

    removeSync(destPath);
  });

  test('default link_prefix', () => {
    const destPath = `__test__/temp/isubo.conf.${String(Date.now()).slice(2)}.yml`;
    copySync(CONF_PATH, destPath);
    const preConf = loadYaml(readFileSync(destPath));
    preConf.link_prefix = '';
    writeFileSync(destPath, yamlDump(preConf));
    const confReader = new ConfReader({ path: destPath });
    const conf = confReader.get();
    // console.log(conf)
    expect(conf.link_prefix).toEqual('https://raw.githubusercontent.com/isaaxite/test-repo_deploy-posts-to-github-issue/master/__test__/source/')

    removeSync(destPath);
  });

  test.each([
    {
      name: 'statement branch',
      preConf: { branch: 'master' },
      expectConf: { branch: 'master' }
    },
    {
      name: 'default branch',
      preConf: { branch: '' },
      expectConf: { branch: 'main' }
    },
    {
      name: 'statement source_dir',
      preConf: { source_dir: 'source/_posts' },
      expectConf: { source_dir: 'source/_posts' }
    },
    {
      name: 'default source_dir',
      preConf: { source_dir: '' },
      expectConf: { source_dir: 'source' }
    },
    {
      name: 'default source_dir',
      expectConf: {
        absolute_source_dir({ conf }) {
          return conf.absolute_source_dir === path.resolve(conf.source_dir);
        }
      }
    },
    {
      name: 'statement link_prefix',
      preConf: { link_prefix: 'https://isaaxite.github.io/blog/resources/' },
      expectConf: { link_prefix: 'https://isaaxite.github.io/blog/resources/' }
    },
    {
      name: 'default link_prefix',
      expectConf: {
        link_prefix({ conf }) {
          const {
            owner,
            repo,
            branch,
            source_dir
          } = conf;
          return conf.link_prefix === `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${source_dir}`;
        }
      }
    },
    {
      name: 'statement types',
      preConf: { types: ['link'] },
      expectConf: {
        types({ conf }) {
          expect(conf.types.length).toEqual(1);
          return conf.types[0] === 'link';
        }
      }
    },
    {
      name: 'default types',
      expectConf: {
        types({ conf }) {
          expect(conf.types.length).toEqual(1);
          return conf.types[0] === 'image';
        }
      }
    },
    {
      name: 'statement push_asset',
      preConf: { push_asset: enumPushAssetType.PROMPT },
      expectConf: { push_asset: enumPushAssetType.PROMPT }
    },
    {
      name: 'default push_asset',
      expectConf: {
        push_asset({ conf }) {
          expect(conf.types.length).toEqual(1);
          return Array.from(Object.values(enumPushAssetType)).includes(conf.push_asset);
        }
      }
    },
    {
      name: 'wrong push_asset',
      preConf: { push_asset: -1 },
      expectConf: {
        push_asset({ conf }) {
          expect(conf.types.length).toEqual(1);
          return Array.from(Object.values(enumPushAssetType)).includes(conf.push_asset);
        }
      }
    },
    {
      name: 'statement hide_frontmatter',
      preConf: { hide_frontmatter: true },
      expectConf: { hide_frontmatter: true }
    },
    {
      name: 'default hide_frontmatter',
      expectConf: {
        hide_frontmatter({ conf }) {
          return conf.hide_frontmatter === true;
        }
      }
    },
    {
      name: 'statement post_title_seat',
      preConf: { post_title_seat: 1 },
      expectConf: { post_title_seat: 1 }
    },
    {
      name: 'wrong post_title_seat',
      preConf: { post_title_seat: -1 },
      expectConf: { post_title_seat: 0 }
    },
    {
      name: 'default post_title_seat',
      expectConf: {
        post_title_seat({ conf }) {
          return conf.post_title_seat === 0;
        }
      }
    },
  ])('format conf, $name', ({ preConf, expectConf }) => {
    const srcConfPath = '__test__/assets/isubo.conf.yml';
    let lastPreConf = loadYaml(readFileSync(srcConfPath, 'utf8'));
    lastPreConf = {
      ...lastPreConf,
      ...(preConf || {})
    };
    const dest = `__test__/temp/isubo.conf_${String(Math.random()).slice(2)}.yml`;
    writeFileSync(dest, yamlDump(lastPreConf));

    const confReader = new ConfReader({ path: dest });
    const conf = confReader.get();
    
    for (const [key, value] of Object.entries(expectConf)) {
      if (isFunction(value)) {
        const ret = value({ conf, expectConf });
        expect(ret).toBeTruthy();
      } else {
        expect(value).toEqual(conf[key])
      }
    }
    removeSync(dest);
  });

  test.each([
    {
      name: 'empty owner',
      preConf: { owner: '' },
      expectErr: new NonEmptyStringError('conf.owner')
    },
    {
      name: 'empty repo',
      preConf: { repo: '' },
      expectErr: new NonEmptyStringError('conf.repo')
    },
    {
      name: 'empty token',
      preConf: { token: '' },
      expectErr: new NonEmptyStringError('conf.token')
    }
  ])('$name.It will emit err', ({preConf, expectErr}) => {
    try {
      const srcConfPath = '__test__/assets/isubo.conf.yml';
      let lastPreConf = loadYaml(readFileSync(srcConfPath, 'utf8'));
      lastPreConf = {
        ...lastPreConf,
        ...(preConf || {})
      };
      const dest = `__test__/temp/isubo.conf_${String(Math.random()).slice(2)}.yml`;
      writeFileSync(dest, yamlDump(lastPreConf));
  
      const confReader = new ConfReader({ path: dest });
      confReader.get();
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.message).toEqual(expectErr.message);
    }
  });
});
