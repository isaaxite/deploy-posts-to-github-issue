import path from 'path';
import { writeFileSync } from 'fs';
import { describe, test, expect } from '@jest/globals';
import { PostParse } from '../lib/post_parse.js';
import { ConfReader } from '../lib/conf_reader.js';
import { PostFinder } from '../lib/post_finder.js';
import { TempRepo, copyTempPost, detectOnly, removeTempPost } from './utils/index.js';
import { readdirSync, write, writeSync } from 'fs';
import { empty_parse_conf, get_ast_from_empty_md_file, inject_yml_data_to_md_file_without_yml_data } from './test_cases/post_parse.js';
import { enumPushAssetType } from '../lib/constants/enum.js';
import { DEF_LINK_TYPE_LIST } from '../lib/constants/index.js';
import { removeSync } from 'fs-extra/esm';

const TEST_CASE_FRONTMATTER = `---
title: LICENSE的选择与生成
date: 2023-05-30 16:50:28
tags:
- 开发标准
- LICENSE
issue_number: 1
---`;
const TEST_CASE_MARKDOWN_EN_PIC = TEST_CASE_FRONTMATTER + `
# Overview

![image](./license/pic.png)
`;

const TEST_CASE_MARKDOWN_CN_PIC = TEST_CASE_FRONTMATTER + `
# Overview

![image](./license/图片.png)
`;

const TEST_CASE_MARKDOWN_CN_ENCODE_PIC = TEST_CASE_FRONTMATTER + `
# Overview

![image](./license/%E5%9B%BE%E7%89%87.png)
`;

const DEF_TEST_INPUT_MD_PATH = '__test__/assets/post1.md';

const getConf = ({ link_prefix, types } = {}) => ({
  link_prefix: link_prefix || 'https://isaaxite.github.io/blog/resources/',
  types: types || ['image'],
  disable_asset_find: true
});

const getPostIns = ({ path, markdownText, conf } = {}) => new PostParse({
  path,
  markdownText,
  conf: conf || getConf()
});

describe('post_parse', () => {
  test.each(detectOnly([
    { 
      name: 'use path to get frontmatter:all props:',
      post: new PostParse({
        path: DEF_TEST_INPUT_MD_PATH,
        conf: getConf()
      }),
      // only: true
    },
    {
      name: 'input marddown text to get frontmatter:all props:',
      post: new PostParse({
        markdownText: TEST_CASE_FRONTMATTER,
        conf: getConf()
      })
    }
  ]))('$name', ({ post }) => {
    const ret = post.getFrontmatter();

    expect(ret).toHaveProperty('title');
    expect(ret).toHaveProperty('tags');
    expect(ret).toHaveProperty('issue_number');

    const {
      title,
      tags,
      issue_number
    } = ret;
    expect(title).toStrictEqual('LICENSE的选择与生成');
    expect(tags.length).not.toBeUndefined();
    expect((tags || []).length).toBeGreaterThan(0);
    expect(issue_number).not.toBeUndefined();
  });

  test('use inputMarkdownText to get ast', () => {
    const post = getPostIns({ markdownText: TEST_CASE_MARKDOWN_EN_PIC });
    const ret = post.getAst();
    
    expect(ret).not.toBeUndefined();
    expect(ret).toHaveProperty('type', 'root');
    expect(ret).toHaveProperty('children');
    expect(ret.children).not.toBeUndefined();
    expect(ret.children.length).toBeGreaterThan(0);
  });

  test('method:getInputMarkdown', () => {
    const post1 = getPostIns({ markdownText: TEST_CASE_MARKDOWN_EN_PIC });
    const post2 = getPostIns({ path: DEF_TEST_INPUT_MD_PATH });

    const ret1 = post1.getInputMarkdown();
    const ret2 = post2.getInputMarkdown();

    expect(ret1).not.toBeUndefined();
    expect(ret2).not.toBeUndefined();
  });

  test('method:getFormatedMarkdown', () => {
    const post1 = getPostIns({ markdownText: TEST_CASE_MARKDOWN_EN_PIC });
    const ret1 = post1.getFormatedMarkdown();

    expect(ret1).not.toBeUndefined();
  });

  test.each(detectOnly([
    {
      name: 'en image link',
      markdownText: TEST_CASE_MARKDOWN_EN_PIC,
      expectedLink: 'https://isaaxite.github.io/blog/resources/license/pic.png',
      // only: true
    },
    {
      name: 'cn image link',
      markdownText: TEST_CASE_MARKDOWN_CN_PIC,
      expectedLink: 'https://isaaxite.github.io/blog/resources/license/图片.png',
      conf: getConf()
    },
    {
      name: 'cn(uriencode) image link',
      markdownText: TEST_CASE_MARKDOWN_CN_ENCODE_PIC,
      expectedLink: 'https://isaaxite.github.io/blog/resources/license/图片.png',
      conf: getConf()
    }
  ]))('test formated $name', ({ markdownText, expectedLink, conf, disable })=> {
    if (disable) {
      return;
    }
    const lastConf = conf || getConf();
    const post1 = getPostIns({ markdownText, conf: lastConf });
    const ret1 = post1.getFormatedMarkdown();
    const findImage = (ast) => {
      let ret = '';
    
      if (ast.type === 'image') {
        return ast;
      }

      if (!ast.children) {
        return;
      }

      for (const it of ast.children) {
        const itRet = findImage(it);
        if (itRet) {
          ret = itRet;
          break;
        }
      }

      return ret;
    };

    expect(ret1).not.toBeUndefined();

    const post2 = getPostIns({ markdownText: ret1 });
    const ast2 = post2.getAst();
    const imgAst = findImage(ast2);

    expect(imgAst.url).not.toBeUndefined();
    expect(decodeURIComponent(imgAst.url)).toStrictEqual(expectedLink);
  });

  test('detect asset paths of a post', () => {
    const tempRepo = new TempRepo();
    tempRepo.copy();

    const mdtxtPath = tempRepo.resolveFromSourceDir('license.md');
    const postParse = new PostParse({
      path: mdtxtPath,
      conf: tempRepo.conf
    });
    const licenseDirPath = path.join(tempRepo.tempSourceDir, 'license');
    const assetpathsInLicenseDir = readdirSync(licenseDirPath).map(fname => path.join(licenseDirPath, fname));

    tempRepo.remove();
    expect(postParse.assetPathsRelativeRepoArr).toEqual(
      expect.arrayContaining(assetpathsInLicenseDir)
    );
  });

  test('empty parse conf', () => {
    try {
      empty_parse_conf() 
    } catch (error) {
      expect(error.message).toEqual('owner is required');
    }

    try {
      empty_parse_conf({
        owner: 'isaaxite'
      });
    } catch (error) {
      expect(error.message).toEqual('repo is required');
    }

    try {
      empty_parse_conf({
        owner: 'isaaxite',
        repo: 'test-repo_deploy-posts-to-github-issue'
      });
    } catch (error) {
      expect(error.message).toEqual('token is required');
    }

    const preConf = {
      owner: 'isaaxite',
      repo: 'test-repo_deploy-posts-to-github-issue',
      token: process.env.GITHUB_TOKEN
    };
    const defConf = empty_parse_conf(preConf);
    expect(defConf.owner).toEqual(preConf.owner);
    expect(defConf.repo).toEqual(preConf.repo);
    expect(defConf.token).toEqual(preConf.token);
    expect(defConf.branch).toEqual('main');
    expect(defConf.source_dir).toEqual('source');
    expect(defConf.absolute_source_dir).toEqual(path.resolve('source'));
    expect(defConf.link_prefix).toEqual(`https://raw.githubusercontent.com/${preConf.owner}/${preConf.repo}/main/source`);
    expect(defConf.types).toEqual(expect.arrayContaining(['image']));
    expect(defConf.push_asset).toEqual(enumPushAssetType.IDLE);
  });

  test.todo('parse conf: if exist sep');
  test.todo('parse empty markdownTxt');
  test.todo('parse empty md file');
  test.todo('parse md file without yml data');

  test('inject yml data to md file without yml data', () => {
    inject_yml_data_to_md_file_without_yml_data(({ settingIssueNum, gettingIssueNum }) => {
      expect(gettingIssueNum).toEqual(settingIssueNum);
    })
  });

  test('get ast from empty md file, rootAst.children will be a empty Array', () => {
    get_ast_from_empty_md_file((ast) => {
      expect(ast).toHaveProperty('children', []);
    });
  });

  test('get formated mdtxt from empty md file', () => {
    const filepath = '__test__/temp/empty.md';
    writeFileSync(filepath, '');
    const postParse = new PostParse({
      path: filepath,
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        absolute_source_dir: path.resolve('source'),
        types: ['non-enumLinkType']
      }
    });
    removeSync(filepath)

    const ret = postParse.getFormatedMarkdown();
    expect(ret).toBe('');
  });

  test('get frontmatter from empty md file', () => {
    const filepath = '__test__/temp/empty.md';
    writeFileSync(filepath, '');
    const postParse = new PostParse({
      path: filepath,
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        absolute_source_dir: path.resolve('source'),
        types: ['non-enumLinkType']
      }
    });
    removeSync(filepath)

    const ret = postParse.getFrontmatter();
    expect(ret).toHaveProperty('title', '');
    expect(ret).toHaveProperty('tags', []);
    expect(ret).toHaveProperty('issue_number', 0);
  });

  test.only.each(detectOnly([{
    name: 'provide right param include markdownText exclude filepath',
    param: {
      markdownText: TEST_CASE_MARKDOWN_EN_PIC,
      conf: getConf()
    }
  }, {
    name: 'provide right param include filepath exclude markdownText',
    param: {
      path: '__test__/source/license.md',
      conf: getConf()
    }
  }, {
    name: 'provide nothing will emit err',
    param: undefined,
    getExpect: () => 'Constructor param must be non-empty Object'
  }, {
    name: 'init with {}, it will emit err',
    param: {},
    getExpect: () => 'Constructor param must be non-empty Object'
  }, {
    name: 'init with only conf, it will emit err',
    param: {
      conf: getConf()
    },
    getExpect: () => 'Must provide <markdownText> or <path>'
  }, {
    name: 'init with empty conf, it will emit err',
    param: {
      markdownText: TEST_CASE_MARKDOWN_EN_PIC,
      conf: {}
    },
    getExpect: () => 'conf must be a non-empty Object'
  }, {
    name: 'init with empty str of conf.link_prefix, it will emit err',
    param: {
      markdownText: TEST_CASE_MARKDOWN_EN_PIC,
      conf: {
        link_prefix: ''
      }
    },
    getExpect: () => 'conf.link_prefix must be a non-empty String'
  }, {
    name: 'init with non-str of conf.link_prefix, it will emit err',
    param: {
      markdownText: TEST_CASE_MARKDOWN_EN_PIC,
      conf: {
        link_prefix: {}
      }
    },
    getExpect: () => 'conf.link_prefix must be a non-empty String'
  }, {
    name: 'init with empty-str of conf.absolute_source_dir, it will emit err',
    param: {
      path: '__test__/source/license.md',
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        absolute_source_dir: ''
      }
    },
    getExpect: () => 'conf.absolute_source_dir must be a non-empty String'
  }, {
    name: 'init with non-str of conf.absolute_source_dir, it will emit err',
    param: {
      path: '__test__/source/license.md',
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        absolute_source_dir: {}
      }
    },
    getExpect: () => 'conf.absolute_source_dir must be a non-empty String'
  }, {
    name: 'init with empty-array of conf.types, it will emit err',
    param: {
      path: '__test__/source/license.md',
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        absolute_source_dir: path.resolve('__test__/source'),
        types: []
      }
    },
    getExpect: () => 'conf.types must be a non-empty Array'
  }, {
    name: 'init with undefined of conf.types, it will use def types and pass',
    param: {
      path: '__test__/source/license.md',
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        absolute_source_dir: path.resolve('__test__/source'),
        types: undefined
      }
    },
    getExpect: ({ ins }) => expect(ins.linkTypes).toEqual(expect.arrayContaining(DEF_LINK_TYPE_LIST))
  }, {
    name: 'init with non-array of conf.types, it will emit err',
    param: {
      path: '__test__/source/license.md',
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        absolute_source_dir: path.resolve('__test__/source'),
        types: {}
      }
    },
    getExpect: () => 'conf.types must be a Array'
  }, {
    name: 'init with empty-array of conf.types, it will use def types and pass',
    param: {
      path: '__test__/source/license.md',
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        absolute_source_dir: path.resolve('__test__/source'),
        types: []
      }
    },
    getExpect: ({ ins }) => expect(ins.linkTypes).toEqual(expect.arrayContaining(DEF_LINK_TYPE_LIST))
  }, {
    name: 'init with conf.types include non-enumLinkType item, that item will be delate and pass',
    param: {
      path: '__test__/source/license.md',
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        absolute_source_dir: path.resolve('__test__/source'),
        types: [ ...DEF_LINK_TYPE_LIST, 'non-enumLinkType']
      }
    },
    getExpect: ({ ins }) => expect(ins.linkTypes).toEqual(expect.arrayContaining(DEF_LINK_TYPE_LIST))
  }, {
    name: 'init with conf.types filling non-enumLinkType item, it will use def types and pass',
    param: {
      path: '__test__/source/license.md',
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        absolute_source_dir: path.resolve('__test__/source'),
        types: ['non-enumLinkType']
      }
    },
    getExpect: ({ ins }) => expect(ins.linkTypes).toEqual(expect.arrayContaining(DEF_LINK_TYPE_LIST))
  }, {
    name: 'init with markdownText, conf.disable_asset_find will be set to true aumaticaly',
    param: {
      markdownText: TEST_CASE_MARKDOWN_EN_PIC,
      conf: {
        link_prefix: 'https://isaaxite.github.io/blog/resources/',
        types: undefined,
        disable_asset_find: false
      }
    },
    getExpect: ({ ins }) => expect(ins.disableAssetFind).toBeTruthy()
  }]))('PostParse Ctor param, $name', ({ param, getExpect }) => {
    try {
      const ins = new PostParse(param);
      getExpect ? getExpect({ param, ins }) : expect(ins instanceof PostParse);
    } catch (error) {
      console.info(`errMsg: ${error.message}`);
      expect(error.message).toEqual(getExpect({ param }));
    }
  })
});
